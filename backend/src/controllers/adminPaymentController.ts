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
  private static round(val: number): number {
    return Math.round((Number(val) || 0) * 100) / 100;
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

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

        const commAmt = Number(o.commissionAmount) || 0;
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
      const { status, deliveryBoyId, providerId, dateRange, search } = req.query;

      const orders = await (prisma as any).order.findMany({
        include: {
          items: true,
          student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
          provider: { select: { fullName: true, mobileNumber: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      const codList = await (prisma as any).cODCollection.findMany();
      const deliveryBoys = await (prisma as any).deliveryBoy.findMany().catch(() => []);
      const providers = await (prisma as any).serviceProvider.findMany().catch(() => []);

      const activeRunners = deliveryBoys;

      // Filter all COD orders
      let codOrders = orders.filter((o: any) =>
        o.paymentMethod === 'CASH_ON_DELIVERY' ||
        o.paymentMethod === 'COD' ||
        (typeof o.paymentMethod === 'string' && o.paymentMethod.toUpperCase().includes('COD')) ||
        codList.some((c: any) => c.orderId === o.id || c.orderId === o.orderNumber)
      );

      if (dateRange === 'today') {
        codOrders = codOrders.filter((o: any) => {
          const d = new Date(o.createdAt || o.deliveredAt);
          const now = new Date();
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        });
      } else if (dateRange === 'week') {
        codOrders = codOrders.filter((o: any) => {
          const d = new Date(o.createdAt || o.deliveredAt).getTime();
          return (Date.now() - d) <= (7 * 24 * 60 * 60 * 1000);
        });
      } else if (dateRange === 'month') {
        codOrders = codOrders.filter((o: any) => {
          const d = new Date(o.createdAt || o.deliveredAt);
          const now = new Date();
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
      }

      if (providerId && providerId !== 'ALL') {
        codOrders = codOrders.filter((o: any) => o.providerId === providerId);
      }

      const normalizedCollections: any[] = [];
      const runnerMap = new Map<string, any>();

      // Pre-seed delivery boys map
      for (const boy of activeRunners) {
        runnerMap.set(boy.id, {
          deliveryBoyId: boy.id,
          name: boy.fullName || 'Campus Runner',
          deliveryBoyName: boy.fullName || 'Campus Runner',
          phone: boy.mobileNumber || boy.phone || boy.user?.phone || '+91 98765 43220',
          contactPhone: boy.mobileNumber || boy.phone || boy.user?.phone || '+91 98765 43220',
          vehicleType: boy.vehicleType || 'Bicycle',
          codOrdersCount: 0,
          expectedAmount: 0,
          collectedAmount: 0,
          difference: 0,
          reconciledOrdersCount: 0,
          pendingOrdersCount: 0,
          eligibleOrdersCount: 0,
          eligibleAmount: 0,
          differenceRequiringAttention: 0,
          status: 'READY TO RECONCILE',
          orders: []
        });
      }

      for (const ord of codOrders) {
        const codEntry = codList.find((c: any) => c.orderId === ord.id || c.orderId === ord.orderNumber);

        // Resolve assigned runner
        const assignedRunnerId = ord.deliveryBoyId ?? codEntry?.deliveryBoyId ?? null;
        const runner = assignedRunnerId ? (activeRunners.find((d: any) => d.id === assignedRunnerId) || deliveryBoys.find((d: any) => d.id === assignedRunnerId)) : null;
        const runnerName = runner?.fullName || (assignedRunnerId ? 'Campus Delivery Partner' : 'Unassigned Delivery Partner');
        const runnerPhone = runner?.mobileNumber || runner?.phone || null;

        const prov = providers.find((p: any) => p.id === ord.providerId);
        const expectedAmt = AdminPaymentController.round(Number(ord.totalAmount) || 0);

        const rawCollected = codEntry ? (codEntry.collectedAmount !== undefined ? codEntry.collectedAmount : codEntry.amountCollected) : null;
        const parsedCollected = rawCollected !== null && rawCollected !== undefined ? Number(rawCollected) : null;
        const isDeliveredAndCollected = ord.paymentStatus === 'COD_COLLECTED' || codEntry?.collectionStatus === 'COLLECTED';
        const collectedAmt = parsedCollected !== null && !isNaN(parsedCollected)
          ? AdminPaymentController.round(parsedCollected)
          : (isDeliveredAndCollected ? expectedAmt : 0);

        const collectionStatus = codEntry?.collectionStatus || (isDeliveredAndCollected ? 'COLLECTED' : 'PENDING');
        const diff = collectionStatus === 'COLLECTED'
          ? AdminPaymentController.round(collectedAmt - expectedAmt)
          : 0;

        const reconciliationStatus = codEntry?.reconciliationStatus || (
          collectionStatus === 'COLLECTED' && diff === 0 && ord.settlementStatus === 'SETTLED'
            ? 'RECONCILED'
            : (collectionStatus === 'COLLECTED' && diff !== 0
                ? 'MISMATCH'
                : 'PENDING')
        );

        const isOtpVerified = Boolean(ord.deliveryOtpVerified || ord.status === 'DELIVERED');
        const isDelivered = ord.status === 'DELIVERED' || isOtpVerified;

        // Strict eligibility check per requirements
        const isEligible =
          reconciliationStatus !== 'RECONCILED' &&
          ord.status !== 'CANCELLED' &&
          isDelivered &&
          collectedAmt > 0 &&
          diff === 0;

        const normalizedRow = {
          id: codEntry?.id || `cod_${ord.id}`,
          collectionId: codEntry?.id || `cod_${ord.id}`,
          collectionNumber: codEntry?.collectionNumber || `COD-${ord.orderNumber || ord.id}`,
          orderId: ord.id,
          orderNumber: ord.orderNumber || ord.id,
          customerName: ord.student?.fullName || 'Campus Student',
          student: ord.student?.fullName || 'Campus Student',
          providerName: prov?.fullName || ord.provider?.fullName || 'Campus Store',
          providerId: ord.providerId,
          product: ord.items && ord.items.length > 0 ? ord.items.map((i: any) => i.productName).join(', ') : (ord.serviceType || 'Item'),
          deliveryBoyId: assignedRunnerId,
          deliveryBoy: {
            id: assignedRunnerId,
            fullName: runnerName,
            mobileNumber: runnerPhone,
            vehicleType: runner?.vehicleType || 'Bicycle'
          },
          runnerName,
          orderAmount: expectedAmt,
          amountExpected: expectedAmt,
          expectedAmount: expectedAmt,
          amountCollected: collectedAmt,
          collectedAmount: collectedAmt,
          difference: diff,
          collectionStatus,
          reconciliationStatus,
          reconciliationNotes: codEntry?.reconciliationNotes || codEntry?.notes || null,
          otpVerified: isOtpVerified,
          isDelivered,
          date: ord.createdAt || ord.deliveredAt,
          createdAt: ord.createdAt || ord.deliveredAt,
          isEligibleForReconcile: isEligible
        };

        normalizedCollections.push(normalizedRow);

        // Group into delivery boy summary
        if (assignedRunnerId && !runnerMap.has(assignedRunnerId)) {
          runnerMap.set(assignedRunnerId, {
            deliveryBoyId: assignedRunnerId,
            name: runnerName,
            deliveryBoyName: runnerName,
            phone: runnerPhone,
            contactPhone: runnerPhone,
            vehicleType: runner?.vehicleType || 'Bicycle',
            codOrdersCount: 0,
            expectedAmount: 0,
            collectedAmount: 0,
            difference: 0,
            reconciledOrdersCount: 0,
            pendingOrdersCount: 0,
            eligibleOrdersCount: 0,
            eligibleAmount: 0,
            differenceRequiringAttention: 0,
            status: 'PENDING',
            orders: []
          });
        }

        if (assignedRunnerId) {
          const rStat = runnerMap.get(assignedRunnerId);
          rStat.codOrdersCount += 1;
          rStat.expectedAmount = AdminPaymentController.round(rStat.expectedAmount + expectedAmt);
          rStat.collectedAmount = AdminPaymentController.round(rStat.collectedAmount + collectedAmt);
          if (collectionStatus === 'COLLECTED') {
            rStat.difference = AdminPaymentController.round(rStat.difference + diff);
          }

          if (reconciliationStatus === 'RECONCILED') {
            rStat.reconciledOrdersCount += 1;
          } else {
            rStat.pendingOrdersCount += 1;
          }

          if (isEligible) {
            rStat.eligibleOrdersCount += 1;
            rStat.eligibleAmount = AdminPaymentController.round(rStat.eligibleAmount + collectedAmt);
          }

          // Only flag as difference requiring attention if order is marked MISMATCH or was COLLECTED with a discrepancy
          if (reconciliationStatus === 'MISMATCH' || (collectionStatus === 'COLLECTED' && diff !== 0)) {
            rStat.differenceRequiringAttention = AdminPaymentController.round(rStat.differenceRequiringAttention + Math.abs(diff));
          }

          rStat.orders.push(normalizedRow);
        }
      }

      // Compute status for each delivery boy
      const runnerSummaries = Array.from(runnerMap.values()).map(r => {
        let status = 'PENDING';
        if (r.pendingOrdersCount === 0 && r.reconciledOrdersCount > 0) {
          status = 'RECONCILED';
        } else if (r.differenceRequiringAttention > 0 || r.orders.some((o: any) => o.reconciliationStatus === 'MISMATCH')) {
          status = 'MISMATCH';
        } else if (r.eligibleOrdersCount > 0) {
          status = 'READY TO RECONCILE';
        } else {
          status = 'PENDING';
        }
        return {
          ...r,
          status
        };
      });

      let filteredCollections = normalizedCollections;
      if (status && status !== 'ALL') {
        filteredCollections = filteredCollections.filter(c => c.reconciliationStatus === status);
      }
      if (deliveryBoyId && deliveryBoyId !== 'ALL') {
        filteredCollections = filteredCollections.filter(c => c.deliveryBoyId === deliveryBoyId);
      }
      if (search && typeof search === 'string') {
        const q = search.toLowerCase().trim();
        filteredCollections = filteredCollections.filter(c =>
          c.orderNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.providerName?.toLowerCase().includes(q) ||
          c.runnerName?.toLowerCase().includes(q)
        );
      }

      // Compute top-level summary cards
      const totalCodOrders = normalizedCollections.length;
      const totalExpectedCod = AdminPaymentController.round(normalizedCollections.reduce((s, c) => s + c.expectedAmount, 0));
      const totalCollectedCod = AdminPaymentController.round(normalizedCollections.reduce((s, c) => s + c.collectedAmount, 0));
      const totalDiff = AdminPaymentController.round(totalCollectedCod - totalExpectedCod);
      const reconciledCount = normalizedCollections.filter(c => c.reconciliationStatus === 'RECONCILED').length;
      const pendingCount = normalizedCollections.filter(c => c.reconciliationStatus !== 'RECONCILED').length;

      const summaryCards = {
        totalDeliveryBoys: runnerSummaries.filter(r => r.codOrdersCount > 0).length,
        totalCodOrders,
        expectedCod: totalExpectedCod,
        cashCollected: totalCollectedCod,
        difference: totalDiff,
        reconciledCount,
        pendingCount
      };

      res.status(200).json({
        success: true,
        summary: summaryCards,
        deliveryBoys: runnerSummaries,
        count: filteredCollections.length,
        collections: filteredCollections,
        data: filteredCollections // backward compatibility
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Action: Reconcile Single COD Collection
   */
  public static async reconcileCod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { collectionId, reconciliationStatus, notes, amountCollected } = req.body;
      const adminUserId = (req as any).user?.id || (req as any).user?.userId || 'admin_user';

      if (!collectionId) {
        res.status(400).json({ success: false, message: 'Collection ID is required' });
        return;
      }

      let existing = await (prisma as any).cODCollection.findUnique({
        where: { id: collectionId }
      });

      if (!existing) {
        // Find if collectionId is an orderId
        const order = await (prisma as any).order.findUnique({
          where: { id: collectionId.replace('cod_', '') }
        });
        if (!order) {
          res.status(404).json({ success: false, message: 'Collection or Order not found' });
          return;
        }

        const expAmt = Number(order.totalAmount) || 0;
        const colAmt = amountCollected !== undefined ? Number(amountCollected) : expAmt;
        const diffAmt = Math.round((colAmt - expAmt) * 100) / 100;

        existing = await (prisma as any).cODCollection.create({
          data: {
            collectionNumber: `COD-${order.orderNumber || Date.now()}`,
            orderId: order.id,
            deliveryBoyId: order.deliveryBoyId || 'db_boy_1',
            expectedAmount: expAmt,
            amountExpected: expAmt,
            collectedAmount: colAmt,
            amountCollected: colAmt,
            difference: diffAmt,
            collectionStatus: 'HANDED_OVER',
            reconciliationStatus: reconciliationStatus || (diffAmt === 0 ? 'RECONCILED' : 'MISMATCH'),
            reconciliationNotes: notes || 'Single order reconciliation',
            reconciledAt: new Date(),
            reconciledBy: adminUserId
          }
        });
      } else {
        const expected = Number(existing.expectedAmount || existing.amountExpected || 0);
        const collected = amountCollected !== undefined ? Number(amountCollected) : Number(existing.collectedAmount || existing.amountCollected || 0);
        const diff = Math.round((collected - expected) * 100) / 100;

        existing = await (prisma as any).cODCollection.update({
          where: { id: collectionId },
          data: {
            amountCollected: collected,
            collectedAmount: collected,
            difference: diff,
            collectionStatus: 'HANDED_OVER',
            reconciliationStatus: reconciliationStatus || (diff === 0 ? 'RECONCILED' : 'MISMATCH'),
            reconciliationNotes: notes || existing.reconciliationNotes,
            reconciledAt: new Date(),
            reconciledBy: adminUserId,
            updatedAt: new Date()
          }
        });
      }

      // Synchronize Order paymentStatus
      if (existing.orderId) {
        await (prisma as any).order.update({
          where: { id: existing.orderId },
          data: { paymentStatus: 'COD_COLLECTED' }
        }).catch(() => {});
      }

      // Double-Entry Financial Ledger
      await LedgerService.recordEntry({
        orderId: existing.orderId || null,
        entryType: 'COD_COLLECTION',
        debitAccount: 'CAMPUS_BANK_CURRENT_ACCOUNT',
        creditAccount: 'DELIVERY_RUNNER_CASH_HOLD',
        amount: Number(existing.collectedAmount || existing.amountCollected || 0),
        referenceId: `REC-SINGLE-${existing.id}`,
        description: `Individual COD reconciliation for collection ${existing.id}`,
        metadata: { collectionId: existing.id, orderId: existing.orderId }
      }).catch(() => {});

      res.status(200).json({
        success: true,
        message: 'COD collection successfully reconciled.',
        data: existing
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Action: Bulk Reconcile Eligible COD Orders for a Selected Delivery Boy
   */
  public static async bulkReconcileDeliveryBoyCod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deliveryBoyId, providerId, dateRange, notes } = req.body;
      const adminUserId = (req as any).user?.id || (req as any).user?.userId || 'admin_user';
      const adminName = (req as any).user?.fullName || (req as any).user?.email || 'Admin Operator';

      if (!deliveryBoyId) {
        res.status(400).json({ success: false, message: 'Delivery Boy ID is required for bulk reconciliation.' });
        return;
      }

      const orders = await (prisma as any).order.findMany({
        include: {
          items: true,
          student: { select: { fullName: true, mobileNumber: true } },
          provider: { select: { fullName: true } }
        }
      });
      const codList = await (prisma as any).cODCollection.findMany();
      const deliveryBoys = await (prisma as any).deliveryBoy.findMany().catch(() => []);

      const defaultRunners = [
        { id: 'db_boy_1', fullName: 'Bikash Mondal (Lead Runner)', phone: '+91 98765 43220', vehicleType: 'Motorcycle' },
        { id: 'db_boy_2', fullName: 'Rajesh Kumar (Express Runner)', phone: '+91 98765 43221', vehicleType: 'Bicycle' }
      ];
      const activeRunners = deliveryBoys.length > 0 ? deliveryBoys : defaultRunners;
      const runner = activeRunners.find((d: any) => d.id === deliveryBoyId) || deliveryBoys.find((d: any) => d.id === deliveryBoyId);
      const runnerName = runner?.fullName || (deliveryBoyId === 'db_boy_1' ? 'Bikash Mondal (Lead Runner)' : (deliveryBoyId === 'db_boy_2' ? 'Rajesh Kumar (Express Runner)' : 'Campus Delivery Partner'));

      // Filter all COD orders
      const codOrders = orders.filter((o: any) =>
        o.paymentMethod === 'CASH_ON_DELIVERY' ||
        o.paymentMethod === 'COD' ||
        (typeof o.paymentMethod === 'string' && o.paymentMethod.toUpperCase().includes('COD')) ||
        codList.some((c: any) => c.orderId === o.id || c.orderId === o.orderNumber)
      );

      // Find orders attributed to this delivery boy
      const runnerOrders = codOrders.filter((ord: any) => {
        const codEntry = codList.find((c: any) => c.orderId === ord.id || c.orderId === ord.orderNumber);
        let assignedRunnerId = ord.deliveryBoyId;
        if (!assignedRunnerId && codEntry?.deliveryBoyId) {
          assignedRunnerId = codEntry.deliveryBoyId;
        }
        if (!assignedRunnerId) {
          const hashIdx = Math.abs(AdminPaymentController.hashString(ord.id || ord.orderNumber || '')) % activeRunners.length;
          assignedRunnerId = activeRunners[hashIdx].id;
        }
        return assignedRunnerId === deliveryBoyId;
      });

      // Scope filter: Provider
      let scopedOrders = runnerOrders;
      if (providerId && providerId !== 'ALL') {
        scopedOrders = scopedOrders.filter((o: any) => o.providerId === providerId);
      }

      // Scope filter: Date Range
      if (dateRange === 'today') {
        scopedOrders = scopedOrders.filter((o: any) => {
          const d = new Date(o.createdAt || o.deliveredAt);
          const now = new Date();
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        });
      } else if (dateRange === 'week') {
        scopedOrders = scopedOrders.filter((o: any) => {
          const d = new Date(o.createdAt || o.deliveredAt).getTime();
          return (Date.now() - d) <= (7 * 24 * 60 * 60 * 1000);
        });
      } else if (dateRange === 'month') {
        scopedOrders = scopedOrders.filter((o: any) => {
          const d = new Date(o.createdAt || o.deliveredAt);
          const now = new Date();
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
      }

      // Filter strictly eligible orders
      const eligibleOrders: any[] = [];
      const ineligibleReasons: any[] = [];

      for (const ord of scopedOrders) {
        const codEntry = codList.find((c: any) => c.orderId === ord.id || c.orderId === ord.orderNumber);
        const currentReconciliationStatus = codEntry?.reconciliationStatus || 'PENDING';

        if (currentReconciliationStatus === 'RECONCILED') {
          ineligibleReasons.push({ orderNumber: ord.orderNumber, reason: 'Already Reconciled' });
          continue;
        }

        if (ord.status === 'CANCELLED') {
          ineligibleReasons.push({ orderNumber: ord.orderNumber, reason: 'Order is Cancelled' });
          continue;
        }

        const isDelivered = ord.status === 'DELIVERED' || Boolean(ord.deliveryOtpVerified);
        if (!isDelivered) {
          ineligibleReasons.push({ orderNumber: ord.orderNumber, reason: 'Order Not Delivered Yet' });
          continue;
        }

        const expectedAmt = AdminPaymentController.round(Number(ord.totalAmount) || 0);
        const rawCollected = codEntry ? (codEntry.collectedAmount !== undefined ? codEntry.collectedAmount : codEntry.amountCollected) : null;
        const parsedCollected = rawCollected !== null && rawCollected !== undefined ? Number(rawCollected) : null;
        const collectedAmt = parsedCollected !== null && !isNaN(parsedCollected)
          ? AdminPaymentController.round(parsedCollected)
          : (ord.paymentStatus === 'COD_COLLECTED' || codEntry?.collectionStatus === 'COLLECTED' || ord.status === 'DELIVERED' ? expectedAmt : 0);

        if (collectedAmt <= 0) {
          ineligibleReasons.push({ orderNumber: ord.orderNumber, reason: 'No Cash Collection Recorded' });
          continue;
        }

        const diff = AdminPaymentController.round(collectedAmt - expectedAmt);
        if (diff !== 0) {
          ineligibleReasons.push({ orderNumber: ord.orderNumber, reason: `Amount difference of ₹${diff} requires individual adjustment` });
          continue;
        }

        eligibleOrders.push({
          order: ord,
          codEntry,
          expectedAmt,
          collectedAmt
        });
      }

      if (eligibleOrders.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No eligible orders found for bulk reconciliation under the selected scope.',
          ineligibleReasons
        });
        return;
      }

      // Generate unique Bulk Reconciliation Batch ID
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const batchId = `REC-BATCH-${dateStr}-${Date.now().toString().slice(-4)}`;

      let totalExpectedReconciled = 0;
      let totalCollectedReconciled = 0;
      const reconciledOrderIds: string[] = [];
      const reconciledOrderNumbers: string[] = [];

      for (const item of eligibleOrders) {
        const { order, codEntry, expectedAmt, collectedAmt } = item;
        totalExpectedReconciled += expectedAmt;
        totalCollectedReconciled += collectedAmt;
        reconciledOrderIds.push(order.id);
        reconciledOrderNumbers.push(order.orderNumber);

        if (codEntry) {
          await (prisma as any).cODCollection.update({
            where: { id: codEntry.id },
            data: {
              reconciliationStatus: 'RECONCILED',
              collectionStatus: 'HANDED_OVER',
              amountCollected: collectedAmt,
              collectedAmount: collectedAmt,
              difference: 0,
              reconciledAt: new Date(),
              reconciledBy: adminUserId,
              adjustmentReason: `Bulk Reconciled under Batch ${batchId}`,
              notes: notes || `Reconciled in bulk batch ${batchId} for ${runnerName}`,
              updatedAt: new Date()
            }
          });
        } else {
          await (prisma as any).cODCollection.create({
            data: {
              collectionNumber: `COD-${order.orderNumber || Date.now()}`,
              orderId: order.id,
              deliveryBoyId: deliveryBoyId,
              expectedAmount: expectedAmt,
              amountExpected: expectedAmt,
              collectedAmount: collectedAmt,
              amountCollected: collectedAmt,
              difference: 0,
              collectionStatus: 'HANDED_OVER',
              reconciliationStatus: 'RECONCILED',
              collectedAt: order.deliveredAt || new Date(),
              reconciledAt: new Date(),
              reconciledBy: adminUserId,
              adjustmentReason: `Bulk Reconciled under Batch ${batchId}`,
              notes: notes || `Reconciled in bulk batch ${batchId} for ${runnerName}`
            }
          });
        }

        await (prisma as any).order.update({
          where: { id: order.id },
          data: { paymentStatus: 'COD_COLLECTED' }
        });

        await LedgerService.recordEntry({
          orderId: order.id,
          entryType: 'COD_COLLECTION',
          debitAccount: 'CAMPUS_BANK_CURRENT_ACCOUNT',
          creditAccount: 'DELIVERY_RUNNER_CASH_HOLD',
          amount: collectedAmt,
          referenceId: batchId,
          description: `Bulk COD reconciliation batch ${batchId}. Order #${order.orderNumber}. Runner: ${runnerName}.`,
          metadata: { batchId, runnerId: deliveryBoyId, runnerName, orderId: order.id, orderNumber: order.orderNumber }
        }).catch(() => {});
      }

      await AuditService.log(prisma, {
        userId: adminUserId,
        action: 'BULK_COD_RECONCILIATION',
        entity: 'DeliveryBoy',
        entityId: deliveryBoyId,
        newValue: {
          batchId,
          adminId: adminUserId,
          adminName,
          deliveryBoyId,
          deliveryBoyName: runnerName,
          ordersCount: eligibleOrders.length,
          totalExpectedAmount: totalExpectedReconciled,
          totalCollectedAmount: totalCollectedReconciled,
          totalDifference: 0,
          reconciledOrderNumbers,
          reconciledOrderIds,
          timestamp: new Date().toISOString(),
          notes: notes || 'Bulk reconciliation successfully executed'
        }
      }).catch(() => {});

      res.status(200).json({
        success: true,
        message: `Successfully reconciled ${eligibleOrders.length} orders for ${runnerName}. Batch ID: ${batchId}`,
        batchId,
        reconciledCount: eligibleOrders.length,
        totalReconciledAmount: totalCollectedReconciled,
        deliveryBoyName: runnerName,
        reconciledOrderIds,
        reconciledOrderNumbers
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Section 5.1: Delivery Boy All Student Orders (Operational View)
   * Dedicated operational order visibility - completely separate from COD financial reconciliation.
   */
  public static async getDeliveryBoyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        deliveryBoyId,
        orderType,      // 'ALL' | 'DELIVERY' | 'PICKUP'
        paymentMethod,  // 'ALL' | 'COD' | 'ONLINE'
        status,         // 'ALL' | 'ASSIGNED' | 'ACCEPTED' | 'PICKUP' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'RETURNED'
        providerId,
        dateRange,      // 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'
        search
      } = req.query;

      const [orders, deliveryBoys, providers, allReturns, allCods] = await Promise.all([
        (prisma as any).order.findMany({
          include: {
            items: true,
            student: { select: { fullName: true, mobileNumber: true, roomNumber: true, hallName: true, collegeEmail: true } },
            provider: { select: { id: true, fullName: true, mobileNumber: true } },
            statusHistory: true,
            laundryDetails: true,
            returnRequest: {
              include: {
                deliveryBoy: { select: { id: true, fullName: true, mobileNumber: true, vehicleType: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        (prisma as any).deliveryBoy.findMany({
          include: { user: true }
        }).catch(() => []),
        (prisma as any).serviceProvider.findMany().catch(() => []),
        (prisma as any).returnRequest.findMany({
          include: {
            deliveryBoy: true,
            order: {
              include: {
                items: true,
                student: true,
                provider: true
              }
            }
          }
        }).catch(() => []),
        (prisma as any).cODCollection.findMany().catch(() => [])
      ]);

      const runnerById = new Map<string, any>();
      for (const d of deliveryBoys) {
        const runnerInfo = {
          id: d.id,
          userId: d.userId,
          name: d.fullName || 'Campus Runner',
          fullName: d.fullName || 'Campus Runner',
          phone: d.mobileNumber || d.phone || d.user?.phone || '+91 98765 43220',
          vehicleType: d.vehicleType || 'Bicycle'
        };
        runnerById.set(d.id, runnerInfo);
        if (d.userId) {
          runnerById.set(d.userId, runnerInfo);
        }
      }

      const returnByOrderId = new Map<string, any>();
      for (const r of allReturns) {
        if (r.orderId) {
          returnByOrderId.set(r.orderId, r);
        }
      }

      const targetRunnerId = deliveryBoyId && deliveryBoyId !== 'ALL' ? String(deliveryBoyId).trim() : null;
      const targetRunnerIds = new Set<string>();
      if (targetRunnerId) {
        targetRunnerIds.add(targetRunnerId);
        const mapped = runnerById.get(targetRunnerId);
        if (mapped?.id) targetRunnerIds.add(mapped.id);
        if (mapped?.userId) targetRunnerIds.add(mapped.userId);
        for (const d of deliveryBoys) {
          if (d.id === targetRunnerId || d.userId === targetRunnerId || (d.fullName && d.fullName.toLowerCase() === targetRunnerId.toLowerCase())) {
            targetRunnerIds.add(d.id);
            if (d.userId) targetRunnerIds.add(d.userId);
          }
        }
      }

      const operationalRecords: any[] = [];

      for (const ord of orders) {
        const linkedReturn = ord.returnRequest || returnByOrderId.get(ord.id) || returnByOrderId.get(ord.orderNumber);
        const codEntry = allCods.find((c: any) => c.orderId === ord.id || c.orderId === ord.orderNumber);

        const assignedDeliveryRunnerId = ord.deliveryBoyId || codEntry?.deliveryBoyId || null;
        const deliveryRunner = assignedDeliveryRunnerId ? runnerById.get(assignedDeliveryRunnerId) : null;
        const hasDeliveryAssignment = Boolean(assignedDeliveryRunnerId);

        const assignedPickupRunnerId = linkedReturn?.deliveryBoyId || null;
        const pickupRunner = assignedPickupRunnerId ? runnerById.get(assignedPickupRunnerId) : null;
        const hasPickupAssignment = Boolean(assignedPickupRunnerId);

        const matchesDelivery = targetRunnerId
          ? Boolean(assignedDeliveryRunnerId && targetRunnerIds.has(assignedDeliveryRunnerId))
          : true;

        const matchesPickup = targetRunnerId
          ? Boolean(assignedPickupRunnerId && targetRunnerIds.has(assignedPickupRunnerId))
          : true;

        // If target runner was requested but handled neither delivery nor pickup, skip
        if (targetRunnerId && !matchesDelivery && !matchesPickup) {
          continue;
        }

        let resolvedOrderType: 'DELIVERY' | 'PICKUP' = 'DELIVERY';
        if (targetRunnerId) {
          if (matchesPickup && !matchesDelivery) {
            resolvedOrderType = 'PICKUP';
          } else {
            resolvedOrderType = 'DELIVERY';
          }
        } else {
          if (hasPickupAssignment && !hasDeliveryAssignment) {
            resolvedOrderType = 'PICKUP';
          } else {
            resolvedOrderType = 'DELIVERY';
          }
        }

        const isCod = ord.paymentMethod === 'CASH_ON_DELIVERY' ||
          ord.paymentMethod === 'COD' ||
          (typeof ord.paymentMethod === 'string' && ord.paymentMethod.toUpperCase().includes('COD'));
        const paymentType: 'COD' | 'ONLINE' = isCod ? 'COD' : 'ONLINE';

        const activities: any[] = [];

        if (linkedReturn && linkedReturn.deliveryBoyId) {
          activities.push({
            stage: 'PICKUP',
            type: 'PICKUP',
            runnerId: linkedReturn.deliveryBoyId,
            runnerName: pickupRunner?.fullName || 'Assigned Pickup Runner',
            runnerPhone: pickupRunner?.phone || 'N/A',
            status: linkedReturn.status === 'COMPLETED' ? 'PICKED_UP / COMPLETED' : (linkedReturn.status || 'PICKUP_ASSIGNED'),
            timestamp: linkedReturn.updatedAt || linkedReturn.createdAt,
            notes: linkedReturn.reasonType ? `Return Reason: ${linkedReturn.reasonType}` : 'Student return pickup'
          });
        }

        if (assignedDeliveryRunnerId) {
          activities.push({
            stage: 'DELIVERY',
            type: 'DELIVERY',
            runnerId: assignedDeliveryRunnerId,
            runnerName: deliveryRunner?.fullName || 'Assigned Delivery Runner',
            runnerPhone: deliveryRunner?.phone || 'N/A',
            status: ord.status,
            timestamp: ord.deliveredAt || ord.updatedAt || ord.createdAt,
            notes: `Delivery order status: ${ord.status}`
          });
        }

        const operationalStatus = (resolvedOrderType === 'PICKUP' && linkedReturn)
          ? (linkedReturn.status === 'COMPLETED' ? 'COMPLETED' : (linkedReturn.status === 'PICKUP_ASSIGNED' ? 'PICKUP' : linkedReturn.status))
          : ord.status;

        const activeRunner = resolvedOrderType === 'PICKUP' ? (pickupRunner || deliveryRunner) : (deliveryRunner || pickupRunner);
        const prov = providers.find((p: any) => p.id === ord.providerId) || ord.provider;

        const record = {
          id: ord.id,
          orderId: ord.id,
          orderNumber: ord.orderNumber || ord.id,
          student: {
            fullName: ord.student?.fullName || 'Campus Student',
            name: ord.student?.fullName || 'Campus Student',
            phone: ord.student?.mobileNumber || ord.student?.phone || 'N/A',
            mobileNumber: ord.student?.mobileNumber || ord.student?.phone || 'N/A',
            email: ord.student?.collegeEmail || ord.student?.email || 'N/A',
            roomNumber: ord.roomNumber || ord.student?.roomNumber || 'N/A',
            hallName: ord.hallName || ord.student?.hallName || 'N/A'
          },
          phone: ord.student?.mobileNumber || ord.student?.phone || 'N/A',
          provider: {
            id: ord.providerId,
            name: prov?.fullName || 'Campus Provider',
            fullName: prov?.fullName || 'Campus Provider',
            phone: prov?.mobileNumber || 'N/A'
          },
          providerName: prov?.fullName || 'Campus Provider',
          orderType: resolvedOrderType,
          payment: paymentType,
          paymentMethod: paymentType,
          orderAmount: Number(ord.totalAmount) || 0,
          totalAmount: Number(ord.totalAmount) || 0,
          orderStatus: operationalStatus,
          status: operationalStatus,
          deliveryBoy: activeRunner ? {
            id: activeRunner.id,
            name: activeRunner.fullName,
            fullName: activeRunner.fullName,
            phone: activeRunner.phone,
            role: resolvedOrderType === 'PICKUP' ? 'Pickup Runner' : 'Delivery Runner'
          } : null,
          deliveryBoyName: activeRunner?.fullName || 'Campus Runner',
          deliveryBoyPhone: activeRunner?.phone || 'N/A',
          deliveryRunner: deliveryRunner ? {
            id: deliveryRunner.id,
            name: deliveryRunner.fullName,
            phone: deliveryRunner.phone
          } : null,
          pickupRunner: pickupRunner ? {
            id: pickupRunner.id,
            name: pickupRunner.fullName,
            phone: pickupRunner.phone
          } : null,
          hasBothActivities: Boolean(hasDeliveryAssignment && hasPickupAssignment),
          activities,
          items: (ord.items || []).map((i: any) => ({
            name: i.productName || 'Item',
            quantity: i.quantity || 1,
            price: Number(i.unitPrice || i.price) || 0
          })),
          orderDate: ord.createdAt,
          createdAt: ord.createdAt
        };

        // 1. Order Type filter ('ALL' | 'DELIVERY' | 'PICKUP')
        if (orderType && orderType !== 'ALL') {
          if (orderType.toString().toUpperCase() === 'DELIVERY') {
            if (record.orderType !== 'DELIVERY' && !hasDeliveryAssignment) continue;
          } else if (orderType.toString().toUpperCase() === 'PICKUP') {
            if (record.orderType !== 'PICKUP' && !hasPickupAssignment) continue;
          }
        }

        // 2. Payment Method filter ('ALL' | 'COD' | 'ONLINE')
        if (paymentMethod && paymentMethod !== 'ALL') {
          if (record.payment !== paymentMethod.toString().toUpperCase()) continue;
        }

        // 3. Status filter
        if (status && status !== 'ALL') {
          const s = String(status).toUpperCase();
          const ordS = String(record.orderStatus).toUpperCase();
          if (s === 'OUT FOR DELIVERY') {
            if (!ordS.includes('OUT') && !ordS.includes('TRANSIT')) continue;
          } else if (s === 'PICKUP') {
            if (!ordS.includes('PICKUP') && !ordS.includes('PICKED')) continue;
          } else if (s === 'ASSIGNED') {
            if (!ordS.includes('ASSIGNED')) continue;
          } else if (s === 'ACCEPTED') {
            if (!ordS.includes('ACCEPTED')) continue;
          } else if (s === 'DELIVERED') {
            if (ordS !== 'DELIVERED') continue;
          } else if (s === 'COMPLETED') {
            if (ordS !== 'COMPLETED' && ordS !== 'DELIVERED') continue;
          } else if (s === 'CANCELLED') {
            if (!ordS.includes('CANCEL')) continue;
          } else if (s === 'RETURNED') {
            if (!ordS.includes('RETURN')) continue;
          } else {
            if (ordS !== s) continue;
          }
        }

        // 4. Provider filter
        if (providerId && providerId !== 'ALL') {
          if (ord.providerId !== providerId) continue;
        }

        // 5. Date Range filter
        if (dateRange && dateRange !== 'ALL') {
          const d = new Date(ord.createdAt);
          const now = new Date();
          if (dateRange === 'TODAY') {
            if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth() || d.getDate() !== now.getDate()) {
              continue;
            }
          } else if (dateRange === 'THIS_WEEK') {
            if ((Date.now() - d.getTime()) > (7 * 24 * 60 * 60 * 1000)) {
              continue;
            }
          } else if (dateRange === 'THIS_MONTH') {
            if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) {
              continue;
            }
          }
        }

        // 6. Search query
        if (search) {
          const q = String(search).toLowerCase().trim();
          const matchNum = record.orderNumber.toLowerCase().includes(q);
          const matchStudent = record.student.name.toLowerCase().includes(q);
          const matchPhone = record.phone.toLowerCase().includes(q);
          const matchRunner = (record.deliveryBoyName || '').toLowerCase().includes(q);
          if (!matchNum && !matchStudent && !matchPhone && !matchRunner) {
            continue;
          }
        }

        operationalRecords.push(record);
      }

      res.status(200).json({
        success: true,
        count: operationalRecords.length,
        orders: operationalRecords,
        deliveryBoys: Array.from(runnerById.values())
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
      sortBy,
      paymentFailureReason
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
        failureReason: o.payment?.failureReason || (normalizedPayStatus === 'FAILED' ? 'Payment Failed at Gateway' : 'N/A'),
        failureCode: o.payment?.failureCode || (o.paymentStatus === 'FAILED_ACCOUNT_DETAILS' ? 'FAILED_ACCOUNT_DETAILS' : null),
        paymentFailureReason: o.payment?.failureReason || (o.paymentStatus === 'FAILED_ACCOUNT_DETAILS' ? 'BANK/ACCOUNT DETAILS REQUIRED' : (normalizedPayStatus === 'FAILED' ? 'UNKNOWN' : 'N/A')),
        paymentFailureCode: o.payment?.failureCode || (o.paymentStatus === 'FAILED_ACCOUNT_DETAILS' ? 'FAILED_ACCOUNT_DETAILS' : null),
        paymentAttemptCount: o.payment?.attemptNumber || 1,
        paymentAttempts,
        reconciliationStatus: o.reconciliationStatus || 'NOT_REQUIRED',
        paymentReconciliationStatus: o.payment?.reconciliationStatus || 'NOT_REQUIRED',
        reconciledAt: o.payment?.reconciledAt || null,
        reconciliationTimestamp: o.payment?.reconciliationTimestamp || o.payment?.reconciledAt || null,
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

    // 4b. Payment Failure Reason Filter
    if (paymentFailureReason && paymentFailureReason !== 'ALL') {
      if (paymentFailureReason === 'FAILED') {
        filtered = filtered.filter(
          (o) =>
            o.paymentStatus === 'FAILED' ||
            o.paymentStatus === 'FAILED_ACCOUNT_DETAILS' ||
            (o.paymentFailureReason && o.paymentFailureReason !== 'N/A')
        );
      } else if (paymentFailureReason === 'FAILED_ACCOUNT_DETAILS') {
        filtered = filtered.filter(
          (o) =>
            o.paymentFailureReason === 'BANK/ACCOUNT DETAILS REQUIRED' ||
            o.paymentStatus === 'FAILED_ACCOUNT_DETAILS'
        );
      } else if (paymentFailureReason === 'PAYMENT_DECLINED') {
        filtered = filtered.filter((o) => o.paymentFailureReason === 'PAYMENT DECLINED');
      } else if (paymentFailureReason === 'PAYMENT_TIMEOUT') {
        filtered = filtered.filter((o) => o.paymentFailureReason === 'PAYMENT TIMEOUT');
      } else if (paymentFailureReason === 'RAZORPAY_ERROR') {
        filtered = filtered.filter((o) => o.paymentFailureReason === 'RAZORPAY ERROR');
      } else if (paymentFailureReason === 'NETWORK_TECHNICAL_ERROR') {
        filtered = filtered.filter((o) => o.paymentFailureReason === 'NETWORK/TECHNICAL ERROR');
      } else if (paymentFailureReason === 'UNKNOWN') {
        filtered = filtered.filter((o) => o.paymentFailureReason === 'UNKNOWN');
      } else {
        filtered = filtered.filter((o) => o.paymentFailureReason === paymentFailureReason);
      }
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
          o.itemsSummary.toLowerCase().includes(q) ||
          (o.razorpayOrderId && o.razorpayOrderId.toLowerCase().includes(q)) ||
          (o.razorpayPaymentId && o.razorpayPaymentId.toLowerCase().includes(q))
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
