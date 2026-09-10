import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminFinanceController } from '../backend/src/controllers/adminFinanceController';
import { DeliveryController } from '../backend/src/controllers/deliveryController';
import { prisma } from '../backend/src/config/database';

describe('Provider Settlement + COD Collection + Delivery Boy Earnings Financial Management System', () => {
  const mockReq = (query: any = {}, body: any = {}, user: any = { role: 'ADMIN', id: 'admin_test' }) => ({
    query,
    body,
    params: {},
    user,
    ip: '127.0.0.1'
  } as any);

  const mockRes = () => {
    const res: any = {};
    res.statusCode = 200;
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      res.data = data;
      return res;
    };
    res.setHeader = () => res;
    res.send = (data: any) => {
      res.data = data;
      return res;
    };
    return res;
  };

  it('Requirement 1 & 30: Strictly preserves original Order IDs with zero duplicate order rows', async () => {
    const ordersBefore = await (prisma as any).order.findMany();
    const countBefore = ordersBefore.length;

    const req = mockReq({ dateRange: 'all' });
    const res = mockRes();
    await AdminFinanceController.getProviderPayables(req, res, () => {});

    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);

    const ordersAfter = await (prisma as any).order.findMany();
    expect(ordersAfter.length).toBe(countBefore);
  });

  it('Requirement 4: COD reconciliation does not invent a default runner when a real delivery boy is missing', async () => {
    const orderFindMany = vi.spyOn((prisma as any).order, 'findMany');
    const codFindMany = vi.spyOn((prisma as any).cODCollection, 'findMany');
    const deliveryBoyFindMany = vi.spyOn((prisma as any).deliveryBoy, 'findMany');
    const providerFindMany = vi.spyOn((prisma as any).serviceProvider, 'findMany');

    try {
      orderFindMany.mockResolvedValue([
        {
          id: 'ord_unassigned_cod',
          orderNumber: 'ORD-COD-UNASSIGNED',
          createdAt: new Date().toISOString(),
          deliveredAt: new Date().toISOString(),
          paymentMethod: 'CASH_ON_DELIVERY',
          status: 'DELIVERED',
          deliveryOtpVerified: true,
          totalAmount: 245,
          providerId: 'prov_canteen',
          student: { fullName: 'Aanya', mobileNumber: '+91 99999 12345' },
          provider: { fullName: 'Campus Canteen' },
          items: [{ productName: 'Veg Bowl' }]
        }
      ]);
      codFindMany.mockResolvedValue([]);
      deliveryBoyFindMany.mockResolvedValue([]);
      providerFindMany.mockResolvedValue([]);

      const req = mockReq();
      const res = mockRes();

      await AdminFinanceController.getCodCollections(req, res, () => {});

      const normalizedRows = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data?.collections) ? res.data.collections : [];
      const targetRow = normalizedRows.find((row: any) => row.orderId === 'ord_unassigned_cod');

      expect(targetRow).toBeDefined();
      expect(targetRow.deliveryBoyId).toBeNull();
      expect(targetRow.deliveryBoyId).not.toBe('db_boy_1');
      expect(targetRow.runnerName).not.toContain('Bikash');
    } finally {
      orderFindMany.mockRestore();
      codFindMany.mockRestore();
      deliveryBoyFindMany.mockRestore();
      providerFindMany.mockRestore();
    }
  });

  it('Requirement 3 & 4: Calculates separate Provider Payable, COD, and Delivery Earnings without mixing', async () => {
    const req = mockReq();
    const res = mockRes();
    await AdminFinanceController.getSummary(req, res, () => {});

    expect(res.statusCode).toBe(200);
    expect(res.data.data).toBeDefined();
    expect(res.data.data.today).toBeDefined();
    expect(typeof res.data.data.today.providerPayable).toBe('number');
    expect(typeof res.data.data.today.codExpected).toBe('number');
    expect(typeof res.data.data.today.deliveryEarnings).toBe('number');

    // COD Expected must never equal Provider Payable by default
    expect(res.data.data.today.providerPayable).not.toBe(res.data.data.today.deliveryEarnings);
  });

  it('Requirement 7 & 8: Executes partial provider settlement and updates remaining payable & status correctly', async () => {
    // 1. Check provider payables
    const reqList = mockReq({ providerId: 'prov_canteen' });
    const resList = mockRes();
    await AdminFinanceController.getProviderPayables(reqList, resList, () => {});

    const canteen = resList.data.providers.find((p: any) => p.providerId === 'prov_canteen');
    expect(canteen).toBeDefined();

    // 2. Perform partial settlement of ₹100
    const reqSettle = mockReq({}, {
      providerId: 'prov_canteen',
      newStatus: 'PARTIALLY_SETTLED',
      settlementAmount: 100,
      paymentReference: 'UTR_TEST_100',
      notes: 'Partial settlement test'
    });
    const resSettle = mockRes();
    await AdminFinanceController.manageProviderStatus(reqSettle, resSettle, () => {});

    expect(resSettle.statusCode).toBe(200);
    expect(resSettle.data.success).toBe(true);
    expect(resSettle.data.data.settledAmount).toBe(100);

    // 3. Confirm settlement history contains the transaction
    const reqHist = mockReq({ providerId: 'prov_canteen' });
    const resHist = mockRes();
    await AdminFinanceController.getSettlementHistory(reqHist, resHist, () => {});

    expect(resHist.statusCode).toBe(200);
    expect(resHist.data.history.some((h: any) => h.paymentReference === 'UTR_TEST_100')).toBe(true);
  });

  it('Requirement 9 & 18: Respects online vs COD payment rules (Online COD expected is 0)', async () => {
    const req = mockReq({ paymentMode: 'ONLINE' });
    const res = mockRes();
    await AdminFinanceController.getFinancialReports(req, res, () => {});

    expect(res.statusCode).toBe(200);
    for (const r of res.data.records) {
      if (r.paymentMode === 'ONLINE') {
        expect(r.codExpected).toBe(0);
        expect(r.codCollected).toBe(0);
        expect(r.codPending).toBe(0);
      }
    }
  });

  it('Requirement 13 & 27: Enforces strict amount safety on COD status changes without silent modification', async () => {
    // Missing reason or collected amount on ADJUSTED status should be rejected
    const reqBad = mockReq({}, {
      orderId: 'ord_101',
      newStatus: 'ADJUSTED',
      adjustmentReason: '' // Empty reason
    });
    const resBad = mockRes();
    await AdminFinanceController.manageCodStatus(reqBad, resBad, () => {});

    expect(resBad.statusCode).toBe(400);
    expect(resBad.data.success).toBe(false);

    // Valid adjustment with required justification
    const reqGood = mockReq({}, {
      orderId: 'ord_101',
      newStatus: 'ADJUSTED',
      adjustmentReason: 'Student paid via direct UPI at doorstep'
    });
    const resGood = mockRes();
    await AdminFinanceController.manageCodStatus(reqGood, resGood, () => {});

    expect(resGood.statusCode).toBe(200);
    expect(resGood.data.success).toBe(true);
  });

  it('Requirement 15: Enforces Delivery OTP earning rule (Monthly contractual runners receive ₹0 per-order earning)', async () => {
    const req = mockReq();
    const res = mockRes();
    await AdminFinanceController.getDeliveryBoyEarnings(req, res, () => {});

    expect(res.statusCode).toBe(200);
    const monthlyRunners = res.data.deliveryBoys.filter((d: any) => d.contractType === 'Monthly Contractual');
    for (const runner of monthlyRunners) {
      expect(runner.perOrderRate).toBe('Not Applicable');
      for (const ord of runner.orders) {
        expect(ord.eligibleEarning).toBe(0);
        expect(ord.earningStatus).toBe('MONTHLY_CONTRACTUAL');
      }
    }
  });

  it('Requirement 22 & 24: Financial Reports multi-filtering preserves exact summary totals', async () => {
    const req = mockReq({ dateRange: 'all' });
    const res = mockRes();
    await AdminFinanceController.getFinancialReports(req, res, () => {});

    expect(res.statusCode).toBe(200);
    const { summaryTotals, records } = res.data;

    const manualGross = records.reduce((s: number, r: any) => s + r.orderTotal, 0);
    const manualPayable = records.reduce((s: number, r: any) => s + r.providerPayable, 0);

    expect(Math.round(manualGross * 100) / 100).toBe(summaryTotals.totalGrossVolume);
    expect(Math.round(manualPayable * 100) / 100).toBe(summaryTotals.totalProviderPayable);
  });
});
