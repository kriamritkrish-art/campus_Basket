import { describe, it, expect } from 'vitest';
import prisma from '../backend/src/config/database';
import { OrderController } from '../backend/src/controllers/orderController';
import { ReturnController } from '../backend/src/controllers/returnController';

describe('Order Edit (Add Products) & Return Management with Runner OTP Pickup', () => {

  // -------------------------------------------------------------
  // 1. ADDING PRODUCTS / EDITING ORDER BEFORE PROVIDER ACCEPTS
  // -------------------------------------------------------------
  describe('Customer Order Editing (Add More Products)', () => {
    it('allows customer to add more products to their order before provider acceptance', async () => {
      // Create a test order in fallback database
      const order = await prisma.order.create({
        data: {
          orderNumber: 'TEST-EDIT-001',
          studentId: 'stud_sourav',
          providerId: 'prov_canteen',
          serviceType: 'FOOD',
          hallName: 'Hall 11',
          roomNumber: 'B-304',
          totalAmount: 50,
          subtotal: 50,
          deliveryFee: 0,
          status: 'CONFIRMED',
          providerAccepted: false,
          paymentMethod: 'COD',
          paymentStatus: 'PENDING'
        }
      });

      // Find an available product
      const product = await prisma.product.findFirst({ where: { isAvailable: true } });
      expect(product).toBeDefined();

      const initialStock = product.stockQuantity || product.stock || 20;

      // Mock request and response for modifyOrder
      let statusCode = 200;
      let responseData: any = null;

      const req: any = {
        params: { id: order.id },
        user: { userId: 'user_sourav', studentId: 'stud_sourav', role: 'STUDENT' },
        body: {
          addedItems: [
            { productId: product.id, quantity: 2 }
          ]
        }
      };

      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              responseData = data;
            }
          };
        },
        json: (data: any) => {
          responseData = data;
        }
      };

      await OrderController.modifyOrder(req, res, (err) => { if (err) throw err; });

      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.order.items.length).toBeGreaterThan(0);
      expect(Number(responseData.order.totalAmount)).toBeGreaterThan(0);
    });

    it('strictly forbids adding products or modifying order once provider has accepted', async () => {
      const lockedOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-LOCKED-001',
          studentId: 'stud_sourav',
          providerId: 'prov_canteen',
          serviceType: 'FOOD',
          hallName: 'Hall 11',
          roomNumber: 'B-304',
          totalAmount: 100,
          subtotal: 100,
          status: 'ACCEPTED',
          providerAccepted: true,
          paymentMethod: 'COD',
          paymentStatus: 'PENDING'
        }
      });

      const product = await prisma.product.findFirst({ where: { isAvailable: true } });

      let statusCode = 200;
      let responseData: any = null;

      const req: any = {
        params: { id: lockedOrder.id },
        user: { userId: 'user_sourav', studentId: 'stud_sourav', role: 'STUDENT' },
        body: {
          addedItems: [{ productId: product.id, quantity: 1 }]
        }
      };

      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              responseData = data;
            }
          };
        },
        json: (data: any) => {
          responseData = data;
        }
      };

      await OrderController.modifyOrder(req, res, (err) => { if (err) throw err; });

      expect(statusCode).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('accepted');
    });
  });

  // -------------------------------------------------------------
  // 2. PRODUCT RETURN REASONS & PROOF VALIDATION
  // -------------------------------------------------------------
  describe('Product Return Reason & Refund Deductions', () => {
    it('requires proof for PRODUCT_ISSUE and gives 100% refund with 0 delivery fee deduction', async () => {
      const deliveredOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-RET-DEFECT-001',
          studentId: 'stud_sourav',
          providerId: 'prov_canteen',
          serviceType: 'STATIONERY',
          hallName: 'Hall 11',
          roomNumber: 'B-304',
          totalAmount: 120,
          subtotal: 120,
          status: 'DELIVERED',
          deliveredAt: new Date(),
          providerAccepted: true,
          paymentMethod: 'ONLINE',
          paymentStatus: 'PAID'
        }
      });

      // Attempt without proof: must fail
      let statusCode = 200;
      let responseData: any = null;
      const invalidReq: any = {
        params: { id: deliveredOrder.id },
        user: { userId: 'user_sourav', studentId: 'stud_sourav', role: 'STUDENT' },
        body: {
          reasonType: 'PRODUCT_ISSUE',
          reasonDetails: 'Bad' // too short, no photo
        }
      };
      const invalidRes: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: (data: any) => { responseData = data; } };
        },
        json: (data: any) => { responseData = data; }
      };

      await OrderController.requestReturn(invalidReq, invalidRes, (err) => { if (err) throw err; });
      expect(statusCode).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('proof');

      // Valid request with defect photo
      const validReq: any = {
        params: { id: deliveredOrder.id },
        user: { userId: 'user_sourav', studentId: 'stud_sourav', role: 'STUDENT' },
        body: {
          reasonType: 'PRODUCT_ISSUE',
          reasonDetails: 'Item received damaged and seal was broken',
          proofImageUrl: 'https://campusbasket.in/uploads/defect_sample.jpg'
        }
      };
      const validRes: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: (data: any) => { responseData = data; } };
        },
        json: (data: any) => { responseData = data; }
      };

      await OrderController.requestReturn(validReq, validRes, (err) => { if (err) throw err; });
      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.returnRequest.reasonType).toBe('PRODUCT_ISSUE');
      expect(responseData.returnRequest.deliveryChargeDeducted).toBe(0);
      expect(responseData.returnRequest.refundAmount).toBe(120); // 100% full refund
    });

    it('deducts configured delivery charge for MIND_CHANGE return', async () => {
      const deliveredOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-RET-MIND-001',
          studentId: 'stud_sourav',
          providerId: 'prov_canteen',
          serviceType: 'STATIONERY',
          hallName: 'Hall 11',
          roomNumber: 'B-304',
          totalAmount: 100,
          subtotal: 100,
          status: 'DELIVERED',
          deliveredAt: new Date(),
          providerAccepted: true,
          paymentMethod: 'ONLINE',
          paymentStatus: 'PAID'
        }
      });

      let statusCode = 200;
      let responseData: any = null;
      const req: any = {
        params: { id: deliveredOrder.id },
        user: { userId: 'user_sourav', studentId: 'stud_sourav', role: 'STUDENT' },
        body: {
          reasonType: 'MIND_CHANGE',
          reasonDetails: 'Ordered extra item by mistake, no longer needed'
        }
      };
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: (data: any) => { responseData = data; } };
        },
        json: (data: any) => { responseData = data; }
      };

      await OrderController.requestReturn(req, res, (err) => { if (err) throw err; });
      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.returnRequest.reasonType).toBe('MIND_CHANGE');
      expect(responseData.returnRequest.deliveryChargeDeducted).toBe(15); // Admin configured fee
      expect(responseData.returnRequest.refundAmount).toBe(85); // 100 - 15 = 85
    });
  });

  // -------------------------------------------------------------
  // 3. ADMIN APPROVAL & RUNNER ASSIGNMENT WITH 6-DIGIT OTP
  // -------------------------------------------------------------
  describe('Admin Return Review & Runner Assignment', () => {
    it('admin approves return request and generates a 6-digit pickup OTP', async () => {
      const order = await prisma.order.create({
        data: {
          orderNumber: 'TEST-RET-ADMIN-001',
          studentId: 'stud_sourav',
          providerId: 'prov_canteen',
          serviceType: 'STATIONERY',
          hallName: 'Hall 11',
          roomNumber: 'B-304',
          totalAmount: 150,
          status: 'DELIVERED',
          deliveredAt: new Date(),
          providerAccepted: true,
          paymentMethod: 'ONLINE',
          paymentStatus: 'PAID'
        }
      });

      // Find or create return request
      const retReq = await (prisma as any).returnRequest.create({
        data: {
          orderId: order.id,
          studentId: 'stud_sourav',
          reasonType: 'PRODUCT_ISSUE',
          reasonDetails: 'Screen damaged upon receipt',
          proofImageUrl: 'https://example.com/proof.jpg',
          originalAmount: 150,
          deliveryChargeDeducted: 0,
          refundAmount: 150,
          deliveryBoyPayout: 15,
          status: 'REQUESTED'
        }
      });

      const deliveryBoy = await prisma.deliveryBoy.findFirst();
      expect(deliveryBoy).toBeDefined();

      let statusCode = 200;
      let responseData: any = null;
      const req: any = {
        params: { id: retReq.id },
        user: { userId: 'user_admin_sourav', role: 'ADMIN' },
        body: {
          deliveryBoyId: deliveryBoy.id
        }
      };
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: (data: any) => { responseData = data; } };
        },
        json: (data: any) => { responseData = data; }
      };

      await ReturnController.approveReturn(req, res, (err) => { if (err) throw err; });

      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.returnRequest.status).toBe('PICKUP_ASSIGNED');
      expect(responseData.returnRequest.pickupOtp).toBeDefined();
      expect(responseData.returnRequest.pickupOtp).toMatch(/^\d{6}$/); // Exactly 6 digits
      expect(responseData.returnRequest.deliveryBoyId).toBe(deliveryBoy.id);
    });
  });

  // -------------------------------------------------------------
  // 4. RUNNER OTP VERIFICATION & WALLET CREDIT
  // -------------------------------------------------------------
  describe('Delivery Runner Return Pickup OTP Verification & Commission', () => {
    it('verifies 6-digit OTP, credits runner wallet with per-delivery payout, and completes refund', async () => {
      const deliveryBoy = await prisma.deliveryBoy.findFirst();
      const initialWallet = Number(deliveryBoy.walletBalance) || 0;

      const order = await prisma.order.create({
        data: {
          orderNumber: 'TEST-PAYOUT-001',
          studentId: 'stud_sourav',
          providerId: 'prov_canteen',
          serviceType: 'STATIONERY',
          hallName: 'Hall 11',
          roomNumber: 'B-304',
          totalAmount: 80,
          status: 'DELIVERED',
          deliveredAt: new Date(),
          providerAccepted: true,
          paymentMethod: 'ONLINE',
          paymentStatus: 'PAID'
        }
      });

      const retReq = await (prisma as any).returnRequest.create({
        data: {
          orderId: order.id,
          studentId: 'stud_sourav',
          deliveryBoyId: deliveryBoy.id,
          reasonType: 'MIND_CHANGE',
          reasonDetails: 'No longer required',
          originalAmount: 80,
          deliveryChargeDeducted: 15,
          refundAmount: 65,
          deliveryBoyPayout: 15,
          pickupOtp: '654321',
          pickupOtpVerified: false,
          status: 'PICKUP_ASSIGNED'
        }
      });

      // Attempt invalid OTP
      let statusCode = 200;
      let responseData: any = null;
      const invalidReq: any = {
        params: { id: retReq.id },
        user: { userId: deliveryBoy.userId, role: 'DELIVERY' },
        body: { otp: '000000' }
      };
      const invalidRes: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: (data: any) => { responseData = data; } };
        },
        json: (data: any) => { responseData = data; }
      };

      await ReturnController.verifyReturnPickupOtp(invalidReq, invalidRes, (err) => { if (err) throw err; });
      expect(statusCode).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Incorrect 6-digit Return OTP');

      // Valid OTP submission
      const validReq: any = {
        params: { id: retReq.id },
        user: { userId: deliveryBoy.userId, role: 'DELIVERY' },
        body: { otp: '654321' }
      };
      const validRes: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: (data: any) => { responseData = data; } };
        },
        json: (data: any) => { responseData = data; }
      };

      await ReturnController.verifyReturnPickupOtp(validReq, validRes, (err) => { if (err) throw err; });
      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.returnRequest.status).toBe('PICKED_UP');
      expect(responseData.returnRequest.pickupOtpVerified).toBe(true);

      // Verify delivery runner wallet received return payout
      const updatedRunner = await prisma.deliveryBoy.findUnique({ where: { id: deliveryBoy.id } });
      expect(Number(updatedRunner.walletBalance)).toBe(initialWallet + 15);

      // Admin disburse refund
      const disburseReq: any = {
        params: { id: retReq.id },
        user: { userId: 'admin_1', role: 'ADMIN' },
        body: { utrReference: 'UTR99887766', adminNotes: 'Verified and disbursed' }
      };
      await ReturnController.disburseReturnRefund(disburseReq, validRes, (err) => { if (err) throw err; });
      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.returnRequest.status).toBe('REFUNDED');
    });
  });
});
