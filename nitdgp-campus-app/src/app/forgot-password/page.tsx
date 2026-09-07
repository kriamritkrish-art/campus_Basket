'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  RotateCw
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Password strength calculation
  const getPasswordScore = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passScore = getPasswordScore(newPassword);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.success) {
        const masked = res.maskedEmail || (res.data && res.data.maskedEmail) || 'your personal email';
        setMaskedEmail(masked);
        setStep(2);
        setCooldown(60);
      } else {
        setError(res.message || 'Unable to locate student account. Please verify your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword
        }),
      });

      if (res.success) {
        setSuccess('Password updated successfully! Redirecting you to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1800);
      } else {
        setError(res.message || 'Failed to update password. Please verify the code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/20 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-400">
            NIT Durgapur Campus Basket &bull; Account Recovery
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-xs text-emerald-300 flex items-start gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          /* Step 1: Input Email */
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Registered College or Personal Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="e.g. student@nitdgp.ac.in or personal@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span>Verification code will be dispatched strictly to your verified personal email.</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Looking Up Account...</span>
                </>
              ) : (
                'Send Recovery Code'
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP + New Password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Notification Banner with masked email */}
            <div className="p-3.5 bg-sky-950/50 border border-sky-800/60 rounded-2xl text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-sky-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>Verification Code Dispatched</span>
              </div>
              <p className="text-[11px] text-slate-300">
                We've sent a verification code to your verified personal email:{' '}
                <span className="font-bold text-sky-400 font-mono">{maskedEmail}</span>
              </p>
              <p className="text-[10px] text-amber-300/90 font-medium">
                Please check your <strong>Spam / Junk</strong> or <strong>Promotions</strong> folder if not in your primary inbox.
              </p>
            </div>

            {/* OTP Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                6-Digit Security Code
              </label>
              <input
                type="text"
                placeholder="• • • • • •"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-xl font-mono text-white tracking-widest focus:outline-none focus:border-sky-500"
                required
                autoFocus
              />
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                New Password (minimum 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter strong new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          passScore >= i
                            ? passScore <= 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>
                      Strength:{' '}
                      {passScore <= 1
                        ? 'Weak'
                        : passScore <= 3
                        ? 'Good'
                        : 'Strong'}
                    </span>
                    <span>Min 8 chars, 1 uppercase, 1 number</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6 || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                'Save New Password'
              )}
            </button>

            {/* Secondary Actions */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                className="flex items-center gap-1 hover:text-sky-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                disabled={loading || cooldown > 0}
                onClick={() => handleRequestOtp()}
                className="flex items-center gap-1 text-sky-400 hover:underline font-semibold cursor-pointer disabled:opacity-50 disabled:no-underline"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer links */}
        <div className="text-center pt-2 space-y-2 border-t border-slate-800">
          <div>
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Student Login</span>
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
