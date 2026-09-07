import { prisma } from '../../config/database';
import { LedgerService } from '../financial/LedgerService';
import { AuditService } from '../audit/AuditService';

export class LaundrySettlementService {
  /**
   * Called automatically upon successful laundry delivery & completion.
   * Calculates provider payable strictly as laundryBaseAmount (excluding Campus Basket service charge).
   * Sets settlementStatus to 'ELIGIBLE'.
   */
  public static async makeEligibleAfterDelivery(orderId: string): Promise<any> {
    const order = await prisma.laundryOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) return null;

    // Provider payable is strictly the laundry base amount
    const basePayable = Number(order.laundryBaseAmount || Number(order.finalPrice || order.estimatedPrice || 0) * 0.95);
    const serviceCharge = Number(order.serviceChargeAmount || 0);

    const updated = await prisma.laundryOrder.update({
      where: { id: order.id },
      data: {
        settlementStatus: 'ELIGIBLE'
      }
    });

    // Record Provider Payable in Financial Ledger
    try {
      await LedgerService.recordEntry({
        orderId: order.id,
        entryType: 'PROVIDER_PAYABLE',
        debitAccount: 'CAMPUS_ESCROW_GATEWAY',
        creditAccount: 'PROVIDER_PAYABLE_LIABILITY',
        amount: basePayable,
        referenceId: `PAYABLE_${order.orderNumber}`,
        description: `Provider payable created for delivered Laundry Order ${order.orderNumber}. Base amount: ₹${basePayable} (excludes platform service charge ₹${serviceCharge}).`,
        metadata: {
          orderNumber: order.orderNumber,
          laundryBaseAmount: basePayable,
          serviceChargeRetained: serviceCharge,
          providerId: order.providerId,
          settlementStatus: 'ELIGIBLE'
        }
      });
    } catch (err) {
      console.warn('Failed to record laundry payable in ledger:', err);
    }

    return updated;
  }

  /**
   * Admin executes settlement for a completed laundry order.
   */
  public static async settleOrder(params: {
    orderId: string;
    adminId: string;
    paymentReference?: string;
    notes?: string;
    ipAddress?: string;
  }) {
    const order = await prisma.laundryOrder.findUnique({
      where: { id: params.orderId }
    });

    if (!order) {
      throw new Error('Laundry order not found');
    }

    if (order.settlementStatus === 'SETTLED') {
      throw new Error('This laundry order has already been settled.');
    }

    if (order.status !== 'COMPLETED') {
      throw new Error('Only completed & delivered laundry orders are eligible for settlement.');
    }

    const payableAmount = Number(order.laundryBaseAmount || Number(order.finalPrice || order.estimatedPrice || 0));
    const serviceChargeAmount = Number(order.serviceChargeAmount || 0);

    const updated = await prisma.laundryOrder.update({
      where: { id: order.id },
      data: {
        settlementStatus: 'SETTLED'
      }
    });

    // Record in Financial Ledger
    try {
      await LedgerService.recordEntry({
        orderId: order.id,
        entryType: 'SETTLEMENT_PAYOUT',
        debitAccount: 'PROVIDER_PAYABLE_LIABILITY',
        creditAccount: 'CAMPUS_DISBURSEMENT_ACCOUNT',
        amount: payableAmount,
        referenceId: params.paymentReference || `SETTLE_${order.orderNumber}`,
        description: `Settlement payout completed for Laundry Order ${order.orderNumber}. Settled by: ${params.adminId}`,
        metadata: {
          orderNumber: order.orderNumber,
          settledToProvider: order.providerId,
          amountPaid: payableAmount,
          serviceChargeKeptByPlatform: serviceChargeAmount,
          paymentReference: params.paymentReference || `CB-PAYREF-${Date.now()}`,
          settledBy: params.adminId
        }
      });
    } catch {}

    // Audit Log
    try {
      await AuditService.log(prisma, {
        userId: params.adminId,
        action: 'LAUNDRY_SETTLEMENT_COMPLETED',
        entity: 'LaundryOrder',
        entityId: order.id,
        newValue: {
          orderNumber: order.orderNumber,
          payableAmount,
          settlementStatus: 'SETTLED'
        },
        ipAddress: params.ipAddress
      });
    } catch {}

    return {
      success: true,
      order: updated,
      settlementReceipt: {
        orderNumber: order.orderNumber,
        providerPayable: payableAmount,
        serviceChargeRetained: serviceChargeAmount,
        settlementStatus: 'SETTLED',
        settledAt: new Date(),
        paymentReference: params.paymentReference || `CB-PAYREF-${Date.now()}`
      }
    };
  }
}
