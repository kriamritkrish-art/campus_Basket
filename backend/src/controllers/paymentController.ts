import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { RazorpayService } from '../services/payment/RazorpayService';
import { ReceiptService } from '../services/receipt/ReceiptService';

const razorpayService = new RazorpayService();
const receiptService = new ReceiptService();

export class PaymentController {
  /**
   * Verify Razorpay Payment Signature
   */
  public static async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        res.status(400).json({
          success: false,
          message: 'Missing required Razorpay payment credentials'
        });
        return;
      }

      // Check payment record in DB
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId },
        include: { order: true, laundryOrder: true }
      });

      if (!payment) {
        res.status(404).json({ success: false, message: 'Payment record not found' });
        return;
      }

      // Cryptographically verify signature
      const isValid = razorpayService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValid) {
        // Record failure
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        });

        res.status(400).json({
          success: false,
          message: 'Payment signature verification failed. Transaction flagged as invalid.'
        });
        return;
      }

      // Mark payment SUCCESS
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            razorpayPaymentId,
            razorpaySignature
          }
        });

        if (payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              status: 'CONFIRMED',
              paymentStatus: 'SUCCESS',
              statusHistory: {
                create: {
                  previousStatus: 'PENDING_PAYMENT',
                  newStatus: 'CONFIRMED',
                  changedBy: 'RAZORPAY_GATEWAY',
                  notes: `Online payment verified via Razorpay ID: ${razorpayPaymentId}`
                }
              }
            }
          });
        }
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified and order confirmed successfully!'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Razorpay Webhook Handler with Replay-Attack Idempotency
   */
  public static async webhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      if (!signature) {
        res.status(400).json({ status: 'Signature missing' });
        return;
      }

      const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        res.status(400).json({ status: 'Invalid signature' });
        return;
      }

      const event = req.body.event;
      const payload = req.body.payload;

      // Idempotency: prevent processing duplicate webhook events
      const eventId = req.headers['x-razorpay-event-id'] as string || `${event}_${Date.now()}`;
      const existingTx = await prisma.paymentTransaction.findUnique({
        where: { transactionId: eventId }
      });

      if (existingTx) {
        res.status(200).json({ status: 'Already processed' });
        return;
      }

      if (event === 'payment.captured' && payload?.payment?.entity) {
        const p = payload.payment.entity;
        const razorpayOrderId = p.order_id;
        const razorpayPaymentId = p.id;

        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId }
        });

        if (payment) {
          await prisma.$transaction([
            prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'SUCCESS', razorpayPaymentId }
            }),
            prisma.paymentTransaction.create({
              data: {
                paymentId: payment.id,
                transactionId: eventId,
                eventType: event,
                payload: JSON.stringify(payload),
                status: 'PROCESSED'
              }
            })
          ]);
        }
      }

      res.status(200).json({ status: 'ok' });
    } catch (err) {
      console.error('[WebhookError]', err);
      res.status(500).json({ status: 'Webhook processing error' });
    }
  }

  /**
   * Get Receipt (JSON or printable HTML)
   */
  public static async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { receiptNumber } = req.params;
      const { format } = req.query;

      const receipt = await prisma.receipt.findUnique({
        where: { receiptNumber }
      });

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

      res.status(200).json({
        success: true,
        receipt: parsedData
      });
    } catch (err) {
      next(err);
    }
  }
}
