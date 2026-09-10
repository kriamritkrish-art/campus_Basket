/**
 * =============================================================================
 *  CAMPUS BASKET — PAYMENT RECONCILIATION SERVICE
 * =============================================================================
 *
 *  Handles automatic and manual reconciliation of Razorpay payments.
 *
 *  Core principle: ONE ORDER = ONE MASTER FINANCIAL RECORD.
 *
 *  Scenarios handled:
 *  - Money deducted but frontend callback failed → auto-reconcile
 *  - Webhook delayed/missed → periodic job re-checks via Razorpay API
 *  - Amount mismatch → flag for admin review (NEVER auto-confirm)
 *  - Payment not found → flag PAYMENT_NOT_FOUND
 *  - Customer reports debit but system shows failed → CUSTOMER_DEBIT_REVIEW
 *
 *  ID format for reconciliation records: CB-RCN-{YEAR}-{6HEX}
 *  ID format for webhook logs:           CB-WHK-{YEAR}-{6HEX}
 * =============================================================================
 */

import { prisma } from '../../config/database';
import { RazorpayService } from './RazorpayService';
import { IdGeneratorService } from '../../utils/IdGeneratorService';
import { LedgerService } from '../financial/LedgerService';

const razorpayService = new RazorpayService();

export interface ReconciliationResult {
  orderId: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  reconciliationStatus: string;
  message: string;
  amountMatch: boolean;
  expectedAmount?: number;
  receivedAmount?: number;
}

export class PaymentReconciliationService {
  /**
   * Process and store an incoming Razorpay webhook.
   * Returns false if duplicate (already processed), true if new.
   *
   * Idempotency key: x-razorpay-event-id header
   */
  static async processWebhookEvent(params: {
    eventId: string;
    eventType: string;
    rawPayload: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    signatureValid: boolean;
  }): Promise<{ isDuplicate: boolean; webhookLogId: string; relatedOrderId?: string }> {
    // Check idempotency — never process same event twice
    const existing = await prisma.razorpayWebhookLog.findUnique({
      where: { eventId: params.eventId }
    });

    if (existing) {
      console.log(`[Webhook] Duplicate event ignored: ${params.eventId}`);
      await prisma.razorpayWebhookLog.update({
        where: { eventId: params.eventId },
        data: { processingStatus: 'IGNORED_DUPLICATE' }
      });
      return { isDuplicate: true, webhookLogId: existing.webhookLogId };
    }

    // Find the related Campus Basket order from razorpayOrderId
    let relatedOrderId: string | undefined;
    if (params.razorpayOrderId) {
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: params.razorpayOrderId }
      });
      relatedOrderId = payment?.orderId ?? undefined;
    }

    // Create webhook log record
    const webhookLog = await prisma.razorpayWebhookLog.create({
      data: {
        webhookLogId: IdGeneratorService.webhookLogId(),
        eventId: params.eventId,
        eventType: params.eventType,
        razorpayOrderId: params.razorpayOrderId,
        razorpayPaymentId: params.razorpayPaymentId,
        relatedOrderId: relatedOrderId,
        signatureValid: params.signatureValid,
        rawPayload: params.rawPayload,
        processingStatus: 'RECEIVED'
      }
    });

    return { isDuplicate: false, webhookLogId: webhookLog.webhookLogId, relatedOrderId };
  }

  /**
   * Mark a webhook log entry as processed (or failed).
   */
  static async markWebhookProcessed(
    eventId: string,
    status: 'PROCESSED' | 'FAILED',
    failureReason?: string
  ): Promise<void> {
    await prisma.razorpayWebhookLog.updateMany({
      where: { eventId },
      data: {
        processingStatus: status,
        processedAt: new Date(),
        failureReason: failureReason ?? null
      }
    });
  }

  /**
   * Core: reconcile a specific order that has a Razorpay order ID.
   *
   * Called:
   * 1. By webhook handler after receiving payment.captured event
   * 2. By periodic background job for stuck PENDING_PAYMENT orders
   * 3. By admin manually via "Recheck Razorpay Payment"
   *
   * NEVER creates a duplicate order.
   * NEVER confirms payment if amounts don't match.
   */
  static async reconcileOrder(
    orderId: string,
    performedBy: string = 'SYSTEM',
    adminNote?: string
  ): Promise<ReconciliationResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order) {
      return {
        orderId,
        action: 'RECHECK',
        previousStatus: 'UNKNOWN',
        newStatus: 'UNKNOWN',
        reconciliationStatus: 'PAYMENT_NOT_FOUND',
        message: 'Order not found',
        amountMatch: false
      };
    }

    const payment = order.payment;
    if (!payment || !payment.razorpayOrderId) {
      // COD order or no payment record — no reconciliation needed
      return {
        orderId,
        action: 'SKIP',
        previousStatus: order.status,
        newStatus: order.status,
        reconciliationStatus: 'NOT_REQUIRED',
        message: 'No Razorpay payment record — reconciliation not required',
        amountMatch: true
      };
    }

    // Already confirmed — nothing to do
    if (['CONFIRMED', 'ACCEPTED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
      if (payment.status === 'CAPTURED' || payment.status === 'SUCCESS' || payment.status === 'PAID') {
        return {
          orderId,
          action: 'SKIP',
          previousStatus: order.status,
          newStatus: order.status,
          reconciliationStatus: 'NOT_REQUIRED',
          message: 'Order already confirmed and payment captured',
          amountMatch: true
        };
      }
    }

    const previousOrderStatus = order.status;
    const previousPaymentStatus = payment.status;
    const previousReconStatus = payment.reconciliationStatus;
    const expectedAmount = Number(payment.amount);

    // Query Razorpay API for payment status
    let razorpayPayments: any[] = [];
    let apiCallSucceeded = false;

    try {
      razorpayPayments = await razorpayService.fetchOrderPayments(payment.razorpayOrderId);
      apiCallSucceeded = true;
    } catch (err) {
      console.warn('[Reconciliation] Razorpay API call failed:', err);
    }

    // If in mock/test mode or API failed, check if we already have a paymentId stored
    if (!apiCallSucceeded || razorpayPayments.length === 0) {
      if (payment.razorpayPaymentId && (payment.status === 'SUCCESS' || payment.status === 'PAID' || payment.status === 'CAPTURED')) {
        // Payment was already captured (via frontend verify), just reconcile the order
        return await this._confirmOrderFromCapture({
          order,
          payment,
          capturedAmount: expectedAmount,
          razorpayPaymentId: payment.razorpayPaymentId,
          reconciliationAction: 'AUTO_RECONCILE',
          performedBy,
          adminNote,
          previousOrderStatus,
          previousPaymentStatus,
          previousReconStatus
        });
      }

      if (!apiCallSucceeded) {
        // Cannot determine — mark as PENDING reconciliation
        await this._updateReconciliationStatus(payment.id, 'PENDING', order.id);
        return {
          orderId,
          action: 'RECHECK',
          previousStatus: previousOrderStatus,
          newStatus: order.status,
          reconciliationStatus: 'PENDING',
          message: 'Razorpay API unavailable — marked for retry',
          amountMatch: false
        };
      }

      // No payments found on Razorpay
      await this._updateReconciliationStatus(payment.id, 'PAYMENT_NOT_FOUND', order.id);
      return {
        orderId,
        action: 'PAYMENT_NOT_FOUND',
        previousStatus: previousOrderStatus,
        newStatus: order.status,
        reconciliationStatus: 'PAYMENT_NOT_FOUND',
        message: 'No payments found on Razorpay for this order',
        amountMatch: false
      };
    }

    // Find a captured payment
    const capturedPayment = razorpayPayments.find(
      (p: any) => p.status === 'captured'
    );

    if (capturedPayment) {
      const receivedAmount = capturedPayment.amount / 100; // convert paise to rupees

      // Amount verification — CRITICAL safety check
      const amountMatch = Math.abs(receivedAmount - expectedAmount) < 0.01;

      if (!amountMatch) {
        // AMOUNT MISMATCH — do NOT auto-confirm. Flag for admin review.
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'RECONCILIATION_REQUIRED' as any,
              razorpayPaymentId: capturedPayment.id,
              razorpayEventId: capturedPayment.id,
              reconciliationStatus: 'AMOUNT_MISMATCH',
              failureReason: `Amount mismatch: expected ₹${expectedAmount}, received ₹${receivedAmount}`
            }
          }),
          prisma.order.update({
            where: { id: orderId },
            data: { reconciliationStatus: 'AMOUNT_MISMATCH' }
          })
        ]);

        await this._createReconciliationLog({
          paymentId: payment.id,
          orderId,
          razorpayOrderId: payment.razorpayOrderId!,
          razorpayPaymentId: capturedPayment.id,
          action: 'AMOUNT_MISMATCH_DETECTED',
          previousPaymentStatus,
          newPaymentStatus: 'RECONCILIATION_REQUIRED',
          previousOrderStatus,
          newOrderStatus: order.status,
          previousReconStatus,
          newReconStatus: 'AMOUNT_MISMATCH',
          expectedAmount,
          receivedAmount,
          amountMatch: false,
          performedBy,
          adminNote
        });

        return {
          orderId,
          action: 'AMOUNT_MISMATCH_DETECTED',
          previousStatus: previousOrderStatus,
          newStatus: order.status,
          reconciliationStatus: 'AMOUNT_MISMATCH',
          message: `Amount mismatch: expected ₹${expectedAmount}, received ₹${receivedAmount}. Admin review required.`,
          amountMatch: false,
          expectedAmount,
          receivedAmount
        };
      }

      // Amounts match — auto-reconcile!
      return await this._confirmOrderFromCapture({
        order,
        payment,
        capturedAmount: receivedAmount,
        razorpayPaymentId: capturedPayment.id,
        capturedAt: new Date(capturedPayment.created_at * 1000),
        reconciliationAction: 'AUTO_RECONCILE',
        performedBy,
        adminNote,
        previousOrderStatus,
        previousPaymentStatus,
        previousReconStatus
      });
    }

    // Check for failed payment
    const failedPayment = razorpayPayments.find((p: any) => p.status === 'failed');
    if (failedPayment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: failedPayment.error_description || 'Payment failed at gateway',
          razorpayPaymentId: failedPayment.id,
          reconciliationStatus: 'NOT_REQUIRED'
        }
      });

      return {
        orderId,
        action: 'PAYMENT_FAILED_CONFIRMED',
        previousStatus: previousOrderStatus,
        newStatus: order.status,
        reconciliationStatus: 'NOT_REQUIRED',
        message: `Payment confirmed as failed: ${failedPayment.error_description || 'Gateway failure'}`,
        amountMatch: false
      };
    }

    // Payment authorized but not captured
    const authorizedPayment = razorpayPayments.find((p: any) => p.status === 'authorized');
    if (authorizedPayment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'AUTHORIZED',
          razorpayPaymentId: authorizedPayment.id,
          reconciliationStatus: 'PENDING'
        }
      });

      return {
        orderId,
        action: 'AUTHORIZED_PENDING_CAPTURE',
        previousStatus: previousOrderStatus,
        newStatus: order.status,
        reconciliationStatus: 'PENDING',
        message: 'Payment authorized but capture pending. Will recheck.',
        amountMatch: false
      };
    }

    return {
      orderId,
      action: 'NO_ACTION',
      previousStatus: previousOrderStatus,
      newStatus: order.status,
      reconciliationStatus: 'PENDING',
      message: 'No conclusive payment status found. Will recheck.',
      amountMatch: false
    };
  }

  /**
   * Confirms an order as CONFIRMED + marks payment as CAPTURED.
   * Used by both auto-reconcile and manual admin actions.
   * IDEMPOTENT — safe to call multiple times.
   */
  private static async _confirmOrderFromCapture(params: {
    order: any;
    payment: any;
    capturedAmount: number;
    razorpayPaymentId: string;
    capturedAt?: Date;
    reconciliationAction: string;
    performedBy: string;
    adminNote?: string;
    previousOrderStatus: string;
    previousPaymentStatus: string;
    previousReconStatus: string;
  }): Promise<ReconciliationResult> {
    const { order, payment, capturedAmount, razorpayPaymentId, capturedAt, performedBy, adminNote } = params;

    const newOrderStatus = 'CONFIRMED';
    const newPaymentStatus = 'CAPTURED';
    const newReconStatus = performedBy === 'SYSTEM' ? 'AUTO_RECONCILED' : 'MANUALLY_RECONCILED';

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newPaymentStatus as any,
          razorpayPaymentId,
          capturedAt: capturedAt ?? new Date(),
          reconciliationStatus: newReconStatus as any,
          reconciledAt: new Date(),
          reconciledBy: performedBy
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: newOrderStatus as any,
          paymentStatus: newPaymentStatus as any,
          reconciliationStatus: newReconStatus as any
        }
      });

      // Add order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: params.previousOrderStatus as any,
          newStatus: newOrderStatus as any,
          changedBy: performedBy === 'SYSTEM' ? 'AUTO_RECONCILIATION' : `ADMIN:${performedBy}`,
          notes: adminNote || `Payment reconciled. Razorpay Payment ID: ${razorpayPaymentId}. Amount: ₹${capturedAmount}`
        }
      });
    });

    // Record reconciliation log
    await this._createReconciliationLog({
      paymentId: payment.id,
      orderId: order.id,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId,
      action: params.reconciliationAction,
      previousPaymentStatus: params.previousPaymentStatus,
      newPaymentStatus,
      previousOrderStatus: params.previousOrderStatus,
      newOrderStatus,
      previousReconStatus: params.previousReconStatus,
      newReconStatus,
      expectedAmount: Number(payment.amount),
      receivedAmount: capturedAmount,
      amountMatch: true,
      performedBy,
      adminNote
    });

    // Record to immutable financial ledger
    try {
      await LedgerService.recordOrderPayment({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: capturedAmount,
        providerId: order.providerId,
        paymentMethod: order.paymentMethod,
        commissionRate: Number(order.commissionRate) || 5,
        commissionAmount: Number(order.commissionAmount) || 0,
        providerPayable: Number(order.providerPayable) || 0,
        referenceId: razorpayPaymentId,
        description: `Payment ${params.reconciliationAction} for order ${order.orderNumber}`
      });
    } catch (ledgerErr) {
      console.warn('[Reconciliation] Ledger recording failed (non-critical):', ledgerErr);
    }

    return {
      orderId: order.id,
      action: params.reconciliationAction,
      previousStatus: params.previousOrderStatus,
      newStatus: newOrderStatus,
      reconciliationStatus: newReconStatus,
      message: `Order ${order.orderNumber} confirmed via ${params.reconciliationAction}. Payment ${razorpayPaymentId} captured.`,
      amountMatch: true,
      expectedAmount: Number(payment.amount),
      receivedAmount: capturedAmount
    };
  }

  /**
   * Run the periodic reconciliation job.
   * Scans all PENDING_PAYMENT online orders with Razorpay order IDs
   * that are older than 2 minutes (enough time for checkout to complete).
   * Called every 5 minutes by the background job in server.ts.
   */
  static async runPeriodicReconciliation(): Promise<void> {
    console.log('[ReconciliationJob] Starting periodic reconciliation scan...');

    const cutoffTime = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        paymentMethod: 'RAZORPAY',
        createdAt: { lte: cutoffTime },
        payment: {
          razorpayOrderId: { not: null },
          status: { in: ['PENDING', 'PROCESSING', 'CREATED'] as any }
        }
      },
      include: { payment: true },
      take: 50 // Process max 50 per cycle
    });

    if (pendingOrders.length === 0) {
      console.log('[ReconciliationJob] No pending orders to reconcile.');
      return;
    }

    console.log(`[ReconciliationJob] Found ${pendingOrders.length} orders to check.`);

    let reconciledCount = 0;
    let skippedCount = 0;

    for (const order of pendingOrders) {
      try {
        const result = await this.reconcileOrder(order.id, 'SYSTEM', 'Periodic reconciliation job');
        if (result.action === 'AUTO_RECONCILE') {
          reconciledCount++;
          console.log(`[ReconciliationJob] ✓ Auto-reconciled: ${order.orderNumber}`);
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`[ReconciliationJob] Error reconciling order ${order.orderNumber}:`, err);
      }
    }

    console.log(`[ReconciliationJob] Done. Reconciled: ${reconciledCount}, Skipped: ${skippedCount}`);
  }

  /**
   * Admin: manually mark an order as reconciled (with mandatory reason).
   * Creates full audit trail.
   */
  static async adminManualReconcile(
    orderId: string,
    adminUserId: string,
    adminNote: string,
    newOrderStatus?: string
  ): Promise<ReconciliationResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order || !order.payment) {
      throw new Error('Order or payment record not found');
    }

    const payment = order.payment;
    const previousOrderStatus = order.status;
    const previousPaymentStatus = payment.status;
    const previousReconStatus = payment.reconciliationStatus;

    const targetOrderStatus = (newOrderStatus || 'CONFIRMED') as any;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          reconciliationStatus: 'MANUALLY_RECONCILED' as any,
          reconciledAt: new Date(),
          reconciledBy: adminUserId,
          status: 'CAPTURED' as any
        }
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: targetOrderStatus,
          paymentStatus: 'CAPTURED' as any,
          reconciliationStatus: 'MANUALLY_RECONCILED' as any
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          previousStatus: previousOrderStatus as any,
          newStatus: targetOrderStatus,
          changedBy: `ADMIN:${adminUserId}`,
          notes: `Manual reconciliation by admin. Note: ${adminNote}`
        }
      });

      // Audit log for admin action
      await tx.adminStatusOverride.create({
        data: {
          orderId,
          entityType: 'PAYMENT_RECONCILIATION',
          previousValue: previousReconStatus,
          newValue: 'MANUALLY_RECONCILED',
          reason: adminNote,
          adminId: adminUserId,
          internalNote: `Manual reconciliation. Previous payment status: ${previousPaymentStatus}`
        }
      });
    });

    await this._createReconciliationLog({
      paymentId: payment.id,
      orderId,
      razorpayOrderId: payment.razorpayOrderId ?? undefined,
      razorpayPaymentId: payment.razorpayPaymentId ?? undefined,
      action: 'MANUAL_RECONCILE',
      previousPaymentStatus,
      newPaymentStatus: 'CAPTURED',
      previousOrderStatus,
      newOrderStatus: targetOrderStatus,
      previousReconStatus,
      newReconStatus: 'MANUALLY_RECONCILED',
      expectedAmount: Number(payment.amount),
      receivedAmount: Number(payment.amount),
      amountMatch: true,
      performedBy: adminUserId,
      adminNote
    });

    return {
      orderId,
      action: 'MANUAL_RECONCILE',
      previousStatus: previousOrderStatus,
      newStatus: targetOrderStatus,
      reconciliationStatus: 'MANUALLY_RECONCILED',
      message: `Order manually reconciled by admin. Note: ${adminNote}`,
      amountMatch: true
    };
  }

  /**
   * Update reconciliation status on Payment + Order (helper).
   */
  private static async _updateReconciliationStatus(
    paymentId: string,
    status: string,
    orderId?: string
  ): Promise<void> {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { reconciliationStatus: status as any }
    });

    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { reconciliationStatus: status as any }
      });
    }
  }

  /**
   * Create immutable reconciliation audit log entry.
   */
  private static async _createReconciliationLog(params: {
    paymentId: string;
    orderId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    action: string;
    previousPaymentStatus?: string;
    newPaymentStatus?: string;
    previousOrderStatus?: string;
    newOrderStatus?: string;
    previousReconStatus?: string;
    newReconStatus?: string;
    expectedAmount?: number;
    receivedAmount?: number;
    amountMatch: boolean;
    performedBy: string;
    adminNote?: string;
    webhookEventId?: string;
  }): Promise<void> {
    try {
      await prisma.paymentReconciliationLog.create({
        data: {
          reconciliationLogId: IdGeneratorService.reconciliationId(),
          paymentId: params.paymentId,
          orderId: params.orderId,
          razorpayOrderId: params.razorpayOrderId,
          razorpayPaymentId: params.razorpayPaymentId,
          action: params.action,
          previousPaymentStatus: params.previousPaymentStatus,
          newPaymentStatus: params.newPaymentStatus,
          previousOrderStatus: params.previousOrderStatus,
          newOrderStatus: params.newOrderStatus,
          previousReconStatus: params.previousReconStatus,
          newReconStatus: params.newReconStatus,
          expectedAmount: params.expectedAmount,
          receivedAmount: params.receivedAmount,
          amountMatch: params.amountMatch,
          performedBy: params.performedBy,
          adminNote: params.adminNote,
          webhookEventId: params.webhookEventId
        }
      });
    } catch (err) {
      // Non-critical — log but don't fail the main operation
      console.warn('[Reconciliation] Failed to create reconciliation log:', err);
    }
  }
}
