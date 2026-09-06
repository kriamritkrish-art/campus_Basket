'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { ShoppingBasket, ArrowRight } from 'lucide-react';

export function MobileCartBar() {
  const pathname = usePathname();
  const { itemCount, total, setIsCartOpen } = useCart();

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery') ||
    pathname === '/cart' ||
    pathname === '/checkout' ||
    itemCount === 0
  ) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-14 inset-x-3 z-40 animate-in slide-in-from-bottom-3 duration-200">
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 px-4 rounded-2xl shadow-xl flex items-center justify-between transition-all active:scale-98 border border-white/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center relative">
            <ShoppingBasket className="w-4 h-4 text-white" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#e53935] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
              {itemCount}
            </span>
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-black">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'} &bull; ₹{total.toFixed(0)}
            </div>
            <div className="text-[10px] text-emerald-100 font-medium">
              Free hostel delivery applied
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white/15 px-3 py-1.5 rounded-xl">
          <span>View Basket</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
}
