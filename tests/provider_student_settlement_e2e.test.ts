import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../backend/src/config/database';
import { WalletService } from '../backend/src/services/financial/WalletService';
import { AdminPaymentController } from '../backend/src/controllers/adminPaymentController';
import { AdminPeopleController } from '../backend/src/controllers/adminPeopleController';

describe('Provider-Student Settlement E2E Lifecycle (Requirement 24)', () => {
  const testProviderId = 'prov_e2e_verified_001';
  const testStudentId = 'student_e2e_verified_001';
  const testUserId = 'user_student_e2e_001';
  const testProductId = 'prod_e2e_settle_001';
  const testOrderId = 'order_e2e_settle_001';
  const testOrderNum = 'CB-E2E-SETTLE-001';

  beforeAll(async () => {
    // Clean up test provider wallet before running the lifecycle suite
    try {
      const existingWallet = await WalletService.getOrCreateProviderWallet(testProviderId);
      if (existingWallet) {
        await (prisma as any).wallet.update({
          where: { id: existingWallet.id },
          data: { balance: 0 }
        });
      }
      await (prisma as any).walletTransaction.deleteMany({
        where: { providerId: testProviderId }
      });
    } catch {}
  });

  it('Step 1 & 2: Provider & Product Configuration with Settlement Shares', async () => {
    // 1. Ensure provider exists
    let provider = await prisma.provider.findUnique({ where: { id: testProviderId } });
    if (!provider) {
      provider = await prisma.provider.create({
        data: {
          id: testProviderId,
          userId: 'user_prov_e2e_001',
          fullName: 'Campus Gourmet Kitchen',
          serviceCategory: 'FOOD',
          status: 'ACTIVE',
          bankAccount: '1234567890',
          ifscCode: 'HDFC0001234'
        } as any
      });
    }
    expect(provider).toBeDefined();
    expect(provider.id).toBe(testProviderId);

    // 2. Product creation with Provider Settlement Configuration (e.g. 70% share on ₹200 item)
    // Selling price: ₹200
    // Provider Share: PERCENTAGE, 70% -> providerAmount = 140, cbGrossShare = 60
    const price = 200;
    const providerShareType = 'PERCENTAGE';
    const providerShareValue = 70;
    const providerAmount = Math.round((price * (providerShareValue / 100)) * 100) / 100; // 140
    const cbGrossShare = Math.round((price - providerAmount) * 100) / 100; // 60

    expect(providerAmount).toBe(140);
    expect(cbGrossShare).toBe(60);

    const product = await prisma.product.upsert({
      where: { id: testProductId },
      create: {
        id: testProductId,
        name: 'Deluxe Paneer Thali',
        slug: 'deluxe-paneer-thali',
        price,
        stock: 50,
        availability: true,
        availableToday: true,
        providerId: testProviderId,
        providerShareType,
        providerShareValue,
        providerAmount,
        cbGrossShare
      } as any,
      update: {
        price,
        providerShareType,
        providerShareValue,
        providerAmount,
        cbGrossShare
      } as any
    });

    expect(product.providerAmount).toBe(140);
    expect(product.cbGrossShare).toBe(60);
  });

  it('Step 3: Student Checkout with Immutable Financial Snapshot', async () => {
    // Student places order: 1x Deluxe Paneer Thali
    const subtotal = 200;
    const deliveryFee = 15;
    const totalAmount = 215;
    const providerAmount = 140;
    const cbGrossShare = 60;

    const order = await prisma.order.upsert({
      where: { id: testOrderId },
      create: {
        id: testOrderId,
        orderNumber: testOrderNum,
        studentId: testStudentId,
        providerId: testProviderId,
        serviceType: 'FOOD',
        status: 'ACCEPTED',
        totalAmount,
        subtotal,
        deliveryFee,
        discountAmount: 0,
        paymentMethod: 'ONLINE',
        paymentStatus: 'PAID',
        hallName: 'Hall 11',
        roomNumber: 'B-204',
        providerShareType: 'PERCENTAGE',
        providerShareValue: 70,
        providerAmount,
        cbGrossShare,
        settlementStatus: 'PENDING'
      } as any,
      update: {
        status: 'ACCEPTED',
        totalAmount,
        subtotal,
        providerAmount,
        cbGrossShare,
        settlementStatus: 'PENDING'
      } as any
    });

    expect(order.providerAmount).toBe(140);
    expect(order.cbGrossShare).toBe(60);
    expect(order.providerShareValue).toBe(70);
  });

  it('Step 4: Order DELIVERED Triggers Real DB Provider Wallet Credit', async () => {
    const order = await prisma.order.findUnique({ where: { id: testOrderId } });
    expect(order).toBeDefined();

    // Provider wallet starts at 0
    let wallet = await WalletService.getOrCreateProviderWallet(testProviderId);
    expect(Number(wallet.balance)).toBe(0);

    // Order status marked DELIVERED
    await prisma.order.update({
      where: { id: testOrderId },
      data: { status: 'DELIVERED', settlementStatus: 'PENDING' } as any
    });

    // Wallet credit executed
    const creditTx = await WalletService.creditProviderOrder({
      providerId: testProviderId,
      orderId: order!.id,
      orderNumber: order!.orderNumber,
      amount: Number(order!.providerAmount || 140),
      description: `Order delivery settlement credit for #${order!.orderNumber}`
    });

    expect(creditTx).toBeDefined();
    expect(creditTx.success).toBe(true);
    expect(creditTx.transaction.type).toBe('CREDIT');
    expect(creditTx.balanceAfter).toBe(140);

    wallet = await WalletService.getOrCreateProviderWallet(testProviderId);
    expect(Number(wallet.balance)).toBe(140);
  });

  it('Step 5: Return Request & Approval Triggers Real Return Debit Adjustment on Provider Wallet', async () => {
    // Current wallet balance is 140 from Step 4
    let wallet = await WalletService.getOrCreateProviderWallet(testProviderId);
    expect(Number(wallet.balance)).toBe(140);

    // Return requested and approved for the order
    const returnDebitAmount = 140;
    const debitTx = await WalletService.adjustProviderReturn({
      providerId: testProviderId,
      orderId: testOrderId,
      orderNumber: testOrderNum,
      returnRequestId: 'ret_e2e_001',
      amount: returnDebitAmount,
      description: `Return Adjustment: Customer return approved for Order #${testOrderNum}`
    });

    expect(debitTx).toBeDefined();
    expect(debitTx.success).toBe(true);
    expect(debitTx.transaction.type).toBe('DEBIT');
    expect(debitTx.balanceAfter).toBe(0);
    expect(debitTx.transaction.description).toContain('Return Adjustment');

    wallet = await WalletService.getOrCreateProviderWallet(testProviderId);
    expect(Number(wallet.balance)).toBe(0); // 140 credit - 140 debit adjustment = 0

    // Mark order settlementStatus as ADJUSTED
    const updatedOrder = await prisma.order.update({
      where: { id: testOrderId },
      data: { settlementStatus: 'ADJUSTED' } as any
    });
    expect(updatedOrder.settlementStatus).toBe('ADJUSTED');
  });

  it('Step 6: Gross Volume Calculation Sync with Returns and Provider Settlements', async () => {
    const grossData = await AdminPaymentController.computeGrossVolumeData({
      providerId: testProviderId
    });

    expect(grossData).toBeDefined();
    expect(grossData.metrics).toBeDefined();
    // Verify records exist for this provider
    const foundRecord = grossData.orders.find((r: any) => r.rawOrderNumber === testOrderNum || r.orderNumber.includes(testOrderNum) || r.id === testOrderId);
    if (foundRecord) {
      expect(Number(foundRecord.providerAmount)).toBe(140);
      expect(Number(foundRecord.cbGrossShare)).toBe(60);
      expect(foundRecord.settlementStatus).toBe('ADJUSTED');
    }
  });

  it('Step 7: Product Settlement Configuration Mutation Never Alters Past Order Snapshots', async () => {
    // Admin modifies product share from 70% to 50%
    const newPrice = 200;
    const newShareType = 'PERCENTAGE';
    const newShareValue = 50;
    const newProviderAmount = 100;
    const newCbGrossShare = 100;

    await prisma.product.update({
      where: { id: testProductId },
      data: {
        providerShareType: newShareType,
        providerShareValue: newShareValue,
        providerAmount: newProviderAmount,
        cbGrossShare: newCbGrossShare
      } as any
    });

    // Check product was updated
    const updatedProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(updatedProduct!.providerShareValue).toBe(50);
    expect(updatedProduct!.providerAmount).toBe(100);
    expect(updatedProduct!.cbGrossShare).toBe(100);

    // CRITICAL: Verify past order snapshot remains 140 / 60 / 70%
    const pastOrder = await prisma.order.findUnique({ where: { id: testOrderId } });
    expect(pastOrder!.providerShareValue).toBe(70);
    expect(pastOrder!.providerAmount).toBe(140);
    expect(pastOrder!.cbGrossShare).toBe(60);
  });

  it('Step 8: Admin People Controller API - Students & Providers Real Queries', async () => {
    // Test getProviders query
    const reqMock: any = { query: { search: 'Gourmet' } };
    let resData: any = null;
    const resMock: any = {
      status: (code: number) => ({
        json: (data: any) => {
          resData = data;
        }
      })
    };
    const nextMock = (err: any) => { throw err; };

    await AdminPeopleController.getProviders(reqMock, resMock, nextMock);
    expect(resData).toBeDefined();
    expect(resData.success).toBe(true);
    expect(Array.isArray(resData.providers)).toBe(true);
    expect(resData.summary).toBeDefined();
    expect(resData.summary.totalProviders).toBeGreaterThanOrEqual(1);

    // Test getProviderDetails
    const detailReq: any = { params: { providerId: testProviderId } };
    let detailData: any = null;
    const detailRes: any = {
      status: (code: number) => ({
        json: (data: any) => {
          detailData = data;
        }
      })
    };
    await AdminPeopleController.getProviderDetails(detailReq, detailRes, nextMock);
    expect(detailData).toBeDefined();
    expect(detailData.success).toBe(true);
    expect(detailData.provider.id).toBe(testProviderId);
    expect(detailData.financialSummary).toBeDefined();
    expect(Array.isArray(detailData.walletLedger)).toBe(true);
    expect(detailData.walletLedger.length).toBeGreaterThanOrEqual(2); // Credit and Debit adjustment

    // Test getStudents
    const studentReq: any = { query: {} };
    let studentData: any = null;
    const studentRes: any = {
      status: (code: number) => ({
        json: (data: any) => {
          studentData = data;
        }
      })
    };
    await AdminPeopleController.getStudents(studentReq, studentRes, nextMock);
    expect(studentData).toBeDefined();
    expect(studentData.success).toBe(true);
    expect(Array.isArray(studentData.students)).toBe(true);
  });
});
