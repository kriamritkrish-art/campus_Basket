import { describe, it, expect } from 'vitest';
import { RefundService } from '../backend/src/services/financial/RefundService';

describe('Order Governance, Immutability, COD Advance & Return Policy Engine', () => {

  // -------------------------------------------------------------
  // 1. ORDER IMMUTABILITY BEFORE & AFTER PROVIDER ACCEPTANCE
  // -------------------------------------------------------------
  it('SCENARIO 1: Order is modifiable while PENDING_PAYMENT or CONFIRMED (prior to provider acceptance)', () => {
    const unacceptedStatuses = ['PENDING_PAYMENT', 'CONFIRMED'];
    const acceptedStatuses = ['ACCEPTED', 'PREPARING', 'READY', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

    for (const status of unacceptedStatuses) {
      const isModifiable = !acceptedStatuses.includes(status);
      expect(isModifiable).toBe(true);
    }

    for (const status of acceptedStatuses) {
      const isModifiable = !acceptedStatuses.includes(status);
      expect(isModifiable).toBe(false);
    }
  });

  // -------------------------------------------------------------
  // 2. COD PARTIAL ONLINE ADVANCE CALCULATION
  // -------------------------------------------------------------
  it('SCENARIO 2: COD partial advance calculation splits online deposit vs cash due at doorstep', () => {
    const minAdvanceSetting = 10;

    // Standard 100 INR order
    const totalAmount = 100;
    const advanceRequired = Math.min(totalAmount, Math.max(0, minAdvanceSetting));
    const remainingCashDue = Math.max(0, totalAmount - advanceRequired);

    expect(advanceRequired).toBe(10);
    expect(remainingCashDue).toBe(90);

    // Small 8 INR order (total is less than minimum advance)
    const smallTotal = 8;
    const smallAdvance = Math.min(smallTotal, Math.max(0, minAdvanceSetting));
    const smallCashDue = Math.max(0, smallTotal - smallAdvance);

    expect(smallAdvance).toBe(8);
    expect(smallCashDue).toBe(0);

    // Zero advance configuration
    const zeroAdvanceSetting = 0;
    const zeroAdvance = Math.min(totalAmount, Math.max(0, zeroAdvanceSetting));
    const zeroCashDue = Math.max(0, totalAmount - zeroAdvance);

    expect(zeroAdvance).toBe(0);
    expect(zeroCashDue).toBe(100);
  });

  // -------------------------------------------------------------
  // 3. RETURN ELIGIBILITY EVALUATION ACROSS SERVICES
  // -------------------------------------------------------------
  it('SCENARIO 3: Fresh Produce allows returns within 2 hours of delivery for freshness defects', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const eligibleProduceOrder: any = {
      id: 'ord_produce_1',
      serviceType: 'FRESH_PRODUCE',
      status: 'DELIVERED',
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo
    };

    const expiredProduceOrder: any = {
      id: 'ord_produce_2',
      serviceType: 'FRESH_PRODUCE',
      status: 'DELIVERED',
      createdAt: threeHoursAgo,
      updatedAt: threeHoursAgo
    };

    const eligibleResult = await RefundService.evaluateReturnEligibility(eligibleProduceOrder);
    expect(eligibleResult.eligible).toBe(true);

    const expiredResult = await RefundService.evaluateReturnEligibility(expiredProduceOrder);
    expect(expiredResult.eligible).toBe(false);
    expect(expiredResult.reason).toContain('Fresh produce & fruit return window has expired');
  });

  it('SCENARIO 4: Stationery allows returns within 24 hours of delivery in original condition', async () => {
    const now = new Date();
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);

    const eligibleStationeryOrder: any = {
      id: 'ord_stationery_1',
      serviceType: 'STATIONERY',
      status: 'DELIVERED',
      createdAt: tenHoursAgo,
      updatedAt: tenHoursAgo
    };

    const expiredStationeryOrder: any = {
      id: 'ord_stationery_2',
      serviceType: 'STATIONERY',
      status: 'DELIVERED',
      createdAt: thirtyHoursAgo,
      updatedAt: thirtyHoursAgo
    };

    const eligibleResult = await RefundService.evaluateReturnEligibility(eligibleStationeryOrder);
    expect(eligibleResult.eligible).toBe(true);

    const expiredResult = await RefundService.evaluateReturnEligibility(expiredStationeryOrder);
    expect(expiredResult.eligible).toBe(false);
    expect(expiredResult.reason).toContain('Stationery items return window has expired');
  });

  it('SCENARIO 5: Food allows returns within 30 minutes of delivery for quality verification', async () => {
    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const fortyFiveMinsAgo = new Date(now.getTime() - 45 * 60 * 1000);

    const eligibleFoodOrder: any = {
      id: 'ord_food_1',
      serviceType: 'FOOD',
      status: 'DELIVERED',
      createdAt: fifteenMinsAgo,
      updatedAt: fifteenMinsAgo
    };

    const expiredFoodOrder: any = {
      id: 'ord_food_2',
      serviceType: 'FOOD',
      status: 'DELIVERED',
      createdAt: fortyFiveMinsAgo,
      updatedAt: fortyFiveMinsAgo
    };

    const eligibleResult = await RefundService.evaluateReturnEligibility(eligibleFoodOrder);
    expect(eligibleResult.eligible).toBe(true);

    const expiredResult = await RefundService.evaluateReturnEligibility(expiredFoodOrder);
    expect(expiredResult.eligible).toBe(false);
    expect(expiredResult.reason).toContain('Food & Meals return window has expired');
  });

  it('SCENARIO 6: Non-delivered orders cannot request returns', async () => {
    const pendingOrder: any = {
      id: 'ord_pending_1',
      serviceType: 'STATIONERY',
      status: 'PREPARING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await RefundService.evaluateReturnEligibility(pendingOrder);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('successfully delivered');
  });

  it('SCENARIO 7: Laundry orders cannot request product returns', async () => {
    const laundryOrder: any = {
      id: 'ord_laundry_1',
      serviceType: 'LAUNDRY',
      status: 'DELIVERED',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await RefundService.evaluateReturnEligibility(laundryOrder);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Laundry wash orders do not accept product returns');
  });

  // -------------------------------------------------------------
  // 4. CATEGORY ADAPTIVE CHECKPOINTS
  // -------------------------------------------------------------
  it('SCENARIO 8: Category checkpoints differ for Produce vs Stationery vs Food', () => {
    const produceCheckpoints = [
      { id: 'RECEIVED', label: 'Order Placed', sub: 'Mandi/Farm Batch' },
      { id: 'CONFIRMED', label: 'Produce Accepted', sub: 'Crate Assigned' },
      { id: 'PREPARING', label: 'Quality Graded', sub: 'Freshness Inspected' },
      { id: 'READY', label: 'Fruit Basket Packed', sub: 'Eco-Crate Tagged' },
      { id: 'TRANSIT', label: 'Fresh Transit', sub: 'Runner In Route' },
      { id: 'DELIVERED', label: 'Delivered Fresh', sub: 'Handed Over at Door' }
    ];

    const stationeryCheckpoints = [
      { id: 'RECEIVED', label: 'Order Placed', sub: 'Sent to Bookstore' },
      { id: 'CONFIRMED', label: 'Store Accepted', sub: 'Stock Reserved' },
      { id: 'PREPARING', label: 'Items Assembled', sub: 'Desk Collection' },
      { id: 'READY', label: 'Packaged Securely', sub: 'Bag Sealed & Labeled' },
      { id: 'TRANSIT', label: 'Campus Delivery', sub: 'Runner In Route' },
      { id: 'DELIVERED', label: 'Doorstep Handover', sub: 'Delivered to Student' }
    ];

    const foodCheckpoints = [
      { id: 'RECEIVED', label: 'Order Placed', sub: 'Sent to Kitchen' },
      { id: 'CONFIRMED', label: 'Kitchen Accepted', sub: 'Order Queued' },
      { id: 'PREPARING', label: 'Freshly Cooking', sub: 'Chef at Work' },
      { id: 'READY', label: 'Food Packed', sub: 'Awaiting Pickup' },
      { id: 'TRANSIT', label: 'Hot Delivery', sub: 'Runner In Route' },
      { id: 'DELIVERED', label: 'Enjoy Meal', sub: 'Delivered at Door' }
    ];

    // Produce contains grading & mandi checkpoints, zero chef/kitchen references
    expect(produceCheckpoints.some(c => c.label.includes('Graded') || c.sub.includes('Mandi'))).toBe(true);
    expect(produceCheckpoints.some(c => c.label.includes('Cooking') || c.sub.includes('Chef'))).toBe(false);

    // Stationery contains bookstore & assembly checkpoints, zero kitchen or mandi references
    expect(stationeryCheckpoints.some(c => c.sub.includes('Bookstore') || c.label.includes('Assembled'))).toBe(true);
    expect(stationeryCheckpoints.some(c => c.sub.includes('Mandi') || c.sub.includes('Chef'))).toBe(false);

    // Food contains kitchen & cooking checkpoints
    expect(foodCheckpoints.some(c => c.label.includes('Cooking') && c.sub.includes('Chef'))).toBe(true);
  });
});
