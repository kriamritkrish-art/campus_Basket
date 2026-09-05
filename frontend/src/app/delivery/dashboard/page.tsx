'use client';

import React from 'react';
import Link from 'next/link';
import { useDelivery } from '@/context/DeliveryContext';
import OrderCard from '@/components/delivery/OrderCard';
import {
  Package,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  ArrowRight,
  Bike,
  Compass,
  Store,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function DeliveryDashboardPage() {
  const {
    isOnline,
    toggleOnline,
    activeOrders,
    availableOrders,
    acceptAvailableOrder,
    todayStats,
    deliveryHistory,
  } = useDelivery();

  return (
    <div className="space-y-6">
      {/* ==================================================
          DASHBOARD HEADER
         ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Good evening, Sourav 👋
            </h2>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Ready for your next delivery? Update status with one-tap on active cards below.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleOnline}
            className={`delivery-status-toggle ${
              isOnline ? 'delivery-status-online' : 'delivery-status-offline'
            }`}
          >
            <span className="delivery-status-dot" />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          {activeOrders.length > 0 && (
            <Link
              href="/delivery/active"
              className="px-4 py-2.5 rounded-xl bg-[#4F9D2F] text-white text-xs font-bold hover:bg-[#36751F] transition flex items-center gap-1.5 shadow-sm"
            >
              <span>View All Active ({activeOrders.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* ==================================================
          STATISTICS (Four Card Grid)
         ================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
            Today's Delivery Overview
          </h3>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Active Shift • Hall Zone 1–14
          </span>
        </div>

        <div className="stats-grid">
          {/* Total Deliveries Today */}
          <div className="stat-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Total Deliveries</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900 tracking-tight">
                {todayStats.totalToday}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-semibold">Today's Assigned</p>
            </div>
          </div>

          {/* Completed */}
          <div className="stat-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Completed</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-700 tracking-tight">
                {todayStats.completedToday}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-semibold">Delivered on Time</p>
            </div>
          </div>

          {/* Pending */}
          <div className="stat-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Pending</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-amber-600 tracking-tight">
                {todayStats.pendingToday}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-semibold">In Pipeline / Queue</p>
            </div>
          </div>

          {/* Today's Earnings */}
          <div className="stat-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Today's Earnings</span>
              <div className="w-9 h-9 rounded-xl bg-green-50 text-[#36751F] flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900 tracking-tight">
                ₹{todayStats.earningsToday}
              </div>
              <p className="text-xs text-emerald-700 mt-1 font-bold">
                + ₹{todayStats.dailyTarget > todayStats.completedToday ? '100 bonus at 10 orders' : 'Bonus unlocked!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          ACTIVE DELIVERIES: ONE-TAP STATUS UPDATE CARDS
         ================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Active Deliveries ({activeOrders.length})
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              One-Tap Direct Actions
            </span>
          </div>

          <Link
            href="/delivery/active"
            className="text-xs font-bold text-[#36751F] hover:underline flex items-center gap-1"
          >
            <span>Manage All Slots</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="card p-8 bg-white text-center border-dashed border-2 border-gray-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-[#36751F] flex items-center justify-center mb-3">
              <Bike className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-gray-900">
              🚚 No Active Delivery
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              You're ready for your next delivery. Check available requests below or head over to the deliveries pool.
            </p>
            <Link
              href="/delivery/deliveries"
              className="btn-primary text-xs px-5 inline-flex"
            >
              <Compass className="w-4 h-4" />
              <span>View Available Deliveries</span>
            </Link>
          </div>
        )}
      </div>

      {/* ==================================================
          AVAILABLE DELIVERIES SNAPSHOT & RECENT DELIVERIES
         ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Deliveries Queue */}
        <div className="card p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#36751F]" />
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                Available Requests
              </h3>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {availableOrders.length} Ready
              </span>
            </div>
            <Link
              href="/delivery/deliveries"
              className="text-xs font-bold text-[#36751F] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {availableOrders.length > 0 ? (
            <div className="space-y-3">
              {availableOrders.slice(0, 2).map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-emerald-300 transition bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">{order.orderNumber}</span>
                      <span className="text-[10px] font-bold text-gray-400 font-mono">
                        {order.distance} • {order.eta}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      <span className="text-gray-900 font-semibold">{order.pickupLocation}</span> → {order.destination}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right pr-2">
                      <div className="text-xs text-gray-400 font-semibold">Earn</div>
                      <div className="text-sm font-black text-emerald-700">₹{order.earning}</div>
                    </div>
                    <button
                      onClick={() => acceptAvailableOrder(order.id)}
                      disabled={activeOrders.length >= 5}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeOrders.length >= 5
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#4F9D2F] text-white hover:bg-[#36751F]'
                      }`}
                      title={activeOrders.length >= 5 ? 'Max active capacity reached' : 'Accept Request'}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-400 font-medium">
              📦 No new delivery requests waiting in queue.
            </div>
          )}
        </div>

        {/* Recent Delivery History Snapshot */}
        <div className="card p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                Recent Completed Deliveries
              </h3>
            </div>
            <Link
              href="/delivery/history"
              className="text-xs font-bold text-[#36751F] hover:underline flex items-center gap-1"
            >
              <span>Full History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {deliveryHistory.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition bg-white flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900">{item.orderNumber}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-gray-500 font-medium mt-0.5">
                    {item.destination} • <span className="text-gray-400">{item.date}</span>
                  </div>
                </div>

                <div className="text-right font-black text-emerald-700 text-sm">
                  {item.earning > 0 ? `₹${item.earning}` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
