'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../context/GeolocationContext';
import { apiRequest } from '../../lib/api';
import { Hall } from '../../types';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  MapPin,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  Building,
  Sparkles,
  ChevronRight,
  Shield,
  RotateCcw,
  Check,
  ShoppingBag
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

  const [halls, setHalls] = useState<Hall[]>([]);
  const [hallName, setHallName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'CASH_ON_DELIVERY'>('RAZORPAY');
  const [isCodAllowed, setIsCodAllowed] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (user?.student) {
      setHallName(user.student.hall?.name || 'Hall 11');
      setRoomNumber(user.student.roomNumber || 'B-304');
    }

    // Fetch halls
    apiRequest('/api/campus/halls')
      .then((res) => {
        if (res.success && res.halls) {
          setHalls(res.halls);
          if (!hallName && res.halls.length > 0) {
            setHallName(res.halls[0].name);
          }
        }
      })
      .catch(() => {});

    // Check COD threshold (default COD max 1500)
    if (total > 1500) {
      setIsCodAllowed(false);
      setPaymentMethod('RAZORPAY');
    } else {
      setIsCodAllowed(true);
    }
  }, [isAuthenticated, user, total, router]);

  // Load Razorpay Script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
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
      specialInstructions: specialInstructions || undefined,
      location: coords || undefined,
    };

    try {
      const res = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to initialize order');
      }

      const order = res.order;

      // CASH ON DELIVERY: Order confirmed immediately
      if (paymentMethod === 'CASH_ON_DELIVERY') {
        clearCart();
        router.push(`/orders/${order.id}?success=cod`);
        return;
      }

      // RAZORPAY PAYMENT FLOW
      if (paymentMethod === 'RAZORPAY' && res.razorpay) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay secure gateway failed to load. Please check your internet connection and try again.');
        }

        const rzpConfig = {
          key: res.razorpay.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: res.razorpay.amount,
          currency: res.razorpay.currency,
          name: 'Campus Basket — NIT Durgapur',
          description: `Hostel Order #${order.orderNumber}`,
          order_id: res.razorpay.razorpayOrderId,
          image: '/icons/icon-192x192.svg',
          prefill: {
            name: user?.student?.fullName || 'NIT Durgapur Student',
            email: user?.email || '',
            contact: user?.student?.mobileNumber || '',
          },
          theme: {
            color: '#689f38',
            backdrop_color: 'rgba(15, 23, 42, 0.8)',
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
                router.push(`/orders/${order.id}?success=paid`);
              } else {
                setError('Payment verification failed. Please contact campus support.');
              }
            } catch (vErr: any) {
              setError(vErr.message || 'Payment signature verification failed.');
            }
          },
        };

        const rzp = new window.Razorpay(rzpConfig);
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessing(false);
          setError(`Payment failed: ${resp.error.description}. You can retry or select Cash on Delivery.`);
        });
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || 'Order placement failed. Please review your details and try again.');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-2">
          Add delicious meals, fresh fruits, or stationery essentials to proceed with checkout.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-[#689f38] hover:bg-[#558b2f] text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          Explore Campus Marketplace
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-slate-800 transition-colors">Campus</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/" className="hover:text-slate-800 transition-colors">Cart</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[#689f38] font-bold">Secure Checkout & Payment</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Secure Campus Checkout
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct hostel room delivery across NIT Durgapur residential halls
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-[11px] font-semibold self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted &bull; Razorpay Certified</span>
        </div>
      </div>

      {/* Campus Geolocation Alert */}
      {!isInsideCampus && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start sm:items-center gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Perimeter Advisory:</strong> Your browser GPS indicates you may be outside the NIT Durgapur perimeter. Orders will only be delivered to verified campus residence halls.
          </span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-3">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Recipient, Address & Payment Selector */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card 1: Verified Student Recipient */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Verified Student Recipient</h3>
                  <p className="text-[11px] text-slate-500">Order will be handed over to this registered student</p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-emerald-100/70 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" /> NIT Durgapur Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Full Name</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
                  {user?.student?.fullName || 'NIT Student'}
                </span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">College Email</span>
                <span className="font-bold text-emerald-700 font-mono text-xs mt-0.5 block truncate">
                  {user?.email}
                </span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Roll Number</span>
                <span className="font-bold text-slate-800 font-mono text-xs mt-0.5 block">
                  {user?.student?.rollNumber || 'Not specified'}
                </span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Mobile Number</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                  {user?.student?.mobileNumber || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Hostel Room Delivery Address */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Hostel Room Drop-off Address</h3>
                <p className="text-[11px] text-slate-500">Delivered directly to your hostel room door</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Hostel / Residence Hall <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={hallName}
                    onChange={(e) => setHallName(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-[#689f38] focus:ring-2 focus:ring-[#689f38]/20 transition-all cursor-pointer"
                    required
                  >
                    {halls.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                    {halls.length === 0 && <option value="Hall 11">Hall 11</option>}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Room &amp; Wing Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. B-304 / Ground Wing"
                  className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#689f38] focus:ring-2 focus:ring-[#689f38]/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Delivery Instructions for Runner (Optional)
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Call when outside hostel gate / Leave with roommate if in lecture"
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#689f38] focus:ring-2 focus:ring-[#689f38]/20 transition-all"
              />
            </div>
          </div>

          {/* Card 3: PROFESSIONAL PAYMENT GATEWAY SELECTOR */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#689f38]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Choose Payment Method</h3>
                  <p className="text-[11px] text-slate-500">All transactions are secured with 256-bit encryption</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>PCI-DSS Level 1</span>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* OPTION 1: RAZORPAY INSTANT ONLINE PAYMENT */}
              <div
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-[#689f38] bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 shadow-md shadow-[#689f38]/10 ring-4 ring-[#689f38]/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Custom Radio Button */}
                    <div className="mt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'RAZORPAY'
                            ? 'border-[#689f38] bg-[#689f38]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'RAZORPAY' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          Razorpay Online Payment
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 tracking-wide flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-emerald-600 text-emerald-600" /> RECOMMENDED
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        Pay instantly via any UPI app, Credit/Debit Card, or NetBanking.
                      </p>

                      {/* Payment Method Badges Row */}
                      <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          UPI
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          Google Pay
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          PhonePe
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          Paytm
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          Cards (RuPay / Visa / MC)
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          NetBanking
                        </span>
                      </div>

                      {/* Micro Benefits Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>Instant kitchen order dispatch</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <RotateCcw className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>Auto refund if cancelled</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <span className="hidden sm:block text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Zero Extra Fee
                  </span>
                </div>
              </div>

              {/* OPTION 2: CASH ON DELIVERY */}
              <div
                onClick={() => isCodAllowed && setPaymentMethod('CASH_ON_DELIVERY')}
                className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden ${
                  !isCodAllowed
                    ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                    : paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'border-amber-500 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 shadow-md shadow-amber-500/10 ring-4 ring-amber-500/10 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Custom Radio Button */}
                    <div className="mt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'CASH_ON_DELIVERY'
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'CASH_ON_DELIVERY' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-amber-600" />
                          Cash on Delivery (COD)
                        </span>
                        {isCodAllowed && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                            Up to ₹1,500
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600">
                        Hand over exact cash to the runner when meals or essentials reach your hostel room door.
                      </p>

                      {!isCodAllowed && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">
                          COD is disabled for orders over ₹1,500. Please select Razorpay online payment.
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="hidden sm:block text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    Hostel Handover
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Sticky Bill Summary & Action CTA */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Order Summary</h3>
              <span className="text-xs text-slate-500 font-medium">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Scrollable Items List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0">
                  <div className="pr-2 truncate">
                    <span className="font-bold text-slate-700 mr-1.5">
                      {item.quantity}&times;
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 flex-shrink-0">
                    ₹{item.itemTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs text-slate-500 pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span>Items Subtotal</span>
                <span className="text-slate-800 font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Coupon Savings ({appliedCoupon})
                  </span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Hostel Room Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      FREE
                    </span>
                  ) : (
                    <span className="text-slate-800 font-semibold">₹{deliveryFee.toFixed(2)}</span>
                  )}
                </span>
              </div>

              {/* Total Payable */}
              <div className="flex justify-between items-baseline pt-3 border-t-2 border-slate-100">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Total Payable</span>
                  <span className="text-[10px] text-slate-400 font-medium">Inclusive of all campus service taxes</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-2 ${
                paymentMethod === 'RAZORPAY'
                  ? 'bg-gradient-to-r from-[#689f38] to-[#558b2f] hover:from-[#558b2f] hover:to-[#437424] shadow-[#689f38]/25'
                  : 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 shadow-slate-900/25'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Opening Secure Gateway...</span>
                </>
              ) : paymentMethod === 'RAZORPAY' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{total.toFixed(2)} with Razorpay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4" />
                  <span>Confirm Cash on Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Trust Badges Footer */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Bank Grade Security</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Official Campus Marketplace for NIT Durgapur Students &bull; Instant Support at Hall Helpdesks
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
