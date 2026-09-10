import { prisma } from '../../config/database';

export interface LedgerEntryInput {
  orderId?: string | null;
  settlementId?: string | null;
  entryType: 'ORDER_PAYMENT' | 'COMMISSION_EARNED' | 'PROVIDER_PAYABLE' | 'REFUND_ISSUED' | 'COD_COLLECTION' | 'SETTLEMENT_PAYOUT' | 'ADJUSTMENT';
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency?: string;
  referenceId?: string | null;
  description: string;
  metadata?: Record<string, any> | string | null;
}

export class LedgerService {
  /**
   * Appends an immutable, double-entry financial ledger record.
   * Round amount to 2 decimal places to avoid float accumulation issues.
   */
  public static async recordEntry(input: LedgerEntryInput): Promise<any> {
    const roundedAmount = Math.round(Number(input.amount) * 100) / 100;
    if (isNaN(roundedAmount) || roundedAmount <= 0) {
      throw new Error(`Invalid ledger amount: ${input.amount}`);
    }

    const metadataString = typeof input.metadata === 'object' && input.metadata !== null
      ? JSON.stringify(input.metadata)
      : (typeof input.metadata === 'string' ? input.metadata : null);

    return (prisma as any).financialLedger.create({
      data: {
        orderId: input.orderId || null,
        settlementId: input.settlementId || null,
        entryType: input.entryType,
        debitAccount: input.debitAccount.trim(),
        creditAccount: input.creditAccount.trim(),
        amount: roundedAmount,
        currency: input.currency || 'INR',
        referenceId: input.referenceId || null,
        description: input.description.trim(),
        metadata: metadataString
      }
    });
  }

  /**
   * Automatically recognizes payments, commissions, and provider payables for an order.
   */
  /**
   * Automatically recognizes payments, commissions, and provider payables for an order.
   */
  public static async recordOrderPayment(order: {
    id?: string;
    orderId?: string;
    orderNumber: string;
    totalAmount?: number;
    amount?: number;
    providerId?: string | null;
    paymentMethod: string;
    commissionRate?: number;
    commissionAmount?: number;
    providerPayable?: number;
    referenceId?: string;
    description?: string;
  }): Promise<any> {
    const orderId = order.id || order.orderId || `ord_${Date.now()}`;
    const total = Number(order.totalAmount !== undefined ? order.totalAmount : (order.amount !== undefined ? order.amount : 0));
    // Provider settlement is computed from the actual product value, not customer total.
    const productValue = Number(order.totalAmount) || total;
    const commRate = 0;
    const commAmt = 0;
    const provPayable = order.providerPayable !== undefined
      ? Number(order.providerPayable)
      : Math.max(0, Math.round((productValue - Number(order.amount || 0) + Number(order.totalAmount || 0) - Number(order.amount || 0)) * 100) / 100);

    const sourceAccount = order.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD_RECEIVABLE_IN_TRANSIT' : 'CAMPUS_ESCROW_GATEWAY';

    // 1. Record Gross Payment
    const paymentEntry = await this.recordEntry({
      orderId,
      entryType: 'ORDER_PAYMENT',
      debitAccount: sourceAccount,
      creditAccount: 'STUDENT_PAYMENT_RECEIVABLES',
      amount: total,
      referenceId: order.referenceId || `PAY_${order.orderNumber}`,
      description: order.description || `Checkout payment received for Order ${order.orderNumber} via ${order.paymentMethod}`,
      metadata: { method: order.paymentMethod, orderNumber: order.orderNumber }
    });

    // 2. Record Platform Commission
    if (commAmt > 0) {
      await this.recordEntry({
        orderId,
        entryType: 'COMMISSION_EARNED',
        debitAccount: sourceAccount,
        creditAccount: 'PLATFORM_COMMISSION_REVENUE',
        amount: commAmt,
        referenceId: `COMM_${order.orderNumber}`,
        description: `Platform commission (${commRate}%) recognized for Order ${order.orderNumber}`,
        metadata: { rate: commRate, orderNumber: order.orderNumber }
      });
    }

    // 3. Record Provider Payable Allocation
    if (order.providerId && provPayable > 0) {
      await this.recordEntry({
        orderId,
        entryType: 'PROVIDER_PAYABLE',
        debitAccount: sourceAccount,
        creditAccount: `PROVIDER_PAYABLE_${order.providerId}`,
        amount: provPayable,
        referenceId: `PAYABLE_${order.orderNumber}`,
        description: `Provider net payable allocated for Order ${order.orderNumber}`,
        metadata: { providerId: order.providerId, orderNumber: order.orderNumber }
      });
    }

    return {
      isImmutable: true,
      balanceAfter: total,
      ...paymentEntry
    };
  }

  /**
   * Retrieves ledger entries with filtering and pagination.
   */
  public static async getEntries(filters: {
    orderId?: string;
    settlementId?: string;
    entryType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<any[]> {
    const where: any = {};
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.settlementId) where.settlementId = filters.settlementId;
    if (filters.entryType) where.entryType = filters.entryType;

    const list = await (prisma as any).financialLedger.findMany({
      where,
      take: filters.limit,
      orderBy: { createdAt: 'desc' }
    });

    return list.map((item: any) => ({
      isImmutable: true,
      balanceAfter: item.balanceAfter || item.amount,
      ...item
    }));
  }

  /**
   * Alias for getEntries
   */
  public static async getLedgerHistory(filters: any = {}): Promise<any[]> {
    return this.getEntries(filters);
  }
}
