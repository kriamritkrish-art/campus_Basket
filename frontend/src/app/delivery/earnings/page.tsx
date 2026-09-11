'use client';

import React, { useState, useEffect } from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import { apiRequest } from '@/lib/api';
import PayoutAccountModal from '@/components/delivery/PayoutAccountModal';
import WithdrawalModal from '@/components/delivery/WithdrawalModal';
import OrderFinancialDetailsModal from '@/components/common/OrderFinancialDetailsModal';
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
  ShieldCheck,
  FileText,
  Landmark,
  Smartphone,
  Download,
  ArrowDownLeft,
  ExternalLink
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
  otpVerified?: boolean;
  codCollected?: number;
}

export default function DeliveryEarningsPage() {
  const {
    todayStats,
    deliveryHistory,
    payoutAccount,
    withdrawals,
    fetchWithdrawals,
    downloadStatementPdf,
  } = useDelivery();

  const [earningsList, setEarningsList] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendStats, setBackendStats] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);
  const [selectedDrilldownOrderId, setSelectedDrilldownOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'EARNINGS' | 'WITHDRAWALS'>('EARNINGS');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const paymentType = backendStats?.paymentType || todayStats.paymentType || 'PER_DELIVERY';
  const isMonthly = paymentType === 'MONTHLY_CONTRACT';

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      const [res, dailyRes] = await Promise.all([
        apiRequest('/api/delivery/earnings').catch(() => null),
        apiRequest('/api/delivery/earnings/daily').catch(() => null),
      ]);
      if (res?.success) {
        setBackendStats(res);
        if (Array.isArray(res.earnings)) {
          setEarningsList(res.earnings);
        }
      }
      if (dailyRes?.success) {
        setDailyData(dailyRes);
      }
      await fetchWithdrawals();
    } catch {
      // Non-blocking fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const perDeliveryRate = backendStats?.perDeliveryRate ?? todayStats.perDeliveryRate ?? 0;
  const monthlySalary = backendStats?.monthlySalary ?? todayStats.monthlySalary ?? 0;
  const availableBalance = todayStats.walletBalance || 0;
  const totalSettled = todayStats.totalSettled || 0;
  const pendingAmount = todayStats.pendingWithdrawals || 0;
  const completedCount = backendStats?.completedDeliveries !== undefined ? backendStats.completedDeliveries : (todayStats.completedToday || deliveryHistory.length);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMonthly ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-700'}`}>
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
                  : 'Real-time financial treasury. Submit withdrawal requests and download PDF statements.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchEarningsData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={downloadStatementPdf}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Download PDF Statement</span>
          </button>

          {!isMonthly && (
            <>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                {payoutAccount?.accountType === 'UPI' ? (
                  <Smartphone className="w-4 h-4 text-blue-600" />
                ) : (
                  <Landmark className="w-4 h-4 text-blue-600" />
                )}
                <span>{payoutAccount ? 'Manage Account' : 'Link Account'}</span>
              </button>

              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="btn-primary text-xs px-4 py-2 shadow-sm flex items-center gap-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>Withdraw Money</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Linked Account Destination Banner */}
      {!isMonthly && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              {payoutAccount?.accountType === 'UPI' ? <Smartphone className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Active Disbursement Destination
              </div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">
                {payoutAccount ? (
                  payoutAccount.accountType === 'UPI' ? (
                    <span>UPI ID: <span className="font-mono text-blue-900">{payoutAccount.upiId}</span></span>
                  ) : (
                    <span>{payoutAccount.bankName} ••••{payoutAccount.accountNumber?.slice(-4)} (IFSC: {payoutAccount.ifscCode})</span>
                  )
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    No Bank or UPI account linked yet. Please link your account to withdraw earnings.
                  </span>
                )}
              </div>
              {payoutAccount && (
                <div className="text-gray-500 text-[11px]">
                  Registered to: <span className="font-semibold text-gray-700">{payoutAccount.accountHolderName}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowPayoutModal(true)}
            className="px-3.5 py-1.5 rounded-xl border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs whitespace-nowrap self-start sm:self-center"
          >
            {payoutAccount ? 'Update Bank / UPI' : 'Link Account Now'}
          </button>
        </div>
      )}

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

      {/* Financial Overview Cards */}
      <div className="stats-grid">
        {isMonthly ? (
          /* Monthly Contract 4 Cards */
          <>
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

            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Monthly Contract Salary</span>
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
          /* Per Delivery 4 Cards with Available, Pending, Settled */
          <>
            {/* 1. Today's Earnings */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Today's Earnings</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  ₹{todayStats.earningsToday}
                </div>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  {todayStats.completedToday} orders delivered today
                </p>
              </div>
            </div>

            {/* 2. Available Balance */}
            <div className="stat-card flex flex-col justify-between bg-emerald-50/40 border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Available Balance</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-800 tracking-tight font-mono">
                  ₹{availableBalance.toFixed(2)}
                </div>
                <p className="text-xs text-emerald-700 font-bold mt-1">Ready for withdrawal</p>
              </div>
            </div>

            {/* 3. Pending Withdrawals */}
            <div className="stat-card flex flex-col justify-between bg-amber-50/40 border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Pending Withdrawals</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-amber-800 tracking-tight font-mono">
                  ₹{pendingAmount.toFixed(2)}
                </div>
                <p className="text-xs text-amber-700 font-bold mt-1">Awaiting admin disbursal</p>
              </div>
            </div>

            {/* 4. Already Settled */}
            <div className="stat-card flex flex-col justify-between bg-blue-50/40 border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Already Settled</span>
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-blue-900 tracking-tight font-mono">
                  ₹{totalSettled.toFixed(2)}
                </div>
                <p className="text-xs text-blue-700 font-bold mt-1">Transferred to Bank / UPI</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Daily Performance & COD Handover Banner */}
      {dailyData?.today && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Today's Fulfillment Summary</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-300">
                  {dailyData.today.date}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-gray-700 flex-wrap">
                <div>Delivered: <strong className="text-emerald-900 font-bold">{dailyData.today.ordersDelivered}</strong></div>
                <div>COD Handover Due: <strong className="text-amber-900 font-bold">₹{Number(dailyData.today.codCollected || 0).toFixed(2)}</strong></div>
                {!isMonthly && (
                  <>
                    <div>Earned: <strong className="text-emerald-900 font-bold">₹{Number(dailyData.today.eligibleEarnings || 0).toFixed(2)}</strong></div>
                    <div>Settled: <strong className="text-blue-900 font-bold">₹{Number(dailyData.today.settledAmount || 0).toFixed(2)}</strong></div>
                    <div>Pending: <strong className="text-amber-900 font-bold">₹{Number(dailyData.today.pendingEarnings || 0).toFixed(2)}</strong></div>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                <span>6-Digit Customer OTP Enforced</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Table Section */}
      <div className="card p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('EARNINGS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'EARNINGS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Order Delivery Credits
            </button>

            {!isMonthly && (
              <button
                onClick={() => setActiveTab('WITHDRAWALS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'WITHDRAWALS'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>Withdrawal Requests</span>
                {withdrawals && withdrawals.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {withdrawals.length}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing records from active session
          </div>
        </div>

        {/* Tab 1: Order Delivery Credits */}
        {activeTab === 'EARNINGS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-black uppercase text-gray-400">
                  <th className="py-3 px-3">Order</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Delivery Status</th>
                  <th className="py-3 px-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isMonthly ? (
                  deliveryHistory.length > 0 ? (
                    deliveryHistory.map((h, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                          <button
                            onClick={() => setSelectedDrilldownOrderId((h as any).orderId || (h as any).id || h.orderNumber)}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>{h.orderNumber}</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-gray-500">
                          {h.date.split(',')[0]}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Delivered (OTP Verified)</span>
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
                ) : earningsList.length > 0 ? (
                  earningsList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                        <button
                          onClick={() => setSelectedDrilldownOrderId(row.orderId || null)}
                          className="hover:text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>{row.orderNumber}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-gray-500">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Delivered (OTP Verified)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-emerald-700 text-sm font-mono">
                        +{row.amount >= 0 ? `₹${row.amount}` : `-₹${Math.abs(row.amount)}`}
                      </td>
                    </tr>
                  ))
                ) : deliveryHistory.length > 0 ? (
                  deliveryHistory.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                        <button
                          onClick={() => setSelectedDrilldownOrderId((h as any).orderId || (h as any).id || h.orderNumber)}
                          className="hover:text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>{h.orderNumber}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </button>
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
                      <td className="py-3.5 px-3 text-right font-black text-emerald-700 text-sm font-mono">
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
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Withdrawal Requests & Disbursal Tracker */}
        {activeTab === 'WITHDRAWALS' && !isMonthly && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-black uppercase text-gray-400">
                  <th className="py-3 px-3">Withdrawal ID</th>
                  <th className="py-3 px-3">Requested At</th>
                  <th className="py-3 px-3">Destination</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Bank Reference / UTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdrawals && withdrawals.length > 0 ? (
                  withdrawals.map((w) => {
                    let dest = 'UPI / Bank';
                    try {
                      if (w.accountDetails) {
                        const parsed = JSON.parse(w.accountDetails);
                        dest = parsed.accountType === 'UPI' ? `UPI: ${parsed.upiId}` : `${parsed.bankName || 'Bank'} (${parsed.accountNumber || ''})`;
                      }
                    } catch {}

                    return (
                      <tr key={w.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                          {w.withdrawalNumber}
                        </td>
                        <td className="py-3.5 px-3 text-gray-500">
                          {new Date(w.requestedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-3 text-gray-700 font-medium">
                          {dest}
                        </td>
                        <td className="py-3.5 px-3 font-black text-gray-900 text-sm font-mono">
                          ₹{Number(w.amount).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              w.status === 'DISTRIBUTED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : w.status === 'APPROVED'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : w.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {w.status === 'DISTRIBUTED' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Distributed</span>
                              </>
                            ) : w.status === 'APPROVED' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                <span>Approved</span>
                              </>
                            ) : w.status === 'REJECTED' ? (
                              <>
                                <AlertCircle className="w-3 h-3 text-red-600" />
                                <span>Rejected</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                <span>Pending Admin</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-gray-600">
                          {w.utrReference ? (
                            <span className="font-bold text-gray-800">{w.utrReference}</span>
                          ) : (
                            <span className="text-gray-400 italic">Pending Transfer</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No withdrawal requests submitted yet. Click &quot;Withdraw Money&quot; above to cash out earnings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Account Modal */}
      <PayoutAccountModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
      />

      {/* Withdrawal Request Modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onOpenPayoutAccountModal={() => setShowPayoutModal(true)}
      />

      {/* Single Order Financial Details Modal */}
      <OrderFinancialDetailsModal
        orderId={selectedDrilldownOrderId}
        isOpen={Boolean(selectedDrilldownOrderId)}
        onClose={() => setSelectedDrilldownOrderId(null)}
      />
    </div>
  );
}
