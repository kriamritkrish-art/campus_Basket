import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditService } from '../services/audit/AuditService';

export class AdminCampusController {
  /**
   * Service Zones & Google Maps Geofencing
   */
  public static async getZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zones = await prisma.serviceZone.findMany({
        include: { halls: true }
      });

      res.status(200).json({
        success: true,
        zones: zones.map((z) => ({
          id: z.id,
          name: z.name,
          polygonCoordinates: typeof z.polygonCoordinates === 'string' ? JSON.parse(z.polygonCoordinates) : z.polygonCoordinates,
          isActive: z.isActive,
          availableServices: typeof z.availableServices === 'string' ? JSON.parse(z.availableServices) : z.availableServices,
          hallCount: z.halls?.length || 0
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, polygonCoordinates, availableServices } = req.body;

      const zone = await prisma.serviceZone.create({
        data: {
          name,
          polygonCoordinates: typeof polygonCoordinates === 'object' ? JSON.stringify(polygonCoordinates) : polygonCoordinates,
          availableServices: typeof availableServices === 'object' ? JSON.stringify(availableServices) : availableServices || '["FOOD","FRUITS","LAUNDRY","ESSENTIALS"]',
          isActive: true
        }
      });

      res.status(201).json({ success: true, message: 'Campus service zone created', zone });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Categories CRUD
   */
  public static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        include: { products: { select: { id: true } } },
        orderBy: { displayOrder: 'asc' }
      });

      res.status(200).json({
        success: true,
        categories: categories.map((c) => ({
          ...c,
          productCount: c.products?.length || 0
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug, description, displayOrder = 0 } = req.body;
      const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const category = await prisma.category.create({
        data: {
          name,
          slug: catSlug,
          description,
          displayOrder: parseInt(displayOrder, 10),
          isActive: true
        }
      });

      res.status(201).json({ success: true, message: 'Category created', category });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Marketing: Coupons Management
   */
  public static async getCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupons = await prisma.coupon.findMany({
        include: { category: true }
      });

      res.status(200).json({ success: true, coupons });
    } catch (err) {
      next(err);
    }
  }

  public static async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, description, discountType = 'PERCENTAGE', discountValue, minOrderAmount = 0, maxDiscountAmount, perUserLimit = 1 } = req.body;

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase().trim(),
          description,
          discountType: discountType as any,
          discountValue: parseFloat(discountValue),
          minOrderAmount: parseFloat(minOrderAmount),
          maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
          perUserLimit: parseInt(perUserLimit, 10),
          isActive: true
        }
      });

      res.status(201).json({ success: true, message: 'Coupon created', coupon });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Announcements Management
   */
  public static async getAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const announcements = await prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, announcements });
    } catch (err) {
      next(err);
    }
  }

  public static async createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, message, targetService = 'ALL', targetZone = 'ALL' } = req.body;

      const announcement = await prisma.announcement.create({
        data: {
          title,
          message,
          targetService,
          targetZone,
          isActive: true
        }
      });

      res.status(201).json({ success: true, message: 'Campus announcement published', announcement });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Campus Business Hours Management
   */
  public static async getBusinessHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keys = ['HOURS_FOOD', 'HOURS_FRUITS', 'HOURS_LAUNDRY', 'HOURS_ESSENTIALS'];
      const settings = await prisma.adminSetting.findMany({
        where: { key: { in: keys } }
      });

      const hoursMap: Record<string, any> = {};
      settings.forEach((s) => {
        try {
          hoursMap[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
        } catch {
          hoursMap[s.key] = s.value;
        }
      });

      res.status(200).json({
        success: true,
        hours: {
          food: hoursMap['HOURS_FOOD'] || { open: '08:00', close: '23:30', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], isOpen: true, notice: 'Normal operation' },
          fruits: hoursMap['HOURS_FRUITS'] || { open: '07:00', close: '21:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], isOpen: true, notice: 'Fresh morning & evening batches' },
          laundry: hoursMap['HOURS_LAUNDRY'] || { open: '09:00', close: '19:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], isOpen: true, notice: 'Sunday batch maintenance' },
          essentials: hoursMap['HOURS_ESSENTIALS'] || { open: '09:00', close: '22:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], isOpen: true, notice: 'Stationery & personal care' }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateBusinessHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { service, config } = req.body;
      const keyMap: Record<string, string> = {
        food: 'HOURS_FOOD',
        fruits: 'HOURS_FRUITS',
        laundry: 'HOURS_LAUNDRY',
        essentials: 'HOURS_ESSENTIALS'
      };

      const settingKey = keyMap[service?.toLowerCase()] || `HOURS_${service?.toUpperCase()}`;
      const jsonValue = JSON.stringify(config);

      const updated = await prisma.adminSetting.upsert({
        where: { key: settingKey },
        update: { value: jsonValue },
        create: { key: settingKey, value: jsonValue, description: `${service} Campus Service Hours` }
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'CAMPUS_HOURS_UPDATED',
        entity: 'AdminSetting',
        entityId: updated.id,
        newValue: { service, config }
      });

      res.status(200).json({ success: true, message: `Operating hours for ${service} updated successfully`, config });
    } catch (err) {
      next(err);
    }
  }
}

