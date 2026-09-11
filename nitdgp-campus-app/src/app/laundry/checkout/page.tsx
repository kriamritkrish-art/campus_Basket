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
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Camera,
  CreditCard,
  Banknote,
  AlertCircle,
  Lock,
  ChevronRight,
  Check,
  ShieldCheck
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
  // COD: Direct payment to laundry partner (cash or via provider's payment scanner). No advance gateway charge required.
  const payOnlineNow = paymentMethod === 'ONLINE' ? totalOrderAmount : 0;
  const payOnDelivery = paymentMethod === 'ONLINE' ? 0 : totalOrderAmount;

  // Format dates for pickup & return
  const pickupDateFormatted = draft?.pickupDate
    ? new Date(draft.pickupDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Tomorrow';

  const returnDateFormatted = draft?.pickupDate
    ? new Date(new Date(draft.pickupDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Next Day';

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

        // If live Razorpay script fails or running in test/mock environment, provide sandbox simulator
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
          name: 'Campus Basket Laundry',
          description: paymentMethod === 'ONLINE'
            ? `Full Laundry Order #${createdOrder.orderNumber}`
            : `Advance Service Charge #${createdOrder.orderNumber}`,
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
          const err = resp?.error || {};
          const text = `${err.description || ''} ${err.code || ''} ${err.reason || ''}`.toLowerCase();
          let msg = 'Payment could not be completed. Please check your payment details and try again.';
          if (text.includes('account') || text.includes('bank') || text.includes('vpa') || text.includes('beneficiary')) {
            msg = 'Payment could not be completed because the required payment account details are missing or invalid.';
          } else if (text.includes('timeout') || text.includes('timed out')) {
            msg = 'Your payment is being verified. Please do not make another payment until the current payment status is confirmed.';
          }
          setError(`${msg} You can retry anytime.`);

          // Record failure to server for unified ledger audit trail
          apiRequest('/api/payments/record-failure', {
            method: 'POST',
            body: JSON.stringify({
              orderId: createdOrder?.id,
              razorpayOrderId: res.razorpay?.razorpayOrderId,
              razorpayPaymentId: err.metadata?.payment_id,
              errorCode: err.code,
              errorDescription: err.description,
              errorReason: err.reason,
              errorSource: err.source,
              errorStep: err.step
            })
          }).catch(() => {});
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#2e7d32]/20 border-t-[#2e7d32] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-gray-500">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  // State 2: Order Confirmed Screen
  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-[#e8f5e9] text-[#2e7d32] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
          </div>

          {/* Title & Badge */}
          <div className="text-center space-y-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#2e7d32] text-[11px] font-bold">
              <Check className="w-3 h-3" /> Booking Confirmed
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{orderConfirmed.orderNumber}
            </h1>
            <p className="text-xs text-gray-600">
              Doorstep pickup scheduled for <strong className="text-gray-900">{draft?.hallName || 'Your Hall'}, Room {draft?.roomNumber || 'Room'}</strong>.
            </p>
          </div>

          {/* Dual-OTP Security Banner */}
          <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#2e7d32] font-bold text-xs">
              <ShieldCheck className="w-4 h-4" /> Dual-OTP Handover Protected
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your <strong>Pickup OTP</strong> and <strong>Delivery OTP</strong> are kept strictly confidential inside your Laundry Dashboard and will activate when the executive arrives at your room.
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 space-y-2.5 text-xs">
            <div className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-2 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-[11px] font-semibold text-gray-600">
                {paymentMethod === 'ONLINE' ? 'Paid Online' : 'Cash on Delivery'}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Laundry charges:</span>
              <span className="font-semibold text-gray-900">₹{orderConfirmed.laundryBaseAmount || laundryBaseAmount}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Campus Basket service charge:</span>
              <span className="font-semibold text-gray-900">₹{orderConfirmed.serviceChargeAmount || serviceChargeAmount}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
              <span>Total:</span>
              <span>₹{orderConfirmed.totalAmount || totalOrderAmount}</span>
            </div>
            <div className="flex justify-between text-[#2e7d32] font-semibold">
              <span>Paid online:</span>
              <span>₹{paymentMethod === 'ONLINE' ? (orderConfirmed.totalAmount || totalOrderAmount) : (orderConfirmed.serviceChargeAmount || serviceChargeAmount)}</span>
            </div>
            {paymentMethod === 'COD' && (
              <div className="flex justify-between text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                <span>Due in cash upon delivery:</span>
                <span>₹{orderConfirmed.laundryBaseAmount || laundryBaseAmount}</span>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/laundry"
              className="flex-1 py-3 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-semibold text-xs rounded-xl shadow-sm text-center transition flex items-center justify-center gap-1.5"
            >
              <span>View Laundry Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/"
              className="py-3 px-5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs rounded-xl text-center transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Empty Draft Fallback
  if (!draft || totalGarments === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
            <Shirt className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">No Laundry Booking in Progress</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Please select your garments, pickup slot, and residence hall room details before checking out.
          </p>
          <Link
            href="/laundry"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#2e7d32] text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-[#1b5e20] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Start Laundry Order
          </Link>
        </div>
      </div>
    );
  }

  // State 4: Dedicated E-Commerce Style Laundry Checkout
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-28 md:pb-12 text-gray-900">
      {/* Minimal Campus Basket Header */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#4F9D2F] flex items-center justify-center text-white font-extrabold text-xs shadow-xs group-hover:bg-[#36751F] transition-colors">
              cb
            </div>
            <div>
              <div className="font-extrabold text-[#172033] text-base tracking-tight leading-none">
                campus<span className="text-[#4F9D2F]">basket</span>
              </div>
              <div className="text-[9px] sm:text-[9.5px] font-semibold tracking-wider text-[#667085] uppercase mt-0.5">
                CAMPUS MARKETPLACE &amp; SERVICES
              </div>
            </div>
          </Link>

          <Link
            href="/laundry"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition py-1.5 px-3 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Back to Laundry</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 w-full">

        {/* 1. Top Header */}
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <Link
              href="/laundry"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
              <span>Laundry</span>
            </Link>

            <Link
              href="/laundry"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2e7d32] hover:text-[#1b5e20] transition"
            >
              <span>← Edit garments</span>
            </Link>
          </div>

          <div className="space-y-1">
            <h1 className="text-[26px] sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
              Laundry Checkout
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Review your order and complete payment
            </p>
            <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-0.5">
              <span>🔒 Secure payment • Razorpay • Dual-OTP protected</span>
            </div>
          </div>
        </header>

        {/* 2. Checkout Progress Stepper */}
        <nav aria-label="Checkout Steps" className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-xs">
          <div className="flex items-center justify-between max-w-xl mx-auto text-xs">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2e7d32] text-white flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              <span className="font-semibold text-gray-700">Garments</span>
            </div>

            <div className="flex-1 mx-3 sm:mx-4 h-0.5 bg-[#2e7d32]/30 rounded-full" />

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2e7d32] text-white flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              <span className="font-semibold text-gray-700">Pickup &amp; Return</span>
            </div>

            <div className="flex-1 mx-3 sm:mx-4 h-0.5 bg-[#2e7d32]/30 rounded-full" />

            {/* Step 3 (Active) */}
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2e7d32] text-white flex items-center justify-center text-[11px] font-bold ring-2 ring-[#e8f5e9]">
                3
              </span>
              <span className="font-bold text-[#2e7d32]">Review &amp; Payment</span>
            </div>
          </div>
        </nav>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="space-y-0.5">
              <strong className="font-semibold block">Checkout Notice:</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* 4. Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* 5. Left Column: Order Information (approx 66% width) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">

            {/* SECTION ①: ORDER REVIEW */}
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight uppercase">
                    ① ORDER REVIEW
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                    {totalGarments} {totalGarments === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
                <Link
                  href="/laundry"
                  className="text-xs font-medium text-[#2e7d32] hover:underline"
                >
                  Edit garments
                </Link>
              </div>

              {/* Garment Rows */}
              <div className="divide-y divide-gray-100">
                {Object.entries(counts).map(([type, qty]) => {
                  const baseRate = itemRates[type] !== undefined ? itemRates[type] : (tariff.providerPricePerUnit || 15);
                  const serviceRate = tariff.serviceChargePerUnit || 1;
                  const perItemTotal = baseRate + serviceRate;
                  const rowTotal = perItemTotal * qty;
                  const icon = ITEM_ICONS[type] || '👔';

                  return (
                    <div key={type} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200/60 flex items-center justify-center text-base flex-shrink-0">
                          {icon}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-900 text-xs sm:text-sm">
                            {type} × {qty}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            ₹{perItemTotal} / item <span className="text-gray-400 font-normal">(₹{baseRate} laundry + ₹{serviceRate} service)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">
                          ₹{rowTotal}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION ②: PICKUP & RETURN */}
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight uppercase">
                  ② PICKUP &amp; RETURN
                </h2>
                <Link
                  href="/laundry"
                  className="text-xs font-medium text-[#2e7d32] hover:underline"
                >
                  Edit slot
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Location */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[#2e7d32]" />
                    <span>Pickup Location</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {draft.hallName || 'Gargi Hall'}
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    Room {draft.roomNumber || '101'}
                  </div>
                </div>

                {/* Pickup Slot */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-[#2e7d32]" />
                    <span>Pickup</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {pickupDateFormatted}
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    {draft.pickupTime || '8:00 AM – 10:00 AM'}
                  </div>
                </div>

                {/* Return Slot */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#2e7d32]" />
                    <span>Return</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {returnDateFormatted}
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    {draft.returnTime || '5:00 PM – 7:00 PM'}
                  </div>
                </div>
              </div>

              {/* Special Instructions (compact) */}
              {draft.specialInstructions && (
                <div className="bg-gray-50/60 rounded-lg px-3 py-2 border border-gray-100 text-[11px] text-gray-600 flex items-start gap-1.5">
                  <span className="font-medium text-gray-500">Note:</span>
                  <span className="italic">&ldquo;{draft.specialInstructions}&rdquo;</span>
                </div>
              )}
            </section>

            {/* SECTION ③: GARMENT PROTECTION */}
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight uppercase">
                    ③ GARMENT PROTECTION
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                    Optional
                  </span>
                </div>
                {draft.clothPhotos && draft.clothPhotos.length > 0 && (
                  <span className="text-xs font-semibold text-[#2e7d32]">
                    {draft.clothPhotos.length} {draft.clothPhotos.length === 1 ? 'photo' : 'photos'}
                  </span>
                )}
              </div>

              {draft.clothPhotos && draft.clothPhotos.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2.5">
                    {draft.clothPhotos.map((photo, idx) => (
                      <div
                        key={photo.id || idx}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0"
                      >
                        <img
                          src={photo.dataUrl}
                          alt={photo.name || `Garment ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1">
                    <span className="text-[#2e7d32]">✓</span>
                    <span>Each garment is tagged and verified against these photos during doorstep pickup.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs text-gray-600 space-y-1">
                  <div className="text-gray-500 font-medium">No photos uploaded</div>
                  <div className="text-[11px] text-gray-700 flex items-center gap-1.5">
                    <span className="text-[#2e7d32] font-bold">✓</span>
                    <span>Each garment is tagged and verified during doorstep pickup.</span>
                  </div>
                </div>
              )}
            </section>

          </div>

          {/* 6. Right Column: Sticky Payment & Order Total Panel (approx 34% width) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-6">

            {/* PAYMENT METHOD Card */}
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight uppercase">
                  PAYMENT METHOD
                </h2>
                <p className="text-xs text-gray-500">
                  Choose how you'd like to pay for this laundry order.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* OPTION 1: Pay Online */}
                <div
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    paymentMethod === 'ONLINE'
                      ? 'border-[#2e7d32] bg-[#f1f8e9]/60 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'ONLINE' ? 'border-[#2e7d32] bg-[#2e7d32]' : 'border-gray-400'
                      }`}>
                        {paymentMethod === 'ONLINE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">Pay Online</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
                            Recommended
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">₹{totalOrderAmount} now</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        Pay the full order amount securely online.
                      </p>
                      <div className="text-[10px] text-gray-400 mt-1">
                        UPI • Cards • NetBanking • GPay • PhonePe
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPTION 2: Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    paymentMethod === 'COD'
                      ? 'border-[#2e7d32] bg-[#f1f8e9]/60 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'COD' ? 'border-[#2e7d32] bg-[#2e7d32]' : 'border-gray-400'
                      }`}>
                        {paymentMethod === 'COD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">Pay Directly to Laundry Partner (COD / Scanner)</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#2e7d32] mt-0.5">
                        ₹0 advance required
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                        Pay ₹{totalOrderAmount} directly to dhobi in cash or scan their UPI QR code on acceptance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ORDER TOTAL Card */}
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                ORDER TOTAL
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Laundry charges</span>
                  <span className="font-semibold text-gray-900">₹{laundryBaseAmount}</span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span>Campus Basket service charge</span>
                  <span className="font-semibold text-gray-900">₹{serviceChargeAmount}</span>
                </div>

                <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">TOTAL</span>
                  <span className="font-bold text-gray-900 text-xl sm:text-2xl">₹{totalOrderAmount}</span>
                </div>

                {paymentMethod === 'COD' && (
                  <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200 text-[11px] text-amber-900 space-y-0.5 mt-2">
                    <div className="font-semibold">Laundry COD Payment:</div>
                    <div className="flex justify-between">
                      <span>Online advance:</span>
                      <strong className="text-[#2e7d32]">₹0 (Free Booking)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pay to Laundry Partner (Cash or Scanner):</span>
                      <strong className="text-gray-900">₹{totalOrderAmount}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={isProcessing}
                className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm text-white shadow-sm transition flex items-center justify-center gap-2 ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#2e7d32] hover:bg-[#1b5e20] active:scale-[0.99]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Booking...</span>
                  </>
                ) : paymentMethod === 'ONLINE' ? (
                  <span>PAY ₹{payOnlineNow} &amp; CONFIRM BOOKING →</span>
                ) : (
                  <span>CONFIRM LAUNDRY BOOKING (COD ₹{totalOrderAmount}) →</span>
                )}
              </button>

              {/* Single Reassuring Security Line */}
              <div className="text-center pt-1">
                <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                  <span>🔒 Secure payment • Razorpay • Dual-OTP protected</span>
                </p>
              </div>
            </section>

          </div>

        </div>

      </main>

      {/* 16. Mobile Sticky Bottom Payment CTA (Visible on Mobile only) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] pb-safe">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div>
            <div className="text-[11px] text-gray-500 font-medium leading-none">
              {paymentMethod === 'ONLINE' ? 'Total' : 'Advance'}
            </div>
            <div className="text-lg font-bold text-gray-900 mt-0.5">
              ₹{payOnlineNow}
            </div>
          </div>
          <button
            onClick={handleProceedToPayment}
            disabled={isProcessing}
            className="flex-1 max-w-[230px] py-3 px-4 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : paymentMethod === 'ONLINE' ? (
              <span>Pay &amp; Confirm →</span>
            ) : (
              <span>Pay Advance &amp; Confirm →</span>
            )}
          </button>
        </div>
      </div>

      {/* Sandbox Simulator Modal for local/test environments */}
      {showSandboxModal && pendingSandboxData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Razorpay Sandbox Gateway</h4>
                  <p className="text-[10px] text-gray-500">Test Simulator</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Sandbox
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Order Reference:</span>
                <span className="font-mono font-bold text-gray-900">#{pendingSandboxData.order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Purpose:</span>
                <span className="font-semibold text-gray-800">
                  {paymentMethod === 'ONLINE' ? 'Full Laundry Payment' : 'Service Charge Advance'}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-[#2e7d32]">
                <span>Payable Amount:</span>
                <span>₹{payOnlineNow}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Click below to simulate a successful payment response and verify the cryptographic signature on the backend.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={handleSimulateSandboxPayment}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize Payment (₹{payOnlineNow})</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowSandboxModal(false)}
                className="py-2.5 px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition"
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
