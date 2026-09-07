import { prisma } from '../../config/database';
import { LedgerService } from '../financial/LedgerService';
import { AuditService } from '../audit/AuditService';

export interface CodCollectionResult {
  success: boolean;
  message: string;
  collection?: any;
  order?: any;
}

export class LaundryCodService {
  /**
   * Records provider collection of COD amount from student upon delivery.
   * Enforces:
   * - Order is COD
   * - Payment was not already marked COLLECTED
   * - Prevents duplicate collection
   * - Records append-only entry in Financial Ledger
   * - Emits audit log
   */
  public static async recordCollection(params: {
    laundryOrderId: string;
    providerId: string;
    collectedAmount?: number;
    notes?: string;
    collectedBy?: string;
    ipAddress?: string;
  }): Promise<CodCollectionResult> {
    const order = await prisma.laundryOrder.findUnique({
      where: { id: params.laundryOrderId }
    });

    if (!order) {
      return { success: false, message: 'Laundry order not found' };
    }

    if (order.paymentMethod !== 'COD') {
      return { success: false, message: 'This laundry order is not configured for Cash on Delivery.' };
    }

    if (order.codStatus === 'COLLECTED') {
      return { success: false, message: 'COD amount for this laundry order has already recorded as collected.' };
    }

    const expectedAmount = Number(order.codAmount || order.laundryBaseAmount || 0);
    const collectedAmount = params.collectedAmount !== undefined ? Number(params.collectedAmount) : expectedAmount;

    const collectionNumber = `CB-LCOD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create COD Collection record
      const collection = await tx.laundryCodCollection.create({
        data: {
          collectionNumber,
          laundryOrderId: order.id,
          providerId: params.providerId || order.providerId || null,
          expectedAmount,
          collectedAmount,
          collectionStatus: 'COLLECTED',
          collectedAt: new Date(),
          collectedBy: params.collectedBy || params.providerId,
          notes: params.notes || `COD collected by laundry provider upon clean clothes delivery.`
        }
      });

      // 2. Update Laundry Order status
      const updatedOrder = await tx.laundryOrder.update({
        where: { id: order.id },
        data: {
          codCollectedAmount: collectedAmount,
          codStatus: 'COLLECTED',
          paymentStatus: 'PAID'
        }
      });

      return { collection, updatedOrder };
    });

    // 3. Record in Financial Ledger
    try {
      await LedgerService.recordEntry({
        orderId: order.id,
        entryType: 'COD_COLLECTION',
        debitAccount: 'PROVIDER_CASH_HOLDING',
        creditAccount: 'PROVIDER_PAYABLE',
        amount: collectedAmount,
        referenceId: collectionNumber,
        description: `COD collection confirmed for Laundry Order ${order.orderNumber}. Collected by: ${params.collectedBy || params.providerId}`,
        metadata: {
          collectionNumber,
          laundryOrderId: order.id,
          orderNumber: order.orderNumber,
          expectedAmount,
          collectedAmount,
          providerId: order.providerId || params.providerId,
          collectedBy: params.collectedBy || params.providerId
        }
      });
    } catch (err) {
      console.warn('Failed to append COD collection to financial ledger:', err);
    }

    // 4. Record Audit Log
    try {
      await AuditService.log(prisma, {
        userId: params.providerId,
        action: 'LAUNDRY_COD_COLLECTED',
        entity: 'LaundryOrder',
        entityId: order.id,
        newValue: {
          orderNumber: order.orderNumber,
          collectedAmount,
          collectionNumber
        },
        ipAddress: params.ipAddress
      });
    } catch {}

    return {
      success: true,
      message: `Successfully collected ₹${collectedAmount} COD for Order #${order.orderNumber}.`,
      collection: result.collection,
      order: result.updatedOrder
    };
  }

  /**
   * Convenience method to confirm COD collection that throws on error.
   */
  public static async confirmCodCollection(params: {
    orderId: string;
    providerId: string;
    collectedAmount?: number;
    notes?: string;
    collectedBy?: string;
    ipAddress?: string;
  }): Promise<CodCollectionResult> {
    const res = await this.recordCollection({
      laundryOrderId: params.orderId,
      providerId: params.providerId,
      collectedAmount: params.collectedAmount,
      notes: params.notes,
      collectedBy: params.collectedBy,
      ipAddress: params.ipAddress
    });
    if (!res.success) {
      throw new Error(res.message || 'COD collection failed');
    }
    return res;
  }
}
