'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  Shirt,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Camera,
  CreditCard,
  Banknote,
  AlertCircle,
  Sparkles,
  Info,
  Lock,
  ExternalLink,
  ChevronRight,
  QrCode,
  Tag,
  Check
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ClothPhoto {
  id: string;
  dataUrl: string;
  name: string;
  notes: string;
}

interface LaundryCheckoutDraft {
  counts: Record<string, number>;
  totalGarments: number;
  hallName: string;
  roomNumber: string;
  pickupDate: string;
  pickupTime: string;
  returnTime: string;
  specialInstructions: string;
  clothPhotos: ClothPhoto[];
  tariff: any;
  itemRates: Record<string, number>;
  laundryBaseAmount: number;
  serviceChargeAmount: number;
  totalOrderAmount: number;
  paymentMethod?: 'ONLINE' | 'COD';
}

const ITEM_ICONS: Record<string, string> = {
  'Shirt': '👔',
  'T-Shirt': '👕',
  'Pants': '👖',
  'Jeans': '👖',
  'Kurta': '👘',
  'Bedsheet': '🛏️',
  'Towel': '🧖',
  'Blanket': '🛋️',
};

export default function LaundryCheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [draft, setDraft] = useState<LaundryCheckoutDraft | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);

  // Payment Selection: ONLINE (full) vs COD (advance handling fee)
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sandbox modal fallback if live Razorpay script is unavailable / blocked
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [pendingSandboxData, setPendingSandboxData] = useState<{
    order: any;
    razorpay: any;
  } | null>(null);

  // Confirmed Order state
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);

  // Load draft from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('CB_LAUNDRY_CHECKOUT_DRAFT') || sessionStorage.getItem('laundry_checkout_draft');
      if (stored) {
        const parsed: LaundryCheckoutDraft = JSON.parse(stored);
        setDraft(parsed);
        if (parsed.paymentMethod) {
          setPaymentMethod(parsed.paymentMethod);
        }
      }
    } catch (e) {
      console.warn('Could not parse laundry checkout draft', e);
    } finally {
      setLoadingDraft(false);
    }
  }, []);

  // Dynamically load Razorpay SDK
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Recalculate totals based on draft
  const counts = draft?.counts || {};
  const totalGarments = draft?.totalGarments || Object.values(counts).reduce((a, b) => a + b, 0);

  const tariff = draft?.tariff || {
    providerPricePerUnit: 15,
    serviceChargePerUnit: 1,
    studentPricePerUnit: 16
  };
  const itemRates = draft?.itemRates || {};

  const laundryBaseAmount = draft?.laundryBaseAmount || Object.entries(counts).reduce((sum, [type, qty]) => {
    const rate = itemRates[type] !== undefined ? itemRates[type] : (tariff.providerPricePerUnit || 15);
    return sum + rate * qty;
  }, 0);

  const serviceChargeAmount = draft?.serviceChargeAmount || ((tariff.serviceChargePerUnit || 1) * totalGarments);
  const totalOrderAmount = draft?.totalOrderAmount || (laundryBaseAmount + serviceChargeAmount);

  // Financial Breakdown:
  // ONLINE: Student pays full totalOrderAmount now via Razorpay
  // COD: Student pays serviceChargeAmount advance now via Razorpay; pays laundryBaseAmount in cash to provider on delivery
  const payOnlineNow = paymentMethod === 'ONLINE' ? totalOrderAmount : serviceChargeAmount;
  const payOnDelivery = paymentMethod === 'ONLINE' ? 0 : laundryBaseAmount;

  // Handle Order Placement & Razorpay Payment
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/laundry/checkout');
      return;
    }

    if (!draft || totalGarments === 0) {
      setError('Your laundry booking basket is empty. Please select garments first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const items = Object.entries(counts).map(([type, quantity]) => ({
      itemType: type,
      quantity,
    }));

    const orderPayload = {
      hallName: draft.hallName || user?.student?.hall?.name || 'Hall 11',
      roomNumber: draft.roomNumber || user?.student?.roomNumber || '101',
      pickupDate: draft.pickupDate,
      preferredPickupTime: draft.pickupTime,
      preferredReturnTime: draft.returnTime,
      specialInstructions: draft.specialInstructions || undefined,
      items,
      paymentMethod,
      clothPhotos: (draft.clothPhotos || []).map((p) => p.dataUrl),
      photos: (draft.clothPhotos || []).map((p) => ({
        url: p.dataUrl,
        description: p.notes || p.name,
      })),
    };

    try {
      const res = await apiRequest('/api/laundry/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (!res.success || !res.laundryOrder) {
        throw new Error(res.message || 'Failed to initialize laundry booking.');
      }

      const createdOrder = res.laundryOrder;

      // Handle Razorpay Payment
      if (res.razorpay) {
        const scriptLoaded = await loadRazorpayScript();

        // If live Razorpay script fails or running in test/offline environment, provide high-fidelity sandbox payment
        if (!scriptLoaded || !window.Razorpay || res.razorpay.razorpayOrderId?.startsWith('order_rzp_mock_')) {
          setPendingSandboxData({
            order: createdOrder,
            razorpay: res.razorpay,
          });
          setShowSandboxModal(true);
          setIsProcessing(false);
          return;
        }

        // Live Razorpay Checkout
        const rzpConfig = {
          key: res.razorpay.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: res.razorpay.amount,
          currency: res.razorpay.currency || 'INR',
          name: 'Campus Basket Doorstep Laundry',
          description: paymentMethod === 'ONLINE'
            ? `Full Laundry Order #${createdOrder.orderNumber}`
            : `Advance Handling Fee #${createdOrder.orderNumber}`,
          order_id: res.razorpay.razorpayOrderId,
          image: '/icons/icon-192x192.svg',
          prefill: {
            name: user?.student?.fullName || (user as any)?.fullName || 'Campus Resident',
            email: user?.email || '',
            contact: user?.student?.mobileNumber || (user as any)?.mobileNumber || '',
          },
          theme: {
            color: '#2e7d32',
            backdrop_color: 'rgba(23, 32, 51, 0.85)',
          },
          modal: {
            confirm_close: true,
            animation: true,
            ondismiss: function () {
              setIsProcessing(false);
              setError('Razorpay payment window closed. You can retry anytime.');
            },
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await apiRequest('/api/payments/verify', {
                method: 'POST',
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              if (verifyRes.success) {
                // Clear draft
                sessionStorage.removeItem('CB_LAUNDRY_CHECKOUT_DRAFT');
                sessionStorage.removeItem('laundry_checkout_draft');
                setOrderConfirmed(createdOrder);
              } else {
                setError('Payment verification failed. Please contact campus support.');
                setIsProcessing(false);
              }
            } catch (vErr: any) {
              setError(vErr.message || 'Payment signature verification error.');
              setIsProcessing(false);
            }
          },
        };

        const rzp = new window.Razorpay(rzpConfig);
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessing(false);
          setError(`Payment failed: ${resp.error?.description || 'Transaction unsuccessful'}. You can retry or switch payment mode.`);
        });
        rzp.open();
      } else {
        // Direct confirmation if 0 online payable
        sessionStorage.removeItem('CB_LAUNDRY_CHECKOUT_DRAFT');
        sessionStorage.removeItem('laundry_checkout_draft');
        setOrderConfirmed(createdOrder);
      }
    } catch (err: any) {
      setError(err.message || 'Error scheduling laundry order.');
      setIsProcessing(false);
    }
  };

  // Sandbox simulated verification handler
  const handleSimulateSandboxPayment = async () => {
    if (!pendingSandboxData) return;
    setIsProcessing(true);
    try {
      const mockPaymentId = `pay_sim_${Date.now()}`;
      const mockSignature = `sig_sim_${Date.now()}`;

      const verifyRes = await apiRequest('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpayOrderId: pendingSandboxData.razorpay.razorpayOrderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature,
        }),
      });

      if (verifyRes.success) {
        sessionStorage.removeItem('CB_LAUNDRY_CHECKOUT_DRAFT');
        sessionStorage.removeItem('laundry_checkout_draft');
        setShowSandboxModal(false);
        setOrderConfirmed(pendingSandboxData.order);
      } else {
        setError('Sandbox verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // State 1: Loading
  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#2e7d32]/20 border-t-[#2e7d32] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-500">Loading your laundry checkout draft...</p>
        </div>
      </div>
    );
  }

  // State 2: Order Confirmed Screen
  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8 relative">
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#e8f5e9] rounded-full blur-3xl pointer-events-none" />

          {/* Success Icon */}
          <div className="w-20 h-20 bg-[#e8f5e9] text-[#2e7d32] rounded-3xl flex items-center justify-center mx-auto border-2 border-[#c8e6c9] shadow-sm">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>

          {/* Title & Badge */}
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5e9] text-[#2e7d32] text-xs font-extrabold uppercase tracking-wider border border-[#c8e6c9]">
              <Check className="w-3.5 h-3.5" /> Booking Verified &amp; Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Order #{orderConfirmed.orderNumber}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              Doorstep pickup scheduled for <strong className="text-gray-900">{draft?.hallName || 'Your Hall'}, Room {draft?.roomNumber || 'Room'}</strong>.
            </p>
          </div>

          {/* Dual-OTP Security Banner */}
          <div className="bg-[#f1f8e9] border border-[#c5e1a5] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#2e7d32] font-black text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" /> In-App Dual-OTP Protocol Active
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              For anti-theft security, your <strong>Pickup OTP</strong> and <strong>Delivery OTP</strong> are never emailed. They will be generated strictly inside your <strong>Campus Basket Laundry Dashboard</strong> once the delivery executive arrives at your hall.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#33691e] font-semibold">
              <QrCode className="w-4 h-4" /> Zero-Email &bull; Handover Verification Only
            </div>
          </div>

          {/* Ledger Summary */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3 text-xs">
            <div className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b border-gray-200 pb-2 flex items-center justify-between">
              <span>Financial Ledger Breakdown</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white border border-gray-200 text-gray-700">
                {paymentMethod === 'ONLINE' ? '100% Paid Online' : 'COD Active (Advance Paid)'}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Laundry Base Cleaning:</span>
              <span className="font-semibold text-gray-900">₹{orderConfirmed.laundryBaseAmount || laundryBaseAmount}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Handling / Service Charge:</span>
              <span className="font-semibold text-gray-900">₹{orderConfirmed.serviceChargeAmount || serviceChargeAmount}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
              <span>Total Order Value:</span>
              <span>₹{orderConfirmed.totalAmount || totalOrderAmount}</span>
            </div>
            <div className="flex justify-between text-[#2e7d32] font-bold">
              <span>Paid via Razorpay Online:</span>
              <span>₹{paymentMethod === 'ONLINE' ? (orderConfirmed.totalAmount || totalOrderAmount) : (orderConfirmed.serviceChargeAmount || serviceChargeAmount)}</span>
            </div>
            {paymentMethod === 'COD' && (
              <div className="flex justify-between text-amber-800 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <span>Due in Cash upon Delivery:</span>
                <span>₹{orderConfirmed.laundryBaseAmount || laundryBaseAmount}</span>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/laundry"
              className="flex-1 py-3.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm text-center transition flex items-center justify-center gap-2"
            >
              <span>Go to Laundry Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/laundry/book"
              className="py-3.5 px-5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs uppercase tracking-wider rounded-2xl text-center transition"
            >
              Book Another Service
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Empty Draft Fallback
  if (!draft || totalGarments === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
            <Shirt className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900">No Laundry Booking In Progress</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Please configure your garments, pickup slot, and residence hall room details before checking out.
          </p>
          <Link
            href="/laundry"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2e7d32] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm hover:bg-[#1b5e20] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Configure Laundry Booking
          </Link>
        </div>
      </div>
    );
  }

  // State 4: Dedicated Full-Featured Checkout Page
  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
              <Link href="/laundry" className="hover:text-gray-900 transition flex items-center gap-1">
                <Shirt className="w-3.5 h-3.5 text-[#2e7d32]" /> Laundry Service
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-900 font-bold">Secure Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <span>Laundry Order Review &amp; Checkout</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold border border-[#c8e6c9]">
                <Lock className="w-3 h-3" /> SSL 256-Bit
              </span>
            </h1>
          </div>

          <Link
            href="/laundry"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 self-start sm:self-auto py-2 px-3 rounded-xl hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Edit Garments
          </Link>
        </div>

        {/* Stepper Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="flex items-center gap-2 sm:justify-center">
              <div className="w-6 h-6 rounded-full bg-[#2e7d32] text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div className="text-left">
                <div className="text-[10px] text-gray-400 uppercase font-bold">Step 1</div>
                <div className="text-xs font-bold text-gray-900">Garments &amp; Specs</div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:justify-center border-l border-gray-100 pl-2">
              <div className="w-6 h-6 rounded-full bg-[#2e7d32] text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div className="text-left">
                <div className="text-[10px] text-gray-400 uppercase font-bold">Step 2</div>
                <div className="text-xs font-bold text-gray-900">Room &amp; Slots</div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:justify-center border-l border-gray-100 pl-2">
              <div className="w-6 h-6 rounded-full bg-[#2e7d32] text-white flex items-center justify-center text-xs font-black ring-4 ring-[#e8f5e9]">
                3
              </div>
              <div className="text-left">
                <div className="text-[10px] text-[#2e7d32] uppercase font-bold">Step 3</div>
                <div className="text-xs font-black text-gray-900">Review &amp; Payment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="space-y-1">
              <strong className="font-bold block">Checkout Notice:</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Comprehensive Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. Student Hall & Logistics Card */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2e7d32]" /> Doorstep Pickup Location
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
                  Verified Student Hall
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Student Resident</span>
                  <div className="font-bold text-gray-900 text-sm">
                    {user?.student?.fullName || (user as any)?.fullName || 'Campus Resident'}
                  </div>
                  <div className="text-gray-500">
                    Roll: <span className="font-mono text-gray-700">{user?.student?.rollNumber || 'Active Student'}</span>
                  </div>
                  <div className="text-gray-500">
                    Contact: <span className="text-gray-700">{user?.student?.mobileNumber || (user as any)?.mobileNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Hostel Room Dispatch</span>
                  <div className="font-bold text-gray-900 text-sm">
                    {draft.hallName || 'Hall 11'}, Room {draft.roomNumber || '101'}
                  </div>
                  <div className="text-gray-500">
                    NIT Durgapur Residential Campus
                  </div>
                  <div className="text-[11px] text-[#2e7d32] font-semibold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Door-to-Door Delivery Assured
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Schedule & Turnaround Card */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#2e7d32]" /> Pickup &amp; Return Window
                </h3>
                <span className="text-xs font-semibold text-gray-500">
                  24–48h Turnaround
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#f1f8e9]/50 border border-[#dcedc8] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2e7d32] uppercase">
                    <Clock className="w-3.5 h-3.5" /> Scheduled Pickup
                  </div>
                  <div className="text-sm font-black text-gray-900">
                    {draft.pickupDate ? new Date(draft.pickupDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Next Available Slot'}
                  </div>
                  <div className="text-xs font-medium text-gray-600">
                    Slot: <strong className="text-gray-900">{draft.pickupTime}</strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 uppercase">
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> Estimated Clean Return
                  </div>
                  <div className="text-sm font-black text-gray-900">
                    Within 24–48 Hours
                  </div>
                  <div className="text-xs font-medium text-gray-600">
                    Slot: <strong className="text-gray-900">{draft.returnTime}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Itemized Garments Breakdown Card */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-[#2e7d32]" /> Itemized Garments ({totalGarments} Items)
                </h3>
                <Link
                  href="/laundry"
                  className="text-xs font-bold text-[#2e7d32] hover:underline"
                >
                  Edit Counts
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {Object.entries(counts).map(([type, qty]) => {
                  const unitRate = itemRates[type] !== undefined ? itemRates[type] : (tariff.providerPricePerUnit || 15);
                  const itemSubtotal = unitRate * qty;
                  const icon = ITEM_ICONS[type] || '👔';

                  return (
                    <div key={type} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg border border-gray-100">
                          {icon}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{type}</div>
                          <div className="text-[11px] text-gray-500">
                            ₹{unitRate} base rate &bull; Wash &amp; Steam Press
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-gray-900">
                          {qty} &times; ₹{unitRate} = <span className="text-sm font-black">₹{itemSubtotal}</span>
                        </div>
                        <div className="text-[10px] text-[#2e7d32] font-semibold">
                          + ₹{tariff.serviceChargePerUnit || 1} SC / item
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Garment Photos & Anti-Loss Protection Card */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#2e7d32]" /> Garment Anti-Loss &amp; Tagging Gallery
                </h3>
                <span className="text-xs font-bold text-[#2e7d32]">
                  {draft.clothPhotos?.length || 0} Attached
                </span>
              </div>

              {draft.clothPhotos && draft.clothPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {draft.clothPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square shadow-xs"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.name || `Garment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                        <div className="text-[10px] font-bold truncate">{photo.name || `Cloth #${idx + 1}`}</div>
                        {photo.notes && (
                          <div className="text-[8px] text-gray-200 truncate">{photo.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-500">
                  No individual photos attached. Doorstep executive will perform visual count verification upon pickup.
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[#f1f8e9] border border-[#dcedc8] flex items-start gap-2.5 text-xs text-[#2e7d32]">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2e7d32]" />
                <p className="leading-relaxed text-[11px] text-[#33691e]">
                  <strong>Campus Basket Anti-Loss Guarantee:</strong> All clothes are tagged with individual barcode labels during doorstep pickup in student presence. Verified against this audit log before final return.
                </p>
              </div>
            </div>

            {/* 5. Special Instructions (if any) */}
            {draft.specialInstructions && (
              <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 space-y-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Fabric &amp; Handling Instructions
                </h3>
                <p className="text-xs text-gray-800 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 italic">
                  &ldquo;{draft.specialInstructions}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Payment & Order Confirmation (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">

            {/* Payment Method Selector Card */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#2e7d32]" /> Choose Payment Method
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Secure transaction via Razorpay with Dual-OTP verification
                </p>
              </div>

              {/* Option A: Full Online Payment */}
              <div
                onClick={() => setPaymentMethod('ONLINE')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                  paymentMethod === 'ONLINE'
                    ? 'border-[#2e7d32] bg-[#f1f8e9]/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'ONLINE' ? 'border-[#2e7d32] bg-[#2e7d32]' : 'border-gray-400'
                    }`}>
                      {paymentMethod === 'ONLINE' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                        <span>Pay Online via Razorpay</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Pay entire <strong className="text-gray-900">₹{totalOrderAmount}</strong> online. Zero cash exchange required at doorstep.
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-gray-900">₹{totalOrderAmount}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] text-[#2e7d32] font-semibold border-t border-[#dcedc8] pt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> UPI &bull; GPay &bull; PhonePe &bull; Cards &bull; NetBanking
                </div>
              </div>

              {/* Option B: Cash on Delivery (COD) */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                  paymentMethod === 'COD'
                    ? 'border-[#2e7d32] bg-[#f1f8e9]/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'COD' ? 'border-[#2e7d32] bg-[#2e7d32]' : 'border-gray-400'
                    }`}>
                      {paymentMethod === 'COD' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                        <span>Cash on Delivery (COD)</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                          Advance Slot Confirmation
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Pay <strong className="text-[#2e7d32]">₹{serviceChargeAmount}</strong> handling charge ({totalGarments} dresses &times; ₹{tariff.serviceChargePerUnit || 1}) online now via Razorpay. Pay <strong className="text-gray-900">₹{laundryBaseAmount}</strong> in cash to provider upon delivery.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-bold border-t border-gray-200 pt-2 text-gray-700">
                  <span className="text-[#2e7d32]">Online Advance: ₹{serviceChargeAmount}</span>
                  <span className="text-amber-800">Cash on Return: ₹{laundryBaseAmount}</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Breakdown Card */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 space-y-4">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900">Financial Ledger Summary</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  Itemized
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Laundry Base Cleaning ({totalGarments} garments):</span>
                  <span className="font-semibold text-gray-900">₹{laundryBaseAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    Campus Basket Handling / Service Fee:
                    <span className="text-[10px] text-gray-400">({totalGarments} &times; ₹{tariff.serviceChargePerUnit || 1})</span>
                  </span>
                  <span className="font-semibold text-gray-900">₹{serviceChargeAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-100 pt-2 flex items-center justify-between font-bold text-gray-900">
                  <span>Total Order Value:</span>
                  <span className="text-sm">₹{totalOrderAmount.toFixed(2)}</span>
                </div>

                {/* Prominent Payment Box */}
                <div className="p-4 rounded-2xl bg-[#e8f5e9] border border-[#c8e6c9] space-y-2 mt-4">
                  <div className="flex items-center justify-between text-xs font-black text-[#2e7d32]">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" /> Amount Payable Now (Razorpay):
                    </span>
                    <span className="text-xl font-black">₹{payOnlineNow.toFixed(2)}</span>
                  </div>

                  {paymentMethod === 'COD' && (
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 border-t border-[#c8e6c9]/60 pt-2">
                      <span>Due on Doorstep Delivery (Cash):</span>
                      <span className="text-xs font-black">₹{payOnDelivery.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout Trigger Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={isProcessing}
                className={`w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-md transition flex items-center justify-center gap-2 ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#2e7d32] hover:bg-[#1b5e20] active:scale-[0.99]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Contacting Razorpay Gateway...</span>
                  </>
                ) : paymentMethod === 'ONLINE' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{payOnlineNow} via Razorpay &amp; Confirm Booking</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{payOnlineNow} Advance &amp; Confirm COD Booking</span>
                  </>
                )}
              </button>

              {/* Security & Razorpay Badges */}
              <div className="text-center space-y-1.5 pt-2">
                <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-gray-500">
                  <span className="flex items-center gap-1 text-[#2e7d32]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Powered by Razorpay
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Lock className="w-3 h-3 text-gray-400" /> 100% Encrypted
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  After payment verification, your booking is confirmed instantly with Dual-OTP handover protection.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sandbox Simulator Modal for local/test environments */}
      {showSandboxModal && pendingSandboxData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-gray-200 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">Razorpay Sandbox Gateway</h4>
                  <p className="text-[10px] text-gray-500">Local &amp; Test Environment Simulator</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Test Mode
              </span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Order Reference:</span>
                <span className="font-mono font-bold text-gray-900">#{pendingSandboxData.order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Razorpay Order ID:</span>
                <span className="font-mono text-gray-700 truncate max-w-[200px]">{pendingSandboxData.razorpay.razorpayOrderId}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Purpose:</span>
                <span className="font-semibold text-gray-800">
                  {paymentMethod === 'ONLINE' ? 'Full Laundry Payment' : 'Service Charge Advance'}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black text-[#2e7d32]">
                <span>Payable Amount:</span>
                <span>₹{payOnlineNow.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Click below to simulate a successful UPI/Card payment response and cryptographically verify the signature on the backend.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSimulateSandboxPayment}
                disabled={isProcessing}
                className="flex-1 py-3 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Authorize Payment (₹{payOnlineNow})</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowSandboxModal(false)}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
