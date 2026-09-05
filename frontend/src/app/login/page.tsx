'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Truck,
  GraduationCap,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';

type UserRole = 'STUDENT' | 'ADMIN' | 'SERVICE_PROVIDER' | 'DELIVERY_BOY';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>('STUDENT');
  const [identifier, setIdentifier] = useState('ss.24u10227@nitdgp.ac.in');
  const [password, setPassword] = useState('Student@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // OTP Verification Step State
  const [otpStep, setOtpStep] = useState(false);
  const [otpUserId, setOtpUserId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    const redirectParam = searchParams.get('redirect')?.toLowerCase();

    if (roleParam === 'ADMIN' || redirectParam?.includes('admin')) {
      setActiveRole('ADMIN');
      setIdentifier('souravsenapati408@gmail.com');
      setPassword('Sourav@12345');
    } else if (roleParam === 'DELIVERY_BOY' || roleParam === 'DELIVERY' || redirectParam?.includes('delivery')) {
      setActiveRole('DELIVERY_BOY');
      setIdentifier('DB_BOY_01');
      setPassword('Delivery@12345');
    } else if (roleParam === 'PROVIDER' || roleParam === 'SERVICE_PROVIDER' || redirectParam?.includes('provider')) {
      setActiveRole('SERVICE_PROVIDER');
      setIdentifier('SP_FOOD_01');
      setPassword('Vendor@12345');
    } else if (roleParam === 'STUDENT' || redirectParam?.includes('student')) {
      setActiveRole('STUDENT');
      setIdentifier('ss.24u10227@nitdgp.ac.in');
      setPassword('Student@2026');
    }
  }, [searchParams]);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setError(null);
    setAutoFilled(false);
    setOtpStep(false);
    if (role === 'ADMIN') {
      setIdentifier('souravsenapati408@gmail.com');
      setPassword('Sourav@12345');
    } else if (role === 'DELIVERY_BOY') {
      setIdentifier('DB_BOY_01');
      setPassword('Delivery@12345');
    } else if (role === 'SERVICE_PROVIDER') {
      setIdentifier('SP_FOOD_01');
      setPassword('Vendor@12345');
    } else {
      setIdentifier('ss.24u10227@nitdgp.ac.in');
      setPassword('Student@2026');
    }
  };

  const handleQuickFill = (role: UserRole) => {
    if (role === 'ADMIN') {
      setIdentifier('souravsenapati408@gmail.com');
      setPassword('Sourav@12345');
    } else if (role === 'DELIVERY_BOY') {
      setIdentifier('DB_BOY_01');
      setPassword('Delivery@12345');
    } else if (role === 'SERVICE_PROVIDER') {
      setIdentifier('SP_FOOD_01');
      setPassword('Vendor@12345');
    } else {
      setIdentifier('ss.24u10227@nitdgp.ac.in');
      setPassword('Student@2026');
    }
    setAutoFilled(true);
    setTimeout(() => setAutoFilled(false), 2500);
  };

  const handleRoleRedirect = (userRole: string) => {
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      router.push(redirectUrl);
      return;
    }

    if (userRole === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (userRole === 'SERVICE_PROVIDER') {
      router.push('/provider/dashboard');
    } else if (userRole === 'DELIVERY_BOY') {
      router.push('/delivery/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: identifier.trim(), password }),
      });

      if (res.requiresOtp) {
        setOtpStep(true);
        setOtpUserId(res.userId);
        setMaskedEmail(res.targetEmail || 'your registered Gmail');
        setLoading(false);
        return;
      }

      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        handleRoleRedirect(res.user.role);
      } else {
        setError(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setError(null);
    setOtpLoading(true);

    try {
      const res = await apiRequest('/api/auth/login/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ userId: otpUserId, otp: otpCode.trim() }),
      });

      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        handleRoleRedirect(res.user.role);
      } else {
        setError(res.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Theme styling based on active role
  const roleStyles = {
    STUDENT: {
      themeBorder: 'border-gray-200',
      themeBadge: 'bg-[#f1f8e9] text-[#2e7d32] border-[#c5e1a5]',
      themeBtn: 'bg-[#689f38] hover:bg-[#5b8c30] text-white shadow-md shadow-[#689f38]/20',
      icon: GraduationCap,
      iconBg: 'bg-[#f1f8e9] text-[#689f38] border-[#c5e1a5]',
      badgeText: 'Student Portal Access',
      title: 'Welcome Back',
      subtitle: 'Sign in to order meals, express laundry & campus essentials',
      emailLabel: 'College or Personal Email',
      emailPlaceholder: 'e.g. ss.24u10227@nitdgp.ac.in or student@gmail.com',
    },
    SERVICE_PROVIDER: {
      themeBorder: 'border-emerald-200',
      themeBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      themeBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20',
      icon: Truck,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'Service Provider Terminal',
      title: 'Provider Portal',
      subtitle: 'Manage assigned category catalog, orders & preparation status',
      emailLabel: 'User ID or Personal Gmail',
      emailPlaceholder: 'e.g. SP_FOOD_01 or canteen.vendor@gmail.com',
    },
    DELIVERY_BOY: {
      themeBorder: 'border-sky-200',
      themeBadge: 'bg-sky-50 text-sky-700 border-sky-200',
      themeBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20',
      icon: Truck,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
      badgeText: 'Delivery Partner Console',
      title: 'Delivery Boy Login',
      subtitle: 'Pick up assigned orders and drop to student hostel rooms',
      emailLabel: 'User ID or Personal Gmail',
      emailPlaceholder: 'e.g. DB_BOY_01 or runner.delivery@gmail.com',
    },
    ADMIN: {
      themeBorder: 'border-purple-200',
      themeBadge: 'bg-purple-50 text-purple-700 border-purple-200',
      themeBtn: 'bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-700/20',
      icon: ShieldCheck,
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      badgeText: 'Administrative Command Center',
      title: 'Campus Admin Login',
      subtitle: 'Management of campus catalog, deliveries, zones & governance',
      emailLabel: 'Admin Email or User ID',
      emailPlaceholder: 'souravsenapati408@gmail.com or ADMIN_SOURAV',
    },
  };

  const currentTheme = roleStyles[activeRole];
  const IconComponent = currentTheme.icon;

  const [unregisteredGoogleModal, setUnregisteredGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      // In web browser with Google Identity Services or fallback client token
      let credential = '';
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        // Real Google GSI popup prompt if initialized
      }

      // If no GSI active or in test mode, prompt for mock Google token or email
      if (!credential) {
        const testGoogleEmail = prompt(
          'Google Sign-In Simulation:\nEnter your Google Account email to authenticate:',
          'student@gmail.com'
        );
        if (!testGoogleEmail) {
          setGoogleLoading(false);
          return;
        }

        // Create a test client credential token containing the email and sub
        const dummyHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const dummyPayload = btoa(
          JSON.stringify({
            sub: `google_${testGoogleEmail.replace(/[^a-z0-9]/gi, '')}`,
            email: testGoogleEmail,
            email_verified: true,
            name: 'Google User'
          })
        );
        credential = `${dummyHeader}.${dummyPayload}.sig`;
      }

      const res = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential })
      });

      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        router.push('/dashboard');
      } else if (res.code === 'UNREGISTERED_GOOGLE' || res.status === 404) {
        setUnregisteredGoogleModal(true);
      } else {
        setError(res.message || 'Google authentication failed.');
      }
    } catch (err: any) {
      if (err.message?.includes('not registered') || err.message?.includes('UNREGISTERED')) {
        setUnregisteredGoogleModal(true);
      } else {
        setError(err.message || 'Google Sign-In failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
      {/* Role Selection Tabs */}
      <div className="grid grid-cols-4 p-1 bg-white rounded-xl border border-gray-200 mb-5 shadow-sm">
        <button
          type="button"
          onClick={() => handleRoleChange('STUDENT')}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
            activeRole === 'STUDENT'
              ? 'bg-[#689f38] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('SERVICE_PROVIDER')}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
            activeRole === 'SERVICE_PROVIDER'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Provider</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('DELIVERY_BOY')}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
            activeRole === 'DELIVERY_BOY'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Delivery</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('ADMIN')}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
            activeRole === 'ADMIN'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
      </div>

      <div className={`bg-white p-7 sm:p-8 rounded-2xl border ${currentTheme.themeBorder} space-y-5 shadow-md transition-all`}>
        {/* Header with Icon and Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase">
            <span className={currentTheme.themeBadge}>
              {currentTheme.badgeText}
            </span>
          </div>

          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto border ${currentTheme.iconBg} shadow-inner`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {otpStep ? '2-Factor Verification' : currentTheme.title}
          </h1>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {otpStep
              ? `Enter the 6-digit OTP dispatched to ${maskedEmail}`
              : currentTheme.subtitle}
          </p>
        </div>

        {/* Quick Fill Demo Credentials Chip (Only in credential step) */}
        {!otpStep && (
          <div className="bg-[#f8f8f8] rounded-xl p-2.5 border border-gray-200 flex items-center justify-between gap-2">
            <div className="text-[11px] text-gray-700 flex items-center gap-1.5 truncate">
              <KeyRound className="w-3.5 h-3.5 text-[#689f38] shrink-0" />
              <span className="font-semibold text-gray-500">Preset:</span>
              <span className="font-mono text-gray-900 font-bold truncate">
                {activeRole === 'ADMIN'
                  ? 'souravsenapati408@gmail.com'
                  : activeRole === 'SERVICE_PROVIDER'
                  ? 'SP_FOOD_01'
                  : activeRole === 'DELIVERY_BOY'
                  ? 'DB_BOY_01'
                  : 'ss.24u10227@nitdgp.ac.in'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleQuickFill(activeRole)}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-gray-100 text-[#689f38] text-[11px] font-bold flex items-center gap-1 shrink-0 border border-gray-300 shadow-2xs transition-colors"
            >
              {autoFilled ? <CheckCircle2 className="w-3 h-3 text-[#2e7d32]" /> : <Sparkles className="w-3 h-3 text-[#689f38]" />}
              {autoFilled ? 'Loaded!' : 'Autofill'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <span className="shrink-0 text-sm leading-none">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* OTP Step Form */}
        {otpStep ? (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 animate-fade-in">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Security OTP Active:</span> Please verify your identity using the one-time code sent to your registered Gmail address.
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5 text-center">
                Enter 6-Digit One-Time Password
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-gray-300 rounded-xl py-3 text-center text-2xl font-mono tracking-widest text-gray-900 focus:outline-none focus:border-[#84c225] focus:bg-white transition"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpCode.length !== 6}
              className={`w-full py-3 ${currentTheme.themeBtn} font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2`}
            >
              {otpLoading ? (
                <span>Verifying Security Code...</span>
              ) : (
                <>
                  <span>Verify &amp; Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpStep(false);
                setOtpCode('');
                setError(null);
              }}
              className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
            >
              &larr; Back to credential sign in
            </button>
          </form>
        ) : (
          /* Standard Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {currentTheme.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={currentTheme.emailPlaceholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700">Password</label>
                {activeRole === 'STUDENT' && (
                  <Link href="/forgot-password" className="text-[11px] text-[#689f38] font-semibold hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 ${currentTheme.themeBtn} font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2`}
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>
                    Sign In as{' '}
                    {activeRole === 'ADMIN'
                      ? 'Admin'
                      : activeRole === 'SERVICE_PROVIDER'
                      ? 'Provider'
                      : activeRole === 'DELIVERY_BOY'
                      ? 'Delivery Partner'
                      : 'Student'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Google Sign-In (Optional for Students) */}
        {activeRole === 'STUDENT' && (
          <div className="space-y-3 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-gray-400 font-bold uppercase tracking-wider absolute">
                OR
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg border border-gray-300 shadow-2xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>
        )}

        {/* Footer links */}
        <div className="pt-3 border-t border-gray-100 text-center space-y-2 text-xs text-gray-500">
          {activeRole === 'STUDENT' ? (
            <div>
              New NIT Durgapur student?{' '}
              <Link href="/register" className="text-[#689f38] font-bold hover:underline">
                Create Student Account
              </Link>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500">
              Restricted strictly to verified campus operations personnel.
            </div>
          )}
        </div>
      </div>

      {/* Unregistered Google Modal / Alert */}
      {unregisteredGoogleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-xl text-center border border-gray-200 animate-fade-in">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900">
                Your Google account is not registered yet.
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Please complete student registration before using Google Sign-In.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="w-full py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Start Registration
              </button>
              <button
                type="button"
                onClick={() => setUnregisteredGoogleModal(false)}
                className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-24 text-center text-gray-400">Loading portal login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
