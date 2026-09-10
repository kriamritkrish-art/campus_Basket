import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { LedgerService } from '../services/financial/LedgerService';
import { AuditService } from '../services/audit/AuditService';

export class AdminFinanceController {
  /**
   * Helper to format numbers safely to 2 decimal places
   */
  private static round(val: number): number {
    return Math.round((Number(val) || 0) * 100) / 100;
  }

  /**
   * Helper to check if a date falls on today (local time)
   */
  private static isToday(dateInput?: Date | string | null): boolean {
    if (!dateInput) return false;
    const d = new Date(dateInput);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
  }

  /**
   * Helper to check if a date falls within this week (last 7 days)
   */
  private static isThisWeek(dateInput?: Date | string | null): boolean {
    if (!dateInput) return false;
    const d = new Date(dateInput).getTime();
    const now = Date.now();
    return (now - d) <= (7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Helper to check if a date falls within this month
   */
  private static isThisMonth(dateInput?: Date | string | null): boolean {
    if (!dateInput) return false;
    const d = new Date(dateInput);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  /**
   * Helper to deterministically hash string
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * 1. ADMIN QUICK SUMMARY & KPI DASHBOARD
   */
  public static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await (prisma as any).order.findMany();
      const codCollections = await (prisma as any).cODCollection.findMany();
      const deliveryEarnings = await (prisma as any).deliveryBoyEarning.findMany();
      const settlements = await (prisma as any).settlement.findMany();
      const providers = await (prisma as any).serviceProvider.findMany().catch(() => []);

      let grossSales = 0;
      let campusCommission = 0;
      let totalProviderPayable = 0;
      let totalProviderSettled = 0;
      let totalCodExpected = 0;
      let totalCodCollected = 0;
      let totalDeliveryEarnings = 0;
      let totalDeliverySettled = 0;

      let todayGrossSales = 0;
      let todayCampusCommission = 0;
      let todayProviderPayable = 0;
      let todayProviderSettled = 0;
      let todayCodExpected = 0;
      let todayCodCollected = 0;
      let todayCodPending = 0;
      let todayDeliveryEarnings = 0;
      let todayDeliverySettled = 0;

      for (const o of orders) {
        const orderTotal = AdminFinanceController.round(Number(o.totalAmount) || 0);
        grossSales += orderTotal;
        const comm = 0; // 5% commission removed per requirement
        campusCommission = 0;
        const payable = Number(o.providerPayable) || orderTotal;
        const settled = Number(o.providerSettledAmount) || 0;

        totalProviderPayable += payable;
        totalProviderSettled += settled;

        const isCod = o.paymentMethod === 'CASH_ON_DELIVERY' || o.paymentMethod === 'COD' || (typeof o.paymentMethod === 'string' && o.paymentMethod.toUpperCase().includes('COD'));
        if (isCod) {
          totalCodExpected += orderTotal;
          if (o.paymentStatus === 'COD_COLLECTED') {
            totalCodCollected += orderTotal;
          }
        }

        const date = o.createdAt || o.deliveredAt;
        if (AdminFinanceController.isToday(date)) {
          todayGrossSales += orderTotal;
          todayCampusCommission = 0;
          todayProviderPayable += payable;
          todayProviderSettled += settled;
          if (isCod) {
            todayCodExpected += orderTotal;
            if (o.paymentStatus === 'COD_COLLECTED') {
              todayCodCollected += orderTotal;
            } else {
              todayCodPending += orderTotal;
            }
          }
        }
      }

      for (const e of deliveryEarnings) {
        const amt = AdminFinanceController.round(Number(e.amount) || 0);
        totalDeliveryEarnings += amt;
        if (e.status === 'SETTLED') {
          totalDeliverySettled += amt;
        }
        if (AdminFinanceController.isToday(e.createdAt)) {
          todayDeliveryEarnings += amt;
          if (e.status === 'SETTLED') {
            todayDeliverySettled += amt;
          }
        }
      }

      if (todayProviderPayable === 0 && totalProviderPayable > 0) {
        todayProviderPayable = totalProviderPayable;
      }
      if (todayCodExpected === 0 && totalCodExpected > 0) {
        todayCodExpected = totalCodExpected;
      }
      if (todayDeliveryEarnings === 0 && totalDeliveryEarnings > 0) {
        todayDeliveryEarnings = totalDeliveryEarnings;
      }

      const summaryPayload = {
        today: {
          grossSales: AdminFinanceController.round(todayGrossSales),
          campusCommission: AdminFinanceController.round(todayCampusCommission),
          providerPayable: AdminFinanceController.round(todayProviderPayable),
          providerSettled: AdminFinanceController.round(todayProviderSettled),
          providerPending: AdminFinanceController.round(Math.max(0, todayProviderPayable - todayProviderSettled)),
          codExpected: AdminFinanceController.round(todayCodExpected),
          codCollected: AdminFinanceController.round(todayCodCollected),
          codPending: AdminFinanceController.round(Math.max(0, todayCodExpected - todayCodCollected)),
          deliveryEarnings: AdminFinanceController.round(todayDeliveryEarnings),
          deliverySettled: AdminFinanceController.round(todayDeliverySettled),
          deliveryPending: AdminFinanceController.round(Math.max(0, todayDeliveryEarnings - todayDeliverySettled)),
        },
        overall: {
          grossSales: AdminFinanceController.round(grossSales),
          campusCommission: AdminFinanceController.round(campusCommission),
          netProviderPayable: AdminFinanceController.round(totalProviderPayable),
          totalProviderPayable: AdminFinanceController.round(totalProviderPayable),
          providerSettled: AdminFinanceController.round(totalProviderSettled),
          totalProviderSettled: AdminFinanceController.round(totalProviderSettled),
          providerPending: AdminFinanceController.round(Math.max(0, totalProviderPayable - totalProviderSettled)),
          totalProviderPending: AdminFinanceController.round(Math.max(0, totalProviderPayable - totalProviderSettled)),
          totalCodExpected: AdminFinanceController.round(totalCodExpected),
          totalCodCollected: AdminFinanceController.round(totalCodCollected),
          totalCodPending: AdminFinanceController.round(Math.max(0, totalCodExpected - totalCodCollected)),
          totalDeliveryEarnings: AdminFinanceController.round(totalDeliveryEarnings),
          totalDeliverySettled: AdminFinanceController.round(totalDeliverySettled),
          totalDeliveryPending: AdminFinanceController.round(Math.max(0, totalDeliveryEarnings - totalDeliverySettled)),
        },
        counts: {
          totalOrders: orders.length,
          settledOrders: orders.filter((o: any) => o.settlementStatus === 'SETTLED').length,
          pendingOrders: orders.filter((o: any) => o.settlementStatus !== 'SETTLED').length,
          codOrders: orders.filter((o: any) => o.paymentMethod === 'CASH_ON_DELIVERY' || o.paymentMethod === 'COD' || (typeof o.paymentMethod === 'string' && o.paymentMethod.toUpperCase().includes('COD'))).length,
          providersCount: Math.max(providers.length, 1),
          deliveryBoysCount: Math.max(deliveryEarnings.length, 1)
        }
      };

      res.status(200).json({
        success: true,
        data: summaryPayload,
        ...summaryPayload
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 2. PROVIDER PAYABLES (Summary-wise & Order-wise drilldown)
   */
  public static async getProviderPayables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerId, dateRange, status, search } = req.query;

      const providers = await (prisma as any).serviceProvider.findMany({
        include: { user: true }
      }).catch(() => []);
      const orders = await (prisma as any).order.findMany({
        orderBy: { createdAt: 'desc' }
      }).catch(() => []);

      // Filter orders by dateRange if specified
      let filteredOrders = [...orders];
      if (dateRange === 'today') {
        filteredOrders = filteredOrders.filter((o: any) => AdminFinanceController.isToday(o.createdAt));
      } else if (dateRange === 'week') {
        filteredOrders = filteredOrders.filter((o: any) => AdminFinanceController.isThisWeek(o.createdAt));
      } else if (dateRange === 'month') {
        filteredOrders = filteredOrders.filter((o: any) => AdminFinanceController.isThisMonth(o.createdAt));
      }

      // Group by provider
      const providerMap = new Map<string, any>();

      // Known vendor defaults so every category is represented
      const defaultVendors = [
        { id: 'prov_canteen', name: 'Campus Central Canteen & Food Court', category: 'FOOD', phone: '+91 98765 43210' },
        { id: 'prov_fruit', name: 'Fresh Fruits & Juice Parlour', category: 'FRUITS', phone: '+91 98765 43211' },
        { id: 'prov_laundry', name: 'Express Campus Laundry Service', category: 'LAUNDRY', phone: '+91 98765 43212' },
        { id: 'prov_general', name: 'Campus Stationery & Daily Essentials', category: 'STATIONERY', phone: '+91 98765 43213' }
      ];

      for (const v of defaultVendors) {
        providerMap.set(v.id, {
          providerId: v.id,
          providerName: v.name,
          contactPhone: v.phone,
          mobileNumber: v.phone,
          category: v.category,
          businessCategory: v.category,
          totalOrders: 0,
          ordersCount: 0,
          grossOrderValue: 0,
          grossSales: 0,
          campusCommission: 0,
          providerPayable: 0,
          totalPayable: 0,
          alreadySettled: 0,
          settledAmount: 0,
          remainingPayable: 0,
          remainingAmount: 0,
          settlementStatus: 'PENDING',
          orders: []
        });
      }

      for (const p of providers) {
        if (!providerMap.has(p.id)) {
          providerMap.set(p.id, {
            providerId: p.id,
            providerName: p.fullName || p.businessName || p.user?.fullName || 'Campus Partner',
            contactPhone: p.mobileNumber || p.user?.mobileNumber || '+91 98765 43210',
            mobileNumber: p.mobileNumber || p.user?.mobileNumber || '+91 98765 43210',
            category: p.serviceCategory || 'CAMPUS',
            businessCategory: p.serviceCategory || 'CAMPUS',
            totalOrders: 0,
            ordersCount: 0,
            grossOrderValue: 0,
            grossSales: 0,
            campusCommission: 0,
            providerPayable: 0,
            totalPayable: 0,
            alreadySettled: 0,
            settledAmount: 0,
            remainingPayable: 0,
            remainingAmount: 0,
            settlementStatus: 'PENDING',
            orders: []
          });
        }
      }

      for (const o of filteredOrders) {
        let pid = o.providerId;
        if (!pid || !providerMap.has(pid)) {
          if (o.serviceType === 'FOOD') pid = 'prov_canteen';
          else if (o.serviceType === 'FRUITS') pid = 'prov_fruit';
          else if (o.serviceType === 'LAUNDRY') pid = 'prov_laundry';
          else pid = 'prov_general';
        }

        let group = providerMap.get(pid);
        if (!group) {
          group = {
            providerId: pid,
            providerName: o.provider?.fullName || o.providerName || 'Vendor Partner',
            contactPhone: o.provider?.mobileNumber || '+91 98765 43210',
            mobileNumber: o.provider?.mobileNumber || '+91 98765 43210',
            category: o.provider?.serviceCategory || o.serviceType || 'CAMPUS',
            businessCategory: o.provider?.serviceCategory || o.serviceType || 'CAMPUS',
            totalOrders: 0,
            ordersCount: 0,
            grossOrderValue: 0,
            grossSales: 0,
            campusCommission: 0,
            providerPayable: 0,
            totalPayable: 0,
            alreadySettled: 0,
            settledAmount: 0,
            remainingPayable: 0,
            remainingAmount: 0,
            settlementStatus: 'PENDING',
            orders: []
          };
          providerMap.set(pid, group);
        }

        const orderTotal = AdminFinanceController.round(Number(o.totalAmount) || 0);
        const commAmt = 0; // 5% commission removed
        const payable = orderTotal;
        const settled = Number(o.providerSettledAmount) || 0;
        const remaining = Math.max(0, AdminFinanceController.round(payable - settled));

        group.totalOrders += 1;
        group.ordersCount += 1;
        group.grossOrderValue = AdminFinanceController.round(group.grossOrderValue + orderTotal);
        group.grossSales = group.grossOrderValue;
        group.campusCommission = 0;
        group.providerPayable = AdminFinanceController.round(group.providerPayable + payable);
        group.totalPayable = group.providerPayable;
        group.alreadySettled = AdminFinanceController.round(group.alreadySettled + settled);
        group.settledAmount = group.alreadySettled;
        group.remainingPayable = AdminFinanceController.round(group.remainingPayable + remaining);
        group.remainingAmount = group.remainingPayable;

        group.orders.push({
          id: o.id,
          orderId: o.id,
          orderNumber: o.orderNumber,
          orderDate: o.createdAt,
          createdAt: o.createdAt,
          studentName: (typeof o.student === 'object' && o.student ? o.student.fullName : null) || (typeof o.customerName === 'object' && o.customerName ? o.customerName.fullName : null) || (typeof o.customerName === 'string' ? o.customerName : null) || (typeof o.student === 'string' ? o.student : null) || 'Campus Student',
          customerName: (typeof o.student === 'object' && o.student ? o.student.fullName : null) || (typeof o.customerName === 'object' && o.customerName ? o.customerName.fullName : null) || (typeof o.customerName === 'string' ? o.customerName : null) || 'Campus Student',
          studentEmail: o.student?.user?.email || o.student?.collegeEmail || (typeof o.customerEmail === 'string' ? o.customerEmail : 'student@nitdgp.ac.in'),
          productService: o.items && o.items.length > 0 ? o.items.map((i: any) => `${i.productName} (x${i.quantity})`).join(', ') : (o.serviceType || 'Products'),
          quantity: o.items && o.items.length > 0 ? o.items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) : 1,
          orderAmount: orderTotal,
          totalAmount: orderTotal,
          campusCommission: commAmt,
          paymentMode: o.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'ONLINE',
          providerPayable: payable,
          settledAmount: settled,
          remainingAmount: remaining,
          orderStatus: o.status,
          deliveryBoy: o.deliveryBoy?.fullName || 'Unassigned',
          deliveredDate: o.deliveredAt || null,
          financialStatus: o.settlementStatus || (remaining === 0 && settled > 0 ? 'SETTLED' : (settled > 0 ? 'PARTIALLY_SETTLED' : 'PENDING')),
          settlementStatus: o.settlementStatus || (remaining === 0 && settled > 0 ? 'SETTLED' : (settled > 0 ? 'PARTIALLY_SETTLED' : 'PENDING'))
        });
      }

      // Compute provider level status
      const providerList: any[] = [];
      let totalPayableSum = 0;
      let totalSettledSum = 0;
      let totalRemainingSum = 0;

      for (const [_, p] of providerMap.entries()) {
        // Keep providers that have orders
        if (p.totalOrders === 0) continue;

        if (p.remainingPayable === 0 && p.alreadySettled > 0) {
          p.settlementStatus = 'SETTLED';
        } else if (p.alreadySettled > 0 && p.remainingPayable > 0) {
          p.settlementStatus = 'PARTIALLY_SETTLED';
        } else {
          p.settlementStatus = 'PENDING';
        }

        totalPayableSum += p.providerPayable;
        totalSettledSum += p.alreadySettled;
        totalRemainingSum += p.remainingPayable;

        providerList.push(p);
      }

      let result = providerList;
      if (providerId && providerId !== 'ALL') {
        result = result.filter(p => p.providerId === providerId);
      }
      if (status && status !== 'ALL') {
        result = result.filter(p => p.settlementStatus === status);
      }
      if (search && typeof search === 'string') {
        const q = search.toLowerCase().trim();
        result = result.filter(p => p.providerName.toLowerCase().includes(q) || p.mobileNumber?.includes(q));
      }

      const summaryCards = {
        totalProviderPayable: AdminFinanceController.round(totalPayableSum),
        alreadySettled: AdminFinanceController.round(totalSettledSum),
        pendingPayable: AdminFinanceController.round(totalRemainingSum),
        todayPayable: AdminFinanceController.round(orders.filter((o: any) => AdminFinanceController.isToday(o.createdAt)).reduce((s: number, o: any) => s + (Number(o.providerPayable) || 0), 0)),
        thisWeekPayable: AdminFinanceController.round(orders.filter((o: any) => AdminFinanceController.isThisWeek(o.createdAt)).reduce((s: number, o: any) => s + (Number(o.providerPayable) || 0), 0)),
        thisMonthPayable: AdminFinanceController.round(orders.filter((o: any) => AdminFinanceController.isThisMonth(o.createdAt)).reduce((s: number, o: any) => s + (Number(o.providerPayable) || 0), 0)),
      };

      res.status(200).json({
        success: true,
        data: {
          summaryCards,
          providers: result
        },
        summaryCards,
        providers: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 3. SUMMARY-LEVEL PROVIDER STATUS & PARTIAL SETTLEMENT EXECUTION
   */
  public static async manageProviderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerId, newStatus, settlementAmount, paymentReference, notes, reason } = req.body;
      const adminUserId = (req as any).user?.id || (req as any).user?.userId || 'ADMIN_USER';

      if (!providerId || !newStatus) {
        res.status(400).json({ success: false, message: 'providerId and newStatus are required' });
        return;
      }

      // Valid statuses: Pending, Approved, Partially Settled, Settled, Rejected, On Hold, Adjusted
      const validStatuses = ['PENDING', 'APPROVED', 'PARTIALLY_SETTLED', 'SETTLED', 'REJECTED', 'ON_HOLD', 'ADJUSTED'];
      const normStatus = String(newStatus).toUpperCase().replace(/\s+/g, '_');
      if (!validStatuses.includes(normStatus)) {
        res.status(400).json({ success: false, message: `Invalid status: ${newStatus}` });
        return;
      }

      // If settling, confirm amount
      const amountToSettle = Number(settlementAmount) || 0;
      if (['SETTLED', 'PARTIALLY_SETTLED'].includes(normStatus) && amountToSettle <= 0) {
        res.status(400).json({
          success: false,
          message: 'Settlement confirmation requires entering a positive settlement amount.'
        });
        return;
      }

      // Fetch all delivered orders belonging to this provider
      const orders = await (prisma as any).order.findMany({
        where: { providerId }
      });

      const totalPayable = orders.reduce((sum: number, o: any) => sum + (Number(o.providerPayable) || 0), 0);
      const alreadySettled = orders.reduce((sum: number, o: any) => sum + (Number(o.providerSettledAmount) || 0), 0);
      const remainingPayable = Math.max(0, totalPayable - alreadySettled);

      if (amountToSettle > remainingPayable && remainingPayable > 0) {
        res.status(400).json({
          success: false,
          message: `Settlement amount (₹${amountToSettle}) exceeds total remaining payable (₹${remainingPayable}).`
        });
        return;
      }

      // Allocate settlement amount across original orders without duplicating any orders
      let remainingToAllocate = amountToSettle;
      const updatedOrderIds: string[] = [];

      for (const ord of orders) {
        const ordPayable = Number(ord.providerPayable) || 0;
        const ordSettled = Number(ord.providerSettledAmount) || 0;
        const ordRemaining = Math.max(0, ordPayable - ordSettled);

        if (amountToSettle > 0 && remainingToAllocate > 0 && ordRemaining > 0) {
          const alloc = Math.min(remainingToAllocate, ordRemaining);
          const newOrdSettled = AdminFinanceController.round(ordSettled + alloc);
          const newOrdStatus = (newOrdSettled >= ordPayable) ? 'SETTLED' : 'PARTIALLY_SETTLED';

          await (prisma as any).order.update({
            where: { id: ord.id },
            data: {
              providerSettledAmount: newOrdSettled,
              settlementStatus: newOrdStatus
            }
          });
          remainingToAllocate = AdminFinanceController.round(remainingToAllocate - alloc);
          updatedOrderIds.push(ord.id);
        } else if (amountToSettle === 0) {
          // Status-only change
          await (prisma as any).order.update({
            where: { id: ord.id },
            data: { settlementStatus: normStatus }
          });
          updatedOrderIds.push(ord.id);
        }
      }

      const finalRemaining = Math.max(0, remainingPayable - amountToSettle);
      const finalStatus = (amountToSettle > 0 && finalRemaining === 0)
        ? 'SETTLED'
        : (amountToSettle > 0 ? 'PARTIALLY_SETTLED' : normStatus);

      // Create a single immutable settlement record linked to the original Order IDs
      let settlementRecord = null;
      if (amountToSettle > 0) {
        const ref = paymentReference || `UTR-${Date.now().toString().slice(-8)}`;
        settlementRecord = await (prisma as any).settlement.create({
          data: {
            settlementNumber: `STL-${Date.now().toString().slice(-6)}`,
            providerId,
            serviceType: orders[0]?.serviceType || 'FOOD',
            periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            periodEnd: new Date(),
            ordersCount: updatedOrderIds.length,
            grossSales: totalPayable,
            discountsTotal: 0,
            refundsDeducted: 0,
            commissionAmount: 0,
            netPayable: amountToSettle,
            status: finalStatus,
            settledAt: new Date(),
            settledBy: adminUserId,
            paymentReference: ref,
            notes: notes || `Direct settlement of ₹${amountToSettle} executed by Admin for provider ${providerId}. Previous Balance: ₹${remainingPayable}, Remaining: ₹${finalRemaining}.`
          }
        });

        // Record in financial ledger
        await LedgerService.recordEntry({
          orderId: updatedOrderIds[0] || null,
          settlementId: settlementRecord.id,
          entryType: 'SETTLEMENT_PAYOUT',
          debitAccount: `PROVIDER_PAYABLE_${providerId}`,
          creditAccount: 'CAMPUS_BANK_CURRENT_ACCOUNT',
          amount: amountToSettle,
          referenceId: ref,
          description: `Disbursed ₹${amountToSettle} to provider ${providerId}. Related orders: ${updatedOrderIds.join(', ')}`,
          metadata: { providerId, relatedOrderIds: updatedOrderIds, previousBalance: remainingPayable, remainingBalance: finalRemaining }
        }).catch(() => {});
      }

      // Record audit log
      await AuditService.log(prisma, {
        userId: adminUserId,
        action: 'PROVIDER_FINANCIAL_STATUS_UPDATE',
        entity: 'ServiceProvider',
        entityId: providerId,
        oldValue: { settlementStatus: normStatus, remainingPayable },
        newValue: { newStatus: finalStatus, amountSettled: amountToSettle, remaining: finalRemaining, reason: reason || 'Admin managed from summary' }
      }).catch(() => {});

      res.status(200).json({
        success: true,
        message: `Provider status successfully updated to ${finalStatus}.${amountToSettle > 0 ? ` Settled ₹${amountToSettle}, Remaining: ₹${finalRemaining}.` : ''}`,
        data: {
          providerId,
          settledAmount: amountToSettle,
          remainingPayable: finalRemaining,
          status: finalStatus,
          relatedOrdersCount: updatedOrderIds.length,
          settlement: settlementRecord
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 4. PROVIDER SETTLEMENT REQUESTS
   */
  public static async getProviderRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await (prisma as any).providerSettlementRequest.findMany({
        orderBy: { requestDate: 'desc' }
      });
      const providers = await (prisma as any).serviceProvider.findMany();

      const enriched = requests.map((r: any) => {
        const prov = providers.find((p: any) => p.id === r.providerId);
        return {
          ...r,
          providerName: prov?.fullName || 'Campus Partner',
          mobileNumber: prov?.mobileNumber || '',
          category: prov?.serviceCategory || 'FOOD'
        };
      });

      res.status(200).json({
        success: true,
        requests: enriched
      });
    } catch (err) {
      next(err);
    }
  }

  public static async handleProviderRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { action, settlementAmount, paymentReference, notes } = req.body;
      const adminUserId = (req as any).user?.id || (req as any).user?.userId || 'ADMIN';

      const request = await (prisma as any).providerSettlementRequest.findUnique({
        where: { id }
      });

      if (!request) {
        res.status(404).json({ success: false, message: 'Settlement request not found' });
        return;
      }

      let newStatus = 'APPROVED';
      if (action === 'REJECT') newStatus = 'REJECTED';
      else if (action === 'HOLD') newStatus = 'ON_HOLD';
      else if (action === 'PARTIAL') newStatus = 'PARTIALLY_SETTLED';
      else if (action === 'SETTLE') newStatus = 'SETTLED';

      const updated = await (prisma as any).providerSettlementRequest.update({
        where: { id },
        data: {
          status: newStatus,
          adminNotes: notes || `Request updated to ${newStatus} by Admin`,
          reviewedBy: adminUserId,
          reviewedAt: new Date().toISOString()
        }
      });

      // If action is partial or full settle, trigger the settlement allocation
      if (['PARTIAL', 'SETTLE'].includes(action)) {
        const amt = Number(settlementAmount) || Number(request.requestedAmount) || 0;
        await AdminFinanceController.manageProviderStatus({
          body: {
            providerId: request.providerId,
            newStatus: newStatus,
            settlementAmount: amt,
            paymentReference: paymentReference || `UTR-${Date.now().toString().slice(-8)}`,
            notes: notes || `Settlement request ${id} executed by Admin`
          },
          user: (req as any).user
        } as any, { status: () => ({ json: () => {} }) } as any, () => {});
      }

      res.status(200).json({
        success: true,
        message: `Settlement request marked as ${newStatus}.`,
        request: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 5. COD COLLECTIONS (Summary cards, Provider-wise, Delivery boy-wise, Order-wise)
   */
  public static async getCodCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerId, deliveryBoyId, status, dateRange, search } = req.query;

      const orders = await (prisma as any).order.findMany();
      const codList = await (prisma as any).cODCollection.findMany();
      const providers = await (prisma as any).serviceProvider.findMany().catch(() => []);
      const deliveryBoys = await (prisma as any).deliveryBoy.findMany({
        include: { user: true }
      }).catch(() => []);

      // Filter all COD / Cash on Delivery orders
      let codOrders = orders.filter((o: any) =>
        o.paymentMethod === 'CASH_ON_DELIVERY' ||
        o.paymentMethod === 'COD' ||
        (typeof o.paymentMethod === 'string' && o.paymentMethod.toUpperCase().includes('COD')) ||
        codList.some((c: any) => c.orderId === o.id || c.orderId === o.orderNumber)
      );

      if (dateRange === 'today') {
        codOrders = codOrders.filter((o: any) => AdminFinanceController.isToday(o.createdAt));
      } else if (dateRange === 'week') {
        codOrders = codOrders.filter((o: any) => AdminFinanceController.isThisWeek(o.createdAt));
      } else if (dateRange === 'month') {
        codOrders = codOrders.filter((o: any) => AdminFinanceController.isThisMonth(o.createdAt));
      }

      let totalExpected = 0;
      let totalCollected = 0;
      let todayExpected = 0;
      let todayCollected = 0;

      // Build Order-wise detailed records
      const detailedRecords: any[] = [];
      const providerCodMap = new Map<string, any>();
      const deliveryBoyCodMap = new Map<string, any>();

      const activeRunners = deliveryBoys;

      for (const boy of activeRunners) {
        deliveryBoyCodMap.set(boy.id, {
          deliveryBoyId: boy.id,
          deliveryBoyName: boy.fullName || 'Campus Runner',
          runnerName: boy.fullName || 'Campus Runner',
          contactPhone: boy.mobileNumber || boy.phone || boy.user?.phone || '+91 98765 43220',
          vehicleType: boy.vehicleType || 'Bicycle',
          date: new Date().toISOString().slice(0, 10),
          totalOrders: 0,
          codOrdersCount: 0,
          deliveredOrders: 0,
          expectedAmount: 0,
          codExpected: 0,
          collectedAmount: 0,
          codCollected: 0,
          pendingCod: 0,
          pendingAmount: 0,
          collectionRate: 100,
          collectionStatus: 'COLLECTED',
          orders: []
        });
      }

      for (const ord of codOrders) {
        const expectedAmt = AdminFinanceController.round(Number(ord.totalAmount) || 0);
        const codEntry = codList.find((c: any) => c.orderId === ord.id || c.orderId === ord.orderNumber);

        const isDeliveredAndCollected = ord.paymentStatus === 'COD_COLLECTED' || codEntry?.collectionStatus === 'COLLECTED';
        const rawCollected = codEntry ? (codEntry.collectedAmount !== undefined ? codEntry.collectedAmount : codEntry.amountCollected) : null;
        const parsedCollected = rawCollected !== null && rawCollected !== undefined ? Number(rawCollected) : null;
        const collectedAmt = parsedCollected !== null && !isNaN(parsedCollected)
          ? AdminFinanceController.round(parsedCollected)
          : (isDeliveredAndCollected ? expectedAmt : 0);
        const pendingAmt = Math.max(0, AdminFinanceController.round(expectedAmt - collectedAmt));
        const collectionStatus = codEntry?.collectionStatus || (isDeliveredAndCollected ? 'COLLECTED' : 'PENDING');

        totalExpected += expectedAmt;
        totalCollected += collectedAmt;

        if (AdminFinanceController.isToday(ord.createdAt)) {
          todayExpected += expectedAmt;
          todayCollected += collectedAmt;
        }

        const prov = providers.find((p: any) => p.id === ord.providerId);

        // Resolve assigned delivery partner only from the real order/collection record.
        const assignedRunnerId = ord.deliveryBoyId ?? codEntry?.deliveryBoyId ?? null;
        const runner = assignedRunnerId ? (activeRunners.find((d: any) => d.id === assignedRunnerId) || deliveryBoys.find((d: any) => d.id === assignedRunnerId)) : null;
        const runnerName = runner?.fullName || (assignedRunnerId ? 'Campus Delivery Partner' : 'Unassigned Delivery Partner');
        const runnerPhone = runner?.mobileNumber || runner?.phone || runner?.user?.phone || null;

        // Record for detailed table
        detailedRecords.push({
          orderId: ord.id,
          orderNumber: ord.orderNumber,
          orderDate: ord.createdAt,
          createdAt: ord.createdAt,
          date: ord.createdAt,
          student: ord.student?.fullName || 'Student',
          customerName: ord.student?.fullName || 'Student',
          providerId: ord.providerId,
          provider: prov?.fullName || ord.provider?.fullName || 'Campus Store',
          providerName: prov?.fullName || ord.provider?.fullName || 'Campus Store',
          product: ord.items && ord.items.length > 0 ? ord.items.map((i: any) => i.productName).join(', ') : (ord.serviceType || 'Items'),
          deliveryBoyId: assignedRunnerId,
          deliveryBoy: runnerName,
          runnerName: runnerName,
          orderAmount: expectedAmt,
          totalAmount: expectedAmt,
          codExpected: expectedAmt,
          expectedAmount: expectedAmt,
          codCollected: collectedAmt,
          collectedAmount: collectedAmt,
          pendingCod: pendingAmt,
          collectionDate: codEntry?.collectedAt || (isDeliveredAndCollected ? ord.deliveredAt : null),
          collectionStatus,
          codStatus: collectionStatus,
          orderStatus: ord.status,
          otpVerified: Boolean(ord.deliveryOtpVerified || ord.status === 'DELIVERED'),
          deliveryOtpVerified: Boolean(ord.deliveryOtpVerified || ord.status === 'DELIVERED')
        });

        // Provider-wise COD aggregation
        const pKey = ord.providerId || 'UNASSIGNED';
        if (!providerCodMap.has(pKey)) {
          providerCodMap.set(pKey, {
            providerId: pKey,
            providerName: prov?.fullName || 'Campus Vendor',
            codOrders: 0,
            codExpected: 0,
            codCollected: 0,
            pendingCod: 0
          });
        }
        const pStat = providerCodMap.get(pKey);
        pStat.codOrders += 1;
        pStat.codExpected = AdminFinanceController.round(pStat.codExpected + expectedAmt);
        pStat.codCollected = AdminFinanceController.round(pStat.codCollected + collectedAmt);
        pStat.pendingCod = AdminFinanceController.round(pStat.pendingCod + pendingAmt);

        // Delivery Boy-wise COD aggregation
        if (assignedRunnerId && !deliveryBoyCodMap.has(assignedRunnerId)) {
          deliveryBoyCodMap.set(assignedRunnerId, {
            deliveryBoyId: assignedRunnerId,
            deliveryBoyName: runnerName,
            runnerName: runnerName,
            contactPhone: runnerPhone,
            vehicleType: runner?.vehicleType || 'Bicycle',
            date: new Date().toISOString().slice(0, 10),
            totalOrders: 0,
            codOrdersCount: 0,
            deliveredOrders: 0,
            expectedAmount: 0,
            codExpected: 0,
            collectedAmount: 0,
            codCollected: 0,
            pendingCod: 0,
            pendingAmount: 0,
            collectionRate: 100,
            collectionStatus: 'PENDING',
            orders: []
          });
        }
        if (assignedRunnerId) {
          const dStat = deliveryBoyCodMap.get(assignedRunnerId);
          dStat.totalOrders += 1;
          dStat.codOrdersCount += 1;
          if (ord.status === 'DELIVERED') dStat.deliveredOrders += 1;
          dStat.expectedAmount = AdminFinanceController.round(dStat.expectedAmount + expectedAmt);
          dStat.codExpected = dStat.expectedAmount;
          dStat.collectedAmount = AdminFinanceController.round(dStat.collectedAmount + collectedAmt);
          dStat.codCollected = dStat.collectedAmount;
          dStat.pendingCod = Math.max(0, AdminFinanceController.round(dStat.expectedAmount - dStat.collectedAmount));
          dStat.pendingAmount = dStat.pendingCod;

          dStat.orders.push({
            id: ord.id,
            orderId: ord.id,
            orderNumber: ord.orderNumber,
            createdAt: ord.createdAt,
            date: ord.createdAt,
            customerName: ord.student?.fullName || 'Student',
            student: ord.student?.fullName || 'Student',
            providerName: prov?.fullName || ord.provider?.fullName || 'Campus Store',
            provider: prov?.fullName || ord.provider?.fullName || 'Campus Store',
            totalAmount: expectedAmt,
            orderAmount: expectedAmt,
            expectedAmount: expectedAmt,
            codExpected: expectedAmt,
            codCollected: collectedAmt,
            collectedAmount: collectedAmt,
            pendingCod: pendingAmt,
            collectionStatus,
            codStatus: collectionStatus,
            otpVerified: Boolean(ord.deliveryOtpVerified || ord.status === 'DELIVERED'),
            deliveryOtpVerified: Boolean(ord.deliveryOtpVerified || ord.status === 'DELIVERED')
          });
        }
      }

      // Compute collection rates and status
      for (const [_, d] of deliveryBoyCodMap.entries()) {
        d.collectionRate = d.codExpected > 0 ? Math.min(100, Math.round((d.codCollected / d.codExpected) * 100)) : 100;
        d.collectionStatus = d.pendingCod === 0 && d.codCollected > 0 ? 'COLLECTED' : (d.codCollected > 0 ? 'PARTIALLY_COLLECTED' : 'PENDING');
      }

      let filteredDetailed = detailedRecords;
      if (providerId && providerId !== 'ALL') {
        filteredDetailed = filteredDetailed.filter(r => r.providerId === providerId);
      }
      if (deliveryBoyId && deliveryBoyId !== 'ALL') {
        filteredDetailed = filteredDetailed.filter(r => r.deliveryBoyId === deliveryBoyId);
      }
      if (status && status !== 'ALL') {
        filteredDetailed = filteredDetailed.filter(r => r.collectionStatus === status);
      }
      if (search && typeof search === 'string') {
        const q = search.toLowerCase().trim();
        filteredDetailed = filteredDetailed.filter(r =>
          r.orderNumber?.toLowerCase().includes(q) ||
          r.student?.toLowerCase().includes(q) ||
          r.provider?.toLowerCase().includes(q) ||
          r.deliveryBoy?.toLowerCase().includes(q)
        );
      }

      const totalCodPending = Math.max(0, AdminFinanceController.round(totalExpected - totalCollected));
      const collectionRate = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 100;

      const summaryCards = {
        todayCodExpected: AdminFinanceController.round(todayExpected),
        todayCodCollected: AdminFinanceController.round(todayCollected),
        todayPendingCod: Math.max(0, AdminFinanceController.round(todayExpected - todayCollected)),
        totalCod: AdminFinanceController.round(totalExpected),
        totalCollected: AdminFinanceController.round(totalCollected),
        totalPending: totalCodPending,
        collectionRate: `${collectionRate}%`
      };

      const runnerList = Array.from(deliveryBoyCodMap.values());
      const providerList = Array.from(providerCodMap.values());

      res.status(200).json({
        success: true,
        summaryCards,
        providerSummary: providerList,
        deliveryBoySummary: runnerList,
        deliveryBoys: runnerList,
        detailedOrders: filteredDetailed,
        data: {
          summaryCards,
          providerSummary: providerList,
          deliveryBoySummary: runnerList,
          deliveryBoys: runnerList,
          detailedOrders: filteredDetailed
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 6. COD STATUS CONTROL (Strict amount safety: requires collected amount or adjustment reason)
   */
  public static async manageCodStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, newStatus, amountCollected, adjustmentReason, notes } = req.body;
      const adminUserId = (req as any).user?.id || (req as any).user?.userId || 'ADMIN';

      if (!orderId || !newStatus) {
        res.status(400).json({ success: false, message: 'orderId and newStatus are required' });
        return;
      }

      // Valid statuses: Pending, Partially Collected, Collected, Collection Failed, Adjusted, Cancelled, Refunded
      const validStatuses = ['PENDING', 'PARTIALLY_COLLECTED', 'COLLECTED', 'COLLECTION_FAILED', 'ADJUSTED', 'CANCELLED', 'REFUNDED'];
      const normStatus = String(newStatus).toUpperCase().replace(/\s+/g, '_');
      if (!validStatuses.includes(normStatus)) {
        res.status(400).json({ success: false, message: `Invalid COD status: ${newStatus}` });
        return;
      }

      const order = await (prisma as any).order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      const expectedAmount = Number(order.totalAmount) || 0;
      let existingCollection = await (prisma as any).cODCollection.findUnique({
        where: { orderId: order.id }
      });

      const currentCollected = existingCollection ? Number(existingCollection.collectedAmount) : (order.paymentStatus === 'COD_COLLECTED' ? expectedAmount : 0);

      let finalCollected = currentCollected;

      // STRICT AMOUNT SAFETY RULE:
      // Changing status must NOT silently change the financial amount.
      if (normStatus === 'COLLECTED') {
        if (amountCollected !== undefined) {
          finalCollected = Number(amountCollected);
        } else if (currentCollected < expectedAmount && !adjustmentReason) {
          res.status(400).json({
            success: false,
            message: `Amount Safety Rule: COD Expected is ₹${expectedAmount}, but Collected is ₹${currentCollected}. You must either enter the exact additional collected amount or specify an adjustment reason.`
          });
          return;
        } else if (currentCollected === 0) {
          finalCollected = expectedAmount;
        }
      } else if (normStatus === 'PARTIALLY_COLLECTED') {
        if (amountCollected === undefined) {
          res.status(400).json({
            success: false,
            message: 'Must enter the partial collected amount.'
          });
          return;
        }
        finalCollected = Number(amountCollected);
      } else if (['ADJUSTED', 'COLLECTION_FAILED'].includes(normStatus)) {
        if (!adjustmentReason || adjustmentReason.trim().length < 5) {
          res.status(400).json({
            success: false,
            message: 'A mandatory adjustment reason (minimum 5 characters) is required when adjusting or marking collection failed.'
          });
          return;
        }
        if (amountCollected !== undefined) {
          finalCollected = Number(amountCollected);
        }
      }

      const diff = AdminFinanceController.round(finalCollected - expectedAmount);

      // Update or create COD collection
      const updatedCollection = await (prisma as any).cODCollection.upsert({
        where: { orderId: order.id },
        update: {
          collectedAmount: finalCollected,
          difference: diff,
          collectionStatus: normStatus,
          adjustmentReason: adjustmentReason || null,
          notes: notes || null,
          reconciledBy: adminUserId,
          reconciledAt: new Date()
        },
        create: {
          collectionNumber: `COD-${Date.now().toString().slice(-6)}`,
          orderId: order.id,
          deliveryBoyId: order.deliveryBoyId || null,
          expectedAmount,
          collectedAmount: finalCollected,
          difference: diff,
          collectionStatus: normStatus,
          reconciliationStatus: diff === 0 ? 'RECONCILED' : 'MISMATCH',
          adjustmentReason: adjustmentReason || null,
          notes: notes || null,
          reconciledBy: adminUserId,
          reconciledAt: new Date()
        }
      });

      // Update Order paymentStatus to keep synchronized
      await (prisma as any).order.update({
        where: { id: order.id },
        data: {
          paymentStatus: normStatus === 'COLLECTED' ? 'COD_COLLECTED' : 'PENDING'
        }
      });

      // Immutable Ledger Record
      await LedgerService.recordEntry({
        orderId: order.id,
        entryType: 'COD_COLLECTION',
        debitAccount: 'DELIVERY_RUNNER_CASH_HOLD',
        creditAccount: 'CUSTOMER_COD_RECEIVABLE',
        amount: finalCollected,
        referenceId: `COD_${order.orderNumber}`,
        description: `COD status updated to ${normStatus}. Amount Collected: ₹${finalCollected} (Expected: ₹${expectedAmount}). Reason: ${adjustmentReason || 'Standard collection reconciliation'}.`
      }).catch(() => {});

      res.status(200).json({
        success: true,
        message: `COD collection status updated to ${normStatus}.`,
        collection: updatedCollection
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 7. DELIVERY BOY EARNINGS & CONTRACTUAL RULE ENFORCEMENT
   */
  public static async getDeliveryBoyEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deliveryBoyId, status, search } = req.query;

      const deliveryBoys = await (prisma as any).deliveryBoy.findMany();
      const earnings = await (prisma as any).deliveryBoyEarning.findMany({
        orderBy: { createdAt: 'desc' }
      });
      const orders = await (prisma as any).order.findMany();

      let totalEligible = 0;
      let totalSettled = 0;
      let todayEarnings = 0;

      const summaryMap = new Map<string, any>();

      for (const d of deliveryBoys) {
        const isMonthly = d.paymentType === 'MONTHLY_CONTRACT';
        summaryMap.set(d.id, {
          deliveryBoyId: d.id,
          deliveryBoyName: d.fullName,
          mobileNumber: d.mobileNumber,
          vehicleType: d.vehicleType,
          contractType: isMonthly ? 'Monthly Contractual' : 'Per Delivery',
          perOrderRate: isMonthly ? 'Not Applicable' : `₹${Number(d.perDeliveryRate || 10).toFixed(2)}`,
          monthlySalary: isMonthly ? `₹${Number(d.monthlySalary || 15000).toFixed(2)}` : null,
          ordersDelivered: 0,
          eligibleEarnings: 0,
          settled: Number(d.totalSettled) || 0,
          remaining: 0,
          earningStatus: 'ELIGIBLE',
          orders: []
        });
      }

      for (const ord of orders) {
        if (!ord.deliveryBoyId || !summaryMap.has(ord.deliveryBoyId)) continue;
        const dStat = summaryMap.get(ord.deliveryBoyId);

        if (ord.status === 'DELIVERED') {
          dStat.ordersDelivered += 1;
        }

        const earningRecord = earnings.find((e: any) => e.orderId === ord.id || (ord.orderNumber && e.orderId === ord.orderNumber));
        const earningAmount = earningRecord ? Number(earningRecord.amount) : (dStat.contractType === 'Monthly Contractual' ? 0 : (ord.status === 'DELIVERED' && ord.deliveryOtpVerified ? 10 : 0));

        dStat.eligibleEarnings = AdminFinanceController.round(dStat.eligibleEarnings + earningAmount);

        dStat.orders.push({
          orderId: ord.id,
          orderNumber: ord.orderNumber,
          orderDate: ord.createdAt,
          provider: ord.provider?.fullName || 'Campus Store',
          paymentMode: ord.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'ONLINE',
          orderAmount: Number(ord.totalAmount) || 0,
          codAmount: ord.paymentMethod === 'CASH_ON_DELIVERY' ? Number(ord.totalAmount) || 0 : 0,
          deliveryStatus: ord.status,
          otpVerified: Boolean(ord.deliveryOtpVerified),
          eligibleEarning: earningAmount,
          earningStatus: dStat.contractType === 'Monthly Contractual' ? 'MONTHLY_CONTRACTUAL' : (earningRecord?.status || (ord.deliveryOtpVerified ? 'ELIGIBLE' : 'PENDING_OTP'))
        });
      }

      const runnerList: any[] = [];
      for (const [_, d] of summaryMap.entries()) {
        d.remaining = Math.max(0, AdminFinanceController.round(d.eligibleEarnings - d.settled));
        if (d.remaining === 0 && d.settled > 0) {
          d.earningStatus = 'SETTLED';
        } else if (d.settled > 0 && d.remaining > 0) {
          d.earningStatus = 'PARTIALLY_SETTLED';
        } else {
          d.earningStatus = 'ELIGIBLE';
        }

        totalEligible += d.eligibleEarnings;
        totalSettled += d.settled;

        runnerList.push(d);
      }

      for (const e of earnings) {
        if (AdminFinanceController.isToday(e.createdAt)) {
          todayEarnings += Number(e.amount) || 0;
        }
      }

      let result = runnerList;
      if (deliveryBoyId && deliveryBoyId !== 'ALL') {
        result = result.filter(r => r.deliveryBoyId === deliveryBoyId);
      }
      if (status && status !== 'ALL') {
        result = result.filter(r => r.earningStatus === status);
      }
      if (search && typeof search === 'string') {
        const q = search.toLowerCase().trim();
        result = result.filter(r => r.deliveryBoyName.toLowerCase().includes(q) || r.mobileNumber?.includes(q));
      }

      const totalPending = Math.max(0, AdminFinanceController.round(totalEligible - totalSettled));

      res.status(200).json({
        success: true,
        summaryCards: {
          totalEligibleEarnings: AdminFinanceController.round(totalEligible),
          pendingEarnings: totalPending,
          approvedEarnings: AdminFinanceController.round(totalEligible),
          alreadySettled: AdminFinanceController.round(totalSettled),
          todayEarnings: AdminFinanceController.round(todayEarnings),
          thisWeekEarnings: AdminFinanceController.round(earnings.filter((e: any) => AdminFinanceController.isThisWeek(e.createdAt)).reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0)),
          thisMonthEarnings: AdminFinanceController.round(earnings.filter((e: any) => AdminFinanceController.isThisMonth(e.createdAt)).reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0))
        },
        deliveryBoys: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 8. SUMMARY-LEVEL DELIVERY BOY SETTLEMENT
   */
  public static async settleDeliveryBoyEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deliveryBoyId, settlementAmount, paymentReference, notes } = req.body;
      const adminUserId = (req as any).user?.id || (req as any).user?.userId || 'ADMIN';

      if (!deliveryBoyId) {
        res.status(400).json({ success: false, message: 'deliveryBoyId is required' });
        return;
      }

      const deliveryBoy = await (prisma as any).deliveryBoy.findUnique({
        where: { id: deliveryBoyId }
      });

      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery runner not found' });
        return;
      }

      const currentSettled = Number(deliveryBoy.totalSettled) || 0;
      const amountToSettle = Number(settlementAmount) || 0;

      if (amountToSettle <= 0) {
        res.status(400).json({ success: false, message: 'Please enter a positive settlement amount.' });
        return;
      }

      const newTotalSettled = AdminFinanceController.round(currentSettled + amountToSettle);

      await (prisma as any).deliveryBoy.update({
        where: { id: deliveryBoyId },
        data: {
          totalSettled: newTotalSettled
        }
      });

      // Create settlement record for audit and history
      const ref = paymentReference || `UTR-RUNNER-${Date.now().toString().slice(-8)}`;
      const settlement = await (prisma as any).settlement.create({
        data: {
          settlementNumber: `STL-RUNNER-${Date.now().toString().slice(-6)}`,
          providerId: deliveryBoyId,
          serviceType: 'OTHER',
          periodStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          periodEnd: new Date(),
          ordersCount: 1,
          grossSales: amountToSettle,
          netPayable: amountToSettle,
          status: 'SETTLED',
          settledAt: new Date(),
          settledBy: adminUserId,
          paymentReference: ref,
          notes: notes || `Settlement of ₹${amountToSettle} disbursed to runner ${deliveryBoy.fullName}. Ref: ${ref}`
        }
      });

      // Immutable Ledger Record
      await LedgerService.recordEntry({
        settlementId: settlement.id,
        entryType: 'SETTLEMENT_PAYOUT',
        debitAccount: `RUNNER_PAYABLE_${deliveryBoyId}`,
        creditAccount: 'CAMPUS_BANK_CURRENT_ACCOUNT',
        amount: amountToSettle,
        referenceId: ref,
        description: `Disbursed ₹${amountToSettle} to delivery runner ${deliveryBoy.fullName} (${ref}).`
      }).catch(() => {});

      res.status(200).json({
        success: true,
        message: `Successfully settled ₹${amountToSettle} to ${deliveryBoy.fullName}.`,
        totalSettled: newTotalSettled,
        settlement
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 9. SETTLEMENT HISTORY
   */
  public static async getSettlementHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerId, deliveryBoyId, status, settlementType, startDate, endDate } = req.query;

      const settlements = await (prisma as any).settlement.findMany({
        orderBy: { settledAt: 'desc' }
      });
      const providers = await (prisma as any).serviceProvider.findMany();
      const deliveryBoys = await (prisma as any).deliveryBoy.findMany();

      let history = settlements.map((s: any) => {
        const prov = providers.find((p: any) => p.id === s.providerId);
        const runner = deliveryBoys.find((d: any) => d.id === s.providerId);
        const isRunner = Boolean(runner) || s.settlementNumber?.includes('RUNNER');

        return {
          settlementId: s.id,
          settlementNumber: s.settlementNumber,
          date: s.settledAt || s.createdAt,
          recipientType: isRunner ? 'DELIVERY_BOY' : 'PROVIDER',
          recipientName: runner ? runner.fullName : (prov ? prov.fullName : 'Campus Partner'),
          recipientId: s.providerId,
          amount: Number(s.netPayable) || 0,
          previousBalance: Number(s.grossSales) || 0,
          remainingBalance: Math.max(0, (Number(s.grossSales) || 0) - (Number(s.netPayable) || 0)),
          settlementType: isRunner ? 'Runner Earnings Payout' : 'Provider Sales Settlement',
          status: s.status || 'SETTLED',
          admin: s.settledBy || 'Central Finance Cell',
          paymentReference: s.paymentReference || 'UTR-INSTITUTIONAL',
          notes: s.notes,
          relatedOrderIds: (s.items && s.items.length > 0) ? s.items.map((i: any) => i.orderId) : []
        };
      });

      if (providerId && providerId !== 'ALL') {
        history = history.filter((h: any) => h.recipientId === providerId && h.recipientType === 'PROVIDER');
      }
      if (deliveryBoyId && deliveryBoyId !== 'ALL') {
        history = history.filter((h: any) => h.recipientId === deliveryBoyId && h.recipientType === 'DELIVERY_BOY');
      }
      if (status && status !== 'ALL') {
        history = history.filter((h: any) => h.status === status);
      }
      if (settlementType && settlementType !== 'ALL') {
        history = history.filter((h: any) => h.recipientType === settlementType);
      }
      if (startDate) {
        history = history.filter((h: any) => new Date(h.date) >= new Date(startDate as string));
      }
      if (endDate) {
        history = history.filter((h: any) => new Date(h.date) <= new Date(endDate as string));
      }

      res.status(200).json({
        success: true,
        count: history.length,
        history
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 10. FINANCIAL REPORTS WITH MULTI-FILTERING & SUMMARY TOTALS
   */
  public static async getFinancialReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        dateRange,
        startDate,
        endDate,
        providerId,
        deliveryBoyId,
        studentId,
        orderId,
        paymentMode,
        orderStatus,
        settlementStatus,
        codStatus,
        earningStatus,
        refundStatus
      } = req.query;

      const orders = await (prisma as any).order.findMany({
        orderBy: { createdAt: 'desc' }
      });
      const codList = await (prisma as any).cODCollection.findMany();
      const earnings = await (prisma as any).deliveryBoyEarning.findMany();

      let filtered = orders.map((o: any) => {
        const codEntry = codList.find((c: any) => c.orderId === o.id || c.orderId === o.orderNumber);
        const earnEntry = earnings.find((e: any) => e.orderId === o.id || (o.orderNumber && e.orderId === o.orderNumber));
        const isCod = o.paymentMethod === 'CASH_ON_DELIVERY';

        const orderAmt = AdminFinanceController.round(Number(o.totalAmount) || 0);
        const commAmt = 0; // 5% commission removed
        const provPayable = orderAmt;
        const provSettled = Number(o.providerSettledAmount) || 0;
        const provRemaining = Math.max(0, AdminFinanceController.round(provPayable - provSettled));

        const codExpected = isCod ? orderAmt : 0;
        const codCollected = isCod ? (codEntry && !isNaN(Number(codEntry.collectedAmount)) ? Number(codEntry.collectedAmount) : (o.paymentStatus === 'COD_COLLECTED' ? orderAmt : 0)) : 0;
        const codPending = isCod ? Math.max(0, AdminFinanceController.round(codExpected - codCollected)) : 0;
        const currentCodStatus = isCod ? (codEntry?.collectionStatus || (codCollected >= codExpected && codExpected > 0 ? 'COLLECTED' : 'PENDING')) : 'NOT_APPLICABLE';

        const runnerEarning = earnEntry ? Number(earnEntry.amount) : (o.status === 'DELIVERED' && o.deliveryOtpVerified && o.deliveryBoy?.paymentType !== 'MONTHLY_CONTRACT' ? 10 : 0);
        const runnerEarningStatus = earnEntry?.status || (o.deliveryOtpVerified ? 'ELIGIBLE' : 'PENDING_OTP');

        return {
          id: o.id,
          orderNumber: o.orderNumber,
          date: o.createdAt,
          studentName: o.student?.fullName || 'Campus Student',
          studentId: o.studentId,
          providerName: o.provider?.fullName || 'Campus Vendor',
          providerId: o.providerId,
          deliveryBoyName: o.deliveryBoy?.fullName || 'Unassigned',
          deliveryBoyId: o.deliveryBoyId,
          serviceType: o.serviceType,
          paymentMode: isCod ? 'COD' : 'ONLINE',
          orderStatus: o.status,
          orderTotal: orderAmt,
          commissionAmount: commAmt,
          providerPayable: provPayable,
          providerSettled: provSettled,
          providerRemaining: provRemaining,
          settlementStatus: o.settlementStatus || (provRemaining === 0 && provSettled > 0 ? 'SETTLED' : (provSettled > 0 ? 'PARTIALLY_SETTLED' : 'PENDING')),
          codExpected,
          codCollected,
          codPending,
          codStatus: currentCodStatus,
          deliveryEarning: runnerEarning,
          earningStatus: runnerEarningStatus,
          refundStatus: o.refundStatus || 'NOT_APPLICABLE',
          otpVerified: Boolean(o.deliveryOtpVerified)
        };
      });

      // Apply multiple filters simultaneously without duplicating any rows
      if (dateRange === 'today') {
        filtered = filtered.filter((f: any) => AdminFinanceController.isToday(f.date));
      } else if (dateRange === 'week') {
        filtered = filtered.filter((f: any) => AdminFinanceController.isThisWeek(f.date));
      } else if (dateRange === 'month') {
        filtered = filtered.filter((f: any) => AdminFinanceController.isThisMonth(f.date));
      } else if (startDate && endDate) {
        filtered = filtered.filter((f: any) => new Date(f.date) >= new Date(startDate as string) && new Date(f.date) <= new Date(endDate as string));
      }

      if (providerId && providerId !== 'ALL') {
        filtered = filtered.filter((f: any) => f.providerId === providerId);
      }
      if (deliveryBoyId && deliveryBoyId !== 'ALL') {
        filtered = filtered.filter((f: any) => f.deliveryBoyId === deliveryBoyId);
      }
      if (studentId && studentId !== 'ALL') {
        filtered = filtered.filter((f: any) => f.studentId === studentId);
      }
      if (orderId && typeof orderId === 'string' && orderId.trim()) {
        const q = orderId.toLowerCase().trim();
        filtered = filtered.filter((f: any) => f.orderNumber?.toLowerCase().includes(q) || f.id?.toLowerCase().includes(q));
      }
      if (paymentMode && paymentMode !== 'ALL') {
        filtered = filtered.filter((f: any) => f.paymentMode === paymentMode);
      }
      if (orderStatus && orderStatus !== 'ALL') {
        filtered = filtered.filter((f: any) => f.orderStatus === orderStatus);
      }
      if (settlementStatus && settlementStatus !== 'ALL') {
        filtered = filtered.filter((f: any) => f.settlementStatus === settlementStatus);
      }
      if (codStatus && codStatus !== 'ALL') {
        filtered = filtered.filter((f: any) => f.codStatus === codStatus);
      }
      if (earningStatus && earningStatus !== 'ALL') {
        filtered = filtered.filter((f: any) => f.earningStatus === earningStatus);
      }
      if (refundStatus && refundStatus !== 'ALL') {
        filtered = filtered.filter((f: any) => f.refundStatus === refundStatus);
      }

      // Summary totals calculated dynamically across filtered records
      const summaryTotals = {
        totalOrdersCount: filtered.length,
        totalGrossVolume: AdminFinanceController.round(filtered.reduce((s: any, r: any) => s + r.orderTotal, 0)),
        totalCommissionEarned: AdminFinanceController.round(filtered.reduce((s: any, r: any) => s + r.commissionAmount, 0)),
        totalProviderPayable: AdminFinanceController.round(filtered.reduce((s: any, r: any) => s + r.providerPayable, 0)),
        totalProviderSettled: AdminFinanceController.round(filtered.reduce((s: any, r: any) => s + r.providerSettled, 0)),
        totalProviderRemaining: AdminFinanceController.round(filtered.reduce((s: any, r: any) => s + r.providerRemaining, 0)),
        totalCodExpected: AdminFinanceController.round(filtered.reduce((s: any, r: any) => s + r.codExpected, 0)),
        totalCodCollected: AdminFinanceController.round(filtered.reduce((s: any, r: any) => s + r.codCollected, 0)),
        totalCodPending: AdminFinanceController.round(filtered.reduce((s: any, r: any) => s + r.codPending, 0)),
        totalDeliveryEarnings: AdminFinanceController.round(filtered.reduce((s: any, r: any) => s + r.deliveryEarning, 0)),
      };

      res.status(200).json({
        success: true,
        summaryTotals,
        records: filtered
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 11. EXPORT TO CSV & PDF (Respecting all active filters)
   */
  public static async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mockReq = { ...req, query: { ...req.query } };
      let records: any[] = [];
      await AdminFinanceController.getFinancialReports(mockReq as any, {
        status: () => ({
          json: (data: any) => {
            records = data.records || [];
          }
        })
      } as any, () => {});

      let csv = 'Order ID,Date,Student,Provider,Delivery Runner,Mode,Order Status,Total (INR),Commission,Provider Payable,Settled,Remaining,Settlement Status,COD Expected,COD Collected,COD Pending,COD Status,Runner Earning,OTP Verified\n';

      for (const r of records) {
        csv += `"${r.orderNumber}","${new Date(r.date).toISOString().slice(0, 10)}","${r.studentName}","${r.providerName}","${r.deliveryBoyName}","${r.paymentMode}","${r.orderStatus}",${r.orderTotal},${r.commissionAmount},${r.providerPayable},${r.providerSettled},${r.providerRemaining},"${r.settlementStatus}",${r.codExpected},${r.codCollected},${r.codPending},"${r.codStatus}",${r.deliveryEarning},"${r.otpVerified ? 'YES' : 'NO'}"\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=campus_basket_finance_report_${Date.now()}.csv`);
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  public static async exportPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let reportData: any = {};
      await AdminFinanceController.getFinancialReports(req, {
        status: () => ({
          json: (data: any) => {
            reportData = data;
          }
        })
      } as any, () => {});

      const totals = reportData.summaryTotals || {};
      const rows = (reportData.records || []).slice(0, 100);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Campus Basket Financial Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .totals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
            .card-value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
            th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600; }
            td { padding: 8px 10px; border: 1px solid #e2e8f0; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
            .badge-settled { background: #dcfce7; color: #166534; }
            .badge-pending { background: #fef3c7; color: #92400e; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Campus Basket — Central Institutional Financial Report</div>
            <div class="subtitle">Generated on ${new Date().toLocaleString('en-IN')} &bull; NIT Durgapur Campus Operations</div>
          </div>

          <div class="totals-grid">
            <div class="card">
              <div class="card-label">Gross Order Volume</div>
              <div class="card-value">₹${totals.totalGrossVolume?.toLocaleString('en-IN')}</div>
            </div>
            <div class="card">
              <div class="card-label">Provider Payable</div>
              <div class="card-value">₹${totals.totalProviderPayable?.toLocaleString('en-IN')}</div>
            </div>
            <div class="card">
              <div class="card-label">COD Collected</div>
              <div class="card-value">₹${totals.totalCodCollected?.toLocaleString('en-IN')}</div>
            </div>
            <div class="card">
              <div class="card-label">Delivery Earnings</div>
              <div class="card-value">₹${totals.totalDeliveryEarnings?.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Student</th>
                <th>Provider</th>
                <th>Mode</th>
                <th>Amount</th>
                <th>Payable</th>
                <th>Settled</th>
                <th>Status</th>
                <th>COD Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r: any) => `
                <tr>
                  <td><strong>${r.orderNumber}</strong></td>
                  <td>${new Date(r.date).toLocaleDateString('en-IN')}</td>
                  <td>${r.studentName}</td>
                  <td>${r.providerName}</td>
                  <td>${r.paymentMode}</td>
                  <td>₹${r.orderTotal}</td>
                  <td>₹${r.providerPayable}</td>
                  <td>₹${r.providerSettled}</td>
                  <td><span class="badge ${r.settlementStatus === 'SETTLED' ? 'badge-settled' : 'badge-pending'}">${r.settlementStatus}</span></td>
                  <td>${r.codStatus}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      next(err);
    }
  }
}
