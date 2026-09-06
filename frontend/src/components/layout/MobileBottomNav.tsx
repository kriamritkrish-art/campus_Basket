'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  Home,
  Search,
  ShoppingBag,
  Package,
  User
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenCategories?: () => void;
}

export function MobileBottomNav({ onOpenCategories }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  // Hide on Enterprise Portals
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery')
  ) {
    return null;
  }

  const isHome = pathname === '/';
  const isSearch = pathname === '/food' || pathname === '/fruits' || pathname === '/essentials';
  const isBasket = pathname === '/cart' || pathname === '/checkout';
  const isOrders = pathname?.startsWith('/orders') || pathname === '/dashboard?tab=orders';
  const isProfile = pathname === '/dashboard' || pathname === '/login' || pathname === '/register';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-2 py-1 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.04)] select-none pb-safe"
    >
      {/* 1. Home */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg transition-colors ${
          isHome ? 'text-[#4F9D2F]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className={`text-[10px] mt-0.5 ${isHome ? 'font-black' : 'font-medium'}`}>
          Home
        </span>
      </Link>

      {/* 2. Search */}
      <Link
        href="/food"
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg transition-colors ${
          isSearch ? 'text-[#4F9D2F]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <Search className={`w-5 h-5 ${isSearch ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className={`text-[10px] mt-0.5 ${isSearch ? 'font-black' : 'font-medium'}`}>
          Search
        </span>
      </Link>

      {/* 3. Basket */}
      <Link
        href="/cart"
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg transition-colors relative ${
          isBasket ? 'text-[#4F9D2F]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <div className="relative">
          <ShoppingBag className={`w-5 h-5 ${isBasket ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-[#4F9D2F] text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] mt-0.5 ${isBasket ? 'font-black' : 'font-medium'}`}>
          Basket
        </span>
      </Link>

      {/* 4. Orders */}
      <Link
        href="/dashboard?tab=orders"
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg transition-colors ${
          isOrders ? 'text-[#4F9D2F]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <Package className={`w-5 h-5 ${isOrders ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className={`text-[10px] mt-0.5 ${isOrders ? 'font-black' : 'font-medium'}`}>
          Orders
        </span>
      </Link>

      {/* 5. Profile */}
      <Link
        href={isAuthenticated ? '/dashboard?tab=profile' : '/login'}
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg transition-colors ${
          isProfile ? 'text-[#4F9D2F]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <User className={`w-5 h-5 ${isProfile ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className={`text-[10px] mt-0.5 ${isProfile ? 'font-black' : 'font-medium'}`}>
          Profile
        </span>
      </Link>
    </nav>
  );
}
