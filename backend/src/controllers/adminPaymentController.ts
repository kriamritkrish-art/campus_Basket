import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { LedgerService } from '../services/financial/LedgerService';
import { SettlementService } from '../services/financial/SettlementService';
import { RefundService } from '../services/financial/RefundService';
import { AuditService } from '../services/audit/AuditService';
import { DeliverySettlementPdfService } from '../services/pdf/DeliverySettlementPdfService';
import { GrossVolumePdfService, LedgerPdfRow, LedgerPdfData } from '../services/pdf/GrossVolumePdfService';
import { PaymentReconciliationService } from '../services/payment/PaymentReconciliationService';


export class AdminPaymentController {
  /**
   * Section 1: Financial & Operations Overview + Action Center
   */
  public static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await (prisma as any).order.findMany();
      const codCollections = await (prisma as any).cODCollection.findMany();
      const settlements = await (prisma as any).settlement.findMany();

      let totalGrossVolume = 0;
      let totalOnlinePayments = 0;
      let totalCodCollected = 0;
      let totalCommissionEarned = 0;
      let pendingSettlementsAmount = 0;
      let settledPayoutsAmount = 0;
      let pendingRefundsCount = 0;
      let pendingRefundsAmount = 0;
      let completedRefundsCount = 0;
      let completedRefundsAmount = 0;
      let codMismatchCount = 0;

      for (const o of orders) {
        const amt = Number(o.totalAmount) || 0;
        totalGrossVolume += amt;

        if (o.paymentMethod === 'CASH_ON_DELIVERY') {
          if (o.paymentStatus === 'COD_COLLECTED' || o.paymentStatus === 'SUCCESS') {
            totalCodCollected += amt;
          }
        } else {
          if (['PAID', 'SUCCESS', 'DELIVERED'].includes(o.paymentStatus)) {
            totalOnlinePayments += amt;
          }
        }

        const commAmt = Number(o.commissionAmount) || Math.round(amt * 0.05 * 100) / 100;
        totalCommissionEarned += commAmt;

        if (['REQUESTED', 'PENDING_ADMIN_REVIEW', 'REFUND_PENDING', 'PROCESSING'].includes(o.refundStatus) || o.paymentStatus === 'REFUND_PENDING') {
          pendingRefundsCount++;
          pendingRefundsAmount += amt;
        } else if (o.refundStatus === 'COMPLETED' || o.paymentStatus === 'REFUNDED') {
          completedRefundsCount++;
          completedRefundsAmount += amt;
        }
      }

      for (const s of settlements) {
        const net = Number(s.netPayable) || 0;
        if (s.status === 'SETTLED') {
          settledPayoutsAmount += net;
        } else if (['PENDING', 'PROCESSING'].includes(s.status)) {
          pendingSettlementsAmount += net;
        }
      }

      for (const c of codCollections) {
        if (c.reconciliationStatus === 'MISMATCH' || Number(c.difference) !== 0) {
          codMismatchCount++;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalGrossVolume: Math.round(totalGrossVolume * 100) / 100,
            totalOnlinePayments: Math.round(totalOnlinePayments * 100) / 100,
            totalCodCollected: Math.round(totalCodCollected * 100) / 100,
            totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
            pendingSettlementsAmount: Math.round(pendingSettlementsAmount * 100) / 100,
            settledPayoutsAmount: Math.round(settledPayoutsAmount * 100) / 100,
            pendingRefundsCount,
            pendingRefundsAmount: Math.round(pendingRefundsAmount * 100) / 100,
            completedRefundsCount,
            completedRefundsAmount: Math.round(completedRefundsAmount * 100) / 100,
            totalOrdersCount: orders.length
          },
          actionCenter: {
            pendingRefunds: pendingRefundsCount,
            pendingSettlements: settlements.filter((s: any) => s.status === 'PENDING').length,
            codMismatches: codMismatchCount,
            flaggedDisputes: 0
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 2: Unified Transactions with Multi-Dimensional Statuses
   */
  public static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { serviceType, paymentStatus, refundStatus, settlementStatus, paymentMethod, search } = req.query;

      let orders = await (prisma as any).order.findMany({
        orderBy: { createdAt: 'desc' }
      });

      if (serviceType && serviceType !== 'ALL') {
        orders = orders.filter((o: any) => (o.serviceType || 'FOOD') === serviceType);
      }
      if (paymentStatus && paymentStatus !== 'ALL') {
        orders = orders.filter((o: any) => o.paymentStatus === paymentStatus);
      }
      if (refundStatus && refundStatus !== 'ALL') {
        orders = orders.filter((o: any) => (o.refundStatus || 'NOT_APPLICABLE') === refundStatus);
      }
      if (settlementStatus && settlementStatus !== 'ALL') {
        orders = orders.filter((o: any) => (o.settlementStatus || 'PENDING') === settlementStatus);
      }
      if (paymentMethod && paymentMethod !== 'ALL') {
        orders = orders.filter((o: any) => o.paymentMethod === paymentMethod);
      }
      if (search && typeof search === 'string' && search.trim().length > 0) {
        const query = search.trim().toLowerCase();
        orders = orders.filter((o: any) =>
          o.orderNumber?.toLowerCase().includes(query) ||
          o.student?.fullName?.toLowerCase().includes(query) ||
          o.provider?.fullName?.toLowerCase().includes(query) ||
          o.hallName?.toLowerCase().includes(query)
        );
      }

      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 3: Refunds Management & Disbursement
   */
  public static async getRefunds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      let orders = await (prisma as any).order.findMany({
        where: {
          refundStatus: { in: ['REQUESTED', 'PENDING_ADMIN_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED'] }
        },
        include: {
          refunds: true,
          student: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (status && status !== 'ALL') {
        orders = orders.filter((o: any) => o.refundStatus === status);
      }

      // Attach student refund account info if available
      const results = await Promise.all(
        orders.map(async (o: any) => {
          let refundAccount = null;
          if (o.studentId) {
            refundAccount = await (prisma as any).refundAccount.findFirst({
              where: { studentId: o.studentId }
            });
          }

          const primaryRefund = o.refunds && o.refunds.length > 0 ? o.refunds[0] : null;
          const calculatedRefundAmount = Number(o.refundAmount || primaryRefund?.amount || o.totalAmount);
          const refundReasonDisplay = primaryRefund?.reason || o.cancellationReason || 'Cancelled before provider acceptance';

          return {
            ...o,
            refundAmount: calculatedRefundAmount,
            cancellationReason: refundReasonDisplay,
            refundAccount: refundAccount ? {
              accountType: refundAccount.accountType,
              accountHolderName: refundAccount.accountHolderName,
              bankName: refundAccount.bankName,
              accountNumberMasked: refundAccount.accountNumberMasked,
              ifscCode: refundAccount.ifscCode,
              upiIdMasked: refundAccount.upiIdMasked,
              isVerified: refundAccount.isVerified
            } : null
          };
        })
      );

      res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Action: Process / Approve a Refund
   */
  public static async processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, amount, notes } = req.body;
      const adminUserId = (req as any).user?.id || 'admin_user';

      if (!orderId) {
        res.status(400).json({ success: false, message: 'Order ID is required' });
        return;
      }

      const updated = await RefundService.processRefund(orderId, adminUserId, amount, notes);
      res.status(200).json({
        success: true,
        message: 'Refund successfully processed and recognized in financial ledger.',
        data: updated
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Section 4: Provider Settlements
   */
  public static async getSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerId, status } = req.query;
      let settlements = await (prisma as any).settlement.findMany({
        orderBy: { createdAt: 'desc' }
      });

      if (providerId && providerId !== 'ALL') {
        settlements = settlements.filter((s: any) => s.providerId === providerId);
      }
      if (status && status !== 'ALL') {
        settlements = settlements.filter((s: any) => s.status === status);
      }

      res.status(200).json({
        success: true,
        count: settlements.length,
        data: settlements
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Action: Generate Settlement Batch for a Provider
   */
  public static async generateSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerId, periodStart, periodEnd, notes } = req.body;
      if (!providerId) {
        res.status(400).json({ success: false, message: 'Provider ID is required' });
        return;
      }

      const start = periodStart ? new Date(periodStart) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const end = periodEnd ? new Date(periodEnd) : new Date();

      const settlement = await SettlementService.generateSettlement(providerId, start, end, notes);
      res.status(201).json({
        success: true,
        message: 'Settlement batch generated successfully.',
        data: settlement
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Action: Disburse / Complete Settlement
   */
  public static async disburseSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { settlementId, payoutReference, notes } = req.body;
      if (!settlementId || !payoutReference) {
        res.status(400).json({ success: false, message: 'Settlement ID and Payout Reference are required' });
        return;
      }

      const updated = await SettlementService.disburseSettlement(settlementId, payoutReference, notes);
      res.status(200).json({
        success: true,
        message: 'Settlement successfully disbursed and logged to financial ledger.',
        data: updated
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Section 5: COD Collections & Runner Reconciliation
   */
  public static async getCodReconciliation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      let collections = await (prisma as any).cODCollection.findMany({
        include: {
          order: {
            include: {
              student: { select: { fullName: true, mobileNumber: true, roomNumber: true } }
            }
          },
          deliveryBoy: {
            select: { id: true, fullName: true, mobileNumber: true, vehicleType: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (status && status !== 'ALL') {
        collections = collections.filter((c: any) => c.reconciliationStatus === status);
      }

      res.status(200).json({
        success: true,
        count: collections.length,
        data: collections
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Action: Reconcile COD Collection
   */
  public static async reconcileCod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { collectionId, reconciliationStatus, notes, amountCollected } = req.body;
      if (!collectionId) {
        res.status(400).json({ success: false, message: 'Collection ID is required' });
        return;
      }

      const existing = await (prisma as any).cODCollection.findUnique({
        where: { id: collectionId }
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Collection not found' });
        return;
      }

      const expected = Number(existing.amountExpected);
      const collected = amountCollected !== undefined ? Number(amountCollected) : Number(existing.amountCollected);
      const diff = Math.round((collected - expected) * 100) / 100;

      const updated = await (prisma as any).cODCollection.update({
        where: { id: collectionId },
        data: {
          amountCollected: collected,
          difference: diff,
          collectionStatus: 'HANDED_OVER',
          reconciliationStatus: reconciliationStatus || (diff === 0 ? 'RECONCILED' : 'MISMATCH'),
          reconciliationNotes: notes || existing.reconciliationNotes,
          updatedAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        message: 'COD collection successfully reconciled.',
        data: updated
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Section 6: Double-Entry Immutable Financial Ledger
   */
  public static async getFinancialLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entryType, orderId, settlementId } = req.query;
      const entries = await LedgerService.getEntries({
        entryType: typeof entryType === 'string' && entryType !== 'ALL' ? entryType : undefined,
        orderId: typeof orderId === 'string' ? orderId : undefined,
        settlementId: typeof settlementId === 'string' ? settlementId : undefined
      });

      res.status(200).json({
        success: true,
        count: entries.length,
        data: entries
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin Status Override with Mandatory Justification
   */
  public static async overrideStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, statusType, newStatus, reason, notes } = req.body;
      const adminUserId = (req as any).user?.id || 'admin_user';

      if (!orderId || !statusType || !newStatus || !reason || reason.trim().length < 5) {
        res.status(400).json({
          success: false,
          message: 'Order ID, Status Type, New Status, and a detailed Reason (min 5 characters) are required.'
        });
        return;
      }

      const order = await (prisma as any).order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      let previousStatus = '';
      const updateData: any = {};

      if (statusType === 'ORDER') {
        previousStatus = order.status;
        updateData.status = newStatus;
      } else if (statusType === 'PAYMENT') {
        previousStatus = order.paymentStatus;
        updateData.paymentStatus = newStatus;
      } else if (statusType === 'REFUND') {
        previousStatus = order.refundStatus || 'NOT_APPLICABLE';
        updateData.refundStatus = newStatus;
      } else if (statusType === 'SETTLEMENT') {
        previousStatus = order.settlementStatus || 'PENDING';
        updateData.settlementStatus = newStatus;
      }

      const updated = await (prisma as any).order.update({
        where: { id: orderId },
        data: updateData
      });

      // Record Override Audit Log
      await (prisma as any).adminStatusOverride.create({
        data: {
          orderId,
          adminUserId,
          previousStatus,
          newStatus,
          statusType,
          reason: reason.trim(),
          notes: notes ? notes.trim() : null
        }
      });

      // System Audit Log
      await AuditService.log(prisma, {
        userId: adminUserId,
        action: `ADMIN_STATUS_OVERRIDE_${statusType}`,
        entity: 'Order',
        entityId: orderId,
        oldValue: { statusType, previousStatus },
        newValue: { statusType, newStatus, reason },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: `Order ${statusType} status overridden from ${previousStatus} to ${newStatus}.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Filtered Export (CSV / Data format) with Matching Summary Totals
   */
  public static async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, serviceType, paymentStatus, refundStatus } = req.query;

      let orders = await (prisma as any).order.findMany({
        orderBy: { createdAt: 'desc' }
      });

      if (serviceType && serviceType !== 'ALL') {
        orders = orders.filter((o: any) => (o.serviceType || 'FOOD') === serviceType);
      }
      if (paymentStatus && paymentStatus !== 'ALL') {
        orders = orders.filter((o: any) => o.paymentStatus === paymentStatus);
      }
      if (refundStatus && refundStatus !== 'ALL') {
        orders = orders.filter((o: any) => (o.refundStatus || 'NOT_APPLICABLE') === refundStatus);
      }

      if (type === 'csv') {
        let csv = 'Order ID,Date,Service,Student,Provider,Gross Total,Payment Method,Payment Status,Refund Status,Settlement Status,Commission,Provider Net\n';
        for (const o of orders) {
          csv += `"${o.orderNumber}","${new Date(o.createdAt).toISOString().slice(0, 10)}","${o.serviceType || 'FOOD'}","${o.student?.fullName || ''}","${o.provider?.fullName || ''}",${o.totalAmount},"${o.paymentMethod}","${o.paymentStatus}","${o.refundStatus || 'N/A'}","${o.settlementStatus || 'PENDING'}",${o.commissionAmount || 0},${o.providerPayable || 0}\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=campus_basket_financial_export_${Date.now()}.csv`);
        res.send(csv);
        return;
      }

      res.status(200).json({
        success: true,
        summaryTotals: {
          count: orders.length,
          totalAmount: Math.round(orders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0) * 100) / 100,
          totalCommission: Math.round(orders.reduce((sum: number, o: any) => sum + (Number(o.commissionAmount) || 0), 0) * 100) / 100,
          totalProviderPayable: Math.round(orders.reduce((sum: number, o: any) => sum + (Number(o.providerPayable) || 0), 0) * 100) / 100
        },
        data: orders
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 7: Delivery Fleet Settlement Management (Runner Payouts)
   */
  public static async getDeliverySettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, deliveryBoyId, search } = req.query;

      let withdrawals: any[] = [];
      try {
        withdrawals = await (prisma as any).deliveryBoyWithdrawal.findMany({
          orderBy: { createdAt: 'desc' }
        });
      } catch (e) {
        withdrawals = [];
      }

      let deliveryBoys: any[] = [];
      try {
        deliveryBoys = await (prisma as any).deliveryBoy.findMany({
          include: {
            user: {
              select: { email: true, username: true }
            }
          }
        });
      } catch (e) {
        deliveryBoys = [];
      }
      const boyMap = new Map(deliveryBoys.map((b: any) => [b.id, b]));

      // Filter by runner if specified
      if (deliveryBoyId && deliveryBoyId !== 'ALL') {
        withdrawals = withdrawals.filter((w: any) => w.deliveryBoyId === deliveryBoyId);
      }

      // Filter by status if specified
      if (status && status !== 'ALL') {
        withdrawals = withdrawals.filter((w: any) => w.status === status);
      }

      // Filter by search query (runner name, mobile, withdrawal number, utr)
      if (search) {
        const query = String(search).toLowerCase();
        withdrawals = withdrawals.filter((w: any) => {
          const boy = boyMap.get(w.deliveryBoyId) as any;
          const boyName = (boy?.fullName || '').toLowerCase();
          const boyMobile = (boy?.mobileNumber || '').toLowerCase();
          const boyEmail = (boy?.user?.email || boy?.email || '').toLowerCase();
          const num = (w.withdrawalNumber || '').toLowerCase();
          const utr = (w.utrReference || '').toLowerCase();
          return boyName.includes(query) || boyMobile.includes(query) || boyEmail.includes(query) || num.includes(query) || utr.includes(query);
        });
      }

      // Attach deliveryBoy info to each withdrawal (fall back to parsed account details if runner record is unlinked)
      const enrichedWithdrawals = withdrawals.map((w: any) => {
        const boy = boyMap.get(w.deliveryBoyId) as any;
        let fallbackName = 'Fleet Runner';
        try {
          if (w.accountDetails) {
            const parsed = typeof w.accountDetails === 'string' ? JSON.parse(w.accountDetails) : w.accountDetails;
            if (parsed?.accountHolderName) fallbackName = parsed.accountHolderName;
          }
        } catch {}

        return {
          ...w,
          deliveryBoy: boy
            ? {
                id: boy.id,
                fullName: boy.fullName,
                mobileNumber: boy.mobileNumber,
                email: boy.user?.email || boy.email || '',
                walletBalance: Number(boy.walletBalance) || 0,
                totalSettled: Number(boy.totalSettled) || 0,
                paymentType: boy.paymentType
              }
            : {
                id: w.deliveryBoyId,
                fullName: fallbackName,
                mobileNumber: '',
                email: '',
                walletBalance: 0,
                totalSettled: 0
              }
        };
      });

      // Calculate overview metrics across all withdrawals
      let allWithdrawals: any[] = [];
      try {
        allWithdrawals = await (prisma as any).deliveryBoyWithdrawal.findMany();
      } catch (e) {
        allWithdrawals = [...withdrawals];
      }

      const totalPendingAmount = allWithdrawals
        .filter((w: any) => w.status === 'PENDING')
        .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);
      const totalApprovedAmount = allWithdrawals
        .filter((w: any) => w.status === 'APPROVED')
        .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);
      const totalDistributedAmount = allWithdrawals
        .filter((w: any) => w.status === 'DISTRIBUTED')
        .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);

      const totalFleetSettled = deliveryBoys.reduce((sum: number, b: any) => sum + (Number(b.totalSettled) || 0), 0);
      const totalFleetPendingBalance = deliveryBoys.reduce((sum: number, b: any) => sum + (Number(b.walletBalance) || 0), 0);

      res.status(200).json({
        success: true,
        summary: {
          totalPendingAmount,
          totalApprovedAmount,
          totalDistributedAmount,
          totalFleetSettled,
          totalFleetPendingBalance,
          count: enrichedWithdrawals.length
        },
        deliveryBoys: deliveryBoys.map((b: any) => ({
          id: b.id,
          fullName: b.fullName,
          mobileNumber: b.mobileNumber,
          email: b.user?.email || b.email || '',
          walletBalance: Number(b.walletBalance) || 0,
          totalSettled: Number(b.totalSettled) || 0
        })),
        data: enrichedWithdrawals
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Settle / Disburse Delivery Boy Withdrawal (APPROVE, DISTRIBUTE, REJECT)
   * When action is 'DISTRIBUTE':
   * - Marks withdrawal status as 'DISTRIBUTED' with UTR reference number
   * - Deducts withdrawal amount from runner's walletBalance (setting to 0 if full balance)
   * - Adds withdrawal amount to runner's totalSettled ("Already Settled")
   */
  public static async disburseDeliverySettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const withdrawalId = req.params.id || req.body.withdrawalId;
      const { action, status, utrReference, adminNotes } = req.body;
      const targetAction = (action || status || '').toUpperCase();

      if (!withdrawalId) {
        res.status(400).json({ success: false, message: 'Withdrawal ID is required' });
        return;
      }

      const withdrawal = await (prisma as any).deliveryBoyWithdrawal.findUnique({
        where: { id: withdrawalId }
      });

      if (!withdrawal) {
        res.status(404).json({ success: false, message: 'Withdrawal record not found' });
        return;
      }

      const withdrawalAmount = Number(withdrawal.amount) || 0;
      const runnerId = withdrawal.deliveryBoyId;
      const runner = await (prisma as any).deliveryBoy.findUnique({
        where: { id: runnerId }
      });

      if (targetAction === 'APPROVE') {
        const updated = await (prisma as any).deliveryBoyWithdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            adminNotes: adminNotes || withdrawal.adminNotes,
            processedBy: (req as any).user?.userId || 'admin'
          }
        });

        await AuditService.log(prisma, {
          userId: (req as any).user?.userId,
          action: 'DELIVERY_WITHDRAWAL_APPROVED',
          entity: 'DeliveryBoyWithdrawal',
          entityId: withdrawalId,
          newValue: { amount: withdrawalAmount, runnerId }
        });

        res.status(200).json({
          success: true,
          message: `Withdrawal ${withdrawal.withdrawalNumber} approved for ₹${withdrawalAmount}. Ready for disbursement.`,
          withdrawal: updated
        });
        return;
      }

      if (targetAction === 'DISTRIBUTE') {
        if (withdrawal.status === 'DISTRIBUTED') {
          res.status(400).json({
            success: false,
            message: 'This withdrawal has already been distributed and settled.'
          });
          return;
        }

        const effectiveUtr = utrReference || `UTR-${Date.now().toString().slice(-8)}`;

        const updated = await (prisma as any).deliveryBoyWithdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'DISTRIBUTED',
            distributedAt: new Date(),
            utrReference: effectiveUtr,
            adminNotes: adminNotes || withdrawal.adminNotes,
            processedBy: (req as any).user?.userId || 'admin'
          }
        });

        // Deduct from runner's wallet balance (setting to 0 if all withdrawn) and credit to totalSettled
        let newBalance = 0;
        let newSettled = 0;
        if (runner) {
          const currentBalance = Number(runner.walletBalance) || 0;
          const currentSettled = Number(runner.totalSettled) || 0;
          newBalance = Math.max(0, currentBalance - withdrawalAmount);
          newSettled = currentSettled + withdrawalAmount;

          await (prisma as any).deliveryBoy.update({
            where: { id: runnerId },
            data: {
              walletBalance: newBalance,
              totalSettled: newSettled
            }
          });
        }

        await AuditService.log(prisma, {
          userId: (req as any).user?.userId,
          action: 'DELIVERY_WITHDRAWAL_DISTRIBUTED',
          entity: 'DeliveryBoyWithdrawal',
          entityId: withdrawalId,
          newValue: {
            amount: withdrawalAmount,
            runnerId,
            utrReference: effectiveUtr,
            newWalletBalance: newBalance,
            newTotalSettled: newSettled
          }
        });

        res.status(200).json({
          success: true,
          message: `Payout of ₹${withdrawalAmount} distributed successfully with UTR: ${effectiveUtr}. Runner balance updated: ₹${newBalance}, Total Settled: ₹${newSettled}.`,
          withdrawal: updated,
          runnerBalances: {
            walletBalance: newBalance,
            totalSettled: newSettled
          }
        });
        return;
      }

      if (targetAction === 'REJECT') {
        const updated = await (prisma as any).deliveryBoyWithdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            adminNotes: adminNotes || 'Rejected by administrator',
            processedBy: (req as any).user?.userId || 'admin'
          }
        });

        await AuditService.log(prisma, {
          userId: (req as any).user?.userId,
          action: 'DELIVERY_WITHDRAWAL_REJECTED',
          entity: 'DeliveryBoyWithdrawal',
          entityId: withdrawalId,
          newValue: { amount: withdrawalAmount, runnerId, reason: adminNotes }
        });

        res.status(200).json({
          success: true,
          message: `Withdrawal ${withdrawal.withdrawalNumber} rejected.`,
          withdrawal: updated
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: `Invalid action '${targetAction}'. Must be APPROVE, DISTRIBUTE, or REJECT.`
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 8: Download Settlement Report PDF (Delivery Boy Wise or Fleet Wide, with Monthly/Daily/Custom filters)
   */
  public static async downloadDeliverySettlementsPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deliveryBoyId, filterType, month, year, startDate, endDate, status } = req.query;

      let withdrawals = await (prisma as any).deliveryBoyWithdrawal.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const deliveryBoys = await (prisma as any).deliveryBoy.findMany();
      const boyMap = new Map(deliveryBoys.map((b: any) => [b.id, b]));

      // Filter by runner if requested
      let targetRunner: any = null;
      if (deliveryBoyId && deliveryBoyId !== 'ALL') {
        targetRunner = boyMap.get(deliveryBoyId as string);
        withdrawals = withdrawals.filter((w: any) => w.deliveryBoyId === deliveryBoyId);
      }

      // Filter by status if specified
      if (status && status !== 'ALL') {
        withdrawals = withdrawals.filter((w: any) => w.status === status);
      }

      // Filter by time horizon: MONTHLY, DAILY, or CUSTOM
      let filterLabel = 'All Time Disbursals';
      const now = new Date();
      const targetYear = year ? Number(year) : now.getFullYear();

      if (filterType === 'MONTHLY') {
        const targetMonth = month ? Number(month) : now.getMonth() + 1;
        withdrawals = withdrawals.filter((w: any) => {
          const d = new Date(w.requestedAt);
          return d.getFullYear() === targetYear && d.getMonth() + 1 === targetMonth;
        });
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        filterLabel = `${monthNames[targetMonth - 1]} ${targetYear} Disbursal Statement`;
      } else if (filterType === 'DAILY') {
        const dayString = (startDate as string) || now.toISOString().slice(0, 10);
        withdrawals = withdrawals.filter((w: any) => {
          const d = new Date(w.requestedAt).toISOString().slice(0, 10);
          return d === dayString;
        });
        filterLabel = `Daily Statement (${dayString})`;
      } else if (filterType === 'CUSTOM' && startDate && endDate) {
        const start = new Date(startDate as string).getTime();
        const end = new Date(endDate as string).getTime();
        withdrawals = withdrawals.filter((w: any) => {
          const t = new Date(w.requestedAt).getTime();
          return t >= start && t <= end;
        });
        filterLabel = `Custom Range (${startDate} to ${endDate})`;
      }

      const totalDisbursed = withdrawals
        .filter((w: any) => w.status === 'DISTRIBUTED')
        .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);
      const totalPending = withdrawals
        .filter((w: any) => w.status === 'PENDING' || w.status === 'APPROVED')
        .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);

      const rows = withdrawals.map((w: any) => {
        const boy = boyMap.get(w.deliveryBoyId) as any;
        let dest = 'UPI / Bank';
        try {
          if (w.accountDetails) {
            const parsed = JSON.parse(w.accountDetails);
            dest = parsed.accountType === 'UPI' ? `UPI: ${parsed.upiId}` : `${parsed.bankName || 'Bank'} (${parsed.accountNumber || ''})`;
          }
        } catch {}

        return {
          date: new Date(w.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          runnerName: boy?.fullName || 'Fleet Partner',
          runnerMobile: boy?.mobileNumber || 'N/A',
          paymentType: boy?.paymentType || 'PER_DELIVERY',
          referenceId: w.withdrawalNumber,
          amount: Number(w.amount),
          payoutMethod: w.payoutMethod,
          destination: dest,
          utrReference: w.utrReference,
          status: w.status
        };
      });

      const pdfBuffer = await DeliverySettlementPdfService.generatePdf({
        reportTitle: targetRunner
          ? `Settlement Statement: ${targetRunner.fullName}`
          : 'Fleet-Wide Delivery Settlement Report',
        runnerScope: targetRunner ? `${targetRunner.fullName} (${targetRunner.mobileNumber})` : 'All Delivery Boys (Campus Fleet)',
        dateRangeText: filterLabel,
        generatedBy: (req as any).user?.fullName || 'Institutional Administration',
        generatedAt: new Date(),
        metrics: {
          totalEarned: totalDisbursed + totalPending,
          totalSettled: totalDisbursed,
          pendingAmount: totalPending,
          totalTransactions: withdrawals.length
        },
        settlements: rows
      });

      const safeName = targetRunner ? targetRunner.fullName.replace(/\s+/g, '_') : 'Fleet';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="CampusBasket-Settlements-${safeName}-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Internal Calculation Engine for Order Payment & Settlement Ledger
   * Complete order-wise financial tracing:
   * Student -> Order -> Provider -> Delivery Boy -> Payment -> COD Advance -> COD Cash -> Cancellation/Return -> Refund Claim -> Refund Distributed -> Final Campus Basket Earning.
   * EXCLUDES INSTITUTION FEE COMPLETELY.
   */
  public static async computeGrossVolumeData(query: any) {
    const {
      startDate,
      endDate,
      serviceType,
      paymentMethod,
      paymentStatus,
      refundStatus,
      orderStatus,
      providerId,
      deliveryBoyId,
      search,
      sortBy
    } = query;

    let rawOrders: any[] = [];
    try {
      rawOrders = await (prisma as any).order.findMany({
        include: {
          student: { include: { user: true } },
          items: true,
          provider: true,
          deliveryBoy: true,
          payment: {
            include: {
              transactions: {
                orderBy: { createdAt: 'asc' }
              }
            }
          },
          returnRequest: true,
          cancellationRequest: true,
          refunds: true,
          codCollection: true,
          settlementItem: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      console.warn('[Ledger] DB query failed, falling back to cached/fallback orders:', e);
      try {
        const { fallbackOrders } = await import('../services/fallbackData');
        rawOrders = fallbackOrders;
      } catch (err) {
        rawOrders = [];
      }
    }

    // Map each order into the Order Payment & Settlement Ledger format
    const allMappedOrders = rawOrders.map((o: any) => {
      const grossAmount = Number(o.totalAmount || 0);
      const subtotal = Number(o.subtotal || grossAmount);
      const deliveryFee = Number(o.deliveryFee || 0);
      const isCod = o.paymentMethod === 'CASH_ON_DELIVERY';
      const advancePaid = Number(o.advancePaidAmount || 0);

      // Payment Breakdown:
      // Online: onlinePaid = grossAmount, codAdvance = 0, codCash = 0
      // COD with advance: onlinePaid = advancePaid, codAdvance = advancePaid, codCash = grossAmount - advancePaid
      // COD without advance: onlinePaid = 0, codAdvance = 0, codCash = grossAmount
      const onlinePaid = !isCod ? grossAmount : advancePaid;
      const codAdvance = isCod ? advancePaid : 0;
      const codCash = isCod ? Math.max(0, grossAmount - advancePaid) : 0;

      // Commission: 5% standard on subtotal or configured
      const commissionRate = o.commissionRate !== undefined ? Number(o.commissionRate) : 5.0;
      const commissionAmount = o.commissionAmount !== undefined
        ? Number(o.commissionAmount)
        : Math.round(subtotal * (commissionRate / 100) * 100) / 100;

      // 1. Cancellation Refund Rule Calculation
      const isCancelled = o.status === 'CANCELLED';
      let cancelRefundStatus: 'UNCLAIMED' | 'CLAIMED' | 'DISTRIBUTED' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
      let cancelEligibleAmount = 0;
      let cancelClaimedAmount = 0;
      let cancelDistributedAmount = 0;
      let cancelDeduction = 0;

      if (isCancelled) {
        const studentPaidAmount = !isCod ? grossAmount : advancePaid;
        if (studentPaidAmount > 0) {
          // Pre-acceptance: full paid refund. Post-acceptance: delivery fee deduction.
          if (!o.providerAccepted) {
            cancelDeduction = 0;
            cancelEligibleAmount = studentPaidAmount;
          } else {
            cancelDeduction = Math.min(studentPaidAmount, deliveryFee);
            cancelEligibleAmount = Math.max(0, studentPaidAmount - cancelDeduction);
          }

          if (o.refundStatus === 'COMPLETED' || o.refundStatus === 'REFUNDED' || o.paymentStatus === 'REFUNDED') {
            cancelRefundStatus = 'DISTRIBUTED';
            cancelDistributedAmount = Number(o.refundAmount) > 0 ? Number(o.refundAmount) : cancelEligibleAmount;
            cancelClaimedAmount = cancelEligibleAmount;
          } else if (
            ['REQUESTED', 'PENDING_ADMIN_REVIEW', 'REFUND_PENDING', 'PROCESSING'].includes(o.refundStatus) ||
            o.paymentStatus === 'REFUND_PENDING' ||
            o.cancellationRequest
          ) {
            cancelRefundStatus = 'CLAIMED';
            cancelClaimedAmount = cancelEligibleAmount;
            cancelDistributedAmount = 0;
          } else {
            cancelRefundStatus = 'UNCLAIMED';
            cancelClaimedAmount = 0;
            cancelDistributedAmount = 0;
          }
        } else {
          // COD with no online advance: customer paid ₹0, nothing to refund
          cancelRefundStatus = 'NOT_APPLICABLE';
        }
      }

      // 2. Return Refund Rule Calculation
      const retReq = o.returnRequest || null;
      let returnRefundStatus: 'UNCLAIMED' | 'CLAIMED' | 'DISTRIBUTED' | 'REJECTED' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
      let returnEligibleAmount = 0;
      let returnClaimedAmount = 0;
      let returnDistributedAmount = 0;
      let returnDeduction = 0;

      if (retReq) {
        if (retReq.status === 'REJECTED') {
          returnRefundStatus = 'REJECTED';
        } else {
          // Mind-change: deduct delivery charge (e.g. ₹15); Product issue: 100% item refund
          if (retReq.reasonType === 'MIND_CHANGE') {
            returnDeduction = Number(retReq.deliveryFeeDeducted || retReq.deliveryChargeDeducted || 15);
          } else {
            returnDeduction = 0;
          }
          returnEligibleAmount = Math.max(0, Number(retReq.itemAmount || grossAmount) - returnDeduction);

          if (retReq.status === 'COMPLETED' || retReq.status === 'REFUNDED' || o.refundStatus === 'COMPLETED') {
            returnRefundStatus = 'DISTRIBUTED';
            returnDistributedAmount = Number(retReq.refundAmount || o.refundAmount || returnEligibleAmount);
            returnClaimedAmount = returnEligibleAmount;
          } else if (['REQUESTED', 'APPROVED', 'PICKUP_VERIFIED', 'IN_INSPECTION', 'PENDING'].includes(retReq.status)) {
            returnRefundStatus = 'CLAIMED';
            returnClaimedAmount = returnEligibleAmount;
            returnDistributedAmount = 0;
          } else {
            returnRefundStatus = 'UNCLAIMED';
          }
        }
      }

      // 3. Refund Total Distributed: actual sum distributed back to student
      const refundTotal = Math.round((cancelDistributedAmount + returnDistributedAmount) * 100) / 100;

      // 4. Final Campus Basket Earning:
      // Actual net money Campus Basket received from this order =
      //   Total amount student paid  −  Refund actually distributed back to student
      // This is the real cash-in-hand figure, not a % commission estimate.
      const finalCampusBasketEarning = Math.round((grossAmount - refundTotal) * 100) / 100;

      // Student details
      const student = o.student || {};
      const studentName = student.fullName || 'Student';
      const studentRoll = student.rollNumber || 'N/A';
      const studentEmail = student.collegeEmail || student.personalEmail || student.email || 'N/A';
      const studentRoom = student.roomNumber || o.roomNumber || 'N/A';
      const studentHall = o.hallName || 'Hostel';

      // Provider details
      let providerName = 'Campus Fresh';
      if (o.provider?.fullName) {
        providerName = o.provider.fullName;
      } else if (o.serviceType === 'LAUNDRY') {
        providerName = 'Express Laundry';
      } else if (o.serviceType === 'STATIONERY' || o.serviceType === 'HOSTEL_ESSENTIALS') {
        providerName = 'Campus Stationery & Essentials';
      } else if (o.serviceType === 'FRESH_PRODUCE') {
        providerName = 'Campus Fresh Fruits';
      }

      // Delivery Boy details
      const deliveryBoyName = o.deliveryBoy?.fullName || (o.deliveryBoyId ? 'Aman Singh' : 'Not Assigned');

      // Date & Time formatting
      const createdAtDate = new Date(o.createdAt || Date.now());
      const dateStr = !isNaN(createdAtDate.getTime()) ? createdAtDate.toISOString().split('T')[0] : '2026-09-01';
      const formattedDate = !isNaN(createdAtDate.getTime())
        ? createdAtDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '9 Sep 2026';
      const formattedTime = !isNaN(createdAtDate.getTime())
        ? createdAtDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '12:17 PM';

      // Items purchased summary
      const itemsList = Array.isArray(o.items) && o.items.length > 0
        ? o.items.map((i: any) => `${i.quantity || 1}x ${i.productName || 'Item'}`).join(', ')
        : 'General Order Items';

      // Payment status normalization — standardize display to CAPTURED (preferred term)
      // SUCCESS and PAID are legacy values kept for backward compatibility
      let normalizedPayStatus = o.paymentStatus || 'PENDING';
      if (['SUCCESS', 'PAID', 'CAPTURED'].includes(normalizedPayStatus)) normalizedPayStatus = 'CAPTURED';
      if (['REFUNDED'].includes(normalizedPayStatus) || o.refundStatus === 'COMPLETED') normalizedPayStatus = 'REFUNDED';
      if (['REFUND_PENDING', 'PARTIALLY_REFUNDED'].includes(normalizedPayStatus)) normalizedPayStatus = 'PARTIALLY_REFUNDED';
      if (['COD_PENDING', 'PENDING', 'PROCESSING', 'CREATED'].includes(normalizedPayStatus)) normalizedPayStatus = 'PENDING';
      if (normalizedPayStatus === 'RECONCILIATION_REQUIRED') normalizedPayStatus = 'RECONCILIATION_REQUIRED';

      // Display order ID
      const orderNumberDisplay = o.orderNumber?.startsWith('#') ? o.orderNumber : `#${o.orderNumber || o.id}`;

      // Extract payment attempt history from transactions
      const paymentAttempts = Array.isArray(o.payment?.transactions)
        ? o.payment.transactions.map((t: any) => ({
            attemptId: t.transactionId,
            razorpayPaymentId: t.transactionId.replace('verify_', '').replace('webhook_fail_', '').replace('webhook_', ''),
            eventType: t.eventType,
            status: t.status,
            time: t.createdAt
          }))
        : [];

      return {
        id: o.id,
        orderNumber: orderNumberDisplay,
        rawOrderNumber: o.orderNumber || o.id,
        createdAt: o.createdAt,
        date: dateStr,
        orderDate: `${formattedDate}, ${formattedTime}`,
        formattedDate,
        formattedTime,
        studentId: student.id || o.studentId || 'N/A',
        studentName,
        studentRoll,
        studentEmail,
        studentRoom,
        studentHall,
        providerId: o.providerId || 'prov_default',
        providerName,
        deliveryBoyId: o.deliveryBoyId || null,
        deliveryBoyName,
        serviceType: o.serviceType || 'FOOD',
        status: o.status,
        providerAccepted: Boolean(o.providerAccepted),
        itemsSummary: itemsList,
        itemsCount: Array.isArray(o.items) ? o.items.length : 1,
        subtotal,
        deliveryFee,
        totalAmount: grossAmount,
        grossAmount,
        paymentMethod: o.paymentMethod || 'RAZORPAY',
        paymentStatus: normalizedPayStatus,
        onlinePaid,
        onlineAmount: onlinePaid,
        codAdvance,
        codCash,
        codAmount: codCash,
        commissionRate,
        commissionAmount,
        // ── Razorpay / Reconciliation Fields ───────────────────────────────────
        razorpayOrderId: o.payment?.razorpayOrderId || null,
        razorpayPaymentId: o.payment?.razorpayPaymentId || null,
        razorpayEventId: o.payment?.razorpayEventId || null,
        capturedAt: o.payment?.capturedAt || null,
        failureReason: o.payment?.failureReason || null,
        paymentAttemptCount: o.payment?.attemptNumber || 1,
        paymentAttempts,
        reconciliationStatus: o.reconciliationStatus || 'NOT_REQUIRED',
        paymentReconciliationStatus: o.payment?.reconciliationStatus || 'NOT_REQUIRED',
        reconciledAt: o.payment?.reconciledAt || null,
        reconciledBy: o.payment?.reconciledBy || null,
        // ── Settlement Fields ──────────────────────────────────────────────────
        settlementStatus: o.settlementStatus || 'NOT_ELIGIBLE',
        providerPayable: Number(o.providerPayable) || 0,
        settlementItem: o.settlementItem || null,
        // ── Refund Fields ──────────────────────────────────────────────────────
        cancellationRefund: {
          status: cancelRefundStatus,
          eligibleAmount: cancelEligibleAmount,
          claimedAmount: cancelClaimedAmount,
          distributedAmount: cancelDistributedAmount,
          deduction: cancelDeduction,
          reason: o.cancellationReason || 'Pre-acceptance order cancellation'
        },
        returnRefund: {
          status: returnRefundStatus,
          eligibleAmount: returnEligibleAmount,
          claimedAmount: returnClaimedAmount,
          distributedAmount: returnDistributedAmount,
          deduction: returnDeduction,
          reasonType: retReq?.reasonType || null,
          reasonDetails: retReq?.reasonDetails || null
        },
        refundTotal,
        finalCampusBasketEarning,
        netPlatformRevenue: finalCampusBasketEarning
      };
    });

    // --- APPLY FILTERS ---
    let filtered = [...allMappedOrders];

    // 1. Date filter
    if (startDate) {
      filtered = filtered.filter((o) => o.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((o) => o.date <= endDate);
    }

    // 2. Service Type
    if (serviceType && serviceType !== 'ALL') {
      filtered = filtered.filter((o) => o.serviceType === serviceType);
    }

    // 3. Payment Method
    if (paymentMethod && paymentMethod !== 'ALL') {
      if (paymentMethod === 'ONLINE') {
        filtered = filtered.filter((o) => o.paymentMethod !== 'CASH_ON_DELIVERY');
      } else if (paymentMethod === 'COD') {
        filtered = filtered.filter((o) => o.paymentMethod === 'CASH_ON_DELIVERY');
      }
    }

    // 4. Payment Status
    if (paymentStatus && paymentStatus !== 'ALL') {
      filtered = filtered.filter((o) => o.paymentStatus === paymentStatus);
    }

    // 5. Refund Status Filter
    if (refundStatus && refundStatus !== 'ALL') {
      if (refundStatus === 'NO_REFUND') {
        filtered = filtered.filter(
          (o) => o.cancellationRefund.status === 'NOT_APPLICABLE' && o.returnRefund.status === 'NOT_APPLICABLE'
        );
      } else if (refundStatus === 'UNCLAIMED') {
        filtered = filtered.filter(
          (o) => o.cancellationRefund.status === 'UNCLAIMED' || o.returnRefund.status === 'UNCLAIMED'
        );
      } else if (refundStatus === 'CLAIMED') {
        filtered = filtered.filter(
          (o) => o.cancellationRefund.status === 'CLAIMED' || o.returnRefund.status === 'CLAIMED'
        );
      } else if (refundStatus === 'DISTRIBUTED') {
        filtered = filtered.filter(
          (o) => o.cancellationRefund.status === 'DISTRIBUTED' || o.returnRefund.status === 'DISTRIBUTED'
        );
      } else if (refundStatus === 'REJECTED') {
        filtered = filtered.filter((o) => o.returnRefund.status === 'REJECTED');
      }
    }

    // 6. Order Status Filter
    if (orderStatus && orderStatus !== 'ALL') {
      if (orderStatus === 'DELIVERED') {
        filtered = filtered.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED');
      } else if (orderStatus === 'CANCELLED') {
        filtered = filtered.filter((o) => o.status === 'CANCELLED');
      } else if (orderStatus === 'RETURNED') {
        filtered = filtered.filter((o) => o.returnRefund.status !== 'NOT_APPLICABLE');
      } else {
        filtered = filtered.filter((o) => o.status === orderStatus);
      }
    }

    // 7. Provider Filter
    if (providerId && providerId !== 'ALL') {
      filtered = filtered.filter((o) => o.providerId === providerId || o.providerName === providerId);
    }

    // 8. Delivery Boy Filter
    if (deliveryBoyId && deliveryBoyId !== 'ALL') {
      filtered = filtered.filter((o) => o.deliveryBoyId === deliveryBoyId || o.deliveryBoyName === deliveryBoyId);
    }

    // 9. Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.rawOrderNumber.toLowerCase().includes(q) ||
          o.studentId.toLowerCase().includes(q) ||
          o.studentName.toLowerCase().includes(q) ||
          o.studentEmail.toLowerCase().includes(q) ||
          o.studentRoll.toLowerCase().includes(q) ||
          o.studentRoom.toLowerCase().includes(q) ||
          o.providerName.toLowerCase().includes(q) ||
          o.deliveryBoyName.toLowerCase().includes(q) ||
          o.itemsSummary.toLowerCase().includes(q)
      );
    }

    // 10. Sort By
    if (sortBy === 'date_asc') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'amount_desc') {
      filtered.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortBy === 'amount_asc') {
      filtered.sort((a, b) => a.totalAmount - b.totalAmount);
    } else if (sortBy === 'earning_desc') {
      filtered.sort((a, b) => b.finalCampusBasketEarning - a.finalCampusBasketEarning);
    } else if (sortBy === 'earning_asc') {
      filtered.sort((a, b) => a.finalCampusBasketEarning - b.finalCampusBasketEarning);
    } else {
      // Default: date_desc
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // --- AGGREGATE SUMMARY TOTALS STRICTLY FROM CURRENTLY FILTERED ORDERS ---
    let totalGrossVolume = 0;
    let totalOnlinePayments = 0;
    let totalCodAdvance = 0;
    let totalCodCash = 0;
    let totalRefundsDistributed = 0;
    let totalFinalCampusBasketEarning = 0;

    for (const item of filtered) {
      totalGrossVolume += item.totalAmount;
      totalOnlinePayments += item.onlinePaid;
      totalCodAdvance += item.codAdvance;
      totalCodCash += item.codCash;
      totalRefundsDistributed += item.refundTotal;
      totalFinalCampusBasketEarning += item.finalCampusBasketEarning;
    }

    // Reconciliation required count
    const reconciliationRequired = filtered.filter(
      (o) => o.reconciliationStatus !== 'NOT_REQUIRED' && o.reconciliationStatus !== 'AUTO_RECONCILED' && o.reconciliationStatus !== 'MANUALLY_RECONCILED'
    ).length;

    // Distinct lists for dynamic filter options
    const distinctProviders = Array.from(new Set(allMappedOrders.map((o) => o.providerName))).filter(Boolean);
    const distinctDeliveryBoys = Array.from(new Set(allMappedOrders.map((o) => o.deliveryBoyName))).filter(Boolean);
    const distinctReconciliationStatuses = Array.from(new Set(allMappedOrders.map((o) => o.reconciliationStatus))).filter(Boolean);

    return {
      metrics: {
        totalOrders: filtered.length,
        totalOrdersCount: filtered.length,
        grossOrderValue: Math.round(totalGrossVolume * 100) / 100,
        totalGrossVolume: Math.round(totalGrossVolume * 100) / 100,
        onlinePaid: Math.round(totalOnlinePayments * 100) / 100,
        totalOnlinePayments: Math.round(totalOnlinePayments * 100) / 100,
        codAdvance: Math.round(totalCodAdvance * 100) / 100,
        codCash: Math.round(totalCodCash * 100) / 100,
        totalCodCollected: Math.round(totalCodCash * 100) / 100,
        refundsDistributed: Math.round(totalRefundsDistributed * 100) / 100,
        totalRefundsDisbursed: Math.round(totalRefundsDistributed * 100) / 100,
        finalCampusBasketEarning: Math.round(totalFinalCampusBasketEarning * 100) / 100,
        totalNetPlatformRevenue: Math.round(totalFinalCampusBasketEarning * 100) / 100,
        reconciliationRequired
      },
      orders: filtered,
      distinctProviders,
      distinctDeliveryBoys,
      distinctReconciliationStatuses
    };
  }

  /**
   * Section 7: Order Payment & Settlement Ledger API
   */
  public static async getGrossVolumeBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminPaymentController.computeGrossVolumeData(req.query);
      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Download Landscape A4 Order Payment & Settlement Report PDF
   * Reflects ONLY the currently applied filters. Excludes Institution Fee.
   */
  public static async downloadGrossVolumePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminPaymentController.computeGrossVolumeData(req.query);

      const rows: LedgerPdfRow[] = data.orders.map((o: any) => ({
        orderDate: o.orderDate,
        orderNumber: o.orderNumber,
        studentName: o.studentName,
        studentEmail: o.studentEmail,
        studentRoll: o.studentRoll,
        providerName: o.providerName,
        deliveryBoyName: o.deliveryBoyName,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        onlinePaid: o.onlinePaid,
        codAdvance: o.codAdvance,
        codCash: o.codCash,
        paymentStatus: o.paymentStatus,
        cancellationRefundStatus: o.cancellationRefund.status,
        cancellationRefundAmount: o.cancellationRefund.distributedAmount || o.cancellationRefund.claimedAmount || 0,
        returnRefundStatus: o.returnRefund.status,
        returnRefundAmount: o.returnRefund.distributedAmount || o.returnRefund.claimedAmount || 0,
        refundTotal: o.refundTotal,
        finalCampusBasketEarning: o.finalCampusBasketEarning,
        orderStatus: o.status
      }));

      const periodText = req.query.startDate && req.query.endDate
        ? `${req.query.startDate} to ${req.query.endDate}`
        : 'All-Time Financial Ledger';

      const pdfBuffer = await GrossVolumePdfService.generatePdf({
        reportTitle: 'Order Payment & Settlement Report',
        periodText,
        filtersText: {
          service: (req.query.serviceType as string) || undefined,
          paymentMethod: (req.query.paymentMethod as string) || undefined,
          paymentStatus: (req.query.paymentStatus as string) || undefined,
          refundStatus: (req.query.refundStatus as string) || undefined,
          orderStatus: (req.query.orderStatus as string) || undefined,
          provider: (req.query.providerId as string) || undefined,
          deliveryBoy: (req.query.deliveryBoyId as string) || undefined,
          search: (req.query.search as string) || undefined
        },
        generatedBy: (req as any).user?.fullName || 'Financial Administrator',
        generatedAt: new Date(),
        metrics: {
          totalOrders: data.metrics.totalOrders,
          grossOrderValue: data.metrics.grossOrderValue,
          onlinePaid: data.metrics.onlinePaid,
          codAdvance: data.metrics.codAdvance,
          codCash: data.metrics.codCash,
          refundsDistributed: data.metrics.refundsDistributed,
          finalCampusBasketEarning: data.metrics.finalCampusBasketEarning
        },
        rows
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="CampusBasket-Order-Settlement-Ledger-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export Filtered Order Payment & Settlement Ledger CSV
   * Uses strictly the currently filtered orders. Excludes Institution Fee.
   */
  public static async downloadGrossVolumeCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminPaymentController.computeGrossVolumeData(req.query);
      const headers = [
        'Order Date',
        'Order ID',
        'Student Name',
        'Student Email',
        'Student Roll No',
        'Room & Hall',
        'Provider',
        'Delivery Boy',
        'Total Order Amount (INR)',
        'Payment Method',
        'Online Paid (INR)',
        'COD Advance Paid (INR)',
        'COD Cash Collected (INR)',
        'Payment Status',
        'Cancellation Refund Status',
        'Cancellation Refund Amount (INR)',
        'Return Refund Status',
        'Return Refund Amount (INR)',
        'Total Refund Distributed (INR)',
        'Final Campus Basket Earning (INR)',
        'Items Purchased'
      ];

      const escapeCsv = (val: any) => {
        const s = String(val ?? '').replace(/"/g, '""');
        return `"${s}"`;
      };

      const csvRows = [headers.join(',')];
      for (const o of data.orders) {
        csvRows.push([
          escapeCsv(o.orderDate),
          escapeCsv(o.orderNumber),
          escapeCsv(o.studentName),
          escapeCsv(o.studentEmail),
          escapeCsv(o.studentRoll),
          escapeCsv(`${o.studentRoom}, ${o.studentHall}`),
          escapeCsv(o.providerName),
          escapeCsv(o.deliveryBoyName),
          o.totalAmount.toFixed(2),
          escapeCsv(o.paymentMethod),
          o.onlinePaid.toFixed(2),
          o.codAdvance.toFixed(2),
          o.codCash.toFixed(2),
          escapeCsv(o.paymentStatus),
          escapeCsv(o.cancellationRefund.status),
          (o.cancellationRefund.distributedAmount || o.cancellationRefund.claimedAmount || 0).toFixed(2),
          escapeCsv(o.returnRefund.status),
          (o.returnRefund.distributedAmount || o.returnRefund.claimedAmount || 0).toFixed(2),
          o.refundTotal.toFixed(2),
          o.finalCampusBasketEarning.toFixed(2),
          escapeCsv(o.itemsSummary)
        ].join(','));
      }

      const csvContent = csvRows.join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="CampusBasket-Order-Settlement-Ledger-${Date.now()}.csv"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
  /**
   * =============================================================================
   *  RECONCILIATION MANAGEMENT ENDPOINTS
   * =============================================================================
   */

  /**
   * GET /admin/payments/reconciliation-queue
   * Returns all orders requiring admin attention for payment reconciliation.
   */
  public static async getReconciliationQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await prisma.order.findMany({
        where: {
          reconciliationStatus: {
            in: ['PENDING', 'AMOUNT_MISMATCH', 'PAYMENT_NOT_FOUND', 'CUSTOMER_DEBIT_REVIEW'] as any
          }
        },
        include: {
          student: { select: { fullName: true, rollNumber: true, collegeEmail: true } },
          payment: true,
          provider: { select: { fullName: true } },
          deliveryBoy: { select: { fullName: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders.map((o: any) => ({
          orderId: o.id,
          orderNumber: o.orderNumber,
          studentName: o.student?.fullName,
          studentEmail: o.student?.collegeEmail,
          studentRoll: o.student?.rollNumber,
          providerName: o.provider?.fullName,
          totalAmount: Number(o.totalAmount),
          orderStatus: o.status,
          paymentStatus: o.paymentStatus,
          reconciliationStatus: o.reconciliationStatus,
          razorpayOrderId: o.payment?.razorpayOrderId,
          razorpayPaymentId: o.payment?.razorpayPaymentId,
          expectedAmount: Number(o.payment?.amount || o.totalAmount),
          failureReason: o.payment?.failureReason,
          createdAt: o.createdAt
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /admin/payments/recheck-payment
   * Manually trigger Razorpay API verification for one order.
   */
  public static async recheckRazorpayPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.body;
      const adminUserId = (req as any).user?.id || 'admin_user';

      if (!orderId) {
        res.status(400).json({ success: false, message: 'orderId is required' });
        return;
      }

      const result = await PaymentReconciliationService.reconcileOrder(
        orderId,
        adminUserId,
        'Manual recheck by admin'
      );

      await AuditService.log(prisma, {
        userId: adminUserId,
        action: 'PAYMENT_RECHECK',
        entity: 'Order',
        entityId: orderId,
        newValue: result,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /admin/payments/mark-reconciled
   * Admin manually marks an order as reconciled with mandatory reason.
   */
  public static async markReconciled(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, note, newOrderStatus } = req.body;
      const adminUserId = (req as any).user?.id || 'admin_user';

      if (!orderId || !note || note.trim().length < 10) {
        res.status(400).json({
          success: false,
          message: 'orderId and a detailed note (min 10 characters) are required for manual reconciliation'
        });
        return;
      }

      const result = await PaymentReconciliationService.adminManualReconcile(
        orderId,
        adminUserId,
        note.trim(),
        newOrderStatus
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * GET /admin/payments/attempt-history/:orderId
   * Returns payment attempt history for an order.
   */
  public static async getPaymentAttemptHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;

      const payment = await prisma.payment.findFirst({
        where: { orderId },
        include: {
          transactions: { orderBy: { createdAt: 'asc' } },
          reconciliationLogs: { orderBy: { createdAt: 'desc' } }
        }
      });

      if (!payment) {
        res.status(404).json({ success: false, message: 'No payment record found for this order' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          paymentId: payment.id,
          paymentNumber: (payment as any).paymentNumber,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          status: payment.status,
          amount: Number(payment.amount),
          reconciliationStatus: (payment as any).reconciliationStatus,
          capturedAt: (payment as any).capturedAt,
          failureReason: (payment as any).failureReason,
          attemptNumber: (payment as any).attemptNumber || 1,
          transactions: payment.transactions,
          reconciliationLogs: (payment as any).reconciliationLogs
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /admin/payments/webhook-logs
   * Returns Razorpay webhook log for an order (audit trail).
   */
  public static async getWebhookLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, razorpayOrderId, status } = req.query;

      const where: any = {};
      if (orderId) where.relatedOrderId = orderId;
      if (razorpayOrderId) where.razorpayOrderId = razorpayOrderId;
      if (status) where.processingStatus = status;

      const logs = await prisma.razorpayWebhookLog.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: 100
      });

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs.map((l: any) => ({
          webhookLogId: l.webhookLogId,
          eventId: l.eventId,
          eventType: l.eventType,
          razorpayOrderId: l.razorpayOrderId,
          razorpayPaymentId: l.razorpayPaymentId,
          relatedOrderId: l.relatedOrderId,
          processingStatus: l.processingStatus,
          signatureValid: l.signatureValid,
          receivedAt: l.receivedAt,
          processedAt: l.processedAt,
          failureReason: l.failureReason,
          retryCount: l.retryCount
          // rawPayload intentionally omitted from list view (use individual endpoint for full details)
        }))
      });
    } catch (err) {
      next(err);
    }
  }
}
