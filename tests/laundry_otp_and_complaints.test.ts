import { describe, it, expect } from 'vitest';
import { prisma } from '../backend/src/config/database';
import { LaundryController } from '../backend/src/controllers/laundryController';
import { AdminServicesController } from '../backend/src/controllers/adminServicesController';

describe('Authoritative Laundry OTP, Central Status, Address Snapshot & Complaint System', () => {
  let createdOrderId: string;
  let pickupOtpValue: string;
  let deliveryOtpValue: string;
  let createdComplaintId: string;
  const studentId = 'student_sourav';
  const providerId = 'prov_dhobi_auth';

  const mockRes = () => {
    let statusCode = 200;
    let responseData: any = null;
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
    return {
      res,
      getStatusCode: () => statusCode,
      getResponseData: () => responseData
    };
  };

  it('1. Generates unique 6-digit Pickup OTP immediately upon laundry order creation with permanent address snapshot', async () => {
    const req: any = {
      body: {
        items: [
          { itemType: 'SHIRT', quantity: 3 },
          { itemType: 'JEANS', quantity: 2 }
        ],
        preferredPickupTime: '10:00 AM',
        preferredReturnTime: '06:00 PM',
        specialInstructions: 'Handle with care',
        paymentMethod: 'COD',
        pickupDate: new Date().toISOString(),
        hallName: 'Hall 7',
        roomNumber: 'A-204'
      },
      user: {
        id: 'user_admin_sourav',
        userId: 'user_admin_sourav',
        studentId: studentId,
        role: 'STUDENT',
        email: 'souravsenapati408@gmail.com',
        fullName: 'Sourav Senapati'
      },
      ip: '127.0.0.1'
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    const next = (err: any) => { throw err; };

    await LaundryController.createOrder(req, res, next);

    expect(getStatusCode()).toBe(201);
    const data = getResponseData();
    expect(data.success).toBe(true);
    expect(data.order.id).toBeDefined();
    expect(data.order.status).toBe('REQUESTED');
    expect(data.order.pickupOtp).toBeDefined();
    expect(data.order.pickupOtp).toMatch(/^\d{6}$/);

    createdOrderId = data.order.id;
    pickupOtpValue = data.order.pickupOtp;

    // Verify in database: OTP is stored against the exact Laundry Order ID
    const dbOrder = await prisma.laundryOrder.findUnique({
      where: { id: createdOrderId },
      include: { otps: true }
    });

    expect(dbOrder).toBeDefined();
    expect(dbOrder?.hallName).toBe('Hall 7');
    expect(dbOrder?.roomNumber).toBe('A-204');
    expect(dbOrder?.otps.length).toBe(1);
    expect(dbOrder?.otps[0].otpType).toBe('PICKUP');
    expect(dbOrder?.otps[0].isUsed).toBe(false);
  });

  it('2. Student dashboard displays real decrypted Pickup OTP and exact address snapshot', async () => {
    const req: any = {
      params: { id: createdOrderId },
      user: { id: 'user_admin_sourav', studentId: studentId, role: 'STUDENT' },
      ip: '127.0.0.1'
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    const next = (err: any) => { throw err; };

    await LaundryController.getOrderDetail(req, res, next);

    expect(getStatusCode()).toBe(200);
    const data = getResponseData();
    expect(data.success).toBe(true);
    expect(data.order.pickupOtp).toBe(pickupOtpValue);
    expect(data.order.addressSnapshot).toContain('Hall 7');
    expect(data.order.addressSnapshot).toContain('Room A-204');
    expect(data.order.deliveryOtp).toBeNull();
  });

  it('3. Dhobi accepts the order from broadcast pool; Pickup OTP remains authoritative and unchanged', async () => {
    const req: any = {
      params: { id: createdOrderId },
      user: { role: 'SERVICE_PROVIDER', providerId: providerId },
      ip: '127.0.0.1'
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    const next = (err: any) => { throw err; };

    await LaundryController.acceptOrder(req, res, next);

    expect(getStatusCode()).toBe(200);
    const data = getResponseData();
    expect(data.success).toBe(true);
    expect(data.order.status).toBe('ACCEPTED');
    expect(data.order.providerId).toBe(providerId);

    // Verify Pickup OTP remains the same single record
    const otps = await prisma.laundryOtp.findMany({
      where: { laundryOrderId: createdOrderId }
    });
    expect(otps.length).toBe(1);
    expect(otps[0].otpType).toBe('PICKUP');
  });

  it('4. Incorrect Pickup OTP is rejected and does NOT change status', async () => {
    const req: any = {
      params: { id: createdOrderId },
      body: { otp: '999999' },
      user: { role: 'SERVICE_PROVIDER', providerId: providerId },
      ip: '127.0.0.1'
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    const next = (err: any) => { throw err; };

    await LaundryController.verifyPickupOtp(req, res, next);

    expect(getStatusCode()).toBe(400);
    const data = getResponseData();
    expect(data.success).toBe(false);
    expect(data.message).toMatch(/invalid|incorrect/i);

    // Order status must remain ACCEPTED
    const dbOrder = await prisma.laundryOrder.findUnique({
      where: { id: createdOrderId }
    });
    expect(dbOrder?.status).toBe('ACCEPTED');
  });

  it('5. Correct Pickup OTP verifies successfully and transitions status to CLOTHES_COLLECTED', async () => {
    const req: any = {
      params: { id: createdOrderId },
      body: { otp: pickupOtpValue },
      user: { role: 'SERVICE_PROVIDER', providerId: providerId },
      ip: '127.0.0.1'
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    const next = (err: any) => { throw err; };

    await LaundryController.verifyPickupOtp(req, res, next);

    expect(getStatusCode()).toBe(200);
    const data = getResponseData();
    expect(data.success).toBe(true);
    expect(data.order.status).toBe('CLOTHES_COLLECTED');

    // DB verify
    const dbOrder = await prisma.laundryOrder.findUnique({
      where: { id: createdOrderId },
      include: { otps: true }
    });
    expect(dbOrder?.status).toBe('CLOTHES_COLLECTED');
    const pickupOtpRec = dbOrder?.otps.find(o => o.otpType === 'PICKUP');
    expect(pickupOtpRec?.isUsed).toBe(true);
  });

  it('6. Used Pickup OTP cannot be reused', async () => {
    const req: any = {
      params: { id: createdOrderId },
      body: { otp: pickupOtpValue },
      user: { role: 'SERVICE_PROVIDER', providerId: providerId },
      ip: '127.0.0.1'
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    const next = (err: any) => { throw err; };

    await LaundryController.verifyPickupOtp(req, res, next);

    expect(getStatusCode()).toBe(400);
    const data = getResponseData();
    expect(data.success).toBe(false);
    expect(data.message).toMatch(/already used|already been verified|invalid/i);
  });

  it('7. Workflow advances to WASHING and then READY, triggering unique Return/Delivery OTP', async () => {
    // Transition to WASHING
    {
      const req: any = {
        params: { id: createdOrderId },
        body: { status: 'WASHING' },
        user: { role: 'SERVICE_PROVIDER', providerId: providerId },
        ip: '127.0.0.1'
      };
      const { res, getStatusCode, getResponseData } = mockRes();
      await LaundryController.updateStatus(req, res, (err) => { throw err; });
      expect(getStatusCode()).toBe(200);
      expect(getResponseData().order.status).toBe('WASHING');
    }

    // Transition to READY (generates Return OTP)
    {
      const req: any = {
        params: { id: createdOrderId },
        body: { status: 'READY' },
        user: { role: 'SERVICE_PROVIDER', providerId: providerId },
        ip: '127.0.0.1'
      };
      const { res, getStatusCode, getResponseData } = mockRes();
      await LaundryController.updateStatus(req, res, (err) => { throw err; });
      expect(getStatusCode()).toBe(200);
      expect(getResponseData().order.status).toBe('READY');
    }

    // Student inspects order: gets the new Return/Delivery OTP
    {
      const req: any = {
        params: { id: createdOrderId },
        user: { id: 'user_admin_sourav', studentId: studentId, role: 'STUDENT' },
        ip: '127.0.0.1'
      };
      const { res, getStatusCode, getResponseData } = mockRes();
      await LaundryController.getOrderDetail(req, res, (err) => { throw err; });
      expect(getStatusCode()).toBe(200);
      const data = getResponseData();
      expect(data.order.deliveryOtp).toBeDefined();
      expect(data.order.deliveryOtp).toMatch(/^\d{6}$/);
      expect(data.order.returnOtp).toBe(data.order.deliveryOtp);

      deliveryOtpValue = data.order.deliveryOtp;
      // Cross-OTP guarantee: Delivery OTP must NOT equal Pickup OTP
      expect(deliveryOtpValue).not.toBe(pickupOtpValue);
    }
  });

  it('8. Pickup OTP cannot be used as Return OTP and incorrect Return OTP is rejected', async () => {
    // Attempt with Pickup OTP as Delivery OTP
    {
      const req: any = {
        params: { id: createdOrderId },
        body: { otp: pickupOtpValue },
        user: { role: 'SERVICE_PROVIDER', providerId: providerId },
        ip: '127.0.0.1'
      };
      const { res, getStatusCode, getResponseData } = mockRes();
      await LaundryController.verifyDeliveryOtp(req, res, (err) => { throw err; });
      expect(getStatusCode()).toBe(400);
      expect(getResponseData().success).toBe(false);
      expect(getResponseData().message).toMatch(/invalid|already used|different|incorrect/i);
    }

    // Attempt with random incorrect OTP
    {
      const req: any = {
        params: { id: createdOrderId },
        body: { otp: '111222' },
        user: { role: 'SERVICE_PROVIDER', providerId: providerId },
        ip: '127.0.0.1'
      };
      const { res, getStatusCode, getResponseData } = mockRes();
      await LaundryController.verifyDeliveryOtp(req, res, (err) => { throw err; });
      expect(getStatusCode()).toBe(400);
      expect(getResponseData().success).toBe(false);
    }

    // Status must still remain READY
    const dbOrder = await prisma.laundryOrder.findUnique({ where: { id: createdOrderId } });
    expect(dbOrder?.status).toBe('READY');
  });

  it('9. Correct Return OTP verifies delivery, transitions status to COMPLETED, and prevents reuse', async () => {
    const req: any = {
      params: { id: createdOrderId },
      body: { otp: deliveryOtpValue },
      user: { role: 'SERVICE_PROVIDER', providerId: providerId },
      ip: '127.0.0.1'
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    const next = (err: any) => { throw err; };

    await LaundryController.verifyDeliveryOtp(req, res, next);

    expect(getStatusCode()).toBe(200);
    const data = getResponseData();
    expect(data.success).toBe(true);
    expect(data.order.status).toBe('COMPLETED');

    // Attempt reuse of Delivery OTP
    {
      const { res: res2, getStatusCode: getStatusCode2, getResponseData: getResponseData2 } = mockRes();
      await LaundryController.verifyDeliveryOtp(req, res2, (err) => { throw err; });
      expect(getStatusCode2()).toBe(400);
      expect(getResponseData2().success).toBe(false);
      expect(getResponseData2().message).toMatch(/already used|already been verified|invalid/i);
    }
  });

  it('10. Order address snapshot remains unchanged even if student profile address changes', async () => {
    // Simulate student updating their profile address to a different hall & room
    await prisma.student.update({
      where: { id: studentId },
      data: {
        hallNumber: '14',
        roomNumber: 'D-999'
      }
    });

    // Check order via Student API
    {
      const req: any = {
        params: { id: createdOrderId },
        user: { id: 'user_admin_sourav', studentId: studentId, role: 'STUDENT' },
        ip: '127.0.0.1'
      };
      const { res, getResponseData } = mockRes();
      await LaundryController.getOrderDetail(req, res, (err) => { throw err; });
      const data = getResponseData();
      // Must STILL show the original order snapshot 'Hall 7' and 'Room A-204'
      expect(data.order.hallName).toBe('Hall 7');
      expect(data.order.roomNumber).toBe('A-204');
      expect(data.order.addressSnapshot).toContain('Hall 7');
      expect(data.order.addressSnapshot).toContain('Room A-204');
    }

    // Check order via Admin API
    {
      const req: any = {
        user: { role: 'ADMIN' },
        query: {},
        ip: '127.0.0.1'
      };
      const { res, getResponseData } = mockRes();
      await AdminServicesController.getExpressLaundry(req, res, (err) => { throw err; });
      const data = getResponseData();
      const adminOrder = data.orders.find((o: any) => o.id === createdOrderId);
      expect(adminOrder).toBeDefined();
      expect(adminOrder.hallName).toBe('Hall 7');
      expect(adminOrder.roomNumber).toBe('A-204');
      expect(adminOrder.addressSnapshot).toContain('Hall 7');
      expect(adminOrder.addressSnapshot).toContain('Room A-204');
    }
  });

  it('11. Student creates a complaint linked to Laundry Order ID; does NOT alter order status', async () => {
    const req: any = {
      body: {
        laundryOrderId: createdOrderId,
        category: 'DAMAGED_GARMENT',
        subject: 'Torn button on blue shirt',
        description: 'One button on the blue shirt was broken during washing. Please inspect.'
      },
      user: {
        id: 'user_admin_sourav',
        userId: 'user_admin_sourav',
        studentId: studentId,
        role: 'STUDENT',
        name: 'Sourav Senapati'
      },
      ip: '127.0.0.1'
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    const next = (err: any) => { throw err; };

    await LaundryController.createComplaint(req, res, next);

    expect(getStatusCode()).toBe(201);
    const data = getResponseData();
    expect(data.success).toBe(true);
    expect(data.complaint.id).toBeDefined();
    expect(data.complaint.complaintNumber).toMatch(/^CMP-/);
    expect(data.complaint.laundryOrderId).toBe(createdOrderId);
    expect(data.complaint.status).toBe('OPEN');

    createdComplaintId = data.complaint.id;

    // Verify the laundry order status did NOT change (remains COMPLETED)
    const dbOrder = await prisma.laundryOrder.findUnique({ where: { id: createdOrderId } });
    expect(dbOrder?.status).toBe('COMPLETED');
  });

  it('12. Student can retrieve their complaints with exact order snapshot', async () => {
    const req: any = {
      user: { id: 'user_admin_sourav', studentId: studentId, role: 'STUDENT' },
      ip: '127.0.0.1'
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    const next = (err: any) => { throw err; };

    await LaundryController.getStudentComplaints(req, res, next);

    expect(getStatusCode()).toBe(200);
    const data = getResponseData();
    expect(data.success).toBe(true);
    const found = data.complaints.find((c: any) => c.id === createdComplaintId);
    expect(found).toBeDefined();
    expect(found.laundryOrderId).toBe(createdOrderId);
    expect(found.category).toBe('DAMAGED_GARMENT');
    expect(found.status).toBe('OPEN');
    expect(found.order).toBeDefined();
    expect(found.order.id).toBe(createdOrderId);
  });

  it('13. Admin can list laundry complaints, view details, and resolve with response', async () => {
    // 1. Get complaints list as admin
    {
      const req: any = {
        query: { status: 'ALL' },
        user: { role: 'ADMIN' },
        ip: '127.0.0.1'
      };
      const { res, getStatusCode, getResponseData } = mockRes();
      await AdminServicesController.getLaundryComplaints(req, res, (err) => { throw err; });
      expect(getStatusCode()).toBe(200);
      const data = getResponseData();
      expect(data.success).toBe(true);
      const found = data.complaints.find((c: any) => c.id === createdComplaintId);
      expect(found).toBeDefined();
      expect(found.studentName).toBe('Sourav Senapati');
      expect(found.laundryOrder).toBeDefined();
      expect(found.laundryOrder.hallName).toBe('Hall 7');
    }

    // 2. Admin updates complaint to RESOLVED with admin response
    {
      const req: any = {
        params: { id: createdComplaintId },
        body: {
          status: 'RESOLVED',
          adminResponse: 'We have verified the garment and credited ₹50 to your wallet for the button repair.',
          assignedTo: 'Campus Admin'
        },
        user: { role: 'ADMIN' },
        ip: '127.0.0.1'
      };
      const { res, getStatusCode, getResponseData } = mockRes();
      await AdminServicesController.updateLaundryComplaint(req, res, (err) => { throw err; });
      expect(getStatusCode()).toBe(200);
      const data = getResponseData();
      expect(data.success).toBe(true);
      expect(data.complaint.status).toBe('RESOLVED');
      expect(data.complaint.adminResponse).toContain('₹50 to your wallet');
      expect(data.complaint.resolvedAt).toBeDefined();
    }

    // 3. Student sees the updated status and admin response in real-time
    {
      const req: any = {
        user: { id: 'user_admin_sourav', studentId: studentId, role: 'STUDENT' },
        ip: '127.0.0.1'
      };
      const { res, getResponseData } = mockRes();
      await LaundryController.getStudentComplaints(req, res, (err) => { throw err; });
      const data = getResponseData();
      const studentComplaint = data.complaints.find((c: any) => c.id === createdComplaintId);
      expect(studentComplaint.status).toBe('RESOLVED');
      expect(studentComplaint.adminResponse).toContain('₹50 to your wallet');
    }
  });
});
