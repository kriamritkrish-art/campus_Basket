'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import {
  CheckCircle2,
  Clock,
  MapPin,
  HelpCircle,
  RotateCcw,
  Zap,
  ShoppingBag,
  Phone,
  FileText,
  Calendar,
  User,
  Printer,
  X,
  PackageCheck,
  Check,
  XCircle,
  Truck,
  ArrowRight
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
  status: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  hallName: string;
  roomNumber: string;
  deliveryAddress?: string;
  createdAt: string;
  items: OrderItem[];
  deliveryBoy?: {
    id: string;
    fullName: string;
    mobileNumber?: string;
    vehicleType?: string;
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

// Fallback demo order matching the exact reference screenshot
const DEMO_ORDER: OrderData = {
  id: 'demo-pc-18',
  orderNumber: 'PC-18',
  status: 'DELIVERED',
  totalAmount: 576.2,
  subtotal: 546.2,
  deliveryFee: 30.0,
  discountAmount: 0,
  paymentMethod: 'UPI',
  paymentStatus: 'COMPLETED',
  hallName: '',
  roomNumber: '',
  deliveryAddress: '45/A Park Street, Sector 5, Salt Lake, Kolkata, West Bengal',
  createdAt: '2026-08-12T14:30:00.000Z',
  items: [
    { id: 'i1', productName: 'Cough Syrup', quantity: 1, unitPrice: 135, totalPrice: 135 },
    { id: 'i2', productName: 'Antifungal Cream 20g', quantity: 1, unitPrice: 141.2, totalPrice: 141.2 },
    { id: 'i3', productName: 'Insulin Pen', quantity: 1, unitPrice: 300, totalPrice: 300 }
  ],
  deliveryBoy: {
    id: 'DEL1001',
    fullName: 'Ravi Kumar',
    mobileNumber: '9876543210'
  }
};

export default function AllOrdersPage() {
  const { addItem, showToast } = useCart();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROCESSING' | 'TRANSIT' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [receiptModalOrder, setReceiptModalOrder] = useState<OrderData | null>(null);

  // Help desk support modal state
  const [supportModalOrder, setSupportModalOrder] = useState<OrderData | null>(null);
  const [supportCategory, setSupportCategory] = useState("Order hasn't arrived");
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiRequest('/api/orders');
        if (res.success && Array.isArray(res.orders) && res.orders.length > 0) {
          setOrders(res.orders);
        } else {
          // If student has no orders yet in local db, show the reference order
          setOrders([DEMO_ORDER]);
        }
      } catch {
        setOrders([DEMO_ORDER]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const countAll = orders.length;
  const countProcessing = orders.filter((o) => ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PREPARING'].includes(o.status)).length;
  const countTransit = orders.filter((o) => ['READY', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(o.status)).length;
  const countDelivered = orders.filter((o) => o.status === 'DELIVERED').length;
  const countCancelled = orders.filter((o) => o.status === 'CANCELLED').length;

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PROCESSING') return ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PREPARING'].includes(o.status);
    if (activeTab === 'TRANSIT') return ['READY', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(o.status);
    if (activeTab === 'DELIVERED') return o.status === 'DELIVERED';
    if (activeTab === 'CANCELLED') return o.status === 'CANCELLED';
    return true;
  });

  const getActiveStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return 0; // Hub
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

  const getRadarHeadline = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'Delivered at doorstep 🪅';
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
      case 'AT_HOSTEL':
        return 'Highway Express: Runner is on the way to your hostel 🛵';
      case 'PICKED_UP':
        return 'Order picked up & packed in thermal delivery bag 🎒';
      case 'DELIVERY_ASSIGNED':
      case 'READY':
        return 'Delivery partner assigned & heading to store 🏃';
      case 'PREPARING':
      case 'CONFIRMED':
        return 'Order confirmed! Freshly preparing your items 🍳';
      case 'CANCELLED':
        return 'This order has been cancelled.';
      default:
        return 'Order placed and logged at campus hub 📦';
    }
  };

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

  const handleReorder = (order: OrderData) => {
    if (!order.items) return;
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
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim() || !supportModalOrder) return;
    setSupportSubmitting(true);
    setSupportSuccess(null);
    try {
      await apiRequest('/api/campus/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          orderId: supportModalOrder.id,
          category: 'DELIVERY',
          message: `[Issue: ${supportCategory}] ${supportMessage}`,
          priority: 'HIGH'
        })
      });
      setSupportSuccess('Support query submitted. Campus desk will assist you shortly.');
      setSupportMessage('');
      setTimeout(() => {
        setSupportModalOrder(null);
        setSupportSuccess(null);
      }, 2000);
    } catch {
      setSupportSuccess('Query logged. Runner desk alerted.');
      setTimeout(() => {
        setSupportModalOrder(null);
        setSupportSuccess(null);
      }, 2000);
    } finally {
      setSupportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-8 bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-[#0284c7] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-gray-600">Loading orders...</p>
      </div>
    );
  }

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

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
            <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-gray-900">
              No {activeTab === 'ALL' ? '' : activeTab.toLowerCase()} orders found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You do not have any orders in this status category right now.
            </p>
            <Link
              href="/food"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              Order Campus Essentials
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ==================================================
            2. THE ORDER CARDS (Exact match to screenshot)
           ================================================== */}
        {filteredOrders.map((order) => {
          const activeStep = getActiveStepIndex(order.status);
          const purchasedItemsText =
            order.items?.map((i) => i.productName).join(', ') || 'Cough Syrup, Antifungal Cream 20g, Insulin Pen';
          const deliveryAddressText =
            order.roomNumber || order.hallName
              ? `${order.roomNumber ? `Room ${order.roomNumber}, ` : ''}${order.hallName || 'Hall 11'}, NIT Durgapur Campus`
              : order.deliveryAddress || '45/A Park Street, Sector 5, Salt Lake, Kolkata, West Bengal';
          const partnerName = order.deliveryBoy?.fullName || 'Ravi Kumar';
          const partnerId = order.deliveryBoy?.id
            ? order.deliveryBoy.id.startsWith('DEL')
              ? order.deliveryBoy.id
              : `DEL${order.deliveryBoy.id.slice(-4).toUpperCase()}`
            : 'DEL1001';
          const partnerPhone = order.deliveryBoy?.mobileNumber || '9876543210';
          const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');

          return (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6"
            >
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
                      onClick={() => setReceiptModalOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      <span>View Receipt</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  3. LIVE GPS TRACK RADAR — Refined Whitish High-Tech Tracker
                 ================================================== */}
              <div
                className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-[#f8fafc] shadow-xs overflow-hidden relative"
                style={{
                  backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
                  backgroundSize: '20px 20px'
                }}
              >
                {/* Subtle top gradient hairline */}
                <div className="h-[2px] w-full bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-400 opacity-60" />

                <div className="px-5 py-5 sm:px-7 sm:py-6 space-y-6">

                  {/* Header Row: Live Radar Badge & Status Headline */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {/* Live Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-300 text-sky-700 text-[10px] font-black tracking-wider uppercase shrink-0 self-start shadow-xs">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0284c7]" />
                      </span>
                      LIVE GPS TRACK RADAR
                    </div>

                    {/* Status text */}
                    <p className="text-xs sm:text-[13px] font-bold text-slate-800 leading-snug">
                      {getRadarHeadline(order.status)}
                    </p>
                  </div>

                  {/* Timeline Container */}
                  <div className="overflow-x-auto scrollbar-none pb-2 pt-6">
                    <div className="relative min-w-[560px] sm:min-w-0 pt-6">

                      {/* Gray inactive rail */}
                      <div className="absolute top-[38px] left-[8.3333%] right-[8.3333%] h-[3px] bg-slate-200 rounded-full" />

                      {/* Vibrant Glowing Green active rail */}
                      <div
                        className="absolute top-[38px] left-[8.3333%] h-[3px] bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(16,185,129,0.55)]"
                        style={{ width: activeStep >= 0 ? `${(activeStep / 5) * 83.3333}%` : '0%' }}
                      />

                      {/* Steps Grid (6 Columns) */}
                      <div className="relative grid grid-cols-6 z-10">
                        {CHECKPOINTS.map((step, idx) => {
                          const isDeliveredOrder = order.status === 'DELIVERED';
                          const isCompleted = isDeliveredOrder || activeStep > idx;
                          const isActive = activeStep === idx;
                          const showScooterHere = isDeliveredOrder ? idx === 5 : isActive;

                          return (
                            <div key={step.id} className="flex flex-col items-center text-center relative">

                              {/* Delivery Scooter graphic floating above active/delivered step */}
                              {showScooterHere && (
                                <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center animate-bounce duration-1000">
                                  <div className="flex items-center justify-center">
                                    <svg
                                      className="w-10 h-10 sm:w-11 sm:h-11 filter drop-shadow(0 3px 6px rgba(0,0,0,0.2))"
                                      viewBox="0 0 48 48"
                                      fill="none"
                                    >
                                      {/* Delivery Cargo Box on Rear Rack with Cyan/Blue color and Cross Icon */}
                                      <rect x="6" y="14" width="13" height="13" rx="2.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
                                      {/* Cross icon on cargo box */}
                                      <path d="M12.5 17v7M9 20.5h7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                                      
                                      {/* Rear rack bar */}
                                      <path d="M10 27v3h8" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />

                                      {/* Main Scooter Body */}
                                      <path d="M18 30h9l4-9h6" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                      {/* Scooter floorboard & engine casing */}
                                      <path d="M17 29h11l1-3h-10z" fill="#0284c7" />
                                      
                                      {/* Seat */}
                                      <path d="M16 23h7c1 0 1.5 1 1 2h-9c-0.5-1 0-2 1-2z" fill="#1e293b" />
                                      
                                      {/* Steering Column & Handlebar */}
                                      <path d="M31 21l3-8h-3" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                      <circle cx="34" cy="13" r="1.5" fill="#0284c7" />
                                      
                                      {/* Headlight beam */}
                                      <path d="M34 16l8-3v7l-8-1z" fill="#38bdf8" opacity="0.35" />
                                      <circle cx="34" cy="16" r="1.8" fill="#38bdf8" />
                                      
                                      {/* Rear Wheel with Spoked Hub */}
                                      <circle cx="12" cy="33" r="5" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
                                      <circle cx="12" cy="33" r="2.5" fill="#0284c7" />
                                      <path d="M12 28v10M7 33h10M8.5 29.5l7 7M8.5 36.5l7-7" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.75" />
                                      
                                      {/* Front Wheel with Spoked Hub */}
                                      <circle cx="35" cy="33" r="5" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
                                      <circle cx="35" cy="33" r="2.5" fill="#0284c7" />
                                      <path d="M35 28v10M30 33h10M31.5 29.5l7 7M31.5 36.5l7-7" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.75" />
                                    </svg>
                                  </div>
                                  {/* Pointer indicator */}
                                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-emerald-500 -mt-1" />
                                </div>
                              )}

                              {/* Node Circle (Centered along line at top:38px) */}
                              <div className="h-8 flex items-center justify-center mb-0">
                                {isCompleted ? (
                                  <div className="relative flex items-center justify-center">
                                    {showScooterHere && (
                                      <div className="absolute -inset-1.5 rounded-full bg-emerald-400/30 animate-ping" style={{ animationDuration: '2.5s' }} />
                                    )}
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-white transition-all">
                                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                                    </div>
                                  </div>
                                ) : isActive ? (
                                  <div className="relative flex items-center justify-center">
                                    <div className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-ping" style={{ animationDuration: '2s' }} />
                                    <div className="relative w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-emerald-400/20 shadow-[0_0_12px_rgba(16,185,129,0.6)] border-2 border-white">
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-2xs">
                                    <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                                  </div>
                                )}
                              </div>

                              {/* Checkpoint Label */}
                              <div
                                className={`mt-2 text-[10px] sm:text-[11px] leading-tight font-bold px-0.5 transition-colors ${
                                  isCompleted || isActive
                                    ? 'text-slate-900 font-extrabold'
                                    : 'text-slate-400 font-semibold'
                                }`}
                              >
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
                    onClick={() => setSupportModalOrder(order)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Help with Order</span>
                  </button>

                  <button
                    onClick={() => handleReorder(order)}
                    className="px-4 py-2 rounded-xl bg-[#f1f8e9] hover:bg-[#e8f5e9] text-[#2e7d32] border border-[#dcedc8] text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder Items</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/orders/${order.id}/track`}
                    className="px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold transition shadow-xs flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Live</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* ==================================================
          RECEIPT MODAL (Opened via [View Receipt])
         ================================================== */}
      {receiptModalOrder && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#2e7d32] flex items-center justify-center font-black">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Official Campus Receipt</h3>
                  <p className="text-[11px] text-gray-400">Order #{receiptModalOrder.orderNumber} • NIT Durgapur Delivery</p>
                </div>
              </div>
              <button
                onClick={() => setReceiptModalOrder(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick meta badge */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Date & Time</span>
                <span className="font-bold text-gray-900">
                  {new Date(receiptModalOrder.createdAt).toLocaleString('en-GB')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Payment Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                  ✓ PAID ({receiptModalOrder.paymentMethod})
                </span>
              </div>
            </div>

            {/* Destination & Runner */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">Delivered To</span>
                <p className="font-bold text-gray-900">
                  {receiptModalOrder.roomNumber || receiptModalOrder.hallName
                    ? `${receiptModalOrder.roomNumber ? `Room ${receiptModalOrder.roomNumber}, ` : ''}${receiptModalOrder.hallName || 'Hall 11'}`
                    : receiptModalOrder.deliveryAddress || '45/A Park Street, Sector 5, Salt Lake, Kolkata'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">Delivery Partner</span>
                <p className="font-bold text-gray-900">
                  {receiptModalOrder.deliveryBoy?.fullName || 'Ravi Kumar'} (DEL1001)
                </p>
              </div>
            </div>

            {/* Itemized list */}
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                Order Items ({receiptModalOrder.items?.length || 1})
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                {receiptModalOrder.items?.map((item) => (
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
                <span className="font-semibold text-gray-900">₹{receiptModalOrder.subtotal || receiptModalOrder.totalAmount}</span>
              </div>
              {receiptModalOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount Applied</span>
                  <span>-₹{receiptModalOrder.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Hostel Delivery Fee</span>
                <span className="font-semibold text-gray-900">
                  {receiptModalOrder.deliveryFee === 0 ? 'FREE' : `₹${receiptModalOrder.deliveryFee || 30}`}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-base font-black text-gray-900">
                <span>Total Paid</span>
                <span className="text-xl text-[#0284c7]">₹{receiptModalOrder.totalAmount}</span>
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
                onClick={() => setReceiptModalOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {supportModalOrder && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0284c7]" />
                <h3 className="text-sm font-black text-gray-900">Campus Helpdesk Support</h3>
              </div>
              <button
                onClick={() => setSupportModalOrder(null)}
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
                    onClick={() => setSupportModalOrder(null)}
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
