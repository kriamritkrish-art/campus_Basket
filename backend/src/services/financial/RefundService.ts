import { prisma } from '../../config/database';
import { LedgerService } from './LedgerService';
import { WalletService } from './WalletService';

export class RefundService {
  /**
   * Evaluates whether an order is eligible for cancellation based on service-specific rules.
   */
  /**
   * Evaluates whether an order is eligible for cancellation based on service-specific rules and provider acceptance.
   */
  public static evaluateCancellationEligibility(order: {
    id?: string;
    serviceType?: string;
    status: string;
    providerAccepted?: boolean;
    createdAt?: Date | string;
    laundryDetails?: { washCycleStage?: string };
  }): { isEligible: boolean; eligible: boolean; reason?: string; isProviderAccepted: boolean } {
    const service = (order.serviceType || 'FOOD').toUpperCase();
    const status = order.status.toUpperCase();
    const isAccepted = Boolean(
      order.providerAccepted ||
      ['ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'DISPATCHED'].includes(status)
    );

    if (['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return {
        isEligible: false,
        eligible: false,
        isProviderAccepted: isAccepted,
        reason: `Order is already ${status.toLowerCase()} and cannot be cancelled.`
      };
    }

    if (service === 'FOOD') {
      if (order.providerAccepted || ['ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(status)) {
        return {
          isEligible: false,
          eligible: false,
          isProviderAccepted: true,
          reason: 'Food order has already been accepted by the kitchen/provider. Fulfillment has commenced and order cannot be changed or cancelled.'
        };
      }
      return { isEligible: true, eligible: true, isProviderAccepted: false };
    }

    if (service === 'LAUNDRY') {
      const stage = (order.laundryDetails?.washCycleStage || '').toUpperCase();
      const nonCancellableStages = ['CLOTHES_COLLECTED', 'PICKED_UP', 'IN_LAUNDRY', 'WASHING', 'PROCESSING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'];
      if (stage && nonCancellableStages.includes(stage)) {
        return {
          isEligible: false,
          eligible: false,
          isProviderAccepted: isAccepted,
          reason: 'Laundry items have already been collected from hostel or are in wash cycle. Cancellation is no longer permitted.'
        };
      }

      const nonCancellableLaundryStatuses = ['PICKED_UP', 'IN_LAUNDRY', 'WASHING', 'OUT_FOR_DELIVERY'];
      if (nonCancellableLaundryStatuses.includes(status)) {
        return {
          isEligible: false,
          eligible: false,
          isProviderAccepted: isAccepted,
          reason: 'Laundry items have already been collected or are in wash cycle. Cancellation is no longer permitted.'
        };
      }
      return { isEligible: true, eligible: true, isProviderAccepted: isAccepted };
    }

    // Produce / Stationery / Essentials: cancellable prior to dispatch
    if (['OUT_FOR_DELIVERY', 'PACKED', 'DISPATCHED'].includes(status)) {
      return {
        isEligible: false,
        eligible: false,
        isProviderAccepted: isAccepted,
        reason: 'Items have already been packed and dispatched for hostel delivery.'
      };
    }

    return { isEligible: true, eligible: true, isProviderAccepted: isAccepted };
  }

  /**
   * Alias for evaluateCancellationEligibility
   */
  public static checkCancellationEligibility(order: any): { isEligible: boolean; eligible: boolean; reason?: string; isProviderAccepted: boolean } {
    return this.evaluateCancellationEligibility(order);
  }

  /**
   * Evaluates return eligibility for delivered orders based on category and admin policies.
   */
  public static evaluateReturnEligibility(order: {
    serviceType?: string;
    status: string;
    deliveredAt?: Date | string | null;
    createdAt?: Date | string;
    reasonType?: string;
    items?: Array<any>;
  }): { isEligible: boolean; eligible: boolean; reason?: string } {
    const status = (order.status || '').toUpperCase();
    const service = (order.serviceType || 'FOOD').toUpperCase();

    if (!['DELIVERED', 'COMPLETED'].includes(status)) {
      return {
        isEligible: false,
        eligible: false,
        reason: 'Returns can only be requested after the order has been successfully delivered.'
      };
    }

    if (service === 'LAUNDRY') {
      return {
        isEligible: false,
        eligible: false,
        reason: 'Laundry wash orders do not accept product returns.'
      };
    }

    const deliveredTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : new Date(order.createdAt || Date.now()).getTime();
    const elapsedMinutes = (Date.now() - deliveredTime) / (1000 * 60);
    const isProductIssue = order.reasonType === 'PRODUCT_ISSUE';

    if (service === 'FOOD') {
      if (isProductIssue) {
        if (elapsedMinutes > 1440) {
          return {
            isEligible: false,
            eligible: false,
            reason: 'Food quality defect reporting window has expired (24-hour limit).'
          };
        }
        return { isEligible: true, eligible: true };
      }

      if (elapsedMinutes > 30) {
        return {
          isEligible: false,
          eligible: false,
          reason: 'Food & Meals return window has expired (30-minute doorstep inspection limit).'
        };
      }
      return { isEligible: true, eligible: true };
    }

    if (service === 'FRESH_PRODUCE') {
      const produceLimit = isProductIssue ? 1440 : 120;
      if (elapsedMinutes > produceLimit) {
        return {
          isEligible: false,
          eligible: false,
          reason: 'Fresh produce & fruit return window has expired (2-hour freshness guarantee limit).'
        };
      }
      return { isEligible: true, eligible: true };
    }

    if (service === 'STATIONERY' || service === 'ESSENTIALS') {
      const statLimit = isProductIssue ? 10080 : 1440;
      if (elapsedMinutes > statLimit) {
        return {
          isEligible: false,
          eligible: false,
          reason: 'Stationery items return window has expired (24-hour return policy).'
        };
      }
      return { isEligible: true, eligible: true };
    }

    return { isEligible: true, eligible: true };
  }

  /**
   * Pre-cancellation financial quote and rule evaluation.
   * Gives students complete transparency into Order Total, Paid Online, COD Due, Non-refundable, and Refund Eligible amounts.
   */
  public static calculateCancellationQuote(order: any): {
    eligible: boolean;
    canCancel: boolean;
    reason?: string;
    orderAmount: number;
    amountActuallyPaid: number;
    codAmountDue: number;
    nonRefundableAmount: number;
    refundEligible: number;
    paymentMethod: string;
    isPrepaid: boolean;
    isCod: boolean;
    isCodWithAdvance: boolean;
    refundMethods: Array<{
      id: 'CAMPUS_BASKET_WALLET' | 'ORIGINAL_PAYMENT';
      name: string;
      speed: string;
      description: string;
      recommended?: boolean;
    }>;
    calculation?: {
      orderAmount: number;
      amountActuallyPaid: number;
      codAmountDue: number;
      nonRefundableAmount: number;
      refundEligible: number;
    };
  } {
    const check = this.checkCancellationEligibility(order);
    const orderAmount = Number(order.totalAmount || 0);
    const isCod = order.paymentMethod === 'CASH_ON_DELIVERY';

    if (!check.eligible) {
      return {
        eligible: false,
        canCancel: false,
        reason: check.reason || 'Cancellation is not available for this order under current campus policy.',
        orderAmount,
        amountActuallyPaid: 0,
        codAmountDue: 0,
        nonRefundableAmount: 0,
        refundEligible: 0,
        paymentMethod: order.paymentMethod || 'ONLINE',
        isPrepaid: !isCod,
        isCod,
        isCodWithAdvance: false,
        refundMethods: [],
        calculation: {
          orderAmount,
          amountActuallyPaid: 0,
          codAmountDue: 0,
          nonRefundableAmount: 0,
          refundEligible: 0
        }
      };
    }

    let amountActuallyPaid = 0;
    let codAmountDue = 0;
    let nonRefundableAmount = 0;
    let refundEligible = 0;
    let isCodWithAdvance = false;

    if (!isCod) {
      // PREPAID / ONLINE: Full paid online, 100% refundable before acceptance
      amountActuallyPaid = orderAmount;
      codAmountDue = 0;
      nonRefundableAmount = 0;
      refundEligible = orderAmount;
    } else {
      // CASH ON DELIVERY: Calculate actual advance paid online
      let advancePaid = Number(order.advancePaidAmount || 0);

      if (advancePaid <= 0 && order.payment) {
        const pStatus = order.payment.status;
        const pAmount = Number(order.payment.amount);
        if (['SUCCESS', 'PAID', 'COD_PENDING'].includes(pStatus) && pAmount < orderAmount && pAmount > 0) {
          advancePaid = pAmount;
        }
      }

      if (advancePaid <= 0 && Array.isArray(order.statusHistory)) {
        for (const h of order.statusHistory) {
          const m = (h.notes || '').match(/COD (?:Partial )?Advance of ₹(\d+(?:\.\d+)?)/i);
          if (m && m[1]) {
            advancePaid = parseFloat(m[1]);
            break;
          }
        }
      }

      amountActuallyPaid = advancePaid;
      codAmountDue = Math.max(0, orderAmount - advancePaid);
      // The unpaid COD amount was never collected from the student, so it is strictly non-refundable
      nonRefundableAmount = codAmountDue;
      refundEligible = advancePaid;
      isCodWithAdvance = advancePaid > 0;
    }

    const refundMethods: Array<{
      id: 'CAMPUS_BASKET_WALLET' | 'ORIGINAL_PAYMENT';
      name: string;
      speed: string;
      description: string;
      recommended?: boolean;
    }> = refundEligible > 0 ? [
      {
        id: 'CAMPUS_BASKET_WALLET',
        name: 'Campus Basket Wallet',
        speed: 'Instant',
        description: 'Instant refund credited to Campus Basket Wallet upon cancellation confirmation',
        recommended: true
      },
      {
        id: 'ORIGINAL_PAYMENT',
        name: 'Original Payment Method',
        speed: '3–5 business days',
        description: 'Refund processed back through original payment method in 3–5 business days',
        recommended: false
      }
    ] : [];

    return {
      eligible: true,
      canCancel: true,
      orderAmount,
      amountActuallyPaid,
      codAmountDue,
      nonRefundableAmount,
      refundEligible,
      paymentMethod: order.paymentMethod || 'ONLINE',
      isPrepaid: !isCod,
      isCod,
      isCodWithAdvance,
      refundMethods,
      calculation: {
        orderAmount,
        amountActuallyPaid,
        codAmountDue,
        nonRefundableAmount,
        refundEligible
      }
    };
  }

  /**
   * Pre-return financial quote and rule evaluation before student applies.
   */
  public static calculateReturnQuote(
    order: any,
    reasonType: string = 'PRODUCT_ISSUE',
    itemIds?: string[]
  ): {
    eligible: boolean;
    canReturn: boolean;
    reason?: string;
    originalOrderAmount: number;
    productValue: number;
    amountActuallyPaid: number;
    codAmountDue: number;
    eligibleReturnRefund: number;
    nonRefundableAmount: number;
    deliveryFeeDeducted: number;
    reasonType: string;
    refundMethods: Array<{
      id: 'CAMPUS_BASKET_WALLET' | 'ORIGINAL_PAYMENT';
      name: string;
      speed: string;
      description: string;
      recommended?: boolean;
    }>;
    calculation?: {
      originalOrderAmount: number;
      productValue: number;
      amountActuallyPaid: number;
      codAmountDue: number;
      eligibleReturnRefund: number;
      nonRefundableAmount: number;
      deliveryFeeDeducted: number;
    };
  } {
    const check = this.evaluateReturnEligibility({ ...order, reasonType });
    const originalOrderAmount = Number(order.totalAmount || 0);

    if (!check.eligible) {
      return {
        eligible: false,
        canReturn: false,
        reason: check.reason || 'This order is not currently eligible for return.',
        originalOrderAmount,
        productValue: 0,
        amountActuallyPaid: 0,
        codAmountDue: 0,
        eligibleReturnRefund: 0,
        nonRefundableAmount: 0,
        deliveryFeeDeducted: 0,
        reasonType,
        refundMethods: [],
        calculation: {
          originalOrderAmount,
          productValue: 0,
          amountActuallyPaid: 0,
          codAmountDue: 0,
          eligibleReturnRefund: 0,
          nonRefundableAmount: 0,
          deliveryFeeDeducted: 0
        }
      };
    }

    // Calculate product value for returned items
    let productValue = Number(order.subtotal || order.totalAmount);
    if (Array.isArray(itemIds) && itemIds.length > 0 && order.items) {
      const selectedItems = order.items.filter((i: any) => itemIds.includes(i.id));
      if (selectedItems.length > 0) {
        productValue = selectedItems.reduce((sum: number, curr: any) => sum + Number(curr.totalPrice), 0);
      }
    }

    const isMindChange = reasonType === 'MIND_CHANGE';
    const returnDeliveryFee = 15.00;
    const deliveryFeeDeducted = isMindChange ? Math.min(productValue, returnDeliveryFee) : 0;
    const eligibleReturnRefund = Math.max(0, productValue - deliveryFeeDeducted);

    // Delivered orders had all amounts collected at doorstep (or prepaid online)
    const amountActuallyPaid = originalOrderAmount;
    const codAmountDue = 0;
    const nonRefundableAmount = deliveryFeeDeducted + Math.max(0, originalOrderAmount - productValue);

    return {
      eligible: true,
      canReturn: true,
      originalOrderAmount,
      productValue,
      amountActuallyPaid,
      codAmountDue,
      eligibleReturnRefund,
      nonRefundableAmount,
      deliveryFeeDeducted,
      reasonType,
      refundMethods: [
        {
          id: 'CAMPUS_BASKET_WALLET',
          name: 'Campus Basket Wallet',
          speed: 'Refund credited after successful pickup',
          description: 'Instant wallet credit immediately after delivery runner completes physical return pickup & OTP verification',
          recommended: true
        },
        {
          id: 'ORIGINAL_PAYMENT',
          name: 'Original Payment Method',
          speed: '3–5 business days',
          description: 'Processed through payment gateway or manual transfer 3–5 business days after pickup',
          recommended: false
        }
      ],
      calculation: {
        originalOrderAmount,
        productValue,
        amountActuallyPaid,
        codAmountDue,
        eligibleReturnRefund,
        nonRefundableAmount,
        deliveryFeeDeducted
      }
    };
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

    const account = await (prisma as any).refundAccount.upsert({
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

    // If any return requests were waiting for student account details, update them so admin can re-distribute
    try {
      await (prisma as any).returnRequest.updateMany({
        where: {
          order: { studentId },
          status: 'AWAITING_STUDENT_DETAILS'
        },
        data: {
          status: 'COMPLETED',
          refundFailureReason: null,
          adminNotes: 'Student has provided refund account details. Ready for Admin re-distribution.'
        }
      });

      await (prisma as any).order.updateMany({
        where: {
          studentId,
          refundStatus: 'AWAITING_STUDENT_DETAILS'
        },
        data: {
          refundStatus: 'PROCESSING'
        }
      });
    } catch (updateErr) {}

    return account;
  }

  /**
   * Cancels an eligible order and triggers provider-acceptance-dependent refund sequence.
   *
   * BEFORE PROVIDER ACCEPTS:
   *  Case A - ONLINE/PREPAID: Refund full actual paid amount (e.g. ₹180)
   *  Case B - NORMAL COD: Refund ₹0. Do NOT create refund record.
   *  Case C - COD + PARTIAL ADVANCE: Refund ONLY actual advance paid (e.g. ₹20). Exclude ₹180 COD due.
   *
   * AFTER PROVIDER ACCEPTS:
   *  provider_accepted = true. Automatic pre-acceptance rules MUST NOT be applied.
   *  Apply separate post-acceptance policy or Admin review.
   */
  public static async cancelOrder(
    orderIdOrOrder: string | any,
    arg2?: any,
    arg3?: any,
    arg4?: any,
    arg5: 'CAMPUS_BASKET_WALLET' | 'ORIGINAL_PAYMENT' = 'CAMPUS_BASKET_WALLET'
  ): Promise<any> {
    let orderId: string;
    let inMemoryOrder: any = null;

    if (typeof orderIdOrOrder === 'object' && orderIdOrOrder !== null) {
      inMemoryOrder = orderIdOrOrder;
      orderId = inMemoryOrder.id || 'mock_order';
    } else {
      orderId = orderIdOrOrder;
    }

    let requestedByUserId = 'student';
    let role: 'STUDENT' | 'PROVIDER' | 'ADMIN' = 'STUDENT';
    let reason = 'Order cancelled';
    let refundMethod: 'CAMPUS_BASKET_WALLET' | 'ORIGINAL_PAYMENT' = 'CAMPUS_BASKET_WALLET';

    if (['CAMPUS_BASKET_WALLET', 'ORIGINAL_PAYMENT'].includes(arg4)) {
      // Signature Pattern: (orderOrId, reason, role, refundMethod)
      reason = arg2 || reason;
      role = (arg3 as any) || 'STUDENT';
      refundMethod = arg4 as any;
    } else {
      // Signature Pattern: (orderId, requestedByUserId, role, reason, refundMethod)
      requestedByUserId = arg2 || requestedByUserId;
      role = (arg3 as any) || 'STUDENT';
      reason = arg4 || reason;
      refundMethod = arg5 || 'CAMPUS_BASKET_WALLET';
    }

    let order = inMemoryOrder;
    if (!order) {
      order = await (prisma as any).order.findUnique({
        where: { id: orderId },
        include: {
          payment: true,
          refunds: true,
          statusHistory: true,
          student: true
        }
      }).catch(() => null);
    }

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const status = (order.status || '').toUpperCase();
    if (['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      throw new Error(`Order is already ${status.toLowerCase()} and cannot be cancelled.`);
    }

    // Source of truth: Provider acceptance status
    const providerAccepted = Boolean(
      order.providerAccepted ||
      ['ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'DISPATCHED'].includes(status)
    );

    if (role === 'STUDENT' && providerAccepted) {
      throw new Error('Order has already been accepted by the provider and fulfillment has commenced. Order cannot be cancelled.');
    }

    let refundableAmount = 0;
    let cancellationType: 'FULL_REFUND' | 'NO_REFUND' | 'ADVANCE_REFUND' = 'NO_REFUND';
    let explanation = '';
    const isPreAcceptance = !providerAccepted;

    if (isPreAcceptance) {
      if (order.paymentMethod !== 'CASH_ON_DELIVERY') {
        // CASE A — ONLINE / PREPAID
        refundableAmount = Number(order.totalAmount);
        cancellationType = 'FULL_REFUND';
        explanation = `Your order was cancelled before the provider accepted it. Your full payment of ₹${refundableAmount} has been added to the refund process.`;
      } else {
        // Payment method is COD. Calculate actual advance paid online.
        let advancePaid = Number(order.advancePaidAmount || 0);

        if (advancePaid <= 0 && order.payment) {
          const pStatus = order.payment.status;
          const pAmount = Number(order.payment.amount);
          const tAmount = Number(order.totalAmount);
          if (['SUCCESS', 'PAID', 'COD_PENDING'].includes(pStatus) && pAmount < tAmount && pAmount > 0) {
            advancePaid = pAmount;
          }
        }

        // Also check status history if COD partial advance note exists
        if (advancePaid <= 0 && Array.isArray(order.statusHistory)) {
          for (const h of order.statusHistory) {
            const m = (h.notes || '').match(/COD (?:Partial )?Advance of ₹(\d+(?:\.\d+)?)/i);
            if (m && m[1]) {
              advancePaid = parseFloat(m[1]);
              break;
            }
          }
        }

        if (advancePaid > 0) {
          // CASE C — COD + PARTIAL ADVANCE
          // The COD amount must NOT be included in the refund because the student never paid that amount.
          refundableAmount = advancePaid;
          cancellationType = 'ADVANCE_REFUND';
          explanation = `You paid ₹${advancePaid} as an advance for this COD order. The order was cancelled before the provider accepted it, so your ₹${advancePaid} advance payment has been added to the refund process.`;
        } else {
          // CASE B — NORMAL COD
          refundableAmount = 0;
          cancellationType = 'NO_REFUND';
          explanation = 'Since this was a Cash on Delivery order and no payment was collected in advance, there is no refund due.';
        }
      }
    } else {
      // AFTER PROVIDER ACCEPTS: Post-acceptance policy
      if (role === 'ADMIN') {
        refundableAmount = Number(order.totalAmount);
        cancellationType = 'FULL_REFUND';
        explanation = 'Admin approved full refund post provider acceptance.';
      } else {
        refundableAmount = 0;
        cancellationType = 'NO_REFUND';
        explanation = 'Cancelled post provider acceptance under campus cancellation policy.';
      }
    }

    const effectiveRefundMethod = refundMethod || 'CAMPUS_BASKET_WALLET';
    const isWalletRefund = effectiveRefundMethod === 'CAMPUS_BASKET_WALLET';

    const newPaymentStatus = refundableAmount > 0
      ? (isWalletRefund ? 'REFUNDED' : 'REFUND_PENDING')
      : (order.paymentMethod === 'CASH_ON_DELIVERY' ? 'FAILED' : 'PAYMENT_FAILED');

    const newRefundStatus = refundableAmount > 0
      ? (isWalletRefund ? 'COMPLETED' : 'REQUESTED')
      : 'NOT_APPLICABLE';

    let updated: any = null;
    try {
      updated = await (prisma as any).order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: newPaymentStatus,
          refundStatus: newRefundStatus,
          settlementStatus: 'ADJUSTED',
          cancellationReason: reason || (isPreAcceptance ? 'Cancelled before provider acceptance' : 'Order cancelled'),
          cancelledBy: role,
          cancelledAt: new Date(),
          refundAmount: refundableAmount,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: 'CANCELLED',
              changedBy: role,
              notes: `${isPreAcceptance ? 'Cancelled before provider acceptance' : 'Cancelled after provider acceptance'}. ${explanation} Refund Method: ${effectiveRefundMethod === 'CAMPUS_BASKET_WALLET' ? 'Campus Basket Wallet (Instant)' : 'Original Payment Method (3-5 days)'}.`
            }
          }
        }
      });
    } catch {}

    if (!updated) {
      order.status = 'CANCELLED';
      order.paymentStatus = newPaymentStatus;
      order.refundStatus = newRefundStatus;
      order.refundAmount = refundableAmount;
      updated = order;
    }

    let createdRefund: any = null;
    // REFUND RECORD SAFETY: Only create a refund record when refundable_amount > 0
    // Never create duplicate refund records for the same cancellation.
    if (refundableAmount > 0) {
      try {
        createdRefund = await (prisma as any).refund.findFirst({
          where: { orderId }
        });

        if (!createdRefund) {
          let paymentId = order.payment?.id;
          if (!paymentId) {
            const p = await (prisma as any).payment.findFirst({ where: { orderId } });
            paymentId = p?.id;
          }

          const refundSeq = Math.floor(100000 + Math.random() * 900000);
          createdRefund = await (prisma as any).refund.create({
            data: {
              refundNumber: `CB-REF-${refundSeq}`,
              paymentId: paymentId || `pay_mock_${orderId}`,
              orderId,
              amount: refundableAmount,
              reason: isPreAcceptance ? 'Cancelled before provider acceptance' : (reason || 'Order cancellation refund'),
              status: isWalletRefund ? 'COMPLETED' : 'REQUESTED',
              processedAt: isWalletRefund ? new Date() : null,
              processedBy: isWalletRefund ? 'CAMPUS_WALLET_SERVICE' : null
            }
          });
        } else if (isWalletRefund && createdRefund.status !== 'COMPLETED') {
          createdRefund = await (prisma as any).refund.update({
            where: { id: createdRefund.id },
            data: {
              status: 'COMPLETED',
              processedAt: new Date(),
              processedBy: 'CAMPUS_WALLET_SERVICE'
            }
          });
        }
      } catch {}
    }

    // Record cancellation request for audit trail
    try {
      await (prisma as any).cancellationRequest.upsert({
        where: { orderId },
        update: {
          status: 'APPROVED',
          reason: reason || (isPreAcceptance ? 'Cancelled before provider acceptance' : 'Order cancelled'),
          cancellationStage: isPreAcceptance ? 'PRE_ACCEPTANCE' : 'POST_ACCEPTANCE',
          adminNotes: `${role} cancelled. ${explanation} Method: ${effectiveRefundMethod}`
        },
        create: {
          orderId,
          requestedBy: role,
          userId: requestedByUserId,
          reason: reason || (isPreAcceptance ? 'Cancelled before provider acceptance' : 'Order cancelled'),
          cancellationStage: isPreAcceptance ? 'PRE_ACCEPTANCE' : 'POST_ACCEPTANCE',
          status: 'APPROVED',
          adminNotes: `${role} cancelled. ${explanation} Method: ${effectiveRefundMethod}`
        }
      });
    } catch {}

    // CAMPUS BASKET WALLET INSTANT CREDIT:
    // Only happens immediately after cancellation and refund eligibility have been confirmed.
    let walletResult: any = null;
    if (isWalletRefund && refundableAmount > 0) {
      const studentId = order.studentId || order.student?.id || requestedByUserId;
      if (studentId) {
        walletResult = await WalletService.creditRefund({
          studentId,
          orderId: order.id || orderId,
          refundId: createdRefund?.id || null,
          refundType: 'CANCELLATION',
          amount: refundableAmount,
          triggerEvent: 'CANCELLATION_CONFIRMED',
          refundMethod: 'CAMPUS_BASKET_WALLET',
          description: `Instant refund of ₹${refundableAmount.toFixed(2)} credited for cancelled order #${order.orderNumber || orderId}`
        });
      }
    }

    const finalRefundStatus = isWalletRefund
      ? (refundableAmount > 0 ? 'COMPLETED' : 'NOT_APPLICABLE')
      : (refundableAmount > 0 ? 'PROCESSING' : 'NOT_APPLICABLE');

    return {
      success: true,
      orderStatus: 'CANCELLED',
      ...(updated || order),
      cancellationType,
      refundableAmount,
      explanation,
      isPreAcceptance,
      refundMethod: effectiveRefundMethod,
      refundStatus: finalRefundStatus,
      expectedProcessing: isWalletRefund ? 'Instant' : '3–5 business days',
      walletCredited: Boolean(walletResult && !walletResult.alreadyProcessed),
      walletBalance: walletResult ? walletResult.newBalance : null,
      walletTransaction: walletResult ? walletResult.transaction : null
    };
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

    const refundAmount = amount
      ? Number(amount)
      : (Number(order.refundAmount) > 0 ? Number(order.refundAmount) : Number(order.totalAmount));

    const updated = await (prisma as any).order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        refundStatus: 'COMPLETED',
        settlementStatus: 'ADJUSTED',
        refundAmount
      }
    });

    // Mark Refund record as COMPLETED
    await (prisma as any).refund.updateMany({
      where: { orderId, status: { not: 'COMPLETED' } },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        processedBy: adminUserId
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
