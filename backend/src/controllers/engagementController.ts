import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createReviewSchema } from '../validators/orderValidators';

export class EngagementController {
  /**
   * Submit product review (Only students who completed an order can review)
   */
  public static async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(403).json({ success: false, message: 'Student profile required' });
        return;
      }

      const data = createReviewSchema.parse(req.body);

      // Verify student ordered this item
      const hasOrdered = await prisma.orderItem.findFirst({
        where: {
          productId: data.productId,
          order: {
            studentId,
            status: 'DELIVERED'
          }
        }
      });

      if (!hasOrdered) {
        res.status(403).json({
          success: false,
          message: 'You can only review products that have been delivered to you.'
        });
        return;
      }

      const review = await prisma.review.create({
        data: {
          studentId,
          productId: data.productId,
          rating: data.rating,
          comment: data.comment || null
        }
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for your rating!',
        review
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle Product Favorite
   */
  public static async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;
      const { productId } = req.body;

      if (!studentId) {
        res.status(403).json({ success: false, message: 'Student profile required' });
        return;
      }

      const existing = await prisma.favorite.findUnique({
        where: {
          studentId_productId: { studentId, productId }
        }
      });

      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } });
        res.status(200).json({ success: true, isFavorite: false, message: 'Removed from favorites' });
      } else {
        await prisma.favorite.create({ data: { studentId, productId } });
        res.status(200).json({ success: true, isFavorite: true, message: 'Added to favorites' });
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Student Favorite Products
   */
  public static async getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(403).json({ success: false, message: 'Student profile required' });
        return;
      }

      const favorites = await prisma.favorite.findMany({
        where: { studentId },
        include: {
          product: {
            include: { images: true, category: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        favorites: favorites.map((f: any) => ({
          id: f.id,
          productId: f.productId,
          product: f.product
            ? {
                ...f.product,
                price: Number(f.product.price),
                discountPrice: f.product.discountPrice ? Number(f.product.discountPrice) : null,
                primaryImage: f.product.images?.[0]?.googleDriveUrl || null
              }
            : null
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Active Campus Announcements
   */
  public static async getAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const announcements = await prisma.announcement.findMany({
        where: {
          isActive: true,
          startTime: { lte: now }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, announcements });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Validate Coupon code
   */
  public static async validateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, cartTotal } = req.body;
      const studentId = req.user?.studentId;

      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (!coupon || !coupon.isActive) {
        res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
        return;
      }

      if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
        res.status(400).json({ success: false, message: 'This coupon code has expired' });
        return;
      }

      const total = parseFloat(cartTotal || '0');
      if (total < Number(coupon.minOrderAmount)) {
        res.status(400).json({
          success: false,
          message: `Minimum order of ₹${coupon.minOrderAmount} required for this coupon`
        });
        return;
      }

      // Check per-user limit
      if (studentId) {
        const usageCount = await prisma.couponUsage.count({
          where: { couponId: coupon.id, studentId }
        });
        if (usageCount >= coupon.perUserLimit) {
          res.status(400).json({
            success: false,
            message: 'You have already used this coupon the maximum permitted times'
          });
          return;
        }
      }

      let discount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        const calc = (total * Number(coupon.discountValue)) / 100;
        discount = coupon.maxDiscountAmount ? Math.min(calc, Number(coupon.maxDiscountAmount)) : calc;
      } else {
        discount = Number(coupon.discountValue);
      }

      res.status(200).json({
        success: true,
        discount: Math.round(discount),
        code: coupon.code,
        description: coupon.description
      });
    } catch (err) {
      next(err);
    }
  }
}
