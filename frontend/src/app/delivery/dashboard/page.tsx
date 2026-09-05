'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  IndianRupee,
  Navigation,
  LogOut,
  RefreshCw,
  ShoppingBag,
  Store,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function DeliveryDashboardPage() {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  // KPIs
  const [kpi, setKpi] = useState<any>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  // Active Deliveries
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Completed History
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Initial Auth Guard
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (role !== 'DELIVERY_BOY' && role !== 'ADMIN'))) {
      window.location.href = '/login?redirect=/delivery/dashboard';
    }
  }, [isAuthenticated, role, isLoading]);

  const loadKpi = async () => {
    try {
      setKpiLoading(true);
      const res = await apiRequest('/api/delivery/kpi');
      if (res.success && res.kpi) {
        setKpi(res.kpi);
      }
    } catch (err) {
      console.warn('Delivery KPI error:', err);
    } finally {
      setKpiLoading(false);
    }
  };

  const loadActiveOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await apiRequest('/api/delivery/orders');
      if (res.success && res.orders) {
        setActiveOrders(res.orders);
      }
    } catch (err) {
      console.warn('Active deliveries error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await apiRequest('/api/delivery/history');
      if (res.success && res.orders) {
        setHistoryOrders(res.orders);
      }
    } catch (err) {
      console.warn('Delivery history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshAll = () => {
    loadKpi();
    loadActiveOrders();
    if (activeTab === 'HISTORY') loadHistory();
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadKpi();
      loadActiveOrders();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      loadHistory();
    }
  }, [activeTab]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setActionLoading(orderId);
    try {
      const res = await apiRequest(`/api/delivery/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.success) {
        refreshAll();
      } else {
        alert(res.message || 'Status update failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating delivery status');
    } finally {
      setActionLoading(null);
    }
  };

  const runnerName = user?.deliveryBoy?.fullName || user?.email?.split('@')[0] || 'Delivery Partner';
  const runnerId = user?.username || user?.deliveryBoy?.id?.slice(0, 8) || 'DB_FLEET';

  return (
    <div className="min-h-screen bg-[#F5F7F5] pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-600 text-white shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-[#17202A] tracking-tight leading-none uppercase">
                {runnerName}
              </div>
              <div className="text-[10px] text-sky-700 font-bold uppercase mt-1 flex items-center gap-1.5">
                <span>Runner ID:</span>
                <span className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200 font-mono">
                  {runnerId}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 font-semibold">On-Duty</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              title="Refresh Queue"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin text-sky-600' : ''}`} />
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Section 15: KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-sky-700 flex items-center gap-1">
              <Truck className="w-3 h-3" />
              <span>Today&apos;s Deliveries</span>
            </div>
            <div className="text-2xl font-black text-[#17202A] mt-1 font-mono">
              {kpi?.todayDeliveries ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Assigned today</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Pending Deliveries</span>
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1 font-mono">
              {kpi?.pendingDeliveries ?? activeOrders.length}
            </div>
            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Needs pickup / drop</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
              <PackageCheck className="w-3 h-3" />
              <span>Completed Today</span>
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">
              {kpi?.completedDeliveries ?? 0}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Successfully dropped</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-purple-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>This Month</span>
            </div>
            <div className="text-2xl font-black text-[#17202A] mt-1 font-mono">
              {kpi?.monthDeliveries ?? 0}
            </div>
            <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Monthly completed</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Assigned Deliveries ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Delivery History ({historyOrders.length})</span>
          </button>
        </div>

        {/* TAB 1: ACTIVE ASSIGNED DELIVERIES */}
        {activeTab === 'ACTIVE' && (
          <div className="space-y-4 animate-fade-in">
            {ordersLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-sky-400 border-t-sky-600 rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Fetching assigned delivery runs...</span>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Truck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-sm text-[#17202A]">No Pending Deliveries</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You are all caught up! New orders assigned by Campus Administration will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((o) => {
                  const isReadyOrAssigned =
                    o.status === 'DELIVERY_ASSIGNED' ||
                    o.status === 'READY_FOR_PICKUP' ||
                    o.status === 'READY';
                  const isPickedUp = o.status === 'PICKED_UP';
                  const isOutForDelivery = o.status === 'OUT_FOR_DELIVERY';

                  const isCod = o.paymentMethod === 'COD';

                  return (
                    <div
                      key={o.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 hover:shadow-md transition"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                            {o.orderNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Payment Pill */}
                        <div className="flex items-center gap-1.5">
                          {isCod ? (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <span>Cash to Collect:</span>
                              <strong className="font-mono text-sm">₹{o.totalAmount}</strong>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-[#347A27] border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Paid Online (₹{o.totalAmount})</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Locations & Contact */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Pickup Location */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
                            <Store className="w-3.5 h-3.5 text-emerald-600" />
                            <span>1. Pickup Point</span>
                          </div>
                          <div className="font-bold text-[#17202A] text-sm">
                            {o.pickupLocation || 'Campus Service Provider'}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Items: {o.items?.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')}
                          </div>
                        </div>

                        {/* Delivery Location */}
                        <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-sky-700 font-bold uppercase text-[10px]">
                            <MapPin className="w-3.5 h-3.5 text-sky-600" />
                            <span>2. Hostel Destination</span>
                          </div>
                          <div className="font-bold text-[#17202A] text-sm">
                            {o.hallName}, Room {o.roomNumber}
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-600 font-semibold">{o.studentName}</span>
                            {o.studentPhone && (
                              <a
                                href={`tel:${o.studentPhone}`}
                                className="flex items-center gap-1 text-sky-600 font-bold hover:underline font-mono"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{o.studentPhone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section 15 Action Buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100">
                        {isReadyOrAssigned && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'PICKED_UP')}
                            disabled={actionLoading === o.id}
                            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <Store className="w-4 h-4" />
                            <span>Pick Up Order from Vendor</span>
                          </button>
                        )}

                        {isPickedUp && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'OUT_FOR_DELIVERY')}
                            disabled={actionLoading === o.id}
                            className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Depart &bull; Out for Delivery</span>
                          </button>
                        )}

                        {isOutForDelivery && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'DELIVERED')}
                            disabled={actionLoading === o.id}
                            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isCod ? `Collect ₹${o.totalAmount} & Mark Delivered` : 'Confirm Room Drop (Delivered)'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SECTION 16 DELIVERY HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-4 animate-fade-in">
            {historyLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-sky-400 border-t-sky-600 rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Loading completed drops...</span>
              </div>
            ) : historyOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
                No completed deliveries recorded in this cycle.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Order ID &amp; Date</th>
                        <th className="py-3.5 px-4">Destination</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Payment Collected</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyOrders.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                            <div>{h.orderNumber}</div>
                            <div className="text-[10px] text-slate-400 font-sans font-normal">
                              {new Date(h.updatedAt || h.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{h.hallName}</div>
                            <div className="text-[10px] text-slate-500">Room {h.roomNumber}</div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {h.student?.fullName || h.studentName || 'Student'}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            ₹{h.totalAmount} ({h.paymentMethod})
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#347A27] border border-emerald-200">
                              DELIVERED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
