import { describe, it, expect } from 'vitest';
import { LaundryOtpService, LaundryOtpRecord } from '../backend/src/services/laundry/LaundryOtpService';
import { hashOtp } from '../backend/src/utils/crypto';

describe('Dual-OTP Campus Laundry Workflow', () => {
  const service = new LaundryOtpService();

  it('generates two distinct, valid 6-digit OTPs for pickup and delivery', () => {
    const pickup = service.generateOtp('LAU-2026-TEST', 'PICKUP');
    const delivery = service.generateOtp('LAU-2026-TEST', 'DELIVERY');

    expect(pickup.plainOtp).toHaveLength(6);
    expect(delivery.plainOtp).toHaveLength(6);
    // Highly improbable to be identical
    expect(pickup.plainOtp).not.toEqual(delivery.plainOtp);
    expect(pickup.otpHash).toHaveLength(64);
    expect(delivery.otpHash).toHaveLength(64);
  });

  it('CRITICAL: Pickup OTP cannot verify delivery', () => {
    const pickupPlain = '123456';
    const pickupRecord: LaundryOtpRecord = {
      id: 'otp_1',
      laundryOrderId: 'order_1',
      otpType: 'PICKUP',
      otpHash: hashOtp(pickupPlain),
      isUsed: false,
      attempts: 0,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date()
    };

    // Attempting to use Pickup OTP to verify Delivery must fail
    const result = service.verifyOtp(pickupPlain, pickupRecord, 'DELIVERY');
    expect(result.success).toBe(false);
    expect(result.message).toContain('A PICKUP OTP cannot be used to verify DELIVERY');
  });

  it('CRITICAL: Delivery OTP cannot verify pickup', () => {
    const deliveryPlain = '654321';
    const deliveryRecord: LaundryOtpRecord = {
      id: 'otp_2',
      laundryOrderId: 'order_1',
      otpType: 'DELIVERY',
      otpHash: hashOtp(deliveryPlain),
      isUsed: false,
      attempts: 0,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date()
    };

    // Attempting to use Delivery OTP to verify Pickup must fail
    const result = service.verifyOtp(deliveryPlain, deliveryRecord, 'PICKUP');
    expect(result.success).toBe(false);
    expect(result.message).toContain('A DELIVERY OTP cannot be used to verify PICKUP');
  });

  it('verifies correct OTP with matching type and marks successful', () => {
    const plain = '987654';
    const record: LaundryOtpRecord = {
      id: 'otp_3',
      laundryOrderId: 'order_1',
      otpType: 'PICKUP',
      otpHash: hashOtp(plain),
      isUsed: false,
      attempts: 0,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date()
    };

    const result = service.verifyOtp(plain, record, 'PICKUP');
    expect(result.success).toBe(true);
  });

  it('prevents reuse of an already used OTP', () => {
    const plain = '987654';
    const record: LaundryOtpRecord = {
      id: 'otp_4',
      laundryOrderId: 'order_1',
      otpType: 'PICKUP',
      otpHash: hashOtp(plain),
      isUsed: true, // already consumed
      attempts: 0,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date()
    };

    const result = service.verifyOtp(plain, record, 'PICKUP');
    expect(result.success).toBe(false);
    expect(result.message).toContain('already been used');
  });

  it('rejects expired OTPs', () => {
    const plain = '987654';
    const record: LaundryOtpRecord = {
      id: 'otp_5',
      laundryOrderId: 'order_1',
      otpType: 'PICKUP',
      otpHash: hashOtp(plain),
      isUsed: false,
      attempts: 0,
      expiresAt: new Date(Date.now() - 1000), // in the past
      createdAt: new Date(Date.now() - 600000)
    };

    const result = service.verifyOtp(plain, record, 'PICKUP');
    expect(result.success).toBe(false);
    expect(result.message).toContain('expired');
  });
});
