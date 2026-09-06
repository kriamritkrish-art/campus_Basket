'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  Home,
  LayoutGrid,
  Zap,
  Package,
  User
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenCategories: () => void;
}

export function MobileBottomNav({ onOpenCategories }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  // Hide on Enterprise & Partner Portals
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery')
  ) {
    return null;
  }

  const isHome = pathname === '/';
  const isExpress = pathname === '/food' || pathname === '/fruits';
  const isOrders = pathname?.startsWith('/orders');
  const isAccount = pathname === '/dashboard' || pathname === '/login' || pathname === '/register';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none pb-safe"
    >
      {/* 1. Home */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg transition-colors ${
          isHome ? 'text-[#689f38]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className={`text-[10px] mt-0.5 ${isHome ? 'font-black' : 'font-medium'}`}>
          Home
        </span>
      </Link>

      {/* 2. Categories Sheet Trigger */}
      <button
        type="button"
        onClick={onOpenCategories}
        className="flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg transition-colors text-gray-500 hover:text-[#689f38]"
      >
        <LayoutGrid className="w-5 h-5 stroke-[1.8]" />
        <span className="text-[10px] mt-0.5 font-medium">
          Categories
        </span>
      </button>

      {/* 3. Express Delivery */}
      <Link
        href="/food"
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg relative transition-colors ${
          isExpress ? 'text-[#689f38]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <div className="relative">
          <Zap className={`w-5 h-5 ${isExpress ? 'fill-[#689f38] stroke-[#689f38]' : 'stroke-[1.8]'}`} />
          <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[8px] font-black px-1 rounded-full animate-pulse leading-tight">
            15m
          </span>
        </div>
        <span className={`text-[10px] mt-0.5 ${isExpress ? 'font-black' : 'font-medium'}`}>
          Express
        </span>
      </Link>

      {/* 4. Orders */}
      <Link
        href="/orders"
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg transition-colors ${
          isOrders ? 'text-[#689f38]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <Package className={`w-5 h-5 ${isOrders ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className={`text-[10px] mt-0.5 ${isOrders ? 'font-black' : 'font-medium'}`}>
          Orders
        </span>
      </Link>

      {/* 5. Account / Profile */}
      <Link
        href={isAuthenticated ? '/dashboard' : '/login'}
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[54px] rounded-lg transition-colors ${
          isAccount ? 'text-[#689f38]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <User className={`w-5 h-5 ${isAccount ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className={`text-[10px] mt-0.5 ${isAccount ? 'font-black' : 'font-medium'}`}>
          {isAuthenticated ? 'Account' : 'Login'}
        </span>
      </Link>
    </nav>
  );
}
