'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { QuickActionModal } from '../../components/admin/QuickActionModal';
import { ProductFormModal } from '../../components/admin/ProductFormModal';
import { apiRequest } from '../../lib/api';
import {
  ShieldCheck,
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Boxes,
  ClipboardList,
  Utensils,
  Apple,
  Shirt,
  BookOpen,
  Users,
  Store,
  Truck,
  Building2,
  CreditCard,
  Banknote,
  RotateCcw,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  History,
  Tag,
  Megaphone,
  MapPin,
  Clock,
  Bell,
  HelpCircle,
  Settings,
  ShieldAlert,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  Download,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Activity
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Mobile sidebar drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Global Date Range & Search
  const [dateRange, setDateRange] = useState('30d');
  const [globalSearch, setGlobalSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Guard Check
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?role=ADMIN&redirect=' + encodeURIComponent(pathname));
      } else if (role !== 'ADMIN') {
        if (role === 'SERVICE_PROVIDER') {
          router.push('/provider/dashboard');
        } else if (role === 'DELIVERY_BOY') {
          router.push('/delivery/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [isAuthenticated, role, isLoading, pathname, router]);

  // Load Categories for global modals
  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      apiRequest('/api/admin/categories')
        .then((res) => {
          if (res.success && res.categories) setCategories(res.categories);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, role]);

  const navGroups = [
    {
      title: 'DASHBOARD',
      items: [
        { label: 'Executive Overview', href: '/admin/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'COMMERCE',
      items: [
        { label: 'Products', href: '/admin/products', icon: ShoppingBag },
        { label: 'Product Approvals', href: '/admin/product-approvals', icon: CheckCircle2 },
        { label: 'Categories', href: '/admin/categories', icon: Layers },
        { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
        { label: 'Orders', href: '/admin/orders', icon: ClipboardList }
      ]
    },
    {
      title: 'SERVICES',
      items: [
        { label: 'Food & Meals', href: '/admin/services/food', icon: Utensils },
        { label: 'Fresh Fruits', href: '/admin/services/fruits', icon: Apple },
        { label: 'Express Laundry', href: '/admin/services/laundry', icon: Shirt },
        { label: 'Stationery & Essentials', href: '/admin/services/essentials', icon: BookOpen }
      ]
    },
    {
      title: 'PEOPLE',
      items: [
        { label: 'Students', href: '/admin/students', icon: Users },
        { label: 'Service Providers', href: '/admin/providers', icon: Store },
        { label: 'Delivery Boys', href: '/admin/delivery-boys', icon: Truck },
        { label: 'Residence Halls', href: '/admin/halls', icon: Building2 }
      ]
    },
    {
      title: 'PAYMENTS',
      items: [
        { label: 'Transactions', href: '/admin/payments', icon: CreditCard },
        { label: 'Cash on Delivery (COD)', href: '/admin/payments?tab=cod', icon: Banknote },
        { label: 'Refunds', href: '/admin/payments?tab=refunds', icon: RotateCcw }
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { label: 'Power BI Suite', href: '/admin/analytics', icon: BarChart3 },
        { label: 'Sales Trends', href: '/admin/analytics?tab=sales', icon: TrendingUp }
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { label: 'Generate PDF Report', href: '/admin/reports', icon: FileSpreadsheet },
        { label: 'Report History', href: '/admin/reports?tab=history', icon: History }
      ]
    },
    {
      title: 'MARKETING',
      items: [
        { label: 'Coupons', href: '/admin/marketing?tab=coupons', icon: Tag },
        { label: 'Announcements', href: '/admin/marketing?tab=announcements', icon: Megaphone }
      ]
    },
    {
      title: 'CAMPUS',
      items: [
        { label: 'Service Zones (Maps)', href: '/admin/zones', icon: MapPin },
        { label: 'Business Hours', href: '/admin/campus', icon: Clock }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Support Tickets', href: '/admin/system/tickets', icon: HelpCircle },
        { label: 'Settings', href: '/admin/system/settings', icon: Settings },
        { label: 'Audit Logs', href: '/admin/system/audit', icon: ShieldAlert }
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
          <p className="text-xs text-slate-600 font-semibold tracking-wide">
            Authenticating Administrative Access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'ADMIN') {
    return null;
  }

  const handleExportCsv = () => {
    const token = localStorage.getItem('nit_token');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    window.open(`${backendUrl}/api/admin/reports/export-csv?type=orders&token=${token}`, '_blank');
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    router.push(`/admin/orders?search=${encodeURIComponent(globalSearch.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-[#17202A] flex">
      {/* 1. FIXED DESKTOP SIDEBAR (#0F172A Dark Navy) */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0F172A] border-r border-slate-800 fixed inset-y-0 z-30 shadow-xl">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-[#0B1120]">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#4F9D32] shadow-md shadow-[#4F9D32]/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-white uppercase leading-none">
                Campus Basket
              </div>
              <div className="text-[10px] text-[#4F9D32] font-bold tracking-wider uppercase mt-1">
                NIT Durgapur Ops &amp; BI
              </div>
            </div>
          </Link>
          <span className="text-[9px] bg-[#4F9D32]/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full border border-[#4F9D32]/30">
            PROD
          </span>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {group.title}
              </div>
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#4F9D32] text-white font-bold shadow-md shadow-[#4F9D32]/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* System Health Status Footer */}
        <div className="p-3 bg-[#0B1120] border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] px-2 text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#4F9D32] animate-pulse" />
              MySQL Online
            </span>
            <span className="font-mono text-[10px] text-slate-500">v1.0.0</span>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                SS
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">
                  Sourav Senapati
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  souravsenapati408@gmail.com
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER NAVIGATION */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-[#0F172A] border-r border-slate-800 flex flex-col h-full z-50 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#4F9D32]" />
                <span className="text-xs font-black text-white uppercase">Campus Basket Ops</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <div className="px-2 text-[10px] font-black uppercase text-slate-500">
                    {group.title}
                  </div>
                  {group.items.map((item, iIdx) => (
                    <Link
                      key={iIdx}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-400 bg-red-500/10 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT WRAPPER */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* ENTERPRISE TOPBAR (Pure White #FFFFFF with #E2E8F0 border) */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-xs">
          {/* Left: Mobile trigger & Global Admin Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Admin Search Bar */}
            <form onSubmit={handleGlobalSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Global admin search (Order ID, Student roll, SKU)..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
              />
            </form>
          </div>

          {/* Right Controls: System Status, Date Range, Quick Action, Export, Refresh, Notifications, Profile */}
          <div className="flex items-center gap-2.5">
            {/* System Status Indicator Pill */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#347A27] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#4F9D32] animate-pulse" />
              <span>System Healthy (12ms)</span>
            </div>

            {/* Global Date Range Selector */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#4F9D32] cursor-pointer appearance-none pr-7 hover:bg-slate-100 transition"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="this_year">This Year</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Quick Action Button (#4F9D32 Brand Green) */}
            <button
              onClick={() => setIsQuickActionOpen(true)}
              className="px-3 py-1.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quick Action</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              title="Download Orders CSV"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              onClick={() => window.location.reload()}
              title="Refresh Operations"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC2626]" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl space-y-3 z-50 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-[#17202A] uppercase text-[10px]">Campus Alerts</span>
                    <span className="text-[10px] text-[#4F9D32] font-semibold">2 Actionable</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-red-50 border border-red-200">
                      <div className="font-bold text-red-800 text-[11px]">Low Stock Warning</div>
                      <div className="text-[10px] text-red-700 mt-0.5">Casio fx-991EX inventory below threshold (2 left)</div>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="font-bold text-amber-800 text-[11px]">Express Laundry Scheduled</div>
                      <div className="text-[10px] text-amber-700 mt-0.5">Hall 11 Room B-304 requested evening pickup</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Pill */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-[11px] font-bold flex items-center justify-center">
                SS
              </div>
              <span className="text-xs font-bold text-[#17202A] hidden xl:inline">
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT (#F5F7F5 background) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* GLOBAL MODALS */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onOpenProductModal={() => setIsProductModalOpen(true)}
      />

      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
        categories={categories}
      />
    </div>
  );
}
