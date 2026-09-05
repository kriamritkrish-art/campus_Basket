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
} from 'lucide-react';

interface OrderCardProps {
  order: ActiveDeliveryOrder;
}

export default function OrderCard({ order }: OrderCardProps) {
  const { advanceOrderStatus, setOtpModalOrder } = useDelivery();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Status Badge Configuration
  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            ASSIGNED
          </span>
        );
      case 'PICKUP_READY':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            🟡 PICKUP READY
          </span>
        );
      case 'PICKED_UP':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            🟣 PICKED UP
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            🟣 IN TRANSIT
          </span>
        );
      case 'AT_HOSTEL':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            🟢 AT HOSTEL
          </span>
        );
      case 'OTP_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            OTP VERIFIED
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
            ✓ DELIVERED
          </span>
        );
      default:
        return null;
    }
  };

  // Status Action Mapping (Section 2)
  const getNextActionConfig = () => {
    switch (order.status) {
      case 'ASSIGNED':
        return {
          label: 'ACCEPT ORDER',
          action: () => advanceOrderStatus(order.id),
          bg: 'bg-[#4F9D2F] hover:bg-[#36751F]',
        };
      case 'PICKUP_READY':
        return {
          label: 'CONFIRM PICKUP',
          action: () => advanceOrderStatus(order.id),
          bg: order.priority === 'HIGH' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#4F9D2F] hover:bg-[#36751F]',
        };
      case 'PICKED_UP':
        return {
          label: 'START DELIVERY',
          action: () => advanceOrderStatus(order.id),
          bg: 'bg-[#4F9D2F] hover:bg-[#36751F]',
        };
      case 'IN_TRANSIT':
        return {
          label: 'REACHED HOSTEL',
          action: () => advanceOrderStatus(order.id),
          bg: 'bg-[#4F9D2F] hover:bg-[#36751F]',
        };
      case 'AT_HOSTEL':
        return {
          label: 'VERIFY OTP',
          action: () => setOtpModalOrder(order),
          bg: 'bg-purple-700 hover:bg-purple-800',
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
          bg: 'bg-[#4F9D2F]',
        };
    }
  };

  const actionConfig = getNextActionConfig();

  return (
    <div className="order-card relative">
      {/* CARD TOP ROW: Status Badge | Order ID | ₹Earning */}
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
          <span className="text-lg font-black text-emerald-700">₹{order.earning}</span>
        </div>
      </div>

      {/* CORE INFO: Student Name • Destination • Route line */}
      <div className="pt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="font-extrabold text-gray-900 text-sm">
            {order.studentName}
          </div>
          <div className="text-xs text-gray-500 font-bold">
            {order.dueInText || `ETA ${order.eta}`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>{order.destination}</span>
        </div>

        {/* Compact Route Line (Section 13) */}
        <div className="text-[11px] text-gray-500 bg-gray-50/80 p-2 rounded-lg border border-gray-100 flex items-center justify-between gap-2">
          <div className="truncate font-medium">
            <span className="text-gray-700 font-semibold">{order.pickupLocation}</span>
            <span className="text-gray-400 mx-1">↓</span>
            <span className="text-gray-900 font-bold">{order.destination}</span>
          </div>
          <span className="font-mono text-gray-500 flex-shrink-0 font-semibold">
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
    </div>
  );
}
