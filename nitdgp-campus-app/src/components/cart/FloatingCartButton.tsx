'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export function FloatingCartButton() {
  const pathname = usePathname();
  const { itemCount, total, isCartOpen } = useCart();

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery') ||
    pathname === '/cart' ||
    pathname === '/checkout' ||
    itemCount === 0 ||
    isCartOpen
  ) {
    return null;
  }

  // Modern compact campus floating basket control (No giant red button)
  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-6 z-30 hidden md:flex items-center gap-3 bg-[#172033] hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl shadow-xl transition-all hover:scale-102 active:scale-98 border border-white/10"
      aria-label="View Basket"
    >
      <div className="relative">
        <ShoppingBag className="w-4 h-4 text-[#4F9D2F]" />
        <span className="absolute -top-2 -right-2 bg-[#4F9D2F] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
          {itemCount}
        </span>
      </div>
      <div className="text-left leading-none">
        <div className="text-[10px] text-gray-400 font-semibold">Basket</div>
        <div className="text-xs font-black text-white mt-0.5">₹{total.toFixed(0)}</div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
    </Link>
  );
}
