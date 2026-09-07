'use client';

import React, { useState } from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Wallet,
  ArrowUpRight,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export default function DeliveryEarningsPage() {
  const { todayStats, deliveryHistory } = useDelivery();
  const [payoutPeriod, setPayoutPeriod] = useState<'WEEK' | 'MONTH'>('WEEK');

  // Weekly earnings day-by-day data
  const weeklyData = [
    { day: 'Mon', date: '31 Aug', earnings: 0, deliveries: 0 },
    { day: 'Tue', date: '1 Sep', earnings: 0, deliveries: 0 },
    { day: 'Wed', date: '2 Sep', earnings: 0, deliveries: 0 },
    { day: 'Thu', date: '3 Sep', earnings: 0, deliveries: 0 },
    { day: 'Fri', date: '4 Sep', earnings: 0, deliveries: 0 },
    { day: 'Today', date: 'Active', earnings: todayStats.earningsToday, deliveries: todayStats.completedToday },
    { day: 'Sun', date: 'Target', earnings: todayStats.weekEarnings, deliveries: todayStats.completedToday },
  ];

  const maxEarning = Math.max(100, ...weeklyData.map((d) => d.earnings));

  const payoutHistory = deliveryHistory.map((h) => ({
    orderId: h.orderNumber,
    date: h.date,
    deliveryFee: h.earning,
    bonus: 0,
    total: h.earning,
    status: 'Credited to Wallet',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-[#36751F]" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Runner Earnings & Payouts
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Track daily dispatches, incentives, surge bonuses, and direct UPI settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Initiating instant transfer to UPI ID: sourav.runner@okhdfcbank')}
            className="btn-primary text-xs px-4 shadow-sm"
          >
            <Wallet className="w-4 h-4" />
            <span>Withdraw to UPI</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards (Section 16) */}
      <div className="stats-grid">
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
            <p className="text-xs text-emerald-700 font-bold mt-1">
              {todayStats.completedToday} orders completed today
            </p>
          </div>
        </div>

        {/* This Week */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">This Week</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              ₹{todayStats.weekEarnings.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-blue-600 font-bold mt-1">
              +14% vs last week
            </p>
          </div>
        </div>

        {/* This Month */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">This Month</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              ₹{todayStats.monthEarnings.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-purple-600 font-bold mt-1">
              Target: ₹15,000 / month
            </p>
          </div>
        </div>

        {/* Average / Delivery */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Average / Delivery</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              ₹{todayStats.avgPerDelivery}
            </div>
            <p className="text-xs text-amber-700 font-bold mt-1">
              Incl. campus rush bonuses
            </p>
          </div>
        </div>
      </div>

      {/* Professional Clean Chart (Section 16: Earnings Overview) */}
      <div className="card p-6 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-black text-gray-900">
              Earnings Overview
            </h3>
            <p className="text-xs text-gray-500">
              Daily revenue breakdown for current week (NIT Durgapur Campus Shift)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400">Total: ₹2,850</span>
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setPayoutPeriod('WEEK')}
                className={`px-3 py-1 rounded-lg transition ${
                  payoutPeriod === 'WEEK' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPayoutPeriod('MONTH')}
                className={`px-3 py-1 rounded-lg transition ${
                  payoutPeriod === 'MONTH' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="pt-4">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-gray-200 pb-2">
            {weeklyData.map((item, idx) => {
              const heightPercent = Math.round((item.earnings / maxEarning) * 100);
              const isToday = item.day === 'Sat';

              return (
                <div key={idx} className="flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-black text-gray-600 opacity-0 group-hover:opacity-100 transition">
                    ₹{item.earnings}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 ${
                      isToday
                        ? 'bg-[#4F9D2F] shadow-md ring-2 ring-emerald-300'
                        : 'bg-emerald-100 hover:bg-emerald-300'
                    }`}
                  />
                  <div className="text-center pt-1">
                    <div className={`text-xs ${isToday ? 'font-black text-[#36751F]' : 'font-bold text-gray-600'}`}>
                      {item.day}
                    </div>
                    <div className="text-[10px] text-gray-400">{item.deliveries} ord</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payout History Table (Section 16) */}
      <div className="card p-6 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-black text-gray-900">
              Payout History & Credits
            </h3>
            <p className="text-xs text-gray-500">
              Individual order receipts, base delivery fee, and unlocked bonuses
            </p>
          </div>

          <div className="text-xs font-bold text-gray-500">
            UPI: <span className="font-mono text-gray-800">sourav.runner@okhdfcbank</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-black uppercase text-gray-400">
                <th className="py-3 px-3">Order / Batch</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Delivery Fee</th>
                <th className="py-3 px-3">Bonus</th>
                <th className="py-3 px-3">Total Credit</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payoutHistory.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3 font-mono font-bold text-gray-900">
                    {row.orderId}
                  </td>
                  <td className="py-3 px-3 text-gray-500">
                    {row.date}
                  </td>
                  <td className="py-3 px-3 font-semibold text-gray-700">
                    ₹{row.deliveryFee}
                  </td>
                  <td className="py-3 px-3 font-semibold text-emerald-700">
                    {row.bonus > 0 ? `+₹${row.bonus}` : '—'}
                  </td>
                  <td className="py-3 px-3 font-black text-gray-900">
                    ₹{row.total}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{row.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
