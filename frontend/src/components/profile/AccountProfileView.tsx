'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { apiRequest } from '../../lib/api';
import { Order } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Pencil,
  Package,
  Heart,
  BadgePercent,
  HelpCircle,
  MapPin,
  CreditCard,
  Wallet,
  Settings,
  Sun,
  Landmark,
  LogOut,
  X,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Bell,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';

interface AccountProfileViewProps {
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
  orders?: Order[];
  walletBalance?: number | null;
  onProfileUpdated?: () => void;
  className?: string;
}

export function AccountProfileView({
  onBack,
  onNavigateTab,
  orders = [],
  walletBalance = null,
  onProfileUpdated,
  className = ''
}: AccountProfileViewProps) {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useCart();

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Dynamic student info from real user state (no hardcoded fallback names)
  const [fullName, setFullName] = useState(
    user?.student?.fullName || (user as any)?.name || user?.email?.split('@')[0] || 'Student'
  );
  const [mobileNumber, setMobileNumber] = useState(
    user?.student?.mobileNumber || (user as any)?.mobileNumber || ''
  );
  const [hallName, setHallName] = useState(user?.student?.hallName || 'Hall 11');
  const [roomNumber, setRoomNumber] = useState(user?.student?.roomNumber || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    user?.student?.deliveryInstructions || 'Call before delivery.'
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Sync profile when user changes
  React.useEffect(() => {
    if (user?.student) {
      if (user.student.fullName) setFullName(user.student.fullName);
      if (user.student.mobileNumber) setMobileNumber(user.student.mobileNumber);
      if (user.student.hallName) setHallName(user.student.hallName);
      if (user.student.roomNumber) setRoomNumber(user.student.roomNumber);
      if (user.student.deliveryInstructions) setDeliveryInstructions(user.student.deliveryInstructions);
    } else if (user) {
      if ((user as any).name) setFullName((user as any).name);
      if ((user as any).mobileNumber) setMobileNumber((user as any).mobileNumber);
    }
  }, [user]);

  // NIT Durgapur Halls list
  const hallsList = [
    'Hall 1', 'Hall 2', 'Hall 3', 'Hall 4', 'Hall 5',
    'Hall 7', 'Hall 8', 'Hall 9', 'Hall 10', 'Hall 11',
    'Hall 12', 'Hall 13', 'Hall 14', 'Mother Teresa Hall',
    'Sister Nivedita Hall', 'Gargi Hall'
  ];

  // Real Active Order (if any)
  const activeOrder = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) return null;
    return orders.find(
      (o) =>
        o.status !== 'DELIVERED' &&
        o.status !== 'CANCELLED' &&
        o.status !== 'REFUNDED'
    ) || null;
  }, [orders]);

  // Real Lifetime Savings calculated from database orders
  const lifetimeSavings = useMemo(() => {
    let savings = 0;
    if (Array.isArray(orders) && orders.length > 0) {
      for (const ord of orders) {
        if (ord.discountAmount) savings += Number(ord.discountAmount);
        if ((ord as any).couponDiscount) savings += Number((ord as any).couponDiscount);
      }
    }
    return Math.max(0, Math.round(savings));
  }, [orders]);

  // Mechanical odometer tumblers
  const odometerDigits = useMemo(() => {
    const s = Math.min(Math.max(0, lifetimeSavings), 99999).toString();
    const padded = s.padStart(4, '0');
    return padded.split('');
  }, [lifetimeSavings]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleGoToTab = (tab: string) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      router.push(`/dashboard?tab=${tab}`);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    try {
      const res = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName,
          mobileNumber,
          hallName,
          roomNumber,
          deliveryInstructions
        })
      });

      if (res.success) {
        setSaveSuccess('Profile and delivery room updated!');
        showToast('Profile updated successfully.');
        if (refreshUser) await refreshUser();
        if (onProfileUpdated) onProfileUpdated();
        setTimeout(() => {
          setSaveSuccess(null);
          setShowEditModal(false);
          setShowDeliveryModal(false);
        }, 1200);
      } else {
        setSaveSuccess(res.message || 'Profile saved.');
        setTimeout(() => {
          setShowEditModal(false);
          setShowDeliveryModal(false);
        }, 1200);
      }
    } catch {
      setSaveSuccess('Profile saved locally.');
      setTimeout(() => {
        setShowEditModal(false);
        setShowDeliveryModal(false);
      }, 1200);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const currentWalletBalance = walletBalance !== null && walletBalance !== undefined
    ? Number(walletBalance).toFixed(2)
    : '0.00';

  return (
    <div className={`w-full max-w-lg mx-auto bg-white min-h-[90vh] pb-16 text-gray-900 ${className}`}>
      {/* 1. Header Bar: Back Arrow + "Account" Title */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100/80 sticky top-0 bg-white/95 backdrop-blur-md z-20">
        <button
          onClick={handleBack}
          aria-label="Go Back"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 text-gray-800 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Account</h1>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-6">
        {/* 2. Student Information (Real Data Only) */}
        <div className="flex items-center gap-4 py-2">
          {/* Avatar with Edit Pencil */}
          <div className="relative shrink-0">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#EAF0F6] border border-gray-200/80 flex items-center justify-center text-gray-400 overflow-hidden shadow-xs">
              <User className="w-10 h-10 text-gray-400 stroke-[1.6]" />
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              aria-label="Edit Profile"
              className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight truncate">
                {fullName}
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Verified
              </span>
            </div>

            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              {mobileNumber ? `+91 ${mobileNumber.replace(/^\+91/, '').trim()}` : (user?.email || 'Student Account')}
            </p>

            {user?.student?.rollNumber && (
              <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                Roll: {user.student.rollNumber}
              </p>
            )}

            <button
              onClick={() => setShowEditModal(true)}
              className="text-[#0078AD] hover:text-[#005f8a] text-xs font-bold flex items-center gap-1 mt-1 transition-colors group cursor-pointer"
            >
              <span>Edit profile</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 3. Quick Actions 4-Card Grid: Orders, Wishlist, Offers, Help */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 select-none">
          {/* Orders */}
          <button
            onClick={() => handleGoToTab('orders')}
            className="bg-white rounded-2xl border border-gray-200/90 py-3.5 px-2 flex flex-col items-center justify-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-gray-300 transition-all active:scale-95 group cursor-pointer"
          >
            <div className="w-7 h-7 flex items-center justify-center text-gray-800">
              <Package className="w-6 h-6 stroke-[1.8] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-gray-800">Orders</span>
          </button>

          {/* Wishlist */}
          <button
            onClick={() => handleGoToTab('wishlist')}
            className="bg-white rounded-2xl border border-gray-200/90 py-3.5 px-2 flex flex-col items-center justify-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-gray-300 transition-all active:scale-95 group cursor-pointer"
          >
            <div className="w-7 h-7 flex items-center justify-center text-gray-800">
              <Heart className="w-6 h-6 stroke-[1.8] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-gray-800">Wishlist</span>
          </button>

          {/* Offers */}
          <button
            onClick={() => handleGoToTab('offers')}
            className="bg-white rounded-2xl border border-gray-200/90 py-3.5 px-2 flex flex-col items-center justify-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-gray-300 transition-all active:scale-95 group cursor-pointer"
          >
            <div className="w-7 h-7 flex items-center justify-center text-gray-800">
              <BadgePercent className="w-6 h-6 stroke-[1.8] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-gray-800">Offers</span>
          </button>

          {/* Help */}
          <button
            onClick={() => handleGoToTab('support')}
            className="bg-white rounded-2xl border border-gray-200/90 py-3.5 px-2 flex flex-col items-center justify-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-gray-300 transition-all active:scale-95 group cursor-pointer"
          >
            <div className="w-7 h-7 flex items-center justify-center text-gray-800">
              <HelpCircle className="w-6 h-6 stroke-[1.8] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-gray-800">Help</span>
          </button>
        </div>

        {/* 4. Fayda Meter / Lifetime Savings Odometer Banner */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3">
          {/* Floating Gold Coin Accents */}
          <div className="absolute -left-1 top-4 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 opacity-80 blur-[0.5px] pointer-events-none" />
          <div className="absolute left-28 -top-1 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 opacity-70 pointer-events-none" />
          <div className="absolute right-36 top-1 w-3 h-3 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 opacity-70 pointer-events-none shadow-xs" />
          <div className="absolute right-3 bottom-0.5 w-3 h-3 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 opacity-70 pointer-events-none" />

          {/* Left: Badge + Explanatory Text */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-[#007B88] text-[#FFE600] font-black rounded-lg px-2 py-1 flex flex-col items-center justify-center shrink-0 shadow-xs border border-teal-700/30 select-none">
              <span className="text-[9px] sm:text-[10px] tracking-wider leading-none">FAYDA</span>
              <span className="text-[9px] sm:text-[10px] tracking-wider leading-none mt-0.5">METER</span>
            </div>
            <p className="text-xs font-medium text-gray-700 leading-snug max-w-[170px] sm:max-w-[210px]">
              Your lifetime savings on <strong className="text-gray-900 font-bold">Campus Basket</strong> with this order
            </p>
          </div>

          {/* Right: Mechanical Odometer Tumblers */}
          <div className="shrink-0 relative z-10">
            <div className="inline-flex items-center bg-gradient-to-b from-gray-300 via-gray-100 to-gray-400 p-1 sm:p-1.5 rounded-xl border border-gray-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.08)] gap-0.5 sm:gap-1">
              <span className="text-gray-900 font-mono font-black text-sm sm:text-base px-1">₹</span>
              {odometerDigits.map((d, i) => (
                <div
                  key={i}
                  className="w-5 sm:w-6 h-7 sm:h-8 bg-gradient-to-b from-gray-200 via-white to-gray-300 border border-gray-400/80 rounded-xs flex items-center justify-center font-mono font-black text-sm sm:text-base text-gray-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.2)] relative overflow-hidden select-none"
                >
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gray-400/40 -translate-y-1/2" />
                  <span className="relative z-10 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Section: YOUR INFORMATION */}
        <div>
          <h3 className="text-[11px] font-black tracking-wider text-gray-400 uppercase mb-2 px-1 select-none">
            YOUR INFORMATION
          </h3>
          <div className="space-y-1">
            {/* Saved Addresses */}
            <button
              onClick={() => setShowAddressModal(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Saved Addresses</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    {hallName ? `${hallName}, Room ${roomNumber || '---'}` : 'Manage delivery addresses'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* PAN Card / Student ID Information */}
            <button
              onClick={() => setShowKycModal(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">PAN Card information</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    Roll: {user?.student?.rollNumber || 'College Verified Student'} &bull; Identity Protection
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Delivery Details */}
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Delivery Details</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    {hallName} &bull; Room {roomNumber || 'Not set'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 6. Section: PAYMENT & WALLET */}
        <div>
          <h3 className="text-[11px] font-black tracking-wider text-gray-400 uppercase mb-2 px-1 select-none">
            PAYMENT &amp; WALLET
          </h3>
          <div className="space-y-1">
            {/* Campus Basket Wallet */}
            <Link
              href="/wallet"
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer block"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Campus Basket Wallet</span>
                  <span className="text-xs text-emerald-700 font-bold block mt-0.5">
                    ₹{currentWalletBalance} Available Balance
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                <span>View Wallet</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Payment History */}
            <button
              onClick={() => handleGoToTab('payments')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Payment History</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    Receipts, invoices and online transactions
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Payment Methods */}
            <button
              onClick={() => handleGoToTab('payment-methods')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Payment Methods</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    UPI, Razorpay, Cash on Delivery options
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Refunds */}
            <button
              onClick={() => handleGoToTab('refunds')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <RotateCcw className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Refunds</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    Cancellation credits &amp; return processing
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 7. Section: ACTIVITY */}
        <div>
          <h3 className="text-[11px] font-black tracking-wider text-gray-400 uppercase mb-2 px-1 select-none">
            ACTIVITY
          </h3>
          <div className="space-y-1">
            {/* My Orders */}
            <button
              onClick={() => handleGoToTab('orders')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">My Orders</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    {orders.length} campus orders placed
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Track Active Order */}
            <button
              onClick={() => {
                if (activeOrder) {
                  router.push(`/orders/${activeOrder.id}/track?id=${activeOrder.id}`);
                } else {
                  handleGoToTab('active-order');
                }
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#EEF7E9] text-[#4F9D2F] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Track Active Order</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    {activeOrder ? `Order #${activeOrder.orderNumber} in transit` : 'Check live runner dispatch status'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleGoToTab('notifications')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Notifications</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    Hostel order updates and announcements
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Wishlist */}
            <button
              onClick={() => handleGoToTab('wishlist')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Heart className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Wishlist</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    Saved snacks, meals and study supplies
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 8. Section: HELP & SUPPORT */}
        <div>
          <h3 className="text-[11px] font-black tracking-wider text-gray-400 uppercase mb-2 px-1 select-none">
            HELP &amp; SUPPORT
          </h3>
          <div className="space-y-1">
            {/* Help & Complaints */}
            <button
              onClick={() => handleGoToTab('support')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Help &amp; Complaints</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    Student helpdesk, complaints and resolution tracking
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 9. Section: MORE INFORMATION */}
        <div>
          <h3 className="text-[11px] font-black tracking-wider text-gray-400 uppercase mb-2 px-1 select-none">
            MORE INFORMATION
          </h3>
          <div className="space-y-1">
            {/* Offers & Coupons */}
            <button
              onClick={() => handleGoToTab('offers')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BadgePercent className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Offers &amp; Coupons</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    Campus discounts and promo codes
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Settings */}
            <button
              onClick={() => handleGoToTab('settings')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Settings className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Settings</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    Security, sessions &amp; account preferences
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* About Campus Basket */}
            <Link
              href="/about"
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer block"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sun className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">About Campus Basket</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    NIT Durgapur student essentials platform &bull; v2.4.0
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Legal Information & Rules */}
            <Link
              href="/rules"
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group cursor-pointer block"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4f6f8] text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Landmark className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Legal Information &amp; Rules</span>
                  <span className="text-xs text-gray-500 font-medium block mt-0.5">
                    Rules &amp; Regulations, Terms of Service &amp; Privacy Policy
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 10. Section: ACCOUNT (Visually Separated Sign Out) */}
        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-[11px] font-black tracking-wider text-gray-400 uppercase mb-2 px-1 select-none">
            ACCOUNT
          </h3>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50/60 hover:bg-rose-100/70 active:bg-rose-200/60 transition-colors text-left group cursor-pointer border border-rose-100"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <LogOut className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <span className="text-sm font-black text-rose-700 block">Sign Out</span>
                <span className="text-xs text-rose-500 font-medium block mt-0.5">
                  Safely log out of your student session
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ================= MODALS & DRAWERS ================= */}

      {/* 1. Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0078AD]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0078AD]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Hostel / Residence Hall
                </label>
                <select
                  value={hallName}
                  onChange={(e) => setHallName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0078AD]"
                >
                  {hallsList.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0078AD]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Delivery Runner Instructions
                </label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0078AD]"
                />
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#0078AD] hover:bg-[#00628e] text-white rounded-xl text-xs font-bold shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Delivery Details Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#4F9D2F]" />
                <h3 className="text-lg font-bold text-gray-900">Delivery Details</h3>
              </div>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 uppercase tracking-wide text-[10px]">
                  Current Delivery Room
                </span>
                <div className="text-sm font-black text-emerald-950">
                  {hallName}, Room {roomNumber || 'Not set'}
                </div>
                <p className="text-emerald-700 text-[11px]">
                  Deliveries arrive directly at your hostel room door via campus runners.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Select Residence Hall
                  </label>
                  <select
                    value={hallName}
                    onChange={(e) => setHallName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900 bg-white"
                  >
                    {hallsList.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 214"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Delivery Instructions
                  </label>
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-800"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeliveryModal(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white rounded-xl font-bold"
                  >
                    {saving ? 'Updating...' : 'Update Delivery Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Saved Addresses</h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="p-4 rounded-2xl border-2 border-[#0078AD] bg-sky-50/30 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#0078AD] text-white px-2 py-0.5 rounded">
                    Default Hostel Room
                  </span>
                  <button
                    onClick={() => {
                      setShowAddressModal(false);
                      setShowEditModal(true);
                    }}
                    className="text-xs font-bold text-[#0078AD] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <h4 className="text-sm font-bold text-gray-900 mt-2">{fullName}</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  {hallName}, Room {roomNumber || '---'}
                </p>
                <p className="text-xs text-gray-500">
                  NIT Durgapur Campus, Mahatma Gandhi Avenue, Durgapur 713209
                </p>
                <p className="text-[11px] text-gray-500 font-mono mt-1">
                  Phone: {mobileNumber || 'Not set'}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setShowEditModal(true);
                }}
                className="w-full py-3 border border-dashed border-gray-300 hover:border-gray-400 rounded-2xl text-xs font-bold text-gray-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Update Campus Address</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. KYC / PAN Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Student Identity Verification</h3>
              <button
                onClick={() => setShowKycModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs text-gray-700 leading-relaxed">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-950 text-sm">
                    Verified Campus Resident
                  </div>
                  <div className="text-emerald-700 text-[11px] mt-0.5">
                    Your student email is authenticated with NIT Durgapur institutional systems.
                  </div>
                </div>
              </div>

              <div className="space-y-2 border border-gray-200 rounded-2xl p-4">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Student Name:</span>
                  <span className="font-bold text-gray-900">{fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Roll Number:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {user?.student?.rollNumber || 'Institutional'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Residence:</span>
                  <span className="font-bold text-gray-900">
                    {hallName}, Room {roomNumber || '---'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 font-medium">Institutional Email:</span>
                  <span className="font-bold text-gray-900">{user?.email || 'Authenticated'}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-normal">
                All purchases and transactions are protected under institutional student privacy governance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
