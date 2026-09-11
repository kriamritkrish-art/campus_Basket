import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createSupportTicketSchema } from '../validators/orderValidators';
import { generateTicketNumber } from '../utils/crypto';
import { fallbackUsers } from '../services/fallbackData';

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
      const studentId = req.user?.studentId;
      const tickets = await prisma.supportTicket.findMany({
        where: { studentId },
        include: { order: true },
        orderBy: { createdAt: 'desc' }
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
