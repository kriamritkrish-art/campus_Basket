'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../../../lib/api';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  GraduationCap,
  ShoppingBag,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Wallet,
  CreditCard,
  Receipt,
  FileText,
  AlertTriangle,
  RefreshCw,
  Store,
  Layers
} from 'lucide-react';

interface StudentDetailsPageProps {
  params: Promise<{ studentId: string }>;
}

export default function StudentDetailsPage({ params }: StudentDetailsPageProps) {
  const { studentId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORDERS' | 'WALLET' | 'REFUNDS'>('OVERVIEW');

  const fetchStudentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/api/admin/students/${studentId}`);
      if (res.success && res.student) {
        setData(res.student);
      } else {
        throw new Error(res.message || 'Student record not found');
      }
    } catch (err: any) {
      console.warn('Error fetching student details:', err);
      setError(err.message || 'Unable to retrieve student profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3 animate-fade-in">
        <div className="w-10 h-10 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading student profile &amp; financial history...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Student Profile Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested student record could not be found.'}</p>
        <div className="pt-2">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Students</span>
          </Link>
        </div>
      </div>
    );
  }

  const { profile, orderSummary, orderHistory, wallet, refunds } = data;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/students"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition shadow-2xs"
            title="Back to Students Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#17202A]">{profile.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  profile.accountStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {profile.accountStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID: {profile.studentId} &bull; User ID: {profile.userId?.slice(-8) || 'N/A'}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchStudentDetails()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#4F9D32]" />
          <span>Refresh Profile</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-[#4F9D32] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profile &amp; Overview
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ORDERS'
              ? 'bg-[#4F9D32] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Order History</span>
          <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded-full font-mono">
            {orderHistory.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('WALLET')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'WALLET'
              ? 'bg-[#4F9D32] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Wallet Ledger</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-mono font-bold">
            ₹{wallet.balance}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('REFUNDS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'REFUNDS'
              ? 'bg-[#4F9D32] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Refunds</span>
          <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded-full font-mono">
            {refunds.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PROFILE & OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Profile Card & Order Summary KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <User className="w-4 h-4 text-[#4F9D32]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#17202A]">Student Profile</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                  <span className="font-bold text-slate-900">{profile.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="font-mono text-slate-800">{profile.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                  <span className="font-mono text-slate-800">{profile.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Student ID / Roll No</span>
                  <span className="font-mono font-bold text-slate-900">{profile.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Date</span>
                  <span className="text-slate-700">
                    {profile.registrationDate
                      ? new Date(profile.registrationDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Status</span>
                  <span className="font-bold text-slate-900">{profile.accountStatus}</span>
                </div>
                {profile.hallName && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Hostel &amp; Room</span>
                    <span className="text-slate-700">
                      {profile.hallName}, Room {profile.roomNumber || '—'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary 5 KPI Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#4F9D32]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#17202A]">Order Summary</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {/* Total Orders */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Orders</div>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-1">{orderSummary.total}</div>
                  <div className="text-[10px] text-slate-500 mt-1">₹{orderSummary.totalSpent} spent</div>
                </div>

                {/* Completed */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Completed</div>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{orderSummary.completed}</div>
                  <div className="text-[10px] text-emerald-600 mt-1">Delivered orders</div>
                </div>

                {/* Pending */}
                <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/30 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-amber-700">Pending</div>
                  <div className="text-2xl font-black text-amber-700 font-mono mt-1">{orderSummary.pending}</div>
                  <div className="text-[10px] text-amber-600 mt-1">Active / in transit</div>
                </div>

                {/* Cancelled */}
                <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/30 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Cancelled</div>
                  <div className="text-2xl font-black text-rose-700 font-mono mt-1">{orderSummary.cancelled}</div>
                  <div className="text-[10px] text-rose-600 mt-1">Cancelled by user/system</div>
                </div>

                {/* Returned */}
                <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/30 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-purple-700">Returned</div>
                  <div className="text-2xl font-black text-purple-700 font-mono mt-1">{orderSummary.returned}</div>
                  <div className="text-[10px] text-purple-600 mt-1">Returned products</div>
                </div>

                {/* Wallet Balance Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Wallet Balance</div>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">₹{wallet.balance}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Available credits</div>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Recent Orders</span>
                  <button
                    onClick={() => setActiveTab('ORDERS')}
                    className="text-xs font-bold text-[#4F9D32] hover:underline cursor-pointer"
                  >
                    View All ({orderHistory.length}) &rarr;
                  </button>
                </div>
                {orderHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No orders recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orderHistory.slice(0, 3).map((o: any) => (
                      <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>
                          <span className="text-slate-400 text-[11px] ml-2 font-mono">
                            {new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {o.products?.map((p: any) => `${p.name} (x${p.quantity})`).join(', ') || 'Marketplace Item'}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-slate-900">₹{o.amount}</div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">{o.deliveryStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDER HISTORY */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#4F9D32]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#17202A]">Complete Order History</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{orderHistory.length} Total Orders</span>
          </div>

          {orderHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No orders recorded for this student.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Products</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Delivery Status</th>
                    <th className="py-3 px-4">Return Status</th>
                    <th className="py-3 px-4">Cancellation Status</th>
                    <th className="py-3 px-4">Refund Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {orderHistory.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">{o.orderNumber}</td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-sans text-[11px]">
                        {new Date(o.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-4 font-sans text-slate-800">
                        <div className="max-w-[200px] truncate" title={o.products?.map((p: any) => `${p.name} (x${p.quantity})`).join(', ')}>
                          {o.products?.map((p: any) => `${p.name} (x${p.quantity})`).join(', ') || 'Products'}
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="py-3.5 px-4 font-sans text-slate-700">
                        <div className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{o.provider || 'Provider unavailable'}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">₹{o.amount}</td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 font-sans text-[11px] text-slate-600">{o.paymentMethod}</td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-sans ${
                            o.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : o.paymentStatus === 'REFUNDED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3.5 px-4">
                        <span className="font-sans font-semibold text-slate-800 text-[11px]">{o.deliveryStatus}</span>
                      </td>

                      {/* Return Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-sans ${
                            o.returnStatus !== 'NO_RETURN' && o.returnStatus !== 'NONE'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {o.returnStatus || 'None'}
                        </span>
                      </td>

                      {/* Cancellation Status */}
                      <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px]">
                        {o.cancellationStatus || 'None'}
                      </td>

                      {/* Refund Status */}
                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            o.refundStatus === 'REFUNDED' || o.refundStatus === 'PROCESSED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : o.refundStatus === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {o.refundStatus || 'None'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WALLET LEDGER */}
      {activeTab === 'WALLET' && (
        <div className="space-y-6">
          {/* Wallet Summary KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Wallet Balance</span>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">₹{wallet.balance}</div>
              <span className="text-[10px] text-slate-500">Live DB ledger balance</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Wallet Credits</span>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">₹{wallet.totalCredits}</div>
              <span className="text-[10px] text-slate-500">Lifetime credited</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Wallet Debits</span>
              <div className="text-2xl font-black text-rose-700 font-mono mt-1">₹{wallet.totalDebits}</div>
              <span className="text-[10px] text-slate-500">Lifetime spent / debited</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Refund Credits</span>
              <div className="text-2xl font-black text-purple-700 font-mono mt-1">₹{wallet.refundCredits}</div>
              <span className="text-[10px] text-slate-500">Credited from refunds</span>
            </div>
          </div>

          {/* Wallet Transaction Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#4F9D32]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#17202A]">Wallet Transaction History</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">{wallet.transactions.length} Transactions</span>
            </div>

            {wallet.transactions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">No wallet transactions recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Credit / Debit</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Reason / Description</th>
                      <th className="py-3 px-4">Related Order</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {wallet.transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{tx.id.slice(-8)}</td>
                        <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px]">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-sans ${
                              tx.direction === 'CREDIT'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {tx.direction}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-4 font-bold ${
                            tx.direction === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {tx.direction === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-slate-700">{tx.reason}</td>
                        <td className="py-3.5 px-4 text-slate-900 font-bold">{tx.orderNumber || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-sans">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REFUNDS */}
      {activeTab === 'REFUNDS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#4F9D32]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#17202A]">Refund Records</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{refunds.length} Refunds</span>
          </div>

          {refunds.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No refunds found for this student.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Refund Type</th>
                    <th className="py-3 px-4">Refund Amount</th>
                    <th className="py-3 px-4">Refund Method</th>
                    <th className="py-3 px-4">Refund Status</th>
                    <th className="py-3 px-4">Requested Date</th>
                    <th className="py-3 px-4">Completed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {refunds.map((r: any, idx: number) => (
                    <tr key={r.orderId || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.orderNumber || r.orderId}</td>
                      <td className="py-3.5 px-4 font-sans text-slate-700">{r.refundType}</td>
                      <td className="py-3.5 px-4 font-bold text-purple-700">₹{r.amount}</td>
                      <td className="py-3.5 px-4 font-sans text-slate-600">{r.refundMethod}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-sans ${
                            r.refundStatus === 'PROCESSED' || r.refundStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {r.refundStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px]">
                        {r.requestedDate
                          ? new Date(r.requestedDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px]">
                        {r.completedDate
                          ? new Date(r.completedDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
