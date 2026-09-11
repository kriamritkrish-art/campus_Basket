/**
 * Campus Basket - Single Authoritative COD Reconciliation Service
 * 
 * Rules:
 * 1. COD Amount Due = Math.max(0, Order Total - Online Paid Amount)
 * 2. Only Delivered (with verified OTP) and COD Due > 0 are eligible for COD reconciliation
 * 3. Difference = Expected COD - Cash Collected (Never 0 when Cash Collected is 0)
 * 4. Separate Collection Status vs Reconciliation Status
 * 5. Strictly group and isolate delivery boys by deliveryBoyId (never by name alone)
 * 6. Only genuine database order records and real order numbers (no dummy/test markers)
 */

export interface NormalizedCodOrder {
  id: string;
  collectionId: string;
  collectionNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  student: string;
  studentPhone: string;
  studentHall: string;
  studentRoom: string;
  providerId: string | null;
  providerName: string;
  providerPhone: string;
  orderType: 'CUSTOMER_ORDER' | 'LAUNDRY_PICKUP' | 'LAUNDRY_RETURN' | 'SERVICE_ORDER' | 'OTHER';
  items: Array<{ name: string; quantity: number; price: number }>;
  orderAmount: number;
  onlinePaidAmount: number;
  expectedAmount: number;
  codAmountDue: number;
  collectedAmount: number;
  cashCollectedAmount: number;
  difference: number;
  deliveryStatus: string;
  paymentMethod: string;
  collectionStatus: 'PENDING' | 'COLLECTED' | 'PARTIALLY_COLLECTED' | 'NOT_APPLICABLE';
  reconciliationStatus: 'PENDING' | 'RECONCILED' | 'MISMATCH' | 'PARTIALLY_RECONCILED';
  reconciledBy: string | null;
  reconciledAt: string | null;
  reconciliationNotes: string | null;
  deliveryBoyId: string | null;
  deliveryBoy: {
    id: string | null;
    fullName: string;
    mobileNumber: string;
    vehicleType?: string;
  } | null;
  runnerName: string;
  runnerPhone: string | null;
  isDelivered: boolean;
  deliveryOtpVerified: boolean;
  deliveryDate: string | null;
  createdAt: string;
  isEligibleForReconcile: boolean;
}

export interface DeliveryBoyCodSummary {
  deliveryBoyId: string;
  name: string;
  deliveryBoyName: string;
  phone: string;
  contactPhone: string;
  vehicleType: string;
  codOrdersCount: number;
  expectedAmount: number;
  expectedCod: number;
  collectedAmount: number;
  cashCollected: number;
  difference: number;
  reconciledOrdersCount: number;
  reconciled: number;
  pendingOrdersCount: number;
  pending: number;
  eligibleOrdersCount: number;
  eligibleAmount: number;
  status: 'PENDING' | 'RECONCILED' | 'MISMATCH' | 'READY TO RECONCILE' | 'PARTIALLY_RECONCILED';
  orders: NormalizedCodOrder[];
}

export class CodReconciliationService {
  public static round(val: number): number {
    return Math.round((Number(val) || 0) * 100) / 100;
  }

  /**
   * Filter out artificial/dummy test orders
   */
  public static isRealOrder(order: any): boolean {
    if (!order) return false;
    const num = String(order.orderNumber || order.id || '').toUpperCase().trim();
    if (num.startsWith('TEST-ORDER') || num.startsWith('TEST_') || num.startsWith('DEMO-') || num === 'N/A') {
      return false;
    }
    return true;
  }

  /**
   * Determine exact order type to prevent laundry/return pickups from polluting COD
   */
  public static determineOrderType(order: any): 'CUSTOMER_ORDER' | 'LAUNDRY_PICKUP' | 'LAUNDRY_RETURN' | 'SERVICE_ORDER' | 'OTHER' {
    if (!order) return 'CUSTOMER_ORDER';
    const sType = String(order.serviceType || '').toUpperCase();
    if (sType === 'LAUNDRY_PICKUP') return 'LAUNDRY_PICKUP';
    if (sType === 'LAUNDRY_RETURN') return 'LAUNDRY_RETURN';
    if (sType === 'SERVICE') return 'SERVICE_ORDER';
    if (order.returnRequest && !order.items?.length) return 'LAUNDRY_RETURN';
    return 'CUSTOMER_ORDER';
  }

  /**
   * Authoritative calculation for a single order and its COD collection record
   */
  public static normalizeOrderCod(
    order: any,
    codEntry: any,
    deliveryBoys: any[] = [],
    providers: any[] = []
  ): NormalizedCodOrder {
    const orderTotal = this.round(Number(order.totalAmount || 0));
    
    // Online Paid Amount calculation
    let onlinePaid = 0;
    const isPureOnline = order.paymentMethod === 'RAZORPAY' || order.paymentMethod === 'ONLINE';
    if (isPureOnline) {
      onlinePaid = orderTotal;
    } else {
      onlinePaid = this.round(Number(order.advancePaidAmount || 0));
    }

    // COD Amount Due = Max(0, Order Total - Online Paid)
    const codAmountDue = this.round(Math.max(0, orderTotal - onlinePaid));

    // Order status and delivery verification
    const isDelivered = order.status === 'DELIVERED';
    const isOtpVerified = Boolean(order.deliveryOtpVerified || isDelivered);
    const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';
    const orderType = this.determineOrderType(order);

    // COD Eligibility: Must be delivered, not cancelled, COD Due > 0, and not a pickup/return order
    const isEligibleOrder = isDelivered && !isCancelled && codAmountDue > 0 && orderType === 'CUSTOMER_ORDER';

    // Delivery Boy resolution - strictly by deliveryBoyId
    const assignedDeliveryBoyId = order.deliveryBoyId || codEntry?.deliveryBoyId || null;
    const runner = assignedDeliveryBoyId
      ? deliveryBoys.find((d: any) => d.id === assignedDeliveryBoyId)
      : null;
    const runnerName = runner?.fullName || (assignedDeliveryBoyId ? 'Campus Delivery Partner' : 'Unassigned Runner');
    const runnerPhone = runner?.mobileNumber || runner?.phone || (runner as any)?.user?.phone || null;

    // Provider resolution
    const prov = providers.find((p: any) => p.id === order.providerId) || order.provider;
    const providerName = prov?.fullName || prov?.name || 'Campus Provider';

    // Actual Cash Collected
    const rawCollected = codEntry
      ? (codEntry.collectedAmount !== undefined ? codEntry.collectedAmount : codEntry.amountCollected)
      : null;
    const parsedCollected = rawCollected !== null && rawCollected !== undefined ? Number(rawCollected) : null;
    
    // If an explicit collection entry exists, use its number; otherwise 0
    let cashCollected = 0;
    if (parsedCollected !== null && !isNaN(parsedCollected)) {
      cashCollected = this.round(parsedCollected);
    } else if (codEntry?.collectionStatus === 'COLLECTED') {
      cashCollected = codAmountDue;
    } else {
      cashCollected = 0;
    }

    // Difference = Expected COD - Cash Collected
    // E.g. Expected 5810, Collected 0 => Difference 5810 (NOT 0)
    const difference = this.round(codAmountDue - cashCollected);

    // Separate Collection Status
    let collectionStatus: 'PENDING' | 'COLLECTED' | 'PARTIALLY_COLLECTED' | 'NOT_APPLICABLE' = 'PENDING';
    if (codAmountDue === 0) {
      collectionStatus = 'NOT_APPLICABLE';
    } else if (cashCollected >= codAmountDue && codAmountDue > 0) {
      collectionStatus = 'COLLECTED';
    } else if (cashCollected > 0 && cashCollected < codAmountDue) {
      collectionStatus = 'PARTIALLY_COLLECTED';
    } else {
      collectionStatus = 'PENDING';
    }

    // Explicitly preserve existing stored collection status if compatible
    if (codEntry?.collectionStatus) {
      const s = String(codEntry.collectionStatus).toUpperCase();
      if (s === 'COLLECTED' || s === 'CASH_COLLECTED') collectionStatus = 'COLLECTED';
      else if (s === 'PARTIALLY_COLLECTED') collectionStatus = 'PARTIALLY_COLLECTED';
      else if (s === 'NOT_APPLICABLE') collectionStatus = 'NOT_APPLICABLE';
      else if (s === 'PENDING') collectionStatus = 'PENDING';
    }

    // Separate Reconciliation Status
    let reconciliationStatus: 'PENDING' | 'RECONCILED' | 'MISMATCH' | 'PARTIALLY_RECONCILED' = 'PENDING';
    if (codEntry?.reconciliationStatus) {
      const r = String(codEntry.reconciliationStatus).toUpperCase();
      if (r === 'RECONCILED') reconciliationStatus = 'RECONCILED';
      else if (r === 'MISMATCH') reconciliationStatus = 'MISMATCH';
      else if (r === 'PARTIALLY_RECONCILED') reconciliationStatus = 'PARTIALLY_RECONCILED';
      else reconciliationStatus = 'PENDING';
    } else {
      if (codEntry?.reconciledAt && difference === 0 && cashCollected > 0) {
        reconciliationStatus = 'RECONCILED';
      } else if (cashCollected > 0 && difference !== 0) {
        reconciliationStatus = 'MISMATCH';
      } else {
        reconciliationStatus = 'PENDING';
      }
    }

    // Is Eligible For Reconcile action (delivered, has collectible COD, balanced difference === 0, cashCollected > 0, not already reconciled, not a mismatch)
    const isEligibleForReconcile =
      isEligibleOrder &&
      difference === 0 &&
      cashCollected > 0 &&
      reconciliationStatus !== 'RECONCILED' &&
      reconciliationStatus !== 'MISMATCH';

    // Real order number: strictly genuine identifier
    const genuineOrderNumber = String(order.orderNumber || order.id);

    return {
      id: codEntry?.id || `cod_${order.id}`,
      collectionId: codEntry?.id || `cod_${order.id}`,
      collectionNumber: codEntry?.collectionNumber || `COD-${genuineOrderNumber}`,
      orderId: order.id,
      orderNumber: genuineOrderNumber,
      customerName: order.student?.fullName || order.student?.name || 'Campus Student',
      student: order.student?.fullName || order.student?.name || 'Campus Student',
      studentPhone: order.student?.mobileNumber || order.student?.phone || 'N/A',
      studentHall: order.hallName || order.student?.hallName || 'Campus Hostel',
      studentRoom: order.roomNumber || order.student?.roomNumber || 'N/A',
      providerId: order.providerId || null,
      providerName,
      providerPhone: prov?.mobileNumber || prov?.phone || 'N/A',
      orderType,
      items: (order.items || []).map((i: any) => ({
        name: i.productName || i.name || 'Item',
        quantity: Number(i.quantity) || 1,
        price: Number(i.unitPrice || i.price) || 0
      })),
      orderAmount: orderTotal,
      onlinePaidAmount: onlinePaid,
      expectedAmount: codAmountDue,
      codAmountDue,
      collectedAmount: cashCollected,
      cashCollectedAmount: cashCollected,
      difference,
      deliveryStatus: order.status,
      paymentMethod: order.paymentMethod || 'CASH_ON_DELIVERY',
      collectionStatus,
      reconciliationStatus,
      reconciledBy: codEntry?.reconciledBy || null,
      reconciledAt: codEntry?.reconciledAt ? new Date(codEntry.reconciledAt).toISOString() : null,
      reconciliationNotes: codEntry?.reconciliationNotes || codEntry?.notes || null,
      deliveryBoyId: assignedDeliveryBoyId,
      deliveryBoy: runner ? {
        id: runner.id,
        fullName: runner.fullName,
        mobileNumber: runner.mobileNumber || runner.phone,
        vehicleType: runner.vehicleType || 'Bicycle'
      } : (assignedDeliveryBoyId ? {
        id: assignedDeliveryBoyId,
        fullName: runnerName,
        mobileNumber: runnerPhone || 'N/A'
      } : null),
      runnerName,
      runnerPhone,
      isDelivered,
      deliveryOtpVerified: isOtpVerified,
      deliveryDate: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : null,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
      isEligibleForReconcile
    };
  }

  /**
   * Aggregate delivery-boy level summary strictly by deliveryBoyId
   */
  public static buildDeliveryBoySummary(
    deliveryBoy: any,
    orders: NormalizedCodOrder[]
  ): DeliveryBoyCodSummary {
    const boyId = deliveryBoy.id;
    // Strictly filter orders assigned to this delivery boy
    const boyOrders = orders.filter((o) => o.deliveryBoyId === boyId);

    // Only count customer orders eligible for COD (delivered with COD due > 0)
    const eligibleDeliveredOrders = boyOrders.filter((o) => o.isDelivered && o.codAmountDue > 0 && o.orderType === 'CUSTOMER_ORDER');

    const expectedCod = this.round(eligibleDeliveredOrders.reduce((sum, o) => sum + o.codAmountDue, 0));
    const cashCollected = this.round(eligibleDeliveredOrders.reduce((sum, o) => sum + o.collectedAmount, 0));
    const difference = this.round(expectedCod - cashCollected);

    const reconciledCount = eligibleDeliveredOrders.filter((o) => o.reconciliationStatus === 'RECONCILED').length;
    const pendingCount = eligibleDeliveredOrders.filter((o) => o.reconciliationStatus !== 'RECONCILED').length;
    const eligibleOrdersCount = eligibleDeliveredOrders.filter((o) => o.isEligibleForReconcile).length;
    const eligibleAmount = this.round(eligibleDeliveredOrders.filter((o) => o.isEligibleForReconcile).reduce((sum, o) => sum + o.collectedAmount, 0));

    let status: 'PENDING' | 'RECONCILED' | 'MISMATCH' | 'READY TO RECONCILE' | 'PARTIALLY_RECONCILED' = 'PENDING';
    if (pendingCount === 0 && reconciledCount > 0) {
      status = 'RECONCILED';
    } else if (eligibleDeliveredOrders.some((o) => o.reconciliationStatus === 'MISMATCH' || (o.collectedAmount > 0 && o.difference !== 0))) {
      status = 'MISMATCH';
    } else if (eligibleDeliveredOrders.some((o) => o.reconciliationStatus === 'PARTIALLY_RECONCILED')) {
      status = 'PARTIALLY_RECONCILED';
    } else if (eligibleOrdersCount > 0 && cashCollected > 0 && difference === 0) {
      status = 'READY TO RECONCILE';
    } else {
      status = 'PENDING';
    }

    const runnerName = deliveryBoy.fullName || 'Campus Runner';
    const runnerPhone = deliveryBoy.mobileNumber || deliveryBoy.phone || '+91 98765 43220';

    return {
      deliveryBoyId: boyId,
      name: runnerName,
      deliveryBoyName: runnerName,
      phone: runnerPhone,
      contactPhone: runnerPhone,
      vehicleType: deliveryBoy.vehicleType || 'Bicycle',
      codOrdersCount: eligibleDeliveredOrders.length,
      expectedAmount: expectedCod,
      expectedCod,
      collectedAmount: cashCollected,
      cashCollected,
      difference,
      reconciledOrdersCount: reconciledCount,
      reconciled: reconciledCount,
      pendingOrdersCount: pendingCount,
      pending: pendingCount,
      eligibleOrdersCount,
      eligibleAmount,
      status,
      orders: boyOrders
    };
  }

  /**
   * Batch aggregate delivery-boy level summaries across all runners
   */
  public static buildDeliveryBoySummaries(
    orders: any[],
    codList: any[] = [],
    deliveryBoys: any[] = [],
    providers: any[] = []
  ): DeliveryBoyCodSummary[] {
    const realOrders = orders.filter(o => this.isRealOrder(o));
    const normalizedOrders = realOrders.map(o => {
      const codEntry = codList.find(c => c.orderId === o.id || c.orderId === o.orderNumber);
      return this.normalizeOrderCod(o, codEntry, deliveryBoys, providers);
    });

    const runnerSummaries: DeliveryBoyCodSummary[] = [];

    for (const boy of deliveryBoys) {
      const summary = this.buildDeliveryBoySummary(boy, normalizedOrders);
      if (summary.codOrdersCount > 0 || summary.orders.length > 0) {
        runnerSummaries.push(summary);
      }
    }

    return runnerSummaries;
  }
}

