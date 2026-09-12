'use client';

import React, { useState } from 'react';
import { ActiveDeliveryOrder, DeliveryStatus, useDelivery } from '@/context/DeliveryContext';
import {
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Store,
  KeyRound,
  FileText,
  HelpCircle,
  Flame,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface OrderCardProps {
  order: ActiveDeliveryOrder;
}

export default function OrderCard({ order }: OrderCardProps) {
  const { advanceOrderStatus, setOtpModalOrder, rejectActiveOrder } = useDelivery();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleConfirmReject = async () => {
    setRejecting(true);
    try {
      await rejectActiveOrder(order.id, 'Runner declined active delivery');
      setShowRejectModal(false);
    } finally {
      setRejecting(false);
    }
  };

  // Status Badge Configuration
  const getStatusBadge = (status: DeliveryStatus) => {
    if (order.isReturnPickup) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
          <RotateCcw className="w-3 h-3 text-rose-600" />
          🔄 Return Pickup
        </span>
      );
    }

    switch (status) {
      case 'ASSIGNED':
      case 'DELIVERY_ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            📦 Assigned (Pickup Pending)
          </span>
        );
      case 'PICKUP_READY':
      case 'READY_FOR_PICKUP':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            🟡 Ready for Pickup
          </span>
        );
      case 'PICKED_UP':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            🛍️ Picked Up (At Store)
          </span>
        );
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            🚚 Out for Delivery
          </span>
        );
      case 'AT_HOSTEL':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            📍 Reached Hostel
          </span>
        );
      case 'OTP_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ✓ OTP Verified
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
            ✓ Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
            {String(status).replace(/_/g, ' ')}
          </span>
        );
    }
  };

  // Status Action Mapping (Section 2)
  const getNextActionConfig = () => {
    if (order.isReturnPickup) {
      return {
        label: 'VERIFY RETURN OTP & COMPLETE PICKUP',
        action: () => setOtpModalOrder(order),
        bg: 'bg-rose-600 hover:bg-rose-700',
      };
    }

    switch (order.status) {
      case 'ASSIGNED':
      case 'DELIVERY_ASSIGNED':
        return {
          label: 'CONFIRM PICKUP',
          action: () => advanceOrderStatus(order.id),
          bg: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'PICKUP_READY':
      case 'READY_FOR_PICKUP':
        return {
          label: 'CONFIRM PICKUP',
          action: () => advanceOrderStatus(order.id),
          bg: order.priority === 'HIGH' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700',
        };
      case 'PICKED_UP':
        return {
          label: 'START DELIVERY (OUT FOR DELIVERY)',
          action: () => advanceOrderStatus(order.id),
          bg: 'bg-purple-600 hover:bg-purple-700',
        };
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
      case 'AT_HOSTEL':
        return {
          label: 'VERIFY DELIVERY OTP',
          action: () => setOtpModalOrder(order),
          bg: 'bg-emerald-600 hover:bg-emerald-700',
        };
      case 'OTP_VERIFIED':
        return {
          label: 'MARK DELIVERED',
          action: () => advanceOrderStatus(order.id),
          bg: 'bg-emerald-600 hover:bg-emerald-700',
        };
      case 'DELIVERED':
        return {
          label: '✓ DELIVERED',
          action: () => {},
          disabled: true,
          bg: 'bg-gray-400 cursor-not-allowed',
        };
      default:
        return {
          label: 'UPDATE STATUS',
          action: () => advanceOrderStatus(order.id),
          bg: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const actionConfig = getNextActionConfig();

  return (
    <div className="order-card relative">
      {/* CARD TOP ROW: Status Badge | Order ID | Cash to collect */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge(order.status)}
          <span className="font-mono text-sm font-black text-gray-900 tracking-tight">
            {order.orderNumber}
          </span>
          {order.priority === 'HIGH' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              <Flame className="w-3 h-3 text-red-600" />
              HIGH PRIORITY
            </span>
          )}
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Cash to Collect</span>
          <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
            ₹{Number(order.codDue || 0).toFixed(2)}
          </span>
          {Number(order.codDue || 0) > 0 && Number(order.advancePaidAmount || 0) > 0 && (
            <span className="text-[10px] text-gray-500 block">After ₹{Number(order.advancePaidAmount).toFixed(2)} advance</span>
          )}
        </div>
      </div>

      {/* ADDRESS SECTION: Both Provider & Student Addresses displayed prominently */}
      <div className="pt-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Provider Store Address Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
              <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{order.isReturnPickup ? 'Drop Address (Provider)' : 'Pickup Address (Provider)'}</span>
            </div>
            <div className="font-bold text-slate-900 line-clamp-1">
              {order.providerName || (order.isReturnPickup ? order.destination : order.pickupLocation)}
            </div>
            <div className="text-[11px] text-slate-500 line-clamp-1">
              {order.providerAddress || (order.isReturnPickup ? order.destination : order.pickupStation || 'Campus Food Court & Mart Desk')}
            </div>
          </div>

          {/* Student Hostel Address Card */}
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-800">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{order.isReturnPickup ? 'Pickup Address (Student)' : 'Drop Address (Student)'}</span>
              </div>
              {order.studentPhone && (
                <a
                  href={`tel:${order.studentPhone}`}
                  className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-2.5 h-2.5" />
                  <span>Call</span>
                </a>
              )}
            </div>
            <div className="font-bold text-slate-900 line-clamp-1">
              {order.studentName}
            </div>
            <div className="text-[11px] text-slate-700 font-semibold line-clamp-1">
              {order.studentAddress || (order.isReturnPickup ? order.pickupLocation : order.destination)}
            </div>
          </div>
        </div>

        {/* Compact Route Distance & ETA Indicator */}
        <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-center justify-between gap-2 font-mono">
          <div className="truncate font-semibold text-gray-700 flex items-center gap-1">
            <span>{order.isReturnPickup ? 'Student Room Doorstep' : 'Campus Merchant'}</span>
            <span className="text-gray-400">➔</span>
            <span>{order.isReturnPickup ? 'Merchant Counter' : 'Hostel Doorstep'}</span>
          </div>
          <span className="text-gray-600 shrink-0 font-bold">
            {order.distance} • {order.eta}
          </span>
        </div>
      </div>

      {/* OPTIONAL EXPANDABLE DETAILS (Section 6) */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 text-xs animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">PICKUP</div>
              <div className="font-bold text-gray-900">{order.pickupLocation}</div>
              <div className="text-gray-500 text-[11px]">{order.pickupStation}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">DESTINATION</div>
              <div className="font-bold text-gray-900">{order.destination}</div>
              <div className="text-gray-500 text-[11px]">{order.studentPhone}</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">ITEMS</div>
            <ul className="list-disc list-inside space-y-0.5 text-gray-800 font-medium">
              {order.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {order.specialInstructions && (
            <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-100 text-blue-900">
              <span className="font-bold text-[11px] uppercase">STUDENT NOTE: </span>
              <span>{order.specialInstructions}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <a
              href={`tel:${order.studentPhone}`}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Call Student</span>
            </a>
            <button
              onClick={() => window.open('https://maps.google.com', '_blank')}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Open Maps</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTION ROW (Section 14 & 15): 60-70% primary action, small ⋮ button */}
      <div className="order-action-row relative">
        <button
          onClick={actionConfig.action}
          disabled={actionConfig.disabled}
          className={`status-action ${actionConfig.bg}`}
        >
          <span>{actionConfig.label}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Small ⋮ Menu Button (Section 5 & 14) */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="more-button"
            title="Order Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 bottom-12 z-30 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 text-xs font-semibold text-gray-700 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setExpanded((prev) => !prev);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>{expanded ? 'Hide Details' : 'View Details'}</span>
                  {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                <a
                  href={`tel:${order.studentPhone}`}
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Student</span>
                </a>

                <button
                  onClick={() => {
                    window.open('https://maps.google.com', '_blank');
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open Campus Maps</span>
                </button>

                <button
                  onClick={() => {
                    setExpanded(true);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span>Delivery Instructions</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowRejectModal(true);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Decline Assignment</span>
                </button>

                <div className="border-t border-gray-100 my-1" />

                <a
                  href="/delivery/support"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Issue</span>
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* DECLINE DELIVERY CONFIRMATION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Decline Delivery Assignment?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This order will be unassigned and returned to the campus delivery pool for other runners to accept.
              </p>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-semibold text-left flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  The student&apos;s order will <strong>remain active</strong> and valid in the kitchen/store queue. It will <strong>NOT</strong> be cancelled or rejected.
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={rejecting}
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={rejecting}
                onClick={handleConfirmReject}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {rejecting ? 'Releasing...' : 'Decline & Release'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
