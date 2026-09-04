import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { laundryOrderSchema, verifyLaundryOtpSchema, laundryConditionSchema } from '../validators/orderValidators';
import { generateLaundryOrderNumber } from '../utils/crypto';
import { LaundryOtpService } from '../services/laundry/LaundryOtpService';
import { EmailService } from '../services/email/EmailService';
import { ReceiptService } from '../services/receipt/ReceiptService';

const laundryOtpService = new LaundryOtpService();
const emailService = new EmailService();
const receiptService = new ReceiptService();

const LAUNDRY_ITEM_PRICES: Record<string, number> = {
  'Shirt': 15,
  'T-Shirt': 15,
  'Pants': 20,
  'Jeans': 25,
  'Kurta': 20,
  'Bedsheet': 35,
  'Towel': 15,
  'Blanket': 90,
  'Other': 20
};

export class LaundryController {
  /**
   * Book a campus laundry pickup
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

      // Calculate verified price
      let estimatedPrice = 0;
      const itemsToCreate = data.items.map((item) => {
        const unitPrice = LAUNDRY_ITEM_PRICES[item.itemType] || 20;
        const total = unitPrice * item.quantity;
        estimatedPrice += total;
        return {
          itemType: item.itemType,
          quantity: item.quantity,
          unitPrice
        };
      });

      const orderNumber = generateLaundryOrderNumber();
      const trackingNumber = `TRK-${orderNumber}`;
      const qrCodeData = JSON.stringify({
        trackingNumber,
        orderNumber,
        studentName: student.fullName,
        hall: student.hall?.name || data.hallName,
        room: data.roomNumber
      });

      // Generate TWO DISTINCT OTPs
      const pickupOtpData = laundryOtpService.generateOtp(orderNumber, 'PICKUP');
      const deliveryOtpData = laundryOtpService.generateOtp(orderNumber, 'DELIVERY');

      // Create Laundry Order transactionally
      const newLaundryOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.laundryOrder.create({
          data: {
            orderNumber,
            trackingNumber,
            qrCodeData,
            studentId,
            status: 'REQUESTED',
            estimatedPrice,
            hallName: data.hallName,
            hallNumber: data.hallNumber || null,
            roomNumber: data.roomNumber,
            pickupDate: new Date(data.pickupDate),
            preferredPickupTime: data.preferredPickupTime,
            preferredReturnTime: data.preferredReturnTime,
            specialInstructions: data.specialInstructions || null,
            items: {
              create: itemsToCreate
            },
            statusHistory: {
              create: {
                previousStatus: null,
                newStatus: 'REQUESTED',
                changedBy: 'STUDENT',
                notes: 'Laundry requested by student'
              }
            },
            otps: {
              create: [
                {
                  otpType: 'PICKUP',
                  otpHash: pickupOtpData.otpHash,
                  expiresAt: pickupOtpData.expiresAt
                },
                {
                  otpType: 'DELIVERY',
                  otpHash: deliveryOtpData.otpHash,
                  expiresAt: deliveryOtpData.expiresAt
                }
              ]
            },
            photos: data.clothPhotos && data.clothPhotos.length > 0 ? {
              create: data.clothPhotos.map((url, index) => ({
                googleDriveFileId: `photo_${orderNumber}_${index}`,
                googleDriveUrl: url,
                description: data.photos?.[index]?.description || `Garment verification photo ${index + 1}`,
                uploadedBy: 'STUDENT'
              }))
            } : undefined
          },
          include: { items: true, otps: true, photos: true }
        });

        return order;
      });

      // Generate digital receipt
      const receiptPayload = receiptService.buildReceiptData({
        orderNumber,
        orderType: 'LAUNDRY',
        student: {
          name: student.fullName,
          email: student.user.email,
          rollNumber: student.rollNumber,
          hall: student.hall?.name || data.hallName,
          room: data.roomNumber
        },
        items: itemsToCreate.map((i) => ({
          name: `${i.itemType} (Wash & Iron)`,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: i.unitPrice * i.quantity
        })),
        subtotal: estimatedPrice,
        discount: 0,
        deliveryFee: 0,
        total: estimatedPrice,
        payment: {
          method: 'CASH_ON_DELIVERY / ON_DELIVERY',
          status: 'Estimated'
        }
      });

      await prisma.receipt.create({
        data: {
          receiptNumber: receiptPayload.receiptNumber,
          laundryOrderId: newLaundryOrder.id,
          studentId,
          totalAmount: estimatedPrice,
          receiptDataJson: JSON.stringify(receiptPayload)
        }
      });

      // Dispatch notification
      emailService.sendLaundryNotification(
        student.user.email,
        orderNumber,
        'Laundry Pickup Requested',
        `Your 6-digit Pickup verification code is ${pickupOtpData.plainOtp}. Show this to the provider when they arrive.`
      );

      res.status(201).json({
        success: true,
        message: 'Laundry pickup requested successfully!',
        laundryOrder: {
          id: newLaundryOrder.id,
          orderNumber: newLaundryOrder.orderNumber,
          trackingNumber: newLaundryOrder.trackingNumber,
          qrCodeData: newLaundryOrder.qrCodeData,
          status: newLaundryOrder.status,
          estimatedPrice,
          pickupOtp: pickupOtpData.plainOtp, // Plain OTP returned strictly to authenticated student
          deliveryOtp: deliveryOtpData.plainOtp
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get student's laundry orders
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
          provider: { select: { fullName: true, mobileNumber: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        orders: orders.map((o) => ({
          ...o,
          estimatedPrice: Number(o.estimatedPrice),
          finalPrice: o.finalPrice ? Number(o.finalPrice) : null
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify Pickup OTP (Provider action)
   */
  public static async verifyPickupOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { otp } = verifyLaundryOtpSchema.parse(req.body);

      const order = await prisma.laundryOrder.findUnique({
        where: { id },
        include: { otps: true, student: { include: { user: true } } }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Laundry order not found' });
        return;
      }

      const pickupOtpRecord = order.otps.find((o) => o.otpType === 'PICKUP');
      if (!pickupOtpRecord) {
        res.status(400).json({ success: false, message: 'Pickup OTP not configured for this order' });
        return;
      }

      // Verify OTP using LaundryOtpService
      const result = laundryOtpService.verifyOtp(otp, pickupOtpRecord as any, 'PICKUP');

      if (!result.success) {
        await prisma.laundryOtp.update({
          where: { id: pickupOtpRecord.id },
          data: { attempts: { increment: 1 } }
        });
        res.status(400).json({ success: false, message: result.message });
        return;
      }

      // Mark OTP used and update status to CLOTHES_COLLECTED
      await prisma.$transaction([
        prisma.laundryOtp.update({
          where: { id: pickupOtpRecord.id },
          data: { isUsed: true }
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
                notes: 'Pickup OTP verified at student room. Clothes collected.'
              }
            }
          }
        })
      ]);

      emailService.sendLaundryNotification(
        order.student.user.email,
        order.orderNumber,
        'Clothes Collected & In Process'
      );

      res.status(200).json({
        success: true,
        message: 'Pickup OTP verified! Clothes collected successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify Delivery OTP (Provider action)
   */
  public static async verifyDeliveryOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { otp } = verifyLaundryOtpSchema.parse(req.body);

      const order = await prisma.laundryOrder.findUnique({
        where: { id },
        include: { otps: true, student: { include: { user: true } } }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Laundry order not found' });
        return;
      }

      const deliveryOtpRecord = order.otps.find((o) => o.otpType === 'DELIVERY');
      if (!deliveryOtpRecord) {
        res.status(400).json({ success: false, message: 'Delivery OTP not configured for this order' });
        return;
      }

      // Strict check: Delivery OTP must match DELIVERY type!
      const result = laundryOtpService.verifyOtp(otp, deliveryOtpRecord as any, 'DELIVERY');

      if (!result.success) {
        await prisma.laundryOtp.update({
          where: { id: deliveryOtpRecord.id },
          data: { attempts: { increment: 1 } }
        });
        res.status(400).json({ success: false, message: result.message });
        return;
      }

      // Mark used and complete order
      await prisma.$transaction([
        prisma.laundryOtp.update({
          where: { id: deliveryOtpRecord.id },
          data: { isUsed: true }
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
                notes: 'Delivery OTP verified. Clean laundry handed over to student.'
              }
            }
          }
        })
      ]);

      emailService.sendLaundryNotification(
        order.student.user.email,
        order.orderNumber,
        'Order Completed & Delivered'
      );

      res.status(200).json({
        success: true,
        message: 'Delivery OTP verified! Laundry order marked completed.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Provider logs condition notes (stains, damaged buttons)
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
   * Update laundry status (Provider or Admin)
   */
  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await prisma.laundryOrder.findUnique({ where: { id } });
      if (!order) {
        res.status(404).json({ success: false, message: 'Laundry order not found' });
        return;
      }

      await prisma.laundryOrder.update({
        where: { id },
        data: {
          status,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: status,
              changedBy: req.user?.email || 'STAFF',
              notes: notes || `Status changed to ${status}`
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: `Status updated to ${status}`
      });
    } catch (err) {
      next(err);
    }
  }
}
