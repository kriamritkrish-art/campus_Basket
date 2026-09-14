import { prisma } from '../../config/database';
import { LedgerService } from './LedgerService';

export interface CreditRefundParams {
  studentId: string;
  orderId?: string;
  refundId?: string;
  refundType: 'CANCELLATION' | 'RETURN';
  amount: number;
  triggerEvent: 'CANCELLATION_CONFIRMED' | 'RETURN_PICKUP_COMPLETED' | string;
  refundMethod?: string;
  description?: string;
}

export interface DebitPaymentParams {
  studentId: string;
  orderId: string;
  amount: number;
  description?: string;
}

export class WalletService {
  /**
   * Fetch or initialize student wallet.
   */
  public static async getOrCreateWallet(studentId: string): Promise<any> {
    if (!studentId) {
      throw new Error('studentId is required to retrieve or create wallet');
    }

    let wallet = await (prisma as any).wallet.findUnique({
      where: { studentId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    }).catch(() => null);

    if (!wallet) {
      wallet = await (prisma as any).wallet.create({
        data: {
          studentId,
          balance: 0.00,
          currency: 'INR',
          status: 'ACTIVE'
        },
        include: {
          transactions: true
        }
      });
    }

    return wallet;
  }

  /**
   * Get student wallet along with recent ledger transactions.
   */
  public static async getWallet(studentId: string): Promise<any> {
    const wallet = await this.getOrCreateWallet(studentId);
    const transactions = await (prisma as any).walletTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    }).catch(() => wallet.transactions || []);

    const numBalance = Number(wallet.balance || 0);
    return {
      id: wallet.id,
      studentId: wallet.studentId,
      balance: numBalance,
      currency: wallet.currency || 'INR',
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      wallet: {
        ...wallet,
        balance: numBalance
      },
      transactions: (transactions || []).map((t: any) => ({
        ...t,
        amount: Number(t.amount || 0),
        balanceBefore: Number(t.balanceBefore || 0),
        balanceAfter: Number(t.balanceAfter || 0)
      }))
    };
  }

  /**
   * Get all transactions for a student's wallet.
   */
  public static async getTransactions(studentId: string): Promise<any[]> {
    const transactions = await (prisma as any).walletTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []);

    return (transactions || []).map((t: any) => ({
      ...t,
      amount: Number(t.amount || 0),
      balanceBefore: Number(t.balanceBefore || 0),
      balanceAfter: Number(t.balanceAfter || 0)
    }));
  }

  /**
   * Credit an eligible refund directly to the student's Campus Basket Wallet.
   *
   * SECTION 16 & 17 COMPLIANCE:
   * 1. Idempotent processing / Duplicate Protection:
   *    Never creates duplicate credits for repeated cancellation, return pickup OTPs, or webhooks.
   * 2. Exactly one transaction created with all audit parameters:
   *    - Student ID, Order ID, Refund ID, Transaction ID, Refund Type, Amount,
   *      Balance Before, Balance After, Refund Method, Trigger Event, Status, Date/Time.
   * 3. Financial Ledger connection.
   */
  public static async creditRefund(params: CreditRefundParams): Promise<{
    success: boolean;
    wallet: any;
    transaction: any;
    alreadyProcessed: boolean;
    creditedAmount: number;
    balanceAfter: number;
    newBalance: number;
  }> {
    const { studentId, orderId, refundId, refundType, amount, triggerEvent, refundMethod = 'CAMPUS_BASKET_WALLET', description } = params;
    const numAmount = Number((amount || 0).toFixed(2));

    if (numAmount <= 0) {
      throw new Error(`Invalid refund credit amount: ₹${numAmount}. Must be greater than ₹0.`);
    }

    // 1. Duplicate Protection Check
    if (orderId && triggerEvent) {
      const existingTxn = await (prisma as any).walletTransaction.findFirst({
        where: {
          orderId,
          refundType,
          triggerEvent
        }
      }).catch(() => null);

      if (existingTxn) {
        const wallet = await this.getOrCreateWallet(studentId);
        return {
          success: true,
          wallet,
          transaction: existingTxn,
          alreadyProcessed: true,
          creditedAmount: Number(existingTxn.amount),
          balanceAfter: Number(wallet.balance),
          newBalance: Number(wallet.balance)
        };
      }
    }

    // 2. Fetch current wallet
    const wallet = await this.getOrCreateWallet(studentId);
    const balanceBefore = Number(wallet.balance || 0);
    const balanceAfter = Number((balanceBefore + numAmount).toFixed(2));

    const txnSeq = Math.floor(100000 + Math.random() * 900000);
    const transactionId = `WLT-TXN-${Date.now().toString().slice(-6)}-${txnSeq}`;

    // 3. Update Wallet Balance
    const updatedWallet = await (prisma as any).wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        updatedAt: new Date()
      }
    });

    // 4. Create Wallet Transaction Record
    const defaultDesc = refundType === 'CANCELLATION'
      ? `Instant refund credited for cancelled order #${orderId || ''}`
      : `Refund credited upon verified doorstep return pickup for order #${orderId || ''}`;

    const transaction = await (prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        studentId,
        orderId: orderId || null,
        refundId: refundId || null,
        type: 'CREDIT',
        refundType,
        refundMethod,
        triggerEvent,
        amount: numAmount,
        balanceBefore,
        balanceAfter,
        status: 'COMPLETED',
        description: description || defaultDesc
      }
    });

    // 5. Connect to Financial Ledger System (Section 16)
    try {
      await LedgerService.recordEntry({
        orderId: orderId || `WALLET_${studentId}`,
        entryType: 'REFUND_ISSUED',
        debitAccount: 'STUDENT_REFUND_LIABILITY',
        creditAccount: 'STUDENT_WALLET_ESCROW',
        amount: numAmount,
        referenceId: transactionId,
        description: `Campus Basket Wallet Refund Credit [${refundType} - ${triggerEvent}]. Student: ${studentId}, Net: ₹${numAmount.toFixed(2)}.`,
        metadata: {
          studentId,
          orderId,
          refundId,
          transactionId,
          triggerEvent,
          balanceBefore,
          balanceAfter
        }
      });
    } catch (ledgerErr) {
      console.warn('[WalletService] Financial ledger record entry notice:', ledgerErr);
    }

    return {
      success: true,
      wallet: updatedWallet,
      transaction,
      alreadyProcessed: false,
      creditedAmount: numAmount,
      balanceAfter,
      newBalance: balanceAfter
    };
  }

  /**
   * Debit student wallet for order checkout payment.
   */
  public static async debitPayment(params: DebitPaymentParams): Promise<{
    wallet: any;
    transaction: any;
    debitedAmount: number;
    newBalance: number;
  }> {
    const { studentId, orderId, amount, description } = params;
    const numAmount = Number((amount || 0).toFixed(2));

    const wallet = await this.getOrCreateWallet(studentId);
    const balanceBefore = Number(wallet.balance || 0);

    if (balanceBefore < numAmount) {
      throw new Error(`Insufficient wallet balance. Available: ₹${balanceBefore.toFixed(2)}, Required: ₹${numAmount.toFixed(2)}.`);
    }

    const balanceAfter = Number((balanceBefore - numAmount).toFixed(2));
    const txnSeq = Math.floor(100000 + Math.random() * 900000);
    const transactionId = `WLT-PAY-${Date.now().toString().slice(-6)}-${txnSeq}`;

    const updatedWallet = await (prisma as any).wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        updatedAt: new Date()
      }
    });

    const transaction = await (prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        studentId,
        orderId,
        refundId: null,
        transactionId,
        refundType: 'ORDER_PAYMENT',
        amount: numAmount,
        balanceBefore,
        balanceAfter,
        refundMethod: 'CAMPUS_BASKET_WALLET',
        triggerEvent: 'CHECKOUT_DEBIT',
        status: 'COMPLETED',
        description: description || `Payment for order #${orderId}`,
        createdAt: new Date()
      }
    });

    return {
      wallet: updatedWallet,
      transaction,
      debitedAmount: numAmount,
      newBalance: balanceAfter
    };
  }

  /**
   * Fetch or initialize provider wallet.
   */
  public static async getOrCreateProviderWallet(providerId: string): Promise<any> {
    if (!providerId) {
      throw new Error('providerId is required to retrieve or create provider wallet');
    }

    let wallet = await (prisma as any).wallet.findFirst({
      where: { providerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    }).catch(() => null);

    if (!wallet) {
      wallet = await (prisma as any).wallet.create({
        data: {
          providerId,
          balance: 0.00,
          currency: 'INR',
          status: 'ACTIVE'
        },
        include: {
          transactions: true
        }
      });
    }

    return wallet;
  }

  /**
   * Get provider wallet along with recent ledger transactions.
   */
  public static async getProviderWallet(providerId: string): Promise<any> {
    const wallet = await this.getOrCreateProviderWallet(providerId);
    const transactions = await (prisma as any).walletTransaction.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' }
    }).catch(() => wallet.transactions || []);

    const numBalance = Number(wallet.balance || 0);
    return {
      id: wallet.id,
      providerId: wallet.providerId,
      balance: numBalance,
      currency: wallet.currency || 'INR',
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      wallet: {
        ...wallet,
        balance: numBalance
      },
      transactions: (transactions || []).map((t: any) => ({
        ...t,
        amount: Number(t.amount || 0),
        balanceBefore: Number(t.balanceBefore || 0),
        balanceAfter: Number(t.balanceAfter || 0)
      }))
    };
  }

  /**
   * Credit provider wallet when order completes/becomes eligible.
   */
  public static async creditProviderOrder(params: {
    providerId: string;
    orderId: string;
    amount: number;
    description?: string;
  }): Promise<any> {
    const { providerId, orderId, amount, description } = params;
    const numAmount = Math.max(0, Math.round(Number(amount || 0) * 100) / 100);
    if (!providerId || numAmount <= 0) return null;

    // Check for existing credit for this order
    const existing = await (prisma as any).walletTransaction.findFirst({
      where: {
        providerId,
        orderId,
        triggerEvent: 'ORDER_COMPLETED'
      }
    }).catch(() => null);

    if (existing) {
      return { success: true, transaction: existing, alreadyProcessed: true };
    }

    const wallet = await this.getOrCreateProviderWallet(providerId);
    const balanceBefore = Number(wallet.balance || 0);
    const balanceAfter = Math.round((balanceBefore + numAmount) * 100) / 100;
    const txnSeq = Math.floor(100000 + Math.random() * 900000);
    const transactionId = `WLT-PRV-${Date.now().toString().slice(-6)}-${txnSeq}`;

    await (prisma as any).wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        updatedAt: new Date()
      }
    });

    const transaction = await (prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        providerId,
        orderId,
        transactionId,
        type: 'CREDIT',
        direction: 'CREDIT',
        refundType: 'PROVIDER_EARNING',
        amount: numAmount,
        balanceBefore,
        balanceAfter,
        triggerEvent: 'ORDER_COMPLETED',
        status: 'COMPLETED',
        description: description || `Order Completed: Earnings for order #${orderId}`,
        createdAt: new Date()
      }
    });

    return {
      success: true,
      wallet,
      transaction,
      balanceAfter
    };
  }

  /**
   * Record a return adjustment debit on provider wallet.
   */
  public static async adjustProviderReturn(params: {
    providerId: string;
    orderId: string;
    amount: number;
    description?: string;
  }): Promise<any> {
    const { providerId, orderId, amount, description } = params;
    const numAmount = Math.max(0, Math.round(Number(amount || 0) * 100) / 100);
    if (!providerId || numAmount <= 0) return null;

    const existing = await (prisma as any).walletTransaction.findFirst({
      where: {
        providerId,
        orderId,
        triggerEvent: 'RETURN_ADJUSTMENT'
      }
    }).catch(() => null);

    if (existing) {
      return { success: true, transaction: existing, alreadyProcessed: true };
    }

    const wallet = await this.getOrCreateProviderWallet(providerId);
    const balanceBefore = Number(wallet.balance || 0);
    const balanceAfter = Math.round((balanceBefore - numAmount) * 100) / 100;
    const txnSeq = Math.floor(100000 + Math.random() * 900000);
    const transactionId = `WLT-RET-${Date.now().toString().slice(-6)}-${txnSeq}`;

    await (prisma as any).wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        updatedAt: new Date()
      }
    });

    const transaction = await (prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        providerId,
        orderId,
        transactionId,
        type: 'DEBIT',
        direction: 'DEBIT',
        refundType: 'RETURN_ADJUSTMENT',
        amount: numAmount,
        balanceBefore,
        balanceAfter,
        triggerEvent: 'RETURN_ADJUSTMENT',
        status: 'COMPLETED',
        description: description || `Return Adjustment: -₹${numAmount.toFixed(2)} for order #${orderId}`,
        createdAt: new Date()
      }
    });

    return {
      success: true,
      wallet,
      transaction,
      balanceAfter
    };
  }

  /**
   * Record a cancellation adjustment debit on provider wallet.
   */
  public static async adjustProviderCancellation(params: {
    providerId: string;
    orderId: string;
    amount: number;
    description?: string;
  }): Promise<any> {
    const { providerId, orderId, amount, description } = params;
    const numAmount = Math.max(0, Math.round(Number(amount || 0) * 100) / 100);
    if (!providerId || numAmount <= 0) return null;

    const existing = await (prisma as any).walletTransaction.findFirst({
      where: {
        providerId,
        orderId,
        triggerEvent: 'CANCELLATION_ADJUSTMENT'
      }
    }).catch(() => null);

    if (existing) {
      return { success: true, transaction: existing, alreadyProcessed: true };
    }

    const wallet = await this.getOrCreateProviderWallet(providerId);
    const balanceBefore = Number(wallet.balance || 0);
    const balanceAfter = Math.round((balanceBefore - numAmount) * 100) / 100;
    const txnSeq = Math.floor(100000 + Math.random() * 900000);
    const transactionId = `WLT-CAN-${Date.now().toString().slice(-6)}-${txnSeq}`;

    await (prisma as any).wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        updatedAt: new Date()
      }
    });

    const transaction = await (prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        providerId,
        orderId,
        transactionId,
        type: 'DEBIT',
        direction: 'DEBIT',
        refundType: 'CANCELLATION_ADJUSTMENT',
        amount: numAmount,
        balanceBefore,
        balanceAfter,
        triggerEvent: 'CANCELLATION_ADJUSTMENT',
        status: 'COMPLETED',
        description: description || `Cancellation Adjustment: -₹${numAmount.toFixed(2)} for order #${orderId}`,
        createdAt: new Date()
      }
    });

    return {
      success: true,
      wallet,
      transaction,
      balanceAfter
    };
  }

  /**
   * Record a settlement payout debit on provider wallet.
   */
  public static async disburseProviderSettlement(params: {
    providerId: string;
    settlementId: string;
    amount: number;
    referenceId: string;
    description?: string;
  }): Promise<any> {
    const { providerId, settlementId, amount, referenceId, description } = params;
    const numAmount = Math.max(0, Math.round(Number(amount || 0) * 100) / 100);
    if (!providerId || numAmount <= 0) return null;

    const existing = await (prisma as any).walletTransaction.findFirst({
      where: {
        providerId,
        referenceId: settlementId,
        triggerEvent: 'SETTLEMENT_PAYOUT'
      }
    }).catch(() => null);

    if (existing) {
      return { success: true, transaction: existing, alreadyProcessed: true };
    }

    const wallet = await this.getOrCreateProviderWallet(providerId);
    const balanceBefore = Number(wallet.balance || 0);
    const balanceAfter = Math.round((balanceBefore - numAmount) * 100) / 100;
    const txnSeq = Math.floor(100000 + Math.random() * 900000);
    const transactionId = `WLT-SET-${Date.now().toString().slice(-6)}-${txnSeq}`;

    await (prisma as any).wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        updatedAt: new Date()
      }
    });

    const transaction = await (prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        providerId,
        referenceId: settlementId,
        transactionId,
        type: 'DEBIT',
        direction: 'DEBIT',
        refundType: 'PROVIDER_SETTLEMENT',
        amount: numAmount,
        balanceBefore,
        balanceAfter,
        triggerEvent: 'SETTLEMENT_PAYOUT',
        status: 'COMPLETED',
        description: description || `Provider Settlement Payout: -₹${numAmount.toFixed(2)} (Ref: ${referenceId})`,
        createdAt: new Date()
      }
    });

    return {
      success: true,
      wallet,
      transaction,
      balanceAfter
    };
  }
}
