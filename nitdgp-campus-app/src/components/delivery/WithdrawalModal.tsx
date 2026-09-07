'use client';

import React, { useState } from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import { X, IndianRupee, ArrowRight, ShieldCheck, AlertCircle, Sparkles, CheckCircle2, Wallet } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPayoutAccountModal: () => void;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
  onOpenPayoutAccountModal,
}: WithdrawalModalProps) {
  const { todayStats, payoutAccount, requestWithdrawal } = useDelivery();
  const availableBalance = todayStats.walletBalance || 0;

  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickSelect = (val: number) => {
    const capped = Math.min(val, availableBalance);
    setAmount(String(capped));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid withdrawal amount greater than ₹0.');
      return;
    }

    if (numAmount > availableBalance) {
      setErrorMessage(`Withdrawal amount (₹${numAmount}) cannot exceed available balance of ₹${availableBalance}.`);
      return;
    }

    if (!payoutAccount) {
      setErrorMessage('Please link your Bank Account or UPI ID before submitting a withdrawal.');
      return;
    }

    setIsSubmitting(true);
    const success = await requestWithdrawal(numAmount);
    setIsSubmitting(false);

    if (success) {
      setAmount('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Withdraw Earnings</h2>
              <p className="text-xs text-emerald-100">Disbursed directly to your verified account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Balance Cards Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Available to Withdraw
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">
                ₹{availableBalance.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Already Settled
              </div>
              <div className="text-2xl font-black text-gray-700 mt-0.5">
                ₹{(todayStats.totalSettled || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Linked Account Destination */}
          {payoutAccount ? (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase text-blue-700">Destination Account</div>
                <div className="text-sm font-bold text-gray-900 mt-0.5">
                  {payoutAccount.accountType === 'UPI' ? (
                    <span>UPI: <span className="font-mono text-blue-800">{payoutAccount.upiId}</span></span>
                  ) : (
                    <span>{payoutAccount.bankName} ••••{payoutAccount.accountNumber?.slice(-4)}</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500">Holder: {payoutAccount.accountHolderName}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayoutAccountModal();
                }}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">No payout account linked yet!</span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Link your UPI ID or Bank Account to receive instant money transfers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayoutAccountModal();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-sm"
              >
                Link Now
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Enter Withdrawal Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                ₹
              </div>
              <input
                type="number"
                min="1"
                max={availableBalance}
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none text-xl font-bold font-mono text-gray-900"
              />
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Quick Pick
            </div>
            <div className="flex flex-wrap gap-2">
              {[50, 100, 200].map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={availableBalance < val}
                  onClick={() => handleQuickSelect(val)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  ₹{val}
                </button>
              ))}
              <button
                type="button"
                disabled={availableBalance <= 0}
                onClick={() => handleQuickSelect(availableBalance)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Withdraw All (₹{availableBalance.toFixed(0)})</span>
              </button>
            </div>
          </div>

          {/* Settlement Lifecycle Workflow Note */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1.5">
            <div className="font-bold text-gray-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>How Settlement Works</span>
            </div>
            <ul className="text-[11px] text-gray-600 space-y-1 list-disc list-inside">
              <li>
                Request displays as <span className="font-bold text-amber-700">PENDING</span> until approved.
              </li>
              <li>
                Campus Admin reviews and releases payout with bank reference (<span className="font-bold text-blue-700">APPROVED</span>).
              </li>
              <li>
                Once marked <span className="font-bold text-emerald-700">DISTRIBUTED</span> with UTR number, your available balance deducts (to ₹0 if full amount) and moves to <span className="font-bold">Already Settled</span>.
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || availableBalance <= 0 || !payoutAccount}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Withdrawal Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
