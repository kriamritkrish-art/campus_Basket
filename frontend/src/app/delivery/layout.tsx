'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DeliveryProvider,
  useDelivery,
} from '@/context/DeliveryContext';
import OtpModal from '@/components/delivery/OtpModal';
import {
  LayoutDashboard,
  Package,
  Bike,
  Compass,
  History,
  IndianRupee,
  Target,
  Bell,
  User,
  LifeBuoy,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Phone,
  ShieldAlert,
  X,
} from 'lucide-react';

function DeliveryLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isOnline,
    toggleOnline,
    showOfflineConfirmModal,
    setShowOfflineConfirmModal,
    confirmGoOffline,
    activeOrders,
    activeOrder,
    notifications,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    successToast,
    setSuccessToast,
  } = useDelivery();

  // If on login page, render clean standalone page
  if (pathname === '/delivery/login') {
    return <>{children}</>;
  }

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const getPageTitle = () => {
    if (pathname.includes('/active')) return 'Active Delivery';
    if (pathname.includes('/deliveries')) return 'Available Deliveries';
    if (pathname.includes('/history')) return 'Delivery History';
    if (pathname.includes('/earnings')) return 'Earnings & Payouts';
    if (pathname.includes('/incentives')) return 'Incentives & Targets';
    if (pathname.includes('/notifications')) return 'Notifications & Alerts';
    if (pathname.includes('/profile')) return 'Runner Profile';
    if (pathname.includes('/settings')) return 'Partner Settings';
    if (pathname.includes('/support')) return 'Campus Runner Support';
    return 'Runner Dashboard';
  };

  const navGroups = [
    {
      groupTitle: 'MAIN',
      items: [
        {
          label: 'Dashboard',
          href: '/delivery/dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          label: 'Deliveries',
          href: '/delivery/deliveries',
          icon: Package,
          badge: null,
        },
        {
          label: 'Active Delivery',
          href: '/delivery/active',
          icon: Bike,
          badge: activeOrders.length > 0 ? `${activeOrders.length}` : null,
          badgeColor: 'bg-emerald-500 text-white font-bold',
        },
        {
          label: 'Available Deliveries',
          href: '/delivery/deliveries',
          icon: Compass,
          badge: '3',
          badgeColor: 'bg-amber-100 text-amber-800 font-bold',
        },
      ],
    },
    {
      groupTitle: 'OPERATIONS',
      items: [
        {
          label: 'Delivery History',
          href: '/delivery/history',
          icon: History,
          badge: null,
        },
        {
          label: 'Earnings',
          href: '/delivery/earnings',
          icon: IndianRupee,
          badge: null,
        },
        {
          label: 'Incentives',
          href: '/delivery/incentives',
          icon: Target,
          badge: '80%',
          badgeColor: 'bg-green-100 text-green-800',
        },
      ],
    },
    {
      groupTitle: 'ACCOUNT',
      items: [
        {
          label: 'Notifications',
          href: '/delivery/notifications',
          icon: Bell,
          badge: unreadNotifsCount > 0 ? `${unreadNotifsCount}` : null,
          badgeColor: 'bg-red-500 text-white animate-pulse',
        },
        {
          label: 'Profile',
          href: '/delivery/profile',
          icon: User,
          badge: null,
        },
        {
          label: 'Help & Support',
          href: '/delivery/support',
          icon: LifeBuoy,
          badge: null,
        },
        {
          label: 'Settings',
          href: '/delivery/settings',
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  const handleLogout = () => {
    router.push('/delivery/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#111827] flex flex-col font-sans">
      {/* SUCCESS TOAST NOTIFICATION */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[1100] max-w-md w-[92%] bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* OFFLINE CONFIRMATION MODAL */}
      {showOfflineConfirmModal && (
        <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Active Delivery in Progress!
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              You are currently handling order{' '}
              <span className="font-bold text-gray-900">
                {activeOrder?.orderNumber}
              </span>{' '}
              to {activeOrder?.destination}. Are you sure you want to pause receiving further assignments and go offline?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-5 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Your current active order will remain active on your dashboard until delivered.
              </span>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowOfflineConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Keep Online
              </button>
              <button
                onClick={confirmGoOffline}
                className="px-4 py-2.5 rounded-xl bg-red-600 font-bold text-sm text-white hover:bg-red-700 shadow-sm transition"
              >
                Go Offline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTWEIGHT ONE-TAP OTP MODAL */}
      <OtpModal />

      {/* MOBILE DRAWER BACKDROP */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[998] md:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ==================================================
          DESKTOP & TABLET FIXED SIDEBAR / MOBILE DRAWER
         ================================================== */}
      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${
          mobileDrawerOpen ? 'open' : ''
        }`}
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        }}
      >
        {/* LOGO & BRAND */}
        <div className="sidebar-logo border-b border-gray-100 flex items-center justify-between px-3">
          <Link
            href="/delivery/dashboard"
            className="flex items-center gap-2.5 overflow-hidden"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-[#4F9D2F] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <Bike className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="sidebar-hide-collapsed leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-gray-900">
                    campus basket
                  </span>
                  <span className="bg-[#4F9D2F] text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider">
                    RUNNER
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  NIT Durgapur Partner Portal
                </p>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="sidebar-content space-y-5">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="sidebar-group">
              {!sidebarCollapsed && (
                <div className="sidebar-hide-collapsed px-3 mb-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  {group.groupTitle}
                </div>
              )}
              <nav className="sidebar-nav">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <IconComponent
                        className={`nav-icon ${
                          isActive ? 'text-[#36751F]' : 'text-gray-500'
                        }`}
                      />
                      {!sidebarCollapsed && (
                        <div className="sidebar-hide-collapsed flex-1 flex items-center justify-between">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.badgeColor || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* SIDEBAR FOOTER: ONLINE/OFFLINE + LOGOUT */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-2">
          {/* Status Switcher Box */}
          <button
            onClick={toggleOnline}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition ${
              isOnline
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
            }`}
            title={isOnline ? 'Go Offline' : 'Go Online'}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline
                    ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]'
                    : 'bg-gray-400'
                }`}
              />
              {!sidebarCollapsed && (
                <div className="sidebar-hide-collapsed text-left">
                  <div className="text-xs font-black tracking-wide">
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </div>
                  <div className="text-[10px] text-gray-500 leading-tight">
                    {isOnline ? 'Accepting Requests' : 'Not Receiving'}
                  </div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <span className="sidebar-hide-collapsed text-[11px] font-bold text-gray-500">
                {isOnline ? 'Pause' : 'Start'}
              </span>
            )}
          </button>

          {/* Runner Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
            title="Log Out of Partner Portal"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="sidebar-hide-collapsed">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* ==================================================
          MAIN APPLICATION LAYOUT AREA
         ================================================== */}
      <div
        className={`main-layout ${
          sidebarCollapsed ? 'sidebar-collapsed' : ''
        } flex-1 flex flex-col`}
      >
        {/* TOP FIXED / STICKY HEADER (Height: 68px) */}
        <header className="top-header shadow-xs">
          {/* Left: Mobile Drawer Trigger / Desktop Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 focus:outline-none"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                Campus Basket Runner Dispatch • NIT Durgapur
              </p>
            </div>
          </div>

          {/* Right: Partner Actions */}
          <div className="header-actions">
            {/* Quick Online Status Badge */}
            <button
              onClick={toggleOnline}
              className={`delivery-status-toggle hidden sm:inline-flex ${
                isOnline ? 'delivery-status-online' : 'delivery-status-offline'
              }`}
            >
              <span className="delivery-status-dot" />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>

            {/* Notification Bell */}
            <Link
              href="/delivery/notifications"
              className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {unreadNotifsCount}
                </span>
              )}
            </Link>

            {/* Help / SOS Quick Trigger */}
            <Link
              href="/delivery/support"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition"
              title="Instant Campus SOS Help"
            >
              <Phone className="w-3.5 h-3.5 text-red-600" />
              <span>SOS Help</span>
            </Link>

            {/* Partner Info Avatar */}
            <Link
              href="/delivery/profile"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100 transition"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#36751F] to-[#4F9D2F] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  SS
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-xs font-extrabold text-gray-900">
                  Sourav Senapati
                </div>
                <div className="text-[10px] font-mono text-gray-400 font-semibold">
                  DB_BOY_01
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="main-content flex-1 w-full">
          {children}
        </main>
      </div>

      {/* ==================================================
          MOBILE BOTTOM NAVIGATION (Fixed, Height 64px)
         ================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-white border-t border-gray-200 z-[990] px-3 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {[
          { label: 'Home', href: '/delivery/dashboard', icon: LayoutDashboard },
          { label: 'Deliveries', href: '/delivery/deliveries', icon: Package },
          {
            label: 'Active',
            href: '/delivery/active',
            icon: Bike,
            hasBadge: !!activeOrder,
          },
          { label: 'Earnings', href: '/delivery/earnings', icon: IndianRupee },
          { label: 'Profile', href: '/delivery/profile', icon: User },
        ].map((tab) => {
          const isActive = pathname === tab.href;
          const IconComponent = tab.icon;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
                isActive ? 'text-[#36751F]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <IconComponent className="w-5 h-5" />
                {tab.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 ${
                  isActive ? 'font-black text-[#36751F]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeliveryProvider>
      <DeliveryLayoutInner>{children}</DeliveryLayoutInner>
    </DeliveryProvider>
  );
}
