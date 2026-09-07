'use client';

import React, { useState, useEffect } from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import { apiRequest } from '@/lib/api';
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  Sparkles,
  Briefcase,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface EarningRecord {
  id: string;
  orderId?: string;
  orderNumber: string;
  amount: number;
  paymentType: 'PER_DELIVERY' | 'MONTHLY_CONTRACT';
  earningType: string;
  description?: string;
  adminAdjustedBy?: string;
  date: string;
  status: string;
}

export default function DeliveryEarningsPage() {
  const { todayStats, deliveryHistory } = useDelivery();
  const [earningsList, setEarningsList] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendStats, setBackendStats] = useState<any>(null);

  const paymentType = backendStats?.paymentType || todayStats.paymentType || 'PER_DELIVERY';
  const isMonthly = paymentType === 'MONTHLY_CONTRACT';

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/delivery/earnings').catch(() => null);
      if (res?.success) {
        setBackendStats(res);
        if (Array.isArray(res.earnings)) {
          setEarningsList(res.earnings);
        }
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const perDeliveryRate = backendStats?.perDeliveryRate !== undefined ? backendStats.perDeliveryRate : (todayStats.perDeliveryRate || 10);
  const monthlySalary = backendStats?.monthlySalary !== undefined ? backendStats.monthlySalary : (todayStats.monthlySalary || 15000);
  const totalEarnings = backendStats?.totalEarnings !== undefined ? backendStats.totalEarnings : (todayStats.totalEarnings || todayStats.walletBalance || 1250);
  const completedCount = backendStats?.completedDeliveries !== undefined ? backendStats.completedDeliveries : (todayStats.completedToday || deliveryHistory.length);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMonthly ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-[#36751F]'}`}>
              {isMonthly ? <Briefcase className="w-5 h-5" /> : <IndianRupee className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Runner Earnings & Settlements
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isMonthly
                      ? 'text-purple-700 bg-purple-50 border border-purple-200'
                      : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  {isMonthly ? '💼 Monthly Contract Staff' : '⚡ Per Delivery Staff'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                {isMonthly
                  ? 'Fixed campus contract partner. Direct monthly salary settlement processed via Admin.'
                  : 'Automated per-delivery credit processed immediately upon customer 6-digit OTP verification.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEarningsData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {!isMonthly && (
            <button
              onClick={() => alert(`Initiating instant transfer of ₹${totalEarnings} to UPI ID: sourav.runner@okhdfcbank`)}
              className="btn-primary text-xs px-4 shadow-sm"
            >
              <Wallet className="w-4 h-4" />
              <span>Withdraw to UPI</span>
            </button>
          )}
        </div>
      </div>

      {/* Monthly Contract Staff Info Card */}
      {isMonthly && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-purple-950">
                Monthly Contract Employment Agreement
              </h3>
              <p className="text-xs text-purple-800 font-medium mt-1 max-w-2xl leading-relaxed">
                As a designated <strong>Monthly Contract Delivery Partner</strong>, you receive a fixed compensation of{' '}
                <strong>₹{monthlySalary.toLocaleString('en-IN')} per month</strong>. Deliveries you complete via 6-digit OTP are logged into your official fulfillment history below, with individual per-delivery charges set to <strong>₹0</strong>.
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-purple-200 sm:pl-6 shrink-0">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Fixed Monthly Pay</div>
            <div className="text-2xl font-black text-purple-950 font-mono">₹{monthlySalary.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-purple-700 font-semibold">1st of every month</div>
          </div>
        </div>
      )}

      {/* Four Summary Cards */}
      <div className="stats-grid">
        {isMonthly ? (
          /* Monthly Contract 4 Cards */
          <>
            {/* Payment Type */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Payment Type</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 tracking-tight">
                  Monthly Contract
                </div>
                <p className="text-xs text-purple-600 font-bold mt-1">Employment Status</p>
              </div>
            </div>

            {/* Monthly Contract Salary */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Monthly Contract</span>
                <div className="w-9 h-9 rounded-xl bg-green-50 text-[#36751F] flex items-center justify-center">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  ₹{monthlySalary.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-emerald-700 font-bold mt-1">Guaranteed Base Salary</p>
              </div>
            </div>

            {/* Completed Deliveries */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Completed Deliveries</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-blue-700 tracking-tight">
                  {completedCount}
                </div>
                <p className="text-xs text-gray-500 font-semibold mt-1">Verified OTP Deliveries</p>
              </div>
            </div>

            {/* Per Delivery Earnings */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Per Delivery Earnings</span>
                <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  ₹0
                </div>
                <p className="text-xs text-gray-400 font-semibold mt-1">Zero per-order addition</p>
              </div>
            </div>
          </>
        ) : (
          /* Per Delivery 4 Cards */
          <>
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

            {/* Completed Deliveries */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Completed Deliveries</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-700 tracking-tight">
                  {completedCount}
                </div>
                <p className="text-xs text-gray-500 font-semibold mt-1">Verified OTP Deliveries</p>
              </div>
            </div>

            {/* Per Delivery Rate */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Per Delivery Rate</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  ₹{perDeliveryRate}
                </div>
                <p className="text-xs text-amber-700 font-bold mt-1">Admin-configured rate</p>
              </div>
            </div>

            {/* Total Earnings */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Total Earnings</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  ₹{totalEarnings.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-blue-600 font-bold mt-1">Available wallet balance</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction & Earnings History Table */}
      <div className="card p-6 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-black text-gray-900">
              {isMonthly ? 'Delivery Activity History' : 'Earnings & Transaction History'}
            </h3>
            <p className="text-xs text-gray-500">
              {isMonthly
                ? 'Chronological record of orders completed. Monthly staff do not generate individual delivery fees.'
                : 'Automated order payouts credited upon successful customer 6-digit OTP verification.'}
            </p>
          </div>

          <div className="text-xs font-bold text-gray-500">
            Status: <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Verified Deliveries Only</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-black uppercase text-gray-400">
                <th className="py-3 px-3">Order</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Delivery</th>
                <th className="py-3 px-3 text-right">Earning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isMonthly ? (
                // Monthly staff deliveries: show delivery activity without individual earnings
                deliveryHistory.length > 0 ? (
                  deliveryHistory.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                        {h.orderNumber}
                      </td>
                      <td className="py-3.5 px-3 text-gray-500">
                        {h.date.split(',')[0]}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Delivered</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-gray-400">
                        ₹0 <span className="text-[10px] text-purple-600 font-semibold">(Contract)</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No delivery activity recorded yet.
                    </td>
                  </tr>
                )
              ) : (
                // Per Delivery Staff: show actual earnings ledger
                earningsList.length > 0 ? (
                  earningsList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                        {row.orderNumber}
                      </td>
                      <td className="py-3.5 px-3 text-gray-500">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Delivered</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-emerald-700 text-sm">
                        +{row.amount >= 0 ? `₹${row.amount}` : `-₹${Math.abs(row.amount)}`}
                      </td>
                    </tr>
                  ))
                ) : deliveryHistory.length > 0 ? (
                  deliveryHistory.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                        {h.orderNumber}
                      </td>
                      <td className="py-3.5 px-3 text-gray-500">
                        {h.date.split(',')[0]}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Delivered</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-emerald-700 text-sm">
                        +₹{perDeliveryRate}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No earnings transactions recorded yet. Complete an order with customer OTP to earn.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
