'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDelivery } from '@/context/DeliveryContext';
import OrderCard from '@/components/delivery/OrderCard';
import {
  Bike,
  Plus,
  ArrowRight,
  Compass,
  CheckCircle2,
  Navigation,
  Sparkles,
  Flame,
  Store,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function ActiveDeliveryPage() {
  const { activeOrders, maxActiveSlots, advanceOrderStatus } = useDelivery();

  const activeCount = activeOrders.length;
  const availableSlots = Math.max(0, maxActiveSlots - activeCount);

  // Determine Smart Recommended Next Action (Section 10)
  // Find urgent / earliest pending step order (e.g. pickup ready or high priority)
  const recommendedOrder =
    activeOrders.find((o) => o.priority === 'HIGH') ||
    activeOrders.find((o) => o.status === 'PICKUP_READY') ||
    activeOrders.find((o) => o.status === 'PICKED_UP') ||
    activeOrders[0];

  const scrollToOrder = (orderId: string) => {
    const el = document.getElementById(`order-card-${orderId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#4F9D2F]');
      setTimeout(() => el.classList.remove('ring-2', 'ring-[#4F9D2F]'), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER: Capacity & Slots Indicator (Section 9) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EAF6E5] text-[#36751F] flex items-center justify-center font-black">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                ACTIVE DELIVERIES
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                One-tap status updates directly from cards. Orders progress independently.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-2xl font-black text-gray-900">
                {activeCount}
              </span>
              <span className="text-sm font-extrabold text-gray-400">
                / {maxActiveSlots}
              </span>
            </div>
            <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
              {availableSlots} slots available
            </div>
          </div>

          {availableSlots > 0 && (
            <Link
              href="/delivery/deliveries"
              className="px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition flex items-center gap-1.5"
              title="Add more from available pool"
            >
              <Plus className="w-4 h-4 text-gray-600" />
              <span className="hidden sm:inline">Add Order</span>
            </Link>
          )}
        </div>
      </div>

      {/* SMART NEXT ACTION BANNER (Section 10) */}
      {recommendedOrder && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50/80 border-2 border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F9D2F] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#36751F] bg-[#EAF6E5] px-2 py-0.5 rounded">
                  NEXT RECOMMENDED ACTION
                </span>
                {recommendedOrder.priority === 'HIGH' && (
                  <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-600" />
                    Due in {recommendedOrder.eta}
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-gray-900 mt-1 flex items-center gap-2 flex-wrap">
                <span>🚚 Pick up {recommendedOrder.orderNumber}</span>
                <span className="text-gray-400 font-normal">•</span>
                <span className="text-gray-700 font-bold text-xs">{recommendedOrder.pickupLocation}</span>
                <span className="text-gray-400 font-normal">→</span>
                <span className="text-gray-900 font-bold text-xs">{recommendedOrder.destination}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => scrollToOrder(recommendedOrder.id)}
              className="px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-xs font-black text-[#36751F] hover:bg-emerald-100/50 shadow-xs transition"
            >
              GO TO ORDER
            </button>
            <button
              onClick={() => advanceOrderStatus(recommendedOrder.id)}
              className="btn-primary text-xs px-4 py-2.5 shadow-sm"
            >
              <span>Quick Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE ORDERS LIST (Section 1, 4, 9, 14, 15) */}
      {activeOrders.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
              Active Orders List ({activeOrders.length})
            </h3>
            <span className="text-xs text-gray-500 font-semibold">
              Tap primary button to update status instantly
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <div key={order.id} id={`order-card-${order.id}`}>
                <OrderCard order={order} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="card p-12 bg-white text-center border-dashed border-2 border-gray-200">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-[#36751F] flex items-center justify-center mb-3">
            <Bike className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-gray-900">
            🚚 No Active Delivery
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            You currently have 0 active orders. You have all 5 delivery slots available in this shift.
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
  );
}
