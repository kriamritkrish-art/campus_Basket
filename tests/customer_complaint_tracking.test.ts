import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SupportController } from '../backend/src/controllers/supportController';
import { prisma } from '../backend/src/config/database';

function mockRes() {
  let statusCode = 200;
  let responseData: any = null;
  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      return res;
    }
  };
  return { res, getStatusCode: () => statusCode, getResponseData: () => responseData };
}

describe('Customer Complaint & Grievance Real-Time Tracking Suite', () => {
  const studentId = 'stud_sourav';
  let createdTicketId: string = '';
  let createdTicketNumber: string = '';

  it('1. Customer can raise a complaint on any campus order (Food, Laundry, Essentials)', async () => {
    const req: any = {
      body: {
        orderId: 'ord_food_101',
        category: 'DELIVERY',
        message: '[Order hasn\'t arrived] Runner is unreachable near Hall 11',
        priority: 'HIGH'
      },
      user: {
        id: 'user_admin_sourav',
        userId: 'user_admin_sourav',
        studentId: studentId,
        role: 'STUDENT'
      }
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    await SupportController.createTicket(req, res, (err) => { throw err; });

    expect(getStatusCode()).toBe(201);
    const data = getResponseData();
    expect(data.success).toBe(true);
    expect(data.ticket).toBeDefined();
    expect(data.ticket.ticketNumber).toMatch(/^TKT-/);
    expect(data.ticket.status).toBe('OPEN');
    expect(data.ticket.orderId).toBe('ord_food_101');

    createdTicketId = data.ticket.id;
    createdTicketNumber = data.ticket.ticketNumber;
  });

  it('2. Customer can track complaints in real-time with attached order data', async () => {
    const req: any = {
      user: {
        id: 'user_admin_sourav',
        userId: 'user_admin_sourav',
        studentId: studentId,
        role: 'STUDENT'
      }
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    await SupportController.getStudentTickets(req, res, (err) => { throw err; });

    expect(getStatusCode()).toBe(200);
    const data = getResponseData();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.tickets)).toBe(true);

    const ticket = data.tickets.find((t: any) => t.id === createdTicketId);
    expect(ticket).toBeDefined();
    expect(ticket.ticketNumber).toBe(createdTicketNumber);
    expect(ticket.status).toBe('OPEN');
    expect(ticket.adminResponse).toBeNull();
  });

  it('3. Admin enters official resolution response and marks ticket RESOLVED', async () => {
    const req: any = {
      params: { id: createdTicketId },
      body: {
        status: 'RESOLVED',
        adminResponse: 'Runner located near Hall 11 entrance. Delivery handed over intact. ₹20 delay coupon CAMPUS50 credited.'
      },
      user: { role: 'ADMIN' }
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    await SupportController.resolveTicket(req, res, (err) => { throw err; });

    expect(getStatusCode()).toBe(200);
    const data = getResponseData();
    expect(data.success).toBe(true);
    expect(data.ticket.status).toBe('RESOLVED');
    expect(data.ticket.adminResponse).toContain('Runner located near Hall 11');
  });

  it('4. Customer immediately sees the official admin reply and RESOLVED status in tracking', async () => {
    const req: any = {
      user: {
        id: 'user_admin_sourav',
        userId: 'user_admin_sourav',
        studentId: studentId,
        role: 'STUDENT'
      }
    };

    const { res, getStatusCode, getResponseData } = mockRes();
    await SupportController.getStudentTickets(req, res, (err) => { throw err; });

    expect(getStatusCode()).toBe(200);
    const data = getResponseData();
    const ticket = data.tickets.find((t: any) => t.id === createdTicketId);
    expect(ticket).toBeDefined();
    expect(ticket.status).toBe('RESOLVED');
    expect(ticket.adminResponse).toBe('Runner located near Hall 11 entrance. Delivery handed over intact. ₹20 delay coupon CAMPUS50 credited.');
  });

  afterEach(async () => {
    if (createdTicketId) {
      await (prisma as any).supportTicket?.deleteMany?.({ where: { id: createdTicketId } }).catch(() => {});
    }
  });
});
