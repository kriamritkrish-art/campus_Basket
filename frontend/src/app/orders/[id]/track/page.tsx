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
  Check,
  Calendar,
  User,
  Printer,
  X,
  PackageCheck
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
  deliveryBoy?: {
    id: string;
    fullName: string;
    mobileNumber?: string;
    vehicleType?: string;
  };
  provider?: {
    fullName: string;
    mobileNumber?: string;
  };
}

const CHECKPOINTS = [
  { id: 'HUB', label: 'Hub', sub: 'Store / Canteen Hub' },
  { id: 'CONFIRMED', label: 'Order Confirmed', sub: 'Verified & Queued' },
  { id: 'ASSIGNED', label: 'Partner Assigned', sub: 'Runner Dispatched' },
  { id: 'PICKED_UP', label: 'Picked Up', sub: 'Bag Packed & Tagged' },
  { id: 'TRANSIT', label: 'Highway Express', sub: 'Runner In Transit' },
  { id: 'DELIVERED', label: 'Doorstep Delivered', sub: 'Handed Over' }
];

export default function OrderTrackingPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isJustPlaced = searchParams.get('placed') === 'true';

  const { addItem, showToast } = useCart();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROCESSING' | 'TRANSIT' | 'DELIVERED' | 'CANCELLED'>('ALL');
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
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Fetch Current Order
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

  // Fetch all student orders for tab statistics
  const fetchAllOrders = async () => {
    try {
      const res = await apiRequest('/api/orders');
      if (res.success && Array.isArray(res.orders)) {
        setAllOrders(res.orders);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchOrder(true);
    fetchAllOrders();
    // Live polling every 6 seconds to update delivery runner & status in real time
    const interval = setInterval(() => {
      fetchOrder(false);
      fetchAllOrders();
    }, 6000);
    return () => clearInterval(interval);
  }, [id]);

  // Determine active step index (0 to 5)
  const getActiveStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return 0; // Pharmacy Hub
      case 'CONFIRMED':
      case 'ACCEPTED':
      case 'PREPARING':
        return 1; // Order Confirmed
      case 'DELIVERY_ASSIGNED':
      case 'READY':
      case 'READY_FOR_PICKUP':
        return 2; // Partner Assigned
      case 'PICKED_UP':
        return 3; // Picked Up
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
      case 'AT_HOSTEL':
      case 'OTP_VERIFIED':
        return 4; // Highway Express
      case 'DELIVERED':
        return 5; // Doorstep Delivered
      case 'CANCELLED':
        return -1;
      default:
        return 1;
    }
  };

  const activeStep = order ? getActiveStepIndex(order.status) : 1;

  // Radar status headline
  const getRadarHeadline = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'Delivered at doorstep 🎉';
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
      case 'AT_HOSTEL':
        return 'Highway Express: Runner is on the way to your hostel 🛵';
      case 'PICKED_UP':
        return 'Order picked up from cafeteria counter & packed 🎒';
      case 'DELIVERY_ASSIGNED':
      case 'READY':
        return 'Delivery partner assigned & heading to store 🏃';
      case 'PREPARING':
      case 'CONFIRMED':
        return 'Order confirmed! Freshly preparing your items 🍳';
      case 'CANCELLED':
        return 'This order has been cancelled.';
      default:
        return 'Order placed and logged at store hub 📦';
    }
  };

  // Status badge config
  const getStatusBadge = (status: string) => {
    if (status === 'DELIVERED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2e7d32]" />
          Delivered Successfully
        </span>
      );
    }
    if (status === 'OUT_FOR_DELIVERY' || status === 'IN_TRANSIT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
          <Zap className="w-3.5 h-3.5 text-[#0284c7]" />
          In Transit
        </span>
      );
    }
    if (status === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  // Reorder Handler
  const handleReorder = () => {
    if (!order?.items) return;
    let addedCount = 0;
    for (const item of order.items) {
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
        setCancelMessage('Order cancelled successfully.');
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
      const res = await apiRequest('/api/campus/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order?.id,
          category: 'DELIVERY',
          message: `[Issue: ${supportCategory}] ${supportMessage}`,
          priority: 'HIGH'
        })
      });

      if (res.success) {
        setSupportSuccess('Support query submitted. Campus runner support will contact you shortly.');
        setSupportMessage('');
        setTimeout(() => {
          setSupportModalOpen(false);
          setSupportSuccess(null);
        }, 2200);
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
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-8 bg-[#f8fafc]">
        <div className="w-12 h-12 border-4 border-[#0284c7] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-gray-700">Connecting to live campus tracking...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Order Not Found</h2>
          <p className="text-xs text-gray-500 mt-2">{error || 'The requested order details could not be retrieved.'}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => fetchOrder(true)}
              className="px-5 py-2.5 bg-[#0284c7] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#0369a1]"
            >
              Try Again
            </button>
            <Link
              href="/dashboard?tab=orders"
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate order counts for tabs
  const ordersList = allOrders.length > 0 ? allOrders : [order];
  const countAll = ordersList.length;
  const countProcessing = ordersList.filter((o) => ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PREPARING'].includes(o.status)).length;
  const countTransit = ordersList.filter((o) => ['READY', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(o.status)).length;
  const countDelivered = ordersList.filter((o) => o.status === 'DELIVERED').length;
  const countCancelled = ordersList.filter((o) => o.status === 'CANCELLED').length;

  const purchasedItemsText = order.items.map((i) => i.productName).join(', ') || 'Campus Meal & Snack';
  const deliveryAddressText = `${order.roomNumber ? `Room ${order.roomNumber}, ` : ''}${order.hallName || 'Hall 11'}, NIT Durgapur Campus`;
  const partnerName = order.deliveryBoy?.fullName || 'Ravi Kumar';
  const partnerId = order.deliveryBoy?.id ? `DEL${order.deliveryBoy.id.slice(-4).toUpperCase()}` : 'DEL1001';
  const partnerPhone = order.deliveryBoy?.mobileNumber || '9876543210';
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');

  const isCancellable = ['CONFIRMED', 'PENDING', 'PENDING_PAYMENT'].includes(order.status);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ==================================================
            1. TOP PILL FILTER TABS (Exact match to screenshot)
           ================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'ALL'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            All Orders ({countAll})
          </button>

          <button
            onClick={() => setActiveTab('PROCESSING')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'PROCESSING'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            Processing ({countProcessing})
          </button>

          <button
            onClick={() => setActiveTab('TRANSIT')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'TRANSIT'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            In Transit ({countTransit})
          </button>

          <button
            onClick={() => setActiveTab('DELIVERED')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'DELIVERED'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            Delivered ({countDelivered})
          </button>

          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'CANCELLED'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            Cancelled ({countCancelled})
          </button>
        </div>

        {/* ==================================================
            2. THE ORDER CARD (Exact pixel-accurate reproduction)
           ================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">

          {/* Top Row: Order Header, Status Badge, Calendar Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Order #{order.orderNumber}
              </h2>
              {getStatusBadge(order.status)}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium self-start sm:self-auto">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{orderDate}</span>
            </div>
          </div>

          {/* 4-Column Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">

            {/* Column 1: PURCHASED ITEMS */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                PURCHASED ITEMS
              </div>
              <p className="text-sm font-bold text-gray-900 leading-snug">
                {purchasedItemsText}
              </p>
            </div>

            {/* Column 2: DELIVERY DESTINATION */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                DELIVERY DESTINATION
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-gray-800 leading-relaxed">
                  {deliveryAddressText}
                </span>
              </div>
            </div>

            {/* Column 3: DELIVERY PARTNER */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                DELIVERY PARTNER
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2e7d32] flex items-center justify-center shrink-0">
                  <User className="w-3 h-3" />
                </div>
                <span className="font-black text-gray-900 text-sm">
                  {partnerName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-sky-100 text-[#0284c7] text-[10px] font-black tracking-wide">
                  {partnerId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 font-medium pl-0.5">
                <Phone className="w-3.5 h-3.5 text-[#0284c7]" />
                <a href={`tel:${partnerPhone}`} className="hover:underline text-gray-700 font-semibold">
                  {partnerPhone}
                </a>
              </div>
            </div>

            {/* Column 4: TOTAL AMOUNT & View Receipt */}
            <div className="space-y-2 lg:text-left">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                TOTAL AMOUNT
              </div>
              <div className="text-2xl font-black text-gray-900 tracking-tight">
                ₹{order.totalAmount}
              </div>
              <div>
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span>View Receipt</span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================
              3. LIVE GPS TRACK RADAR — Premium Professional Tracker
             ================================================== */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">

            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#10b981] via-[#34d399] to-slate-100" />

            <div className="px-5 py-4 space-y-4">

              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                {/* Live Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold tracking-widest uppercase shrink-0 self-start">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  LIVE GPS TRACK RADAR
                </div>
                {/* Status text */}
                <p className="text-[13px] font-semibold text-slate-700 leading-snug">
                  {getRadarHeadline(order.status)}
                </p>
              </div>

              {/* Timeline */}
              <div className="overflow-x-auto scrollbar-none pb-1">
                <div className="relative min-w-[520px] sm:min-w-0 pt-8">

                  {/* Gray inactive rail */}
                  <div className="absolute top-8 left-[8.3333%] right-[8.3333%] h-[2px] bg-slate-100 rounded-full" />

                  {/* Green active rail */}
                  <div
                    className="absolute top-8 left-[8.3333%] h-[2px] bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full transition-all duration-700 ease-out"
                    style={{ width: activeStep >= 0 ? `${(activeStep / 5) * 83.3333}%` : '0%' }}
                  />

                  {/* Steps */}
                  <div className="relative grid grid-cols-6 z-10">
                    {CHECKPOINTS.map((step, idx) => {
                      const isCompleted = activeStep > idx;
                      const isActive = activeStep === idx;

                      return (
                        <div key={step.id} className="flex flex-col items-center text-center relative">

                          {/* Delivery vehicle floating above current step */}
                          {isActive && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
                              <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-md flex items-center gap-1">
                                <svg className="w-4 h-4 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="18.5" cy="17.5" r="3.5" />
                                  <circle cx="5.5" cy="17.5" r="3.5" />
                                  <circle cx="15" cy="5" r="1" />
                                  <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                                </svg>
                              </div>
                              {/* Pointer nub */}
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-200 -mt-px" />
                            </div>
                          )}

                          {/* Circle */}
                          <div className="h-8 flex items-center justify-center mb-0">
                            {isCompleted ? (
                              <div className="w-7 h-7 rounded-full bg-[#10b981] flex items-center justify-center shadow-sm">
                                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            ) : isActive ? (
                              <div className="relative">
                                {/* Outer pulse ring */}
                                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                                <div className="relative w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center shadow-md shadow-emerald-200">
                                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                              </div>
                            )}
                          </div>

                          {/* Label */}
                          <div className={`mt-2 text-[10px] sm:text-[11px] leading-tight font-medium px-0.5 transition-colors ${
                            isActive
                              ? 'text-[#059669] font-bold'
                              : isCompleted
                              ? 'text-slate-600 font-semibold'
                              : 'text-slate-400'
                          }`}>
                            {step.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action Row at Bottom of Card */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSupportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Help with Order</span>
              </button>

              <button
                onClick={handleReorder}
                className="px-4 py-2 rounded-xl bg-[#f1f8e9] hover:bg-[#e8f5e9] text-[#2e7d32] border border-[#dcedc8] text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reorder Items</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isCancellable && (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Order</span>
                </button>
              )}

              <Link
                href="/food"
                className="px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold transition shadow-xs"
              >
                Browse Campus Menu
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          RECEIPT MODAL (Opened via [View Receipt])
         ================================================== */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#2e7d32] flex items-center justify-center font-black">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Campus Basket Receipt</h3>
                  <p className="text-[11px] text-gray-400 font-mono">Invoice #{order.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Summary Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Customer</span>
                <strong className="text-gray-900">{order.roomNumber ? `Room ${order.roomNumber}` : 'Student'}, {order.hallName}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Date</span>
                <strong className="text-gray-900">{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Payment Method</span>
                <strong className="text-gray-900">{order.paymentMethod.replace(/_/g, ' ')} ({order.paymentStatus})</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Delivery Partner</span>
                <strong className="text-gray-900">{partnerName} ({partnerId})</strong>
              </div>
            </div>

            {/* Itemized list */}
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                Order Items ({order.items.length})
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900">{item.productName}</span>
                      <span className="text-gray-400 ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-black text-gray-900">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials Breakdown */}
            <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount Applied</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Hostel Delivery Fee</span>
                <span className="font-semibold text-gray-900">{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-base font-black text-gray-900">
                <span>Total Paid</span>
                <span className="text-xl text-[#0284c7]">₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-gray-500" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Cancel Order #{order.orderNumber}?</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Are you sure you want to cancel this order? Any payments will be refunded to your source account.
            </p>

            {cancelMessage && (
              <div className="p-3 rounded-xl bg-gray-100 text-xs font-bold text-gray-800">
                {cancelMessage}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0284c7]" />
                <h3 className="text-sm font-black text-gray-900">Campus Helpdesk Support</h3>
              </div>
              <button
                onClick={() => setSupportModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {supportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                {supportSuccess}
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Issue Type</label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white font-semibold text-gray-900 focus:outline-none"
                  >
                    <option value="Order hasn't arrived">Order hasn't arrived</option>
                    <option value="Missing item">Missing item</option>
                    <option value="Wrong item delivered">Wrong item delivered</option>
                    <option value="Delivery partner unreachable">Delivery partner unreachable</option>
                    <option value="Other delivery query">Other delivery query</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Describe your query</label>
                  <textarea
                    rows={3}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Provide details for campus runner desk..."
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white font-semibold text-gray-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting || !supportMessage.trim()}
                    className="flex-1 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold disabled:opacity-50"
                  >
                    {supportSubmitting ? 'Submitting...' : 'Submit Query'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
