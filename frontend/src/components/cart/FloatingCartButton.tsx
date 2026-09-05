'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { ShoppingBasket } from 'lucide-react';

export function FloatingCartButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, total, isCartOpen } = useCart();

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery') ||
    pathname === '/cart' ||
    pathname === '/checkout' ||
    itemCount === 0 ||
    isCartOpen
  ) return null;

  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-6 z-30 flex items-center gap-3 bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold py-3 px-5 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
      aria-label="Open Cart"
    >
      <div className="relative">
        <ShoppingBasket className="w-5 h-5 text-white" />
        <span className="absolute -top-2 -right-2 bg-white text-[#e53935] text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
          {itemCount}
        </span>
      </div>
      <div className="text-left leading-tight">
        <div className="text-[10px] font-bold text-white/90 uppercase tracking-wide">Basket</div>
        <div className="text-xs font-black">₹{total.toFixed(0)}</div>
      </div>
    </Link>
  );
}
