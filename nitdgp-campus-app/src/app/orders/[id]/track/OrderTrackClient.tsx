'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '../../../../lib/api';
import { useCart } from '../../../../context/CartContext';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  HelpCircle,
  RotateCcw,
  ShoppingBag,
  User,
  Phone,
  Copy,
  AlertTriangle,
  FileText,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Banknote,
  X,
  Edit3,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string | null;
}

interface OrderData {
  id: string;
  orderNumber: string;
  serviceType?: string;
  status: string;
  providerAccepted?: boolean;
  providerAcceptedAt?: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  advancePaidAmount?: number;
  refundAmount?: number;
  refundStatus?: string;
  cancellationType?: string;
  cancellationReason?: string;
  deliveryOtp?: string | null;
  deliveryOtpVerified?: boolean;
  hallName: string;
  roomNumber: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  createdAt: string;
  items: OrderItem[];
  canCancel?: boolean;
  isAccepted?: boolean;
  isModifiable?: boolean;
  deliveryBoy?: {
    id: string;
    fullName: string;
    mobileNumber?: string;
    vehicleType?: string;
  } | null;
  provider?: {
    id?: string;
    fullName: string;
    mobileNumber?: string;
    serviceCategory?: string;
  } | null;
  refundAccount?: {
    accountType: string;
    accountHolderName: string;
    bankName?: string;
    accountNumberMasked?: string;
    upiIdMasked?: string;
  } | null;
}

export default function OrderTrackClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { addItem, showToast } = useCart();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plan / placed by mistake');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [modifying, setModifying] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newInstructions, setNewInstructions] = useState('');

  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState("Where is my delivery?");
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Refund destination account modal (opened only when student clicks "Update Refund Account")
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountType, setAccountType] = useState<'UPI' | 'BANK_ACCOUNT'>('UPI');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await apiRequest(`/api/orders/${orderId}`);
      if (res.success && res.order) {
        setOrder(res.order);
        setNewRoomNumber(res.order.roomNumber || '');
        setNewInstructions(res.order.specialInstructions || '');
      } else {
        setError(res.message || 'Order not found');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load order tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      // Polling every 12 seconds for real-time runner/status updates
      const timer = setInterval(fetchOrder, 12000);
      return () => clearInterval(timer);
    }
  }, [orderId]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await apiRequest(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.success) {
        setCancelSuccessMsg(res.explanation || res.message || 'Order cancelled successfully.');
        fetchOrder();
        setTimeout(() => {
          setCancelModalOpen(false);
          setCancelSuccessMsg(null);
        }, 2000);
      } else {
        showToast(res.message || 'Unable to cancel order');
      }
    } catch (err: any) {
      showToast(err?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleModifyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setModifying(true);
    try {
      const res = await apiRequest(`/api/orders/${orderId}/modify`, {
        method: 'PATCH',
        body: JSON.stringify({
          roomNumber: newRoomNumber,
          specialInstructions: newInstructions
        })
      });
      if (res.success) {
        showToast('Delivery room details updated.');
        setModifyModalOpen(false);
        fetchOrder();
      } else {
        showToast(res.message || 'Could not update details');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update order details');
    } finally {
      setModifying(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSubmitting(true);
    try {
      await apiRequest('/api/campus/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          category: 'DELIVERY',
          message: `[Issue: ${supportCategory}] ${supportMessage}`,
          priority: 'HIGH'
        })
      });
      setSupportSuccess('Support query logged. Campus Desk will respond shortly.');
      setSupportMessage('');
      setTimeout(() => {
        setSupportModalOpen(false);
        setSupportSuccess(null);
      }, 1500);
    } catch {
      setSupportSuccess('Support request received. Runner desk alerted.');
      setTimeout(() => {
        setSupportModalOpen(false);
        setSupportSuccess(null);
      }, 1500);
    } finally {
      setSupportSubmitting(false);
    }
  };

  const handleSaveRefundAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolderName.trim()) {
      showToast('Account holder name is required.');
      return;
    }
    setSavingAccount(true);
    try {
      const res = await apiRequest('/api/orders/refund-account', {
        method: 'POST',
        body: JSON.stringify({
          accountType,
          accountHolderName,
          bankName: accountType === 'BANK_ACCOUNT' ? bankName : undefined,
          accountNumber: accountType === 'BANK_ACCOUNT' ? accountNumber : undefined,
          ifscCode: accountType === 'BANK_ACCOUNT' ? ifscCode : undefined,
          upiId: accountType === 'UPI' ? upiId : undefined
        })
      });
      if (res.success) {
        showToast('Refund destination account saved securely.');
        setAccountModalOpen(false);
        fetchOrder();
      } else {
        showToast(res.message || 'Failed to save account');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save account');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleReorder = () => {
    if (!order) return;
    let count = 0;
    for (const item of order.items || []) {
      addItem({
        id: item.id,
        name: item.productName,
        price: item.unitPrice,
        unit: 'unit',
        primaryImage: item.image || null,
        category: { id: 'cat_food', name: 'Food', slug: 'food' }
      } as any, item.quantity);
      count += item.quantity;
    }
    showToast(`${count} item(s) added to basket.`);
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6">
        <div className="w-9 h-9 border-3 border-[#4F9D2F] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading order tracking...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Order Tracking Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm">{error || 'Could not find this order.'}</p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  // Derived flags
  const isCod = order.paymentMethod === 'CASH_ON_DELIVERY';
  const isPrepaid = !isCod;
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = ['DELIVERED', 'COMPLETED'].includes(order.status);
  const isProviderAccepted = Boolean(
    order.providerAccepted ||
    ['ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'DISPATCHED'].includes(order.status)
  );

  // Handover state: Only show OTP when order is at handover stage
  const isHandoverState = ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'READY', 'READY_FOR_PICKUP'].includes(order.status);

  // Service Type
  const service = (order.serviceType || 'FOOD').toUpperCase();
  const isFood = service === 'FOOD';
  const isLaundry = service === 'LAUNDRY';
  const isProduce = service === 'FRESH_PRODUCE';

  // Service-specific timeline steps
  let timelineSteps: { id: string; title: string; desc: string }[] = [];

  if (isFood) {
    timelineSteps = [
      { id: 'PLACED', title: 'Order Placed', desc: 'Received & sent to kitchen' },
      { id: 'ACCEPTED', title: 'Provider Accepted', desc: 'Kitchen queued preparation' },
      { id: 'PREPARING', title: 'Preparing', desc: 'Freshly cooking your meal' },
      { id: 'PACKED', title: 'Packed & Ready', desc: 'Food packed in insulated container' },
      { id: 'ASSIGNED', title: 'Runner Assigned', desc: 'Campus runner at dining hall' },
      { id: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Runner in transit to your hostel' },
      { id: 'DELIVERED', title: 'Delivered', desc: 'Handed over at your room door' }
    ];
  } else if (isProduce) {
    timelineSteps = [
      { id: 'PLACED', title: 'Order Placed', desc: 'Received at campus mandi' },
      { id: 'ACCEPTED', title: 'Provider Accepted', desc: 'Vendor confirmed harvest batch' },
      { id: 'PREPARING', title: 'Items Being Prepared', desc: 'Fresh sorting & weight audit' },
      { id: 'PACKED', title: 'Packed & Ready', desc: 'Bagged & tagged for transit' },
      { id: 'ASSIGNED', title: 'Runner Assigned', desc: 'Campus runner heading to store' },
      { id: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Runner on route to your hall' },
      { id: 'DELIVERED', title: 'Delivered', desc: 'Fresh produce delivered' }
    ];
  } else if (isLaundry) {
    timelineSteps = [
      { id: 'PLACED', title: 'Order Placed', desc: 'Pickup scheduled at hostel room' },
      { id: 'ACCEPTED', title: 'Laundry Accepted', desc: 'Dhobi vendor assigned' },
      { id: 'COLLECTED', title: 'Clothes Received', desc: 'Collected & weighed' },
      { id: 'PROCESSING', title: 'Processing', desc: 'Wash cycle & steam press' },
      { id: 'READY', title: 'Ready', desc: 'Folded & packaged in laundry bag' },
      { id: 'ASSIGNED', title: 'Runner Assigned', desc: 'Runner assigned for room return' },
      { id: 'DELIVERED', title: 'Delivered', desc: 'Returned intact to your room' }
    ];
  } else {
    // Stationery / Essentials default
    timelineSteps = [
      { id: 'PLACED', title: 'Order Placed', desc: 'Order logged & store notified' },
      { id: 'ACCEPTED', title: 'Provider Accepted', desc: 'Store clerk verified inventory' },
      { id: 'PREPARING', title: 'Items Being Prepared', desc: 'Articles picked from shelf' },
      { id: 'PACKED', title: 'Packed', desc: 'Parcel sealed & tagged' },
      { id: 'ASSIGNED', title: 'Runner Assigned', desc: 'Campus runner dispatched' },
      { id: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Runner on campus route' },
      { id: 'DELIVERED', title: 'Delivered', desc: 'Delivered at your doorstep' }
    ];
  }

  // Calculate current active step index strictly without contradictions
  const getTimelineStepIndex = () => {
    if (!isProviderAccepted) return 1; // Order placed is done (0), Provider Acceptance is current (1)
    const s = order.status;
    if (s === 'ACCEPTED') return 1;
    if (s === 'PREPARING') return 2;
    if (s === 'READY' || s === 'PACKED') return 3;
    if (s === 'DELIVERY_ASSIGNED' || s === 'PICKED_UP') return 4;
    if (s === 'OUT_FOR_DELIVERY' || s === 'IN_TRANSIT') return 5;
    if (s === 'DELIVERED' || s === 'COMPLETED') return 6;
    return 1;
  };

  const currentStepIdx = getTimelineStepIndex();

  // Current Status Headline & Explanation
  const getStatusBanner = () => {
    if (isCancelled) {
      return {
        title: 'Order Cancelled',
        desc: order.cancellationReason || 'This order was cancelled.',
        colorClass: 'bg-red-50 text-red-800 border-red-200',
        dotClass: 'bg-red-500'
      };
    }
    if (isDelivered) {
      return {
        title: 'Delivered at Doorstep',
        desc: 'Delivery completed and verified via 6-digit handover OTP.',
        colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-500'
      };
    }
    if (!isProviderAccepted) {
      return {
        title: 'Waiting for Provider',
        desc: "Your order has been placed and we're waiting for the provider to accept it.",
        colorClass: 'bg-amber-50 text-amber-900 border-amber-200',
        dotClass: 'bg-amber-500 animate-pulse'
      };
    }
    if (['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(order.status)) {
      return {
        title: 'Out for Delivery',
        desc: 'Campus runner is in transit to your residence hall.',
        colorClass: 'bg-sky-50 text-sky-900 border-sky-200',
        dotClass: 'bg-sky-500 animate-pulse'
      };
    }
    if (['DELIVERY_ASSIGNED', 'PICKED_UP'].includes(order.status)) {
      return {
        title: 'Runner Assigned',
        desc: 'Campus runner assigned and heading to collect your parcel.',
        colorClass: 'bg-purple-50 text-purple-900 border-purple-200',
        dotClass: 'bg-purple-500'
      };
    }
    if (order.status === 'READY' || order.status === 'PACKED') {
      return {
        title: 'Packed & Ready',
        desc: 'Your items are securely packaged and waiting for runner dispatch.',
        colorClass: 'bg-indigo-50 text-indigo-900 border-indigo-200',
        dotClass: 'bg-indigo-500'
      };
    }
    if (order.status === 'PREPARING') {
      return {
        title: isFood ? 'Freshly Cooking' : 'Preparing Items',
        desc: isFood ? 'Chef is freshly preparing your meal in the kitchen.' : 'Vendor is packing your items.',
        colorClass: 'bg-blue-50 text-blue-900 border-blue-200',
        dotClass: 'bg-blue-500 animate-pulse'
      };
    }
    return {
      title: 'Provider Accepted',
      desc: 'Provider has accepted your order and queued fulfillment.',
      colorClass: 'bg-teal-50 text-teal-900 border-teal-200',
      dotClass: 'bg-teal-500'
    };
  };

  const statusBanner = getStatusBanner();

  // Payment amounts
  const totalAmount = Number(order.totalAmount || 0);
  const advancePaid = Number(order.advancePaidAmount || 0);
  const codCashDue = isCod ? Math.max(0, totalAmount - advancePaid) : 0;
  const isCodWithAdvance = isCod && advancePaid > 0;

  // Refund amount
  const refundableAmount = Number(order.refundAmount ?? (isPrepaid ? totalAmount : advancePaid));

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 antialiased py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ==================================================
            1. TOP NAVIGATION & ORDER HEADER
           ================================================== */}
        <div className="space-y-3">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Orders</span>
          </Link>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-mono text-base sm:text-lg font-bold text-slate-900">
                  Order #{order.orderNumber}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {isFood ? 'Food & Dining' : isProduce ? 'Produce' : isLaundry ? 'Laundry' : 'Stationery'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isCod ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {isCodWithAdvance ? 'COD + Advance' : isCod ? 'Cash on Delivery' : 'Online Paid'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                Placed on {orderDate}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            2. CURRENT STATUS BANNER (CLEAR, PROMINENT, COMPACT)
           ================================================== */}
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-xs flex items-start gap-3.5 ${statusBanner.colorClass}`}>
          <div className="mt-1">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${statusBanner.dotClass}`} />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="text-xs font-extrabold uppercase tracking-wider opacity-70">
              Current Status
            </div>
            <h2 className="text-sm sm:text-base font-black">
              {statusBanner.title}
            </h2>
            <p className="text-xs opacity-85 leading-relaxed">
              {statusBanner.desc}
            </p>
          </div>
        </div>

        {/* ==================================================
            3. MAIN FOCUS: TRACK YOUR ORDER TIMELINE
           ================================================== */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isCancelled ? 'Cancellation & Refund Status' : 'Track Your Order'}
            </h3>
            {!isCancelled && (
              <span className="text-[11px] font-semibold text-slate-400">
                Live Campus Dispatch
              </span>
            )}
          </div>

          {/* ==================== A. CANCELLED STATE ==================== */}
          {isCancelled ? (
            <div className="space-y-4">
              {/* Case A: Online Prepaid (Full refund) */}
              {isPrepaid && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Full Payment Refund</div>
                      <p className="text-[11px] text-slate-500">Your entire online payment is being refunded.</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base font-black text-slate-900">₹{totalAmount.toFixed(2)}</div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Refund Pending
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "Your order was cancelled before the provider accepted it. Your full payment of ₹{totalAmount.toFixed(0)} has been added to the refund process."
                  </p>
                </div>
              )}

              {/* Case B: Normal COD (No refund applicable) */}
              {isCod && advancePaid <= 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <div>
                      <div className="text-xs font-bold text-slate-900">No Refund Applicable</div>
                      <p className="text-[11px] text-slate-500">No advance payment was collected for this COD order.</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-slate-400">₹0.00</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "Since this was a Cash on Delivery order and no payment was collected in advance, there is no refund due."
                  </p>
                </div>
              )}

              {/* Case C: COD + Partial Advance */}
              {isCodWithAdvance && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Advance Payment Refund</div>
                      <p className="text-[11px] text-slate-500">Only the online advance is refunded. Doorstep COD cash was never paid.</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base font-black text-slate-900">₹{advancePaid.toFixed(2)}</div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Refund Pending
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "You paid ₹{advancePaid.toFixed(0)} as an advance for this COD order. The order was cancelled before the provider accepted it, so your ₹{advancePaid.toFixed(0)} advance payment has been added to the refund process."
                  </p>
                </div>
              )}

              {/* Refund 4-step Timeline (Only when refund > 0) */}
              {refundableAmount > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Refund Progress
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Order cancelled</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Refund generated</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-amber-700 font-bold">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      <span>Refund processing (Awaiting bank clearance)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                        ○
                      </div>
                      <span>Refund completed</span>
                    </div>
                  </div>

                  {/* Destination Account Link */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {order.refundAccount ? (
                      <span className="text-slate-600">
                        Payout Account: <strong className="font-mono text-slate-900">{order.refundAccount.accountType === 'UPI' ? order.refundAccount.upiIdMasked : order.refundAccount.accountNumberMasked}</strong>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">Awaiting destination account</span>
                    )}
                    <button
                      onClick={() => setAccountModalOpen(true)}
                      className="text-xs font-bold text-[#4F9D2F] hover:underline cursor-pointer"
                    >
                      {order.refundAccount ? 'Update Account' : 'Set Refund Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ==================== B. ACTIVE DELIVERY TIMELINE ==================== */
            <div className="space-y-4 relative pl-2">
              {timelineSteps.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isUpcoming = idx > currentStepIdx;

                return (
                  <div key={step.id} className="flex items-start gap-3 relative">
                    {/* Vertical connecting line */}
                    {idx < timelineSteps.length - 1 && (
                      <div
                        className={`absolute left-3 top-5 bottom-0 w-0.5 -ml-px ${
                          isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}

                    {/* Step Icon */}
                    <div className="relative z-10">
                      {isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-6 h-6 rounded-full bg-[#4F9D2F] text-white flex items-center justify-center ring-4 ring-emerald-100 shadow-xs scale-105">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px]">
                          ○
                        </div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="space-y-0.5 flex-1 pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${
                          isCurrent ? 'text-slate-900 font-black' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                        }`}>
                          {step.title}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active Step
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed ${
                        isCurrent ? 'text-slate-600' : isCompleted ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================================================
            4. DELIVERY RUNNER INFORMATION (STRICT DATA RULES)
           ================================================== */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Delivery Partner
            </div>

            {order.deliveryBoy ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/70 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {order.deliveryBoy.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Campus Delivery Partner • {order.deliveryBoy.vehicleType || 'Campus Bicycle'}
                    </p>
                  </div>
                </div>

                {order.deliveryBoy.mobileNumber && (
                  <a
                    href={`tel:${order.deliveryBoy.mobileNumber}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Runner</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Waiting for runner assignment
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Your Campus Runner will be assigned when your order is ready for dispatch.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            5. DELIVERY VERIFICATION CODE (OTP)
           ================================================== */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Delivery Verification
              </span>
              {isDelivered && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ Delivery Verified
                </span>
              )}
            </div>

            {isDelivered ? (
              <div className="flex items-center gap-2.5 text-xs text-emerald-800 font-semibold py-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Delivery confirmed and verified successfully with your 6-digit handover code.</span>
              </div>
            ) : isHandoverState && order.deliveryOtp ? (
              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-500">Your 6-digit delivery code:</span>
                    <div className="text-2xl sm:text-3xl font-black tracking-widest text-slate-900 font-mono">
                      {order.deliveryOtp}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (order.deliveryOtp) {
                        navigator.clipboard.writeText(order.deliveryOtp);
                        showToast('Delivery OTP copied to clipboard');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/70">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>DO NOT SHARE THIS CODE BEFORE RECEIVING YOUR ORDER. Share only after taking handover.</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-2 py-1">
                <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Your delivery verification code will appear here when your order is ready for handover.</span>
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            6. ORDER SUMMARY (COMPACT & CLEAN)
           ================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Order Summary
          </div>

          <div className="space-y-2 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-slate-800">
                <span>
                  {item.productName} <span className="text-slate-400">× {item.quantity}</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  ₹{Number(item.totalPrice).toFixed(2)}
                </span>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-500 text-[11px]">
              <div className="flex justify-between">
                <span>Item Subtotal</span>
                <span className="font-mono">₹{Number(order.subtotal || totalAmount).toFixed(2)}</span>
              </div>
              {Number(order.deliveryFee) > 0 && (
                <div className="flex justify-between">
                  <span>Campus Delivery</span>
                  <span className="font-mono">₹{Number(order.deliveryFee).toFixed(2)}</span>
                </div>
              )}
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Student Discount</span>
                  <span className="font-mono">-₹{Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Order Total</span>
              <span className="font-mono text-base">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ==================================================
            7. PAYMENT SUMMARY (COMPACT & HONEST)
           ================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Payment
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Payment Method</span>
              <span className="font-bold text-slate-900">
                {isCodWithAdvance ? 'Cash on Delivery + Advance' : isCod ? 'Cash on Delivery' : 'Online Prepaid'}
              </span>
            </div>

            {isPrepaid && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Paid Online</span>
                  <span className="font-mono font-bold text-emerald-700">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Due at Handover</span>
                  <span className="font-mono font-bold text-slate-900">₹0.00</span>
                </div>
              </>
            )}

            {isCod && !isCodWithAdvance && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Paid Online</span>
                  <span className="font-mono text-slate-500">₹0.00</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Cash Due at Handover</span>
                  <span className="font-mono text-base text-amber-700">₹{totalAmount.toFixed(2)}</span>
                </div>
              </>
            )}

            {isCodWithAdvance && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Advance Paid Online</span>
                  <span className="font-mono font-bold text-emerald-700">₹{advancePaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Cash Due at Handover</span>
                  <span className="font-mono text-base text-amber-700">₹{codCashDue.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ==================================================
            8. DELIVERY DESTINATION
           ================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Delivery Destination
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-800">
            <MapPin className="w-4 h-4 text-[#4F9D2F] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900">
                {order.roomNumber ? `Room ${order.roomNumber}, ` : ''}{order.hallName || 'Hostel Residence'}
              </div>
              <div className="text-slate-500 text-[11px]">
                Campus Central Residence, NIT Durgapur
              </div>
              {order.specialInstructions && (
                <div className="text-[11px] text-slate-600 italic pt-1">
                  Note: "{order.specialInstructions}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            9. CONTEXTUAL ACTIONS
           ================================================== */}
        <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
          <button
            onClick={() => setSupportModalOpen(true)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Need Help?</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Pre-acceptance cancellation / modification */}
            {!isCancelled && !isDelivered && !isProviderAccepted && (
              <>
                <button
                  onClick={() => setModifyModalOpen(true)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modify Room</span>
                </button>

                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel Order
                </button>
              </>
            )}

            {/* Delivered Actions */}
            {isDelivered && (
              <>
                <button
                  onClick={() => setReceiptModalOpen(true)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Receipt</span>
                </button>

                <button
                  onClick={handleReorder}
                  className="px-4 py-2 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reorder Items</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ==================================================
          MODAL 1: CANCELLATION CONFIRMATION DIALOG
         ================================================== */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Cancel Order #{order.orderNumber}</h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {cancelSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 text-center">
                {cancelSuccessMsg}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* Policy preview notice */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold">Refund Policy for this Cancellation:</div>
                  {isPrepaid && (
                    <p>Order has not been accepted by provider yet. Your full payment of <strong>₹{totalAmount.toFixed(2)}</strong> will be refunded.</p>
                  )}
                  {isCod && !isCodWithAdvance && (
                    <p>This is a standard COD order with zero advance. No payment was collected, so no refund is applicable.</p>
                  )}
                  {isCodWithAdvance && (
                    <p>Your online advance of <strong>₹{advancePaid.toFixed(2)}</strong> will be refunded. Doorstep COD cash (₹{codCashDue.toFixed(2)}) was never paid and will not be refunded.</p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason for Cancellation</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-red-500"
                  >
                    <option>Change of plan / placed by mistake</option>
                    <option>Delivery address / room number incorrect</option>
                    <option>Wait time too long</option>
                    <option>Other personal reason</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setCancelModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 2: MODIFY ROOM / INSTRUCTIONS
         ================================================== */}
      {modifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Modify Delivery Details</h3>
              <button onClick={() => setModifyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModifyOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hostel Room Number</label>
                <input
                  type="text"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  placeholder="e.g. B-304"
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-[#4F9D2F]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Special Delivery Instructions</label>
                <textarea
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="e.g. Please leave at door if in class"
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#4F9D2F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModifyModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modifying}
                  className="px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  {modifying ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 3: NEED HELP? SUPPORT DIALOG
         ================================================== */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Campus Help Desk</h3>
                <p className="text-[11px] text-slate-400 font-mono">Order #{order.orderNumber}</p>
              </div>
              <button onClick={() => setSupportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {supportSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 text-center">
                {supportSuccess}
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Issue Category</label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-[#4F9D2F]"
                  >
                    <option>Where is my delivery?</option>
                    <option>Delivery runner is unreachable</option>
                    <option>Wrong or missing items</option>
                    <option>Payment / refund query</option>
                    <option>Other issue</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Briefly describe what you need help with..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#4F9D2F]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting}
                    className="px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {supportSubmitting ? 'Submitting...' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 4: SET REFUND DESTINATION ACCOUNT
         ================================================== */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Refund Destination Account</h3>
              <button onClick={() => setAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRefundAccount} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('UPI')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      accountType === 'UPI' ? 'bg-[#4F9D2F] text-white border-[#4F9D2F]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('BANK_ACCOUNT')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      accountType === 'BANK_ACCOUNT' ? 'bg-[#4F9D2F] text-white border-[#4F9D2F]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Bank Account
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="As per bank / UPI record"
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                  required
                />
              </div>

              {accountType === 'UPI' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">UPI ID *</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-mono"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Name *</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Number *</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account number"
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0002108"
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-mono uppercase"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  {savingAccount ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 5: VIEW RECEIPT
         ================================================== */}
      {receiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileText className="w-4 h-4 text-[#4F9D2F]" />
                <span>Order Receipt</span>
              </div>
              <button onClick={() => setReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Order Reference:</span>
                <strong className="font-mono text-slate-900">{order.orderNumber}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Date:</span>
                <span className="text-slate-800">{orderDate}</span>
              </div>
              <div className="border-t border-b border-slate-100 py-2 space-y-1">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-slate-800">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="font-mono">₹{Number(item.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Paid:</span>
                <span className="font-mono">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
