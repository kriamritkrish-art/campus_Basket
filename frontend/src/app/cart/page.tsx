'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { CampusLocationModal } from '../../components/layout/CampusLocationModal';
import {
  ShoppingBag,
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
  MapPin,
  CreditCard,
  Wallet,
  Building,
  Sparkles
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
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

  // Delivery Location State
  const [selectedHall, setSelectedHall] = useState('Hall 11');
  const [roomNumber, setRoomNumber] = useState('Room 123');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'UPI' | 'WALLET' | 'COD'>('UPI');

  useEffect(() => {
    const sync = () => {
      if (typeof window !== 'undefined') {
        const h = localStorage.getItem('cb_selected_hall') || user?.student?.hall?.name || 'Hall 11';
        const r = localStorage.getItem('cb_room_number') || user?.student?.roomNumber || 'Room 123';
        setSelectedHall(h);
        setRoomNumber(r);
      }
    };
    sync();
    window.addEventListener('cb_location_updated', sync);
    return () => window.removeEventListener('cb_location_updated', sync);
  }, [user]);

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

  const handlePlaceOrderClick = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#F7F8F6]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 sm:p-10 border border-[#E5E7EB] shadow-xs text-center">
          <div className="w-16 h-16 bg-[#eef7e9] text-[#4F9D2F] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#dcedc8]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">Your basket is empty</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            Your shopping basket is currently empty. Explore hot canteen meals, fresh orchard fruits, midnight snacks, and academic stationery!
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4F9D2F] hover:bg-[#36751F] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-transform active:scale-95"
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
    <>
      <div className="min-h-screen bg-[#F7F8F6] py-8 px-4 sm:px-6 lg:px-8 text-[#172033]">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Link href="/" className="hover:text-[#4F9D2F] font-medium">Home</Link>
                <span>/</span>
                <span className="text-gray-900 font-bold">Your Basket</span>
              </div>
              <h1 className="text-2xl font-black text-[#172033] tracking-tight flex items-center gap-2.5">
                <span>Your Basket</span>
                <span className="text-xs font-bold bg-[#eef7e9] text-[#36751F] px-2.5 py-0.5 rounded-full border border-[#dcedc8]">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 border border-[#E5E7EB] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
                Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-red-50 hover:text-red-600 text-xs font-bold text-gray-500 border border-[#E5E7EB] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          {/* 2-Column Checkout Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: YOUR BASKET */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs divide-y divide-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-[#FCFDFB] border-b border-gray-100 flex items-center justify-between text-xs font-extrabold text-[#172033] uppercase tracking-wider">
                  <span>Product</span>
                  <span>Quantity &bull; Price</span>
                </div>

                {items.map((item) => {
                  const imgUrl = item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400';

                  return (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      {/* Product details */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-xl bg-[#F7F8F6] border border-gray-100 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={imgUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-bold text-[#172033] truncate">
                            {item.name}
                          </h3>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            ₹{item.unitPrice} each &bull; 10–15 min delivery
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Item Subtotal */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {/* Stepper */}
                        <div className="flex items-center rounded-lg bg-[#F7F8F6] border border-[#E5E7EB] overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="px-2.5 font-bold text-xs min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right min-w-[70px]">
                          <div className="text-sm font-black text-[#172033]">
                            ₹{item.itemTotal}
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-[10.5px] text-gray-400 hover:text-red-600 transition-colors cursor-pointer mt-0.5"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#4F9D2F]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Campus Promo &amp; Offers
                  </h3>
                </div>

                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code: CAMPUS50, HOSTEL10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-mono uppercase focus:outline-none focus:border-[#4F9D2F] focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2 bg-[#4F9D2F] hover:bg-[#36751F] disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    {couponLoading ? 'Applying...' : 'Apply'}
                  </button>
                </form>

                {couponSuccess && (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{couponSuccess}</span>
                  </div>
                )}
                {couponError && (
                  <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-[#eef7e9] border border-[#dcedc8] p-2.5 rounded-xl text-xs">
                    <span className="font-bold text-[#36751F]">
                      Active Discount: <span className="font-mono">{appliedCoupon}</span> (-₹{discountAmount})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY, DELIVERY TO & PAYMENT */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E7EB] shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2.5">
                  Order Summary
                </h2>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#172033]">₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Campus Delivery Fee</span>
                    <span className="font-bold text-[#4F9D2F]">
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#4F9D2F] font-bold">
                      <span>Campus Discount</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#E5E7EB] flex justify-between items-baseline">
                    <div>
                      <div className="text-xs font-bold text-gray-500">Total Payable</div>
                      <div className="text-[10px] text-gray-400">All campus taxes included</div>
                    </div>
                    <div className="text-2xl font-black text-[#172033]">
                      ₹{total}
                    </div>
                  </div>
                </div>

                {/* DELIVERY TO SECTION */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-400">
                      Delivering To
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="text-[11px] font-bold text-[#4F9D2F] hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E5E7EB] flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#4F9D2F] shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-[#172033]">{selectedHall} &bull; {roomNumber}</div>
                      <div className="text-[10.5px] text-gray-500">Hostel room doorstep delivery</div>
                    </div>
                  </div>
                </div>

                {/* PAYMENT SELECTION */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-400 block">
                    Payment Method
                  </span>
                  <div className="space-y-1.5 text-xs font-bold">
                    <label
                      onClick={() => setSelectedPayment('UPI')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        selectedPayment === 'UPI'
                          ? 'bg-[#eef7e9] border-[#4F9D2F] text-[#36751F]'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#4F9D2F]" />
                        <span>UPI &amp; Online Cards</span>
                      </div>
                      <input
                        type="radio"
                        checked={selectedPayment === 'UPI'}
                        onChange={() => setSelectedPayment('UPI')}
                        className="accent-[#4F9D2F]"
                      />
                    </label>

                    <label
                      onClick={() => setSelectedPayment('WALLET')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        selectedPayment === 'WALLET'
                          ? 'bg-[#eef7e9] border-[#4F9D2F] text-[#36751F]'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#4F9D2F]" />
                        <span>Campus Wallet</span>
                      </div>
                      <input
                        type="radio"
                        checked={selectedPayment === 'WALLET'}
                        onChange={() => setSelectedPayment('WALLET')}
                        className="accent-[#4F9D2F]"
                      />
                    </label>

                    <label
                      onClick={() => setSelectedPayment('COD')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        selectedPayment === 'COD'
                          ? 'bg-[#eef7e9] border-[#4F9D2F] text-[#36751F]'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span>Cash on Delivery</span>
                      </div>
                      <input
                        type="radio"
                        checked={selectedPayment === 'COD'}
                        onChange={() => setSelectedPayment('COD')}
                        className="accent-[#4F9D2F]"
                      />
                    </label>
                  </div>
                </div>

                {/* PRIMARY CTA: PLACE ORDER • ₹{total} */}
                <div className="pt-2">
                  <button
                    onClick={handlePlaceOrderClick}
                    className="w-full py-3.5 bg-[#4F9D2F] hover:bg-[#36751F] text-white font-extrabold text-sm rounded-xl shadow-sm transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>PLACE ORDER &bull; ₹{total}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4F9D2F]" />
                  <span>Verified NIT Durgapur Campus Order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CampusLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationChange={(h, r) => {
          setSelectedHall(h);
          setRoomNumber(r);
        }}
      />
    </>
  );
}
