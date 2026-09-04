'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { Mail, KeyRound, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.success) {
        setSuccess('If an account exists, a reset code has been dispatched.');
        setStep(2);
      } else {
        setError(res.message || 'Failed to dispatch code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim(), newPassword }),
      });

      if (res.success) {
        setSuccess('Password updated successfully! You can now log in.');
        setTimeout(() => (window.location.href = '/login'), 1500);
      } else {
        setError(res.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Reset Password</h1>
          <p className="text-xs text-slate-400">
            Secure OTP verification through your college email
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Official College or Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="ss.24u10227@nitdgp.ac.in or souravsenapati055@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending Reset Code...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-300 text-center space-y-1">
              <div>Reset code sent to: <span className="font-bold text-sky-400 font-mono">{email}</span></div>
              <div className="text-[11px] text-amber-300/90 font-medium">Please check your <strong>Spam / Junk</strong> or <strong>Promotions</strong> folder.</div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">6-Digit Code</label>
              <input
                type="text"
                placeholder="• • • • • •"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-xl font-mono text-white tracking-widest focus:outline-none focus:border-sky-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">New Password (min 8 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                className="hover:text-sky-400 transition-colors cursor-pointer"
              >
                Change Email
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleRequestOtp}
                className="text-sky-400 hover:underline font-semibold cursor-pointer"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 space-y-1.5">
          <div>
            <Link href="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
              Remember your password? Log in
            </Link>
          </div>
          <div>
            <Link href="/register" className="text-xs text-sky-400 hover:underline">
              Don't have an account? Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
