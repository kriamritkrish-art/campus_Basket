import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export class ProviderController {
  /**
   * Get provider dashboard summary and assigned jobs
   */
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = req.user?.providerId;
      if (!providerId) {
        res.status(403).json({ success: false, message: 'Provider profile required' });
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [assignedOrders, activeLaundryJobs, completedToday] = await Promise.all([
        prisma.order.findMany({
          where: {
            providerId,
            status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] }
          },
          include: {
            student: { select: { fullName: true, mobileNumber: true } },
            items: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.laundryOrder.findMany({
          where: {
            status: { in: ['REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED', 'CLOTHES_COLLECTED', 'WASHING', 'DRYING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED'] }
          },
          include: {
            student: { select: { fullName: true, mobileNumber: true } },
            items: true,
            photos: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.order.count({
          where: {
            providerId,
            status: 'DELIVERED',
            updatedAt: { gte: todayStart }
          }
        })
      ]);

      res.status(200).json({
        success: true,
        stats: {
          pendingOrdersCount: assignedOrders.length,
          activeLaundryCount: activeLaundryJobs.length,
          completedToday
        },
        assignedOrders: assignedOrders.map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount)
        })),
        laundryJobs: activeLaundryJobs.map((l) => ({
          ...l,
          estimatedPrice: Number(l.estimatedPrice)
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update order status by assigned provider
   */
  public static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const providerId = req.user?.providerId;

      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      // Ensure provider is assigned to this order (or claim unassigned)
      if (order.providerId && order.providerId !== providerId) {
        res.status(403).json({ success: false, message: 'You are not assigned to this order' });
        return;
      }

      const allowedStatuses = ['PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status transition for provider' });
        return;
      }

      await prisma.order.update({
        where: { id },
        data: {
          status,
          providerId: order.providerId || providerId,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: status,
              changedBy: req.user?.email || 'PROVIDER',
              notes: notes || `Provider updated status to ${status}`
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`
      });
    } catch (err) {
      next(err);
    }
  }
}
