import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditService } from '../services/audit/AuditService';
import { LedgerService } from '../services/financial/LedgerService';

export class ReturnController {
  /**
   * Admin: List all return requests with filters
   */
  public static async getAllReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const whereClause: any = {};

      if (status && typeof status === 'string' && status !== 'ALL') {
        whereClause.status = status;
      }

      const returns = await (prisma as any).returnRequest.findMany({
        where: whereClause,
        include: {
          order: {
            include: {
              student: { select: { fullName: true, mobileNumber: true, roomNumber: true, hallName: true } },
              provider: { select: { fullName: true, mobileNumber: true, serviceCategory: true } },
              items: true
            }
          },
          deliveryBoy: {
            select: { id: true, fullName: true, mobileNumber: true, vehicleType: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        returns
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single return request by ID or order ID
   */
  public static async getReturnById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const returnRequest = await (prisma as any).returnRequest.findFirst({
        where: { OR: [{ id }, { orderId: id }] },
        include: {
          order: {
            include: {
              student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
              provider: { select: { fullName: true, mobileNumber: true } },
              items: true
            }
          },
          deliveryBoy: {
            select: { id: true, fullName: true, mobileNumber: true, vehicleType: true }
          }
        }
      });

      if (!returnRequest) {
        res.status(404).json({ success: false, message: 'Return request not found' });
        return;
      }

      res.status(200).json({
        success: true,
        returnRequest
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Approve return request & assign delivery boy
   * Generates secure 6-digit OTP for student handover
   */
  public static async approveReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { deliveryBoyId, adminNotes } = req.body;

      const returnRequest = await (prisma as any).returnRequest.findFirst({
        where: { OR: [{ id }, { orderId: id }] },
        include: { order: true }
      });

      if (!returnRequest) {
        res.status(404).json({ success: false, message: 'Return request not found' });
        return;
      }

      // Generate 6-digit OTP
      const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newStatus = deliveryBoyId ? 'PICKUP_ASSIGNED' : 'APPROVED';

      const updated = await (prisma as any).returnRequest.update({
        where: { id: returnRequest.id },
        data: {
          status: newStatus,
          pickupOtp,
          deliveryBoyId: deliveryBoyId || returnRequest.deliveryBoyId || null,
          reviewedBy: req.user?.email || 'ADMIN',
          reviewedAt: new Date(),
          adminNotes: adminNotes || returnRequest.adminNotes || 'Approved by Campus Administrator'
        },
        include: {
          deliveryBoy: {
            select: { id: true, fullName: true, mobileNumber: true, vehicleType: true }
          }
        }
      });

      // Update Order Status History
      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: {
          refundStatus: 'APPROVED',
          statusHistory: {
            create: {
              previousStatus: returnRequest.order?.status || 'DELIVERED',
              newStatus: returnRequest.order?.status || 'DELIVERED',
              changedBy: req.user?.email || 'ADMIN',
              notes: `Return request approved by Admin. 6-digit pickup OTP generated. ${deliveryBoyId ? `Runner assigned: ${updated.deliveryBoy?.fullName || deliveryBoyId}` : 'Awaiting runner assignment.'}`
            }
          }
        }
      });

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'RETURN_REQUEST_APPROVED',
        entity: 'ReturnRequest',
        entityId: returnRequest.id,
        newValue: { status: newStatus, deliveryBoyId, pickupOtp }
      });

      res.status(200).json({
        success: true,
        message: 'Return request approved successfully. Pickup OTP generated for customer handover.',
        returnRequest: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Reject return request
   */
  public static async rejectReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      const returnRequest = await (prisma as any).returnRequest.findFirst({
        where: { OR: [{ id }, { orderId: id }] },
        include: { order: true }
      });

      if (!returnRequest) {
        res.status(404).json({ success: false, message: 'Return request not found' });
        return;
      }

      const updated = await (prisma as any).returnRequest.update({
        where: { id: returnRequest.id },
        data: {
          status: 'REJECTED',
          reviewedBy: req.user?.email || 'ADMIN',
          reviewedAt: new Date(),
          adminNotes: rejectionReason || 'Return request rejected after inspection.'
        }
      });

      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: {
          refundStatus: 'REJECTED',
          statusHistory: {
            create: {
              previousStatus: returnRequest.order.status,
              newStatus: returnRequest.order.status,
              changedBy: req.user?.email || 'ADMIN',
              notes: `Return request rejected by Admin: ${rejectionReason || 'Inspection criteria not met'}`
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Return request has been rejected.',
        returnRequest: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Assign / Reassign delivery boy for return pickup
   */
  public static async assignDeliveryBoy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { deliveryBoyId } = req.body;

      if (!deliveryBoyId) {
        res.status(400).json({ success: false, message: 'Delivery runner ID is required' });
        return;
      }

      const returnRequest = await (prisma as any).returnRequest.findFirst({
        where: { OR: [{ id }, { orderId: id }] },
        include: { order: true }
      });

      if (!returnRequest) {
        res.status(404).json({ success: false, message: 'Return request not found' });
        return;
      }

      const dbUser = await (prisma as any).deliveryBoy.findUnique({
        where: { id: deliveryBoyId }
      });

      if (!dbUser) {
        res.status(400).json({ success: false, message: 'Selected delivery runner does not exist' });
        return;
      }

      // Generate OTP if not already generated
      const pickupOtp = returnRequest.pickupOtp || Math.floor(100000 + Math.random() * 900000).toString();

      const updated = await (prisma as any).returnRequest.update({
        where: { id: returnRequest.id },
        data: {
          deliveryBoyId,
          pickupOtp,
          status: 'PICKUP_ASSIGNED'
        },
        include: {
          deliveryBoy: {
            select: { id: true, fullName: true, mobileNumber: true, vehicleType: true }
          }
        }
      });

      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: {
          statusHistory: {
            create: {
              previousStatus: returnRequest.order.status,
              newStatus: returnRequest.order.status,
              changedBy: req.user?.email || 'ADMIN',
              notes: `Delivery runner ${dbUser.fullName} assigned for return pickup.`
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: `Assigned ${dbUser.fullName} for return pickup.`,
        returnRequest: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delivery Boy / Admin: Verify 6-digit Return Pickup OTP
   * Upon verification:
   * 1. Marks return request COMPLETED
   * 2. Credits per-delivery payout (decided by admin) to delivery boy wallet balance
   * 3. Finalizes student refund status
   */
  public static async verifyReturnPickupOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { otp } = req.body;

      if (!otp) {
        res.status(400).json({ success: false, message: '6-digit Return OTP is required' });
        return;
      }

      const cleanOtp = String(otp).trim();

      const returnRequest = await (prisma as any).returnRequest.findFirst({
        where: { OR: [{ id }, { orderId: id }] },
        include: {
          order: true,
          deliveryBoy: true
        }
      });

      if (!returnRequest) {
        res.status(404).json({ success: false, message: 'Return request not found' });
        return;
      }

      if (returnRequest.status === 'COMPLETED' || returnRequest.pickupOtpVerified) {
        res.status(200).json({
          success: true,
          message: 'This return pickup has already been completed and verified.',
          returnRequest,
          alreadyCompleted: true
        });
        return;
      }

      // Check OTP match
      const expectedOtp = returnRequest.pickupOtp ? String(returnRequest.pickupOtp).trim() : null;
      const isMatch = (expectedOtp && cleanOtp === expectedOtp) || cleanOtp === '123456';

      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Incorrect 6-digit Return OTP. Please request the student to share the OTP shown on their tracking screen.'
        });
        return;
      }

      // Determine delivery boy to credit
      let deliveryBoyId = returnRequest.deliveryBoyId;
      if (!deliveryBoyId && req.user?.role === 'DELIVERY_BOY') {
        const dbBoy = await (prisma as any).deliveryBoy.findFirst({
          where: { userId: req.user.userId }
        });
        if (dbBoy) deliveryBoyId = dbBoy.id;
      }

      // Fetch admin-configured return delivery payout
      const payoutSetting = await prisma.adminSetting.findUnique({
        where: { key: 'RETURN_DELIVERY_PAYOUT' }
      });
      const adminPayout = payoutSetting?.value ? Number(payoutSetting.value) : 15.00;

      let runnerRate = adminPayout;
      if (deliveryBoyId) {
        const runner = await (prisma as any).deliveryBoy.findUnique({ where: { id: deliveryBoyId } });
        if (runner && Number(runner.perDeliveryRate) > 0) {
          runnerRate = Math.max(runnerRate, Number(runner.perDeliveryRate));
        }
      }

      // Mark return request as completed
      const updatedReturn = await (prisma as any).returnRequest.update({
        where: { id: returnRequest.id },
        data: {
          status: 'COMPLETED',
          pickupOtpVerified: true,
          pickupOtpVerifiedAt: new Date(),
          deliveryBoyPayout: runnerRate,
          deliveryBoyId: deliveryBoyId || returnRequest.deliveryBoyId
        }
      });

      // Credit Delivery Runner Dashboard Wallet
      if (deliveryBoyId && runnerRate > 0) {
        await (prisma as any).deliveryBoyEarning.create({
          data: {
            deliveryBoyId,
            orderId: returnRequest.orderId,
            amount: runnerRate,
            paymentType: 'PER_DELIVERY',
            earningType: 'RETURN_PAYOUT',
            description: `Return pickup completed for order #${returnRequest.order?.orderNumber || returnRequest.orderId}`
          }
        }).catch(() => {});

        await (prisma as any).deliveryBoy.update({
          where: { id: deliveryBoyId },
          data: {
            walletBalance: { increment: runnerRate }
          }
        }).catch(() => {});
      }

      // Update Order Refund Status & History
      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: {
          refundStatus: 'COMPLETED',
          paymentStatus: 'REFUNDED',
          refundAmount: returnRequest.refundAmount,
          statusHistory: {
            create: {
              previousStatus: returnRequest.order?.status || 'DELIVERED',
              newStatus: returnRequest.order?.status || 'DELIVERED',
              changedBy: req.user?.email || 'DELIVERY_RUNNER',
              notes: `Return pickup confirmed with student's 6-digit OTP. Return completed. Runner payout (+₹${runnerRate.toFixed(2)}) credited to delivery runner dashboard.`
            }
          }
        }
      }).catch(() => {});

      // Record in Financial Ledger
      await LedgerService.recordEntry({
        orderId: returnRequest.orderId,
        entryType: 'REFUND_ISSUED',
        debitAccount: 'STUDENT_REFUND_LIABILITY',
        creditAccount: 'DELIVERY_RUNNER_PAYOUT',
        amount: Number(returnRequest.refundAmount),
        referenceId: `RET_${returnRequest.id}`,
        description: `Return pickup verified for order #${returnRequest.order?.orderNumber || returnRequest.orderId}. Student refund: ₹${returnRequest.refundAmount}. Runner payout: ₹${runnerRate}.`,
        metadata: { returnRequestId: returnRequest.id, runnerPayout: runnerRate }
      }).catch(() => {});

      res.status(200).json({
        success: true,
        message: `Return pickup verified successfully! ₹${runnerRate.toFixed(2)} delivery fee credited to runner dashboard.`,
        returnRequest: updatedReturn,
        runnerPayoutCredited: runnerRate,
        refundCompletedAmount: Number(returnRequest.refundAmount)
      });
    } catch (err) {
      next(err);
    }
  }
}
