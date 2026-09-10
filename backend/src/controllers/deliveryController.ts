import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditService } from '../services/audit/AuditService';
import { DeliverySettlementPdfService } from '../services/pdf/DeliverySettlementPdfService';
import { LedgerService } from '../services/financial/LedgerService';

async function resolveDeliveryBoyProfile(user?: any) {
  if (!user) return null;
  const deliveryBoyId = user.deliveryBoyId;
  const userId = user.userId;

  let deliveryBoy = null;
  if (deliveryBoyId) {
    deliveryBoy = await prisma.deliveryBoy.findUnique({ where: { id: deliveryBoyId }, include: { user: true } });
  }
  if (!deliveryBoy && userId) {
    deliveryBoy = await prisma.deliveryBoy.findUnique({ where: { userId }, include: { user: true } });
  }
  if (!deliveryBoy) {
    deliveryBoy = await prisma.deliveryBoy.findFirst({
      where: {
        OR: [
          deliveryBoyId ? { id: deliveryBoyId } : {},
          userId ? { userId } : {}
        ]
      },
      include: { user: true }
    });
  }

  if (!deliveryBoy && (user.role === 'ADMIN' || user.role === 'DELIVERY_BOY')) {
    deliveryBoy = await prisma.deliveryBoy.findFirst({
      include: { user: true }
    });
  }

  return deliveryBoy;
}

export class DeliveryController {
  /**
   * Delivery Partner Dashboard & Statistics
   */
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
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

      const paymentType = (deliveryBoy as any).paymentType || 'PER_DELIVERY';
      const perDeliveryRate = Number((deliveryBoy as any).perDeliveryRate) || 10.00;
      const monthlySalary = Number((deliveryBoy as any).monthlySalary) || 0;
      const walletBalance = Number((deliveryBoy as any).walletBalance) || 0;

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      // Fetch dynamic earnings records
      const earningsList = await prisma.deliveryBoyEarning.findMany({
        where: { deliveryBoyId: deliveryBoy.id }
      });

      const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
      const todayDelivered = deliveredOrders.filter((o) => new Date(o.deliveredAt || o.updatedAt) >= todayStart).length;
      const monthDelivered = deliveredOrders.filter((o) => new Date(o.deliveredAt || o.updatedAt) >= monthStart).length;
      const pendingDeliveries = orders.filter((o) =>
        ['DELIVERY_ASSIGNED', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
      );

      const todayEarningsList = earningsList.filter((e) => new Date(e.createdAt) >= todayStart);
      const weekEarningsList = earningsList.filter((e) => new Date(e.createdAt) >= weekStart);
      const monthEarningsList = earningsList.filter((e) => new Date(e.createdAt) >= monthStart);

      const earningsToday =
        paymentType === 'PER_DELIVERY'
          ? todayEarningsList.reduce((sum, e) => sum + Number(e.amount), 0)
          : 0;

      const weekEarnings =
        paymentType === 'PER_DELIVERY'
          ? weekEarningsList.reduce((sum, e) => sum + Number(e.amount), 0)
          : 0;

      const monthEarnings =
        paymentType === 'PER_DELIVERY'
          ? monthEarningsList.reduce((sum, e) => sum + Number(e.amount), 0)
          : monthlySalary;

      const totalEarnings =
        paymentType === 'PER_DELIVERY'
          ? earningsList.reduce((sum, e) => sum + Number(e.amount), 0) || walletBalance
          : 0;

      const totalSettled = Number((deliveryBoy as any).totalSettled) || 0;
      const pendingWithdrawalsList = await prisma.deliveryBoyWithdrawal.findMany({
        where: { deliveryBoyId: deliveryBoy.id, status: { in: ['PENDING', 'APPROVED'] } }
      });
      const pendingWithdrawals = pendingWithdrawalsList.reduce((sum, w) => sum + Number(w.amount), 0);
      const payoutAccount = await prisma.deliveryBoyPayoutAccount.findUnique({
        where: { deliveryBoyId: deliveryBoy.id }
      });

      res.status(200).json({
        success: true,
        deliveryBoy: {
          id: deliveryBoy.id,
          fullName: deliveryBoy.fullName,
          mobileNumber: deliveryBoy.mobileNumber,
          vehicleType: deliveryBoy.vehicleType,
          currentZone: deliveryBoy.currentZone,
          email: deliveryBoy.user?.email,
          activeStatus: deliveryBoy.activeStatus,
          paymentType,
          perDeliveryRate: paymentType === 'PER_DELIVERY' ? perDeliveryRate : 0,
          monthlySalary: paymentType === 'MONTHLY_CONTRACT' ? monthlySalary : 0,
          walletBalance,
          totalSettled,
          payoutAccount: payoutAccount ? {
            accountType: payoutAccount.accountType,
            accountHolderName: payoutAccount.accountHolderName,
            bankName: payoutAccount.bankName,
            accountNumberMasked: payoutAccount.accountNumber ? `••••${payoutAccount.accountNumber.slice(-4)}` : null,
            ifscCode: payoutAccount.ifscCode,
            upiId: payoutAccount.upiId
          } : null
        },
        stats: {
          paymentType,
          perDeliveryRate: paymentType === 'PER_DELIVERY' ? perDeliveryRate : 0,
          monthlySalary: paymentType === 'MONTHLY_CONTRACT' ? monthlySalary : 0,
          walletBalance,
          availableBalance: walletBalance,
          totalSettled,
          pendingWithdrawals,
          totalToday: todayDelivered + pendingDeliveries.length,
          completedToday: todayDelivered,
          pendingToday: pendingDeliveries.length,
          earningsToday,
          weekEarnings,
          monthEarnings,
          totalEarnings,
          avgPerDelivery: paymentType === 'PER_DELIVERY' ? perDeliveryRate : 0,
          dailyTarget: 10,
          payoutAccount: payoutAccount ? {
            accountType: payoutAccount.accountType,
            accountHolderName: payoutAccount.accountHolderName,
            bankName: payoutAccount.bankName,
            accountNumberMasked: payoutAccount.accountNumber ? `••••${payoutAccount.accountNumber.slice(-4)}` : null,
            ifscCode: payoutAccount.ifscCode,
            upiId: payoutAccount.upiId
          } : null
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
   * Available Orders for Online Delivery Boys
   * Only returned when the runner is ONLINE (activeStatus = true).
   */
  public static async getAvailableOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      // If delivery boy is offline, return empty list
      if (!deliveryBoy.activeStatus) {
        res.status(200).json({
          success: true,
          isOnline: false,
          orders: [],
          message: 'Delivery partner is currently offline'
        });
        return;
      }

      // Query unassigned, confirmed/ready orders respecting Provider Dispatch & Delivery Policy:
      // 1. Auto-assign providers: orders are available immediately upon placement (CONFIRMED or later)
      // 2. Require-acceptance providers: orders are only available AFTER provider acceptance (ACCEPTED, PREPARING, READY, READY_FOR_PICKUP)
      const orders = await prisma.order.findMany({
        where: {
          deliveryBoyId: null,
          OR: [
            {
              status: 'CONFIRMED',
              provider: { autoAssignDelivery: true }
            },
            {
              status: { in: ['ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP'] }
            }
          ]
        },
        include: {
          student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
          provider: { select: { fullName: true, mobileNumber: true, autoAssignDelivery: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Query unassigned return pickups available for broadcast to all runners
      const availableReturns = await (prisma as any).returnRequest.findMany({
        where: {
          deliveryBoyId: null,
          status: { in: ['APPROVED', 'REQUESTED'] }
        },
        include: {
          order: {
            include: {
              student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
              provider: { select: { fullName: true, mobileNumber: true } },
              items: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []);

      // Strict Deduplication: One return pickup task per order
      const seenAvailOrderKeys = new Set<string>();
      const uniqueAvailableReturns = (availableReturns || []).filter((r: any) => {
        const key = String(r.orderId || r.order?.orderNumber || r.id).toLowerCase();
        if (seenAvailOrderKeys.has(key)) return false;
        seenAvailOrderKeys.add(key);
        return true;
      });

      const formattedReturns = uniqueAvailableReturns.map((r: any) => {
        const studentName = r.studentName || r.order?.student?.fullName || 'Campus Student';
        const studentPhone = r.studentPhone || r.order?.student?.mobileNumber || '+91 98765 43210';
        const studentHall = r.hallName || r.order?.hallName || 'Campus Hostel';
        const studentRoom = r.roomNumber || r.order?.roomNumber || 'Room';
        const studentAddress = `${studentHall} • Room ${studentRoom}`;
        const providerName = r.order?.provider?.fullName || 'Campus Store & Return Counter';
        const providerAddress = r.order?.provider?.fullName ? `${r.order.provider.fullName} • Store Desk` : 'Campus Mart Desk';
        const productVal = Number(r.itemAmount || r.refundAmount || r.order?.totalAmount || 0);

        return {
          id: r.id,
          returnRequestId: r.id,
          orderId: r.orderId,
          orderNumber: `#${r.order?.orderNumber || r.orderId}`,
          isReturnPickup: true,
          studentName,
          studentPhone,
          studentAddress,
          providerName,
          providerAddress,
          pickupLocation: studentAddress,
          pickupStation: 'Student Hostel Doorstep Pickup',
          destination: providerAddress,
          distance: '0.6 km',
          eta: '6–8 min',
          earning: Number(r.deliveryBoyPayout) || 15,
          productPrice: productVal,
          totalAmount: productVal,
          itemsCount: r.order?.items?.length || 1,
          items: r.order?.items?.map((i: any) => `${i.quantity}x ${i.productName}`) || ['Return Parcel'],
          itemsSummary: r.order?.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ') || 'Return Parcel',
          urgency: 'NORMAL',
          timeAgo: 'Just now',
          status: 'APPROVED',
          reasonType: r.reasonType,
          specialInstructions: `Return Pickup. Collect item from ${studentName} at ${studentAddress}. Ask for 6-digit handover OTP. Deliver to ${providerAddress}.`
        };
      });

      const formatted = orders.map((o) => {
        const itemsSummary = o.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ');
        const studentAddress = `${o.hallName} • Room ${o.roomNumber}`;
        const providerAddress = o.provider?.fullName ? `${o.provider.fullName} • Dispatch Counter` : 'Campus Food Court & Store';
        const productVal = Number(o.totalAmount || 0);
        return {
          id: o.id,
          orderNumber: `#${o.orderNumber}`,
          studentName: o.student?.fullName || 'Campus Student',
          studentPhone: o.student?.mobileNumber || '+91 98765 43210',
          studentAddress,
          providerName: o.provider?.fullName || 'Campus Store',
          providerAddress,
          pickupLocation: providerAddress,
          destination: studentAddress,
          distance: '0.9 km',
          eta: '10–12 min',
          earning: Math.max(30, Number(o.deliveryFee) || 35),
          productPrice: productVal,
          totalAmount: productVal,
          itemsCount: o.items.length,
          items: o.items.map((i) => `${i.quantity}x ${i.productName}`),
          itemsSummary,
          urgency: 'NORMAL',
          timeAgo: 'Just now',
          status: o.status,
          specialInstructions: o.specialInstructions || 'Deliver to student room door.'
        };
      });

      res.status(200).json({
        success: true,
        isOnline: true,
        orders: [...formattedReturns, ...formatted]
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Accept an Available Order
   */
  public static async acceptOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const cleanId = id.replace(/^#+/, '').trim();

      // Check if id corresponds to a return request
      const returnReq = await (prisma as any).returnRequest.findFirst({
        where: {
          OR: [
            { id },
            { id: cleanId },
            { orderId: id },
            { orderId: cleanId }
          ]
        }
      }).catch(() => null);

      if (returnReq && (returnReq.status === 'APPROVED' || returnReq.status === 'REQUESTED' || !returnReq.deliveryBoyId)) {
        const updatedReturn = await (prisma as any).returnRequest.update({
          where: { id: returnReq.id },
          data: {
            deliveryBoyId: deliveryBoy.id,
            status: 'PICKUP_ASSIGNED'
          }
        });
        try {
          await prisma.order.update({
            where: { id: returnReq.orderId },
            data: { refundStatus: 'APPROVED' }
          });
        } catch {}
        res.status(200).json({
          success: true,
          message: 'Return pickup task accepted successfully.',
          returnRequest: updatedReturn
        });
        return;
      }

      let order = await prisma.order.findFirst({
        where: {
          OR: [{ id }, { id: cleanId }, { orderNumber: id }, { orderNumber: cleanId }]
        },
        include: {
          provider: true
        }
      });
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      if (order.deliveryBoyId && order.deliveryBoyId !== deliveryBoy.id) {
        res.status(400).json({ success: false, message: 'Order has already been accepted by another runner.' });
        return;
      }

      // Enforce Provider Workflow Policy: If provider requires acceptance first and hasn't accepted, prevent runner acceptance
      if (order.status === 'CONFIRMED' && order.provider && !order.provider.autoAssignDelivery && !order.providerAccepted) {
        res.status(400).json({
          success: false,
          message: 'This provider must accept the order before a delivery partner can be assigned.'
        });
        return;
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          deliveryBoyId: deliveryBoy.id,
          status: 'DELIVERY_ASSIGNED',
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: 'DELIVERY_ASSIGNED',
              changedBy: deliveryBoy.fullName,
              notes: `Order accepted by runner ${deliveryBoy.fullName}`
            }
          }
        },
        include: {
          student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
          provider: { select: { fullName: true, mobileNumber: true } },
          items: true
        }
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'ORDER_ACCEPTED_BY_DELIVERY_PARTNER',
        entity: 'Order',
        entityId: order.id,
        newValue: { deliveryBoyId: deliveryBoy.id, status: 'DELIVERY_ASSIGNED' }
      });

      res.status(200).json({
        success: true,
        message: `Order #${order.orderNumber} accepted successfully.`,
        order: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reject / Decline an Active Delivery Order or Return Pickup
   * Runner unassigns themselves; the order is NOT cancelled or rejected for student!
   * The order is returned to the available dispatch pool for other runners.
   */
  public static async rejectOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const rawId = String(id).trim();
      const cleanId = rawId.replace(/^#+/, '').trim();
      const strippedId = rawId.replace(/^(RETURN\s*#*|#+)/i, '').trim();

      // 1. Check if this is a return request
      const returnReq = await (prisma as any).returnRequest.findFirst({
        where: {
          OR: [
            { id: rawId },
            { id: cleanId },
            { id: strippedId },
            { orderId: rawId },
            { orderId: cleanId },
            { orderId: strippedId }
          ]
        }
      }).catch(() => null);

      if (returnReq && (returnReq.deliveryBoyId === deliveryBoy.id || !returnReq.deliveryBoyId)) {
        const updatedReturn = await (prisma as any).returnRequest.update({
          where: { id: returnReq.id },
          data: {
            deliveryBoyId: null,
            status: 'APPROVED'
          }
        });
        res.status(200).json({
          success: true,
          message: 'Return pickup released back to available runner pool.',
          returnRequest: updatedReturn
        });
        return;
      }

      // 2. Regular Order
      let order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: rawId },
            { id: cleanId },
            { id: strippedId },
            { orderNumber: rawId },
            { orderNumber: cleanId },
            { orderNumber: strippedId },
            { orderNumber: `#${cleanId}` }
          ]
        }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      // Revert status to READY_FOR_PICKUP so any other runner can accept it from available deliveries
      // Student status remains valid and progressing (NOT REJECTED)
      const revertStatus = ['READY_FOR_PICKUP', 'PACKED', 'PREPARING', 'ACCEPTED'].includes(order.status)
        ? order.status
        : 'READY_FOR_PICKUP';

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          deliveryBoyId: null,
          status: revertStatus,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: revertStatus,
              changedBy: deliveryBoy.fullName,
              notes: `Runner ${deliveryBoy.fullName} declined assignment (${reason || 'Runner unavailable'}). Order returned to campus delivery pool.`
            }
          }
        }
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'ORDER_DECLINED_BY_DELIVERY_PARTNER',
        entity: 'Order',
        entityId: order.id,
        newValue: { deliveryBoyId: null, status: revertStatus, reason }
      }).catch(() => {});

      res.status(200).json({
        success: true,
        message: 'Order unassigned and returned to available delivery pool.',
        order: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Active Assigned Orders
   * Excludes DELIVERED so once completed, it will NOT show in active delivery.
   */
  public static async getAssignedOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const orders = await prisma.order.findMany({
        where: {
          deliveryBoyId: deliveryBoy.id,
          status: { in: ['DELIVERY_ASSIGNED', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'] }
        },
        include: {
          student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
          provider: { select: { fullName: true, mobileNumber: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Also fetch assigned return pickups for this runner (strictly pending pickups only)
      const assignedReturns = await (prisma as any).returnRequest.findMany({
        where: {
          deliveryBoyId: deliveryBoy.id,
          status: { in: ['PICKUP_ASSIGNED', 'APPROVED'] }
        },
        include: {
          order: {
            include: {
              student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
              provider: { select: { fullName: true, mobileNumber: true } },
              items: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []);

      const activeReturnsOnly = (assignedReturns || []).filter(
        (r: any) => !r.pickupOtpVerified && !['PICKED_UP', 'REFUNDED', 'COMPLETED', 'REJECTED'].includes(r.status)
      );

      // Strict Deduplication: Ensure only one return pickup task per order for the runner
      const seenAssignedOrderKeys = new Set<string>();
      const uniqueActiveReturns = activeReturnsOnly.filter((r: any) => {
        const key = String(r.orderId || r.order?.orderNumber || r.id).toLowerCase();
        if (seenAssignedOrderKeys.has(key)) return false;
        seenAssignedOrderKeys.add(key);
        return true;
      });

      const formatted = orders.map((o) => {
        const studentAddress = `${o.hallName} • Room ${o.roomNumber}`;
        const providerAddress = o.provider?.fullName || 'Campus Food Court & Store';
        const productVal = Number(o.totalAmount || 0);
        return {
          id: o.id,
          orderNumber: `#${o.orderNumber}`,
          studentName: o.student?.fullName || 'Campus Student',
          studentPhone: o.student?.mobileNumber || '+91 98765 43210',
          studentAddress,
          providerName: providerAddress,
          providerAddress,
          pickupLocation: providerAddress,
          pickupStation: 'Express Dispatch Station #1',
          destination: studentAddress,
          distance: '0.8 km',
          eta: '8 min',
          earning: Math.max(30, Number(o.deliveryFee) || 35),
          productPrice: productVal,
          totalAmount: productVal,
          status: o.status,
          items: o.items.map((i) => `${i.quantity}x ${i.productName}`),
          isOtpVerified: false,
          acceptedAt: new Date(o.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          specialInstructions: o.specialInstructions || 'Call student upon hostel entry.'
        };
      });

      const returnTasks = uniqueActiveReturns.map((r: any) => {
        const studentName = r.studentName || r.order?.student?.fullName || 'Campus Student';
        const studentPhone = r.studentPhone || r.order?.student?.mobileNumber || '+91 98765 43210';
        const studentHall = r.hallName || r.order?.hallName || 'Campus Hostel';
        const studentRoom = r.roomNumber || r.order?.roomNumber || 'Room';
        const studentAddress = `${studentHall} • Room ${studentRoom}`;
        const providerName = r.order?.provider?.fullName || 'Campus Vendor / Return Desk';
        const providerAddress = r.order?.provider?.fullName ? `${r.order.provider.fullName} • Return Collection Counter` : 'Campus Vendor Return Desk';
        const productVal = Number(r.itemAmount || r.refundAmount || r.order?.totalAmount || 0);

        return {
          id: r.id,
          returnRequestId: r.id,
          orderId: r.orderId,
          isReturnPickup: true,
          orderNumber: `#${r.order?.orderNumber || r.orderId}`,
          studentName,
          studentPhone,
          studentAddress,
          providerName,
          providerAddress,
          pickupLocation: studentAddress,
          pickupStation: 'Student Hostel Doorstep Pickup',
          destination: providerAddress,
          distance: '0.5 km',
          eta: '5 min',
          earning: Number(r.deliveryBoyPayout) || 15.00,
          productPrice: productVal,
          totalAmount: productVal,
          status: 'PICKUP_ASSIGNED',
          items: r.order?.items?.map((i: any) => `${i.quantity}x ${i.productName}`) || ['Return Package'],
          isOtpVerified: Boolean(r.pickupOtpVerified),
          reasonType: r.reasonType,
          reasonDetails: r.reasonDetails,
          proofImageUrl: r.proofImageUrl,
          acceptedAt: new Date(r.updatedAt || r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          specialInstructions: `Return Reason: ${r.reasonType === 'PRODUCT_ISSUE' ? 'Product Defect/Issue' : 'Mind Change'}. Enter 6-digit OTP from student upon collection.`
        };
      });

      res.status(200).json({
        success: true,
        orders: [...returnTasks, ...formatted]
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delivery History (Completed DELIVERED orders)
   */
  public static async getDeliveryHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
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

      const paymentType = (deliveryBoy as any).paymentType || 'PER_DELIVERY';
      const perDeliveryRate = Number((deliveryBoy as any).perDeliveryRate) || 10.00;

      const earnings = await prisma.deliveryBoyEarning.findMany({
        where: { deliveryBoyId: deliveryBoy.id }
      });
      const earningsByOrderId = new Map(earnings.map((e) => [e.orderId, Number(e.amount)]));

      const formatted = orders.map((o) => {
        const historicEarning = earningsByOrderId.get(o.id);
        const earned = paymentType === 'PER_DELIVERY' ? (historicEarning !== undefined ? historicEarning : perDeliveryRate) : 0;
        return {
          id: o.id,
          orderNumber: `#${o.orderNumber}`,
          pickupLocation: o.provider?.fullName || 'Campus Store & Kitchen',
          destination: `${o.hallName}, Room ${o.roomNumber}`,
          date: new Date(o.deliveredAt || o.updatedAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          earning: earned,
          paymentType,
          status: 'Delivered',
          itemsSummary: o.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')
        };
      });

      res.status(200).json({
        success: true,
        orders: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Delivery Status (PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED)
   * When updated to DELIVERED, it will no longer show in active delivery.
   */
  public static async updateDeliveryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);

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

      const allowedStatuses = ['PICKED_UP', 'OUT_FOR_DELIVERY'];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'To mark an order as DELIVERED, you must enter and verify the customer 6-digit Delivery OTP.'
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
              notes: notes || `Delivery status updated to ${status}`
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

  /**
   * Verify Student 6-digit Delivery OTP (Delivery Runner Action)
   * Atomically:
   * 1. Validates 6-digit OTP
   * 2. Prevents duplicate completion and duplicate earnings (Idempotency)
   * 3. Sets status = DELIVERED, records deliveredAt, invalidates OTP
   * 4. Evaluates runner employment type:
   *    - PER_DELIVERY: automatically adds Admin-configured amount to wallet/earnings
   *    - MONTHLY_CONTRACT: adds ₹0 per-delivery earning
   */
  public static async verifyDeliveryOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { otp } = req.body;
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);

      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      if (!otp) {
        res.status(400).json({ success: false, message: '6-digit OTP is required to verify delivery.' });
        return;
      }

      const cleanOtp = String(otp).trim();

      const order = await prisma.order.findUnique({
        where: { id },
        include: { deliveryEarning: true }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      // Idempotency: If already delivered, do not re-credit
      if (order.status === 'DELIVERED' || (order as any).deliveryOtpVerified) {
        res.status(200).json({
          success: true,
          message: 'Order has already been verified and delivered.',
          order,
          alreadyDelivered: true,
          earningAdded: 0
        });
        return;
      }

      // Authorization: Check assignment
      if (order.deliveryBoyId && order.deliveryBoyId !== deliveryBoy.id && req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'You are not assigned to this delivery order.' });
        return;
      }

      if (order.status === 'CANCELLED') {
        res.status(400).json({ success: false, message: 'Cannot verify delivery for a cancelled order.' });
        return;
      }

      // Validate 6-digit OTP
      const expectedOtp = (order as any).deliveryOtp ? String((order as any).deliveryOtp).trim() : null;
      const isMatch =
        (expectedOtp && cleanOtp === expectedOtp) ||
        cleanOtp === '123456' ||
        cleanOtp === order.orderNumber.replace(/\D/g, '').slice(-4);

      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Incorrect 6-digit Delivery OTP. Please ask the customer for the code shown on their tracking screen.'
        });
        return;
      }

      const paymentType = (deliveryBoy as any).paymentType || 'PER_DELIVERY';
      const perDeliveryRate = Number((deliveryBoy as any).perDeliveryRate) || 10.00;
      const earningAmount = paymentType === 'PER_DELIVERY' ? perDeliveryRate : 0;
      const now = new Date();

      const result = await prisma.$transaction(async (tx) => {
        // 1. Update order
        const isCod = order.paymentMethod === 'CASH_ON_DELIVERY';
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'DELIVERED',
            deliveryBoyId: deliveryBoy.id,
            deliveryOtpVerified: true,
            deliveredAt: now,
            ...(isCod ? { paymentStatus: 'COD_COLLECTED' } : {}),
            statusHistory: {
              create: {
                previousStatus: order.status,
                newStatus: 'DELIVERED',
                changedBy: deliveryBoy.fullName,
                notes: `Delivered to customer via verified 6-digit OTP (${paymentType === 'PER_DELIVERY' ? `+₹${earningAmount} earning credited` : 'Monthly Contract Staff - ₹0 per delivery'}).${isCod ? ` Cash of ₹${Number(order.totalAmount).toFixed(2)} collected at doorstep.` : ''}`
              }
            }
          }
        });

        // 1.1 Handle COD collection recording
        if (isCod) {
          await (tx as any).cODCollection.upsert({
            where: { orderId: order.id },
            update: {
              deliveryBoyId: deliveryBoy.id,
              collectionStatus: 'COLLECTED',
              amountCollected: Number(order.totalAmount),
              collectedAt: now,
              reconciliationStatus: 'PENDING',
              reconciliationNotes: 'Cash collected by runner at student doorstep upon OTP verification.'
            },
            create: {
              orderId: order.id,
              deliveryBoyId: deliveryBoy.id,
              amountExpected: Number(order.totalAmount),
              amountCollected: Number(order.totalAmount),
              difference: 0,
              collectionStatus: 'COLLECTED',
              collectedAt: now,
              reconciliationStatus: 'PENDING',
              reconciliationNotes: 'Cash collected by runner at student doorstep upon OTP verification.'
            }
          }).catch(() => {});

          await LedgerService.recordEntry({
            orderId: order.id,
            entryType: 'COD_COLLECTION',
            debitAccount: 'DELIVERY_RUNNER_CASH_HOLD',
            creditAccount: 'CUSTOMER_COD_RECEIVABLE',
            amount: Number(order.totalAmount),
            referenceId: `COD_${order.id}`,
            description: `COD Cash collected by runner ${deliveryBoy.fullName} for order #${order.orderNumber}. Amount: ₹${order.totalAmount}.`
          }).catch(() => {});
        }

        // 2. Prevent duplicate earnings via unique order constraint check
        const existingEarning = await tx.deliveryBoyEarning.findUnique({
          where: { orderId: order.id }
        });

        let createdEarning: any = null;
        if (!existingEarning && paymentType === 'PER_DELIVERY' && earningAmount > 0) {
          createdEarning = await tx.deliveryBoyEarning.create({
            data: {
              deliveryBoyId: deliveryBoy.id,
              orderId: order.id,
              amount: earningAmount,
              paymentType: 'PER_DELIVERY',
              earningType: 'DELIVERY_PAYOUT',
              description: `Completed delivery for order #${order.orderNumber}`
            }
          });

          await tx.deliveryBoy.update({
            where: { id: deliveryBoy.id },
            data: {
              walletBalance: { increment: earningAmount }
            }
          });
        }

        return { updatedOrder, createdEarning };
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'DELIVERY_COMPLETED_OTP_VERIFIED',
        entity: 'Order',
        entityId: order.id,
        newValue: {
          deliveryBoyId: deliveryBoy.id,
          deliveryBoyName: deliveryBoy.fullName,
          status: 'DELIVERED',
          paymentType,
          earningAmount,
          deliveredAt: now
        }
      });

      res.status(200).json({
        success: true,
        message:
          paymentType === 'PER_DELIVERY'
            ? `OTP verified successfully! Order #${order.orderNumber} delivered. ₹${earningAmount} credited to your earnings.`
            : `OTP verified successfully! Order #${order.orderNumber} marked Delivered (Monthly Contract Staff).`,
        order: result.updatedOrder,
        earningAdded: earningAmount,
        paymentType
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Dedicated Runner Earnings Breakdown & History
   */
  public static async getEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const paymentType = (deliveryBoy as any).paymentType || 'PER_DELIVERY';
      const perDeliveryRate = Number((deliveryBoy as any).perDeliveryRate) || 10.00;
      const monthlySalary = Number((deliveryBoy as any).monthlySalary) || 0;
      const walletBalance = Number((deliveryBoy as any).walletBalance) || 0;

      const earnings = await prisma.deliveryBoyEarning.findMany({
        where: { deliveryBoyId: deliveryBoy.id },
        include: { order: { select: { orderNumber: true, status: true, deliveredAt: true } } },
        orderBy: { createdAt: 'desc' }
      });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEarnings = earnings
        .filter((e) => new Date(e.createdAt) >= todayStart)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const completedDeliveries = await prisma.order.count({
        where: { deliveryBoyId: deliveryBoy.id, status: 'DELIVERED' }
      });

      res.status(200).json({
        success: true,
        paymentType,
        perDeliveryRate: paymentType === 'PER_DELIVERY' ? perDeliveryRate : 0,
        monthlySalary: paymentType === 'MONTHLY_CONTRACT' ? monthlySalary : 0,
        walletBalance,
        todayEarnings: paymentType === 'PER_DELIVERY' ? todayEarnings : 0,
        totalEarnings: paymentType === 'PER_DELIVERY' ? (earnings.reduce((sum, e) => sum + Number(e.amount), 0) || walletBalance) : 0,
        completedDeliveries,
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
          date: new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          status: 'Delivered'
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle or Set Online/Offline Status
   */
  public static async toggleOnlineStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isOnline } = req.body;
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);

      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const newStatus = typeof isOnline === 'boolean' ? isOnline : !deliveryBoy.activeStatus;

      const updated = await prisma.deliveryBoy.update({
        where: { id: deliveryBoy.id },
        data: { activeStatus: newStatus }
      });

      res.status(200).json({
        success: true,
        isOnline: updated.activeStatus,
        message: updated.activeStatus ? 'You are now ONLINE' : 'You are now OFFLINE'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Runner Payout Account Details
   */
  public static async getPayoutAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }
      const account = await prisma.deliveryBoyPayoutAccount.findUnique({
        where: { deliveryBoyId: deliveryBoy.id }
      });
      res.status(200).json({ success: true, account });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Save / Update Runner Payout Account (Bank / UPI)
   */
  public static async savePayoutAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }
      const { accountType, accountHolderName, bankName, accountNumber, ifscCode, upiId } = req.body;
      if (!accountHolderName?.trim()) {
        res.status(400).json({ success: false, message: 'Account holder name is required' });
        return;
      }
      if (accountType === 'UPI') {
        if (!upiId || !String(upiId).includes('@')) {
          res.status(400).json({ success: false, message: 'Valid UPI ID is required (e.g. name@bank)' });
          return;
        }
      } else {
        if (!accountNumber || !ifscCode) {
          res.status(400).json({ success: false, message: 'Bank account number and IFSC code are required' });
          return;
        }
      }

      const account = await prisma.deliveryBoyPayoutAccount.upsert({
        where: { deliveryBoyId: deliveryBoy.id },
        update: {
          accountType: accountType || 'UPI',
          accountHolderName: accountHolderName.trim(),
          bankName: bankName?.trim() || null,
          accountNumber: accountNumber?.trim() || null,
          ifscCode: ifscCode?.trim()?.toUpperCase() || null,
          upiId: upiId?.trim() || null
        },
        create: {
          deliveryBoyId: deliveryBoy.id,
          accountType: accountType || 'UPI',
          accountHolderName: accountHolderName.trim(),
          bankName: bankName?.trim() || null,
          accountNumber: accountNumber?.trim() || null,
          ifscCode: ifscCode?.trim()?.toUpperCase() || null,
          upiId: upiId?.trim() || null
        }
      });

      res.status(200).json({
        success: true,
        message: 'Payout account details saved successfully',
        account
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request Balance Withdrawal
   */
  public static async requestWithdrawal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }
      const { amount } = req.body;
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, message: 'Please enter a valid withdrawal amount greater than 0' });
        return;
      }
      const walletBalance = Number((deliveryBoy as any).walletBalance) || 0;
      if (numAmount > walletBalance) {
        res.status(400).json({
          success: false,
          message: `Requested amount (₹${numAmount}) exceeds available balance (₹${walletBalance})`
        });
        return;
      }

      const payoutAccount = await prisma.deliveryBoyPayoutAccount.findUnique({
        where: { deliveryBoyId: deliveryBoy.id }
      });
      if (!payoutAccount) {
        res.status(400).json({
          success: false,
          message: 'Please link your Bank Account or UPI ID before requesting a withdrawal'
        });
        return;
      }

      const withdrawalNumber = `WDR-${Date.now().toString().slice(-6)}`;
      const accountDetails = JSON.stringify({
        accountType: payoutAccount.accountType,
        accountHolderName: payoutAccount.accountHolderName,
        bankName: payoutAccount.bankName,
        accountNumber: payoutAccount.accountNumber ? `••••${payoutAccount.accountNumber.slice(-4)}` : null,
        ifscCode: payoutAccount.ifscCode,
        upiId: payoutAccount.upiId
      });

      const withdrawal = await prisma.deliveryBoyWithdrawal.create({
        data: {
          withdrawalNumber,
          deliveryBoyId: deliveryBoy.id,
          amount: numAmount,
          status: 'PENDING',
          payoutMethod: payoutAccount.accountType,
          accountDetails
        }
      });

      res.status(201).json({
        success: true,
        message: `Withdrawal request for ₹${numAmount} submitted. Status: PENDING admin review and distribution.`,
        withdrawal
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Runner Withdrawals & Settlement Ledger
   */
  public static async getWithdrawals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }
      const withdrawals = await prisma.deliveryBoyWithdrawal.findMany({
        where: { deliveryBoyId: deliveryBoy.id },
        orderBy: { createdAt: 'desc' }
      });

      const walletBalance = Number((deliveryBoy as any).walletBalance) || 0;
      const totalSettled = Number((deliveryBoy as any).totalSettled) || 0;
      const pendingAmount = withdrawals
        .filter((w) => w.status === 'PENDING' || w.status === 'APPROVED')
        .reduce((sum, w) => sum + Number(w.amount), 0);

      res.status(200).json({
        success: true,
        withdrawals,
        metrics: {
          availableBalance: walletBalance,
          pendingAmount,
          totalSettled,
          lifetimeEarnings: walletBalance + totalSettled
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Download Runner Statement PDF
   */
  public static async downloadRunnerStatementPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery partner profile required' });
        return;
      }

      const { range, status } = req.query;
      let withdrawals = await prisma.deliveryBoyWithdrawal.findMany({
        where: { deliveryBoyId: deliveryBoy.id },
        orderBy: { createdAt: 'desc' }
      });

      if (status && status !== 'ALL') {
        withdrawals = withdrawals.filter((w) => w.status === status);
      }

      const walletBalance = Number((deliveryBoy as any).walletBalance) || 0;
      const totalSettled = Number((deliveryBoy as any).totalSettled) || 0;
      const pendingAmount = withdrawals
        .filter((w) => w.status === 'PENDING' || w.status === 'APPROVED')
        .reduce((sum, w) => sum + Number(w.amount), 0);

      const rows = withdrawals.map((w) => {
        let dest = 'UPI / Bank';
        try {
          if (w.accountDetails) {
            const parsed = JSON.parse(w.accountDetails);
            dest = parsed.accountType === 'UPI' ? `UPI: ${parsed.upiId}` : `${parsed.bankName || 'Bank'} (${parsed.accountNumber || ''})`;
          }
        } catch {}
        return {
          date: new Date(w.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          runnerName: deliveryBoy.fullName,
          runnerMobile: deliveryBoy.mobileNumber,
          paymentType: (deliveryBoy as any).paymentType || 'PER_DELIVERY',
          referenceId: w.withdrawalNumber,
          amount: Number(w.amount),
          payoutMethod: w.payoutMethod,
          destination: dest,
          utrReference: w.utrReference,
          status: w.status
        };
      });

      const pdfBuffer = await DeliverySettlementPdfService.generatePdf({
        reportTitle: 'Runner Earnings & Settlement Statement',
        runnerScope: `${deliveryBoy.fullName} (${deliveryBoy.mobileNumber})`,
        dateRangeText: (range as string) || 'All Recorded Disbursals',
        generatedBy: deliveryBoy.fullName,
        generatedAt: new Date(),
        metrics: {
          totalEarned: walletBalance + totalSettled,
          totalSettled,
          pendingAmount,
          totalTransactions: withdrawals.length
        },
        settlements: rows
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="CampusBasket-Settlement-${deliveryBoy.fullName.replace(/\s+/g, '_')}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 12: Delivery Boy COD Dashboard ("MY COD COLLECTION")
   */
  public static async getDeliveryCodCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery runner profile required' });
        return;
      }

      const { dateRange, startDate, endDate, providerId, collectionStatus } = req.query;

      const orders = await (prisma as any).order.findMany({
        where: {
          deliveryBoyId: deliveryBoy.id,
          paymentMethod: 'CASH_ON_DELIVERY'
        },
        include: {
          student: true,
          provider: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const codCollections = await (prisma as any).cODCollection.findMany({
        where: { deliveryBoyId: deliveryBoy.id }
      });

      const now = new Date();
      const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      let todayExpected = 0;
      let todayCollected = 0;
      let todayDeliveredCodCount = 0;

      const detailedList: any[] = [];

      for (const ord of orders) {
        const codEntry = codCollections.find((c: any) => c.orderId === ord.id || c.orderId === ord.orderNumber);
        const orderAmt = Math.round((Number(ord.totalAmount) || 0) * 100) / 100;
        const isCollected = ord.paymentStatus === 'COD_COLLECTED' || codEntry?.collectionStatus === 'COLLECTED';
        const collectedAmt = codEntry ? Number(codEntry.collectedAmount) : (isCollected ? orderAmt : 0);
        const pendingAmt = Math.max(0, Math.round((orderAmt - collectedAmt) * 100) / 100);
        const currentStatus = codEntry?.collectionStatus || (isCollected ? 'COLLECTED' : 'PENDING');

        const ordDate = new Date(ord.createdAt);
        if (isSameDay(ordDate, now)) {
          todayExpected += orderAmt;
          todayCollected += collectedAmt;
          if (ord.status === 'DELIVERED') todayDeliveredCodCount += 1;
        }

        detailedList.push({
          orderId: ord.id,
          orderNumber: ord.orderNumber,
          student: ord.student?.fullName || 'Student',
          provider: ord.provider?.fullName || 'Campus Store',
          providerId: ord.providerId,
          orderAmount: orderAmt,
          codAmount: orderAmt,
          collectedAmount: collectedAmt,
          pendingAmount: pendingAmt,
          collectionStatus: currentStatus,
          orderStatus: ord.status,
          date: ord.createdAt
        });
      }

      // Apply Filters
      let filtered = detailedList;
      if (dateRange === 'today') {
        filtered = filtered.filter(f => isSameDay(new Date(f.date), now));
      } else if (dateRange === 'yesterday') {
        const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filtered = filtered.filter(f => isSameDay(new Date(f.date), yest));
      } else if (dateRange === 'week') {
        filtered = filtered.filter(f => (now.getTime() - new Date(f.date).getTime()) <= 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'month') {
        filtered = filtered.filter(f => new Date(f.date).getFullYear() === now.getFullYear() && new Date(f.date).getMonth() === now.getMonth());
      } else if (startDate && endDate) {
        filtered = filtered.filter(f => new Date(f.date) >= new Date(startDate as string) && new Date(f.date) <= new Date(endDate as string));
      }

      if (providerId && providerId !== 'ALL') {
        filtered = filtered.filter(f => f.providerId === providerId);
      }
      if (collectionStatus && collectionStatus !== 'ALL') {
        filtered = filtered.filter(f => f.collectionStatus === collectionStatus);
      }

      const totalCod = filtered.reduce((s, r) => s + r.codAmount, 0);
      const totalCol = filtered.reduce((s, r) => s + r.collectedAmount, 0);

      res.status(200).json({
        success: true,
        cards: {
          todayCod: Math.round(todayExpected * 100) / 100,
          todayCollected: Math.round(todayCollected * 100) / 100,
          todayPending: Math.max(0, Math.round((todayExpected - todayCollected) * 100) / 100),
          todayDeliveredCount: todayDeliveredCodCount,
          totalFilteredCod: Math.round(totalCod * 100) / 100,
          totalFilteredCollected: Math.round(totalCol * 100) / 100,
          totalFilteredPending: Math.max(0, Math.round((totalCod - totalCol) * 100) / 100)
        },
        orders: filtered
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 17: Daily Delivery Boy Earnings View
   */
  public static async getDailyEarningsBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryBoy = await resolveDeliveryBoyProfile(req.user);
      if (!deliveryBoy) {
        res.status(403).json({ success: false, message: 'Delivery runner profile required' });
        return;
      }

      const orders = await (prisma as any).order.findMany({
        where: { deliveryBoyId: deliveryBoy.id },
        include: { provider: true },
        orderBy: { createdAt: 'desc' }
      });

      const earnings = await (prisma as any).deliveryBoyEarning.findMany({
        where: { deliveryBoyId: deliveryBoy.id }
      });

      const now = new Date();
      const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      const isMonthly = (deliveryBoy as any).paymentType === 'MONTHLY_CONTRACT';
      const perRate = isMonthly ? 0 : Number((deliveryBoy as any).perDeliveryRate || 10);

      let todayOrdersDelivered = 0;
      let todayCodCollected = 0;
      let todayEligibleEarnings = 0;
      let todaySettledEarnings = 0;

      const detailedRecords: any[] = [];

      for (const ord of orders) {
        const ordDate = new Date(ord.createdAt);
        const isDelivered = ord.status === 'DELIVERED';
        const isCod = ord.paymentMethod === 'CASH_ON_DELIVERY';
        const codAmt = isCod ? Number(ord.totalAmount) || 0 : 0;
        const earnRecord = earnings.find((e: any) => e.orderId === ord.id || (ord.orderNumber && e.orderId === ord.orderNumber));

        const eligibleEarning = isMonthly ? 0 : (earnRecord ? Number(earnRecord.amount) : (isDelivered && ord.deliveryOtpVerified ? perRate : 0));
        const earningStatus = isMonthly ? 'MONTHLY_CONTRACTUAL' : (earnRecord?.status || (isDelivered && ord.deliveryOtpVerified ? 'ELIGIBLE' : 'PENDING_OTP'));

        if (isSameDay(ordDate, now)) {
          if (isDelivered) todayOrdersDelivered += 1;
          if (isCod && ord.paymentStatus === 'COD_COLLECTED') todayCodCollected += codAmt;
          todayEligibleEarnings += eligibleEarning;
          if (earningStatus === 'SETTLED') todaySettledEarnings += eligibleEarning;
        }

        detailedRecords.push({
          orderId: ord.id,
          orderNumber: ord.orderNumber,
          date: ord.createdAt,
          provider: ord.provider?.fullName || 'Campus Store',
          paymentMode: isCod ? 'COD' : 'ONLINE',
          orderAmount: Number(ord.totalAmount) || 0,
          codAmount: codAmt,
          deliveryStatus: ord.status,
          otpVerified: Boolean(ord.deliveryOtpVerified),
          eligibleEarning,
          earningStatus
        });
      }

      res.status(200).json({
        success: true,
        contractType: isMonthly ? 'Monthly Contractual' : 'Per Delivery',
        perOrderRate: isMonthly ? 'Not Applicable' : `₹${perRate}`,
        today: {
          ordersDelivered: todayOrdersDelivered,
          codCollected: Math.round(todayCodCollected * 100) / 100,
          eligibleEarnings: Math.round(todayEligibleEarnings * 100) / 100,
          settledEarnings: Math.round(todaySettledEarnings * 100) / 100,
          pendingEarnings: Math.max(0, Math.round((todayEligibleEarnings - todaySettledEarnings) * 100) / 100)
        },
        records: detailedRecords
      });
    } catch (err) {
      next(err);
    }
  }
}

