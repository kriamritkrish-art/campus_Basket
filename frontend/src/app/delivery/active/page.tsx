'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDelivery, DeliveryStatus } from '@/context/DeliveryContext';
import {
  Bike,
  Store,
  MapPin,
  Phone,
  Clock,
  IndianRupee,
  Navigation,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Check,
  ExternalLink,
  LifeBuoy,
  ShoppingBag,
  Info,
} from 'lucide-react';

export default function ActiveDeliveryPage() {
  const {
    activeOrder,
    advanceActiveStatus,
    verifyDeliveryOtp,
  } = useDelivery();

  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);

  const workflowSteps: { id: DeliveryStatus; label: string; stepNumber: number; desc: string }[] = [
    { id: 'ACCEPTED', label: 'Accepted', stepNumber: 1, desc: 'Order confirmed by runner' },
    { id: 'TO_PICKUP', label: 'To Pickup', stepNumber: 2, desc: 'Riding towards campus canteen' },
    { id: 'AT_PICKUP', label: 'At Pickup', stepNumber: 3, desc: 'Verifying food packaging' },
    { id: 'PICKED_UP', label: 'Picked Up', stepNumber: 4, desc: 'Parcel secured in delivery bag' },
    { id: 'IN_TRANSIT', label: 'In Transit', stepNumber: 5, desc: 'Cycling across academic lane' },
    { id: 'AT_HOSTEL', label: 'At Hostel', stepNumber: 6, desc: 'Hostel gate / floor arrival' },
    { id: 'DELIVERED', label: 'Delivered', stepNumber: 7, desc: 'Doorstep OTP handover complete' },
  ];

  const getStatusIndex = (status?: DeliveryStatus) => {
    if (!status) return 0;
    const idx = workflowSteps.findIndex((s) => s.id === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStepIndex = getStatusIndex(activeOrder?.status);

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

  const getNextActionButton = () => {
    if (!activeOrder) return null;
    switch (activeOrder.status) {
      case 'ASSIGNED':
      case 'ACCEPTED':
        return {
          label: 'Navigate to Pickup',
          helper: 'Head to Campus Cafeteria & Canteen Counter',
          action: advanceActiveStatus,
        };
      case 'TO_PICKUP':
        return {
          label: 'I Have Arrived at Pickup',
          helper: 'Report arrival at Canteen Counter',
          action: advanceActiveStatus,
        };
      case 'AT_PICKUP':
        return {
          label: 'Confirm Pickup & Bag Order',
          helper: 'Ensure all meal items are sealed',
          action: advanceActiveStatus,
        };
      case 'PICKED_UP':
        return {
          label: 'Start Delivery to Hostel',
          helper: 'Begin navigation to student block',
          action: advanceActiveStatus,
        };
      case 'IN_TRANSIT':
        return {
          label: 'Arrived at Student Hostel',
          helper: 'Meet student at hostel gate / room',
          action: advanceActiveStatus,
        };
      case 'AT_HOSTEL':
        return {
          label: activeOrder.isOtpVerified ? 'Complete & Mark as Delivered' : 'Verify Student OTP to Finish',
          helper: activeOrder.isOtpVerified ? 'Order ready for instant payout' : 'Ask student for 4-digit code',
          action: activeOrder.isOtpVerified ? advanceActiveStatus : () => {},
          disabled: !activeOrder.isOtpVerified,
        };
      default:
        return {
          label: 'Complete Order',
          helper: 'Finalize delivery dispatch',
          action: advanceActiveStatus,
        };
    }
  };

  const nextAction = getNextActionButton();

  if (!activeOrder) {
    return (
      <div className="card p-12 bg-white text-center border-dashed border-2 border-gray-200 max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-[#36751F] flex items-center justify-center mb-4 shadow-xs">
          <Bike className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-gray-900">
          🚚 No Active Delivery
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
          You are currently unassigned and ready for your next campus delivery task. Browse live student orders in the pool.
        </p>
        <Link
          href="/delivery/deliveries"
          className="btn-primary text-sm px-6 py-3 inline-flex shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>View Available Deliveries</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* CARD HEADER & ESSENTIAL ORDER BADGES */}
      <div className="card active-delivery-card-emphasis p-6 bg-white space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF6E5] text-[#36751F] flex items-center justify-center font-black shadow-xs">
              <Bike className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#36751F] bg-[#EAF6E5] px-2.5 py-0.5 rounded-md">
                  LIVE RUNNER ASSIGNMENT
                </span>
                <span className="text-lg font-black text-gray-900">
                  {activeOrder.orderNumber}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Student Customer: <span className="font-bold text-gray-800">{activeOrder.studentName}</span> • Accepted at {activeOrder.acceptedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-400 font-semibold">Delivery Fee</div>
              <div className="text-2xl font-black text-emerald-700">₹{activeOrder.earning}</div>
            </div>
            <div className="h-10 w-px bg-gray-200 hidden sm:block" />
            <div className="text-right">
              <div className="text-xs text-gray-400 font-semibold">ETA / Distance</div>
              <div className="text-base font-black text-gray-900">{activeOrder.eta} ({activeOrder.distance})</div>
            </div>
          </div>
        </div>

        {/* WORKFLOW STEPPER TIMELINE */}
        <div className="py-2">
          <div className="delivery-workflow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-1 relative">
            {workflowSteps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className="flex-1 flex md:flex-col items-center gap-3 md:gap-1.5 text-center relative"
                >
                  {/* Connector Line */}
                  {idx < workflowSteps.length - 1 && (
                    <div
                      className={`hidden md:block absolute top-3.5 left-1/2 w-full h-0.5 -z-0 ${
                        idx < currentStepIndex ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  )}

                  {/* Step Pill */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 transition-all ${
                      isCurrent
                        ? 'bg-[#4F9D2F] text-white ring-4 ring-green-100 shadow-md scale-110'
                        : isCompleted
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : 'bg-[#F3F4F6] text-[#9CA3AF]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.stepNumber}
                  </div>

                  <div>
                    <div
                      className={`text-xs ${
                        isCurrent
                          ? 'font-black text-[#36751F]'
                          : isCompleted
                          ? 'font-bold text-gray-800'
                          : 'font-medium text-gray-400'
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TWO-COLUMN DETAILS & MAP ROUTE */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 pt-4 border-t border-gray-100">
          {/* Left Column: Pickup, Dropoff, Items */}
          <div className="space-y-4">
            {/* Pickup & Destination Box */}
            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Store className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-black uppercase tracking-wider text-blue-800">
                    STEP A: PICKUP LOCATION
                  </div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {activeOrder.pickupLocation}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {activeOrder.pickupStation}
                  </div>
                </div>
                <button
                  onClick={() => window.open('https://maps.google.com', '_blank')}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-100 flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3 text-blue-600" />
                  <span>Navigate</span>
                </button>
              </div>

              <div className="border-t border-dashed border-gray-200 my-1" />

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    STEP B: STUDENT DESTINATION
                  </div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {activeOrder.destination}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    Student: {activeOrder.studentName} ({activeOrder.studentPhone})
                  </div>
                </div>
                <a
                  href={`tel:${activeOrder.studentPhone}`}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-emerald-700 hover:bg-gray-100 flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Special Instructions */}
            {activeOrder.specialInstructions && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Student Note:</span> {activeOrder.specialInstructions}
                </div>
              </div>
            )}

            {/* Items Checklist */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center justify-between">
                <span>Items in this Order ({activeOrder.items.length})</span>
                <span className="text-emerald-700 font-bold">PAID ONLINE</span>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
                {activeOrder.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F9D2F]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Doorstep OTP Verification Form (Visible at hostel step) */}
            {activeOrder.status === 'AT_HOSTEL' && !activeOrder.isOtpVerified && (
              <form
                onSubmit={handleOtpVerifySubmit}
                className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-purple-700" />
                    <span className="text-sm font-black text-purple-900">
                      Verify Student Doorstep OTP
                    </span>
                  </div>
                  <span className="text-xs font-mono text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full font-bold">
                    Demo OTP: {activeOrder.otpRequired}
                  </span>
                </div>
                <p className="text-xs text-purple-700">
                  Ask the student at {activeOrder.destination} for their 4-digit handover code.
                </p>
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
                    className="flex-1 px-4 py-2.5 text-center text-xl font-mono font-bold tracking-widest bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-700 text-white text-xs font-black rounded-xl hover:bg-purple-800 transition"
                  >
                    Verify Code
                  </button>
                </div>
                {otpError && (
                  <p className="text-xs text-red-600 font-bold">
                    Incorrect OTP. Please check with student again.
                  </p>
                )}
              </form>
            )}

            {activeOrder.isOtpVerified && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center gap-3 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>
                  ✓ Handover OTP verified successfully! You can now mark order as Delivered to receive ₹{activeOrder.earning}.
                </span>
              </div>
            )}

            {/* PRIMARY NEXT ACTION BUTTON */}
            {nextAction && (
              <div className="pt-2">
                <button
                  onClick={nextAction.action}
                  disabled={nextAction.disabled}
                  className={`btn-primary w-full py-4 text-sm font-black justify-between px-6 shadow-sm ${
                    nextAction.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="text-left">
                    <div>{nextAction.label}</div>
                    <div className="text-[11px] font-normal text-emerald-100">
                      {nextAction.helper}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Campus Route Visualizer & Quick Support */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between min-h-[300px] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4F9D2F_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-200">
                    Live Campus Nav
                  </span>
                </div>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  NIT Durgapur Map
                </span>
              </div>

              {/* Waypoints */}
              <div className="relative z-10 my-4 space-y-3 bg-slate-800/90 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-3 h-3 rounded-full bg-blue-400 ring-4 ring-blue-900/60 flex-shrink-0" />
                  <div>
                    <div className="text-gray-400 text-[10px] font-semibold">PICKUP</div>
                    <div className="font-bold text-gray-100">{activeOrder.pickupLocation}</div>
                  </div>
                </div>

                <div className="ml-1.5 pl-3 border-l-2 border-dashed border-emerald-500/60 py-2 text-[11px] text-emerald-400 font-mono">
                  🚴 Campus Cycle Route • {activeOrder.distance} ({activeOrder.eta})
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-900/60 flex-shrink-0" />
                  <div>
                    <div className="text-gray-400 text-[10px] font-semibold">DESTINATION</div>
                    <div className="font-bold text-gray-100">{activeOrder.destination}</div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="text-gray-400 font-medium">
                  Speed: <span className="text-white font-bold">Campus Cycle Pace</span>
                </div>
                <button
                  onClick={() => window.open('https://maps.google.com', '_blank')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                >
                  <span>Open Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Need Help with this Delivery */}
            <div className="card p-4 bg-white border border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-900">Issue with this order?</div>
                <p className="text-[11px] text-gray-500">Student unavailable or canteen delay</p>
              </div>
              <Link
                href="/delivery/support"
                className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Get Help</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
