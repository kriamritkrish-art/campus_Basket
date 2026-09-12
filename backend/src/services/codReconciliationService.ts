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
    if (!num || num === 'N/A' || num === 'NULL' || num === 'UNDEFINED') return false;
    // Only filter out test orders if they are not delivered and have no OTP verification
    if ((num.startsWith('TEST-ORDER') || num.startsWith('TEST_') || num.startsWith('DEMO-') || num.startsWith('DUMMY-')) && order.status !== 'DELIVERED' && !order.deliveryOtpVerified) {
      return false;
    }
    return true;
  }

  public static resolveOrderDisplayNumber(order: any): string {
    const orderNumber = String(order?.orderNumber || '').trim();
    const fallbackId = String(order?.id || '').trim();
    if (!orderNumber || orderNumber === 'N/A' || orderNumber === 'NULL' || orderNumber === 'UNDEFINED') {
      return fallbackId || 'Order number unavailable';
    }
    const normalized = orderNumber.toUpperCase();
    if (normalized.startsWith('TEST-ORDER') || normalized.startsWith('TEST_') || normalized.startsWith('DEMO-') || normalized.startsWith('DUMMY-')) {
      return fallbackId || 'Order number unavailable';
    }
    return orderNumber;
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

    // Order status and delivery verification (supports DELIVERED, COMPLETED, deliveredAt, or OTP verified)
    const isDelivered = order.status === 'DELIVERED' || order.status === 'COMPLETED' || Boolean(order.deliveredAt) || Boolean(order.deliveryOtpVerified);
    const isOtpVerified = Boolean(order.deliveryOtpVerified || isDelivered);
    const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';
    const orderType = this.determineOrderType(order);

    // COD Eligibility: Must be delivered, not cancelled, COD Due > 0, and not a non-cash laundry pickup
    const isCod = order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'COD' || String(order.paymentMethod || '').toUpperCase().includes('COD') || String(order.paymentMethod || '').toUpperCase().includes('CASH');
    const isEligibleOrder = isDelivered && !isCancelled && codAmountDue > 0 && isCod && orderType !== 'LAUNDRY_PICKUP';

    // Delivery Boy resolution - robust multi-attribute matching (ID, user ID, phone, name)
    const assignedDeliveryBoyId = order.deliveryBoyId || codEntry?.deliveryBoyId || order.deliveryBoy?.id || null;
    const orderRunnerPhone = order.deliveryBoyPhone || order.deliveryBoy?.mobileNumber || order.deliveryBoy?.phone || codEntry?.deliveryBoyPhone || null;
    const cleanOrderPhone = orderRunnerPhone ? String(orderRunnerPhone).replace(/\D/g, '') : '';
    const orderRunnerName = order.deliveryBoy?.fullName || order.deliveryBoy?.name || null;

    const runner = deliveryBoys.find((d: any) => {
      if (assignedDeliveryBoyId && (d.id === assignedDeliveryBoyId || d.userId === assignedDeliveryBoyId)) return true;
      const dPhone = String(d.mobileNumber || d.phone || d.user?.phone || d.user?.mobileNumber || '').replace(/\D/g, '');
      if (cleanOrderPhone && dPhone && (dPhone === cleanOrderPhone || dPhone.endsWith(cleanOrderPhone) || cleanOrderPhone.endsWith(dPhone))) return true;
      if (assignedDeliveryBoyId && d.id && (assignedDeliveryBoyId.includes(d.id) || d.id.includes(assignedDeliveryBoyId))) return true;
      if (orderRunnerName && d.fullName && orderRunnerName.trim().toLowerCase() === d.fullName.trim().toLowerCase()) {
        if (!cleanOrderPhone || !dPhone || cleanOrderPhone === dPhone) return true;
      }
      return false;
    });

    const runnerName = runner?.fullName || orderRunnerName || (assignedDeliveryBoyId ? 'Campus Delivery Partner' : 'Unassigned Runner');
    const runnerPhone = runner?.mobileNumber || runner?.phone || (runner as any)?.user?.phone || orderRunnerPhone || null;

    // Provider resolution
    const prov = providers.find((p: any) => p.id === order.providerId) || order.provider;
    const providerName = prov?.fullName || prov?.name || 'Campus Provider';

    // Actual Cash Collected
    const rawCollected = codEntry
      ? (codEntry.collectedAmount !== undefined ? codEntry.collectedAmount : codEntry.amountCollected)
      : null;
    const parsedCollected = rawCollected !== null && rawCollected !== undefined ? Number(rawCollected) : null;
    
    // If an explicit non-zero collection entry exists, use its number; otherwise if delivered COD or marked collected, default to codAmountDue
    let cashCollected = 0;
    if (parsedCollected !== null && !isNaN(parsedCollected) && parsedCollected > 0) {
      cashCollected = this.round(parsedCollected);
    } else if (codEntry?.collectionStatus === 'COLLECTED' || order.paymentStatus === 'COD_COLLECTED' || (isDelivered && codAmountDue > 0)) {
      cashCollected = codAmountDue;
    } else if (parsedCollected !== null && !isNaN(parsedCollected)) {
      cashCollected = this.round(parsedCollected);
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
      else if (s === 'PENDING' && isDelivered && cashCollected >= codAmountDue && codAmountDue > 0) collectionStatus = 'COLLECTED';
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

    // Is Eligible For Reconcile action (delivered, has collectible COD, not already reconciled, not a mismatch)
    const isEligibleForReconcile =
      isEligibleOrder &&
      reconciliationStatus !== 'RECONCILED' &&
      reconciliationStatus !== 'MISMATCH';

    // Real order number: strictly genuine identifier
    const genuineOrderNumber = this.resolveOrderDisplayNumber(order);

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
      deliveryBoyId: runner ? runner.id : assignedDeliveryBoyId,
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
    const boyId = String(deliveryBoy.id || '');
    const boyUserId = String(deliveryBoy.userId || '');
    const boyPhone = deliveryBoy.mobileNumber || deliveryBoy.phone || deliveryBoy.user?.phone;
    const cleanBoyPhone = boyPhone ? String(boyPhone).replace(/\D/g, '') : '';
    const boyName = String(deliveryBoy.fullName || deliveryBoy.name || '').trim().toLowerCase();

    // Filter orders assigned to this delivery boy (matching id, userId, phone, or runner name)
    const boyOrders = orders.filter((o) => {
      // 1. Match by DeliveryBoy ID or User ID
      if (o.deliveryBoyId && (o.deliveryBoyId === boyId || o.deliveryBoyId === boyUserId)) return true;
      if (o.deliveryBoy && (o.deliveryBoy.id === boyId || (o.deliveryBoy as any).userId === boyUserId)) return true;

      // 2. Match by normalized phone number
      const oPhone = String(o.runnerPhone || o.deliveryBoy?.mobileNumber || (o.deliveryBoy as any)?.phone || '').replace(/\D/g, '');
      if (cleanBoyPhone && oPhone && (cleanBoyPhone === oPhone || cleanBoyPhone.endsWith(oPhone) || oPhone.endsWith(cleanBoyPhone))) {
        return true;
      }

      // 3. Match by ID substring (e.g. db_boy_sourav_1 vs sourav_1)
      if (o.deliveryBoyId && boyId && (o.deliveryBoyId.includes(boyId) || boyId.includes(o.deliveryBoyId))) {
        return true;
      }

      // 4. Match by Runner Full Name if phone does not conflict
      const oName = String(o.runnerName || o.deliveryBoy?.fullName || '').trim().toLowerCase();
      if (boyName && oName && boyName === oName && boyName !== 'campus delivery partner' && boyName !== 'unassigned runner') {
        if (!cleanBoyPhone || !oPhone || cleanBoyPhone === oPhone) return true;
      }

      return false;
    });

    // Only count customer orders eligible for COD (delivered with COD due > 0 and not non-cash pickup)
    const eligibleDeliveredOrders = boyOrders.filter((o) => o.isDelivered && o.codAmountDue > 0 && o.deliveryStatus !== 'CANCELLED' && o.orderType !== 'LAUNDRY_PICKUP');

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
    } else if (eligibleOrdersCount > 0) {
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

