'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag, CheckCircle2, ShoppingBasket } from 'lucide-react';

export function CartDrawer() {
  const pathname = usePathname();
  const {
    items,
    subtotal,
    deliveryFee,
    discountAmount,
    total,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery') ||
    !isCartOpen
  ) return null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplying(true);
    setCouponMsg(null);

    const res = await applyCoupon(couponInput.trim());
    setIsApplying(false);
    if (res.success) {
      setCouponMsg({ text: res.message, isError: false });
      setCouponInput('');
    } else {
      setCouponMsg({ text: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-gray-200 flex flex-col shadow-2xl text-gray-900">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#e53935] text-white flex items-center justify-center shadow-sm">
                <ShoppingBasket className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#212121]">My Basket</h2>
                <div className="text-[11px] text-gray-500 font-medium">
                  {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f8f8]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <ShoppingBasket className="w-10 h-10 text-gray-400" />
                </div>
                <p className="font-bold text-gray-800 text-base">Your basket is empty</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Browse through fresh meals, fruit baskets, or student stationery to add items.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-5 py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-3 shadow-sm"
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200'}
                    alt={item.name}
                    className="w-14 h-14 rounded-lg object-cover bg-gray-50 border border-gray-100 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      ₹{item.unitPrice} &bull; <span className="uppercase text-[10px]">{item.unit}</span>
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls (BigBasket Red Stepper) */}
                      <div className="flex items-center bg-[#e53935] text-white rounded-md overflow-hidden h-7">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 h-full hover:bg-[#c62828] transition-colors flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-extrabold px-1.5 min-w-[18px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2 h-full hover:bg-[#c62828] transition-colors flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#212121]">₹{item.itemTotal}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {items.length > 0 && (
            <div className="p-5 border-t border-gray-200 bg-white space-y-4">
              {/* Coupon Form */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-[#f1f8e9] border border-[#dcedc8] px-3 py-2 rounded-lg text-xs text-[#2e7d32]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#689f38]" />
                      <span>Code <strong>{appliedCoupon}</strong> applied (-₹{discountAmount})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-[#2e7d32] hover:underline text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Apply coupon (e.g. NITFRESH)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 uppercase placeholder:normal-case placeholder:text-gray-400 focus:outline-none focus:border-[#84c225]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isApplying}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-xs font-bold rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponMsg && (
                  <p
                    className={`text-[11px] mt-1.5 font-medium ${
                      couponMsg.isError ? 'text-red-600' : 'text-[#2e7d32]'
                    }`}
                  >
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* Price Details */}
              <div className="space-y-1 text-xs text-gray-600 pt-2 border-t border-gray-100">
                <div className="flex justify-between">
                  <span>Basket Subtotal</span>
                  <span className="text-gray-900 font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#2e7d32] font-bold">
                    <span>Coupon Savings</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Hostel Room Delivery Fee</span>
                  <span className="text-gray-900 font-medium">
                    {deliveryFee === 0 ? (
                      <span className="text-[#2e7d32] font-bold">FREE (Above ₹250)</span>
                    ) : (
                      `₹${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#212121] pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-[#e53935]">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* BigBasket Red Proceed to Checkout Button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 bg-[#e53935] hover:bg-[#d32f2f] text-white font-extrabold rounded-lg flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all text-sm uppercase tracking-wide"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
