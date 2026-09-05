'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDelivery } from '@/context/DeliveryContext';
import {
  Package,
  Compass,
  ArrowRight,
  Store,
  MapPin,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Flame,
  Filter,
  RefreshCw,
} from 'lucide-react';

export default function AvailableDeliveriesPage() {
  const {
    isOnline,
    toggleOnline,
    activeOrders,
    activeOrder,
    availableOrders,
    acceptAvailableOrder,
    rejectAvailableOrder,
  } = useDelivery();

  const [filterType, setFilterType] = useState<'ALL' | 'HIGH_PAY' | 'NEARBY'>('ALL');

  const filteredOrders = availableOrders.filter((order) => {
    if (filterType === 'HIGH_PAY') return order.earning >= 40;
    if (filterType === 'NEARBY') return parseFloat(order.distance) <= 1.0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#36751F]" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Available Delivery Requests
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              {availableOrders.length} Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Accept requests to begin campus dispatch. Only one active order can be held at a time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({availableOrders.length})
            </button>
            <button
              onClick={() => setFilterType('HIGH_PAY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'HIGH_PAY' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Surge ₹40+
            </button>
            <button
              onClick={() => setFilterType('NEARBY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'NEARBY' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Nearby (&lt;1km)
            </button>
          </div>
        </div>
      </div>

      {/* Online Status Notice */}
      {!isOnline && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              You are currently <span className="font-bold">OFFLINE</span>. Switch to ONLINE to accept and receive new orders.
            </span>
          </div>
          <button
            onClick={toggleOnline}
            className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
          >
            Go Online
          </button>
        </div>
      )}

      {/* Active Slots Capacity Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4 text-xs text-blue-900">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span>
            Active Deliveries: <span className="font-bold">{activeOrders.length} / 5</span> ({Math.max(0, 5 - activeOrders.length)} slots available to accept).
          </span>
        </div>
        {activeOrders.length > 0 && (
          <Link
            href="/delivery/active"
            className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-1 flex-shrink-0"
          >
            <span>View Active ({activeOrders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Available Orders Grid */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="card p-5 bg-white flex flex-col justify-between hover:border-emerald-300 transition group"
            >
              <div>
                {/* Card Top: Order Tag & Earning */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-[#36751F] bg-[#EAF6E5] px-2 py-0.5 rounded">
                      NEW DELIVERY
                    </span>
                    <span className="text-sm font-black text-gray-900 font-mono">
                      {order.orderNumber}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Earning</div>
                    <div className="text-lg font-black text-emerald-700">₹{order.earning}</div>
                  </div>
                </div>

                {/* Location Waypoints */}
                <div className="py-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">PICKUP</div>
                      <div className="text-xs font-bold text-gray-900">{order.pickupLocation}</div>
                    </div>
                  </div>

                  <div className="ml-3 pl-3 border-l-2 border-dashed border-gray-200 py-0.5 text-[11px] font-mono text-gray-400">
                    {order.distance} • ~{order.eta}
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">DELIVER TO</div>
                      <div className="text-xs font-bold text-gray-900">{order.destination}</div>
                      <div className="text-[11px] text-gray-500">Customer: {order.studentName}</div>
                    </div>
                  </div>
                </div>

                {/* Urgent indicator if applicable */}
                {order.urgency === 'HIGH' && (
                  <div className="mb-4 bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>High demand hostel route (+₹15 incentive eligible)</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => rejectAvailableOrder(order.id)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-red-600 transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => acceptAvailableOrder(order.id)}
                  disabled={activeOrders.length >= 5 || !isOnline}
                  className={`btn-primary flex-1 py-2.5 text-xs justify-center ${
                    activeOrders.length >= 5 || !isOnline ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={
                    !isOnline
                      ? 'Go online to accept'
                      : activeOrders.length >= 5
                      ? 'Max active capacity reached (5/5)'
                      : 'Accept this delivery'
                  }
                >
                  <span>Accept Delivery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Requirement 34: Empty state */
        <div className="card p-12 bg-white text-center border-dashed border-2 border-gray-200 max-w-xl mx-auto my-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-gray-900">
            📦 No New Deliveries
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            We'll notify you when a delivery is assigned in your zone. Keep your app online to receive instant sound alerts.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-xs px-4 inline-flex"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check for Updates</span>
          </button>
        </div>
      )}
    </div>
  );
}
