'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDelivery } from '@/context/DeliveryContext';
import { useAuth } from '@/context/AuthContext';
import OrderCard from '@/components/delivery/OrderCard';
import PayoutAccountModal from '@/components/delivery/PayoutAccountModal';
import WithdrawalModal from '@/components/delivery/WithdrawalModal';
import {
  Package,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  ArrowRight,
  Bike,
  Compass,
  Store,
  ChevronRight,
  Sparkles,
  Briefcase,
  Wallet,
  Landmark,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function DeliveryDashboardPage() {
  const { user } = useAuth();
  const runnerName = user?.deliveryBoy?.fullName || user?.student?.fullName || user?.email?.split('@')[0] || 'Partner';

  const {
    isOnline,
    toggleOnline,
    activeOrders,
    availableOrders,
    acceptAvailableOrder,
    todayStats,
    deliveryHistory,
    payoutAccount,
    withdrawals,
    downloadStatementPdf,
  } = useDelivery();

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const availableBalance = todayStats.walletBalance || 0;
  const totalSettled = todayStats.totalSettled || 0;
  const pendingAmount = todayStats.pendingWithdrawals || 0;

  return (
    <div className="space-y-6">
      {/* ==================================================
          DASHBOARD HEADER
         ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Welcome, {runnerName} 👋
            </h2>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Ready for your next delivery? Verify customer 6-digit OTP upon doorstep arrival.
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

          {activeOrders.length > 0 && (
            <Link
              href="/delivery/active"
              className="px-4 py-2.5 rounded-xl bg-[#4F9D2F] text-white text-xs font-bold hover:bg-[#36751F] transition flex items-center gap-1.5 shadow-sm"
            >
              <span>View All Active ({activeOrders.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* ==================================================
          PROVISIONAL FINANCIAL DASHBOARD: WALLET & SETTLEMENTS
         ================================================== */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/50 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row: Title & Action CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PROVISIONAL DASHBOARD
                </span>
                <span className="text-xs text-blue-200 font-medium">Real-Time Runner Treasury</span>
              </div>
              <h3 className="text-xl font-black tracking-tight mt-1">
                Runner Wallet & Settlement Hub
              </h3>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {payoutAccount?.accountType === 'UPI' ? (
                  <Smartphone className="w-3.5 h-3.5 text-blue-300" />
                ) : (
                  <Landmark className="w-3.5 h-3.5 text-blue-300" />
                )}
                <span>{payoutAccount ? 'Edit Payout Account' : 'Link Bank / UPI'}</span>
              </button>

              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/25"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Withdraw Money</span>
              </button>

              <button
                onClick={downloadStatementPdf}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Download PDF Statement"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Statement</span>
              </button>
            </div>
          </div>

          {/* 3 Core Provisional Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Available to Withdraw */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Available Balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-white mt-2 font-mono">
                ₹{availableBalance.toFixed(2)}
              </div>
              <p className="text-[11px] text-emerald-200/80 mt-1">
                Ready for immediate withdrawal
              </p>
            </div>

            {/* 2. Pending Withdrawals */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Pending Withdrawals
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-amber-200 mt-2 font-mono">
                ₹{pendingAmount.toFixed(2)}
              </div>
              <p className="text-[11px] text-amber-200/70 mt-1">
                Awaiting Admin disbursement
              </p>
            </div>

            {/* 3. Already Settled */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Already Settled
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-blue-200 mt-2 font-mono">
                ₹{totalSettled.toFixed(2)}
              </div>
              <p className="text-[11px] text-blue-200/70 mt-1">
                Transferred to your bank / UPI
              </p>
            </div>
          </div>

          {/* Account & Recent Disbursal Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
            {/* Left: Linked Account Status */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center">
                  {payoutAccount?.accountType === 'UPI' ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Landmark className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Linked Payout Destination</div>
                  <div className="text-sm font-bold text-white">
                    {payoutAccount ? (
                      payoutAccount.accountType === 'UPI' ? (
                        <span>UPI: <span className="font-mono text-emerald-300">{payoutAccount.upiId}</span></span>
                      ) : (
                        <span>{payoutAccount.bankName} ••••{payoutAccount.accountNumber?.slice(-4)}</span>
                      )
                    ) : (
                      <span className="text-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        No account linked yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="text-xs font-bold text-blue-300 hover:text-white underline ml-2"
              >
                {payoutAccount ? 'Manage' : 'Link Now'}
              </button>
            </div>

            {/* Right: Latest Withdrawal Request Status */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Latest Disbursal Status</div>
                {withdrawals && withdrawals.length > 0 ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-white">
                      ₹{Number(withdrawals[0].amount).toFixed(2)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        withdrawals[0].status === 'DISTRIBUTED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : withdrawals[0].status === 'APPROVED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : withdrawals[0].status === 'REJECTED'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {withdrawals[0].status === 'DISTRIBUTED'
                        ? '🟢 Distributed'
                        : withdrawals[0].status === 'APPROVED'
                        ? '🔵 Approved'
                        : withdrawals[0].status === 'REJECTED'
                        ? '🔴 Rejected'
                        : '🟡 Pending'}
                    </span>
                    {withdrawals[0].utrReference && (
                      <span className="text-[10px] text-gray-300 font-mono">
                        UTR: {withdrawals[0].utrReference}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs mt-0.5">No withdrawal requests filed yet</div>
                )}
              </div>
              <Link
                href="/delivery/earnings"
                className="text-xs font-bold text-blue-300 hover:text-white underline"
              >
                View Ledger
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          STATISTICS & EARNINGS OVERVIEW
         ================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Runner Earnings & Compensation
            </h3>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                todayStats.paymentType === 'MONTHLY_CONTRACT'
                  ? 'text-purple-700 bg-purple-50 border border-purple-200'
                  : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              }`}
            >
              {todayStats.paymentType === 'MONTHLY_CONTRACT' ? '💼 Monthly Contract' : '⚡ Per Delivery'}
            </span>
          </div>
          <Link href="/delivery/earnings" className="text-xs font-bold text-[#36751F] hover:underline flex items-center gap-1">
            <span>Detailed Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayStats.paymentType === 'MONTHLY_CONTRACT' ? (
          /* Monthly Contract View */
          <div className="stats-grid">
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
                <p className="text-xs text-purple-600 mt-1 font-semibold">Fixed Campus Salary</p>
              </div>
            </div>

            {/* Monthly Contract */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Monthly Contract</span>
                <div className="w-9 h-9 rounded-xl bg-green-50 text-[#36751F] flex items-center justify-center">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  ₹{(todayStats.monthlySalary || 15000).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-emerald-700 mt-1 font-semibold">Fixed Contract Salary</p>
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
                  {todayStats.completedToday}
                </div>
                <p className="text-xs text-gray-500 mt-1 font-semibold">Delivered on Time</p>
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
                <p className="text-xs text-gray-400 mt-1 font-semibold">Included in monthly salary</p>
              </div>
            </div>
          </div>
        ) : (
          /* Per Delivery View */
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
                <p className="text-xs text-emerald-700 mt-1 font-semibold">
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
                  {todayStats.completedToday}
                </div>
                <p className="text-xs text-gray-500 mt-1 font-semibold">Delivered on Time</p>
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
                  ₹{todayStats.perDeliveryRate || 10}
                </div>
                <p className="text-xs text-amber-700 mt-1 font-semibold">Per completed order</p>
              </div>
            </div>

            {/* Total Earnings */}
            <div className="stat-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Total Earnings</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  ₹{(todayStats.totalEarnings !== undefined ? todayStats.totalEarnings : todayStats.walletBalance || 1250).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-blue-600 mt-1 font-semibold">Available in wallet</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          ACTIVE DELIVERIES: ONE-TAP STATUS UPDATE CARDS
         ================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Active Deliveries ({activeOrders.length})
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              One-Tap Direct Actions
            </span>
          </div>

          <Link
            href="/delivery/active"
            className="text-xs font-bold text-[#36751F] hover:underline flex items-center gap-1"
          >
            <span>Manage All Slots</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
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
      </div>

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
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Value</div>
                      <div className="text-sm font-black text-emerald-700 font-mono">₹{order.productPrice || order.totalAmount || order.earning}</div>
                    </div>
                    <button
                      onClick={() => acceptAvailableOrder(order.id)}
                      disabled={activeOrders.length >= 5}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeOrders.length >= 5
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#4F9D2F] text-white hover:bg-[#36751F]'
                      }`}
                      title={activeOrders.length >= 5 ? 'Max active capacity reached' : 'Accept Request'}
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
    </div>
  );
}
