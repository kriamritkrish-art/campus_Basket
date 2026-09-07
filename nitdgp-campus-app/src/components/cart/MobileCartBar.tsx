'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

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
      <Link
        href="/cart"
        className="w-full bg-[#172033] hover:bg-black text-white py-2.5 px-4 rounded-xl shadow-xl flex items-center justify-between transition-all active:scale-98 border border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center relative">
            <ShoppingBag className="w-4 h-4 text-[#4F9D2F]" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#4F9D2F] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-black text-white">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} &bull; ₹{total.toFixed(0)}
            </div>
            <div className="text-[10px] text-gray-400 font-medium">
              Hostel room delivery
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-white bg-[#4F9D2F] px-3 py-1.5 rounded-lg">
          <span>View Basket</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>
    </div>
  );
}
