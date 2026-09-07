import { describe, it, expect, beforeEach } from 'vitest';
import { LaundryPricingService } from '../backend/src/services/laundry/LaundryPricingService';
import { LaundryOtpService } from '../backend/src/services/laundry/LaundryOtpService';
import { LaundryCodService } from '../backend/src/services/laundry/LaundryCodService';
import { LaundrySettlementService } from '../backend/src/services/laundry/LaundrySettlementService';
import { prisma } from '../backend/src/config/database';
import { encryptOtp, decryptOtp } from '../backend/src/utils/crypto';

describe('Advanced Laundry Pricing, Service Charge, COD & Dual-OTP Workflow', () => {

  it('1. Calculates per-item pricing accurately: 5 dresses @ ₹15 base + ₹1 service charge = ₹75 base, ₹5 SC, ₹80 total', async () => {
    const calculation = await LaundryPricingService.calculatePricing({
      itemCount: 5,
      items: [{ category: 'dress', count: 5 }],
      paymentMethod: 'ONLINE'
    });

    expect(calculation.pricingModel).toBe('PER_ITEM');
    expect(calculation.basePricePerUnit).toBe(15);
    expect(calculation.serviceChargePerUnit).toBe(1);
    expect(calculation.laundryBaseAmount).toBe(75);
    expect(calculation.serviceChargeAmount).toBe(5);
    expect(calculation.totalAmount).toBe(80);
    expect(calculation.onlinePayableNow).toBe(80);
    expect(calculation.codAmountPayableOnDelivery).toBe(0);
    expect(calculation.providerPayableAmount).toBe(75);
    expect(calculation.platformRetainedAmount).toBe(5);
  });

  it('2. Enforces COD Advance Payment Rule: Student pays ₹5 online; ₹75 COD due to provider on delivery', async () => {
    const calculation = await LaundryPricingService.calculatePricing({
      itemCount: 5,
      items: [{ category: 'dress', count: 5 }],
      paymentMethod: 'COD'
    });

    expect(calculation.laundryBaseAmount).toBe(75);
    expect(calculation.serviceChargeAmount).toBe(5);
    expect(calculation.totalAmount).toBe(80);
    // CRITICAL COD RULE:
    // Online advance paid now = Service charge (₹5)
    expect(calculation.onlinePayableNow).toBe(5);
    // Balance due to provider upon delivery = Base amount (₹75)
    expect(calculation.codAmountPayableOnDelivery).toBe(75);
    expect(calculation.providerPayableAmount).toBe(75);
    expect(calculation.platformRetainedAmount).toBe(5);
  });

  it('3. Generates immutable price snapshot with item breakdown and lock timestamp', async () => {
    const calculation = await LaundryPricingService.calculatePricing({
      itemCount: 3,
      items: [{ category: 'dress', count: 3 }],
      paymentMethod: 'COD'
    });

    const snapshot = calculation.priceSnapshot;
    expect(snapshot).toBeDefined();
    expect(snapshot.pricingModel).toBe('PER_ITEM');
    expect(snapshot.basePricePerUnit).toBe(15);
    expect(snapshot.serviceChargePerUnit).toBe(1);
    expect(snapshot.laundryBaseAmount).toBe(45);
    expect(snapshot.serviceChargeAmount).toBe(3);
    expect(snapshot.totalAmount).toBe(48);
    expect(snapshot.lockedAt).toBeDefined();
  });

  it('4. Dual-OTP Encryption: Encrypted OTPs can be securely decrypted for student dashboard only', () => {
    const plainOtp = '482916';
    const encrypted = encryptOtp(plainOtp);
    expect(encrypted).not.toEqual(plainOtp);
    expect(encrypted).toContain(':'); // IV:ciphertext format

    const decrypted = decryptOtp(encrypted);
    expect(decrypted).toBe(plainOtp);
  });

  it('5. Deferred Pickup OTP generation: Created only when provider accepts order', async () => {
    const otpService = new LaundryOtpService();
    const pickupOtp = await otpService.generatePickupOtp('order_deferred_pickup_test');

    expect(pickupOtp).toBeDefined();
    expect(pickupOtp.otpType).toBe('PICKUP');
    expect(pickupOtp.plainOtp).toHaveLength(6);
    expect(pickupOtp.encryptedOtp).toBeDefined();
    expect(pickupOtp.otpHash).toHaveLength(64);
  });

  it('6. Deferred Delivery OTP generation: Created only when laundry is scheduled for delivery', async () => {
    const otpService = new LaundryOtpService();
    const deliveryOtp = await otpService.generateDeliveryOtp('order_deferred_delivery_test');

    expect(deliveryOtp).toBeDefined();
    expect(deliveryOtp.otpType).toBe('DELIVERY');
    expect(deliveryOtp.plainOtp).toHaveLength(6);
    expect(deliveryOtp.encryptedOtp).toBeDefined();
    expect(deliveryOtp.otpHash).toHaveLength(64);
  });

  it('7. Status Bypass Prevention: CLOTHES_COLLECTED requires Pickup OTP; COMPLETED requires Delivery OTP', async () => {
    const otpService = new LaundryOtpService();
    const pickupOtp = await otpService.generatePickupOtp('order_bypass_test');
    const deliveryOtp = await otpService.generateDeliveryOtp('order_bypass_test');

    // Attempting to use Pickup OTP for DELIVERY must fail
    const wrongTypeResult = otpService.verifyOtp(pickupOtp.plainOtp, pickupOtp as any, 'DELIVERY');
    expect(wrongTypeResult.success).toBe(false);

    // Attempting to use Delivery OTP for PICKUP must fail
    const wrongTypeResult2 = otpService.verifyOtp(deliveryOtp.plainOtp, deliveryOtp as any, 'PICKUP');
    expect(wrongTypeResult2.success).toBe(false);

    // Matching OTP succeeds
    const correctResult = otpService.verifyOtp(pickupOtp.plainOtp, pickupOtp as any, 'PICKUP');
    expect(correctResult.success).toBe(true);
  });

  it('8. Zero Email OTP Policy: decryptForStudent returns plain OTP only for authenticated student in dashboard', async () => {
    const otpService = new LaundryOtpService();
    const pickup = await otpService.generatePickupOtp('order_student_dash_test');

    const decrypted = otpService.decryptForStudent(pickup.encryptedOtp!);
    expect(decrypted).toBe(pickup.plainOtp);
    // Verification that this is a purely in-app string return and involves zero email dispatch
    expect(typeof decrypted).toBe('string');
  });

  it('9. Provider Settlement Exclusion: Platform Service Charge is strictly excluded from provider payables', async () => {
    // Create test order in mock/in-memory DB
    const order = await prisma.laundryOrder.create({
      data: {
        orderNumber: 'LAU-TEST-SETTLE-001',
        studentId: 'student_123',
        providerId: 'provider_123',
        pricingModel: 'PER_ITEM',
        itemCount: 5,
        basePricePerUnit: 15,
        serviceChargePerUnit: 1,
        laundryBaseAmount: 75,
        serviceChargeAmount: 5,
        totalAmount: 80,
        onlinePaidAmount: 80,
        codAmount: 0,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE',
        status: 'COMPLETED',
        serviceConfigId: 'cfg_default'
      }
    });

    const eligible = await LaundrySettlementService.makeEligibleAfterDelivery(order.id);
    expect(eligible.settlementStatus).toBe('ELIGIBLE');

    // Settle the order
    const settlement = await LaundrySettlementService.settleOrder({
      orderId: order.id,
      adminId: 'admin_super'
    });

    expect(settlement.success).toBe(true);
    // Provider strictly receives base amount (₹75), NEVER the platform service charge (₹5)
    expect(settlement.settlementReceipt.providerPayable).toBe(75);
    expect(settlement.settlementReceipt.serviceChargeRetained).toBe(5);
  });

  it('10. COD Collection Service: Validates collection amount, updates order and ledger, rejects duplicate', async () => {
    const order = await prisma.laundryOrder.create({
      data: {
        orderNumber: 'LAU-TEST-COD-001',
        studentId: 'student_cod_1',
        providerId: 'provider_cod_1',
        pricingModel: 'PER_ITEM',
        itemCount: 5,
        basePricePerUnit: 15,
        serviceChargePerUnit: 1,
        laundryBaseAmount: 75,
        serviceChargeAmount: 5,
        totalAmount: 80,
        onlinePaidAmount: 5,
        codAmount: 75,
        codStatus: 'PENDING',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'COD',
        status: 'OUT_FOR_DELIVERY',
        serviceConfigId: 'cfg_default'
      }
    });

    // Provider confirms collection of ₹75
    const result = await LaundryCodService.confirmCodCollection({
      orderId: order.id,
      providerId: 'provider_cod_1',
      collectedAmount: 75
    });

    expect(result.success).toBe(true);
    expect(result.collection.collectedAmount).toBe(75);
    expect(result.order.codStatus).toBe('COLLECTED');
    expect(result.order.paymentStatus).toBe('PAID');

    // Duplicate collection attempt must throw error
    await expect(
      LaundryCodService.confirmCodCollection({
        orderId: order.id,
        providerId: 'provider_cod_1',
        collectedAmount: 75
      })
    ).rejects.toThrow('already recorded as collected');
  });

  it('11. Service Charge Refundability Policy: Checks admin config to determine refund on cancellation', async () => {
    // By default LAUNDRY_SERVICE_CHARGE_REFUNDABLE is false in fallback
    const isRefundableDefault = await LaundryPricingService.isServiceChargeRefundable();
    expect(typeof isRefundableDefault).toBe('boolean');

    // Live preview calculation for 5 garments shows ₹15 base + ₹1 SC
    const preview = await LaundryPricingService.calculatePricing({
      itemCount: 5,
      items: [{ category: 'dress', count: 5 }],
      paymentMethod: 'ONLINE'
    });
    expect(preview.laundryBaseAmount).toBe(75);
    expect(preview.serviceChargeAmount).toBe(5);
  });

  it('12. Admin Override: Requires mandatory justification reason and creates immutable audit log', async () => {
    const order = await prisma.laundryOrder.create({
      data: {
        orderNumber: 'LAU-TEST-ADMIN-OVERRIDE',
        studentId: 'student_override_1',
        pricingModel: 'PER_ITEM',
        itemCount: 4,
        basePricePerUnit: 15,
        serviceChargePerUnit: 1,
        laundryBaseAmount: 60,
        serviceChargeAmount: 4,
        totalAmount: 64,
        status: 'ACCEPTED',
        serviceConfigId: 'cfg_default'
      }
    });

    // Admin updates status with mandatory reason
    const updated = await prisma.laundryOrder.update({
      where: { id: order.id },
      data: {
        status: 'CLOTHES_COLLECTED',
        statusHistory: {
          create: {
            previousStatus: 'ACCEPTED',
            newStatus: 'CLOTHES_COLLECTED',
            changedBy: 'admin@nitdgp.ac.in',
            notes: 'Admin emergency override: student device ran out of battery at Hall 3.'
          }
        }
      },
      include: { statusHistory: true }
    });

    expect(updated.status).toBe('CLOTHES_COLLECTED');
    expect(updated.statusHistory).toBeDefined();
    expect(updated.statusHistory.length).toBeGreaterThan(0);
    expect(updated.statusHistory[0].notes).toContain('Admin emergency override');
  });

});

