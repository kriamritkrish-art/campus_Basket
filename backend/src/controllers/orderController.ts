import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { checkoutOrderSchema } from '../validators/orderValidators';
import { generateOrderNumber, generateSecureOtp } from '../utils/crypto';
import { RazorpayService } from '../services/payment/RazorpayService';
import { EmailService } from '../services/email/EmailService';
import { ReceiptService } from '../services/receipt/ReceiptService';
import { LedgerService } from '../services/financial/LedgerService';
import { RefundService } from '../services/financial/RefundService';
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
        where: { id: { in: productIds } },
        include: { category: true }
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

      // Verify COD settings & compute any required advance payment
      let codAdvanceAmount = 0;
      let advanceRequired = 0;
      let remainingCashDue = totalAmount;

      if (data.paymentMethod === 'CASH_ON_DELIVERY') {
        const [
          codSetting,
          maxCodSetting,
          minAdvanceSetting,
          providerPoliciesSetting,
          productPoliciesSetting
        ] = await Promise.all([
          prisma.adminSetting.findUnique({ where: { key: 'ENABLE_CASH_ON_DELIVERY' } }),
          prisma.adminSetting.findUnique({ where: { key: 'MAX_COD_AMOUNT' } }),
          prisma.adminSetting.findUnique({ where: { key: 'COD_MIN_ADVANCE_AMOUNT' } }),
          prisma.adminSetting.findUnique({ where: { key: 'PROVIDER_ORDER_POLICIES' } }),
          prisma.adminSetting.findUnique({ where: { key: 'PRODUCT_ORDER_POLICIES' } })
        ]);

        const isCodGloballyEnabled = codSetting ? codSetting.value === 'true' : true;
        if (!isCodGloballyEnabled) {
          res.status(400).json({
            success: false,
            message: 'Cash on Delivery is currently disabled by campus administration. Please pay online.'
          });
          return;
        }

        const maxCod = maxCodSetting ? Number(maxCodSetting.value) : 1500;
        if (totalAmount > maxCod) {
          res.status(400).json({
            success: false,
            message: `Cash on Delivery is only available for orders up to ₹${maxCod}. Please choose online payment.`
          });
          return;
        }

        // Parse policy maps
        let providerPolicies: Record<string, any> = {};
        let productPolicies: Record<string, any> = {};
        try {
          if (providerPoliciesSetting?.value) providerPolicies = JSON.parse(providerPoliciesSetting.value);
        } catch {}
        try {
          if (productPoliciesSetting?.value) productPolicies = JSON.parse(productPoliciesSetting.value);
        } catch {}

        // Strict Priority Evaluation: Product/Food Override > Provider Override > Global
        let determinedAdvance: number | null = null;

        for (const prod of products) {
          const normName = prod.name ? prod.name.toLowerCase().trim() : '';
          const prodPol =
            productPolicies[prod.id] ||
            productPolicies[normName] ||
            (prod.slug ? productPolicies[prod.slug] : null) ||
            Object.entries(productPolicies).find(([k, v]: any) => {
              return (
                k === prod.id ||
                v.id === prod.id ||
                (v.name && v.name.toLowerCase().trim() === normName) ||
                (normName.includes('burger special') && (k.toLowerCase().includes('burger special') || v.name?.toLowerCase().includes('burger special')))
              );
            })?.[1];

          const provId = prod.providerId;
          const provPol = provId ? providerPolicies[provId] : null;

          // PRIORITY 1: Product Override (Highest Priority)
          if (prodPol && prodPol.allowCod === false) {
            res.status(400).json({
              success: false,
              message: `Cash on Delivery is unavailable because "${prod.name}" does not support COD. Please choose online payment.`
            });
            return;
          }

          // PRIORITY 2: Provider Override (Only if product has not explicitly allowed COD)
          if ((!prodPol || prodPol.allowCod === undefined) && provPol && provPol.allowCod === false) {
            res.status(400).json({
              success: false,
              message: `Cash on Delivery is not offered by merchant for "${prod.name}". Please choose online payment.`
            });
            return;
          }

          // Compute custom advance fee priority
          if (determinedAdvance === null) {
            if (prodPol && typeof prodPol.codAdvance === 'number' && prodPol.codAdvance >= 0) {
              determinedAdvance = prodPol.codAdvance;
            } else if (provPol && typeof provPol.codAdvance === 'number' && provPol.codAdvance >= 0) {
              determinedAdvance = provPol.codAdvance;
            }
          }
        }

        const defaultMinAdv = (minAdvanceSetting && minAdvanceSetting.value !== '') ? Math.max(0, Number(minAdvanceSetting.value)) : 0;
        codAdvanceAmount = determinedAdvance !== null
          ? determinedAdvance
          : defaultMinAdv;

        if (codAdvanceAmount > 0) {
          advanceRequired = Math.min(totalAmount, codAdvanceAmount);
          remainingCashDue = Math.max(0, totalAmount - advanceRequired);
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
      // If COD requires advance payment, order remains PENDING_PAYMENT until advance is paid!
      let initialStatus: any = (data.paymentMethod === 'CASH_ON_DELIVERY' && advanceRequired === 0)
        ? 'CONFIRMED'
        : 'PENDING_PAYMENT';
      let assignedDeliveryBoyId: string | null = null;
      let initialStatusNote = advanceRequired > 0
        ? `Order initiated: Partial COD Advance of ₹${advanceRequired} required to confirm order. Remaining ₹${remainingCashDue} payable in cash at delivery.`
        : 'Order initiated at checkout';

      if (data.paymentMethod === 'CASH_ON_DELIVERY' && advanceRequired === 0 && targetProvider?.autoAssignDelivery) {
        const activeRunner = await prisma.deliveryBoy.findFirst({
          where: { activeStatus: true }
        });
        if (activeRunner) {
          assignedDeliveryBoyId = activeRunner.id;
          initialStatus = 'DELIVERY_ASSIGNED';
          initialStatusNote = `Auto-assigned to delivery partner ${activeRunner.fullName} (${activeRunner.mobileNumber})`;
        }
      }

      // Robust Category & Service Type Detection across all ordered items
      let serviceType: 'FOOD' | 'LAUNDRY' | 'FRESH_PRODUCE' | 'STATIONERY' = 'FOOD';
      const isFruitOrProduce = products.some((p) => {
        const slug = (p as any)?.category?.slug?.toLowerCase() || '';
        const name = (p as any)?.category?.name?.toLowerCase() || '';
        const prod = p.name.toLowerCase();
        return slug.includes('fruit') || slug.includes('produce') ||
               name.includes('fruit') || name.includes('produce') ||
               ['fruit', 'apple', 'banana', 'orange', 'mango', 'guava', 'grapes', 'papaya', 'pineapple', 'watermelon', 'muskmelon', 'pomegranate', 'citrus', 'berries'].some(k => prod.includes(k));
      });

      const isStationery = products.some((p) => {
        const slug = (p as any)?.category?.slug?.toLowerCase() || '';
        const name = (p as any)?.category?.name?.toLowerCase() || '';
        const prod = p.name.toLowerCase();
        return slug.includes('station') || slug.includes('essential') || slug.includes('daily') ||
               name.includes('station') || name.includes('essential') || name.includes('daily') ||
               ['stationery', 'notebook', 'pen', 'pencil', 'eraser', 'scale', 'stapler', 'calculator', 'graph', 'record', 'register', 'file', 'folder', 'chart'].some(k => prod.includes(k));
      });

      const isLaundry = products.some((p) => {
        const slug = (p as any)?.category?.slug?.toLowerCase() || '';
        const name = (p as any)?.category?.name?.toLowerCase() || '';
        return slug.includes('laund') || name.includes('laund');
      });

      if (isFruitOrProduce) {
        serviceType = 'FRESH_PRODUCE';
      } else if (isStationery) {
        serviceType = 'STATIONERY';
      } else if (isLaundry) {
        serviceType = 'LAUNDRY';
      } else {
        serviceType = 'FOOD';
      }

      const commissionRate = 5.0;
      const commissionAmount = Math.round(totalAmount * (commissionRate / 100) * 100) / 100;
      const providerPayable = Math.round((totalAmount - commissionAmount) * 100) / 100;

      // Transactionally deduct stock, create order, order items, status history
      const createdOrder = await prisma.$transaction(async (tx) => {
        // Decrement stock
        for (const item of orderItemsData) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }

        const deliveryOtp = generateSecureOtp();

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            studentId,
            providerId: targetProviderId,
            deliveryBoyId: assignedDeliveryBoyId,
            serviceType,
            status: initialStatus,
            deliveryOtp,
            deliveryOtpVerified: false,
            subtotal,
            deliveryFee,
            discountAmount,
            totalAmount,
            paymentMethod: data.paymentMethod,
            paymentStatus: (data.paymentMethod === 'CASH_ON_DELIVERY' && advanceRequired === 0) ? 'COD_PENDING' : 'PENDING',
            refundStatus: 'NOT_APPLICABLE',
            settlementStatus: 'PENDING',
            commissionRate,
            commissionAmount,
            providerPayable,
            advancePaidAmount: data.paymentMethod === 'CASH_ON_DELIVERY' ? advanceRequired : 0,
            providerAccepted: false,
            providerAcceptedAt: null,
            hallName: data.hallName,
            hallNumber: data.hallNumber || null,
            roomNumber: data.roomNumber,
            specialInstructions: [
              data.specialInstructions,
              data.paymentMethod === 'CASH_ON_DELIVERY' && advanceRequired > 0
                ? `[COD ADVANCE: ₹${advanceRequired} ONLINE | CASH DUE ON DELIVERY: ₹${remainingCashDue}]`
                : null
            ].filter(Boolean).join(' | '),
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
            },
            ...(serviceType === 'FRESH_PRODUCE'
              ? {
                  produceDetails: {
                    create: {
                      packagingType: 'eco-crate',
                      freshnessNotes: 'Quality graded harvest inspected upon campus arrival'
                    }
                  }
                }
              : serviceType === 'STATIONERY'
              ? {
                  stationeryDetails: {
                    create: {
                      brandRequirements: 'Verified campus bookstore academic stock',
                      labSpecification: 'Standard institute lab record standards'
                    }
                  }
                }
              : {
                  foodDetails: {
                    create: {
                      dietarySummary: 'Campus Fresh Meals',
                      preparationNotes: data.specialInstructions || 'Fresh prep upon order confirmation'
                    }
                  }
                })
          },
          include: {
            items: true,
            produceDetails: true,
            stationeryDetails: true,
            foodDetails: true
          }
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

        // Create COD collection entry if cash on delivery
        if (data.paymentMethod === 'CASH_ON_DELIVERY') {
          const codColNum = `COD-${Date.now().toString().slice(-6)}`;
          await (tx as any).cODCollection.create({
            data: {
              collectionNumber: codColNum,
              orderId: newOrder.id,
              deliveryBoyId: assignedDeliveryBoyId || null,
              expectedAmount: remainingCashDue,
              collectedAmount: 0,
              difference: 0,
              collectionStatus: 'PENDING',
              reconciliationStatus: 'PENDING',
              notes: advanceRequired > 0
                ? `Partial online advance of ₹${advanceRequired} required via Razorpay. Cash due at doorstep: ₹${remainingCashDue}.`
                : `Full COD collection of ₹${totalAmount} at doorstep.`
            }
          }).catch((err: any) => console.warn('CODCollection create notice:', err?.message));
        }

        // Clear student cart
        const cart = await tx.cart.findUnique({ where: { studentId } });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }

        return newOrder;
      });

      // Record double-entry financial ledger entry
      await LedgerService.recordOrderPayment({
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        totalAmount,
        providerId: targetProviderId,
        paymentMethod: data.paymentMethod,
        commissionRate,
        commissionAmount,
        providerPayable
      }).catch((err) => console.warn('[LedgerService] recordOrderPayment notice:', err));

      // Determine online gateway payment requirements:
      // Case 1: Full online payment via RAZORPAY
      // Case 2: Cash on Delivery WITH partial advance required (e.g. ₹10)
      let razorpayOrderData = null;
      const requiresOnlinePayment =
        data.paymentMethod === 'RAZORPAY' ||
        (data.paymentMethod === 'CASH_ON_DELIVERY' && advanceRequired > 0);

      const onlineChargeAmount = data.paymentMethod === 'RAZORPAY' ? totalAmount : advanceRequired;

      if (requiresOnlinePayment && onlineChargeAmount > 0) {
        const rzpOrder = await razorpayService.createRazorpayOrder({
          amountInRupees: onlineChargeAmount,
          receiptId: orderNumber,
          notes: {
            orderId: createdOrder.id,
            studentEmail: student.user.email,
            paymentType: data.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD_ADVANCE' : 'FULL_PAYMENT',
            remainingCashDue: remainingCashDue.toString()
          }
        });

        await prisma.payment.create({
          data: {
            orderId: createdOrder.id,
            studentId,
            amount: onlineChargeAmount,
            status: 'PENDING',
            paymentMethod: data.paymentMethod,
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
        // Zero advance COD payment
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
          status:
            data.paymentMethod === 'CASH_ON_DELIVERY'
              ? advanceRequired > 0
                ? `COD Advance ₹${advanceRequired} Pending`
                : 'COD Pending'
              : 'Payment Processing'
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
            ? advanceRequired > 0
              ? `Advance deposit of ₹${advanceRequired} required to confirm order. Remaining ₹${remainingCashDue} will be paid in cash at delivery.`
              : 'Order placed successfully with Cash on Delivery!'
            : 'Order created. Please complete payment via Razorpay.',
        requiresAdvance: data.paymentMethod === 'CASH_ON_DELIVERY' && advanceRequired > 0,
        advanceRequired,
        remainingCashDue,
        order: {
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          status: createdOrder.status,
          serviceType: createdOrder.serviceType,
          totalAmount,
          paymentMethod: data.paymentMethod,
          advanceRequired,
          remainingCashDue
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
          provider: { select: { id: true, fullName: true, mobileNumber: true, serviceCategory: true } },
          deliveryBoy: { select: { id: true, fullName: true, mobileNumber: true, vehicleType: true } },
          produceDetails: true,
          stationeryDetails: true,
          foodDetails: true,
          codCollection: true
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

      // For authenticated student: display real 6-digit customer delivery OTP until delivered
      let customerOtp = (order as any).deliveryOtp;
      if (!customerOtp && order.status !== 'DELIVERED') {
        customerOtp = generateSecureOtp();
        try {
          await prisma.order.update({
            where: { id: order.id },
            data: { deliveryOtp: customerOtp }
          });
        } catch {
          // Non-blocking fallback
        }
      }

      const isAccepted = ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'DISPATCHED'].includes(order.status);
      const isModifiable = !isAccepted && ['CONFIRMED', 'PENDING_PAYMENT'].includes(order.status);
      const cancelCheck = RefundService.checkCancellationEligibility(order);
      const returnCheck = RefundService.evaluateReturnEligibility(order);

      const codPaidAdvance = (order.paymentMethod === 'CASH_ON_DELIVERY' && ['COD_PENDING', 'SUCCESS', 'PAID'].includes(order.paymentStatus))
        ? Number(order.payment?.amount || 0)
        : 0;
      const codRemainingCash = order.paymentMethod === 'CASH_ON_DELIVERY'
        ? ((order as any).codCollection ? Number((order as any).codCollection.expectedAmount) : Math.max(0, Number(order.totalAmount) - codPaidAdvance))
        : 0;

      res.status(200).json({
        success: true,
        order: {
          ...order,
          deliveryOtp: order.status === 'DELIVERED' || (order as any).deliveryOtpVerified ? null : customerOtp,
          deliveryOtpVerified: (order as any).deliveryOtpVerified || false,
          deliveredAt: (order as any).deliveredAt || null,
          totalAmount: Number(order.totalAmount),
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          discountAmount: Number(order.discountAmount),
          isAccepted,
          isModifiable,
          canCancel: cancelCheck.eligible,
          cancellationMessage: cancelCheck.reason || null,
          canReturn: returnCheck.eligible,
          returnMessage: returnCheck.reason || null,
          codPaidAdvance,
          codRemainingCash,
          isProduce: order.serviceType === 'FRESH_PRODUCE',
          isStationery: order.serviceType === 'STATIONERY',
          isFood: order.serviceType === 'FOOD',
          produceDetails: (order as any).produceDetails || null,
          stationeryDetails: (order as any).stationeryDetails || null,
          foodDetails: (order as any).foodDetails || null,
          codCollection: (order as any).codCollection || null
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Modify an order (only permitted BEFORE provider accepts)
   */
  public static async modifyOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { roomNumber, specialInstructions } = req.body;
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

      if (req.user?.role === 'STUDENT' && order.studentId !== studentId) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Immutability on vendor acceptance
      const nonModifiable = ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPATCHED'];
      if (nonModifiable.includes(order.status)) {
        res.status(400).json({
          success: false,
          message: 'Order has already been accepted by the provider and fulfillment has commenced. Order cannot be changed.'
        });
        return;
      }

      const updateData: any = {};
      if (roomNumber) updateData.roomNumber = roomNumber;
      if (specialInstructions !== undefined) updateData.specialInstructions = specialInstructions;

      const updated = await prisma.order.update({
        where: { id },
        data: {
          ...updateData,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: order.status,
              changedBy: 'STUDENT',
              notes: `Order details updated by student before provider acceptance (Room: ${roomNumber || order.roomNumber})`
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Order details updated successfully before provider acceptance.',
        order: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request a return for a delivered order
   */
  public static async requestReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
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

      if (req.user?.role === 'STUDENT' && order.studentId !== studentId) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const returnCheck = RefundService.evaluateReturnEligibility(order);
      if (!returnCheck.eligible) {
        res.status(400).json({
          success: false,
          message: returnCheck.reason || 'This order is not eligible for return.'
        });
        return;
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          refundStatus: 'REQUESTED',
          cancellationReason: `Return Requested: ${reason || 'Customer requested return for delivered item'}`,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: order.status,
              changedBy: 'STUDENT',
              notes: `Customer initiated return request: ${reason || 'Return requested'}`
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Return request submitted successfully. Support team will inspect and process your return.',
        order: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel an order (service-adaptive rules & automatic refund sequence)
   */
  public static async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const student = await resolveStudentProfile(req.user);
      const studentId = student?.id;

      const order = await (prisma as any).order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      if (req.user?.role === 'STUDENT' && order.studentId !== studentId) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Check service-specific cancellation rules
      const check = RefundService.checkCancellationEligibility(order);
      if (!check.eligible) {
        res.status(400).json({
          success: false,
          message: check.reason || `Cannot cancel order in ${order.status.replace(/_/g, ' ')} status.`
        });
        return;
      }

      const callerRole: 'STUDENT' | 'PROVIDER' | 'ADMIN' =
        req.user?.role === 'SERVICE_PROVIDER' ? 'PROVIDER' : (req.user?.role === 'ADMIN' ? 'ADMIN' : 'STUDENT');

      const updated = await RefundService.cancelOrder(
        id,
        req.user?.userId || studentId || 'unknown_user',
        callerRole,
        reason || 'Customer requested cancellation'
      );

      // Restore inventory
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId) {
            await (prisma as any).product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            }).catch(() => {});
          }
        }
      }

      res.status(200).json({
        success: true,
        message: updated.explanation || 'Order cancelled successfully.',
        cancellationType: updated.cancellationType,
        refundableAmount: updated.refundableAmount,
        order: updated
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Save student confidential refund account
   */
  public static async saveRefundAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await resolveStudentProfile(req.user);
      if (!student) {
        res.status(403).json({ success: false, message: 'Student profile required' });
        return;
      }

      const { accountType, accountHolderName, bankName, accountNumber, ifscCode, upiId } = req.body;
      if (!accountType || !accountHolderName) {
        res.status(400).json({ success: false, message: 'Account Type and Account Holder Name are required' });
        return;
      }

      const account = await RefundService.saveRefundAccount(student.id, {
        accountType,
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        upiId
      });

      res.status(200).json({
        success: true,
        message: 'Refund destination account saved securely.',
        data: {
          id: account.id,
          accountType: account.accountType,
          accountHolderName: account.accountHolderName,
          bankName: account.bankName,
          accountNumberMasked: account.accountNumberMasked,
          upiIdMasked: account.upiIdMasked,
          isVerified: account.isVerified
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get student confidential refund account (Masked for privacy)
   */
  public static async getRefundAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await resolveStudentProfile(req.user);
      if (!student) {
        res.status(403).json({ success: false, message: 'Student profile required' });
        return;
      }

      const account = await (prisma as any).refundAccount.findFirst({
        where: { studentId: student.id }
      });

      res.status(200).json({
        success: true,
        data: account ? {
          id: account.id,
          accountType: account.accountType,
          accountHolderName: account.accountHolderName,
          bankName: account.bankName,
          accountNumberMasked: account.accountNumberMasked,
          ifscCode: account.ifscCode,
          upiIdMasked: account.upiIdMasked,
          isVerified: account.isVerified
        } : null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public Order Policies & Platform Checkout Settings
   */
  public static async getOrderPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await prisma.adminSetting.findMany({
        where: {
          key: {
            in: [
              'ENABLE_CASH_ON_DELIVERY',
              'MAX_COD_AMOUNT',
              'COD_MIN_ADVANCE_AMOUNT',
              'PRODUCT_ORDER_POLICIES',
              'PROVIDER_ORDER_POLICIES',
              'CANCELLATION_CUTOFF_STAGE',
              'RETURN_POLICY_FOOD',
              'RETURN_POLICY_PRODUCE',
              'RETURN_POLICY_STATIONERY'
            ]
          }
        }
      });

      const settingMap: Record<string, string> = {};
      settings.forEach((s) => { settingMap[s.key] = s.value; });

      let productPolicies: Record<string, any> = {};
      let providerPolicies: Record<string, any> = {};

      try {
        if (settingMap['PRODUCT_ORDER_POLICIES']) {
          productPolicies = JSON.parse(settingMap['PRODUCT_ORDER_POLICIES']);
        }
      } catch {}

      try {
        if (settingMap['PROVIDER_ORDER_POLICIES']) {
          providerPolicies = JSON.parse(settingMap['PROVIDER_ORDER_POLICIES']);
        }
      } catch {}

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const parsedAdvance = settingMap['COD_MIN_ADVANCE_AMOUNT'] !== undefined && settingMap['COD_MIN_ADVANCE_AMOUNT'] !== ''
        ? Math.max(0, Number(settingMap['COD_MIN_ADVANCE_AMOUNT']))
        : 0;

      res.status(200).json({
        success: true,
        isCodGloballyEnabled: settingMap['ENABLE_CASH_ON_DELIVERY'] !== 'false',
        maxCodAmount: Number(settingMap['MAX_COD_AMOUNT']) || 1500,
        codMinAdvanceAmount: parsedAdvance,
        cancellationCutoffStage: settingMap['CANCELLATION_CUTOFF_STAGE'] || 'ACCEPTED',
        returnPolicyFood: settingMap['RETURN_POLICY_FOOD'] || 'RESTRICTED',
        returnPolicyProduce: settingMap['RETURN_POLICY_PRODUCE'] || 'FRESHNESS_VERIFIED',
        returnPolicyStationery: settingMap['RETURN_POLICY_STATIONERY'] || 'ALLOWED_24HR',
        productPolicies,
        providerPolicies
      });
    } catch (err) {
      next(err);
    }
  }
}
