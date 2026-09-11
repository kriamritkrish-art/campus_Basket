import { describe, it, expect } from 'vitest';
import { prisma } from '../backend/src/config/database';
import { LaundryController } from '../backend/src/controllers/laundryController';
import { ProviderController } from '../backend/src/controllers/providerController';

describe('Laundry Broadcast Pool, Order Acceptance & Payment Scanner Workflow', () => {
  const mockOrderNumber = `LAU-POOL-${Date.now()}`;
  let createdOrderId: string;
  const provider1Id = 'prov_laundry';
  const provider2Id = 'prov_canteen';

  it('1. Creates laundry order in open broadcast pool (providerId: null, status: REQUESTED)', async () => {
    const order = await prisma.laundryOrder.create({
      data: {
        orderNumber: mockOrderNumber,
        trackingNumber: `TRK-${mockOrderNumber}`,
        qrCodeData: '{}',
        studentId: 'std_test_pool',
        providerId: null,
        status: 'REQUESTED',
        estimatedPrice: 150,
        finalPrice: 150,
        laundryBaseAmount: 140,
        serviceChargeAmount: 10,
        totalAmount: 150,
        onlinePaidAmount: 0,
        codAmount: 150,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        hallName: 'Hall 11',
        roomNumber: '204',
        pickupDate: new Date(),
        preferredPickupTime: '10:00 AM',
        preferredReturnTime: '06:00 PM',
        items: {
          create: [{ itemType: 'Shirt', quantity: 5, unitPrice: 20 }]
        }
      }
    });

    expect(order.id).toBeDefined();
    expect(order.providerId).toBeNull();
    expect(order.status).toBe('REQUESTED');
    createdOrderId = order.id;
  });

  it('2. Provider 1 accepts order from broadcast pool, claiming ownership and generating Pickup OTP', async () => {
    const req: any = {
      params: { id: createdOrderId },
      user: { role: 'SERVICE_PROVIDER', providerId: provider1Id },
      ip: '127.0.0.1'
    };

    let statusCode = 0;
    let responseData: any = null;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };
    const next = (err: any) => { throw err; };

    await LaundryController.acceptOrder(req, res, next);

    expect(statusCode).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.order.status).toBe('ACCEPTED');

    // Verify in database
    const updated = await prisma.laundryOrder.findUnique({
      where: { id: createdOrderId },
      include: { otps: true }
    });
    expect(updated?.providerId).toBe(provider1Id);
    expect(updated?.status).toBe('ACCEPTED');
    expect(updated?.otps.some((o) => o.otpType === 'PICKUP')).toBe(true);
  });

  it('3. Provider 2 attempting to accept the already-claimed order is rejected', async () => {
    const req: any = {
      params: { id: createdOrderId },
      user: { role: 'SERVICE_PROVIDER', providerId: provider2Id },
      ip: '127.0.0.1'
    };

    let statusCode = 0;
    let responseData: any = null;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };
    const next = (err: any) => { throw err; };

    await LaundryController.acceptOrder(req, res, next);

    expect(statusCode).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('already been accepted');
  });

  it('4. Non-owning Provider 2 is blocked from controlling order stages (exclusive control)', async () => {
    const req: any = {
      params: { id: createdOrderId },
      body: { status: 'WASHING' },
      user: { role: 'SERVICE_PROVIDER', providerId: provider2Id },
      ip: '127.0.0.1'
    };

    let statusCode = 0;
    let responseData: any = null;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };
    const next = (err: any) => { throw err; };

    await LaundryController.updateStatus(req, res, next);

    expect(statusCode).toBe(403);
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('Access denied');
  });

  it('5. Provider 1 saves JPEG payment scanner and details', async () => {
    const mockScannerJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mockScannerJpegData';
    const req: any = {
      user: { role: 'SERVICE_PROVIDER', providerId: provider1Id },
      body: {
        paymentQrImage: mockScannerJpeg,
        paymentUpiId: 'laundry.partner@oksbi',
        paymentAccountName: 'Campus Express Laundry Hub',
        paymentInstructions: 'Scan with GPay/PhonePe to pay directly to dhobi, or pay cash on collection.'
      }
    };

    let statusCode = 0;
    let responseData: any = null;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };
    const next = (err: any) => { throw err; };

    await ProviderController.savePaymentScanner(req, res, next);

    expect(statusCode).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.paymentUpiId).toBe('laundry.partner@oksbi');
    expect(responseData.data.paymentQrImage).toBe(mockScannerJpeg);
  });

  it('6. Student viewing order receives assigned provider payment scanner and details', async () => {
    const req: any = {
      params: { id: createdOrderId },
      user: { role: 'STUDENT', studentId: 'std_test_pool' }
    };

    let statusCode = 0;
    let responseData: any = null;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };
    const next = (err: any) => { throw err; };

    await LaundryController.getOrderDetail(req, res, next);

    expect(statusCode).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.order.provider).toBeDefined();
    expect(responseData.order.provider.paymentScanner).toBeDefined();
    expect(responseData.order.provider.paymentScanner.paymentUpiId || responseData.order.provider.paymentScanner.upiId).toBe('laundry.partner@oksbi');
    expect(responseData.order.provider.paymentScanner.qrImage).toContain('data:image/jpeg;base64');
  });
});
