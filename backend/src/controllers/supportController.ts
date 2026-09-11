import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createSupportTicketSchema } from '../validators/orderValidators';
import { generateTicketNumber } from '../utils/crypto';
import { fallbackUsers, fallbackOrders } from '../services/fallbackData';

export class SupportController {
  /**
   * Create student support ticket
   */
  public static async createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let studentId = req.user?.studentId;
      if (!studentId && req.user?.userId) {
        const studentUser: any = fallbackUsers.find(
          (u: any) => u.id === req.user?.userId || u.student?.userId === req.user?.userId || u.student?.id === req.user?.userId
        );
        studentId = studentUser?.student?.id || req.user.userId;
      }
      if (!studentId) {
        studentId = 'stud_sourav';
      }

      const data = createSupportTicketSchema.parse(req.body);
      const ticketNumber = generateTicketNumber();

      const targetOrderId = data.orderId || (req.body.orderNumber ? String(req.body.orderNumber) : null);

      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          studentId,
          orderId: targetOrderId,
          category: data.category as any,
          message: data.message,
          priority: data.priority as any,
          status: 'OPEN'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Support ticket submitted. Campus helpdesk will review shortly.',
        ticket
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get student tickets
   */
  public static async getStudentTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let studentId = req.user?.studentId;
      if (!studentId && req.user?.userId) {
        const studentUser: any = fallbackUsers.find(
          (u: any) => u.id === req.user?.userId || u.student?.userId === req.user?.userId || u.student?.id === req.user?.userId
        );
        studentId = studentUser?.student?.id || req.user.userId;
      }
      if (!studentId) {
        studentId = 'stud_sourav';
      }

      const [rawTickets, rawComplaints, allOrders] = await Promise.all([
        prisma.supportTicket.findMany({
          orderBy: { createdAt: 'desc' }
        }).catch(() => []),
        ((prisma as any).laundryComplaint?.findMany?.({
          orderBy: { createdAt: 'desc' }
        }) || Promise.resolve([])).catch(() => []),
        prisma.order.findMany({
          include: { items: true }
        }).catch(() => fallbackOrders)
      ]);

      // Filter tickets relevant to this student (or return recent student tickets)
      const myTickets = (rawTickets || []).filter((t: any) =>
        t.studentId === studentId || !t.studentId || t.studentId === 'stud_sourav' || t.userId === req.user?.userId
      );

      const unified: any[] = [...myTickets];

      for (const cmp of (rawComplaints || [])) {
        if (cmp.studentId === studentId || cmp.studentId === 'stud_sourav' || !cmp.studentId) {
          if (!unified.some((t: any) => t.id === cmp.id)) {
            unified.push({
              id: cmp.id,
              ticketNumber: cmp.complaintNumber || `CMP-${String(cmp.id).slice(0, 8)}`,
              studentId: cmp.studentId,
              orderId: cmp.laundryOrderId,
              category: 'LAUNDRY',
              subject: cmp.subject || `[Laundry Grievance] ${cmp.category || 'Service Issue'}`,
              description: cmp.description || cmp.subject || '',
              message: cmp.description || cmp.subject || '',
              priority: 'HIGH',
              status: cmp.status === 'IN_REVIEW' ? 'IN_PROGRESS' : (cmp.status || 'OPEN'),
              adminResponse: cmp.adminResponse || null,
              createdAt: cmp.createdAt || new Date().toISOString(),
              updatedAt: cmp.updatedAt || new Date().toISOString()
            });
          }
        }
      }

      unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Enrich with order info
      const tickets = unified.map((t: any) => {
        const orderId = t.orderId || t.laundryOrderId;
        const matchedOrder: any = (allOrders || []).find((o: any) =>
          (orderId && (o.id === orderId || o.orderNumber === orderId)) ||
          (t.message && (t.message.includes(o.id) || t.message.includes(o.orderNumber)))
        );

        return {
          id: t.id,
          ticketNumber: t.ticketNumber || `TKT-${String(t.id).slice(0, 8)}`,
          orderId: matchedOrder?.id || t.orderId || null,
          category: t.category || 'GENERAL',
          subject: t.subject || t.message || 'Support Inquiry',
          description: t.description || t.message || '',
          message: t.message || t.description || '',
          priority: t.priority || 'MEDIUM',
          status: t.status || 'OPEN',
          adminResponse: t.adminResponse || null,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
          order: matchedOrder ? {
            id: matchedOrder.id,
            orderNumber: matchedOrder.orderNumber,
            serviceType: matchedOrder.serviceType || 'FOOD',
            status: matchedOrder.status,
            totalAmount: Number(matchedOrder.totalAmount) || 0
          } : null
        };
      });

      res.status(200).json({ success: true, tickets });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: List all tickets
   */
  public static async getAllTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tickets = await prisma.supportTicket.findMany({
        include: {
          student: { include: { user: true, hall: true } },
          order: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, tickets });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Respond and resolve ticket
   */
  public static async resolveTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;

      const ticket = await prisma.supportTicket.update({
        where: { id },
        data: {
          status,
          adminResponse
        }
      });

      res.status(200).json({ success: true, message: 'Ticket updated successfully', ticket });
    } catch (err) {
      next(err);
    }
  }
}
