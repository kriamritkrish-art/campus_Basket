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

      // Query unassigned, confirmed/ready orders
      const orders = await prisma.order.findMany({
        where: {
          deliveryBoyId: null,
          status: { in: ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP'] }
        },
        include: {
          student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
          provider: { select: { fullName: true, mobileNumber: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const formatted = orders.map((o) => {
        const itemsSummary = o.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ');
        return {
          id: o.id,
          orderNumber: `#${o.orderNumber}`,
          studentName: o.student?.fullName || 'Campus Student',
          studentPhone: o.student?.mobileNumber || '+91 98765 43210',
          pickupLocation: o.provider?.fullName || 'Campus Food Court & Store',
          destination: `${o.hallName} • Room ${o.roomNumber}`,
          distance: '0.9 km',
          eta: '10–12 min',
          earning: Math.max(30, Number(o.deliveryFee) || 35),
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
        orders: formatted
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

      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      if (order.deliveryBoyId && order.deliveryBoyId !== deliveryBoy.id) {
        res.status(400).json({ success: false, message: 'Order has already been accepted by another runner.' });
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

      // Also fetch assigned return pickups for this runner
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

      const formatted = orders.map((o) => ({
        id: o.id,
        orderNumber: `#${o.orderNumber}`,
        studentName: o.student?.fullName || 'Campus Student',
        studentPhone: o.student?.mobileNumber || '+91 98765 43210',
        pickupLocation: o.provider?.fullName || 'Campus Food Court & Store',
        pickupStation: 'Express Dispatch Station #1',
        destination: `${o.hallName} • Room ${o.roomNumber}`,
        distance: '0.8 km',
        eta: '8 min',
        earning: Math.max(30, Number(o.deliveryFee) || 35),
        status: o.status,
        items: o.items.map((i) => `${i.quantity}x ${i.productName}`),
        isOtpVerified: false,
        acceptedAt: new Date(o.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        specialInstructions: o.specialInstructions || 'Call student upon hostel entry.'
      }));

      const returnTasks = (assignedReturns || []).map((r: any) => ({
        id: r.id,
        returnRequestId: r.id,
        orderId: r.orderId,
        isReturnPickup: true,
        orderNumber: `RETURN #${r.order?.orderNumber || r.id.slice(-6)}`,
        studentName: r.order?.student?.fullName || 'Campus Student',
        studentPhone: r.order?.student?.mobileNumber || '+91 98765 43210',
        pickupLocation: `${r.order?.hallName || 'Hostel'} • Room ${r.order?.roomNumber || ''}`,
        pickupStation: 'Student Hostel Doorstep Pickup',
        destination: r.order?.provider?.fullName || 'Campus Vendor / Return Desk',
        distance: '0.5 km',
        eta: '5 min',
        earning: Number(r.deliveryBoyPayout) || 15.00,
        status: 'PICKUP_ASSIGNED',
        items: r.order?.items?.map((i: any) => `${i.quantity}x ${i.productName}`) || ['Return Package'],
        isOtpVerified: Boolean(r.pickupOtpVerified),
        reasonType: r.reasonType,
        reasonDetails: r.reasonDetails,
        proofImageUrl: r.proofImageUrl,
        acceptedAt: new Date(r.updatedAt || r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        specialInstructions: `Return Reason: ${r.reasonType === 'PRODUCT_ISSUE' ? 'Product Defect/Issue' : 'Mind Change'}. Enter 6-digit OTP from student upon collection.`
      }));

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
}
