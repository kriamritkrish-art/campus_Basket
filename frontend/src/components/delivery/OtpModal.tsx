'use client';

import React, { useState } from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import { KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OtpModal() {
  const { otpModalOrder, setOtpModalOrder, verifyOrderOtp } = useDelivery();
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState(false);

  if (!otpModalOrder) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    const valid = verifyOrderOtp(otpModalOrder.id, otpValue);
    if (!valid) {
      setError(true);
    } else {
      setOtpValue('');
    }
  };

  const handleUseDemo = () => {
    setOtpValue(otpModalOrder.otpRequired);
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-purple-100 animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                VERIFY DELIVERY
              </h3>
              <div className="font-mono text-xs font-bold text-purple-700">
                Order {otpModalOrder.orderNumber}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setOtpModalOrder(null);
              setError(false);
              setOtpValue('');
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Enter student's delivery OTP received at <span className="font-bold text-gray-900">{otpModalOrder.destination}</span>:
          </p>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div className="flex justify-center">
              <input
                type="text"
                maxLength={4}
                autoFocus
                value={otpValue}
                onChange={(e) => {
                  setOtpValue(e.target.value);
                  setError(false);
                }}
                placeholder="• • • •"
                className="w-48 py-3 text-center text-2xl font-mono font-black tracking-[0.5em] bg-gray-50 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 font-bold text-center">
                Incorrect OTP. Ask student for their 4-digit code.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleUseDemo}
                className="px-3 py-2.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold transition flex-1"
              >
                Use Code ({otpModalOrder.otpRequired})
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black transition flex-1 shadow-sm"
              >
                Verify
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
