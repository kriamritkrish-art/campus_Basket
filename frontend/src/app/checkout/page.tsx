'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../context/GeolocationContext';
import { apiRequest } from '../../lib/api';
import { CampusLocationModal } from '../../components/layout/CampusLocationModal';
import {
  Lock,
  ShieldCheck,
  Check,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Bike,
  Sparkles,
  ArrowRight,
  CreditCard,
  Banknote,
  AlertCircle
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, discountAmount, total, appliedCoupon, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { isInsideCampus, coords } = useGeolocation();

  // Location and address
  const [hallName, setHallName] = useState<string>('Hall 11');
  const [roomNumber, setRoomNumber] = useState<string>('Room 123');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'CASH_ON_DELIVERY'>('RAZORPAY');
  const [isCodAllowed, setIsCodAllowed] = useState<boolean>(true);

  // States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);
  const [showMobileSummary, setShowMobileSummary] = useState<boolean>(false);

  // Load and sync location
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (typeof window !== 'undefined') {
      const savedHall = localStorage.getItem('cb_selected_hall') || user?.student?.hall?.name || 'Hall 11';
      const savedRoom = localStorage.getItem('cb_room_number') || user?.student?.roomNumber || 'Room 123';
      setHallName(savedHall);
      setRoomNumber(savedRoom);

      const handleLocationEvent = (e: any) => {
        if (e.detail?.hall) setHallName(e.detail.hall);
        if (e.detail?.room) setRoomNumber(e.detail.room);
      };
      window.addEventListener('cb_location_updated', handleLocationEvent);
      return () => window.removeEventListener('cb_location_updated', handleLocationEvent);
    }
  }, [isAuthenticated, user, router]);

  // Check COD eligibility
  useEffect(() => {
    if (total > 1500) {
      setIsCodAllowed(false);
      setPaymentMethod('RAZORPAY');
    } else {
      setIsCodAllowed(true);
    }
  }, [total]);

  // Load Razorpay Script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Order Placement
  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const orderPayload = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      paymentMethod,
      couponCode: appliedCoupon || undefined,
      hallName,
      roomNumber,
      specialInstructions: specialInstructions.trim() || undefined,
      location: coords || undefined,
    };

    try {
      const res = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to create campus order');
      }

      const order = res.order;

      // CASH ON DELIVERY FLOW
      if (paymentMethod === 'CASH_ON_DELIVERY') {
        clearCart();
        setOrderConfirmed(order);
        setTimeout(() => {
          router.push(`/orders/${order.id}/track?placed=true`);
        }, 1200);
        return;
      }

      // RAZORPAY FLOW
      if (paymentMethod === 'RAZORPAY' && res.razorpay) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay gateway failed to load. Please check your internet connection.');
        }

        const rzpConfig = {
          key: res.razorpay.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: res.razorpay.amount,
          currency: res.razorpay.currency,
          name: 'Campus Basket',
          description: `NIT Durgapur Hostel Order #${order.orderNumber}`,
          order_id: res.razorpay.razorpayOrderId,
          image: '/icons/icon-192x192.svg',
          prefill: {
            name: user?.student?.fullName || 'NIT Durgapur Student',
            email: user?.email || '',
            contact: user?.student?.mobileNumber || '',
          },
          theme: {
            color: '#4F9D2F',
            backdrop_color: 'rgba(23, 32, 51, 0.8)',
          },
          modal: {
            confirm_close: true,
            animation: true,
            ondismiss: function () {
              setIsProcessing(false);
              setError('Payment process was cancelled. You can retry now or choose Cash on Delivery.');
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
                clearCart();
                setOrderConfirmed(order);
                setTimeout(() => {
                  router.push(`/orders/${order.id}/track?placed=true`);
                }, 1200);
              } else {
                setError('Payment verification failed. Please contact campus support.');
                setIsProcessing(false);
              }
            } catch (vErr: any) {
              setError(vErr.message || 'Payment signature verification failed.');
              setIsProcessing(false);
            }
          },
        };

        const rzp = new window.Razorpay(rzpConfig);
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessing(false);
          setError(`Payment failed: ${resp.error.description || 'Transaction unsuccessful'}. Your cart has not been cleared. You can retry or switch to Cash on Delivery.`);
        });
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || 'Order placement failed. Please review your details and try again.');
      setIsProcessing(false);
    }
  };

  // Empty cart view
  if (items.length === 0 && !orderConfirmed) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
        {/* Minimal Checkout Header */}
        <header className="bg-white border-b border-[#E4E7EC] py-3.5 px-4 sm:px-8">
          <div className="max-w-[1240px] mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-[#172033] tracking-tight">
                campus<span className="text-[#4F9D2F]">basket</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] text-[#667085] pl-2 border-l border-gray-200">
                NIT Durgapur Campus Marketplace
              </span>
            </Link>
            <span className="text-xs font-bold text-[#667085] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#4F9D2F]" />
              Secure Checkout
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center shadow-xs">
            <div className="w-14 h-14 bg-[#EFF8EA] text-[#4F9D2F] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#172033]">Your Basket is Empty</h2>
            <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
              Explore meals, hostel stationery, fresh produce, and daily essentials across NIT Durgapur.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center justify-center gap-2 w-full py-3 bg-[#4F9D2F] hover:bg-[#397A22] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors"
            >
              <span>Browse Campus Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Order Confirmed Success Screen
  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center shadow-md animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-[#EFF8EA] text-[#4F9D2F] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#4F9D2F]">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h2 className="text-xl font-black text-[#172033]">Order Confirmed!</h2>
          <p className="text-xs font-mono font-bold text-[#4F9D2F] mt-1">
            Order #{orderConfirmed.orderNumber || 'CB10294'}
          </p>
          <p className="text-xs text-[#667085] mt-2 leading-relaxed">
            Your order has been sent to the campus delivery team and is arriving at{' '}
            <strong className="text-[#172033]">{hallName}, {roomNumber}</strong> in 10–15 minutes.
          </p>
          <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-xs text-[#667085]">
            <div className="w-3.5 h-3.5 border-2 border-[#4F9D2F] border-t-transparent rounded-full animate-spin" />
            <span>Redirecting to Live Order Tracking...</span>
          </div>
        </div>
      </div>
    );
  }

  const studentName = user?.student?.fullName || user?.email?.split('@')[0] || 'NIT Durgapur Student';
  const studentMobile = user?.student?.mobileNumber || '+91 ••••• •••••';

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172033] flex flex-col antialiased">
      {/* ======================================================== */}
      {/* 2. DEDICATED E-COMMERCE CHECKOUT HEADER                  */}
      {/* ======================================================== */}
      <header className="bg-white border-b border-[#E4E7EC] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Campus Basket Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#4F9D2F] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              cb
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-[#172033] group-hover:text-[#4F9D2F] transition-colors leading-none">
                campus basket
              </div>
              <div className="text-[10px] text-[#667085] font-medium tracking-wide">
                NIT Durgapur Campus Marketplace
              </div>
            </div>
          </Link>

          {/* Center: Secure Checkout Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#EFF8EA] border border-[#d6eed0] rounded-full text-xs font-bold text-[#397A22]">
            <Lock className="w-3.5 h-3.5 text-[#4F9D2F]" />
            <span>Secure Checkout</span>
          </div>

          {/* Right: Safe & Secure Assurance */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
            <ShieldCheck className="w-4 h-4 text-[#4F9D2F]" />
            <span className="font-bold text-[#172033]">🔒 Safe &amp; Secure</span>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 3. CHECKOUT STEPPER INDICATOR                            */}
      {/* ======================================================== */}
      <div className="bg-white border-b border-[#E4E7EC]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs font-bold">
            <Link
              href="/cart"
              className="flex items-center gap-1.5 text-[#4F9D2F] hover:underline cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-[#EFF8EA] border border-[#4F9D2F] flex items-center justify-center text-[10px] font-black text-[#4F9D2F]">
                ✓
              </span>
              <span>Cart</span>
            </Link>

            <span className="w-8 sm:w-16 h-[1.5px] bg-[#4F9D2F]" />

            <div className="flex items-center gap-1.5 text-[#172033]">
              <span className="w-4 h-4 rounded-full bg-[#4F9D2F] text-white flex items-center justify-center text-[10px] font-black">
                ●
              </span>
              <span>Delivery</span>
            </div>

            <span className="w-8 sm:w-16 h-[1.5px] bg-gray-200" />

            <div className="flex items-center gap-1.5 text-[#667085]">
              <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px] text-gray-400">
                ○
              </span>
              <span>Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN CHECKOUT BODY CONTAINER                             */}
      {/* ======================================================== */}
      <main className="flex-1 checkout-container py-6 sm:py-8">
        {/* 4. MAIN PAGE TITLE */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#172033] tracking-tight">
            Complete Your Order
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Fast and secure delivery to your NIT Durgapur hostel room.
          </p>
        </div>

        {/* Outer Perimeter Warning if applicable */}
        {!isInsideCampus && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Campus Geofence Notice:</span> Deliveries are strictly restricted to verified NIT Durgapur residence halls.
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3 shadow-2xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-900 mb-0.5">Payment / Order Notice:</span>
                <span>{error}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-900 font-bold shrink-0 ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. 2-COLUMN CHECKOUT LAYOUT (68% / 32%)                  */}
        {/* ======================================================== */}
        <div className="checkout-layout">
          {/* ==================================================== */}
          {/* LEFT COLUMN: Delivery & Payment Options (~68%)       */}
          {/* ==================================================== */}
          <div className="space-y-5">
            {/* 5. DELIVERY ADDRESS CARD */}
            <div className="checkout-card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#172033]">
                  <span className="w-5 h-5 rounded-full bg-[#172033] text-white flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>DELIVERY ADDRESS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-xs font-bold text-[#4F9D2F] hover:text-[#397A22] hover:underline transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Amazon/Flipkart-style Compact Address Box */}
                <div className="p-4 rounded-xl border border-[#E4E7EC] bg-[#FAFAFA] space-y-1.5 text-xs text-[#172033]">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#172033] flex items-center gap-1.5">
                      <span className="text-[#4F9D2F] font-black">✓</span>
                      {studentName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] bg-[#EFF8EA] text-[#397A22] font-bold px-2 py-0.5 rounded-md border border-[#d6eed0]">
                      <Check className="w-3 h-3 text-[#4F9D2F] stroke-[3]" />
                      College Verified
                    </span>
                  </div>

                  <div className="text-[#172033] font-semibold text-xs pt-0.5">
                    {hallName}, {roomNumber}
                  </div>
                  <div className="text-[#667085] text-xs">
                    National Institute of Technology Durgapur, West Bengal
                  </div>
                  <div className="text-[#667085] text-xs pt-1">
                    Mobile: <span className="font-mono text-[#172033] font-bold">{studentMobile}</span>
                  </div>
                </div>

                {/* 6. DELIVERY INSTRUCTIONS */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#172033]">
                      Delivery instructions (optional)
                    </label>
                    <span className="text-[11px] text-[#667085] font-mono">
                      {specialInstructions.length} / 150
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={150}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Call when you reach hostel gate..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E4E7EC] text-xs text-[#172033] placeholder:text-gray-400 focus:outline-none focus:border-[#4F9D2F] focus:bg-white bg-gray-50/70 transition-colors"
                  />
                </div>

                {/* 7. DELIVERY ESTIMATE ROW */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-[#172033]">
                  <div className="flex items-center gap-2 font-bold">
                    <Bike className="w-4 h-4 text-[#4F9D2F]" />
                    <span>Campus Delivery</span>
                  </div>
                  <div className="text-[#397A22] font-bold bg-[#EFF8EA] px-2.5 py-1 rounded-md text-[11px] border border-[#d6eed0]">
                    Estimated arrival: 10–15 minutes
                  </div>
                </div>
              </div>
            </div>

            {/* 8. PAYMENT METHOD CARD */}
            <div className="checkout-card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#172033]">
                  <span className="w-5 h-5 rounded-full bg-[#172033] text-white flex items-center justify-center text-[11px] font-black">
                    2
                  </span>
                  <span>PAYMENT METHOD</span>
                </div>
                <span className="text-[11px] text-[#667085]">Encrypted &bull; 100% Safe</span>
              </div>

              <div className="p-5 space-y-3">
                {/* OPTION 1: UPI / ONLINE PAYMENT */}
                <div
                  onClick={() => setPaymentMethod('RAZORPAY')}
                  className={`payment-option ${paymentMethod === 'RAZORPAY' ? 'selected' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          paymentMethod === 'RAZORPAY'
                            ? 'border-[#4F9D2F] bg-[#4F9D2F]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'RAZORPAY' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#172033] flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#4F9D2F]" />
                          UPI / Online Payment
                        </span>
                        <span className="text-[10px] font-extrabold text-[#397A22] bg-[#EFF8EA] px-2 py-0.5 rounded border border-[#d6eed0]">
                          ✓ Recommended
                        </span>
                      </div>

                      <p className="text-xs text-[#667085]">
                        Pay securely using UPI, cards or net banking.
                      </p>

                      {/* Payment Method Badges */}
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        {['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Cards', 'Net Banking'].map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white border border-gray-200 text-gray-700 shadow-2xs"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPTION 2: CASH ON DELIVERY */}
                <div
                  onClick={() => isCodAllowed && setPaymentMethod('CASH_ON_DELIVERY')}
                  className={`payment-option ${
                    !isCodAllowed
                      ? 'opacity-60 cursor-not-allowed bg-gray-50'
                      : paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'selected'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          paymentMethod === 'CASH_ON_DELIVERY'
                            ? 'border-[#4F9D2F] bg-[#4F9D2F]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'CASH_ON_DELIVERY' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#172033] flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-[#4F9D2F]" />
                          Cash on Delivery
                        </span>
                        {isCodAllowed ? (
                          <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                            Available up to ₹1,500
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Unavailable &gt; ₹1,500
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#667085]">
                        Pay when your order reaches your hostel room.
                      </p>

                      {!isCodAllowed && (
                        <p className="text-[11px] text-rose-600 font-bold pt-1">
                          Orders above ₹1,500 must be paid online via UPI/Cards.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: Sticky Price Details & Items (~32%)    */}
          {/* ==================================================== */}
          <div className="order-panel space-y-4">
            {/* 10. ORDER ITEMS SUMMARY */}
            <div className="checkout-card overflow-hidden">
              <div
                className="px-5 py-3.5 border-b border-[#E4E7EC] flex items-center justify-between bg-white cursor-pointer select-none sm:cursor-default"
                onClick={() => setShowMobileSummary(!showMobileSummary)}
              >
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#172033]">
                  ORDER SUMMARY ({items.reduce((s, i) => s + i.quantity, 0)} ITEMS)
                </div>
                <button
                  type="button"
                  className="sm:hidden text-gray-400 hover:text-gray-700"
                  aria-label="Toggle items"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showMobileSummary ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {/* Items List (Collapsible on mobile) */}
              <div
                className={`divide-y divide-gray-100 max-h-60 overflow-y-auto px-5 py-2 ${
                  showMobileSummary ? 'block' : 'hidden sm:block'
                }`}
              >
                {items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 relative shrink-0 overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="40px"
                            className="object-contain p-0.5"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">CB</span>
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-[#172033] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#667085]">
                          {item.quantity} &times; ₹{item.unitPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="font-bold text-[#172033] shrink-0 font-mono">
                      ₹{item.itemTotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 9. PRICE DETAILS PANEL */}
            <div className="checkout-card p-5 space-y-4">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#172033] pb-2 border-b border-[#E4E7EC]">
                PRICE DETAILS
              </div>

              <div className="space-y-2.5 text-xs text-[#667085]">
                <div className="flex justify-between items-center">
                  <span>Price ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="text-[#172033] font-semibold font-mono">₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-[#397A22] font-bold bg-[#EFF8EA] px-1.5 py-0.5 rounded text-[11px]">
                        FREE
                      </span>
                    ) : (
                      <span className="text-[#172033] font-semibold font-mono">₹{deliveryFee.toFixed(2)}</span>
                    )}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-[#397A22] font-semibold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#4F9D2F]" />
                      Campus Discount {appliedCoupon && `(${appliedCoupon})`}
                    </span>
                    <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t border-[#E4E7EC] flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-[#172033]">Total Payable</span>
                <span className="text-2xl font-black text-[#172033] font-mono tracking-tight">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              {/* 11. PRIMARY ACTION PAYMENT BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handlePlaceOrder()}
                  disabled={isProcessing}
                  className="pay-button flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing payment...</span>
                    </>
                  ) : paymentMethod === 'RAZORPAY' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>🔒 PAY ₹{total.toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      <span>PLACE ORDER • ₹{total.toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* 12. SECURITY FOOTER */}
              <div className="pt-2 text-center space-y-1 text-[11px] text-[#667085]">
                <div className="flex items-center justify-center gap-1.5 font-medium">
                  <Lock className="w-3 h-3 text-[#4F9D2F]" />
                  <span>🔒 Secure payment &bull; Powered by Razorpay</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  Direct hostel delivery across NIT Durgapur residence halls
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 17. MOBILE STICKY BOTTOM PAYMENT BAR                     */}
      {/* ======================================================== */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E4E7EC] p-3 z-40 shadow-lg flex items-center justify-between gap-3 pb-safe">
        <div>
          <div className="text-[10px] text-[#667085] uppercase font-bold tracking-wider">Total</div>
          <div className="text-xl font-black text-[#172033] font-mono leading-none">
            ₹{total.toFixed(2)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => handlePlaceOrder()}
          disabled={isProcessing}
          className="flex-1 py-3 px-4 rounded-lg bg-[#4F9D2F] hover:bg-[#397A22] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          {isProcessing ? (
            <span>Processing...</span>
          ) : paymentMethod === 'RAZORPAY' ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>PAY ₹{total.toFixed(2)}</span>
            </>
          ) : (
            <>
              <span>PLACE ORDER &bull; ₹{total.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>

      {/* Location Modal for [ Change ] trigger */}
      <CampusLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationChange={(newHall, newRoom) => {
          setHallName(newHall);
          setRoomNumber(newRoom);
        }}
      />
    </div>
  );
}
