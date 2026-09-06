'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { apiRequest } from '../../lib/api';
import { CampusLocationModal } from './CampusLocationModal';
import {
  Search,
  MapPin,
  ShoppingBag,
  Bell,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Truck,
  ShieldCheck,
  Menu,
  X,
  Package
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  // Hide entirely on Enterprise Portal views
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery')
  ) {
    return null;
  }

  const router = useRouter();
  const { user, role, isAuthenticated, logout } = useAuth();
  const { itemCount, total } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHall, setSelectedHall] = useState('Hall 11');
  const [roomNumber, setRoomNumber] = useState('Room 123');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(2);

  // Sync Location from localStorage and listen to updates
  useEffect(() => {
    const syncLocation = () => {
      if (typeof window !== 'undefined') {
        const h = localStorage.getItem('cb_selected_hall') || user?.student?.hall?.name || 'Hall 11';
        const r = localStorage.getItem('cb_room_number') || user?.student?.roomNumber || 'Room 123';
        setSelectedHall(h);
        setRoomNumber(r);
      }
    };
    syncLocation();
    window.addEventListener('cb_location_updated', syncLocation);
    return () => window.removeEventListener('cb_location_updated', syncLocation);
  }, [user]);

  // Check for active orders for the student
  useEffect(() => {
    if (isAuthenticated && (!role || role === 'STUDENT')) {
      apiRequest('/api/orders')
        .then((res) => {
          if (res.success && Array.isArray(res.orders)) {
            const active = res.orders.find((o: any) =>
              ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status)
            );
            setActiveOrder(active || null);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, role]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/food?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Tier 1: Main Campus Header */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
            {/* LEFT: Campus Basket Logo & Subtitle */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#4F9D2F] flex items-center justify-center text-white font-extrabold text-xs sm:text-sm shadow-xs group-hover:bg-[#36751F] transition-colors">
                cb
              </div>
              <div>
                <div className="font-extrabold text-[#172033] text-base sm:text-lg tracking-tight leading-none flex items-center gap-1">
                  <span>campus</span>
                  <span className="text-[#4F9D2F]">basket</span>
                </div>
                <div className="hidden sm:block text-[9px] sm:text-[10px] font-semibold tracking-wide text-[#667085] uppercase mt-0.5">
                  A NIT Durgapur Campus Marketplace
                </div>
              </div>
            </Link>

            {/* CENTER: Large Contextual Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  type="text"
                  placeholder="Search food, laundry, stationery, essentials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-20 rounded-xl bg-[#F7F8F6] border border-[#E5E7EB] text-xs text-[#172033] placeholder:text-gray-400 focus:outline-none focus:border-[#4F9D2F] focus:bg-white focus:ring-1 focus:ring-[#4F9D2F] transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 h-7 px-3 bg-[#4F9D2F] hover:bg-[#36751F] text-white text-[11px] font-bold rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* RIGHT: Campus Location + Compact Professional Basket + Notifications + Profile */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Campus Location Button */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#F7F8F6] hover:bg-[#EEF7E9] border border-[#E5E7EB] text-left transition-colors group cursor-pointer shrink-0"
                title="Change Campus Delivery Location"
              >
                <MapPin className="w-3.5 h-3.5 text-[#4F9D2F] shrink-0" />
                <div className="leading-tight">
                  <div className="text-[11px] font-black text-[#172033] flex items-center gap-1">
                    <span className="truncate max-w-[60px] sm:max-w-none">{selectedHall}</span>
                    <span className="hidden sm:inline text-gray-300">•</span>
                    <span className="hidden sm:inline text-gray-600 font-semibold">{roomNumber}</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#4F9D2F] group-hover:underline">
                    Change
                  </div>
                </div>
              </button>

              {/* Compact Professional Basket Button */}
              <Link
                href="/cart"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-[#F7F8F6] border border-[#E5E7EB] hover:border-[#4F9D2F] text-[#172033] shadow-xs transition-all active:scale-95 shrink-0 group"
                aria-label="View Shopping Basket"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 text-[#4F9D2F]" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#4F9D2F] text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <div className="text-left text-xs leading-tight flex items-center gap-1">
                  <span className="hidden sm:inline text-gray-600 text-[11px] font-semibold">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                  <span className="hidden sm:inline text-gray-300">•</span>
                  <span className="text-[#172033] font-black">₹{total.toFixed(0)}</span>
                </div>
              </Link>

              {/* Notifications Bell (Desktop) */}
              <Link
                href="/dashboard?tab=notifications"
                className="hidden sm:flex relative p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-[#F7F8F6] border border-transparent hover:border-[#E5E7EB] transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4F9D2F] rounded-full ring-2 ring-white" />
                )}
              </Link>

              {/* Auth / Profile Dropdown */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl bg-[#F7F8F6] hover:bg-gray-100 border border-[#E5E7EB] text-xs font-bold text-[#172033] transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#4F9D2F] text-white flex items-center justify-center text-xs font-black">
                      {user?.student?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden sm:inline">
                      {user?.student?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Profile'}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Menu */}
                  {profileDropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-2xl p-2 z-50 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setProfileDropdownOpen(false)}
                    >
                      <div className="p-3">
                        <div className="text-xs font-black text-gray-900">
                          {user?.student?.fullName || 'Student'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono truncate">
                          {user?.email}
                        </div>
                        <div className="text-[10px] text-[#4F9D2F] font-bold mt-1">
                          📍 {selectedHall} • {roomNumber}
                        </div>
                      </div>

                      {activeOrder && (
                        <div className="p-1">
                          <Link
                            href={`/orders/${activeOrder.id}/track`}
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#EEF7E9] text-xs font-bold text-[#36751F] border border-[#dcedc8]"
                          >
                            <span className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-[#4F9D2F]" />
                              Track Active Order
                            </span>
                            <span className="text-[10px] bg-[#4F9D2F] text-white px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          </Link>
                        </div>
                      )}

                      <div className="p-1 space-y-0.5 text-xs text-gray-700">
                        <Link
                          href="/dashboard?tab=profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          <span>📊</span>
                          <span>Overview &amp; Profile</span>
                        </Link>
                        <Link
                          href="/dashboard?tab=orders"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          <span>📦</span>
                          <span>My Orders</span>
                        </Link>
                        <Link
                          href="/dashboard?tab=refunds"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          <span>↩</span>
                          <span>Refunds &amp; Cancellations</span>
                        </Link>
                        <Link
                          href="/dashboard?tab=payments"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          <span>💳</span>
                          <span>Campus Wallet &amp; Payments</span>
                        </Link>
                        <Link
                          href="/dashboard?tab=support"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          <span>🛟</span>
                          <span>Help &amp; Support</span>
                        </Link>
                      </div>

                      <div className="p-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 font-bold text-xs cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl bg-[#172033] hover:bg-black text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
                >
                  Login
                </Link>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-gray-700 hover:bg-gray-100"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Contextual Search Field */}
          <form onSubmit={handleSearch} className="pb-2.5 md:hidden">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3" />
              <input
                type="text"
                placeholder="Search food, laundry, stationery, essentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-16 rounded-xl bg-[#F7F8F6] border border-[#E5E7EB] text-xs text-[#172033] placeholder:text-gray-400 focus:outline-none focus:border-[#4F9D2F] focus:bg-white"
              />
              <button
                type="submit"
                className="absolute right-1 h-7 px-2.5 bg-[#4F9D2F] text-white text-xs font-bold rounded-lg"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Tier 2: Sub-Navigation Bar (DESKTOP ONLY) */}
        <div className="hidden md:block border-t border-[#E5E7EB] bg-[#FCFDFB]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-10 text-xs">
              <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar font-semibold">
                <Link
                  href="/"
                  className={`transition-colors py-1 ${pathname === '/' ? 'text-[#4F9D2F] font-bold border-b-2 border-[#4F9D2F]' : 'text-gray-600 hover:text-[#172033]'}`}
                >
                  Home
                </Link>
                <a
                  href="/#campus-services"
                  className="text-gray-600 hover:text-[#172033] transition-colors py-1"
                >
                  Campus Services
                </a>
                <Link
                  href="/dashboard?tab=orders"
                  className={`transition-colors py-1 ${pathname?.includes('orders') && !pathname?.includes('track') ? 'text-[#4F9D2F] font-bold border-b-2 border-[#4F9D2F]' : 'text-gray-600 hover:text-[#172033]'}`}
                >
                  Orders
                </Link>
                <Link
                  href={activeOrder ? `/orders/${activeOrder.id}/track` : '/dashboard?tab=orders'}
                  className="text-gray-600 hover:text-[#172033] transition-colors py-1 flex items-center gap-1"
                >
                  <span>Track Order</span>
                  {activeOrder && (
                    <span className="w-2 h-2 rounded-full bg-[#4F9D2F] animate-pulse" />
                  )}
                </Link>
                <Link
                  href="/dashboard?tab=support"
                  className="text-gray-600 hover:text-[#172033] transition-colors py-1"
                >
                  Support
                </Link>
              </div>

              {/* Verified Campus Hub Status */}
              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F9D2F]" />
                <span>NIT Durgapur Verified Campus Hub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 py-4 space-y-3">
            <button
              onClick={() => {
                setIsLocationModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F7F8F6] text-xs font-bold text-[#172033]"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#4F9D2F]" />
                <span>{selectedHall} • {roomNumber}</span>
              </div>
              <span className="text-[#4F9D2F]">Change</span>
            </button>

            <div className="space-y-1 text-xs font-bold text-gray-700">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 rounded-lg hover:bg-gray-50"
              >
                Home
              </Link>
              <a
                href="/#campus-services"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 rounded-lg hover:bg-gray-50"
              >
                Campus Services
              </a>
              <Link
                href="/dashboard?tab=orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 rounded-lg hover:bg-gray-50"
              >
                My Orders
              </Link>
              <Link
                href={activeOrder ? `/orders/${activeOrder.id}/track` : '/dashboard?tab=orders'}
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 rounded-lg hover:bg-gray-50 text-[#4F9D2F]"
              >
                Track Active Order {activeOrder ? `(#${activeOrder.orderNumber})` : ''}
              </Link>
              <Link
                href="/dashboard?tab=support"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 rounded-lg hover:bg-gray-50"
              >
                Help &amp; Support
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Campus Location Selection Modal */}
      <CampusLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationChange={(hall, room) => {
          setSelectedHall(hall);
          setRoomNumber(room);
        }}
      />
    </>
  );
}
