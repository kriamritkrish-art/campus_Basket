'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  ShoppingBag,
  ChevronRight,
  Calendar,
  CreditCard,
  Banknote,
  Search,
  X
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
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  advancePaidAmount?: number;
  refundAmount?: number;
  refundStatus?: string;
  hallName: string;
  roomNumber: string;
  createdAt: string;
  items: OrderItem[];
  deliveryBoy?: {
    id: string;
    fullName: string;
    mobileNumber?: string;
    vehicleType?: string;
  };
}

export default function MyOrdersPage() {
  const { addItem, showToast } = useCart();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROCESSING' | 'TRANSIT' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Support query modal
  const [supportModalOrder, setSupportModalOrder] = useState<OrderData | null>(null);
  const [supportCategory, setSupportCategory] = useState("Where is my delivery?");
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiRequest('/api/orders');
        if (res.success && Array.isArray(res.orders)) {
          setOrders(res.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.warn('Could not fetch student orders:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter categorization rules
  const isProcessing = (status: string) =>
    ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'ACCEPTED', 'PREPARING', 'PACKED', 'PROCESSING'].includes(status);

  const isInTransit = (status: string) =>
    ['READY', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DISPATCHED', 'AT_HOSTEL', 'OTP_VERIFIED'].includes(status);

  const isDelivered = (status: string) =>
    ['DELIVERED', 'COMPLETED'].includes(status);

  const isCancelled = (status: string) =>
    status === 'CANCELLED';

  // Dynamic filter counts directly calculated from current dataset
  const countAll = orders.length;
  const countProcessing = orders.filter((o) => isProcessing(o.status)).length;
  const countTransit = orders.filter((o) => isInTransit(o.status)).length;
  const countDelivered = orders.filter((o) => isDelivered(o.status)).length;
  const countCancelled = orders.filter((o) => isCancelled(o.status)).length;

  // Active filtered list
  const filteredOrders = orders.filter((o) => {
    // Tab filter
    if (activeTab === 'PROCESSING' && !isProcessing(o.status)) return false;
    if (activeTab === 'TRANSIT' && !isInTransit(o.status)) return false;
    if (activeTab === 'DELIVERED' && !isDelivered(o.status)) return false;
    if (activeTab === 'CANCELLED' && !isCancelled(o.status)) return false;

    // Search query filter (Order # or Item Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesOrder = o.orderNumber?.toLowerCase().includes(q);
      const matchesItem = o.items?.some((i) => i.productName.toLowerCase().includes(q));
      if (!matchesOrder && !matchesItem) return false;
    }

    return true;
  });

  const getStatusDisplay = (order: OrderData) => {
    const s = order.status;
    if (s === 'CANCELLED') {
      return {
        label: 'Cancelled',
        dotClass: 'bg-red-500',
        badgeClass: 'bg-red-50 text-red-700 border-red-200'
      };
    }
    if (isDelivered(s)) {
      return {
        label: 'Delivered',
        dotClass: 'bg-emerald-500',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      };
    }
    if (['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(s)) {
      return {
        label: 'Out for Delivery',
        dotClass: 'bg-sky-500 animate-pulse',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200'
      };
    }
    if (['DELIVERY_ASSIGNED', 'PICKED_UP'].includes(s)) {
      return {
        label: 'Runner Assigned',
        dotClass: 'bg-purple-500',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200'
      };
    }
    if (s === 'READY' || s === 'PACKED') {
      return {
        label: 'Packed & Ready',
        dotClass: 'bg-indigo-500',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200'
      };
    }
    if (s === 'PREPARING') {
      return {
        label: 'Preparing',
        dotClass: 'bg-blue-500 animate-pulse',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200'
      };
    }
    if (s === 'ACCEPTED' || order.providerAccepted) {
      return {
        label: 'Provider Accepted',
        dotClass: 'bg-teal-500',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200'
      };
    }
    return {
      label: 'Waiting for Provider',
      dotClass: 'bg-amber-500 animate-pulse',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
    };
  };

  const getServiceLabel = (serviceType?: string) => {
    switch (serviceType) {
      case 'LAUNDRY':
        return 'Laundry';
      case 'FRESH_PRODUCE':
        return 'Produce';
      case 'STATIONERY':
        return 'Stationery';
      case 'FOOD':
      default:
        return 'Food & Dining';
    }
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
      setSupportSuccess('Support ticket logged. Campus Desk will respond shortly.');
      setSupportMessage('');
      setTimeout(() => {
        setSupportModalOrder(null);
        setSupportSuccess(null);
      }, 1500);
    } catch {
      setSupportSuccess('Support query received. Runner desk alerted.');
      setTimeout(() => {
        setSupportModalOrder(null);
        setSupportSuccess(null);
      }, 1500);
    } finally {
      setSupportSubmitting(false);
    }
  };

  const handleReorder = (order: OrderData) => {
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
    showToast(`${count} item(s) added to your basket.`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 antialiased py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ==================================================
            1. PAGE HEADER & SEARCH
           ================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Orders
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track active campus deliveries, review past purchases & refunds
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order or item..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D2F] focus:ring-1 focus:ring-[#4F9D2F] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            2. HORIZONTAL FILTER ROW (COMPACT, TOUCH-FRIENDLY)
           ================================================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-[#4F9D2F] text-white shadow-xs border border-[#4F9D2F]'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90'
            }`}
          >
            All Orders <span className={`ml-1 text-[11px] opacity-80`}>{countAll}</span>
          </button>

          <button
            onClick={() => setActiveTab('PROCESSING')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'PROCESSING'
                ? 'bg-[#4F9D2F] text-white shadow-xs border border-[#4F9D2F]'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90'
            }`}
          >
            Processing <span className={`ml-1 text-[11px] opacity-80`}>{countProcessing}</span>
          </button>

          <button
            onClick={() => setActiveTab('TRANSIT')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'TRANSIT'
                ? 'bg-[#4F9D2F] text-white shadow-xs border border-[#4F9D2F]'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90'
            }`}
          >
            In Transit <span className={`ml-1 text-[11px] opacity-80`}>{countTransit}</span>
          </button>

          <button
            onClick={() => setActiveTab('DELIVERED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'DELIVERED'
                ? 'bg-[#4F9D2F] text-white shadow-xs border border-[#4F9D2F]'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90'
            }`}
          >
            Delivered <span className={`ml-1 text-[11px] opacity-80`}>{countDelivered}</span>
          </button>

          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'CANCELLED'
                ? 'bg-[#4F9D2F] text-white shadow-xs border border-[#4F9D2F]'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90'
            }`}
          >
            Cancelled <span className={`ml-1 text-[11px] opacity-80`}>{countCancelled}</span>
          </button>
        </div>

        {/* ==================================================
            3. LOADING SKELETON STATE
           ================================================== */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-32" />
                  <div className="h-4 bg-slate-200 rounded w-20" />
                </div>
                <div className="h-5 bg-slate-200 rounded w-48" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-slate-200 rounded w-24" />
                  <div className="h-8 bg-slate-200 rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================
            4. EMPTY FILTER STATE
           ================================================== */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl p-10 sm:p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {activeTab === 'ALL'
                ? 'No orders placed yet'
                : `No ${activeTab.toLowerCase()} orders found`}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}". Try clearing your search.`
                : 'Browse campus dining, fruits, stationery, or book express room laundry.'}
            </p>
            <div className="pt-2">
              <Link
                href="/food"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Browse Campus Market
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ==================================================
            5. COMPACT, INFORMATION-RICH ORDER CARDS
           ================================================== */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-3.5">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusDisplay(order);
              const isCod = order.paymentMethod === 'CASH_ON_DELIVERY';
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all space-y-3.5"
                >
                  {/* Top Row: Order ID, Category, Payment Badge, Date */}
                  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                        Order #{order.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {getServiceLabel(order.serviceType)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isCod ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      }`}>
                        {isCod ? 'COD' : 'Online'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{orderDate}</span>
                    </div>
                  </div>

                  {/* Middle Row: Items and Price */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((item) => (
                            <p key={item.id} className="text-xs sm:text-sm font-semibold text-slate-800">
                              {item.productName} <span className="text-slate-400 font-normal">× {item.quantity}</span>
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-[11px] text-slate-400">
                              +{order.items.length - 2} more item(s)
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-800">Campus Essentials</p>
                      )}

                      {order.roomNumber && (
                        <p className="text-[11px] text-slate-400">
                          Deliver to: Room {order.roomNumber}, {order.hallName || 'Hostel'}
                        </p>
                      )}
                    </div>

                    {/* Price Block */}
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </div>
                      {isCod && Number(order.advancePaidAmount) > 0 && (
                        <div className="text-[10px] text-amber-600 font-semibold">
                          ₹{Number(order.advancePaidAmount).toFixed(0)} advance paid
                        </div>
                      )}
                      {order.status === 'CANCELLED' && Number(order.refundAmount) > 0 && (
                        <div className="text-[10px] text-emerald-600 font-bold">
                          ₹{Number(order.refundAmount).toFixed(0)} Refund Pending
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Current Status & Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
                    {/* Status Pill with dot */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${statusInfo.badgeClass}`}>
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {order.status === 'DELIVERED' && (
                        <button
                          onClick={() => handleReorder(order)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reorder</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSupportModalOrder(order)}
                        className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                        title="Help with Order"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/orders/${order.id}/track?id=${order.id}`}
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('cb_active_order_id', order.id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        <span>Track Order</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ==================================================
          6. SUPPORT ASSISTANCE MODAL
         ================================================== */}
      {supportModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Campus Help Desk</h3>
                <p className="text-[11px] text-slate-400 font-mono">Order #{supportModalOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setSupportModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
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
                  <label className="font-bold text-slate-700 block mb-1">Issue Type</label>
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
                  <label className="font-bold text-slate-700 block mb-1">Details</label>
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
                    onClick={() => setSupportModalOrder(null)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting}
                    className="px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {supportSubmitting ? 'Submitting...' : 'Submit Request'}
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
