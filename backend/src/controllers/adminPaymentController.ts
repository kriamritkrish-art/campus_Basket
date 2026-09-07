import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { LedgerService } from '../services/financial/LedgerService';
import { SettlementService } from '../services/financial/SettlementService';
import { RefundService } from '../services/financial/RefundService';
import { AuditService } from '../services/audit/AuditService';

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
}
