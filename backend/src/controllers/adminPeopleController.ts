import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditService } from '../services/audit/AuditService';

export class AdminPeopleController {
  /**
   * Students Directory & Management
   */
  public static async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, hall } = req.query;

      const students = await prisma.student.findMany({
        include: {
          user: true,
          hall: true,
          orders: { select: { id: true, totalAmount: true, status: true } },
          laundryOrders: { select: { id: true, status: true } }
        }
      });

      let filtered = students;
      if (hall && hall !== 'ALL') {
        filtered = filtered.filter((s) => s.hall?.name === hall || s.hallNumber === hall);
      }

      if (search) {
        const q = (search as string).toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.fullName.toLowerCase().includes(q) ||
            s.rollNumber.toLowerCase().includes(q) ||
            s.registrationNumber?.toLowerCase().includes(q) ||
            s.user?.email.toLowerCase().includes(q) ||
            s.mobileNumber.includes(q)
        );
      }

      res.status(200).json({
        success: true,
        total: filtered.length,
        students: filtered.map((s) => ({
          id: s.id,
          userId: s.userId,
          fullName: s.fullName,
          email: s.user?.email,
          rollNumber: s.rollNumber,
          registrationNumber: s.registrationNumber,
          mobileNumber: s.mobileNumber,
          hallName: s.hall?.name || `Hall ${s.hallNumber || '11'}`,
          roomNumber: s.roomNumber,
          isActive: s.user?.isActive ?? true,
          isVerified: s.isVerified,
          totalOrders: s.orders?.length || 0,
          totalLaundryOrders: s.laundryOrders?.length || 0,
          createdAt: s.createdAt
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleStudentActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      await prisma.user.update({
        where: { id: student.userId },
        data: { isActive: isActive === true || isActive === 'true' }
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'STUDENT_STATUS_TOGGLED',
        entity: 'User',
        entityId: student.userId,
        newValue: { isActive },
        ipAddress: req.ip
      });

      res.status(200).json({ success: true, message: `Student status updated to ${isActive ? 'Active' : 'Deactivated'}` });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Service Providers Management
   */
  public static async getProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = await prisma.serviceProvider.findMany({
        include: { user: true }
      });

      res.status(200).json({
        success: true,
        providers: providers.map((p) => ({
          id: p.id,
          userId: p.userId,
          fullName: p.fullName,
          email: p.user?.email,
          mobileNumber: p.mobileNumber,
          serviceCategory: p.serviceCategory,
          assignedZones: p.assignedZones,
          activeStatus: p.activeStatus,
          createdAt: p.createdAt
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleProviderActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { activeStatus } = req.body;

      const updated = await prisma.serviceProvider.update({
        where: { id },
        data: { activeStatus: activeStatus === true || activeStatus === 'true' }
      });

      res.status(200).json({ success: true, message: 'Provider status updated', provider: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Residence Halls Management
   */
  public static async getHalls(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const halls = await prisma.hall.findMany({
        include: { serviceZone: true, students: { select: { id: true } } }
      });

      res.status(200).json({
        success: true,
        halls: halls.map((h) => ({
          id: h.id,
          name: h.name,
          hallNumber: h.hallNumber,
          zoneName: h.serviceZone?.name || 'Zone B',
          isActive: h.isActive,
          isServiceable: h.isServiceable,
          studentCount: h.students?.length || 0,
          deliveryInstructions: h.deliveryInstructions
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createHall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, hallNumber, serviceZoneId, deliveryInstructions } = req.body;

      const hall = await prisma.hall.create({
        data: {
          name,
          hallNumber,
          serviceZoneId: serviceZoneId || undefined,
          isActive: true,
          isServiceable: true,
          deliveryInstructions
        }
      });

      res.status(201).json({ success: true, message: 'Hall added', hall });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Support Tickets
   */
  public static async getSupportTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tickets = await prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, tickets });
    } catch (err) {
      next(err);
    }
  }

  public static async replySupportTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;

      const updated = await prisma.supportTicket.update({
        where: { id },
        data: {
          status,
          adminResponse
        }
      });

      res.status(200).json({ success: true, message: 'Ticket updated', ticket: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Audit Logs
   */
  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, logs });
    } catch (err) {
      next(err);
    }
  }
}
