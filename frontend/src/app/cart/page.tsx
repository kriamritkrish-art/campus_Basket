'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import {
  ShoppingBasket,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    deliveryFee,
    discountAmount,
    total,
    appliedCoupon,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    const res = await applyCoupon(couponInput.trim());
    setCouponLoading(false);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleQuickApply = async (code: string) => {
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);
    const res = await applyCoupon(code);
    setCouponLoading(false);
    if (res.success) {
      setCouponSuccess(res.message);
    } else {
      setCouponError(res.message);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#f8fafc]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-[#f1f8e9] text-[#689f38] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#dcedc8] shadow-inner">
            <ShoppingBasket className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Your basket is empty.</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            Your shopping basket is currently empty. Explore our cafeteria meals, fresh orchard fruits, midnight snacks, and campus stationery!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/food"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              Browse Campus Menu
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Link href="/food" className="hover:text-[#689f38] font-medium transition-colors">Campus Menu</Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Your Basket</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Your Basket
              <span className="text-sm sm:text-base font-bold bg-[#f1f8e9] text-[#2e7d32] px-2.5 py-0.5 rounded-full border border-[#dcedc8]">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/food"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 border border-gray-300 shadow-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
              Continue Shopping
            </Link>
            <button
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-xs font-semibold text-gray-600 border border-transparent transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cart
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Basket Items List & Promo Box */}
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery Banner */}
            <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-2xl p-4 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#689f38] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div className="text-xs">
                <div className="font-extrabold text-[#2e7d32] uppercase tracking-wide">
                  10-15 Min Express Hostel Delivery Active
                </div>
                <div className="text-gray-600 mt-0.5">
                  Direct to your room door across Halls 1 to 14, Mother Teresa, Sister Nivedita & Gargi Hall.
                </div>
              </div>
            </div>

            {/* Product Items Table / Cards */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                <span>Item Description</span>
                <span>Subtotal</span>
              </div>

              {items.map((item) => {
                const imgUrl = item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400';

                return (
                  <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    {/* Item details */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 p-2 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-snug">
                          {item.name}
                        </h3>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>₹{item.unitPrice} each</span>
                          {item.originalPrice && item.originalPrice > item.unitPrice && (
                            <span className="line-through text-gray-400">₹{item.originalPrice}</span>
                          )}
                          {item.unit && <span>• 1 {item.unit}</span>}
                        </div>

                        {/* Mobile Quantity row */}
                        <div className="sm:hidden mt-3 flex items-center gap-4">
                          <div className="flex items-center bg-[#e53935] text-white rounded-lg overflow-hidden shadow-sm h-7">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-2.5 h-full hover:bg-[#c62828] transition-colors flex items-center justify-center"
                              title="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-black min-w-[20px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-2.5 h-full hover:bg-[#c62828] transition-colors flex items-center justify-center"
                              title="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Controls & Subtotal */}
                    <div className="hidden sm:flex items-center gap-6">
                      {/* Counter */}
                      <div className="flex items-center bg-[#e53935] text-white rounded-lg overflow-hidden shadow-sm h-8">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2.5 h-full hover:bg-[#c62828] transition-colors flex items-center justify-center"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-black min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2.5 h-full hover:bg-[#c62828] transition-colors flex items-center justify-center"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[90px]">
                        <div className="text-base font-black text-gray-900">
                          ₹{item.itemTotal}
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-[11px] text-gray-400 hover:text-red-600 transition-colors mt-0.5 inline-block"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupons & Promo Box */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#689f38]" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Apply Campus Coupon &amp; Offers
                </h3>
              </div>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter promo code (e.g. CAMPUS50, HOSTEL10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 uppercase font-mono tracking-wider focus:outline-none focus:border-[#84c225] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponInput.trim()}
                  className="px-5 py-2.5 bg-[#689f38] hover:bg-[#5b8c30] disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  {couponLoading ? 'Applying...' : 'Apply'}
                </button>
              </form>

              {couponSuccess && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {couponSuccess}
                </div>
              )}

              {couponError && (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                  <Info className="w-4 h-4 text-rose-600 shrink-0" />
                  {couponError}
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between bg-[#f1f8e9] border border-[#dcedc8] p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#689f38]" />
                    <span className="text-xs font-extrabold text-[#2e7d32]">
                      Code Applied: <span className="font-mono">{appliedCoupon}</span> (-₹{discountAmount})
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-bold text-red-600 hover:text-red-800 underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Popular quick coupon pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-gray-400">Available:</span>
                <button
                  type="button"
                  onClick={() => handleQuickApply('CAMPUS50')}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#f1f8e9] hover:text-[#2e7d32] border border-gray-200 text-[11px] font-bold text-gray-700 transition-colors font-mono"
                >
                  CAMPUS50 (Flat ₹50 OFF)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickApply('HOSTEL10')}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#f1f8e9] hover:text-[#2e7d32] border border-gray-200 text-[11px] font-bold text-gray-700 transition-colors font-mono"
                >
                  HOSTEL10 (10% OFF)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout Action */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider">
                Bill Details
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon / Campus Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>Hostel Room Delivery</span>
                    <span className="text-[10px] text-gray-400">({subtotal > 250 ? 'Free above ₹250' : 'Standard'})</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {deliveryFee === 0 ? (
                      <span className="text-[#2e7d32] font-extrabold uppercase">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900">Total Payable Amount</div>
                    <div className="text-[10px] text-gray-400">Inclusive of all college campus tariffs</div>
                  </div>
                  <div className="text-2xl font-black text-[#212121]">
                    ₹{total}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 space-y-3">
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full py-3.5 bg-[#689f38] hover:bg-[#5b8c30] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/food"
                  className="w-full py-3 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl border border-gray-300 shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
                  Continue Shopping
                </Link>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-[11px] text-gray-500">
                <ShieldCheck className="w-4 h-4 text-[#689f38] shrink-0" />
                <span>Verified student payments with Razorpay &amp; Cash on Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
