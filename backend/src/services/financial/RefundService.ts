import { prisma } from '../../config/database';
import { LedgerService } from './LedgerService';

export class RefundService {
  /**
   * Evaluates whether an order is eligible for cancellation based on service-specific rules.
   */
  public static evaluateCancellationEligibility(order: {
    id?: string;
    serviceType?: string;
    status: string;
    createdAt?: Date | string;
    laundryDetails?: { washCycleStage?: string };
  }): { isEligible: boolean; eligible: boolean; reason?: string } {
    const service = (order.serviceType || 'FOOD').toUpperCase();
    const status = order.status.toUpperCase();

    if (['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return {
        isEligible: false,
        eligible: false,
        reason: `Order is already ${status.toLowerCase()} and cannot be cancelled.`
      };
    }

    if (service === 'FOOD') {
      // Allowed before kitchen begins cooking
      const nonCancellableFoodStatuses = ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'];
      if (nonCancellableFoodStatuses.includes(status)) {
        return {
          isEligible: false,
          eligible: false,
          reason: 'Food preparation has already commenced in the kitchen. Cancellation is no longer permitted.'
        };
      }
      return { isEligible: true, eligible: true };
    }

    if (service === 'LAUNDRY') {
      const stage = (order.laundryDetails?.washCycleStage || '').toUpperCase();
      const nonCancellableStages = ['CLOTHES_COLLECTED', 'PICKED_UP', 'IN_LAUNDRY', 'WASHING', 'PROCESSING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'];
      if (stage && nonCancellableStages.includes(stage)) {
        return {
          isEligible: false,
          eligible: false,
          reason: 'Laundry items have already been collected from hostel or are in wash cycle. Cancellation is no longer permitted.'
        };
      }

      const nonCancellableLaundryStatuses = ['PICKED_UP', 'IN_LAUNDRY', 'WASHING', 'OUT_FOR_DELIVERY'];
      if (nonCancellableLaundryStatuses.includes(status)) {
        return {
          isEligible: false,
          eligible: false,
          reason: 'Laundry items have already been collected or are in wash cycle. Cancellation is no longer permitted.'
        };
      }
      return { isEligible: true, eligible: true };
    }

    // Default for Produce / Stationery / Essentials: cancellable prior to dispatch
    if (['OUT_FOR_DELIVERY', 'PACKED', 'DISPATCHED'].includes(status)) {
      return {
        isEligible: false,
        eligible: false,
        reason: 'Items have already been packed and dispatched for hostel delivery.'
      };
    }

    return { isEligible: true, eligible: true };
  }

  /**
   * Alias for evaluateCancellationEligibility
   */
  public static checkCancellationEligibility(order: any): { isEligible: boolean; eligible: boolean; reason?: string } {
    return this.evaluateCancellationEligibility(order);
  }

  /**
   * Save confidential student refund destination account (Masked for privacy)
   */
  public static async saveRefundAccount(
    studentId: string,
    data: {
      accountType: 'BANK_ACCOUNT' | 'UPI' | 'BANK';
      accountHolderName: string;
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      upiId?: string;
    }
  ): Promise<any> {
    const accType = (data.accountType === 'BANK' ? 'BANK_ACCOUNT' : data.accountType) || 'BANK_ACCOUNT';
    const maskedAcc = data.accountNumber && data.accountNumber.length >= 4
      ? `••••••••${data.accountNumber.slice(-4)}`
      : null;

    let maskedUpi: string | null = null;
    if (data.upiId && data.upiId.includes('@')) {
      const [handle, domain] = data.upiId.split('@');
      const prefixLen = handle.length >= 5 ? 3 : Math.min(2, handle.length);
      maskedUpi = `${handle.slice(0, prefixLen)}****@${domain}`;
    }

    return (prisma as any).refundAccount.upsert({
      where: { studentId },
      update: {
        accountType: accType,
        accountHolderName: data.accountHolderName.trim(),
        bankName: data.bankName || null,
        accountNumberMasked: maskedAcc,
        accountNumberEncrypted: data.accountNumber || null,
        ifscCode: data.ifscCode ? data.ifscCode.toUpperCase() : null,
        upiIdMasked: maskedUpi,
        upiIdEncrypted: data.upiId || null,
        isVerified: true,
        updatedAt: new Date()
      },
      create: {
        studentId,
        accountType: accType,
        accountHolderName: data.accountHolderName.trim(),
        bankName: data.bankName || null,
        accountNumberMasked: maskedAcc,
        accountNumberEncrypted: data.accountNumber || null,
        ifscCode: data.ifscCode ? data.ifscCode.toUpperCase() : null,
        upiIdMasked: maskedUpi,
        upiIdEncrypted: data.upiId || null,
        isVerified: true,
        isPrimary: true
      }
    });
  }

  /**
   * Cancels an eligible order and triggers refund sequence.
   */
  public static async cancelOrder(
    orderId: string,
    requestedByUserId: string,
    role: 'STUDENT' | 'PROVIDER' | 'ADMIN',
    reason: string
  ): Promise<any> {
    const order = await (prisma as any).order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (role === 'STUDENT') {
      const check = this.checkCancellationEligibility(order);
      if (!check.eligible) {
        throw new Error(check.reason || 'This order cannot be cancelled at its current stage.');
      }
    }

    const wasPaidOnline = order.paymentMethod !== 'CASH_ON_DELIVERY' && ['PAID', 'SUCCESS'].includes(order.paymentStatus);
    const newPaymentStatus = wasPaidOnline ? 'REFUND_PENDING' : 'PAYMENT_FAILED';
    const newRefundStatus = wasPaidOnline ? 'REQUESTED' : 'NOT_APPLICABLE';

    const updated = await (prisma as any).order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: newPaymentStatus,
        refundStatus: newRefundStatus,
        settlementStatus: 'ADJUSTED',
        cancellationReason: reason,
        cancelledBy: role,
        cancelledAt: new Date()
      }
    });

    // Record cancellation request for audit trail
    await (prisma as any).cancellationRequest.create({
      data: {
        orderId,
        requestedByUserId,
        role,
        reason,
        status: 'APPROVED',
        adminNotes: `Order cancelled by ${role}`
      }
    });

    return updated;
  }

  /**
   * Admin executes / completes a pending student refund.
   */
  public static async processRefund(
    orderId: string,
    adminUserId: string,
    amount?: number,
    notes?: string
  ): Promise<any> {
    const order = await (prisma as any).order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const refundAmount = amount ? Number(amount) : Number(order.totalAmount);

    const updated = await (prisma as any).order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        refundStatus: 'COMPLETED',
        settlementStatus: 'ADJUSTED'
      }
    });

    // Append to Financial Ledger
    await LedgerService.recordEntry({
      orderId,
      entryType: 'REFUND_ISSUED',
      debitAccount: 'STUDENT_REFUND_LIABILITY',
      creditAccount: 'CAMPUS_ESCROW_GATEWAY',
      amount: refundAmount,
      referenceId: `REF_${order.orderNumber}`,
      description: `Student refund issued for Order ${order.orderNumber}. Reason: ${notes || order.cancellationReason || 'Admin Approved Refund'}`,
      metadata: { orderNumber: order.orderNumber, processedBy: adminUserId }
    });

    // Record override audit log
    await (prisma as any).adminStatusOverride.create({
      data: {
        orderId,
        adminUserId,
        previousStatus: order.refundStatus || 'PENDING',
        newStatus: 'COMPLETED',
        statusType: 'REFUND',
        reason: notes || 'Admin verified refund processing',
        notes: `Refund of ₹${refundAmount} disbursed.`
      }
    });

    return updated;
  }
}
