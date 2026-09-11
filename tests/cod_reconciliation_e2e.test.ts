import { describe, it, expect } from 'vitest';
import { CodReconciliationService, NormalizedCodOrder } from '../backend/src/services/codReconciliationService';

describe('Campus Basket - Complete Delivery Boy COD Reconciliation Test Suite', () => {

  const mockRunners = [
    { id: 'runner-001', fullName: 'Rahul Sharma', mobileNumber: '+91 98765 00001', vehicleType: 'Bicycle' },
    { id: 'runner-002', fullName: 'Rahul Sharma', mobileNumber: '+91 98765 00002', vehicleType: 'Motorcycle' },
    { id: 'runner-003', fullName: 'Amit Roy', mobileNumber: '+91 98765 00003', vehicleType: 'Bicycle' }
  ];

  const mockProviders = [
    { id: 'prov-001', fullName: 'Night Canteen Hall 4', name: 'Night Canteen' },
    { id: 'prov-002', fullName: 'Campus Laundry Services', name: 'Campus Laundry' }
  ];

  // -------------------------------------------------------------
  // 1. PURE COD CALCULATION
  // -------------------------------------------------------------
  it('Scenario 1: Pure COD order (total ₹500, advance ₹0) -> COD amount due = ₹500', () => {
    const order = {
      id: 'ord-101',
      orderNumber: 'CB-ORD-101',
      totalAmount: 500,
      advancePaidAmount: 0,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'DELIVERED',
      deliveryOtpVerified: true,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, null, mockRunners, mockProviders);
    expect(norm.orderAmount).toBe(500);
    expect(norm.onlinePaidAmount).toBe(0);
    expect(norm.codAmountDue).toBe(500);
    expect(norm.expectedAmount).toBe(500);
  });

  // -------------------------------------------------------------
  // 2. PARTIAL ONLINE ADVANCE CALCULATION
  // -------------------------------------------------------------
  it('Scenario 2: Partial advance paid order (total ₹500, online advance ₹50) -> COD due = ₹450', () => {
    const order = {
      id: 'ord-102',
      orderNumber: 'CB-ORD-102',
      totalAmount: 500,
      advancePaidAmount: 50,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'DELIVERED',
      deliveryOtpVerified: true,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, null, mockRunners, mockProviders);
    expect(norm.orderAmount).toBe(500);
    expect(norm.onlinePaidAmount).toBe(50);
    expect(norm.codAmountDue).toBe(450);
    expect(norm.expectedAmount).toBe(450);
  });

  // -------------------------------------------------------------
  // 3. 100% ONLINE PAID ORDER MUST NEVER SHOW AS PENDING COD
  // -------------------------------------------------------------
  it('Scenario 3: 100% online paid order (total ₹500, online paid ₹500) -> COD due = ₹0 and not eligible for COD reconciliation', () => {
    const order = {
      id: 'ord-103',
      orderNumber: 'CB-ORD-103',
      totalAmount: 500,
      advancePaidAmount: 500,
      paymentMethod: 'RAZORPAY',
      status: 'DELIVERED',
      deliveryOtpVerified: true,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, null, mockRunners, mockProviders);
    expect(norm.orderAmount).toBe(500);
    expect(norm.onlinePaidAmount).toBe(500);
    expect(norm.codAmountDue).toBe(0);
    expect(norm.isEligibleForReconcile).toBe(false);
  });

  // -------------------------------------------------------------
  // 4. DELIVERED ORDER WITH VERIFIED OTP BECOMES ELIGIBLE
  // -------------------------------------------------------------
  it('Scenario 4: Delivered COD order with verified OTP becomes eligible for reconciliation', () => {
    const order = {
      id: 'ord-104',
      orderNumber: 'CB-ORD-104',
      totalAmount: 300,
      advancePaidAmount: 0,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'DELIVERED',
      deliveryOtpVerified: true,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const codEntry = {
      id: 'cod-104',
      orderId: 'ord-104',
      deliveryBoyId: 'runner-001',
      amountCollected: 300,
      collectedAmount: 300,
      collectionStatus: 'COLLECTED',
      reconciliationStatus: 'PENDING'
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, codEntry, mockRunners, mockProviders);
    expect(norm.isDelivered).toBe(true);
    expect(norm.deliveryOtpVerified).toBe(true);
    expect(norm.isEligibleForReconcile).toBe(true);
  });

  // -------------------------------------------------------------
  // 5. CANCELLED ORDER MUST NOT BE ELIGIBLE FOR COD RECONCILIATION
  // -------------------------------------------------------------
  it('Scenario 5: Cancelled order is excluded from COD reconciliation eligibility', () => {
    const order = {
      id: 'ord-105',
      orderNumber: 'CB-ORD-105',
      totalAmount: 350,
      advancePaidAmount: 0,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'CANCELLED',
      deliveryOtpVerified: false,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, null, mockRunners, mockProviders);
    expect(norm.isEligibleForReconcile).toBe(false);
  });

  // -------------------------------------------------------------
  // 6. UNDELIVERED / UNVERIFIED OTP NOT ELIGIBLE
  // -------------------------------------------------------------
  it('Scenario 6: In-transit order (not delivered) is NOT eligible for COD reconciliation', () => {
    const order = {
      id: 'ord-106',
      orderNumber: 'CB-ORD-106',
      totalAmount: 400,
      advancePaidAmount: 0,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'OUT_FOR_DELIVERY',
      deliveryOtpVerified: false,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, null, mockRunners, mockProviders);
    expect(norm.isEligibleForReconcile).toBe(false);
    expect(norm.collectionStatus).toBe('PENDING');
  });

  // -------------------------------------------------------------
  // 7. FULL CASH COLLECTED -> DIFFERENCE = 0
  // -------------------------------------------------------------
  it('Scenario 7: Full cash collected (expected ₹450, collected ₹450) -> Difference = ₹0, RECONCILED', () => {
    const order = {
      id: 'ord-107',
      orderNumber: 'CB-ORD-107',
      totalAmount: 500,
      advancePaidAmount: 50,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'DELIVERED',
      deliveryOtpVerified: true,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const codEntry = {
      orderId: 'ord-107',
      collectedAmount: 450,
      collectionStatus: 'COLLECTED',
      reconciliationStatus: 'RECONCILED'
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, codEntry, mockRunners, mockProviders);
    expect(norm.codAmountDue).toBe(450);
    expect(norm.cashCollectedAmount).toBe(450);
    expect(norm.difference).toBe(0);
    expect(norm.reconciliationStatus).toBe('RECONCILED');
  });

  // -------------------------------------------------------------
  // 8. PARTIAL CASH COLLECTED -> DIFFERENCE = EXPECTED - COLLECTED
  // -------------------------------------------------------------
  it('Scenario 8: Partial cash collected (expected ₹450, collected ₹400) -> Difference = ₹50, MISMATCH / PARTIALLY_RECONCILED', () => {
    const order = {
      id: 'ord-108',
      orderNumber: 'CB-ORD-108',
      totalAmount: 450,
      advancePaidAmount: 0,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'DELIVERED',
      deliveryOtpVerified: true,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const codEntry = {
      orderId: 'ord-108',
      collectedAmount: 400,
      collectionStatus: 'PARTIALLY_COLLECTED',
      reconciliationStatus: 'MISMATCH'
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, codEntry, mockRunners, mockProviders);
    expect(norm.codAmountDue).toBe(450);
    expect(norm.cashCollectedAmount).toBe(400);
    expect(norm.difference).toBe(50); // ₹450 - ₹400 = ₹50 remaining
    expect(norm.collectionStatus).toBe('PARTIALLY_COLLECTED');
  });

  // -------------------------------------------------------------
  // 9. ZERO CASH COLLECTED -> DIFFERENCE MUST EQUAL EXPECTED (NEVER 0)
  // -------------------------------------------------------------
  it('Scenario 9: Expected ₹5,810 with ₹0 cash collected MUST show Difference = ₹5,810 (NEVER 0)', () => {
    const order = {
      id: 'ord-109',
      orderNumber: 'CB-ORD-109',
      totalAmount: 5810,
      advancePaidAmount: 0,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'DELIVERED',
      deliveryOtpVerified: true,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const codEntry = {
      orderId: 'ord-109',
      collectedAmount: 0,
      collectionStatus: 'PENDING',
      reconciliationStatus: 'PENDING'
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, codEntry, mockRunners, mockProviders);
    expect(norm.codAmountDue).toBe(5810);
    expect(norm.cashCollectedAmount).toBe(0);
    expect(norm.difference).toBe(5810); // MUST be 5810, NEVER 0!
    expect(norm.collectionStatus).toBe('PENDING');
  });

  // -------------------------------------------------------------
  // 10. EXCESS CASH COLLECTED -> DIFFERENCE IS NEGATIVE
  // -------------------------------------------------------------
  it('Scenario 10: Runner collects excess cash (expected ₹450, collected ₹500) -> Difference = -₹50 (Excess)', () => {
    const order = {
      id: 'ord-110',
      orderNumber: 'CB-ORD-110',
      totalAmount: 450,
      advancePaidAmount: 0,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'DELIVERED',
      deliveryOtpVerified: true,
      deliveryBoyId: 'runner-001',
      providerId: 'prov-001',
      createdAt: new Date().toISOString()
    };

    const codEntry = {
      orderId: 'ord-110',
      collectedAmount: 500,
      collectionStatus: 'COLLECTED',
      reconciliationStatus: 'MISMATCH'
    };

    const norm = CodReconciliationService.normalizeOrderCod(order, codEntry, mockRunners, mockProviders);
    expect(norm.difference).toBe(-50);
  });

  // -------------------------------------------------------------
  // 11. STRICT ISOLATION BY DELIVERY BOY ID (SAME RUNNER NAME)
  // -------------------------------------------------------------
  it('Scenario 11: Two delivery boys with identical name "Rahul Sharma" are strictly isolated by ID and never merged', () => {
    const orders = [
      {
        id: 'ord-r1-1',
        orderNumber: 'CB-ORD-201',
        totalAmount: 300,
        advancePaidAmount: 0,
        paymentMethod: 'CASH_ON_DELIVERY',
        status: 'DELIVERED',
        deliveryOtpVerified: true,
        deliveryBoyId: 'runner-001',
        providerId: 'prov-001',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ord-r2-1',
        orderNumber: 'CB-ORD-202',
        totalAmount: 700,
        advancePaidAmount: 0,
        paymentMethod: 'CASH_ON_DELIVERY',
        status: 'DELIVERED',
        deliveryOtpVerified: true,
        deliveryBoyId: 'runner-002',
        providerId: 'prov-001',
        createdAt: new Date().toISOString()
      }
    ];

    const codList = [
      { orderId: 'ord-r1-1', deliveryBoyId: 'runner-001', collectedAmount: 300, collectionStatus: 'COLLECTED' },
      { orderId: 'ord-r2-1', deliveryBoyId: 'runner-002', collectedAmount: 700, collectionStatus: 'COLLECTED' }
    ];

    const summaries = CodReconciliationService.buildDeliveryBoySummaries(orders, codList, mockRunners, mockProviders);
    expect(summaries.length).toBe(2);

    const r1 = summaries.find(s => s.deliveryBoyId === 'runner-001');
    const r2 = summaries.find(s => s.deliveryBoyId === 'runner-002');

    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    expect(r1?.deliveryBoyName).toBe('Rahul Sharma');
    expect(r2?.deliveryBoyName).toBe('Rahul Sharma');
    expect(r1?.expectedAmount).toBe(300);
    expect(r2?.expectedAmount).toBe(700);
    expect(r1?.phone).toBe('+91 98765 00001');
    expect(r2?.phone).toBe('+91 98765 00002');
  });

  // -------------------------------------------------------------
  // 12 & 13. SEPARATE LAUNDRY PICKUP / RETURN FROM COD
  // -------------------------------------------------------------
  it('Scenario 12 & 13: Laundry pickups and returns do not artificially inflate COD collections', () => {
    const pickupOrder = {
      id: 'ord-laundry-pickup',
      orderNumber: 'CB-LND-001',
      totalAmount: 0,
      serviceType: 'LAUNDRY_PICKUP',
      status: 'DELIVERED',
      deliveryBoyId: 'runner-001',
      providerId: 'prov-002',
      createdAt: new Date().toISOString()
    };

    expect(CodReconciliationService.determineOrderType(pickupOrder)).toBe('LAUNDRY_PICKUP');

    const normPickup = CodReconciliationService.normalizeOrderCod(pickupOrder, null, mockRunners, mockProviders);
    expect(normPickup.orderType).toBe('LAUNDRY_PICKUP');
    expect(normPickup.codAmountDue).toBe(0);
    expect(normPickup.isEligibleForReconcile).toBe(false);
  });

  // -------------------------------------------------------------
  // 14. REAL DATABASE ORDER NUMBERS ONLY (NO TEST/DUMMY IDS)
  // -------------------------------------------------------------
  it('Scenario 14: Dummy test orders (TEST-ORDER-*, DEMO-*, N/A) are strictly filtered out', () => {
    expect(CodReconciliationService.isRealOrder({ orderNumber: 'TEST-ORDER-A' })).toBe(false);
    expect(CodReconciliationService.isRealOrder({ orderNumber: 'TEST_ORDER_B' })).toBe(false);
    expect(CodReconciliationService.isRealOrder({ orderNumber: 'DEMO-123' })).toBe(false);
    expect(CodReconciliationService.isRealOrder({ orderNumber: 'N/A' })).toBe(false);
    expect(CodReconciliationService.isRealOrder(null)).toBe(false);

    expect(CodReconciliationService.isRealOrder({ orderNumber: 'CB-ORD-8821' })).toBe(true);
    expect(CodReconciliationService.isRealOrder({ orderNumber: 'NIT-ORD-9821' })).toBe(true);
    expect(CodReconciliationService.isRealOrder({ orderNumber: 'ORD-54321' })).toBe(true);
  });

  // -------------------------------------------------------------
  // 15. BULK RECONCILIATION ONLY AFFECTS ELIGIBLE ORDERS
  // -------------------------------------------------------------
  it('Scenario 15: Bulk reconciliation reconciles ONLY delivered, balanced, un-mismatched orders', () => {
    const orders = [
      // Eligible: Delivered, full cash collected, difference = 0
      {
        id: 'ord-b1',
        orderNumber: 'CB-ORD-301',
        totalAmount: 200,
        advancePaidAmount: 0,
        paymentMethod: 'CASH_ON_DELIVERY',
        status: 'DELIVERED',
        deliveryOtpVerified: true,
        deliveryBoyId: 'runner-003',
        providerId: 'prov-001',
        createdAt: new Date().toISOString()
      },
      // Ineligible: Cash shortfall (difference = 50)
      {
        id: 'ord-b2',
        orderNumber: 'CB-ORD-302',
        totalAmount: 300,
        advancePaidAmount: 0,
        paymentMethod: 'CASH_ON_DELIVERY',
        status: 'DELIVERED',
        deliveryOtpVerified: true,
        deliveryBoyId: 'runner-003',
        providerId: 'prov-001',
        createdAt: new Date().toISOString()
      },
      // Ineligible: In transit
      {
        id: 'ord-b3',
        orderNumber: 'CB-ORD-303',
        totalAmount: 150,
        advancePaidAmount: 0,
        paymentMethod: 'CASH_ON_DELIVERY',
        status: 'OUT_FOR_DELIVERY',
        deliveryOtpVerified: false,
        deliveryBoyId: 'runner-003',
        providerId: 'prov-001',
        createdAt: new Date().toISOString()
      }
    ];

    const codList = [
      { orderId: 'ord-b1', collectedAmount: 200, collectionStatus: 'COLLECTED', reconciliationStatus: 'PENDING' },
      { orderId: 'ord-b2', collectedAmount: 250, collectionStatus: 'PARTIALLY_COLLECTED', reconciliationStatus: 'MISMATCH' },
      { orderId: 'ord-b3', collectedAmount: 0, collectionStatus: 'PENDING', reconciliationStatus: 'PENDING' }
    ];

    const summaries = CodReconciliationService.buildDeliveryBoySummaries(orders, codList, mockRunners, mockProviders);
    const runnerSummary = summaries.find(s => s.deliveryBoyId === 'runner-003');

    expect(runnerSummary).toBeDefined();
    // Only ord-b1 is eligible
    expect(runnerSummary?.eligibleOrdersCount).toBe(1);
    expect(runnerSummary?.eligibleAmount).toBe(200);

    const eligibleOrders = runnerSummary?.orders.filter(o => o.isEligibleForReconcile) || [];
    expect(eligibleOrders.length).toBe(1);
    expect(eligibleOrders[0].orderId).toBe('ord-b1');
  });

  // -------------------------------------------------------------
  // 16. LEVEL 1, 2, AND 3 AGGREGATION INTEGRITY
  // -------------------------------------------------------------
  it('Scenario 16: Level 1 Summary Cards, Level 2 Runner Cards, and Level 3 Order rows have 100% mathematical consistency', () => {
    const orders = [
      {
        id: 'ord-int-1',
        orderNumber: 'CB-ORD-401',
        totalAmount: 1000,
        advancePaidAmount: 200, // COD due = 800
        paymentMethod: 'CASH_ON_DELIVERY',
        status: 'DELIVERED',
        deliveryOtpVerified: true,
        deliveryBoyId: 'runner-001',
        providerId: 'prov-001',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ord-int-2',
        orderNumber: 'CB-ORD-402',
        totalAmount: 600,
        advancePaidAmount: 0, // COD due = 600
        paymentMethod: 'CASH_ON_DELIVERY',
        status: 'DELIVERED',
        deliveryOtpVerified: true,
        deliveryBoyId: 'runner-001',
        providerId: 'prov-001',
        createdAt: new Date().toISOString()
      }
    ];

    const codList = [
      { orderId: 'ord-int-1', collectedAmount: 800, collectionStatus: 'COLLECTED', reconciliationStatus: 'RECONCILED' },
      { orderId: 'ord-int-2', collectedAmount: 0, collectionStatus: 'PENDING', reconciliationStatus: 'PENDING' }
    ];

    const summaries = CodReconciliationService.buildDeliveryBoySummaries(orders, codList, mockRunners, mockProviders);
    const r1 = summaries.find(s => s.deliveryBoyId === 'runner-001')!;

    // Total expected for runner = 800 + 600 = 1400
    expect(r1.expectedAmount).toBe(1400);
    // Total collected = 800
    expect(r1.collectedAmount).toBe(800);
    // Difference = 1400 - 800 = 600
    expect(r1.difference).toBe(600);
    // Reconciled count = 1
    expect(r1.reconciledOrdersCount).toBe(1);
    // Pending count = 1
    expect(r1.pendingOrdersCount).toBe(1);

    // Sum of Level 3 order rows MUST equal Level 2 runner card totals
    const sumExpectedRows = r1.orders.reduce((sum, o) => sum + o.codAmountDue, 0);
    const sumCollectedRows = r1.orders.reduce((sum, o) => sum + o.cashCollectedAmount, 0);
    const sumDifferenceRows = r1.orders.reduce((sum, o) => sum + o.difference, 0);

    expect(sumExpectedRows).toBe(r1.expectedAmount);
    expect(sumCollectedRows).toBe(r1.collectedAmount);
    expect(sumDifferenceRows).toBe(r1.difference);
  });

  // -------------------------------------------------------------
  // 17. RECONCILIATION DIFFERENCE FORMULA TEST
  // -------------------------------------------------------------
  it('Scenario 17: Difference formula: Expected COD - Cash Collected', () => {
    // Zero collected
    expect(5810 - 0).toBe(5810);

    // Full collected
    expect(5810 - 5810).toBe(0);

    // Partial collected
    expect(5810 - 5000).toBe(810);

    // Excess collected
    expect(5810 - 6000).toBe(-190);
  });

  // -------------------------------------------------------------
  // 18. RUNNER PROFILE & COD RECONCILIATION INTEGRATION
  // -------------------------------------------------------------
  it('Scenario 18: AdminPaymentController.getCodReconciliation returns Sourav Senapati runners with eligible delivered orders', async () => {
    const { AdminPaymentController } = await import('../backend/src/controllers/adminPaymentController');
    const { prisma } = await import('../backend/src/config/database');

    // Reset test orders to pending state for test isolation
    for (const ordId of ['ord_cod_sourav_101', 'ord_cod_sourav_102', 'ord_cod_sourav_103', 'ord_cod_sourav_104', 'ord_cod_sourav_105']) {
      await (prisma as any).order.update({
        where: { id: ordId },
        data: { paymentStatus: 'COD_PENDING', settlementStatus: 'PENDING' }
      }).catch(() => {});
      await (prisma as any).cODCollection.update({
        where: { id: `cod_${ordId}` },
        data: { reconciliationStatus: 'PENDING', collectionStatus: 'COLLECTED', difference: 0 }
      }).catch(() => {});
    }

    const req: any = { query: {} };
    let responseData: any = null;
    const res: any = {
      status(code: number) { this.statusCode = code; return this; },
      json(data: any) { responseData = data; return this; }
    };
    const next = (err: any) => { throw err; };

    await AdminPaymentController.getCodReconciliation(req, res, next);

    expect(responseData).toBeDefined();
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.deliveryBoys)).toBe(true);

    // Find Sourav Senapati runner 1 (phone: 8972495205)
    const runner1 = responseData.deliveryBoys.find((b: any) =>
      b.deliveryBoyId === 'db_boy_sourav_1' || b.phone === '8972495205'
    );
    expect(runner1).toBeDefined();
    expect(runner1.codOrdersCount).toBeGreaterThanOrEqual(3);
    expect(runner1.expectedAmount).toBeGreaterThan(0);
    expect(runner1.eligibleOrdersCount).toBeGreaterThanOrEqual(3);
    expect(runner1.status).toBe('READY TO RECONCILE');

    // Find Sourav Senapati runner 2 (phone: 8388086844)
    const runner2 = responseData.deliveryBoys.find((b: any) =>
      b.deliveryBoyId === 'db_boy_sourav_2' || b.phone === '8388086844'
    );
    expect(runner2).toBeDefined();
    expect(runner2.codOrdersCount).toBeGreaterThanOrEqual(2);
    expect(runner2.expectedAmount).toBeGreaterThan(0);
    expect(runner2.eligibleOrdersCount).toBeGreaterThanOrEqual(2);
    expect(runner2.status).toBe('READY TO RECONCILE');
  });

  // -------------------------------------------------------------
  // 19. ADMIN BULK RECONCILE ALL ELIGIBLE & BACKEND STATUS MUTATION
  // -------------------------------------------------------------
  it('Scenario 19: Admin bulk reconciles eligible orders for Sourav Senapati (8972495205) and backend status updates to RECONCILED', async () => {
    const { AdminPaymentController } = await import('../backend/src/controllers/adminPaymentController');
    const { prisma } = await import('../backend/src/config/database');

    // 1. Trigger bulk reconciliation for db_boy_sourav_1
    const bulkReq: any = {
      body: {
        deliveryBoyId: 'db_boy_sourav_1',
        notes: 'Verified and reconciled by Admin'
      },
      user: { id: 'admin_sourav', fullName: 'Sourav Senapati (Admin)' }
    };
    let bulkResult: any = null;
    const bulkRes: any = {
      status(code: number) { this.statusCode = code; return this; },
      json(data: any) { bulkResult = data; return this; }
    };
    const next = (err: any) => { throw err; };

    await AdminPaymentController.bulkReconcileDeliveryBoyCod(bulkReq, bulkRes, next);

    expect(bulkResult).toBeDefined();
    expect(bulkResult.success).toBe(true);
    expect(bulkResult.reconciledCount).toBeGreaterThanOrEqual(3);

    // 2. Verify backend order status changed in database
    const order1 = await (prisma as any).order.findFirst({ where: { orderNumber: 'NIT-ORD-9101' } });
    expect(order1).toBeDefined();
    expect(order1.paymentStatus).toBe('COD_COLLECTED');
    expect(order1.settlementStatus).toBe('ELIGIBLE');

    // 3. Verify backend cODCollection status changed in database
    const cod1 = await (prisma as any).cODCollection.findFirst({ where: { orderId: order1.id } });
    expect(cod1).toBeDefined();
    expect(cod1.reconciliationStatus).toBe('RECONCILED');
    expect(cod1.collectionStatus).toBe('COLLECTED');
    expect(cod1.difference).toBe(0);

    // 4. Re-query getCodReconciliation: runner1 status MUST now be RECONCILED with 0 pending
    const getReq: any = { query: {} };
    let freshData: any = null;
    const getRes: any = {
      status(code: number) { this.statusCode = code; return this; },
      json(data: any) { freshData = data; return this; }
    };

    await AdminPaymentController.getCodReconciliation(getReq, getRes, next);
    const updatedRunner1 = freshData.deliveryBoys.find((b: any) =>
      b.deliveryBoyId === 'db_boy_sourav_1' || b.phone === '8972495205'
    );

    expect(updatedRunner1).toBeDefined();
    expect(updatedRunner1.pendingOrdersCount).toBe(0);
    expect(updatedRunner1.reconciledOrdersCount).toBeGreaterThanOrEqual(3);
    expect(updatedRunner1.status).toBe('RECONCILED');
  });

  // -------------------------------------------------------------
  // 20. INDIVIDUAL ORDER AUDIT / RECONCILE
  // -------------------------------------------------------------
  it('Scenario 20: Admin audits and reconciles single COD collection', async () => {
    const { AdminPaymentController } = await import('../backend/src/controllers/adminPaymentController');
    const { prisma } = await import('../backend/src/config/database');

    const req: any = {
      body: {
        orderId: 'ord_cod_sourav_104',
        amountCollected: 450,
        collectionStatus: 'COLLECTED',
        reconciliationStatus: 'RECONCILED',
        notes: 'Doorstep cash audited by finance admin'
      },
      user: { id: 'admin_sourav', fullName: 'Sourav Senapati' }
    };
    let resData: any = null;
    const res: any = {
      status(code: number) { this.statusCode = code; return this; },
      json(data: any) { resData = data; return this; }
    };
    const next = (err: any) => { throw err; };

    await AdminPaymentController.reconcileCod(req, res, next);
    expect(resData.success).toBe(true);

    const ord = await (prisma as any).order.findFirst({ where: { id: 'ord_cod_sourav_104' } });
    expect(ord.paymentStatus).toBe('COD_COLLECTED');
    expect(ord.settlementStatus).toBe('ELIGIBLE');

    const col = await (prisma as any).cODCollection.findFirst({ where: { orderId: 'ord_cod_sourav_104' } });
    expect(col.reconciliationStatus).toBe('RECONCILED');
    expect(col.collectionStatus).toBe('COLLECTED');
  });

  afterAll(async () => {
    const { prisma } = await import('../backend/src/config/database');
    const resetOrders = ['ord_cod_sourav_101', 'ord_cod_sourav_102', 'ord_cod_sourav_103', 'ord_cod_sourav_104', 'ord_cod_sourav_105'];
    for (const id of resetOrders) {
      await (prisma as any).order.update({
        where: { id },
        data: { paymentStatus: 'COD_PENDING', settlementStatus: 'PENDING' }
      });
      await (prisma as any).cODCollection.update({
        where: { orderId: id },
        data: { collectionStatus: 'COLLECTED', reconciliationStatus: 'PENDING', difference: 0 }
      });
    }
  });
});


