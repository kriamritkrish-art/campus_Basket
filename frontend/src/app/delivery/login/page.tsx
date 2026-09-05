'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  Truck,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

function DeliveryLoginForm() {
  const router = useRouter();
  const { user, role, isAuthenticated, login, isLoading } = useAuth();

  const [identifier, setIdentifier] = useState('DB_BOY_01');
  const [password, setPassword] = useState('Delivery@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginWithOtp, setLoginWithOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated as delivery partner, auto-open dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (role === 'DELIVERY_BOY' || role === 'ADMIN') {
        router.replace('/delivery/dashboard');
      }
    }
  }, [isAuthenticated, role, isLoading, router]);

  const handleQuickFill = () => {
    setIdentifier('DB_BOY_01');
    setPassword('Delivery@12345');
    setError(null);
  };

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setError('Please enter your Delivery ID or Mobile number first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Simulate/Trigger OTP send for delivery partner
      setTimeout(() => {
        setLoading(false);
        setOtpSent(true);
        setOtpCode('123456');
      }, 700);
    } catch {
      setError('Unable to send OTP. Please use your password to login.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (loginWithOtp && otpSent) {
        if (otpCode !== '123456') {
          throw new Error('Invalid OTP code. Please enter 123456 for verification.');
        }
      }

      // Call Unified Login API with activeRole: 'DELIVERY_BOY'
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: loginWithOtp ? 'Delivery@12345' : password,
          activeRole: 'DELIVERY_BOY'
        })
      });

      if (!res.success) {
        throw new Error(res.message || 'Delivery partner authentication failed');
      }

      if (res.requiresOtp) {
        throw new Error('Role requires OTP verification. Please sign in with password.');
      }

      // Sync user session
      login(res.token, res.user);
      router.push('/delivery/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your Delivery ID and password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8f6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Branding Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#4f9d2f] text-white flex items-center justify-center mx-auto shadow-md shadow-[#4f9d2f]/20 mb-4">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Campus Basket Delivery Partner
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            NIT Durgapur Campus Runner &amp; Logistics Portal
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white py-8 px-6 sm:px-10 shadow-sm border border-gray-200 rounded-3xl space-y-6">
          {/* Quick Fill Preset Banner */}
          <div className="bg-[#f1f8e9] border border-[#dcedc8] p-3.5 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4f9d2f] shrink-0" />
              <span className="text-[11px] font-bold text-[#2e7d32]">
                Demo ID: <span className="font-mono font-extrabold">DB_BOY_01</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-[#4f9d2f] text-white hover:bg-[#36751f] transition-colors"
            >
              Fill Credentials
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                Mobile Number / Delivery ID
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. DB_BOY_01 or +91 98765 43210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#4f9d2f] focus:bg-white"
                />
              </div>
            </div>

            {!loginWithOtp ? (
              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter partner password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#4f9d2f] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Enter 6-Digit OTP
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 font-mono font-bold tracking-widest focus:outline-none focus:border-[#4f9d2f] focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
                  >
                    {otpSent ? 'Resend' : 'Get OTP'}
                  </button>
                </div>
                {otpSent && (
                  <span className="text-[10px] text-[#2e7d32] font-semibold mt-1 block">
                    ✓ Demo OTP sent: 123456
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#4f9d2f] focus:ring-[#4f9d2f]"
                />
                <span className="text-gray-600 font-medium">Remember Me</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-bold text-[#4f9d2f] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#4f9d2f] hover:bg-[#36751f] disabled:bg-gray-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Login to Delivery Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch Login Mode */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setLoginWithOtp(!loginWithOtp);
                setError(null);
              }}
              className="text-[#4f9d2f] hover:underline font-bold"
            >
              {loginWithOtp ? '← Login with Password' : 'Login with Mobile OTP →'}
            </button>

            <Link href="/login" className="text-gray-500 hover:text-gray-800 font-medium">
              Student Portal
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Official NIT Durgapur Campus Logistics &bull; Fast Room Deliveries across Halls 1–14
        </div>
      </div>
    </div>
  );
}

export default function DeliveryLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8f6]">
        <div className="w-8 h-8 border-4 border-[#4f9d2f] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DeliveryLoginForm />
    </Suspense>
  );
}
