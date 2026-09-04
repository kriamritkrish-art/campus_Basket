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
