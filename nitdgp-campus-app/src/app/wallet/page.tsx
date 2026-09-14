'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import {
  Wallet,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Info,
  ShieldCheck,
  RefreshCw,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface WalletData {
  id: string;
  studentId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface WalletTxn {
  id: string;
  walletId: string;
  studentId: string;
  orderId?: string | null;
  refundId?: string | null;
  type: 'CREDIT' | 'DEBIT';
  refundType?: string | null;
  refundMethod?: string | null;
  triggerEvent?: string | null;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  description?: string | null;
  createdAt: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = async () => {
    try {
      setRefreshing(true);
      const [walletRes, txnsRes] = await Promise.all([
        apiRequest('/api/wallet'),
        apiRequest('/api/wallet/transactions')
      ]);

      if (walletRes?.success && walletRes.wallet) {
        setWallet(walletRes.wallet);
      }
      if (txnsRes?.success && Array.isArray(txnsRes.transactions)) {
        setTransactions(txnsRes.transactions);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const filteredTxns = transactions.filter((t) => {
    if (filter === 'CREDIT') return t.type === 'CREDIT';
    if (filter === 'DEBIT') return t.type === 'DEBIT';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 antialiased py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </Link>

          <button
            onClick={fetchWalletData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Main Wallet Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* Background subtle elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Wallet className="w-4 h-4" />
                <span>Campus Basket Wallet</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                ₹{Number(wallet?.balance || 0).toFixed(2)}
              </div>
              <p className="text-xs text-emerald-100/80 max-w-sm">
                Instant refund balance ready for future orders. Zero waiting time, instant checkout.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Link
                href="/products"
                className="px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold rounded-xl transition shadow-sm text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-800" />
                <span>Shop Campus Store</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-700/50 flex items-center justify-between text-[11px] text-emerald-200/90 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Student Wallet &bull; Tied to your student account</span>
            </div>
            <span>Currency: INR (₹)</span>
          </div>
        </div>

        {/* How Refunds Work Notice */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Campus Basket Refund Rules &amp; Wallet Timelines</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] text-slate-600">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-800 block mb-0.5">Cancellation Refunds:</strong>
              When cancellation is eligible and confirmed with Campus Basket Wallet, funds are credited <strong>instantly</strong>.
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-800 block mb-0.5">Return Refunds:</strong>
              When return is eligible, wallet credit is triggered <strong>only after</strong> runner physically collects items and verifies the 6-digit OTP.
            </div>
          </div>
        </div>

        {/* Transaction History / Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Wallet Ledger &amp; Transactions</h3>
              <p className="text-[11px] text-slate-500">Official audit trail with unique transaction IDs</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 self-start sm:self-auto text-xs">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setFilter('CREDIT')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filter === 'CREDIT' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Credits
              </button>
              <button
                onClick={() => setFilter('DEBIT')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filter === 'DEBIT' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Debits
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading wallet ledger...</p>
            </div>
          ) : filteredTxns.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-700">No Transactions Found</div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Refunds from eligible order cancellations and completed return pickups will be credited here automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTxns.map((txn) => {
                const isCredit = txn.type === 'CREDIT';
                const formattedDate = new Date(txn.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={txn.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900">
                            {txn.description || (txn.refundType ? `${txn.refundType} Refund` : isCredit ? 'Wallet Credit' : 'Wallet Payment')}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                            <span>{formattedDate}</span>
                            <span>&bull;</span>
                            <span className="font-mono text-[10px]">TXN: {txn.id.slice(0, 16)}...</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-mono text-sm sm:text-base font-black ${
                          isCredit ? 'text-emerald-700' : 'text-slate-800'
                        }`}>
                          {isCredit ? '+' : '-'}₹{Number(txn.amount).toFixed(2)}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {txn.status}
                        </span>
                      </div>
                    </div>

                    {/* Transaction Audit Metadata (Section 16) */}
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Trigger Event:</span>
                        <span className="font-mono font-semibold text-slate-800 truncate block">
                          {txn.triggerEvent || 'MANUAL'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Balance Before:</span>
                        <span className="font-mono text-slate-800">₹{Number(txn.balanceBefore).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Balance After:</span>
                        <span className="font-mono font-bold text-emerald-700">₹{Number(txn.balanceAfter).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Order Ref:</span>
                        {txn.orderId ? (
                          <Link
                            href={`/orders/${txn.orderId}/track`}
                            className="font-mono text-[#4F9D2F] font-bold hover:underline flex items-center gap-0.5 truncate"
                          >
                            <span>#{txn.orderId.slice(-6)}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
