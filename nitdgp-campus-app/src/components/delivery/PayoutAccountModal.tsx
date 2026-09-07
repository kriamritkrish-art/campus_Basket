'use client';

import React, { useState, useEffect } from 'react';
import { useDelivery, DeliveryPayoutAccount } from '@/context/DeliveryContext';
import { X, Landmark, Smartphone, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface PayoutAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PayoutAccountModal({ isOpen, onClose }: PayoutAccountModalProps) {
  const { payoutAccount, savePayoutAccount } = useDelivery();

  const [accountType, setAccountType] = useState<'BANK_ACCOUNT' | 'UPI'>('UPI');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (payoutAccount) {
      setAccountType(payoutAccount.accountType || 'UPI');
      setAccountHolderName(payoutAccount.accountHolderName || '');
      setUpiId(payoutAccount.upiId || '');
      setBankName(payoutAccount.bankName || '');
      setAccountNumber(payoutAccount.accountNumber || '');
      setConfirmAccountNumber(payoutAccount.accountNumber || '');
      setIfscCode(payoutAccount.ifscCode || '');
    }
  }, [payoutAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accountHolderName.trim()) {
      setErrorMessage('Please enter the account holder name.');
      return;
    }

    if (accountType === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setErrorMessage('Please provide a valid UPI ID (e.g., yourname@okhdfcbank or phone@upi).');
        return;
      }
    } else {
      if (!bankName.trim()) {
        setErrorMessage('Please specify your bank name.');
        return;
      }
      if (!accountNumber.trim() || accountNumber.length < 6) {
        setErrorMessage('Please enter a valid bank account number.');
        return;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        setErrorMessage('Account numbers do not match.');
        return;
      }
      if (!ifscCode.trim() || ifscCode.length < 5) {
        setErrorMessage('Please enter a valid 11-character IFSC code.');
        return;
      }
    }

    setIsSubmitting(true);
    const success = await savePayoutAccount({
      accountType,
      accountHolderName: accountHolderName.trim(),
      upiId: accountType === 'UPI' ? upiId.trim().toLowerCase() : undefined,
      bankName: accountType === 'BANK_ACCOUNT' ? bankName.trim() : undefined,
      accountNumber: accountType === 'BANK_ACCOUNT' ? accountNumber.trim() : undefined,
      ifscCode: accountType === 'BANK_ACCOUNT' ? ifscCode.trim().toUpperCase() : undefined,
    });
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Payout Account Details</h2>
              <p className="text-xs text-blue-200">Where you receive earnings withdrawals</p>
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
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Withdrawal Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('UPI')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all ${
                  accountType === 'UPI'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI ID (Instant)</span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('BANK_ACCOUNT')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all ${
                  accountType === 'BANK_ACCOUNT'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Bank Account</span>
              </button>
            </div>
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Account Holder Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="As per bank or UPI record"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium text-gray-800"
            />
          </div>

          {/* Conditional Fields */}
          {accountType === 'UPI' ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                UPI ID (VPA) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. mobile@paytm or name@okaxis"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono text-gray-800"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Ensure this UPI ID is linked to your registered bank account for automated payouts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India, HDFC Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium text-gray-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Confirm Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Re-enter account number"
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBIN0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono uppercase text-gray-800"
                />
              </div>
            </div>
          )}

          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              Your banking details are encrypted and securely verified by campus administration before disbursements are released.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Payout Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
