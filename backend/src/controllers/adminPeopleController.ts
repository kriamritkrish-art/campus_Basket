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
          collegeEmail: s.collegeEmail || s.user?.collegeEmail || s.user?.email,
          personalEmail: s.personalEmail || s.user?.personalEmail || null,
          department: s.department || 'Computer Science & Engineering',
          programme: s.programme || 'B.Tech',
          year: s.year || '1st Year',
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
   * Delete Student Account (Admin Action)
   * Prompt Rule: Once admin deletes any account, student can do fresh registration.
   */
  public static async deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const student = await prisma.student.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student account not found' });
        return;
      }

      const userId = student.userId;
      const collegeEmail = student.collegeEmail || student.user.collegeEmail || student.user.email;
      const personalEmail = student.personalEmail || student.user.personalEmail;

      // Transactionally cascade delete student records
      await prisma.$transaction(async (tx) => {
        // Delete cart and items
        await tx.cartItem.deleteMany({ where: { cart: { studentId: student.id } } });
        await tx.cart.deleteMany({ where: { studentId: student.id } });

        // Delete favorites, reviews, coupon usages, tickets
        await tx.favorite.deleteMany({ where: { studentId: student.id } });
        await tx.review.deleteMany({ where: { studentId: student.id } });
        await tx.couponUsage.deleteMany({ where: { studentId: student.id } });
        await tx.supportTicket.deleteMany({ where: { studentId: student.id } });

        // Delete receipts
        await tx.receipt.deleteMany({ where: { studentId: student.id } });

        // Delete laundry orders
        const laundryOrders = await tx.laundryOrder.findMany({ where: { studentId: student.id } });
        for (const lo of laundryOrders) {
          await tx.laundryItem.deleteMany({ where: { laundryOrderId: lo.id } });
          await tx.laundryItemPhoto.deleteMany({ where: { laundryOrderId: lo.id } });
          await tx.laundryOtp.deleteMany({ where: { laundryOrderId: lo.id } });
          await tx.laundryStatusHistory.deleteMany({ where: { laundryOrderId: lo.id } });
        }
        await tx.laundryOrder.deleteMany({ where: { studentId: student.id } });

        // Delete store orders
        const orders = await tx.order.findMany({ where: { studentId: student.id } });
        for (const o of orders) {
          await tx.orderItem.deleteMany({ where: { orderId: o.id } });
          await tx.orderStatusHistory.deleteMany({ where: { orderId: o.id } });
        }
        await tx.order.deleteMany({ where: { studentId: student.id } });

        // Invalidate OTP verifications
        const emailList = [collegeEmail, personalEmail, student.user.email].filter(Boolean) as string[];
        await tx.otpVerification.deleteMany({
          where: { email: { in: emailList } }
        });

        // Delete notifications and sessions
        await tx.notification.deleteMany({ where: { userId } });
        await tx.session.deleteMany({ where: { userId } });

        // Delete Student and User records
        await tx.student.delete({ where: { id: student.id } });
        await tx.user.delete({ where: { id: userId } });
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'STUDENT_ACCOUNT_DELETED',
        entity: 'Student',
        entityId: student.id,
        oldValue: { rollNumber: student.rollNumber, collegeEmail, personalEmail },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: `Student account for ${student.fullName} has been deleted. The student can now register freshly.`
      });
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
