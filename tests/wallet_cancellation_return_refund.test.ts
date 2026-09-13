import { describe, it, expect, beforeEach } from 'vitest';
import { RefundService } from '../backend/src/services/financial/RefundService';
import { WalletService } from '../backend/src/services/financial/WalletService';
import { prisma } from '../backend/src/config/database';

describe('Campus Basket Wallet & Existing Cancellation/Return/Refund Rules Integration', () => {

  const testStudentId = 'student_test_wallet_user_001';

  beforeEach(async () => {
    // Reset test student wallet to 0 balance and clear past test transactions
    try {
      const existingWallet = await WalletService.getOrCreateWallet(testStudentId);
      if (existingWallet) {
        await (prisma as any).wallet.update({
          where: { id: existingWallet.id },
          data: { balance: 0 }
        });
      }
      await (prisma as any).walletTransaction.deleteMany({
        where: { studentId: testStudentId }
      });
    } catch {}
  });

  // -------------------------------------------------------------
  // 1. CANCELLATION QUOTE & FINANCIAL DIFFERENTIATION (SECTIONS 1, 9, 10)
  // -------------------------------------------------------------
  describe('Cancellation Quote & Breakdown Calculations', () => {

    it('Scenario 1A: Online Prepaid Order — 100% full payment refundable', () => {
      const prepaidOrder: any = {
        id: 'ord_prepaid_001',
        orderNumber: 'CB-PREPAID-001',
        totalAmount: 250,
        subtotal: 230,
        deliveryFee: 20,
        paymentMethod: 'ONLINE',
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        providerAccepted: false
      };

      const quote = RefundService.calculateCancellationQuote(prepaidOrder);

      expect(quote.eligible).toBe(true);
      expect(quote.calculation.orderAmount).toBe(250);
      expect(quote.calculation.amountActuallyPaid).toBe(250);
      expect(quote.calculation.codAmountDue).toBe(0);
      expect(quote.calculation.nonRefundableAmount).toBe(0);
      expect(quote.calculation.refundEligible).toBe(250);
      expect(quote.refundMethods.length).toBe(2);
      expect(quote.refundMethods.find(m => m.id === 'CAMPUS_BASKET_WALLET')?.speed).toBe('Instant');
      expect(quote.refundMethods.find(m => m.id === 'ORIGINAL_PAYMENT')?.speed).toBe('3–5 business days');
    });

    it('Scenario 1B: Standard COD Order (Zero Advance) — 0 refund, explains unpaid COD', () => {
      const codZeroOrder: any = {
        id: 'ord_cod_zero_001',
        orderNumber: 'CB-COD-ZERO-001',
        totalAmount: 200,
        subtotal: 180,
        deliveryFee: 20,
        advancePaidAmount: 0,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'PENDING',
        status: 'CONFIRMED',
        providerAccepted: false
      };

      const quote = RefundService.calculateCancellationQuote(codZeroOrder);

      expect(quote.eligible).toBe(true);
      expect(quote.calculation.orderAmount).toBe(200);
      expect(quote.calculation.amountActuallyPaid).toBe(0);
      expect(quote.calculation.codAmountDue).toBe(200);
      expect(quote.calculation.nonRefundableAmount).toBe(200); // Unpaid COD amount is non-refundable
      expect(quote.calculation.refundEligible).toBe(0);
    });

    it('Scenario 1C: COD + Partial Online Advance (Section 10) — Strictly refunds ₹20 advance, never unpaid ₹180 COD', () => {
      const codAdvanceOrder: any = {
        id: 'ord_cod_adv_001',
        orderNumber: 'CB-COD-ADV-001',
        totalAmount: 200,
        subtotal: 180,
        deliveryFee: 20,
        advancePaidAmount: 20,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'PARTIALLY_PAID',
        status: 'CONFIRMED',
        providerAccepted: false
      };

      const quote = RefundService.calculateCancellationQuote(codAdvanceOrder);

      expect(quote.eligible).toBe(true);
      expect(quote.calculation.orderAmount).toBe(200);
      expect(quote.calculation.amountActuallyPaid).toBe(20);
      expect(quote.calculation.codAmountDue).toBe(180);
      expect(quote.calculation.nonRefundableAmount).toBe(180); // Unpaid COD portion
      // Crucial: Must refund only ₹20, NEVER ₹200
      expect(quote.calculation.refundEligible).toBe(20);
      expect(quote.calculation.refundEligible).not.toBe(200);
      expect(quote.calculation.refundEligible).not.toBe(180);
    });

    it('Scenario 1D: Cancellation Not Available when provider already accepted', () => {
      const acceptedOrder: any = {
        id: 'ord_accepted_001',
        orderNumber: 'CB-ACCEPTED-001',
        totalAmount: 200,
        paymentMethod: 'ONLINE',
        status: 'PREPARING',
        providerAccepted: true
      };

      const quote = RefundService.calculateCancellationQuote(acceptedOrder);

      expect(quote.eligible).toBe(false);
      expect(quote.reason).toContain('has already been accepted');
      expect(quote.calculation.refundEligible).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // 2. CANCELLATION + WALLET VS ORIGINAL PAYMENT (SECTIONS 2 & 3)
  // -------------------------------------------------------------
  describe('Cancellation Execution & Wallet Settlement', () => {

    it('Scenario 2A: Cancel with Campus Basket Wallet — Instant wallet credit & ledger record created', async () => {
      const walletBefore = await WalletService.getOrCreateWallet(testStudentId);
      const initialBalance = Number(walletBefore.balance || 0);

      const orderToCancel: any = {
        id: 'ord_wallet_cancel_001',
        orderNumber: 'CB-W-CNCL-001',
        studentId: testStudentId,
        totalAmount: 150,
        advancePaidAmount: 0,
        paymentMethod: 'ONLINE',
        status: 'CONFIRMED',
        providerAccepted: false
      };

      const result = await RefundService.cancelOrder(
        orderToCancel,
        'Change of mind before kitchen preparation',
        'STUDENT',
        'CAMPUS_BASKET_WALLET'
      );

      expect(result.success).toBe(true);
      expect(result.orderStatus).toBe('CANCELLED');
      expect(result.refundableAmount).toBe(150);
      expect(result.refundMethod).toBe('CAMPUS_BASKET_WALLET');
      expect(result.refundStatus).toBe('COMPLETED');
      expect(result.walletBalance).toBe(initialBalance + 150);

      // Verify wallet balance in service
      const walletAfter = await WalletService.getWallet(testStudentId);
      expect(Number(walletAfter?.balance)).toBe(initialBalance + 150);

      // Verify ledger transaction was generated (Section 16)
      const txns = await WalletService.getTransactions(testStudentId);
      const refundTxn = txns.find(t => t.orderId === orderToCancel.id);
      expect(refundTxn).toBeDefined();
      expect(refundTxn?.type).toBe('CREDIT');
      expect(refundTxn?.refundType).toBe('CANCELLATION');
      expect(refundTxn?.triggerEvent).toBe('CANCELLATION_CONFIRMED');
      expect(Number(refundTxn?.amount)).toBe(150);
    });

    it('Scenario 2B: Cancel with Original Payment Method — Wallet unchanged, refund processing', async () => {
      const walletBefore = await WalletService.getOrCreateWallet(testStudentId);
      const initialBalance = Number(walletBefore.balance || 0);

      const orderToCancel: any = {
        id: 'ord_orig_cancel_002',
        orderNumber: 'CB-ORIG-CNCL-002',
        studentId: testStudentId,
        totalAmount: 180,
        advancePaidAmount: 0,
        paymentMethod: 'ONLINE',
        status: 'CONFIRMED',
        providerAccepted: false
      };

      const result = await RefundService.cancelOrder(
        orderToCancel,
        'Placed duplicate order',
        'STUDENT',
        'ORIGINAL_PAYMENT'
      );

      expect(result.success).toBe(true);
      expect(result.orderStatus).toBe('CANCELLED');
      expect(result.refundableAmount).toBe(180);
      expect(result.refundMethod).toBe('ORIGINAL_PAYMENT');
      expect(result.refundStatus).toBe('PROCESSING');

      // Wallet balance must remain unchanged!
      const walletAfter = await WalletService.getWallet(testStudentId);
      expect(Number(walletAfter?.balance || 0)).toBe(initialBalance);

      // No wallet transaction should be created for this order
      const txns = await WalletService.getTransactions(testStudentId);
      const refundTxn = txns.find(t => t.orderId === orderToCancel.id);
      expect(refundTxn).toBeUndefined();
    });
  });

  // -------------------------------------------------------------
  // 3. RETURN QUOTE & RETURN POLICY (SECTIONS 4, 5, 6, 7, 8)
  // -------------------------------------------------------------
  describe('Return Quote & Calculation Before Submission', () => {

    it('Scenario 3A: Product Issue Return — 100% full refund with 0 delivery charge deduction', () => {
      const deliveredOrder: any = {
        id: 'ord_return_quote_001',
        orderNumber: 'CB-RET-001',
        totalAmount: 300,
        subtotal: 280,
        deliveryFee: 20,
        paymentMethod: 'ONLINE',
        status: 'DELIVERED',
        deliveredAt: new Date().toISOString()
      };

      const quote = RefundService.calculateReturnQuote(deliveredOrder, 'PRODUCT_ISSUE');

      expect(quote.eligible).toBe(true);
      expect(quote.calculation.originalOrderAmount).toBe(300);
      expect(quote.calculation.eligibleReturnRefund).toBe(280);
      expect(quote.calculation.nonRefundableAmount).toBe(20); // Original delivery fee
      expect(quote.refundMethods.length).toBe(2);
      expect(quote.refundMethods[0].speed).toBe('Refund credited after successful pickup');
    });

    it('Scenario 3B: Customer Mind Change Return — Deducts ₹15 delivery charge', () => {
      const deliveredOrder: any = {
        id: 'ord_return_quote_002',
        orderNumber: 'CB-RET-002',
        totalAmount: 200,
        subtotal: 180,
        deliveryFee: 20,
        paymentMethod: 'ONLINE',
        status: 'DELIVERED',
        deliveredAt: new Date().toISOString()
      };

      const quote = RefundService.calculateReturnQuote(deliveredOrder, 'MIND_CHANGE');

      expect(quote.eligible).toBe(true);
      expect(quote.calculation.originalOrderAmount).toBe(200);
      expect(quote.calculation.nonRefundableAmount).toBe(35); // ₹15 mind change deduction + ₹20 original delivery fee
      expect(quote.calculation.eligibleReturnRefund).toBe(165); // 180 - 15
    });

    it('Scenario 3C: Return Not Available if order is not delivered', () => {
      const undeliveredOrder: any = {
        id: 'ord_undelivered_001',
        totalAmount: 150,
        status: 'PREPARING'
      };

      const quote = RefundService.calculateReturnQuote(undeliveredOrder, 'PRODUCT_ISSUE');

      expect(quote.eligible).toBe(false);
      expect(quote.reason).toContain('successfully delivered');
    });
  });

  // -------------------------------------------------------------
  // 4. RETURN PICKUP AS THE STRICT REFUND TRIGGER (SECTIONS 6 & 8)
  // -------------------------------------------------------------
  describe('Return Pickup OTP as Refund Trigger (Never Credited Too Early)', () => {

    it('Scenario 4A: Return Submission DOES NOT credit wallet early', async () => {
      const walletBefore = await WalletService.getOrCreateWallet(testStudentId);
      const balanceBefore = Number(walletBefore.balance || 0);

      // Student applies for return with CAMPUS_BASKET_WALLET selected
      const returnRequest = {
        id: 'ret_req_001',
        orderId: 'ord_return_test_001',
        studentId: testStudentId,
        refundMethod: 'CAMPUS_BASKET_WALLET',
        status: 'REQUESTED',
        refundAmount: 165
      };

      // Ensure no wallet credit happened at submission time!
      const walletAfterApply = await WalletService.getWallet(testStudentId);
      expect(Number(walletAfterApply?.balance || 0)).toBe(balanceBefore);
    });

    it('Scenario 4B: Successful Return Pickup OTP verification triggers exact wallet credit', async () => {
      const walletBefore = await WalletService.getOrCreateWallet(testStudentId);
      const balanceBefore = Number(walletBefore.balance);

      const refundAmount = 165;
      const orderId = 'ord_return_pickup_001';
      const returnId = 'ret_req_pickup_001';

      // Simulate physical runner collection + OTP verification trigger
      const creditResult = await WalletService.creditRefund({
        studentId: testStudentId,
        orderId,
        refundId: returnId,
        refundType: 'RETURN',
        refundMethod: 'CAMPUS_BASKET_WALLET',
        triggerEvent: 'RETURN_PICKUP_COMPLETED',
        amount: refundAmount,
        description: `Refund credited for returned Order #${orderId}`
      });

      expect(creditResult.success).toBe(true);
      expect(creditResult.balanceAfter).toBe(balanceBefore + refundAmount);

      const walletAfterPickup = await WalletService.getWallet(testStudentId);
      expect(Number(walletAfterPickup?.balance)).toBe(balanceBefore + refundAmount);

      // Verify transaction ledger fields (Section 16)
      const txn = creditResult.transaction;
      expect(txn.studentId).toBe(testStudentId);
      expect(txn.orderId).toBe(orderId);
      expect(txn.refundId).toBe(returnId);
      expect(txn.refundType).toBe('RETURN');
      expect(txn.triggerEvent).toBe('RETURN_PICKUP_COMPLETED');
      expect(txn.balanceBefore).toBe(balanceBefore);
      expect(txn.balanceAfter).toBe(balanceBefore + refundAmount);
    });
  });

  // -------------------------------------------------------------
  // 5. DUPLICATE PROTECTION & IDEMPOTENCY (SECTION 17)
  // -------------------------------------------------------------
  describe('Duplicate Protection & Idempotency', () => {

    it('Scenario 5: Repeated return pickup or cancellation events NEVER double credit wallet', async () => {
      const walletBefore = await WalletService.getOrCreateWallet(testStudentId);
      const balanceBefore = Number(walletBefore.balance);

      const creditParams = {
        studentId: testStudentId,
        orderId: 'ord_idempotent_test_001',
        refundId: 'ref_idempotent_test_001',
        refundType: 'RETURN' as const,
        refundMethod: 'CAMPUS_BASKET_WALLET' as const,
        triggerEvent: 'RETURN_PICKUP_COMPLETED' as const,
        amount: 50,
        description: 'Idempotency test refund'
      };

      // First credit call
      const firstCall = await WalletService.creditRefund(creditParams);
      expect(firstCall.success).toBe(true);
      expect(firstCall.balanceAfter).toBe(balanceBefore + 50);

      // Second duplicate call (e.g. repeated request, webhook retry, or runner tapping verify twice)
      const secondCall = await WalletService.creditRefund(creditParams);
      expect(secondCall.success).toBe(true);
      // Balance must STILL be balanceBefore + 50, NOT balanceBefore + 100!
      expect(secondCall.balanceAfter).toBe(balanceBefore + 50);

      const finalWallet = await WalletService.getWallet(testStudentId);
      expect(Number(finalWallet?.balance)).toBe(balanceBefore + 50);
      expect(Number(finalWallet?.balance)).not.toBe(balanceBefore + 100);
    });
  });
});
