'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
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
  ChevronRight,
  Plus,
  X,
  CreditCard,
  AlertCircle
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
  studentId?: string | null;
  orderId?: string | null;
  refundId?: string | null;
  transactionId?: string;
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
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useCart();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Quick Add Money state
  const [selectedPreset, setSelectedPreset] = useState<number | 'CUSTOM'>(500);
  const [customAmount, setCustomAmount] = useState<string>('500');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);

  // Success state modal
  const [successModalData, setSuccessModalData] = useState<{
    addedAmount: number;
    newBalance: number;
  } | null>(null);

  // Sandbox simulation fallback modal (if Razorpay SDK is blocked or mock order returned)
  const [sandboxOrderData, setSandboxOrderData] = useState<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
  } | null>(null);

  const fetchWalletData = async () => {
    try {
      setRefreshing(true);
      const [walletRes, txnsRes] = await Promise.all([
        apiRequest('/api/wallet'),
        apiRequest('/api/wallet/transactions')
      ]);

      if (walletRes?.success && walletRes.wallet) {
        setWallet(walletRes.wallet);
      } else if (walletRes?.balance !== undefined) {
        setWallet({
          id: 'wlt_user',
          studentId: '',
          balance: Number(walletRes.balance),
          currency: 'INR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      if (txnsRes?.success && Array.isArray(txnsRes.transactions)) {
        setTransactions(txnsRes.transactions);
      }
    } catch (err) {
      console.warn('Wallet fetch notice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/wallet');
      return;
    }
    fetchWalletData();
  }, [isAuthenticated, authLoading, router]);

  // Derived real totals from ledger
  const overviewTotals = useMemo(() => {
    let totalAdded = 0;
    let totalRefunds = 0;

    for (const t of transactions) {
      if (t.status === 'COMPLETED' || !t.status) {
        if (t.refundType === 'WALLET_TOPUP' || (t.type === 'CREDIT' && !t.refundType?.includes('REFUND') && t.refundType !== 'CANCELLATION' && t.refundType !== 'RETURN')) {
          totalAdded += Number(t.amount || 0);
        } else if (t.refundType === 'CANCELLATION' || t.refundType === 'RETURN' || (t.type === 'CREDIT' && t.refundType?.includes('REFUND'))) {
          totalRefunds += Number(t.amount || 0);
        }
      }
    }

    return {
      availableBalance: wallet ? Number(wallet.balance) : 0,
      totalAdded: Math.round(totalAdded * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100
    };
  }, [wallet, transactions]);

  // Current amount to add
  const currentAmountToAdd = useMemo(() => {
    if (selectedPreset === 'CUSTOM') {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedPreset;
  }, [selectedPreset, customAmount]);

  // Dynamic Razorpay SDK loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Trigger top-up payment initiation
  const handleInitiateTopUp = async () => {
    if (currentAmountToAdd < 1) {
      setTopUpError('Please enter a valid amount (minimum ₹1).');
      return;
    }
    if (currentAmountToAdd > 50000) {
      setTopUpError('Maximum top-up per transaction is ₹50,000.');
      return;
    }

    setTopUpError(null);
    setIsTopUpLoading(true);

    try {
      const initRes = await apiRequest('/api/wallet/topup/initiate', {
        method: 'POST',
        body: JSON.stringify({ amount: currentAmountToAdd })
      });

      if (!initRes?.success || !initRes.razorpayOrderId) {
        throw new Error(initRes?.message || 'Failed to initialize wallet top-up order');
      }

      const scriptLoaded = await loadRazorpayScript();
      const isMockOrder = initRes.razorpayOrderId.startsWith('order_rzp_mock_');

      // If in sandbox mode or live script blocked, launch simulated gateway modal
      if (!scriptLoaded || !(window as any).Razorpay || isMockOrder) {
        setSandboxOrderData({
          razorpayOrderId: initRes.razorpayOrderId,
          amount: currentAmountToAdd,
          currency: initRes.currency || 'INR'
        });
        setIsTopUpLoading(false);
        return;
      }

      // Live Razorpay Checkout
      const rzpConfig = {
        key: initRes.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: initRes.amount,
        currency: initRes.currency || 'INR',
        name: 'Campus Basket',
        description: `Wallet Top-up of ₹${currentAmountToAdd.toFixed(2)}`,
        order_id: initRes.razorpayOrderId,
        theme: { color: '#4F9D2F' },
        handler: async (response: any) => {
          await verifyAndCompleteTopUp({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            amount: currentAmountToAdd
          });
        },
        modal: {
          ondismiss: () => {
            setIsTopUpLoading(false);
            showToast('Top-up payment cancelled. Wallet balance was not changed.');
          }
        }
      };

      const rzp = new (window as any).Razorpay(rzpConfig);
      rzp.on('payment.failed', (resp: any) => {
        setIsTopUpLoading(false);
        setTopUpError(resp?.error?.description || 'Payment failed. Your wallet balance was not changed.');
        showToast('Payment failed. Wallet balance not updated.');
      });
      rzp.open();
    } catch (err: any) {
      setIsTopUpLoading(false);
      setTopUpError(err?.message || 'Top-up payment initiation failed. Please try again.');
    }
  };

  // Server-side verification of payment signature
  const verifyAndCompleteTopUp = async (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
  }) => {
    setIsTopUpLoading(true);
    setTopUpError(null);
    try {
      const verifyRes = await apiRequest('/api/wallet/topup/verify', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!verifyRes?.success) {
        throw new Error(verifyRes?.message || 'Payment signature verification failed.');
      }

      // Update local wallet balance and show success state
      const updatedBalance = Number(verifyRes.newBalance ?? (wallet ? wallet.balance + payload.amount : payload.amount));
      setWallet((prev) => prev ? { ...prev, balance: updatedBalance } : null);
      setSuccessModalData({
        addedAmount: payload.amount,
        newBalance: updatedBalance
      });

      // Refresh transactions ledger
      fetchWalletData();
    } catch (err: any) {
      setTopUpError(err?.message || 'Verification failed. Contact student helpdesk.');
      showToast('Payment verification failed.');
    } finally {
      setIsTopUpLoading(false);
      setSandboxOrderData(null);
    }
  };

  // Filtered transactions
  const filteredTxns = transactions.filter((t) => {
    if (filter === 'CREDIT') return t.type === 'CREDIT';
    if (filter === 'DEBIT') return t.type === 'DEBIT';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 antialiased py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* 1. Top Navigation Bar: Strictly "← Back to Account" + "↻ Refresh" */}
        <div className="flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-2xs hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
            <span>Back to Account</span>
          </Link>

          <button
            onClick={fetchWalletData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-2xs hover:bg-gray-50 transition cursor-pointer"
            title="Refresh Wallet Balance"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#4F9D2F]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 2. Main Wallet Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          {/* Subtle geometric background accents */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#4F9D2F]/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4F9D2F] flex items-center justify-center text-white shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  CAMPUS BASKET WALLET
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                INR (₹)
              </span>
            </div>

            {/* Available Balance Display */}
            <div>
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Available Balance
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl text-emerald-400">₹</span>
                <span>
                  {loading ? '---' : overviewTotals.availableBalance.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Use your wallet for faster checkout, refunds, and secure Campus Basket payments.
              </p>
            </div>

            {/* Prominent Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const elem = document.getElementById('quick-add-money-section');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 bg-[#4F9D2F] hover:bg-[#438a27] active:scale-98 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Money</span>
              </button>

              <Link
                href="/"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold rounded-xl border border-white/20 transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-300" />
                <span>Shop Campus Store</span>
              </Link>
            </div>

            {/* Footer Trust Marker */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>🔒 Secure Student Wallet &bull; Tied to your Campus Basket student account</span>
              </div>
              <span className="hidden sm:inline font-mono">Currency: INR (₹)</span>
            </div>
          </div>
        </div>

        {/* 3. Wallet Overview (3 Real Database Cards) */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 px-1">
            WALLET OVERVIEW
          </h3>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {/* Available Balance */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3.5 sm:p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">
                Available Balance
              </span>
              <div className="text-base sm:text-lg font-black text-gray-900 font-mono mt-1">
                ₹{overviewTotals.availableBalance.toFixed(2)}
              </div>
            </div>

            {/* Total Added */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3.5 sm:p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                Total Added
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-1">
                ₹{overviewTotals.totalAdded.toFixed(2)}
              </div>
            </div>

            {/* Total Refunds */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3.5 sm:p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-blue-700 block">
                Total Refunds
              </span>
              <div className="text-base sm:text-lg font-black text-blue-700 font-mono mt-1">
                ₹{overviewTotals.totalRefunds.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Quick Add Money Section */}
        <div
          id="quick-add-money-section"
          className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div>
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#4F9D2F]" />
              <span>QUICK ADD MONEY</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Add money to your Campus Basket Wallet for faster checkout.
            </p>
          </div>

          {/* Amount Choices: ₹100, ₹200, ₹500, ₹1,000, Custom */}
          <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
            {[100, 200, 500, 1000].map((amt) => {
              const isSelected = selectedPreset === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(amt);
                    setCustomAmount(amt.toString());
                  }}
                  className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#4F9D2F] text-white border-[#4F9D2F] shadow-xs'
                      : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  ₹{amt}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedPreset('CUSTOM')}
              className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                selectedPreset === 'CUSTOM'
                  ? 'bg-[#4F9D2F] text-white border-[#4F9D2F] shadow-xs'
                  : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom Amount Input Field */}
          {selectedPreset === 'CUSTOM' && (
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold font-mono">
                ₹
              </span>
              <input
                type="number"
                min="1"
                max="50000"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter custom amount (e.g. 750)"
                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F9D2F] focus:border-transparent font-mono"
              />
            </div>
          )}

          {/* Amount to Add & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Amount to Add
              </span>
              <div className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
                ₹{currentAmountToAdd > 0 ? currentAmountToAdd.toFixed(2) : '0.00'}
              </div>
            </div>

            <button
              onClick={handleInitiateTopUp}
              disabled={isTopUpLoading || currentAmountToAdd < 1}
              className="px-6 py-3 bg-[#4F9D2F] hover:bg-[#438a27] disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-98 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isTopUpLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Continue to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {topUpError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{topUpError}</span>
            </div>
          )}
        </div>

        {/* 5. Wallet Ledger & Transactions */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm sm:text-base font-black text-gray-900">
                Wallet Ledger &amp; Transactions
              </h3>
              <p className="text-xs text-gray-500">
                Complete history of your Campus Basket Wallet activity.
              </p>
            </div>

            {/* Filters: All, Credits, Debits */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filter === 'ALL'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setFilter('CREDIT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filter === 'CREDIT'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Credits ({transactions.filter((t) => t.type === 'CREDIT').length})
              </button>
              <button
                onClick={() => setFilter('DEBIT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filter === 'DEBIT'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Debits ({transactions.filter((t) => t.type === 'DEBIT').length})
              </button>
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-[#4F9D2F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500 font-bold">Loading wallet records...</p>
            </div>
          ) : filteredTxns.length === 0 ? (
            /* 14. Wallet Empty State */
            <div className="py-10 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl space-y-2">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-gray-800">No Transactions Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Your wallet activity will appear here when you add money, receive a refund, or use your wallet for an order.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTxns.map((txn) => {
                const isCredit = txn.type === 'CREDIT';
                const formattedDate = new Date(txn.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                // Human-readable transaction type
                const typeLabel =
                  txn.refundType === 'WALLET_TOPUP'
                    ? 'Wallet Top-up'
                    : txn.refundType === 'CANCELLATION'
                    ? 'Cancellation Refund'
                    : txn.refundType === 'RETURN'
                    ? 'Return Refund'
                    : txn.refundType === 'ORDER_PAYMENT' || txn.type === 'DEBIT'
                    ? 'Order Payment'
                    : isCredit
                    ? 'Credit'
                    : 'Debit';

                return (
                  <div
                    key={txn.id || txn.transactionId}
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">
                            {typeLabel}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                            {txn.status || 'Completed'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                          {txn.description || (txn.orderId ? `Order #${txn.orderId}` : 'Campus Basket transaction')}
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          {formattedDate} {txn.transactionId ? `• ${txn.transactionId.slice(-10)}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm sm:text-base font-black font-mono ${
                          isCredit ? 'text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        {isCredit ? '+' : '-'} ₹{Number(txn.amount).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono block">
                        Bal: ₹{Number(txn.balanceAfter || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Refund & Wallet Rules (Secondary Section) */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-900 font-black text-xs sm:text-sm">
            <Info className="w-4 h-4 text-gray-500" />
            <span>Refund &amp; Wallet Rules</span>
          </div>

          <div className="space-y-2.5 text-xs text-gray-600 leading-relaxed">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <strong className="text-gray-900 font-bold block mb-0.5">
                Cancellation Refund:
              </strong>
              Eligible cancellation refunds are credited to your Campus Basket Wallet according to Campus Basket refund rules.
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <strong className="text-gray-900 font-bold block mb-0.5">
                Return Refund:
              </strong>
              Eligible return refunds are credited after the required return collection and verification process is completed.
            </div>
          </div>
        </div>

      </div>

      {/* 7. Success State Modal */}
      {successModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block mb-1">
                ✓ Money Added Successfully
              </span>
              <div className="text-3xl font-black text-gray-900 font-mono">
                ₹{successModalData.addedAmount.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                has been added to your Campus Basket Wallet.
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
              <span className="text-[11px] text-gray-500 font-bold block">
                New Wallet Balance
              </span>
              <span className="text-xl font-black text-gray-900 font-mono block mt-0.5">
                ₹{successModalData.newBalance.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/"
                onClick={() => setSuccessModalData(null)}
                className="w-full py-3 bg-[#4F9D2F] hover:bg-[#438a27] text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Continue Shopping
              </Link>
              <button
                onClick={() => {
                  setSuccessModalData(null);
                  fetchWalletData();
                }}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                View Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Sandbox Gateway Fallback Simulator Modal */}
      {sandboxOrderData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#4F9D2F]" />
                <h4 className="text-sm font-black text-gray-900">
                  Campus Basket Payment Gateway
                </h4>
              </div>
              <button
                onClick={() => setSandboxOrderData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-800 font-bold block">
                Wallet Top-up Amount
              </span>
              <span className="text-2xl font-black text-emerald-900 font-mono mt-0.5 block">
                ₹{sandboxOrderData.amount.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-700 font-mono block mt-1">
                Order: {sandboxOrderData.razorpayOrderId.slice(-12)}
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Confirm payment to simulate the immediate gateway capture and wallet balance crediting.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  const mockPayId = `pay_mock_${Date.now()}`;
                  await verifyAndCompleteTopUp({
                    razorpayOrderId: sandboxOrderData.razorpayOrderId,
                    razorpayPaymentId: mockPayId,
                    razorpaySignature: 'sig_mock_valid',
                    amount: sandboxOrderData.amount
                  });
                }}
                disabled={isTopUpLoading}
                className="w-full py-3 bg-[#4F9D2F] hover:bg-[#438a27] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTopUpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirm &amp; Pay ₹{sandboxOrderData.amount.toFixed(2)}</span>
              </button>

              <button
                onClick={() => {
                  setSandboxOrderData(null);
                  showToast('Top-up payment cancelled. Wallet balance was not changed.');
                }}
                className="w-full py-2.5 text-xs text-gray-600 hover:text-gray-900 font-bold"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
