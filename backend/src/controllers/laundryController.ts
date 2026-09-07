import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { laundryOrderSchema, verifyLaundryOtpSchema, laundryConditionSchema } from '../validators/orderValidators';
import { generateLaundryOrderNumber } from '../utils/crypto';
import { LaundryPricingService } from '../services/laundry/LaundryPricingService';
import { LaundryOtpService } from '../services/laundry/LaundryOtpService';
import { LaundryCodService } from '../services/laundry/LaundryCodService';
import { LaundrySettlementService } from '../services/laundry/LaundrySettlementService';
import { LedgerService } from '../services/financial/LedgerService';
import { ReceiptService } from '../services/receipt/ReceiptService';
import { AuditService } from '../services/audit/AuditService';
import { RazorpayService } from '../services/payment/RazorpayService';
import { env } from '../config/environment';

const laundryOtpService = new LaundryOtpService();
const receiptService = new ReceiptService();
const razorpayService = new RazorpayService();

export class LaundryController {
  /**
   * Get dynamic pricing and tariff configuration for laundry booking
   */
  public static async getPricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = req.query.providerId as string | undefined;
      const data = await LaundryPricingService.getBookingConfig(providerId);
      res.status(200).json({
        success: true,
        ...data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Book a campus laundry pickup with strict pricing & service charge separation.
   * COD requires advance online service charge payment.
   * Deferred OTP: OTPs are NOT generated at booking creation.
   * Zero email OTP dispatch.
   */
  public static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(403).json({ success: false, message: 'Student profile required' });
        return;
      }

      const data = laundryOrderSchema.parse(req.body);

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true, hall: true }
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      // 1. Calculate price separation via LaundryPricingService (NO hardcoded prices)
      const pricing = await LaundryPricingService.calculatePricing({
        serviceConfigId: data.serviceConfigId,
        items: data.items,
        paymentMethod: data.paymentMethod as 'ONLINE' | 'COD'
      });

      const orderNumber = generateLaundryOrderNumber();
      const trackingNumber = `TRK-${orderNumber}`;

      // Tracking metadata stored without any plain OTPs
      const qrCodeData = JSON.stringify({
        trackingNumber,
        orderNumber,
        studentName: student.fullName,
        hall: student.hall?.name || data.hallName,
        room: data.roomNumber,
        serviceName: pricing.serviceName,
        garmentCount: pricing.totalQuantity,
        paymentMethod: data.paymentMethod
      });

      // 2. Fetch default or active laundry provider
      const laundryProvider = await prisma.serviceProvider.findFirst({
        where: { serviceCategory: 'LAUNDRY', activeStatus: true }
      });

      // 3. Create Laundry Order in single transaction
      const newLaundryOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.laundryOrder.create({
          data: {
            orderNumber,
            trackingNumber,
            qrCodeData,
            studentId,
            providerId: laundryProvider?.id || null,
            deliveryBoyId: null,
            status: 'REQUESTED',
            estimatedPrice: pricing.totalAmount,
            finalPrice: pricing.totalAmount,
            laundryBaseAmount: pricing.laundryBaseAmount,
            serviceChargeAmount: pricing.serviceChargeAmount,
            totalAmount: pricing.totalAmount,
            onlinePaidAmount: pricing.onlinePaidAmount,
            codAmount: pricing.codAmount,
            codCollectedAmount: 0,
            codStatus: data.paymentMethod === 'COD' ? 'PENDING' : 'NOT_APPLICABLE',
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentMethod === 'ONLINE' ? 'PAID' : 'PARTIALLY_PAID',
            settlementStatus: 'NOT_ELIGIBLE',
            refundStatus: 'NOT_APPLICABLE',
            serviceChargeRefundable: true,
            priceSnapshotJson: JSON.stringify(pricing.snapshot),
            serviceConfigId: pricing.serviceConfigId || null,
            hallName: data.hallName,
            hallNumber: data.hallNumber || null,
            roomNumber: data.roomNumber,
            pickupDate: new Date(data.pickupDate),
            preferredPickupTime: data.preferredPickupTime,
            preferredReturnTime: data.preferredReturnTime,
            specialInstructions: data.specialInstructions || null,
            items: {
              create: pricing.itemsBreakdown.map((item) => ({
                itemType: item.itemType,
                quantity: item.quantity,
                unitPrice: item.unitPrice
              }))
            },
            statusHistory: {
              create: {
                previousStatus: null,
                newStatus: 'REQUESTED',
                changedBy: 'STUDENT',
                notes: `Laundry booked. Payment: ${data.paymentMethod}. Online advance: ₹${pricing.onlinePaidAmount}, COD Due: ₹${pricing.codAmount}`
              }
            }
          }
        });

        // Save cloth photos if provided
        if (data.photos && data.photos.length > 0) {
          for (const photo of data.photos) {
            await tx.laundryItemPhoto.create({
              data: {
                laundryOrderId: order.id,
                googleDriveFileId: `photo_${Date.now()}`,
                googleDriveUrl: photo.url,
                description: photo.description || 'Student uploaded verification photo',
                uploadedBy: student.fullName
              }
            });
          }
        }

        return order;
      });

      // 4. Create transparent payment receipt separating base and service charge
      const receiptPayload = receiptService.buildReceiptData({
        orderNumber,
        orderType: 'LAUNDRY',
        student: {
          name: student.fullName,
          email: student.user.email,
          rollNumber: student.rollNumber || 'STUDENT',
          hall: student.hall?.name || data.hallName,
          room: data.roomNumber
        },
        items: pricing.itemsBreakdown.map((i) => ({
          name: `${i.itemType} (${pricing.serviceName})`,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: i.baseSubtotal
        })),
        subtotal: pricing.laundryBaseAmount,
        discount: 0,
        deliveryFee: 0,
        total: pricing.totalAmount,
        payment: {
          method: data.paymentMethod,
          status: data.paymentMethod === 'ONLINE' ? 'Paid Online' : 'Service Charge Paid Online, Cash on Delivery Pending'
        }
      });

      await prisma.receipt.create({
        data: {
          receiptNumber: receiptPayload.receiptNumber,
          laundryOrderId: newLaundryOrder.id,
          studentId,
          totalAmount: pricing.totalAmount,
          receiptDataJson: JSON.stringify(receiptPayload)
        }
      });

      // 5. Append payment to Financial Ledger
      try {
        await LedgerService.recordEntry({
          orderId: newLaundryOrder.id,
          entryType: 'ORDER_PAYMENT',
          debitAccount: data.paymentMethod === 'ONLINE' ? 'RAZORPAY_GATEWAY' : 'STUDENT_ONLINE_PAYMENT',
          creditAccount: 'CAMPUS_ESCROW',
          amount: pricing.onlinePaidAmount,
          description: data.paymentMethod === 'COD' 
            ? `Advance service charge collected online for laundry order ${orderNumber}`
            : `Full online payment collected for laundry order ${orderNumber}`,
          metadata: {
            orderNumber,
            paymentMethod: data.paymentMethod,
            laundryBaseAmount: pricing.laundryBaseAmount,
            serviceChargeAmount: pricing.serviceChargeAmount,
            onlinePaidAmount: pricing.onlinePaidAmount,
            codAmount: pricing.codAmount
          }
        });
      } catch (err) {
        console.warn('Failed to append laundry order to Financial Ledger:', err);
      }

      // 6. Initialize Razorpay Order for online payable portion (Full amount for ONLINE, Service Charge advance for COD)
      let razorpayData = null;
      if (pricing.onlinePaidAmount > 0) {
        try {
          const rzpOrder = await razorpayService.createRazorpayOrder({
            amountInRupees: pricing.onlinePaidAmount,
            receiptId: orderNumber,
            notes: {
              orderNumber,
              laundryOrderId: newLaundryOrder.id,
              studentEmail: student.user.email,
              paymentMethod: data.paymentMethod,
              paymentPurpose: data.paymentMethod === 'COD' ? 'LAUNDRY_SERVICE_CHARGE_ADVANCE' : 'LAUNDRY_FULL_PAYMENT'
            }
          });

          await prisma.payment.create({
            data: {
              laundryOrderId: newLaundryOrder.id,
              studentId,
              amount: pricing.onlinePaidAmount,
              paymentMethod: 'RAZORPAY',
              status: 'PENDING',
              razorpayOrderId: rzpOrder.id
            }
          });

          razorpayData = {
            keyId: env.RAZORPAY_KEY_ID || 'rzp_test_nitdgp',
            amount: rzpOrder.amount, // in paise
            currency: rzpOrder.currency || 'INR',
            razorpayOrderId: rzpOrder.id,
            payableAmount: pricing.onlinePaidAmount,
            paymentPurpose: data.paymentMethod === 'COD' ? 'LAUNDRY_SERVICE_CHARGE_ADVANCE' : 'LAUNDRY_FULL_PAYMENT'
          };
        } catch (err) {
          console.warn('Failed to create Razorpay order for laundry booking:', err);
        }
      }

      // NOTE: NO EMAIL OTP SENT. Deferred OTP workflow active.

      res.status(201).json({
        success: true,
        message: data.paymentMethod === 'COD'
          ? `Laundry booking created! Please complete payment of ₹${pricing.serviceChargeAmount} service charge online via Razorpay.`
          : `Laundry booking created! Please complete payment of ₹${pricing.totalAmount} via Razorpay.`,
        laundryOrder: {
          id: newLaundryOrder.id,
          orderNumber: newLaundryOrder.orderNumber,
          trackingNumber: newLaundryOrder.trackingNumber,
          status: newLaundryOrder.status,
          laundryBaseAmount: pricing.laundryBaseAmount,
          serviceChargeAmount: pricing.serviceChargeAmount,
          totalAmount: pricing.totalAmount,
          onlinePaidAmount: pricing.onlinePaidAmount,
          codAmount: pricing.codAmount,
          paymentMethod: newLaundryOrder.paymentMethod,
          paymentStatus: newLaundryOrder.paymentStatus
        },
        razorpay: razorpayData
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Helper to format student order with contextual OTP based on stage
   */
  private static formatOrderForStudent(order: any) {
    const status = order.status;
    const otps: any[] = order.otps || [];

    const pickupRecord = otps.find((o: any) => o.otpType === 'PICKUP');
    const deliveryRecord = otps.find((o: any) => o.otpType === 'DELIVERY');

    // Contextual Pickup OTP logic:
    // Show only when provider accepted / scheduled, before collection
    let pickupOtp: string | null = null;
    let pickupVerified = false;
    let pickupMessage: string | null = null;

    if (['ACCEPTED', 'PICKUP_SCHEDULED'].includes(status) && pickupRecord && !pickupRecord.isUsed) {
      pickupOtp = pickupRecord.encryptedOtp 
        ? laundryOtpService.decryptForStudent(pickupRecord.encryptedOtp) 
        : null;
      pickupMessage = 'Share this OTP with the laundry provider when they collect your laundry.';
    } else if (['CLOTHES_COLLECTED', 'IN_LAUNDRY', 'WASHING', 'DRYING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(status)) {
      pickupVerified = true;
    }

    // Contextual Delivery OTP logic:
    // Show only when clean clothes ready / out for delivery, before completion
    let deliveryOtp: string | null = null;
    let deliveryVerified = false;
    let deliveryMessage: string | null = null;

    if (['READY', 'DELIVERY_SCHEDULED'].includes(status) && deliveryRecord && !deliveryRecord.isUsed) {
      deliveryOtp = deliveryRecord.encryptedOtp 
        ? laundryOtpService.decryptForStudent(deliveryRecord.encryptedOtp) 
        : null;
      deliveryMessage = 'Share this OTP with the laundry provider when your laundry is returned.';
    } else if (status === 'COMPLETED') {
      deliveryVerified = true;
    }

    const baseAmount = Number(order.laundryBaseAmount || (order.finalPrice || order.estimatedPrice || 0) * 0.95);
    const serviceCharge = Number(order.serviceChargeAmount || (order.finalPrice || order.estimatedPrice || 0) * 0.05);
    const total = Number(order.totalAmount || order.finalPrice || order.estimatedPrice || 0);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      status: order.status,
      hallName: order.hallName,
      hallNumber: order.hallNumber,
      roomNumber: order.roomNumber,
      pickupDate: order.pickupDate,
      preferredPickupTime: order.preferredPickupTime,
      preferredReturnTime: order.preferredReturnTime,
      specialInstructions: order.specialInstructions,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      // Financial separation
      laundryBaseAmount: baseAmount,
      serviceChargeAmount: serviceCharge,
      totalAmount: total,
      onlinePaidAmount: Number(order.onlinePaidAmount || (order.paymentMethod === 'ONLINE' ? total : serviceCharge)),
      codAmount: Number(order.codAmount || (order.paymentMethod === 'COD' ? baseAmount : 0)),
      codCollectedAmount: Number(order.codCollectedAmount || 0),
      codStatus: order.codStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      settlementStatus: order.settlementStatus,
      refundStatus: order.refundStatus,
      // OTP Security
      pickupOtp,
      pickupVerified,
      pickupMessage,
      deliveryOtp,
      deliveryVerified,
      deliveryMessage,
      // Related collections
      items: order.items || [],
      photos: order.photos || [],
      statusHistory: order.statusHistory || [],
      receipt: order.receipt || null,
      provider: order.provider ? { fullName: order.provider.fullName, mobileNumber: order.provider.mobileNumber } : null
    };
  }

  /**
   * Get student's laundry orders with contextual OTP and clear financial separation
   */
  public static async getStudentLaundryOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;
      const orders = await prisma.laundryOrder.findMany({
        where: { studentId },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
          photos: true,
          receipt: true,
          otps: true,
          provider: { select: { fullName: true, mobileNumber: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        orders: orders.map((o) => LaundryController.formatOrderForStudent(o))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single order detail
   */
  public static async getOrderDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await prisma.laundryOrder.findUnique({
        where: { id },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
          photos: true,
          receipt: true,
          otps: true,
          codCollection: true,
          provider: { select: { fullName: true, mobileNumber: true } }
        }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Laundry order not found' });
        return;
      }

      res.status(200).json({
        success: true,
        order: LaundryController.formatOrderForStudent(order)
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify Pickup OTP (Provider action)
   * Provider enters student's OTP.
   * OTP is validated against hash; mark used, records verifiedAt & verifiedBy,
   * advances status to CLOTHES_COLLECTED.
   */
  public static async verifyPickupOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { otp } = verifyLaundryOtpSchema.parse(req.body);

      const order = await prisma.laundryOrder.findUnique({
        where: { id },
        include: { otps: true }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Laundry order not found' });
        return;
      }

      const pickupOtpRecord = order.otps.find((o) => o.otpType === 'PICKUP');
      if (!pickupOtpRecord) {
        res.status(400).json({ success: false, message: 'Pickup OTP not generated yet. Provider must accept order first.' });
        return;
      }

      // Verify OTP strictly against cryptographically secure hash
      const result = laundryOtpService.verifyOtp(otp, pickupOtpRecord as any, 'PICKUP');

      if (!result.success) {
        await prisma.laundryOtp.update({
          where: { id: pickupOtpRecord.id },
          data: { attempts: { increment: 1 } }
        });
        res.status(400).json({ success: false, message: result.message || 'Invalid Pickup OTP' });
        return;
      }

      // Mark OTP used, record verifiedAt/verifiedBy, and advance status to CLOTHES_COLLECTED
      await prisma.$transaction([
        prisma.laundryOtp.update({
          where: { id: pickupOtpRecord.id },
          data: {
            isUsed: true,
            verifiedAt: new Date(),
            verifiedBy: req.user?.email || req.user?.userId || 'PROVIDER'
          }
        }),
        prisma.laundryOrder.update({
          where: { id },
          data: {
            status: 'CLOTHES_COLLECTED',
            statusHistory: {
              create: {
                previousStatus: order.status,
                newStatus: 'CLOTHES_COLLECTED',
                changedBy: req.user?.email || 'PROVIDER',
                notes: 'Student pickup OTP verified at doorstep. Clothes collected.'
              }
            }
          }
        })
      ]);

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'LAUNDRY_PICKUP_OTP_VERIFIED',
        entity: 'LaundryOrder',
        entityId: order.id,
        newValue: { orderNumber: order.orderNumber, status: 'CLOTHES_COLLECTED' },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Pickup OTP verified successfully! Laundry collected.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify Delivery OTP (Provider action)
   * Provider enters student's return OTP.
   * On success: marks order COMPLETED and automatically triggers provider settlement eligibility.
   */
  public static async verifyDeliveryOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { otp } = verifyLaundryOtpSchema.parse(req.body);

      const order = await prisma.laundryOrder.findUnique({
        where: { id },
        include: { otps: true }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Laundry order not found' });
        return;
      }

      const deliveryOtpRecord = order.otps.find((o) => o.otpType === 'DELIVERY');
      if (!deliveryOtpRecord) {
        res.status(400).json({ success: false, message: 'Delivery OTP not generated yet. Laundry must be marked ready/out for delivery first.' });
        return;
      }

      // Verify OTP strictly against hash
      const result = laundryOtpService.verifyOtp(otp, deliveryOtpRecord as any, 'DELIVERY');

      if (!result.success) {
        await prisma.laundryOtp.update({
          where: { id: deliveryOtpRecord.id },
          data: { attempts: { increment: 1 } }
        });
        res.status(400).json({ success: false, message: result.message || 'Invalid Delivery OTP' });
        return;
      }

      // Mark OTP used, complete order, and trigger settlement eligibility
      await prisma.$transaction([
        prisma.laundryOtp.update({
          where: { id: deliveryOtpRecord.id },
          data: {
            isUsed: true,
            verifiedAt: new Date(),
            verifiedBy: req.user?.email || req.user?.userId || 'PROVIDER'
          }
        }),
        prisma.laundryOrder.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            statusHistory: {
              create: {
                previousStatus: order.status,
                newStatus: 'COMPLETED',
                changedBy: req.user?.email || 'PROVIDER',
                notes: 'Student delivery OTP verified. Clean clothes handed over.'
              }
            }
          }
        })
      ]);

      // Automatically trigger provider payable settlement eligibility
      await LaundrySettlementService.makeEligibleAfterDelivery(order.id);

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'LAUNDRY_DELIVERY_OTP_VERIFIED',
        entity: 'LaundryOrder',
        entityId: order.id,
        newValue: { orderNumber: order.orderNumber, status: 'COMPLETED', settlementStatus: 'ELIGIBLE' },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Delivery OTP verified successfully! Order completed & provider settlement eligible.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update laundry status (Provider or Admin)
   * Enforces status bypass prevention:
   * - Provider CANNOT manually set CLOTHES_COLLECTED without pickup OTP verification.
   * - Provider CANNOT manually set COMPLETED without delivery OTP verification.
   * - Admin override requires mandatory justification.
   *
   * Triggers deferred OTP generation:
   * - On ACCEPTED: generates Pickup OTP.
   * - On READY / DELIVERY_SCHEDULED: generates Delivery OTP.
   */
  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes, adminOverrideReason } = req.body;
      const userRole = req.user?.role;

      const order = await prisma.laundryOrder.findUnique({
        where: { id },
        include: { otps: true }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Laundry order not found' });
        return;
      }

      // Check Status Bypass Prevention (Requirement #45)
      if (status === 'CLOTHES_COLLECTED') {
        const pickupVerified = order.otps.some((o) => o.otpType === 'PICKUP' && o.isUsed);
        if (!pickupVerified) {
          if (userRole === 'ADMIN' && adminOverrideReason) {
            // Admin override with mandatory reason
            await AuditService.log(prisma, {
              userId: req.user?.userId,
              action: 'ADMIN_OVERRIDE_PICKUP_OTP_BYPASS',
              entity: 'LaundryOrder',
              entityId: order.id,
              oldValue: { status: order.status },
              newValue: { status, reason: adminOverrideReason },
              ipAddress: req.ip
            });
          } else {
            res.status(403).json({
              success: false,
              message: 'Cannot mark Picked Up directly. Student Pickup OTP must be verified.'
            });
            return;
          }
        }
      }

      if (status === 'COMPLETED') {
        const deliveryVerified = order.otps.some((o) => o.otpType === 'DELIVERY' && o.isUsed);
        if (!deliveryVerified) {
          if (userRole === 'ADMIN' && adminOverrideReason) {
            // Admin override with mandatory reason
            await AuditService.log(prisma, {
              userId: req.user?.userId,
              action: 'ADMIN_OVERRIDE_DELIVERY_OTP_BYPASS',
              entity: 'LaundryOrder',
              entityId: order.id,
              oldValue: { status: order.status },
              newValue: { status, reason: adminOverrideReason },
              ipAddress: req.ip
            });
          } else {
            res.status(403).json({
              success: false,
              message: 'Cannot mark Completed directly. Student Delivery OTP must be verified.'
            });
            return;
          }
        }
      }

      // Update Order Status
      await prisma.laundryOrder.update({
        where: { id },
        data: {
          status,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: status,
              changedBy: req.user?.email || 'STAFF',
              notes: notes || `Status changed to ${status}${adminOverrideReason ? ` (Admin override: ${adminOverrideReason})` : ''}`
            }
          }
        }
      });

      // Deferred Pickup OTP generation: generate when provider accepts
      if (['ACCEPTED', 'PICKUP_SCHEDULED'].includes(status)) {
        const existingPickup = order.otps.find((o) => o.otpType === 'PICKUP');
        if (!existingPickup) {
          const pickupOtpData = laundryOtpService.generateOtp(order.id, 'PICKUP');
          await prisma.laundryOtp.create({
            data: {
              laundryOrderId: order.id,
              otpType: 'PICKUP',
              otpHash: pickupOtpData.otpHash,
              encryptedOtp: pickupOtpData.encryptedOtp,
              expiresAt: pickupOtpData.expiresAt
            }
          });
          await prisma.laundryOrder.update({
            where: { id: order.id },
            data: { pickupOtpGeneratedAt: new Date() }
          });
        }
      }

      // Deferred Delivery OTP generation: generate when order is marked ready or out for delivery
      if (['READY', 'DELIVERY_SCHEDULED'].includes(status)) {
        const existingDelivery = order.otps.find((o) => o.otpType === 'DELIVERY');
        if (!existingDelivery) {
          const deliveryOtpData = laundryOtpService.generateOtp(order.id, 'DELIVERY');
          await prisma.laundryOtp.create({
            data: {
              laundryOrderId: order.id,
              otpType: 'DELIVERY',
              otpHash: deliveryOtpData.otpHash,
              encryptedOtp: deliveryOtpData.encryptedOtp,
              expiresAt: deliveryOtpData.expiresAt
            }
          });
          await prisma.laundryOrder.update({
            where: { id: order.id },
            data: { deliveryOtpGeneratedAt: new Date() }
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Status updated to ${status}`
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Provider records COD cash collection from student upon delivery
   */
  public static async markCodCollected(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { collectedAmount, notes } = req.body;
      const providerId = req.user?.providerId || req.user?.userId || 'PROVIDER';

      const result = await LaundryCodService.recordCollection({
        laundryOrderId: id,
        providerId,
        collectedAmount: collectedAmount ? Number(collectedAmount) : undefined,
        notes,
        collectedBy: req.user?.email || providerId,
        ipAddress: req.ip
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Provider logs condition notes (stains, missing buttons, fabric damages)
   */
  public static async recordCondition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = laundryConditionSchema.parse(req.body);

      const formattedNotes = [
        data.conditionNote,
        data.damages && data.damages.length > 0 ? `Issues recorded: ${data.damages.join(', ')}` : null
      ]
        .filter(Boolean)
        .join(' | ');

      await prisma.laundryOrder.update({
        where: { id },
        data: {
          specialInstructions: formattedNotes
        }
      });

      res.status(200).json({
        success: true,
        message: 'Condition notes saved successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Student or Provider order cancellation with transparent refund calculation
   */
  public static async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userRole = req.user?.role;
      const studentId = req.user?.studentId;

      const order = await prisma.laundryOrder.findUnique({
        where: { id }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Laundry order not found' });
        return;
      }

      if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
        res.status(400).json({ success: false, message: `Cannot cancel an order that is already ${order.status}.` });
        return;
      }

      // Student can only cancel before pickup
      if (userRole === 'STUDENT') {
        if (!['REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED'].includes(order.status)) {
          res.status(403).json({
            success: false,
            message: 'Cancellation not allowed once clothes have been picked up and sent for wash.'
          });
          return;
        }
      }

      // Calculate refund based on service charge refundability policy
      const scRefundSetting = await prisma.adminSetting.findUnique({
        where: { key: 'LAUNDRY_SERVICE_CHARGE_REFUNDABLE' }
      });
      const isScRefundable = scRefundSetting ? scRefundSetting.value === 'true' : true;

      const baseAmount = Number(order.laundryBaseAmount || 0);
      const scAmount = Number(order.serviceChargeAmount || 0);

      let estimatedRefund = 0;
      if (order.paymentMethod === 'ONLINE') {
        // Full online paid
        estimatedRefund = baseAmount + (isScRefundable ? scAmount : 0);
      } else {
        // COD order: student paid only service charge online advance
        estimatedRefund = isScRefundable ? scAmount : 0;
      }

      const updated = await prisma.laundryOrder.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          refundStatus: estimatedRefund > 0 ? 'PROCESSING' : 'NOT_APPLICABLE',
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: 'CANCELLED',
              changedBy: req.user?.email || userRole || 'USER',
              notes: `Order cancelled. Reason: ${reason || 'User cancelled'}. Refund amount: ₹${estimatedRefund} (SC Refundable: ${isScRefundable ? 'YES' : 'NO'})`
            }
          }
        }
      });

      // Record refund in ledger if refund amount > 0
      if (estimatedRefund > 0) {
        try {
          await LedgerService.recordEntry({
            orderId: order.id,
            entryType: 'REFUND_ISSUED',
            debitAccount: 'STUDENT_REFUND_LIABILITY',
            creditAccount: 'CAMPUS_ESCROW_GATEWAY',
            amount: estimatedRefund,
            referenceId: `REF_${order.orderNumber}`,
            description: `Student refund for cancelled laundry order ${order.orderNumber}. Reason: ${reason || 'User cancelled'}. Service charge refundable: ${isScRefundable ? 'YES' : 'NO'}`,
            metadata: {
              orderNumber: order.orderNumber,
              refundAmount: estimatedRefund,
              reason: reason || 'Order cancellation',
              serviceChargeRefundable: isScRefundable,
              studentId: order.studentId
            }
          });
        } catch {}
      }

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully.',
        order: updated,
        refundSummary: {
          refundAmount: estimatedRefund,
          serviceChargeRefunded: isScRefundable ? scAmount : 0,
          serviceChargeRetained: isScRefundable ? 0 : scAmount,
          policy: isScRefundable ? 'Service charge fully refundable' : 'Service charge non-refundable'
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
