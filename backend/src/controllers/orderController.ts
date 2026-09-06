import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { checkoutOrderSchema } from '../validators/orderValidators';
import { generateOrderNumber } from '../utils/crypto';
import { RazorpayService } from '../services/payment/RazorpayService';
import { EmailService } from '../services/email/EmailService';
import { ReceiptService } from '../services/receipt/ReceiptService';
import { env } from '../config/environment';

const razorpayService = new RazorpayService();
const emailService = new EmailService();
const receiptService = new ReceiptService();

async function resolveStudentProfile(user?: any) {
  if (!user) return null;
  if (user.studentId) {
    const student = await prisma.student.findUnique({
      where: { id: user.studentId },
      include: { user: true, hall: true }
    });
    if (student) return student;
  }

  // If user is an ADMIN, find or auto-link a student profile for testing
  let student = await prisma.student.findFirst({
    where: { userId: user.userId },
    include: { user: true, hall: true }
  });

  if (!student && user.role === 'ADMIN') {
    const defaultHall = (await prisma.hall.findFirst()) || { id: 'default_hall', name: 'Hall 11' };
    student = await prisma.student.create({
      data: {
        userId: user.userId,
        fullName: user.email?.split('@')[0] || 'Campus Admin',
        rollNumber: `ADM-${Date.now().toString().slice(-6)}`,
        registrationNumber: `REG-${Date.now().toString().slice(-6)}`,
        mobileNumber: '9876543210',
        collegeEmail: user.email,
        personalEmail: user.email,
        hallId: defaultHall.id,
        roomNumber: 'Admin Wing 101',
        isVerified: true
      },
      include: { user: true, hall: true }
    });
  }

  return student;
}

export class OrderController {
  /**
   * Create new product order (Food, Fruits, Stationery & Essentials)
   */
  public static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await resolveStudentProfile(req.user);
      if (!student) {
        res.status(403).json({ success: false, message: 'Student authorization required' });
        return;
      }
      const studentId = student.id;

      const data = checkoutOrderSchema.parse(req.body);

      // Fetch products and verify stock and prices strictly from DB
      const productIds = data.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });

      if (products.length !== productIds.length) {
        res.status(400).json({ success: false, message: 'One or more items are invalid' });
        return;
      }

      let subtotal = 0;
      const orderItemsData: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }> = [];

      for (const item of data.items) {
        const prod = products.find((p) => p.id === item.productId)!;

        // Stock check
        if (prod.stock < item.quantity) {
          res.status(400).json({
            success: false,
            message: `Product "${prod.name}" has only ${prod.stock} units remaining in stock.`
          });
          return;
        }

        // Availability check
        if (!prod.availability || !prod.availableToday) {
          res.status(400).json({
            success: false,
            message: `Product "${prod.name}" is currently unavailable for ordering.`
          });
          return;
        }

        const effectivePrice = prod.discountPrice ? Number(prod.discountPrice) : Number(prod.price);
        const itemTotal = effectivePrice * item.quantity;
        subtotal += itemTotal;

        orderItemsData.push({
          productId: prod.id,
          productName: prod.name,
          quantity: item.quantity,
          unitPrice: effectivePrice,
          totalPrice: itemTotal
        });
      }

      // Calculate delivery fee
      const deliveryFee = subtotal > 250 ? 0 : 15;

      // Handle coupon discount
      let discountAmount = 0;
      let appliedCoupon: any = null;
      if (data.couponCode) {
        const coupon = await prisma.coupon.findUnique({
          where: { code: data.couponCode.toUpperCase() }
        });

        if (coupon && coupon.isActive) {
          const isExpired = coupon.expiryDate && new Date() > new Date(coupon.expiryDate);
          const meetsMinOrder = subtotal >= Number(coupon.minOrderAmount);

          if (!isExpired && meetsMinOrder) {
            appliedCoupon = coupon;
            if (coupon.discountType === 'PERCENTAGE') {
              const calcDiscount = (subtotal * Number(coupon.discountValue)) / 100;
              discountAmount = coupon.maxDiscountAmount
                ? Math.min(calcDiscount, Number(coupon.maxDiscountAmount))
                : calcDiscount;
            } else {
              discountAmount = Number(coupon.discountValue);
            }
          }
        }
      }

      const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

      // Verify COD settings if COD chosen
      if (data.paymentMethod === 'CASH_ON_DELIVERY') {
        const codSetting = await prisma.adminSetting.findUnique({
          where: { key: 'ENABLE_CASH_ON_DELIVERY' }
        });
        const isCodGloballyEnabled = codSetting ? codSetting.value === 'true' : true;

        if (!isCodGloballyEnabled) {
          res.status(400).json({
            success: false,
            message: 'Cash on Delivery is currently disabled by campus administration. Please pay online.'
          });
          return;
        }

        if (totalAmount > 1500) {
          res.status(400).json({
            success: false,
            message: 'Cash on Delivery is only available for orders up to ₹1,500. Please choose online payment.'
          });
          return;
        }
      }

      const orderNumber = generateOrderNumber();

      // Determine provider from ordered products
      const firstProductWithProvider = products.find((p) => p.providerId);
      let targetProviderId: string | null = firstProductWithProvider?.providerId || null;

      // If products don't have providerId yet, map from category as fallback
      if (!targetProviderId && products[0]?.categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: products[0].categoryId } });
        const provCategory = cat?.name?.toLowerCase() || '';
        const matchProv = await prisma.serviceProvider.findFirst({
          where: {
            OR: [
              { serviceCategory: { contains: 'Food' } },
              { serviceCategory: { contains: 'Fruit' } },
              { serviceCategory: { contains: 'Essential' } }
            ]
          }
        });
        if (matchProv) targetProviderId = matchProv.id;
      }

      let targetProvider: any = null;
      if (targetProviderId) {
        targetProvider = await prisma.serviceProvider.findUnique({ where: { id: targetProviderId } });
      }

      // Check auto-assignment policy
      let initialStatus: any = data.paymentMethod === 'CASH_ON_DELIVERY' ? 'CONFIRMED' : 'PENDING_PAYMENT';
      let assignedDeliveryBoyId: string | null = null;
      let initialStatusNote = 'Order initiated at checkout';

      if (data.paymentMethod === 'CASH_ON_DELIVERY' && targetProvider?.autoAssignDelivery) {
        const activeRunner = await prisma.deliveryBoy.findFirst({
          where: { activeStatus: true }
        });
        if (activeRunner) {
          assignedDeliveryBoyId = activeRunner.id;
          initialStatus = 'DELIVERY_ASSIGNED';
          initialStatusNote = `Auto-assigned to delivery partner ${activeRunner.fullName} (${activeRunner.mobileNumber})`;
        }
      }

      // Transactionally deduct stock, create order, order items, status history
      const createdOrder = await prisma.$transaction(async (tx) => {
        // Decrement stock
        for (const item of orderItemsData) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            studentId,
            providerId: targetProviderId,
            deliveryBoyId: assignedDeliveryBoyId,
            status: initialStatus,
            subtotal,
            deliveryFee,
            discountAmount,
            totalAmount,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
            hallName: data.hallName,
            hallNumber: data.hallNumber || null,
            roomNumber: data.roomNumber,
            specialInstructions: data.specialInstructions || null,
            items: {
              create: orderItemsData.map((i) => ({
                productId: i.productId,
                productName: i.productName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice
              }))
            },
            statusHistory: {
              create: {
                previousStatus: null,
                newStatus: initialStatus,
                changedBy: 'STUDENT',
                notes: initialStatusNote
              }
            }
          },
          include: { items: true }
        });

        // Track coupon usage
        if (appliedCoupon) {
          await tx.couponUsage.create({
            data: {
              couponId: appliedCoupon.id,
              studentId,
              orderId: newOrder.id
            }
          });
        }

        // Clear student cart
        const cart = await tx.cart.findUnique({ where: { studentId } });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }

        return newOrder;
      });

      // If Razorpay, generate Razorpay order
      let razorpayOrderData = null;
      if (data.paymentMethod === 'RAZORPAY') {
        const rzpOrder = await razorpayService.createRazorpayOrder({
          amountInRupees: totalAmount,
          receiptId: orderNumber,
          notes: {
            orderId: createdOrder.id,
            studentEmail: student.user.email
          }
        });

        await prisma.payment.create({
          data: {
            orderId: createdOrder.id,
            studentId,
            amount: totalAmount,
            status: 'PENDING',
            paymentMethod: 'RAZORPAY',
            razorpayOrderId: rzpOrder.id
          }
        });

        razorpayOrderData = {
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ''
        };
      } else {
        // Record COD payment
        await prisma.payment.create({
          data: {
            orderId: createdOrder.id,
            studentId,
            amount: totalAmount,
            status: 'PENDING',
            paymentMethod: 'CASH_ON_DELIVERY'
          }
        });

        // Dispatch order confirmation email
        emailService.sendOrderConfirmationEmail(
          student.user.email,
          orderNumber,
          orderItemsData.map((i) => `${i.quantity}x ${i.productName}`).join(', '),
          totalAmount
        );
      }

      // Generate Receipt
      const receiptPayload = receiptService.buildReceiptData({
        orderNumber,
        orderType: 'PRODUCT',
        student: {
          name: student.fullName,
          email: student.user.email,
          rollNumber: student.rollNumber,
          hall: student.hall?.name || data.hallName,
          room: data.roomNumber
        },
        items: orderItemsData.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: i.totalPrice
        })),
        subtotal,
        discount: discountAmount,
        deliveryFee,
        total: totalAmount,
        payment: {
          method: data.paymentMethod,
          status: data.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD Pending' : 'Payment Processing'
        }
      });

      await prisma.receipt.create({
        data: {
          receiptNumber: receiptPayload.receiptNumber,
          orderId: createdOrder.id,
          studentId,
          totalAmount,
          receiptDataJson: JSON.stringify(receiptPayload)
        }
      });

      res.status(201).json({
        success: true,
        message:
          data.paymentMethod === 'CASH_ON_DELIVERY'
            ? 'Order placed successfully with Cash on Delivery!'
            : 'Order created. Please complete payment via Razorpay.',
        order: {
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          status: createdOrder.status,
          totalAmount,
          paymentMethod: data.paymentMethod
        },
        razorpay: razorpayOrderData
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get authenticated student's orders with filtering
   */
  public static async getStudentOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await resolveStudentProfile(req.user);
      const studentId = student?.id;
      const { status } = req.query;

      const where: any = {};
      if (studentId) {
        where.studentId = studentId;
      }
      if (status) {
        where.status = status as any;
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: { images: true }
              }
            }
          },
          statusHistory: { orderBy: { createdAt: 'asc' } },
          payment: true,
          receipt: true,
          deliveryBoy: { select: { id: true, fullName: true, mobileNumber: true, vehicleType: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          totalAmount: Number(o.totalAmount),
          subtotal: Number(o.subtotal),
          deliveryFee: Number(o.deliveryFee),
          discountAmount: Number(o.discountAmount),
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          hallName: o.hallName,
          roomNumber: o.roomNumber,
          createdAt: o.createdAt,
          deliveryBoy: o.deliveryBoy || null,
          items: o.items.map((i) => ({
            id: i.id,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
            image: i.product?.images?.[0]?.googleDriveUrl || null
          })),
          statusHistory: o.statusHistory,
          receiptNumber: o.receipt?.receiptNumber || null
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single order details
   */
  public static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = req.user?.studentId;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                include: { images: true }
              }
            }
          },
          statusHistory: { orderBy: { createdAt: 'asc' } },
          payment: true,
          receipt: true,
          provider: { select: { fullName: true, mobileNumber: true } },
          deliveryBoy: { select: { id: true, fullName: true, mobileNumber: true, vehicleType: true } }
        }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      // Privacy check: Students can only view their own orders
      if (req.user?.role === 'STUDENT' && order.studentId !== studentId) {
        res.status(403).json({ success: false, message: 'Access denied to this order' });
        return;
      }

      res.status(200).json({
        success: true,
        order: {
          ...order,
          deliveryOtp: order.orderNumber.slice(-4),
          totalAmount: Number(order.totalAmount),
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          discountAmount: Number(order.discountAmount)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel an order (within allowed window)
   */
  public static async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const student = await resolveStudentProfile(req.user);
      const studentId = student?.id;

      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      if (order.studentId !== studentId) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
        res.status(400).json({
          success: false,
          message: `Cannot cancel order in ${order.status.replace(/_/g, ' ')} status.`
        });
        return;
      }

      // Cancel order & restore inventory
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }

        await tx.order.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            statusHistory: {
              create: {
                previousStatus: order.status,
                newStatus: 'CANCELLED',
                changedBy: 'STUDENT',
                notes: 'Student cancelled order'
              }
            }
          }
        });
      });

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully. Restored inventory.'
      });
    } catch (err) {
      next(err);
    }
  }
}
