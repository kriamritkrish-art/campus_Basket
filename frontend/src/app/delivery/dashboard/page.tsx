'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDelivery, DeliveryStatus } from '@/context/DeliveryContext';
import {
  Package,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Phone,
  Navigation,
  ArrowRight,
  Bike,
  Compass,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronRight,
  Flame,
  KeyRound,
  Store,
} from 'lucide-react';

export default function DeliveryDashboardPage() {
  const {
    isOnline,
    toggleOnline,
    activeOrder,
    advanceActiveStatus,
    verifyDeliveryOtp,
    availableOrders,
    acceptAvailableOrder,
    todayStats,
    deliveryHistory,
  } = useDelivery();

  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);

  // Status mapping for 7-step timeline
  const workflowSteps: { id: DeliveryStatus; label: string; stepNumber: number }[] = [
    { id: 'ACCEPTED', label: 'Accepted', stepNumber: 1 },
    { id: 'TO_PICKUP', label: 'To Pickup', stepNumber: 2 },
    { id: 'AT_PICKUP', label: 'At Pickup', stepNumber: 3 },
    { id: 'PICKED_UP', label: 'Picked Up', stepNumber: 4 },
    { id: 'IN_TRANSIT', label: 'In Transit', stepNumber: 5 },
    { id: 'AT_HOSTEL', label: 'At Hostel', stepNumber: 6 },
    { id: 'DELIVERED', label: 'Delivered', stepNumber: 7 },
  ];

  const getStatusIndex = (status?: DeliveryStatus) => {
    if (!status) return 0;
    const idx = workflowSteps.findIndex((s) => s.id === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStepIndex = getStatusIndex(activeOrder?.status);

  const getNextActionConfig = () => {
    if (!activeOrder) return null;
    switch (activeOrder.status) {
      case 'ASSIGNED':
      case 'ACCEPTED':
        return { label: 'Navigate to Pickup', action: advanceActiveStatus, color: 'btn-primary' };
      case 'TO_PICKUP':
        return { label: 'Arrived at Pickup', action: advanceActiveStatus, color: 'btn-primary' };
      case 'AT_PICKUP':
        return { label: 'Confirm Picked Up', action: advanceActiveStatus, color: 'btn-primary' };
      case 'PICKED_UP':
        return { label: 'Start Delivery Transit', action: advanceActiveStatus, color: 'btn-primary' };
      case 'IN_TRANSIT':
        return { label: 'Arrived at Hostel Gate', action: advanceActiveStatus, color: 'btn-primary' };
      case 'AT_HOSTEL':
        return {
          label: activeOrder.isOtpVerified ? 'Mark as Delivered' : 'Enter OTP Below to Finish',
          action: activeOrder.isOtpVerified ? advanceActiveStatus : () => {},
          disabled: !activeOrder.isOtpVerified,
          color: 'btn-primary',
        };
      default:
        return { label: 'Complete Order', action: advanceActiveStatus, color: 'btn-primary' };
    }
  };

  const nextAction = getNextActionConfig();

  const handleOtpVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(false);
    const success = verifyDeliveryOtp(otpInput);
    if (!success) {
      setOtpError(true);
    } else {
      setOtpInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================================================
          9. DASHBOARD HEADER
         ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Good evening, Sourav 👋
            </h2>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Ready for your next delivery? NIT Durgapur Campus delivery rush is active.
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

          {activeOrder && (
            <Link
              href="/delivery/active"
              className="px-4 py-2.5 rounded-xl bg-[#4F9D2F] text-white text-xs font-bold hover:bg-[#36751F] transition flex items-center gap-1.5 shadow-sm"
            >
              <span>View Active Delivery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* ==================================================
          10. STATISTICS (Four Card Grid)
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
          11. ACTIVE DELIVERY PRIMARY CARD (Requirement 11, 12, 13)
         ================================================== */}
      {activeOrder ? (
        <div className="card active-delivery-card-emphasis p-5 sm:p-7 bg-white relative overflow-hidden">
          {/* Top header of card */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF6E5] text-[#36751F] flex items-center justify-center font-bold">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#36751F] bg-[#EAF6E5] px-2.5 py-0.5 rounded-md">
                    ACTIVE DELIVERY
                  </span>
                  <span className="text-sm font-black text-gray-900">
                    Order {activeOrder.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Student Customer: <span className="font-bold text-gray-800">{activeOrder.studentName}</span> • Accepted at {activeOrder.acceptedAt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-400 font-semibold">Your Earning</div>
                <div className="text-lg font-black text-emerald-700">₹{activeOrder.earning}</div>
              </div>
              <div className="h-8 w-px bg-gray-200 hidden sm:block" />
              <div className="text-right">
                <div className="text-xs text-gray-400 font-semibold">ETA / Dist</div>
                <div className="text-sm font-extrabold text-gray-800">{activeOrder.eta} ({activeOrder.distance})</div>
              </div>
            </div>
          </div>

          {/* 12. DELIVERY WORKFLOW (Horizontal on desktop, vertical on mobile) */}
          <div className="py-6">
            <div className="delivery-workflow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 md:gap-1 relative">
              {workflowSteps.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isUpcoming = idx > currentStepIndex;

                return (
                  <div
                    key={step.id}
                    className="flex-1 flex md:flex-col items-center gap-2.5 md:gap-1.5 text-center relative"
                  >
                    {/* Connector line for desktop */}
                    {idx < workflowSteps.length - 1 && (
                      <div
                        className={`hidden md:block absolute top-3.5 left-1/2 w-full h-0.5 -z-0 ${
                          idx < currentStepIndex ? 'bg-emerald-400' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Step pill / badge */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black z-10 transition-all ${
                        isCurrent
                          ? 'bg-[#4F9D2F] text-white ring-4 ring-green-100 shadow-sm scale-110'
                          : isCompleted
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : 'bg-[#F3F4F6] text-[#9CA3AF]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.stepNumber}
                    </div>

                    <span
                      className={`text-xs ${
                        isCurrent
                          ? 'font-black text-[#36751F]'
                          : isCompleted
                          ? 'font-bold text-gray-800'
                          : 'font-medium text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 13. TWO-COLUMN ACTIVE DELIVERY SECTION (1.4fr : 1fr) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 pt-4 border-t border-gray-100 active-delivery-layout">
            {/* Left Column: Pickup + Destination Details */}
            <div className="space-y-4">
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/70 space-y-4">
                {/* Pickup point */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-blue-800">
                      PICKUP LOCATION
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">
                      {activeOrder.pickupLocation}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {activeOrder.pickupStation}
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-1" />

                {/* Destination point */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-800">
                      DESTINATION HOSTEL
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">
                      {activeOrder.destination}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Student: {activeOrder.studentName} • {activeOrder.studentPhone}
                    </div>
                  </div>
                  <a
                    href={`tel:${activeOrder.studentPhone}`}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
                    title="Call Student"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </a>
                </div>
              </div>

              {/* Order Items Pill */}
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Items to Deliver:</span>{' '}
                  <span className="text-amber-800">{activeOrder.items.join(', ')}</span>
                </div>
                <span className="font-black bg-amber-100 px-2 py-0.5 rounded text-amber-900">
                  Prepaid
                </span>
              </div>

              {/* OTP Form if at hostel */}
              {activeOrder.status === 'AT_HOSTEL' && !activeOrder.isOtpVerified && (
                <form
                  onSubmit={handleOtpVerifySubmit}
                  className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-black uppercase text-purple-900">
                        Enter Student Doorstep OTP
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                      Demo OTP: {activeOrder.otpRequired}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={otpInput}
                      onChange={(e) => {
                        setOtpInput(e.target.value);
                        setOtpError(false);
                      }}
                      placeholder="4-digit OTP"
                      className="flex-1 px-3 py-2 text-center text-lg font-mono font-bold tracking-widest bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-700 text-white text-xs font-black rounded-lg hover:bg-purple-800 transition"
                    >
                      Verify OTP
                    </button>
                  </div>
                  {otpError && (
                    <p className="text-xs text-red-600 font-bold">
                      Incorrect OTP. Ask student for their 4-digit Campus Basket delivery code.
                    </p>
                  )}
                </form>
              )}

              {activeOrder.isOtpVerified && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Doorstep OTP Verified! Order ready to be marked as Delivered.</span>
                </div>
              )}

              {/* Action Buttons (Requirement 31 & 32) */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {nextAction && (
                  <button
                    onClick={nextAction.action}
                    disabled={nextAction.disabled}
                    className={`btn-primary flex-1 ${
                      nextAction.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span>{nextAction.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <Link
                  href="/delivery/active"
                  className="btn-secondary px-4 text-xs"
                >
                  <Navigation className="w-4 h-4 text-[#36751F]" />
                  <span>Full Delivery Page</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Campus Route / Map Visualizer */}
            <div className="bg-slate-900 rounded-xl p-4 text-white flex flex-col justify-between relative overflow-hidden min-h-[220px]">
              {/* Stylized Campus Route Map Blueprint */}
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#4F9D2F_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold tracking-wide uppercase text-gray-300">
                    NIT Durgapur Campus Route
                  </span>
                </div>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Live Dispatch
                </span>
              </div>

              {/* Stylized Visual Map Waypoints */}
              <div className="relative z-10 my-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-3 h-3 rounded-full bg-blue-400 ring-4 ring-blue-900/60" />
                  <span className="text-gray-200 font-bold truncate">
                    {activeOrder.pickupLocation}
                  </span>
                </div>
                <div className="ml-1.5 pl-3 border-l-2 border-dashed border-emerald-500/50 py-1 text-[11px] text-emerald-400 font-mono">
                  ↓ Main Academic Avenue • 0.8 km route
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-900/60" />
                  <span className="text-gray-200 font-bold truncate">
                    {activeOrder.destination}
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="text-xs text-gray-400 font-medium">
                  Cycle Route: <span className="text-white font-bold">~8 mins</span>
                </div>
                <button
                  onClick={() => window.open('https://maps.google.com', '_blank')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>Open Campus Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Requirement 34: Empty State if no active delivery */
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
                      disabled={!!activeOrder}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeOrder
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#4F9D2F] text-white hover:bg-[#36751F]'
                      }`}
                      title={activeOrder ? 'Finish active delivery first' : 'Accept Request'}
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
