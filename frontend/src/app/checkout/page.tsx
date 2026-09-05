'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Lock
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

    // Check COD global settings
    apiRequest('/api/campus/announcements')
      .then(() => {
        // Default COD max 1500
        if (total > 1500) {
          setIsCodAllowed(false);
          setPaymentMethod('RAZORPAY');
        }
      })
      .catch(() => {});
  }, [isAuthenticated, user, total]);

  // Load Razorpay Script
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
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        const rzpConfig = {
          key: res.razorpay.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: res.razorpay.amount,
          currency: res.razorpay.currency,
          name: 'NIT Durgapur Campus Services',
          description: `Order ${order.orderNumber}`,
          order_id: res.razorpay.razorpayOrderId,
          prefill: {
            name: user?.student?.fullName || 'NIT Student',
            email: user?.email || '',
            contact: user?.student?.mobileNumber || '',
          },
          theme: {
            color: '#0284c7',
          },
          handler: async function (response: any) {
            // Verify payment signature on backend
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
                setError('Payment verification failed. Please contact campus helpdesk.');
              }
            } catch (vErr: any) {
              setError(vErr.message || 'Payment signature verification failed.');
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setError('Payment process was interrupted. You can retry or choose Cash on Delivery if available.');
            },
          },
        };

        const rzp = new window.Razorpay(rzpConfig);
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessing(false);
          setError(`Payment failed: ${resp.error.description}. Please retry or select Cash on Delivery.`);
        });
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || 'Order placement failed. Please review your cart and try again.');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">
        <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs mt-2">Add delicious meals, fresh fruits, or stationery to proceed with checkout.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl"
        >
          Explore Campus Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Review &amp; Place Order</h1>
        <p className="text-xs text-slate-400 mt-1">
          Direct hostel room delivery across NIT Durgapur residential halls
        </p>
      </div>

      {!isInsideCampus && (
        <div className="p-4 bg-amber-950/80 border border-amber-800/80 rounded-2xl flex items-center gap-3 text-amber-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Location Warning:</strong> Your browser GPS indicates you may be outside the NIT Durgapur campus perimeter. Orders will only be delivered to valid campus hostel rooms.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-xs text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Delivery Details & Payment Choice */}
        <div className="md:col-span-2 space-y-6">
          {/* Student Profile Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Verified Student Recipient</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <span className="font-semibold text-white">{user?.student?.fullName || 'Verified Student'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">College Email</span>
                <span className="font-semibold text-sky-300 font-mono">{user?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Roll Number</span>
                <span className="font-semibold text-white font-mono">{user?.student?.rollNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Mobile Number</span>
                <span className="font-semibold text-white">{user?.student?.mobileNumber}</span>
              </div>
            </div>
          </div>

          {/* Delivery Location in Campus */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Hostel Room Drop-off Address</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Hostel / Residence Hall
                </label>
                <select
                  value={hallName}
                  onChange={(e) => setHallName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                  {halls.length === 0 && <option value="Hall 11">Hall 11</option>}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Room &amp; Wing Number
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. B-304"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Delivery Instructions for Campus Runner (Optional)
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Call when entering security gate / leave with roommate"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm">Choose Payment Method</h3>

            <div className="space-y-3">
              {/* Razorpay Online */}
              <label
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'RAZORPAY'
                    ? 'bg-sky-950/40 border-sky-500/50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="RAZORPAY"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    className="text-sky-500 focus:ring-sky-500"
                  />
                  <div>
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-400" />
                      Razorpay (UPI, Google Pay, Cards, Net Banking)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Fast, instant verification &bull; Zero extra fee
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  Recommended
                </span>
              </label>

              {/* Cash On Delivery */}
              <label
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  !isCodAllowed
                    ? 'opacity-50 cursor-not-allowed bg-slate-900/30 border-slate-800'
                    : paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'bg-amber-950/30 border-amber-500/50 cursor-pointer'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    disabled={!isCodAllowed}
                    checked={paymentMethod === 'CASH_ON_DELIVERY'}
                    onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-amber-400" />
                      Cash on Delivery (COD)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Pay cash to provider upon room handover (Up to ₹1,500)
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Bill Summary & Action */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="font-bold text-white text-sm">Order Summary</h3>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs py-1 border-b border-slate-800/60">
                <span className="text-slate-300 truncate max-w-[150px]">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold text-white">₹{item.itemTotal}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Coupon ({appliedCoupon})</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Room Delivery Fee</span>
              <span className="text-white font-medium">
                {deliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span>Final Total</span>
              <span className="text-base text-sky-400 font-extrabold">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-sky-600/25 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? 'Processing Order...' : paymentMethod === 'RAZORPAY' ? 'Proceed to Online Payment' : 'Confirm Cash on Delivery'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5" /> 256-Bit Encrypted Campus Transaction
          </div>
        </div>
      </form>
    </div>
  );
}


