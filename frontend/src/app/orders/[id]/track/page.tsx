'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../../lib/api';
import { useCart } from '../../../../context/CartContext';
import {
  CheckCircle2,
  Clock,
  MapPin,
  HelpCircle,
  RotateCcw,
  ArrowLeft,
  XCircle,
  AlertTriangle,
  Zap,
  ShoppingBag,
  Sparkles,
  Phone,
  FileText,
  ChevronRight,
  Send,
  Building,
  Check
} from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string | null;
  product?: any;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  hallName: string;
  roomNumber: string;
  specialInstructions?: string;
  createdAt: string;
  items: OrderItem[];
  statusHistory?: any[];
  provider?: {
    fullName: string;
    mobileNumber?: string;
  };
}

const ORDER_FLOW_STEPS = [
  { key: 'PLACED', title: 'ORDER PLACED', desc: 'Received by Campus Basket' },
  { key: 'PAID', title: 'PAYMENT CONFIRMED', desc: 'Transaction verified' },
  { key: 'ACCEPTED', title: 'ORDER ACCEPTED', desc: 'Cafeteria acknowledged' },
  { key: 'PREPARING', title: 'PREPARING', desc: 'Freshly cooking / packing' },
  { key: 'READY', title: 'READY', desc: 'Dispatched to campus runner' },
  { key: 'OUT_FOR_DELIVERY', title: 'OUT FOR DELIVERY', desc: 'Runner in transit to your hall' },
  { key: 'DELIVERED', title: 'DELIVERED', desc: 'Delivered to your room door' }
];

export default function OrderTrackingPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isJustPlaced = searchParams.get('placed') === 'true';

  const { addItem, showToast } = useCart();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  // Support ticket modal state
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState('Order hasn\'t arrived');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  // View Receipt state
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);

  // Load Order Data
  const fetchOrder = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await apiRequest(`/api/orders/${id}`);
      if (res.success && res.order) {
        setOrder(res.order);
        setError(null);
      } else {
        setError(res.message || 'Order not found');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load your order.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(true);
    // Live tracking polling every 8 seconds
    const interval = setInterval(() => {
      fetchOrder(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [id]);

  // Determine active step index
  const getStepStatus = (stepIndex: number, currentStatus: string) => {
    if (currentStatus === 'CANCELLED') return 'cancelled';

    let activeIndex = 0;
    switch (currentStatus) {
      case 'PENDING':
        activeIndex = 0;
        break;
      case 'CONFIRMED':
        activeIndex = 2; // Placed, Paid, Accepted
        break;
      case 'PREPARING':
        activeIndex = 3;
        break;
      case 'READY':
        activeIndex = 4;
        break;
      case 'OUT_FOR_DELIVERY':
        activeIndex = 5;
        break;
      case 'DELIVERED':
        activeIndex = 6;
        break;
      default:
        activeIndex = 1;
    }

    if (stepIndex < activeIndex) return 'completed';
    if (stepIndex === activeIndex) return 'active';
    return 'upcoming';
  };

  // Status message copy
  const getStatusHeadline = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Waiting for payment confirmation...';
      case 'CONFIRMED':
        return 'Order Confirmed! Waiting for cafeteria prep...';
      case 'PREPARING':
        return 'Preparing your order...';
      case 'READY':
        return 'Your order is ready! Handed to hostel runner.';
      case 'OUT_FOR_DELIVERY':
        return 'Your order is out for delivery.';
      case 'DELIVERED':
        return 'Order Delivered Successfully.';
      case 'CANCELLED':
        return 'Order Cancelled.';
      default:
        return 'Processing your campus order...';
    }
  };

  // Reorder Handler
  const handleReorder = () => {
    if (!order?.items) return;
    let addedCount = 0;
    for (const item of order.items) {
      if (item.product) {
        addItem(item.product, item.quantity);
        addedCount += item.quantity;
      } else {
        // Fallback reconstructed product item
        addItem({
          id: item.id,
          name: item.productName,
          slug: item.productName.toLowerCase().replace(/\s+/g, '-'),
          price: item.unitPrice,
          stock: 50,
          isOutOfStock: false,
          unit: 'portion',
          primaryImage: item.image || null,
          category: { id: 'cat_food', name: 'Food', slug: 'food' }
        } as any, item.quantity);
        addedCount += item.quantity;
      }
    }
    showToast(`${addedCount} items added to your basket.`);
    router.push('/cart');
  };

  // Order Cancellation Handler
  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelMessage(null);
    try {
      const res = await apiRequest(`/api/orders/${id}/cancel`, { method: 'POST' });
      if (res.success) {
        setCancelMessage('Order cancelled successfully. Restoring inventory and processing refund.');
        await fetchOrder(false);
        setTimeout(() => setCancelModalOpen(false), 2000);
      } else {
        setCancelMessage(res.message || 'Cancellation could not be completed.');
      }
    } catch (err: any) {
      setCancelMessage(err.message || 'Unable to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // Support Ticket Submission Handler
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSupportSubmitting(true);
    setSupportSuccess(null);

    try {
      const categoryEnumMap: Record<string, string> = {
        'Order hasn\'t arrived': 'DELIVERY',
        'Missing item': 'FOOD',
        'Wrong item': 'FOOD',
        'Damaged item': 'FOOD',
        'Payment issue': 'PAYMENT',
        'Refund issue': 'PAYMENT',
        'Other issue': 'OTHER'
      };

      const res = await apiRequest('/api/campus/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order?.id,
          category: categoryEnumMap[supportCategory] || 'FOOD',
          message: `[Issue: ${supportCategory}] ${supportMessage}`,
          priority: 'HIGH'
        })
      });

      if (res.success) {
        setSupportSuccess('Support query registered! Campus helpdesk will contact your mobile shortly.');
        setSupportMessage('');
        setTimeout(() => {
          setSupportModalOpen(false);
          setSupportSuccess(null);
        }, 2500);
      } else {
        setCancelMessage(res.message || 'Failed to submit ticket');
      }
    } catch (err: any) {
      setCancelMessage(err.message || 'Submission error');
    } finally {
      setSupportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[#f8fafc]">
        <div className="w-12 h-12 border-4 border-[#689f38] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-700">Loading order tracking details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Unable to load your order</h2>
          <p className="text-xs text-gray-500 mt-2">{error || 'The requested order could not be found.'}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => fetchOrder(true)}
              className="px-5 py-2.5 bg-[#689f38] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#5b8c30]"
            >
              Try Again
            </button>
            <Link
              href="/food"
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200"
            >
              Browse Campus Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCancellable = order.status === 'CONFIRMED' || order.status === 'PENDING';

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/food" className="hover:text-[#689f38] font-medium transition-colors">Campus Menu</Link>
            <span>/</span>
            <Link href="/dashboard?tab=orders" className="hover:text-[#689f38] font-medium transition-colors">My Orders</Link>
            <span>/</span>
            <span className="text-gray-900 font-bold">Track #{order.orderNumber}</span>
          </div>

          <Link
            href="/food"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2e7d32] hover:text-[#1b5e20]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Shopping
          </Link>
        </div>

        {/* 1. Celebration Banner (Immediate Post-Order feedback) */}
        {isJustPlaced && (
          <div className="bg-gradient-to-r from-[#2e7d32] to-[#689f38] text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-[#689f38]/20 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Confirmed &amp; Dispatched
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Order Placed Successfully!
                </h1>
                <p className="text-xs text-white/90 mt-1">
                  Your kitchen order is in the express queue. Live tracking updates are active below.
                </p>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center shrink-0 min-w-[170px]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-white/80">Order Number</div>
              <div className="text-xl font-black tracking-wider text-white mt-0.5">
                #{order.orderNumber}
              </div>
            </div>
          </div>
        )}

        {/* 2. Live Order Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Order #{order.orderNumber}
                </h2>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Placed on: <strong className="text-gray-700 font-semibold">{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
                <span>•</span>
                <span>Payment: <strong className="text-gray-700 font-semibold">{order.paymentMethod.replace(/_/g, ' ')} ({order.paymentStatus})</strong></span>
              </div>
            </div>

            {/* Estimated Delivery Pill */}
            <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-2xl p-4 flex items-center gap-4 shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[#689f38] text-white flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-[#2e7d32] uppercase tracking-wider">
                  Estimated Delivery
                </div>
                <div className="text-lg font-black text-gray-900 leading-tight">
                  {order.status === 'DELIVERED' ? 'Delivered' : '10–15 minutes'}
                </div>
              </div>
            </div>
          </div>

          {/* Current Dynamic Status Callout */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#689f38]/15 text-[#689f38] flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 fill-[#689f38]" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Status Update</div>
                <div className="text-sm font-extrabold text-gray-900">
                  {getStatusHeadline(order.status)}
                </div>
              </div>
            </div>

            <div className="text-xs font-bold text-gray-400">
              Live Auto-Refresh Active
            </div>
          </div>

          {/* 3. Horizontal Order Status Timeline Flow */}
          <div className="py-4">
            <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-6">
              Order Status Timeline
            </div>

            <div className="relative">
              {/* Progress Line */}
              <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-gray-200 -z-0" />

              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 relative z-10">
                {ORDER_FLOW_STEPS.map((step, idx) => {
                  const status = getStepStatus(idx, order.status);

                  return (
                    <div key={step.key} className="flex md:flex-col items-center md:text-center gap-3 md:gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                          status === 'completed'
                            ? 'bg-[#689f38] text-white shadow-md'
                            : status === 'active'
                            ? 'bg-white border-3 border-[#689f38] text-[#689f38] shadow-lg ring-4 ring-[#689f38]/20 animate-pulse'
                            : 'bg-gray-100 text-gray-400 border border-gray-300'
                        }`}
                      >
                        {status === 'completed' ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : status === 'active' ? (
                          <div className="w-3 h-3 rounded-full bg-[#689f38]" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={`text-xs font-black tracking-tight uppercase leading-tight ${
                            status === 'completed' || status === 'active'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.title}
                        </div>
                        <div className="text-[10px] text-gray-500 hidden md:block mt-0.5 leading-snug">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Delivery Information & Hostel Location */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#689f38]" /> Delivery Location &amp; Instructions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Campus Residence</div>
              <div className="text-sm font-black text-gray-900 mt-0.5">
                {order.hallName || 'Hall 11'}
              </div>
              <div className="text-[11px] text-gray-500">National Institute of Technology Durgapur</div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Assigned Room</div>
              <div className="text-sm font-black text-gray-900 mt-0.5">
                Room {order.roomNumber || '123'}
              </div>
              <div className="text-[11px] text-[#2e7d32] font-semibold">Doorstep hostel delivery</div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Delivery Notes</div>
              <div className="text-xs font-semibold text-gray-800 mt-0.5 italic">
                "{order.specialInstructions || 'Call student upon hostel entry.'}"
              </div>
            </div>
          </div>
        </div>

        {/* 5. Ordered Products Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#689f38]" /> Ordered Items ({order.items.length})
            </h3>
            <button
              onClick={() => setShowReceiptDetails(!showReceiptDetails)}
              className="text-xs font-bold text-[#689f38] hover:text-[#558b2f] flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              {showReceiptDetails ? 'Hide Receipt Details' : 'View Full Receipt'}
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300'}
                      alt={item.productName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900">{item.productName}</h4>
                    <div className="text-[11px] text-gray-500">₹{item.unitPrice} × {item.quantity}</div>
                  </div>
                </div>
                <div className="text-sm font-black text-gray-900">
                  ₹{item.totalPrice}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">₹{order.subtotal}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Campus Coupon Discount</span>
                <span>-₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Hostel Delivery Fee</span>
              <span className="font-bold text-gray-900">{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-base font-black text-gray-900">
              <span>Total Paid Amount</span>
              <span className="text-xl text-[#212121]">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* 6. Action Buttons Bar */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSupportModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-sky-600" />
              Help with this Order
            </button>

            <button
              onClick={handleReorder}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f1f8e9] hover:bg-[#e8f5e9] text-xs font-bold text-[#2e7d32] border border-[#dcedc8] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reorder Items
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isCancellable && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 border border-red-200 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )}

            <Link
              href="/food"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
            >
              Browse Campus Menu
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* CANCEL ORDER MODAL */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-gray-200">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Are you sure you want to cancel this order?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                You are cancelling order <strong className="text-gray-900">#{order.orderNumber}</strong>. If prepaid, your refund of <strong>₹{order.totalAmount}</strong> will immediately enter <strong>Refund Processing</strong>.
              </p>

              {cancelMessage && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800">
                  {cancelMessage}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-xs font-bold text-white rounded-xl shadow-md transition-colors"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HELP & SUPPORT MODAL */}
        {supportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-600" />
                  <h3 className="text-base font-black text-gray-900">
                    Help with Order #{order.orderNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setSupportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Select Issue Category
                  </label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#84c225]"
                  >
                    <option value="Order hasn't arrived">Order hasn't arrived</option>
                    <option value="Missing item">Missing item</option>
                    <option value="Wrong item">Wrong item</option>
                    <option value="Damaged item">Damaged item</option>
                    <option value="Payment issue">Payment issue</option>
                    <option value="Refund issue">Refund issue</option>
                    <option value="Other issue">Other issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Issue Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue with this order (e.g. deliverer not reached, sauce missing, etc.)..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#84c225]"
                  />
                  <span className="text-[10px] text-gray-400">Order #{order.orderNumber} will be automatically attached.</span>
                </div>

                {supportSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {supportSuccess}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(false)}
                    className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting || !supportMessage.trim()}
                    className="flex-1 py-2.5 bg-[#689f38] hover:bg-[#5b8c30] disabled:bg-gray-300 text-xs font-bold text-white rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {supportSubmitting ? 'Submitting Ticket...' : 'Submit Support Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
