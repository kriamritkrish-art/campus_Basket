import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AuditService } from '../services/audit/AuditService';
import {
  createServiceProviderSchema,
  createDeliveryBoySchema
} from '../validators/authValidators';

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

        const provider = await tx.serviceProvider.create({
          data: {
            userId: user.id,
            fullName,
            mobileNumber,
            serviceCategory: data.serviceCategory,
            activeStatus: isActive,
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

        await tx.serviceProvider.update({
          where: { id },
          data: {
            ...(targetName && { fullName: targetName }),
            ...(serviceCategory && { serviceCategory }),
            ...(targetPhone && { mobileNumber: targetPhone }),
            ...(activeStatus !== undefined && { activeStatus: activeStatus === true || activeStatus === 'true' }),
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
      const { fullName, mobileNumber, phone, vehicleType, activeStatus, status, password, email, username } = req.body;
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

      await prisma.$transaction(async (tx) => {
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: deliveryBoy.userId },
            data: userUpdates
          });
        }

        await tx.deliveryBoy.update({
          where: { id },
          data: {
            ...(fullName && { fullName: fullName.trim() }),
            ...(targetPhone && { mobileNumber: targetPhone }),
            ...(vehicleType && { vehicleType }),
            ...(resolvedActive !== undefined && { activeStatus: resolvedActive }),
            ...(password && { plainPassword: password.trim() })
          }
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
