import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AuditService } from '../services/audit/AuditService';
import {
  createServiceProviderSchema,
  createDeliveryBoySchema
} from '../validators/authValidators';
import { fallbackUsers } from '../services/fallbackData';

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
        include: {
          user: true,
          products: { select: { id: true, stock: true, availability: true, approvalStatus: true } },
          orders: { select: { id: true, totalAmount: true, status: true, createdAt: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        providers: providers.map((p) => {
          const totalSales = p.orders
            .filter((o) => o.status === 'DELIVERED')
            .reduce((sum, o) => sum + Number(o.totalAmount), 0);
          const fallbackUsername =
            p.user?.username ||
            (p.serviceCategory
              ? `SP_${p.serviceCategory.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}_01`
              : `SP_${p.id.slice(0, 6).toUpperCase()}`);

          return {
            id: p.id,
            userId: p.userId,
            username: fallbackUsername,
            businessName: p.fullName || 'Campus Service Provider',
            fullName: p.fullName,
            contactPerson: p.fullName,
            email: p.user?.email || 'N/A',
            mobileNumber: p.mobileNumber || 'N/A',
            phone: p.mobileNumber || 'N/A',
            serviceCategory: p.serviceCategory,
            assignedZones: p.assignedZones,
            activeStatus: p.activeStatus,
            autoAssignDelivery: p.autoAssignDelivery ?? false,
            plainPassword: p.plainPassword || 'Vendor@12345',
            totalProducts: p.products.length,
            availableProducts: p.products.filter((pr) => pr.availability && pr.approvalStatus === 'APPROVED' && pr.stock > 0).length,
            totalOrders: p.orders.length,
            totalSales,
            createdAt: p.createdAt,
            user: {
              id: p.userId,
              username: fallbackUsername,
              email: p.user?.email || 'N/A'
            }
          };
        })
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createServiceProviderSchema.parse(req.body);
      const email = data.email.toLowerCase().trim();
      const username = data.username.toLowerCase().trim();
      const fullName = (data.businessName || data.fullName || data.contactPerson || '').trim();
      const mobileNumber = (data.mobileNumber || data.phone || '').trim();
      const isActive = data.activeStatus !== false;

      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }]
        }
      });

      if (existing) {
        res.status(409).json({ success: false, message: 'A user with this email or User ID already exists.' });
        return;
      }

      const existingPhone = await prisma.serviceProvider.findUnique({ where: { mobileNumber } });
      if (existingPhone) {
        res.status(409).json({ success: false, message: 'This mobile number is already registered to another provider.' });
        return;
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            username,
            passwordHash,
            role: 'SERVICE_PROVIDER',
            isActive,
            accountStatus: 'ACTIVE'
          }
        });

        const autoAssignDelivery = req.body.autoAssignDelivery === true || req.body.autoAssignDelivery === 'true';
        const provider = await tx.serviceProvider.create({
          data: {
            userId: user.id,
            fullName,
            mobileNumber,
            serviceCategory: data.serviceCategory,
            activeStatus: isActive,
            autoAssignDelivery,
            plainPassword: data.password
          }
        });

        return { user, provider };
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'SERVICE_PROVIDER_CREATED',
        entity: 'ServiceProvider',
        entityId: result.provider.id,
        newValue: { name: data.fullName, category: data.serviceCategory, username, email }
      });

      res.status(201).json({
        success: true,
        message: 'Service Provider created successfully.',
        provider: {
          id: result.provider.id,
          userId: result.user.id,
          username: result.user.username,
          fullName: result.provider.fullName,
          email: result.user.email,
          mobileNumber: result.provider.mobileNumber,
          serviceCategory: result.provider.serviceCategory,
          activeStatus: result.provider.activeStatus
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { fullName, businessName, contactPerson, serviceCategory, mobileNumber, phone, activeStatus, password, email, username } = req.body;

      const provider = await prisma.serviceProvider.findUnique({ where: { id }, include: { user: true } });
      if (!provider) {
        res.status(404).json({ success: false, message: 'Service provider not found.' });
        return;
      }

      const userUpdates: any = {};

      if (email && email.trim()) {
        const cleanEmail = email.toLowerCase().trim();
        const existingEmail = await prisma.user.findFirst({
          where: { email: cleanEmail, id: { not: provider.userId } }
        });
        if (existingEmail) {
          res.status(409).json({ success: false, message: 'This email is already in use by another account.' });
          return;
        }
        userUpdates.email = cleanEmail;
      }

      if (username && username.trim()) {
        const cleanUsername = username.toLowerCase().trim();
        const existingUsername = await prisma.user.findFirst({
          where: { username: cleanUsername, id: { not: provider.userId } }
        });
        if (existingUsername) {
          res.status(409).json({ success: false, message: 'This User ID is already in use by another account.' });
          return;
        }
        userUpdates.username = cleanUsername;
      }

      let passwordHash: string | undefined;
      if (password && password.trim().length >= 6) {
        passwordHash = await bcrypt.hash(password.trim(), 10);
        userUpdates.passwordHash = passwordHash;
      }

      if (activeStatus !== undefined) {
        userUpdates.isActive = activeStatus === true || activeStatus === 'true';
      }

      const targetName = (businessName || fullName || contactPerson || '').trim();
      const targetPhone = (mobileNumber || phone || '').trim();

      await prisma.$transaction(async (tx) => {
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: provider.userId },
            data: userUpdates
          });
        }

        const autoAssign = req.body.autoAssignDelivery !== undefined ? (req.body.autoAssignDelivery === true || req.body.autoAssignDelivery === 'true') : undefined;
        await tx.serviceProvider.update({
          where: { id },
          data: {
            ...(targetName && { fullName: targetName }),
            ...(serviceCategory && { serviceCategory }),
            ...(targetPhone && { mobileNumber: targetPhone }),
            ...(activeStatus !== undefined && { activeStatus: activeStatus === true || activeStatus === 'true' }),
            ...(autoAssign !== undefined && { autoAssignDelivery: autoAssign }),
            ...(password && { plainPassword: password.trim() })
          }
        });
      });

      res.status(200).json({ success: true, message: 'Provider details updated successfully.' });
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

  public static async deleteProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const provider = await prisma.serviceProvider.findUnique({ where: { id } });
      if (!provider) {
        res.status(404).json({ success: false, message: 'Provider not found.' });
        return;
      }

      await prisma.serviceProvider.update({
        where: { id },
        data: { activeStatus: false }
      });
      await prisma.user.update({
        where: { id: provider.userId },
        data: { isActive: false, accountStatus: 'DEACTIVATED' }
      });

      res.status(200).json({ success: true, message: 'Service Provider deactivated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  public static async getProviderDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const provider = await prisma.serviceProvider.findUnique({
        where: { id },
        include: {
          user: true,
          products: {
            include: { category: true, images: true, inventory: true }
          },
          orders: {
            include: {
              student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
              items: true,
              deliveryBoy: { select: { id: true, fullName: true, mobileNumber: true } }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!provider) {
        res.status(404).json({ success: false, message: 'Provider not found.' });
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayOrders = provider.orders.filter((o) => new Date(o.createdAt) >= todayStart);
      const todaySales = todayOrders
        .filter((o) => o.status === 'DELIVERED')
        .reduce((acc, o) => acc + Number(o.totalAmount), 0);

      const totalSales = provider.orders
        .filter((o) => o.status === 'DELIVERED')
        .reduce((acc, o) => acc + Number(o.totalAmount), 0);

      const totalDelivered = provider.orders.filter((o) => o.status === 'DELIVERED').length;
      const totalPending = provider.orders.filter((o) =>
        ['PLACED', 'PAID', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)
      ).length;

      res.status(200).json({
        success: true,
        provider: {
          id: provider.id,
          userId: provider.userId,
          fullName: provider.fullName,
          email: provider.user?.email,
          mobileNumber: provider.mobileNumber,
          serviceCategory: provider.serviceCategory,
          assignedZones: provider.assignedZones,
          activeStatus: provider.activeStatus,
          autoAssignDelivery: provider.autoAssignDelivery ?? false,
          createdAt: provider.createdAt
        },
        analytics: {
          todaySales,
          todayOrders: todayOrders.length,
          totalSales,
          totalOrders: provider.orders.length,
          totalDelivered,
          totalPending,
          totalProducts: provider.products.length,
          activeProducts: provider.products.filter((p) => p.availability && p.approvalStatus === 'APPROVED').length
        },
        products: provider.products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          categoryName: p.category.name,
          price: Number(p.price),
          stock: p.stock,
          approvalStatus: p.approvalStatus,
          availability: p.availability
        })),
        recentOrders: provider.orders.slice(0, 15).map((o) => ({
          id: o.id,
          totalAmount: Number(o.totalAmount),
          status: o.status,
          paymentStatus: o.paymentStatus,
          customerName: o.student?.fullName || 'Student',
          roomNumber: o.student?.roomNumber || 'Hostel Room',
          deliveryPartner: o.deliveryBoy?.fullName || 'Unassigned',
          createdAt: o.createdAt
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delivery Boys Directory & Management
   */
  public static async getDeliveryBoys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoys = await prisma.deliveryBoy.findMany({
        include: {
          user: true,
          orders: { select: { id: true, status: true, totalAmount: true, createdAt: true } },
          laundryOrders: { select: { id: true, status: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const allEarnings = await prisma.deliveryBoyEarning.findMany();
      const earningsByBoy = new Map<string, number>();
      for (const e of allEarnings) {
        earningsByBoy.set(e.deliveryBoyId, (earningsByBoy.get(e.deliveryBoyId) || 0) + Number(e.amount));
      }

      res.status(200).json({
        success: true,
        deliveryBoys: deliveryBoys.map((d) => {
          const activeAssignments = d.orders.filter((o) =>
            ['DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
          ).length;
          const completedDeliveries = d.orders.filter((o) => o.status === 'DELIVERED').length;
          const fallbackUsername =
            d.user?.username ||
            `DB_${d.fullName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'RUNNER'}_01`;
          const paymentType = (d as any).paymentType || 'PER_DELIVERY';
          const perDeliveryRate = Number((d as any).perDeliveryRate) || 10.00;
          const monthlySalary = Number((d as any).monthlySalary) || 0;
          const walletBalance = Number((d as any).walletBalance) || 0;
          const totalEarned = paymentType === 'PER_DELIVERY' ? (earningsByBoy.get(d.id) || walletBalance) : 0;

          return {
            id: d.id,
            userId: d.userId,
            username: fallbackUsername,
            fullName: d.fullName,
            email: d.user?.email || 'runner.delivery@gmail.com',
            mobileNumber: d.mobileNumber,
            phone: d.mobileNumber,
            vehicleType: d.vehicleType || 'Bicycle / Walk',
            activeStatus: d.activeStatus,
            status: d.activeStatus ? 'ACTIVE' : 'INACTIVE',
            currentZone: d.currentZone,
            paymentType,
            perDeliveryRate: paymentType === 'PER_DELIVERY' ? perDeliveryRate : 0,
            monthlySalary: paymentType === 'MONTHLY_CONTRACT' ? monthlySalary : 0,
            walletBalance,
            totalEarned,
            plainPassword: d.plainPassword || 'Delivery@12345',
            activeAssignments,
            completedDeliveries,
            totalAssigned: d.orders.length,
            createdAt: d.createdAt,
            user: {
              id: d.userId,
              username: fallbackUsername,
              email: d.user?.email || 'runner.delivery@gmail.com'
            }
          };
        })
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createDeliveryBoy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createDeliveryBoySchema.parse(req.body);
      const email = data.email.toLowerCase().trim();
      const username = data.username.toLowerCase().trim();
      const mobileNumber = (data.mobileNumber || data.phone || '').trim();
      const isActive = data.status ? data.status === 'ACTIVE' : data.activeStatus !== false;

      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }]
        }
      });

      if (existing) {
        res.status(409).json({ success: false, message: 'A user with this email or User ID already exists.' });
        return;
      }

      const existingPhone = await prisma.deliveryBoy.findUnique({ where: { mobileNumber } });
      if (existingPhone) {
        res.status(409).json({ success: false, message: 'This phone number is already registered to another delivery partner.' });
        return;
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const paymentType = req.body.paymentType === 'MONTHLY_CONTRACT' ? 'MONTHLY_CONTRACT' : 'PER_DELIVERY';
      const perDeliveryRate = paymentType === 'PER_DELIVERY' ? (req.body.perDeliveryRate !== undefined ? Number(req.body.perDeliveryRate) : 10.00) : 0;
      const monthlySalary = paymentType === 'MONTHLY_CONTRACT' ? (req.body.monthlySalary !== undefined ? Number(req.body.monthlySalary) : 15000.00) : 0;

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            username,
            passwordHash,
            role: 'DELIVERY_BOY',
            isActive,
            accountStatus: 'ACTIVE'
          }
        });

        const deliveryBoy = await tx.deliveryBoy.create({
          data: {
            userId: user.id,
            fullName: data.fullName,
            mobileNumber,
            vehicleType: data.vehicleType || 'Bicycle / Walk',
            activeStatus: isActive,
            paymentType: paymentType as any,
            perDeliveryRate: perDeliveryRate as any,
            monthlySalary: monthlySalary as any,
            plainPassword: data.password
          }
        });

        return { user, deliveryBoy };
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'DELIVERY_BOY_CREATED',
        entity: 'DeliveryBoy',
        entityId: result.deliveryBoy.id,
        newValue: { name: data.fullName, username, email }
      });

      res.status(201).json({
        success: true,
        message: 'Delivery Partner account created successfully.',
        deliveryBoy: {
          id: result.deliveryBoy.id,
          userId: result.user.id,
          username: result.user.username,
          fullName: result.deliveryBoy.fullName,
          email: result.user.email,
          mobileNumber: result.deliveryBoy.mobileNumber,
          vehicleType: result.deliveryBoy.vehicleType,
          activeStatus: result.deliveryBoy.activeStatus
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateDeliveryBoy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const {
        fullName,
        mobileNumber,
        phone,
        vehicleType,
        activeStatus,
        status,
        password,
        email,
        username,
        paymentType,
        perDeliveryRate,
        monthlySalary
      } = req.body;
      const targetPhone = (mobileNumber || phone || '').trim();

      const deliveryBoy = await prisma.deliveryBoy.findUnique({ where: { id }, include: { user: true } });
      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery partner not found.' });
        return;
      }

      const userUpdates: any = {};

      if (email && email.trim()) {
        const cleanEmail = email.toLowerCase().trim();
        const existingEmail = await prisma.user.findFirst({
          where: { email: cleanEmail, id: { not: deliveryBoy.userId } }
        });
        if (existingEmail) {
          res.status(409).json({ success: false, message: 'This email is already in use by another account.' });
          return;
        }
        userUpdates.email = cleanEmail;
      }

      if (username && username.trim()) {
        const cleanUsername = username.toLowerCase().trim();
        const existingUsername = await prisma.user.findFirst({
          where: { username: cleanUsername, id: { not: deliveryBoy.userId } }
        });
        if (existingUsername) {
          res.status(409).json({ success: false, message: 'This User ID is already in use by another account.' });
          return;
        }
        userUpdates.username = cleanUsername;
      }

      let passwordHash: string | undefined;
      if (password && password.trim().length >= 6) {
        passwordHash = await bcrypt.hash(password.trim(), 10);
        userUpdates.passwordHash = passwordHash;
      }

      const resolvedActive =
        status !== undefined
          ? status === 'ACTIVE'
          : activeStatus !== undefined
          ? activeStatus === true || activeStatus === 'true'
          : undefined;

      if (resolvedActive !== undefined) {
        userUpdates.isActive = resolvedActive;
      }

      const resolvedPaymentType =
        paymentType !== undefined
          ? (paymentType === 'MONTHLY_CONTRACT' ? 'MONTHLY_CONTRACT' : 'PER_DELIVERY')
          : undefined;

      const dbUpdates: any = {
        ...(fullName && { fullName: fullName.trim() }),
        ...(targetPhone && { mobileNumber: targetPhone }),
        ...(vehicleType && { vehicleType }),
        ...(resolvedActive !== undefined && { activeStatus: resolvedActive }),
        ...(password && { plainPassword: password.trim() })
      };

      if (resolvedPaymentType !== undefined) {
        dbUpdates.paymentType = resolvedPaymentType;
        if (resolvedPaymentType === 'MONTHLY_CONTRACT') {
          dbUpdates.perDeliveryRate = 0;
          if (monthlySalary !== undefined) dbUpdates.monthlySalary = Number(monthlySalary);
        } else if (resolvedPaymentType === 'PER_DELIVERY') {
          if (perDeliveryRate !== undefined) dbUpdates.perDeliveryRate = Number(perDeliveryRate);
          dbUpdates.monthlySalary = 0;
        }
      } else {
        if (perDeliveryRate !== undefined) dbUpdates.perDeliveryRate = Number(perDeliveryRate);
        if (monthlySalary !== undefined) dbUpdates.monthlySalary = Number(monthlySalary);
      }

      await prisma.$transaction(async (tx) => {
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: deliveryBoy.userId },
            data: userUpdates
          });
        }

        await tx.deliveryBoy.update({
          where: { id },
          data: dbUpdates
        });
      });

      res.status(200).json({ success: true, message: 'Delivery partner details updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteDeliveryBoy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deliveryBoy = await prisma.deliveryBoy.findUnique({ where: { id } });
      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery partner not found.' });
        return;
      }

      await prisma.deliveryBoy.update({
        where: { id },
        data: { activeStatus: false }
      });
      await prisma.user.update({
        where: { id: deliveryBoy.userId },
        data: { isActive: false, accountStatus: 'DEACTIVATED' }
      });

      res.status(200).json({ success: true, message: 'Delivery partner deactivated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Manually add or remove earnings adjustment for a delivery boy (Admin Action)
   * Audit trail records Admin, Amount, Reason, Date/Time.
   */
  public static async adjustDeliveryBoyEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, type, reason } = req.body; // type: 'ADD' | 'DEDUCT'

      if (!amount || Number(amount) <= 0) {
        res.status(400).json({ success: false, message: 'Valid positive adjustment amount is required.' });
        return;
      }

      if (!reason || !reason.trim()) {
        res.status(400).json({ success: false, message: 'A reason for manual adjustment is required for audit compliance.' });
        return;
      }

      const deliveryBoy = await prisma.deliveryBoy.findUnique({ where: { id } });
      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery partner not found.' });
        return;
      }

      const numAmount = Number(amount);
      const adjustmentValue = type === 'DEDUCT' ? -numAmount : numAmount;
      const adminIdentifier = req.user?.email || req.user?.userId || 'Admin';

      const result = await prisma.$transaction(async (tx) => {
        const earning = await tx.deliveryBoyEarning.create({
          data: {
            deliveryBoyId: deliveryBoy.id,
            amount: adjustmentValue,
            paymentType: deliveryBoy.paymentType,
            earningType: 'ADMIN_ADJUSTMENT',
            description: reason.trim(),
            adminAdjustedBy: adminIdentifier
          }
        });

        const updatedBoy = await tx.deliveryBoy.update({
          where: { id: deliveryBoy.id },
          data: {
            walletBalance: { increment: adjustmentValue }
          }
        });

        return { earning, updatedBoy };
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'DELIVERY_BOY_EARNINGS_ADJUSTED',
        entity: 'DeliveryBoy',
        entityId: deliveryBoy.id,
        newValue: {
          admin: adminIdentifier,
          amount: adjustmentValue,
          type: type === 'DEDUCT' ? 'DEDUCT' : 'ADD',
          reason: reason.trim(),
          newBalance: Number(result.updatedBoy.walletBalance),
          timestamp: new Date()
        }
      });

      res.status(200).json({
        success: true,
        message: `Successfully adjusted balance by ${adjustmentValue >= 0 ? `+₹${adjustmentValue}` : `-₹${Math.abs(adjustmentValue)}`}.`,
        earning: result.earning,
        walletBalance: Number(result.updatedBoy.walletBalance)
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get complete earnings & adjustment history for a specific delivery boy
   */
  public static async getDeliveryBoyEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deliveryBoy = await prisma.deliveryBoy.findUnique({ where: { id } });
      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery partner not found.' });
        return;
      }

      const earnings = await prisma.deliveryBoyEarning.findMany({
        where: { deliveryBoyId: id },
        include: { order: { select: { orderNumber: true, status: true, deliveredAt: true } } },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        deliveryBoy: {
          id: deliveryBoy.id,
          fullName: deliveryBoy.fullName,
          paymentType: deliveryBoy.paymentType,
          perDeliveryRate: Number(deliveryBoy.perDeliveryRate),
          monthlySalary: Number(deliveryBoy.monthlySalary),
          walletBalance: Number(deliveryBoy.walletBalance)
        },
        earnings: earnings.map((e) => ({
          id: e.id,
          orderId: e.orderId,
          orderNumber: e.order?.orderNumber ? `#${e.order.orderNumber}` : (e.description?.match(/#([A-Z0-9-]+)/)?.[0] || 'ADJUSTMENT'),
          amount: Number(e.amount),
          paymentType: e.paymentType,
          earningType: e.earningType,
          description: e.description,
          adminAdjustedBy: e.adminAdjustedBy,
          createdAt: e.createdAt,
          date: new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Aggregated Delivery Stats for Admin Dashboard
   */
  public static async getDeliveryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoys = await prisma.deliveryBoy.findMany({
        include: { orders: { select: { id: true, status: true } } }
      });

      const earnings = await prisma.deliveryBoyEarning.findMany();
      const totalEarningsPaid = earnings.reduce((sum, e) => sum + Number(e.amount), 0);

      const perDeliveryStaff = deliveryBoys.filter((d) => (d as any).paymentType === 'PER_DELIVERY');
      const monthlyStaff = deliveryBoys.filter((d) => (d as any).paymentType === 'MONTHLY_CONTRACT');

      const totalDelivered = deliveryBoys.reduce(
        (sum, d) => sum + d.orders.filter((o) => o.status === 'DELIVERED').length,
        0
      );

      res.status(200).json({
        success: true,
        stats: {
          totalDeliveryBoys: deliveryBoys.length,
          totalPerDeliveryStaff: perDeliveryStaff.length,
          totalMonthlyStaff: monthlyStaff.length,
          totalCompletedDeliveries: totalDelivered,
          totalEarningsPaid
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async assignDeliveryBoy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // order id
      const { deliveryBoyId } = req.body;

      const [order, deliveryBoy] = await Promise.all([
        prisma.order.findUnique({ where: { id } }),
        deliveryBoyId ? prisma.deliveryBoy.findUnique({ where: { id: deliveryBoyId } }) : null
      ]);

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      if (deliveryBoyId && !deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery partner not found.' });
        return;
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          deliveryBoyId: deliveryBoyId || null,
          status: deliveryBoyId ? 'DELIVERY_ASSIGNED' : order.status,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: deliveryBoyId ? 'DELIVERY_ASSIGNED' : order.status,
              changedBy: req.user?.email || 'ADMIN',
              notes: deliveryBoy
                ? `Delivery assigned to ${deliveryBoy.fullName} (${deliveryBoy.mobileNumber})`
                : 'Delivery partner unassigned'
            }
          }
        }
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'ORDER_DELIVERY_ASSIGNED',
        entity: 'Order',
        entityId: order.id,
        newValue: { deliveryBoyId, deliveryBoyName: deliveryBoy?.fullName }
      });

      res.status(200).json({
        success: true,
        message: deliveryBoy
          ? `Order assigned to ${deliveryBoy.fullName}`
          : 'Order unassigned successfully',
        order: updated
      });
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
      const rawTickets = await prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const tickets = (rawTickets || []).map((t: any) => {
        const studentUser: any = fallbackUsers.find((u: any) => u.student?.id === t.studentId || u.id === t.studentId);
        const student = t.student || studentUser?.student;
        const name = student?.fullName || studentUser?.fullName || t.user?.name || 'Campus Student';
        const email = student?.collegeEmail || studentUser?.email || t.user?.email || 'student@nitdgp.ac.in';
        const phone = student?.mobileNumber || studentUser?.mobileNumber || t.user?.phone || '+91 98765 43210';
        const hallName = student?.hall?.name || student?.hallName || t.user?.hall?.name || 'Campus Hostel';
        const roomNumber = student?.roomNumber || t.user?.roomNumber || '101';

        const subject = t.subject || (t.message ? (t.message.length > 60 ? t.message.slice(0, 60) + '...' : t.message) : `${t.category || 'General'} Support Ticket`);
        const description = t.description || t.message || '';

        return {
          id: t.id,
          ticketNumber: t.ticketNumber || `TKT-${String(t.id).slice(0, 8)}`,
          userId: t.studentId || t.userId || 'stud_demo',
          category: t.category || 'GENERAL',
          subject,
          description,
          message: t.message || description,
          priority: t.priority || 'MEDIUM',
          status: t.status || 'OPEN',
          adminResponse: t.adminResponse || null,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
          user: {
            name,
            email,
            phone,
            hall: { name: hallName },
            roomNumber
          },
          student: student || {
            fullName: name,
            collegeEmail: email,
            mobileNumber: phone
          }
        };
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
