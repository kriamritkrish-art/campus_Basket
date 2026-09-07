'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, PackageX, Clock, CreditCard, Shirt, RotateCcw, HelpCircle } from 'lucide-react';

interface AttentionAlertsProps {
  alerts?: {
    lowStockProducts?: number;
    pendingOrders?: number;
    paymentIssues?: number;
    unassignedLaundry?: number;
    pendingRefunds?: number;
    openSupportTickets?: number;
  };
}

export function AttentionAlerts({ alerts }: AttentionAlertsProps) {
  if (!alerts) return null;

  const items = [
    {
      id: 'low_stock',
      label: 'Low Stock Products',
      count: alerts.lowStockProducts || 0,
      icon: PackageX,
      href: '/admin/inventory?status=low_stock',
      chipStyle: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
    },
    {
      id: 'pending_orders',
      label: 'Pending Orders',
      count: alerts.pendingOrders || 0,
      icon: Clock,
      href: '/admin/orders?status=CONFIRMED',
      chipStyle: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
    },
    {
      id: 'payment_issues',
      label: 'Payment Pending',
      count: alerts.paymentIssues || 0,
      icon: CreditCard,
      href: '/admin/payments',
      chipStyle: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    },
    {
      id: 'laundry_orders',
      label: 'Active Laundry',
      count: alerts.unassignedLaundry || 0,
      icon: Shirt,
      href: '/admin/services/laundry',
      chipStyle: 'bg-[#4F9D32]/10 text-[#347A27] border-[#4F9D32]/30 hover:bg-[#4F9D32]/20'
    },
    {
      id: 'refunds',
      label: 'Pending Refunds',
      count: alerts.pendingRefunds || 0,
      icon: RotateCcw,
      href: '/admin/orders?status=REFUND_REQUESTED',
      chipStyle: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
    },
    {
      id: 'tickets',
      label: 'Open Tickets',
      count: alerts.openSupportTickets || 0,
      icon: HelpCircle,
      href: '/admin/system/tickets',
      chipStyle: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
    }
  ];

  const activeAlerts = items.filter((item) => item.count > 0);

  if (activeAlerts.length === 0) return null;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#17202A]">
          Attention Required ({activeAlerts.length})
        </h3>
        <span className="text-[11px] text-slate-500 font-medium ml-auto sm:ml-2">Click chip to inspect module</span>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        {activeAlerts.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.id}
              href={a.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 shadow-xs ${a.chipStyle}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{a.label}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white text-slate-900 border border-slate-200 font-mono text-[11px] font-bold shadow-xs">
                {a.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
