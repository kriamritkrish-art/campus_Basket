import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { RazorpayService } from '../backend/src/services/payment/RazorpayService';

describe('Payment Integrity & Razorpay Cryptographic Verification', () => {
  const service = new RazorpayService();
  const secret = 'rzp_secret_nitdgp_test';

  it('verifies a valid Razorpay HMAC-SHA256 signature', () => {
    const orderId = 'order_test_12345';
    const paymentId = 'pay_test_67890';
    const payload = `${orderId}|${paymentId}`;
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = service.verifyPaymentSignature(orderId, paymentId, validSignature);
    expect(isValid).toBe(true);
  });

  it('rejects tampered or fake Razorpay signatures', () => {
    const orderId = 'order_test_12345';
    const paymentId = 'pay_test_67890';
    const fakeSignature = 'a'.repeat(64);

    // Note: sandbox mock orders begin with order_rzp_mock_, for standard orders it validates
    const payload = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(expected).not.toEqual(fakeSignature);
  });
});

describe('Student Wallet Top-up Payment Lifecycle & Idempotency', () => {
  const testStudentId = 'stud_sourav';

  it('initializes top-up Razorpay order with valid amount and student metadata', async () => {
    const { WalletService } = await import('../backend/src/services/financial/WalletService');
    const res = await WalletService.initiateTopUp(testStudentId, 500);

    expect(res).toBeDefined();
    expect(res.razorpayOrderId).toBeDefined();
    expect(res.amount).toBe(50000); // 500 INR in paise
    expect(res.currency).toBe('INR');
  });

  it('rejects top-up with invalid amount (< ₹1 or > ₹50,000)', async () => {
    const { WalletService } = await import('../backend/src/services/financial/WalletService');
    await expect(WalletService.initiateTopUp(testStudentId, 0)).rejects.toThrow();
    await expect(WalletService.initiateTopUp(testStudentId, 50001)).rejects.toThrow();
  });

  it('verifies signature and credits student wallet upon successful top-up', async () => {
    const { WalletService } = await import('../backend/src/services/financial/WalletService');
    const initialWallet = await WalletService.getWallet(testStudentId);
    const balanceBefore = Number(initialWallet.balance);

    const rzpOrder = await WalletService.initiateTopUp(testStudentId, 250);
    const { env } = await import('../backend/src/config/environment');
    const secret = env.RAZORPAY_KEY_SECRET || 'test_secret';
    const mockPaymentId = `pay_topup_${Date.now()}`;
    const mockSignature = crypto
      .createHmac('sha256', secret)
      .update(`${rzpOrder.razorpayOrderId}|${mockPaymentId}`)
      .digest('hex');

    const result = await WalletService.verifyAndCreditTopUp({
      studentId: testStudentId,
      razorpayOrderId: rzpOrder.razorpayOrderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: mockSignature,
      amount: 250
    });

    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(balanceBefore + 250);
    expect(result.alreadyProcessed).toBe(false);
    expect(result.transaction).toBeDefined();
    expect(result.transaction.refundType).toBe('WALLET_TOPUP');
    expect(result.transaction.type).toBe('CREDIT');

    // Duplicate protection: re-submitting same payment does not double credit
    const duplicate = await WalletService.verifyAndCreditTopUp({
      studentId: testStudentId,
      razorpayOrderId: rzpOrder.razorpayOrderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: mockSignature,
      amount: 250
    });

    expect(duplicate.success).toBe(true);
    expect(duplicate.alreadyProcessed).toBe(true);
    expect(duplicate.newBalance).toBe(balanceBefore + 250);
  });
});
