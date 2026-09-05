import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditService } from '../services/audit/AuditService';

export class DeliveryController {
  /**
   * Section 15: Delivery Boy Professional Dashboard
   */
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoyId = req.user?.deliveryBoyId;
      const userId = req.user?.userId;

      const deliveryBoy = await prisma.deliveryBoy.findFirst({
        where: {
          OR: [
            deliveryBoyId ? { id: deliveryBoyId } : {},
            userId ? { userId } : {}
          ]
        },
        include: { user: true }
      });

      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [orders, laundryOrders] = await Promise.all([
        prisma.order.findMany({
          where: { deliveryBoyId: deliveryBoy.id },
          include: {
            student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
            provider: { select: { fullName: true, mobileNumber: true } },
            items: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.laundryOrder.findMany({
          where: { deliveryBoyId: deliveryBoy.id },
          include: {
            student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
            provider: { select: { fullName: true, mobileNumber: true } },
            items: true
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
      const todayDelivered = deliveredOrders.filter((o) => new Date(o.updatedAt) >= todayStart).length;
      const monthDelivered = deliveredOrders.filter((o) => new Date(o.updatedAt) >= monthStart).length;
      const pendingDeliveries = orders.filter((o) =>
        ['DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
      );

      res.status(200).json({
        success: true,
        deliveryBoy: {
          id: deliveryBoy.id,
          fullName: deliveryBoy.fullName,
          mobileNumber: deliveryBoy.mobileNumber,
          vehicleType: deliveryBoy.vehicleType,
          currentZone: deliveryBoy.currentZone,
          email: deliveryBoy.user?.email,
          activeStatus: deliveryBoy.activeStatus
        },
        stats: {
          todayDeliveries: todayDelivered,
          pendingDeliveries: pendingDeliveries.length,
          completedDeliveries: deliveredOrders.length,
          monthDeliveries: monthDelivered,
          totalAssigned: orders.length
        },
        activeAssignments: pendingDeliveries.map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount)
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 15: Assigned Orders
   */
  public static async getAssignedOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoyId = req.user?.deliveryBoyId;
      const userId = req.user?.userId;

      const deliveryBoy = await prisma.deliveryBoy.findFirst({
        where: {
          OR: [
            deliveryBoyId ? { id: deliveryBoyId } : {},
            userId ? { userId } : {}
          ]
        }
      });

      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const orders = await prisma.order.findMany({
        where: {
          deliveryBoyId: deliveryBoy.id,
          status: { in: ['DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] }
        },
        include: {
          student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
          provider: { select: { fullName: true, mobileNumber: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        orders: orders.map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount)
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 15: Delivery History
   */
  public static async getDeliveryHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoyId = req.user?.deliveryBoyId;
      const userId = req.user?.userId;

      const deliveryBoy = await prisma.deliveryBoy.findFirst({
        where: {
          OR: [
            deliveryBoyId ? { id: deliveryBoyId } : {},
            userId ? { userId } : {}
          ]
        }
      });

      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const orders = await prisma.order.findMany({
        where: {
          deliveryBoyId: deliveryBoy.id,
          status: 'DELIVERED'
        },
        include: {
          student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
          provider: { select: { fullName: true, mobileNumber: true } },
          items: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        orders: orders.map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount)
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 17: Update Delivery Status (PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED)
   */
  public static async updateDeliveryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const deliveryBoyId = req.user?.deliveryBoyId;
      const userId = req.user?.userId;

      const deliveryBoy = await prisma.deliveryBoy.findFirst({
        where: {
          OR: [
            deliveryBoyId ? { id: deliveryBoyId } : {},
            userId ? { userId } : {}
          ]
        }
      });

      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      if (order.deliveryBoyId && order.deliveryBoyId !== deliveryBoy.id) {
        res.status(403).json({ success: false, message: 'You are not assigned to this order.' });
        return;
      }

      const allowedStatuses = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status transition for delivery partner. Allowed: Picked Up, Out for Delivery, Delivered.'
        });
        return;
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          status,
          deliveryBoyId: deliveryBoy.id,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: status,
              changedBy: req.user?.email || deliveryBoy.fullName,
              notes: notes || `Delivery status changed to ${status}`
            }
          }
        }
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'ORDER_DELIVERY_STATUS_UPDATED',
        entity: 'Order',
        entityId: order.id,
        newValue: { status, deliveryBoy: deliveryBoy.fullName }
      });

      res.status(200).json({
        success: true,
        message: `Delivery status updated to ${status}`,
        order: updated
      });
    } catch (err) {
      next(err);
    }
  }
}
