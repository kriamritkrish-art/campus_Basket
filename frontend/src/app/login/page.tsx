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
  Sparkles
} from 'lucide-react';

type UserRole = 'STUDENT' | 'ADMIN' | 'SERVICE_PROVIDER';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('ss.24u10227@nitdgp.ac.in');
  const [password, setPassword] = useState('Student@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    const redirectParam = searchParams.get('redirect')?.toLowerCase();

    if (roleParam === 'ADMIN' || redirectParam?.includes('admin')) {
      setActiveRole('ADMIN');
      setEmail('souravsenapati408@gmail.com');
      setPassword('Sourav@12345');
    } else if (roleParam === 'PROVIDER' || roleParam === 'SERVICE_PROVIDER' || redirectParam?.includes('provider')) {
      setActiveRole('SERVICE_PROVIDER');
      setEmail('vendor@nitdgp.ac.in');
      setPassword('Vendor@12345');
    } else if (roleParam === 'STUDENT' || redirectParam?.includes('student')) {
      setActiveRole('STUDENT');
      setEmail('ss.24u10227@nitdgp.ac.in');
      setPassword('Student@2026');
    }
  }, [searchParams]);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setError(null);
    setAutoFilled(false);
    if (role === 'ADMIN') {
      setEmail('souravsenapati408@gmail.com');
      setPassword('Sourav@12345');
    } else if (role === 'SERVICE_PROVIDER') {
      setEmail('vendor@nitdgp.ac.in');
      setPassword('Vendor@12345');
    } else {
      setEmail('ss.24u10227@nitdgp.ac.in');
      setPassword('Student@2026');
    }
  };

  const handleQuickFill = (role: UserRole) => {
    if (role === 'ADMIN') {
      setEmail('souravsenapati408@gmail.com');
      setPassword('Sourav@12345');
    } else if (role === 'SERVICE_PROVIDER') {
      setEmail('vendor@nitdgp.ac.in');
      setPassword('Vendor@12345');
    } else {
      setEmail('ss.24u10227@nitdgp.ac.in');
      setPassword('Student@2026');
    }
    setAutoFilled(true);
    setTimeout(() => setAutoFilled(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (res.success && res.token && res.user) {
        login(res.token, res.user);

        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          router.push(redirectUrl);
          return;
        }

        if (res.user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (res.user.role === 'SERVICE_PROVIDER') {
          router.push('/provider/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your network connection.');
    } finally {
      setLoading(false);
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
      title: 'NIT Durgapur Student Login',
      subtitle: 'Log in to order meals, book express laundry & order essentials',
      emailLabel: 'College Email ID',
      emailPlaceholder: 'e.g. ss.24u10227@nitdgp.ac.in',
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
      emailLabel: 'Admin Email Address',
      emailPlaceholder: 'souravsenapati408@gmail.com',
    },
    SERVICE_PROVIDER: {
      themeBorder: 'border-emerald-200',
      themeBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      themeBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20',
      icon: Truck,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'Vendor & Dispatch Console',
      title: 'Service Provider Login',
      subtitle: 'Express laundry verification, cafeteria orders & dispatch status',
      emailLabel: 'Vendor Email ID',
      emailPlaceholder: 'vendor@nitdgp.ac.in',
    }
  };

  const currentTheme = roleStyles[activeRole];
  const IconComponent = currentTheme.icon;

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
      {/* Role Selection Tabs */}
      <div className="flex p-1 bg-white rounded-xl border border-gray-200 mb-5 shadow-sm">
        <button
          type="button"
          onClick={() => handleRoleChange('STUDENT')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeRole === 'STUDENT'
              ? 'bg-[#689f38] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('ADMIN')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeRole === 'ADMIN'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('SERVICE_PROVIDER')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeRole === 'SERVICE_PROVIDER'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Provider</span>
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
            {currentTheme.title}
          </h1>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {currentTheme.subtitle}
          </p>
        </div>

        {/* Quick Fill Demo Credentials Chip */}
        <div className="bg-[#f8f8f8] rounded-xl p-2.5 border border-gray-200 flex items-center justify-between gap-2">
          <div className="text-[11px] text-gray-700 flex items-center gap-1.5 truncate">
            <KeyRound className="w-3.5 h-3.5 text-[#689f38] shrink-0" />
            <span className="font-semibold text-gray-500">Preset:</span>
            <span className="font-mono text-gray-900 font-bold truncate">
              {activeRole === 'ADMIN' ? 'souravsenapati408@gmail.com' : activeRole === 'SERVICE_PROVIDER' ? 'vendor@nitdgp.ac.in' : 'ss.24u10227@nitdgp.ac.in'}
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

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <span className="shrink-0 text-sm leading-none">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              {currentTheme.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder={currentTheme.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                <span>Sign In as {activeRole === 'ADMIN' ? 'Admin' : activeRole === 'SERVICE_PROVIDER' ? 'Provider' : 'Student'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="pt-3 border-t border-gray-100 text-center space-y-2 text-xs text-gray-500">
          {activeRole === 'STUDENT' ? (
            <div>
              New NIT Durgapur student?{' '}
              <Link href="/register" className="text-[#689f38] font-bold hover:underline">
                Register with College Email
              </Link>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500">
              Restricted strictly to verified campus operations personnel.
            </div>
          )}
        </div>
      </div>
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
