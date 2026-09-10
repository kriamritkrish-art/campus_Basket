/**
 * =============================================================================
 *  CAMPUS BASKET — PAYMENT CONTROLLER
 * =============================================================================
 *
 *  Handles:
 *  1. POST /api/payments/verify       — Frontend callback payment verification
 *  2. POST /api/payments/webhook      — Razorpay server webhook (idempotent)
 *  3. GET  /api/payments/receipt/:num — Receipt retrieval
 *
 *  Security:
 *  - All financial decisions are server-side
 *  - Frontend is NEVER trusted for payment status
 *  - Webhook signature MUST be verified
 *  - Webhook events are idempotent (duplicate events are safely ignored)
 *  - Amount is verified before confirming any order
 *
 *  Standardized Payment Status values used here:
 *  - CAPTURED       → successfully captured (preferred for new payments)
 *  - AUTHORIZED     → authorized but not yet captured
 *  - FAILED         → payment failed
 *  - PENDING        → awaiting payment action
 *  - COD_PENDING    → COD order, cash not yet collected
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { RazorpayService } from '../services/payment/RazorpayService';
import { PaymentReconciliationService } from '../services/payment/PaymentReconciliationService';
import { ReceiptService } from '../services/receipt/ReceiptService';
import { IdGeneratorService } from '../utils/IdGeneratorService';

const razorpayService = new RazorpayService();
const receiptService = new ReceiptService();

export class PaymentController {
  /**
   * Verify Razorpay Payment Signature (Frontend Callback)
   *
   * Called by frontend after customer completes Razorpay checkout.
   * Performs server-side HMAC-SHA256 signature verification.
   * Updates the EXISTING order — never creates a new one.
   *
   * Idempotent: if payment already CAPTURED, returns success without re-processing.
   */
  public static async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        res.status(400).json({
          success: false,
          message: 'Missing required Razorpay credentials: razorpayOrderId, razorpayPaymentId, razorpaySignature'
        });
        return;
      }

      // Find the payment record linked to this Razorpay order
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId },
        include: { order: { include: { provider: true } }, laundryOrder: true }
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Payment record not found for this Razorpay Order ID'
        });
        return;
      }

      // Idempotency: already captured — return success without re-processing
      const alreadyCaptured = ['CAPTURED', 'SUCCESS', 'PAID'].includes(payment.status as string);
      if (alreadyCaptured && payment.razorpayPaymentId === razorpayPaymentId) {
        res.status(200).json({
          success: true,
          message: 'Payment already verified and captured.',
          alreadyProcessed: true
        });
        return;
      }

      // Cryptographic HMAC-SHA256 signature verification (server-side ONLY)
      const isValid = razorpayService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValid) {
        // Record failure with audit trail
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: 'Signature verification failed — potential tampering',
            reconciliationStatus: 'CUSTOMER_DEBIT_REVIEW'
          }
        });

        res.status(400).json({
          success: false,
          message: 'Payment signature verification failed. Transaction flagged. If your account was debited, please contact support.'
        });
        return;
      }

      // All checks passed — mark as CAPTURED and confirm order
      const capturedAt = new Date();

      await prisma.$transaction(async (tx) => {
        // 1. Update payment record
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'CAPTURED' as any,
            razorpayPaymentId,
            razorpaySignature,
            capturedAt,
            reconciliationStatus: 'NOT_REQUIRED' as any,
            reconciledAt: capturedAt,
            reconciledBy: 'FRONTEND_VERIFY'
          }
        });

        // 2. Record in PaymentTransaction for audit trail
        const txId = `verify_${razorpayPaymentId}`;
        const existingTx = await tx.paymentTransaction.findUnique({ where: { transactionId: txId } });
        if (!existingTx) {
          await tx.paymentTransaction.create({
            data: {
              paymentId: payment.id,
              transactionId: txId,
              provider: 'RAZORPAY',
              eventType: 'FRONTEND_VERIFY',
              payload: JSON.stringify({ razorpayOrderId, razorpayPaymentId }),
              status: 'CAPTURED'
            }
          });
        }

        // 3. Update Campus Basket Order
        if (payment.orderId) {
          const currentOrder = await tx.order.findUnique({
            where: { id: payment.orderId },
            include: { provider: true }
          });

          if (currentOrder) {
            const isCodWithAdvance = currentOrder.paymentMethod === 'CASH_ON_DELIVERY';
            const targetPaymentStatus: any = isCodWithAdvance ? 'COD_PENDING' : 'CAPTURED';
            let newOrderStatus: any = 'CONFIRMED';
            let autoAssignedRunnerId: string | null = null;

            // Auto-assign delivery if configured
            if (currentOrder.provider?.autoAssignDelivery) {
              const runner = await tx.deliveryBoy.findFirst({ where: { activeStatus: true } });
              if (runner) {
                autoAssignedRunnerId = runner.id;
                newOrderStatus = 'DELIVERY_ASSIGNED';
              }
            }

            const paymentNote = isCodWithAdvance
              ? `COD advance of ₹${payment.amount} captured via Razorpay. ID: ${razorpayPaymentId}. Remaining cash due at delivery.`
              : `Online payment captured. Razorpay ID: ${razorpayPaymentId}. Amount: ₹${payment.amount}`;

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                status: newOrderStatus,
                paymentStatus: targetPaymentStatus,
                reconciliationStatus: 'NOT_REQUIRED' as any,
                ...(autoAssignedRunnerId ? { deliveryBoyId: autoAssignedRunnerId } : {}),
                statusHistory: {
                  create: {
                    previousStatus: currentOrder.status,
                    newStatus: newOrderStatus,
                    changedBy: 'RAZORPAY_VERIFY',
                    notes: paymentNote
                  }
                }
              }
            });
          }
        }

        // 4. Update Laundry Order if applicable
        if (payment.laundryOrderId) {
          const laundryOrder = await tx.laundryOrder.findUnique({
            where: { id: payment.laundryOrderId }
          });

          if (laundryOrder) {
            const isCod = laundryOrder.paymentMethod === 'COD';
            await tx.laundryOrder.update({
              where: { id: payment.laundryOrderId },
              data: {
                paymentStatus: isCod ? 'PARTIAL' : 'PAID',
                onlinePaidAmount: Number(payment.amount),
                statusHistory: {
                  create: {
                    previousStatus: laundryOrder.status,
                    newStatus: laundryOrder.status,
                    changedBy: 'RAZORPAY_VERIFY',
                    notes: isCod
                      ? `Service charge ₹${payment.amount} captured. Remaining ₹${laundryOrder.codAmount} due in cash.`
                      : `Full payment ₹${payment.amount} captured. ID: ${razorpayPaymentId}`
                  }
                }
              }
            });
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified and order confirmed successfully.',
        capturedAt: capturedAt.toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Razorpay Webhook Handler
   *
   * Receives server-to-server events from Razorpay.
   * This is the PRIMARY fallback when the frontend callback fails.
   *
   * Events handled:
   * - payment.authorized   → set payment AUTHORIZED (not yet captured)
   * - payment.captured     → auto-reconcile → CAPTURED + CONFIRMED
   * - payment.failed       → set FAILED, keep order PENDING_PAYMENT
   * - order.paid           → same as payment.captured
   * - refund.created       → update refund status
   * - refund.processed     → finalize refund
   *
   * IDEMPOTENT: same event processed multiple times → only first has effect.
   */
  public static async webhook(req: Request, res: Response): Promise<void> {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'] as string;
    const eventId = req.headers['x-razorpay-event-id'] as string || `${req.body?.event}_${Date.now()}`;
    const eventType: string = req.body?.event || 'unknown';
    const payload = req.body?.payload;

    // 1. Verify webhook signature (MUST happen server-side)
    let signatureValid = true;
    if (signature) {
      signatureValid = razorpayService.verifyWebhookSignature(rawBody, signature);
      if (!signatureValid) {
        console.warn(`[Webhook] Invalid signature for event ${eventId}`);
        res.status(400).json({ status: 'Invalid signature' });
        return;
      }
    }

    // 2. Extract Razorpay IDs
    const razorpayPaymentId = payload?.payment?.entity?.id || payload?.refund?.entity?.payment_id;
    const razorpayOrderId = payload?.payment?.entity?.order_id || payload?.order?.entity?.id;

    // 3. Idempotency check + webhook log (via PaymentReconciliationService)
    try {
      const { isDuplicate } = await PaymentReconciliationService.processWebhookEvent({
        eventId,
        eventType,
        rawPayload: rawBody,
        razorpayOrderId,
        razorpayPaymentId,
        signatureValid
      });

      if (isDuplicate) {
        res.status(200).json({ status: 'ok', note: 'Already processed' });
        return;
      }
    } catch (logErr) {
      console.warn('[Webhook] Log creation failed (non-critical):', logErr);
    }

    // 4. Process the event
    try {
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        await PaymentController._handlePaymentCaptured(razorpayOrderId, razorpayPaymentId, payload, eventId);
      } else if (eventType === 'payment.authorized') {
        await PaymentController._handlePaymentAuthorized(razorpayOrderId, razorpayPaymentId, eventId);
      } else if (eventType === 'payment.failed') {
        await PaymentController._handlePaymentFailed(razorpayOrderId, razorpayPaymentId, payload, eventId);
      } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
        await PaymentController._handleRefundEvent(payload, eventType, eventId);
      }

      // Mark webhook as processed
      await PaymentReconciliationService.markWebhookProcessed(eventId, 'PROCESSED');

      res.status(200).json({ status: 'ok' });
    } catch (err) {
      console.error('[Webhook] Processing error:', err);
      await PaymentReconciliationService.markWebhookProcessed(eventId, 'FAILED', String(err));
      // Always return 200 to Razorpay to prevent retries for application errors
      res.status(200).json({ status: 'processing_error' });
    }
  }

  /** Handle payment.captured / order.paid webhook event */
  private static async _handlePaymentCaptured(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    payload: any,
    eventId: string
  ): Promise<void> {
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: { order: true }
    });

    if (!payment) {
      console.warn(`[Webhook] No payment found for Razorpay order ${razorpayOrderId}`);
      return;
    }

    // Idempotency: skip if already captured
    if (['CAPTURED', 'SUCCESS', 'PAID'].includes(payment.status as string)) {
      return;
    }

    // Amount verification
    const receivedAmountPaise = payload?.payment?.entity?.amount || 0;
    const receivedAmountRupees = receivedAmountPaise / 100;
    const expectedAmount = Number(payment.amount);

    // Record the PaymentTransaction for audit
    const txId = `webhook_${eventId}`;
    const existingTx = await prisma.paymentTransaction.findUnique({ where: { transactionId: txId } });
    if (!existingTx) {
      await prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          transactionId: txId,
          provider: 'RAZORPAY',
          eventType: 'payment.captured',
          payload: JSON.stringify(payload),
          status: 'CAPTURED'
        }
      });
    }

    // Delegate reconciliation to the centralized service
    if (payment.orderId) {
      await PaymentReconciliationService.reconcileOrder(payment.orderId, 'SYSTEM', `Webhook: ${eventId}`);
    } else {
      // Laundry order or payment without order reference — update payment directly
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CAPTURED' as any,
          razorpayPaymentId,
          razorpayEventId: eventId,
          capturedAt: new Date(),
          reconciliationStatus: 'AUTO_RECONCILED' as any,
          reconciledAt: new Date(),
          reconciledBy: 'WEBHOOK'
        }
      });
    }
  }

  /** Handle payment.authorized webhook event */
  private static async _handlePaymentAuthorized(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    eventId: string
  ): Promise<void> {
    const payment = await prisma.payment.findFirst({ where: { razorpayOrderId } });
    if (!payment) return;

    if (!['CAPTURED', 'SUCCESS', 'PAID'].includes(payment.status as string)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'AUTHORIZED' as any,
          razorpayPaymentId,
          razorpayEventId: eventId,
          reconciliationStatus: 'PENDING' as any
        }
      });
    }
  }

  /** Handle payment.failed webhook event */
  private static async _handlePaymentFailed(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    payload: any,
    eventId: string
  ): Promise<void> {
    const payment = await prisma.payment.findFirst({ where: { razorpayOrderId } });
    if (!payment) return;

    // Only update if not already captured
    if (!['CAPTURED', 'SUCCESS', 'PAID'].includes(payment.status as string)) {
      const failureReason = payload?.payment?.entity?.error_description || 'Payment failed at gateway';

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED' as any,
          razorpayPaymentId,
          razorpayEventId: eventId,
          failureReason,
          reconciliationStatus: 'NOT_REQUIRED' as any
        }
      });

      // Record transaction for attempt history
      await prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          transactionId: `webhook_fail_${eventId}`,
          provider: 'RAZORPAY',
          eventType: 'payment.failed',
          payload: JSON.stringify(payload),
          status: 'FAILED'
        }
      });
    }
  }

  /** Handle refund.created / refund.processed webhook event */
  private static async _handleRefundEvent(payload: any, eventType: string, eventId: string): Promise<void> {
    const refundEntity = payload?.refund?.entity;
    if (!refundEntity) return;

    const razorpayRefundId = refundEntity.id;
    const refundStatus = eventType === 'refund.processed' ? 'COMPLETED' : 'PROCESSING';

    // Find existing refund record
    const existingRefund = await prisma.refund.findFirst({
      where: { razorpayRefundId }
    });

    if (existingRefund) {
      await prisma.refund.update({
        where: { id: existingRefund.id },
        data: {
          status: refundStatus,
          processedAt: eventType === 'refund.processed' ? new Date() : undefined
        }
      });
    }
  }

  /**
   * Get Receipt (JSON or printable HTML)
   */
  public static async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { receiptNumber } = req.params;
      const { format } = req.query;

      const receipt = await prisma.receipt.findUnique({ where: { receiptNumber } });

      if (!receipt) {
        res.status(404).json({ success: false, message: 'Receipt not found' });
        return;
      }

      const parsedData = JSON.parse(receipt.receiptDataJson);

      if (format === 'html') {
        const html = receiptService.generateHtmlInvoice(parsedData);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        return;
      }

      res.status(200).json({ success: true, receipt: parsedData });
    } catch (err) {
      next(err);
    }
  }
}
