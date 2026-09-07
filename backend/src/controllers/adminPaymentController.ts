import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { LedgerService } from '../services/financial/LedgerService';
import { SettlementService } from '../services/financial/SettlementService';
import { RefundService } from '../services/financial/RefundService';
import { AuditService } from '../services/audit/AuditService';
import { DeliverySettlementPdfService } from '../services/pdf/DeliverySettlementPdfService';

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
          OR: [
            { refundStatus: { in: ['REQUESTED', 'PENDING_ADMIN_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED'] } },
            { paymentStatus: { in: ['REFUND_PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED'] } }
          ]
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
          return {
            ...o,
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
}

