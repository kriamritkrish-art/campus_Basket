'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../lib/api';
import { Product, Order } from '../types';
import { FALLBACK_STORE_PRODUCTS } from '../lib/fallbackCatalog';
import { ProductCard } from '../components/products/ProductCard';
import { LaundryBookingDrawer } from '../components/laundry/LaundryBookingDrawer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Utensils,
  Apple,
  Shirt,
  BookOpen,
  Package,
  Zap,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Sparkles,
  Search,
  Truck,
  RotateCcw,
  ArrowRight,
  Plus,
  Building,
  Check,
  ChevronDown
} from 'lucide-react';

type CategoryKey = 'all' | 'food' | 'fruits' | 'laundry' | 'stationery' | 'essentials';

interface ServiceCard {
  id: CategoryKey;
  key: string;
  icon: string;
  title: string;
  desc: string;
  badge?: string;
  href: string;
}

const CAMPUS_SERVICES: ServiceCard[] = [
  {
    id: 'food',
    key: 'food',
    icon: '🍱',
    title: 'Food & Meals',
    desc: 'Fresh campus meals',
    badge: '10–15 min',
    href: '/food'
  },
  {
    id: 'fruits',
    key: 'fruits',
    icon: '🍎',
    title: 'Fresh Produce',
    desc: 'Fruits & essentials',
    badge: 'Orchard Fresh',
    href: '/fruits'
  },
  {
    id: 'laundry',
    key: 'laundry',
    icon: '👕',
    title: 'Laundry',
    desc: 'Doorstep laundry',
    badge: 'Dual-OTP',
    href: '/laundry'
  },
  {
    id: 'stationery',
    key: 'stationery',
    icon: '📚',
    title: 'Stationery',
    desc: 'Academic supplies',
    badge: 'Lab Ready',
    href: '/essentials?category=stationery'
  },
  {
    id: 'essentials',
    key: 'essentials',
    icon: '🧴',
    title: 'Daily Essentials',
    desc: 'Hostel essentials',
    badge: 'In Stock',
    href: '/essentials'
  },
  {
    id: 'all',
    key: 'all',
    icon: '🏫',
    title: 'Campus Services',
    desc: 'Student services',
    badge: 'Verified',
    href: '/#campus-services'
  }
];

const LAUNDRY_SERVICES_LIST = [
  {
    id: 'ls_wash_iron',
    name: 'Daily Wash & Steam Iron',
    price: '₹15',
    unit: '/ garment',
    desc: 'Gentle detergent wash, fabric softening, precision steam iron & folded delivery.',
    time: '24-48 Hours',
    icon: '👔',
    popular: true,
  },
  {
    id: 'ls_express',
    name: '12-Hour Urgent Express Wash',
    price: '₹25',
    unit: '/ garment',
    desc: 'Priority queue wash, quick dry & crisp press for next-day interviews and lab exams.',
    time: '12 Hours',
    icon: '⚡',
    popular: false,
  },
  {
    id: 'ls_blanket',
    name: 'Heavy Blanket & Winterwear',
    price: '₹80',
    unit: '/ piece',
    desc: 'Heavy industrial drum wash and deep sanitization for quilts, comforters and jackets.',
    time: '48 Hours',
    icon: '🛋️',
    popular: false,
  },
  {
    id: 'ls_shoe',
    name: 'Campus Shoe Spa & Sanitization',
    price: '₹60',
    unit: '/ pair',
    desc: 'Deep cleaning of sole, mesh stain removal, deodorization and antifungal mist spray.',
    time: '24 Hours',
    icon: '👟',
    popular: false,
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, showToast } = useCart();

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [products, setProducts] = useState<Product[]>(FALLBACK_STORE_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSubfilter, setSelectedSubfilter] = useState('all');
  const [activeOrder, setActiveOrder] = useState<any>(null);

  const studentName =
    user?.student?.fullName?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Sourav';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await apiRequest('/api/products?limit=50');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        } else {
          setProducts(FALLBACK_STORE_PRODUCTS);
        }
      } catch (err) {
        setProducts(FALLBACK_STORE_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category') as CategoryKey;
      if (cat && ['food', 'fruits', 'laundry', 'stationery', 'essentials', 'all'].includes(cat)) {
        setActiveCategory(cat);
      }
    }
  }, []);

  // Fetch active order for the student if logged in
  useEffect(() => {
    if (user) {
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
  }, [user]);

  // Filter products by active category, search string, and subfilter
  const filteredProducts = useMemo(() => {
    let list = products;

    if (activeCategory !== 'all' && activeCategory !== 'laundry') {
      if (activeCategory === 'stationery') {
        list = list.filter(
          (p) =>
            p.category?.slug === 'stationery' ||
            p.categoryId === 'cat_stationery' ||
            p.name.toLowerCase().includes('pen') ||
            p.name.toLowerCase().includes('notebook') ||
            p.name.toLowerCase().includes('calculator') ||
            p.name.toLowerCase().includes('sheet') ||
            p.name.toLowerCase().includes('drafter')
        );
      } else {
        list = list.filter(
          (p) => p.category?.slug === activeCategory || p.categoryId === 'cat_' + activeCategory
        );
      }
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q)
      );
    }

    if (selectedSubfilter !== 'all') {
      if (selectedSubfilter === 'discount') {
        list = list.filter((p) => p.discountPrice && p.discountPrice < p.price);
      } else if (selectedSubfilter === 'veg') {
        list = list.filter(
          (p) =>
            !p.name.toLowerCase().includes('chicken') &&
            !p.name.toLowerCase().includes('egg')
        );
      } else if (selectedSubfilter === 'non-veg') {
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes('chicken') ||
            p.name.toLowerCase().includes('egg')
        );
      }
    }

    return list;
  }, [products, activeCategory, searchFilter, selectedSubfilter]);

  const handleCategoryClick = (svc: ServiceCard) => {
    // If already active, tapping navigates to dedicated store
    if (activeCategory === svc.id && svc.href && svc.href !== '/#campus-services') {
      router.push(svc.href);
      return;
    }
    setActiveCategory(svc.id);
    setSelectedSubfilter('all');
    if (svc.id === 'laundry') {
      const el = document.getElementById('laundry-booking-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Specific student favorites for "Order Again" section
  const orderAgainItems = useMemo(() => {
    return products.slice(0, 3);
  }, [products]);

  // Smart pick recommendation item
  const smartPickItem = useMemo(() => {
    return products.find((p) => p.name.toLowerCase().includes('samosa') || p.name.toLowerCase().includes('chai')) || products[0];
  }, [products]);

  const handleAddSmartPick = () => {
    if (smartPickItem) {
      addItem(smartPickItem, 1);
      showToast(`✓ Added to basket: ${smartPickItem.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] pb-24 text-[#172033] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-8 space-y-4 sm:space-y-8">
        
        {/* ==================================================== */}
        {/* 1. WELCOME SECTION & CONTEXTUAL SEARCH (DESKTOP ONLY) */}
        {/* ==================================================== */}
        <section className="hidden md:block bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#172033]">
              {getGreeting()}, {studentName} 👋
            </h1>
            <p className="text-sm sm:text-base font-semibold text-gray-700">
              What do you need today?
            </p>
            <p className="text-xs sm:text-sm text-[#667085]">
              Fast delivery across NIT Durgapur campus halls in 10–15 minutes.
            </p>

            {/* Embedded Contextual Search Input */}
            <div className="pt-3">
              <div className="relative flex items-center max-w-lg">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  type="text"
                  placeholder="Search food, laundry, stationery, essentials..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full h-11 pl-10 pr-24 rounded-xl bg-[#F7F8F6] border border-[#E5E7EB] text-xs sm:text-sm text-[#172033] placeholder:text-gray-400 focus:outline-none focus:border-[#4F9D2F] focus:bg-white focus:ring-1 focus:ring-[#4F9D2F] transition-all"
                />
                {searchFilter ? (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-3 text-xs font-bold text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                ) : (
                  <span className="absolute right-3 text-[11px] font-bold text-[#4F9D2F]">
                    10–15 min
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* 2. LIVE ORDER SECTION (Prominent if order is active) */}
        {/* ==================================================== */}
        {activeOrder && (
          <section className="bg-white rounded-2xl border border-[#c8e6c9] p-5 sm:p-6 shadow-xs bg-gradient-to-r from-white via-[#fcfdfa] to-[#eef7e9]/50 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4F9D2F] animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-[#36751F]">
                  Your Active Order
                </span>
                <span className="text-xs font-mono font-bold text-gray-500">
                  #{activeOrder.orderNumber || activeOrder.id?.slice(0, 8)}
                </span>
              </div>
              <span className="text-xs font-bold text-[#36751F] bg-[#eef7e9] px-2.5 py-0.5 rounded-full border border-[#dcedc8]">
                🟢 {activeOrder.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="font-bold text-[#172033] flex items-center gap-2">
                  <span>🍱 Campus Order</span>
                  <span className="text-gray-300">•</span>
                  <span>Campus Cafeteria &rarr; {activeOrder.hallName || 'Hall 11'} • {activeOrder.roomNumber || 'Room 123'}</span>
                </div>
                <div className="text-gray-500 text-[11px]">
                  Estimated Delivery Time: <strong className="text-[#172033]">8–12 minutes</strong>
                </div>
              </div>

              <Link
                href={`/orders/${activeOrder.id}/track`}
                className="px-4 py-2.5 bg-[#4F9D2F] hover:bg-[#36751F] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </Link>
            </div>
          </section>
        )}

        {/* ==================================================== */}
        {/* 3. CAMPUS SERVICES (Service Categories)              */}
        {/* ==================================================== */}
        <section id="campus-services" className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-base font-black uppercase tracking-wider text-[#172033]">
                Service Categories
              </h2>
              <span className="md:hidden text-[10px] font-bold text-[#4F9D2F] bg-[#EFF8EA] px-2 py-0.5 rounded-full border border-[#D0EBC2]">
                Swipe &rarr;
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
              10–15 min hostel delivery across 14 Halls
            </span>
          </div>

          {/* MOBILE ONLY: Compact Horizontally Scrollable Category Carousel */}
          <div className="md:hidden -mx-4 px-4 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-2.5 pb-1">
              {CAMPUS_SERVICES.map((svc) => {
                const isActive = activeCategory === svc.id;
                return (
                  <button
                    key={svc.key}
                    type="button"
                    onClick={() => handleCategoryClick(svc)}
                    className={`w-[136px] min-w-[136px] h-[116px] p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#EFF8EA] border-[#4F9D2F] ring-1 ring-[#4F9D2F] shadow-xs'
                        : 'bg-white hover:bg-[#FCFDFB] border-[#E5E7EB] hover:border-gray-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="text-2xl leading-none mb-1.5 flex items-center justify-between">
                        <span>{svc.icon}</span>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-[#4F9D2F]" />
                        )}
                      </div>
                      <div className={`font-bold text-xs leading-tight line-clamp-1 ${isActive ? 'text-[#36751F]' : 'text-[#172033]'}`}>
                        {svc.title}
                      </div>
                      <div className="text-[10.5px] text-[#667085] mt-0.5 line-clamp-1 font-medium">
                        {svc.desc}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-[#36751F] text-white'
                          : 'text-[#4F9D2F] bg-[#EEF7E9]'
                      }`}>
                        {svc.badge}
                      </span>
                      <span className={`text-[11px] font-bold ${isActive ? 'text-[#36751F]' : 'text-gray-400'}`}>
                        &rarr;
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESKTOP: 6 Modern SaaS-Style Cards Grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CAMPUS_SERVICES.map((svc) => {
              const isActive = activeCategory === svc.id;
              return (
                <button
                  key={svc.key}
                  type="button"
                  onClick={() => handleCategoryClick(svc)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-[#EFF8EA] border-[#4F9D2F] ring-1 ring-[#4F9D2F] shadow-sm'
                      : 'bg-white hover:bg-[#FCFDFB] border-[#E5E7EB] hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform flex items-center justify-between">
                      <span>{svc.icon}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-[#36751F] bg-[#dcedc8] px-1.5 py-0.5 rounded-md">Active</span>
                      )}
                    </div>
                    <div className={`font-bold text-xs sm:text-sm leading-snug ${isActive ? 'text-[#36751F]' : 'text-[#172033]'}`}>
                      {svc.title}
                    </div>
                    <div className="text-[11px] text-[#667085] mt-0.5 line-clamp-1">
                      {svc.desc}
                    </div>
                  </div>

                  {svc.badge && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-[#36751F] text-white'
                          : 'text-[#4F9D2F] bg-[#EEF7E9]'
                      }`}>
                        {svc.badge}
                      </span>
                      <span className={`text-xs font-bold ${isActive ? 'text-[#36751F]' : 'text-gray-400 group-hover:text-[#4F9D2F]'}`}>
                        &rarr;
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ==================================================== */}
        {/* 4. QUICK ACTIONS BAR                                 */}
        {/* ==================================================== */}
        <section className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Quick Actions
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('food');
                setSelectedSubfilter('all');
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#4F9D2F] text-[#172033] font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>🍱</span>
              <span>Order Food</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('laundry');
                const el = document.getElementById('laundry-booking-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#4F9D2F] text-[#172033] font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>👕</span>
              <span>Send Laundry</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('stationery');
                setSelectedSubfilter('all');
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#4F9D2F] text-[#172033] font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>📚</span>
              <span>Buy Stationery</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('essentials');
                setSelectedSubfilter('all');
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#4F9D2F] text-[#172033] font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>🧴</span>
              <span>Hostel Essentials</span>
            </button>
            <Link
              href={activeOrder ? `/orders/${activeOrder.id}/track` : '/dashboard?tab=orders'}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#4F9D2F] text-[#172033] font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>📦</span>
              <span>Track Order</span>
            </Link>
            <a
              href="#order-again"
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#4F9D2F] text-[#172033] font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>Order Again</span>
            </a>
          </div>
        </section>

        {/* ==================================================== */}
        {/* 5. PERSONALIZED SECTION: ORDER AGAIN                 */}
        {/* ==================================================== */}
        <section id="order-again" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#172033]">
                Order Again
              </h2>
              <p className="text-xs text-gray-500">Your recent campus favorites</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {orderAgainItems.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-[#F7F8F6] rounded-xl flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    <img
                      src={prod.primaryImage || prod.images?.[0]?.googleDriveUrl}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-[#172033] truncate">
                      {prod.name}
                    </h3>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-black text-[#172033]">₹{prod.discountPrice || prod.price}</span>
                      <span>•</span>
                      <span>10–15 min</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addItem(prod, 1);
                    showToast(`✓ Added to basket: ${prod.name}`);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#4F9D2F] text-[#4F9D2F] hover:bg-[#4F9D2F] hover:text-white font-bold text-xs transition-colors shrink-0 shadow-2xs"
                >
                  Add Again
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ==================================================== */}
        {/* 6. SMART PICK RECOMMENDATION                         */}
        {/* ==================================================== */}
        {smartPickItem && (
          <section className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-white via-white to-[#EEF7E9]/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eef7e9] text-[#4F9D2F] flex items-center justify-center text-lg shrink-0">
                ✨
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4F9D2F]">
                  Smart Pick
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#172033]">
                  Complete your order with: <span className="font-extrabold">{smartPickItem.name}</span>
                </div>
                <div className="text-[11px] text-gray-500">
                  Popular pair with hostel meals &bull; 10 min room delivery
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSmartPick}
              className="px-4 py-2 rounded-xl bg-[#4F9D2F] hover:bg-[#36751F] text-white text-xs font-bold shadow-xs transition-transform active:scale-95 shrink-0 flex items-center gap-1.5 justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add ₹{smartPickItem.discountPrice || smartPickItem.price}</span>
            </button>
          </section>
        )}

        {/* ==================================================== */}
        {/* 7. POPULAR ON CAMPUS (Product Discovery)             */}
        {/* ==================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                <span>🔥 Popular on Campus</span>
              </h2>
              <p className="text-xs text-gray-500">
                Trending snacks, cafeteria meals, fresh fruits and essentials based on student activity
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setSelectedSubfilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                  activeCategory === 'all'
                    ? 'bg-[#172033] text-white'
                    : 'bg-white border border-[#E5E7EB] text-gray-600 hover:text-gray-900'
                }`}
              >
                All Items
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('food');
                  setSelectedSubfilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                  activeCategory === 'food'
                    ? 'bg-[#172033] text-white'
                    : 'bg-white border border-[#E5E7EB] text-gray-600 hover:text-gray-900'
                }`}
              >
                Food &amp; Meals
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('fruits');
                  setSelectedSubfilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                  activeCategory === 'fruits'
                    ? 'bg-[#172033] text-white'
                    : 'bg-white border border-[#E5E7EB] text-gray-600 hover:text-gray-900'
                }`}
              >
                Fresh Produce
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('stationery');
                  setSelectedSubfilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                  activeCategory === 'stationery'
                    ? 'bg-[#172033] text-white'
                    : 'bg-white border border-[#E5E7EB] text-gray-600 hover:text-gray-900'
                }`}
              >
                Stationery
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('essentials');
                  setSelectedSubfilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                  activeCategory === 'essentials'
                    ? 'bg-[#172033] text-white'
                    : 'bg-white border border-[#E5E7EB] text-gray-600 hover:text-gray-900'
                }`}
              >
                Hostel Essentials
              </button>
            </div>
          </div>

          {/* Active Category Direct Store Link */}
          {activeCategory !== 'all' && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#EFF8EA] border border-[#D0EBC2] shadow-2xs text-xs">
              <span className="font-bold text-[#172033] flex items-center gap-1.5">
                <span className="text-gray-500 font-medium">Filtered:</span>
                <span className="text-[#36751F] font-black">{CAMPUS_SERVICES.find(s => s.id === activeCategory)?.title}</span>
              </span>
              <Link
                href={CAMPUS_SERVICES.find(s => s.id === activeCategory)?.href || '/'}
                className="text-xs font-black text-[#36751F] hover:text-[#4F9D2F] flex items-center gap-1 hover:underline"
              >
                <span>Open dedicated store &rarr;</span>
              </Link>
            </div>
          )}

          {/* Quick Dietary / Offer Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs pt-1">
            <span className="text-gray-400 font-bold text-[11px] uppercase tracking-wider">Filter:</span>
            <button
              type="button"
              onClick={() => setSelectedSubfilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedSubfilter === 'all'
                  ? 'bg-[#4F9D2F] text-white'
                  : 'bg-white border border-[#E5E7EB] text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubfilter(selectedSubfilter === 'discount' ? 'all' : 'discount')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedSubfilter === 'discount'
                  ? 'bg-[#4F9D2F] text-white'
                  : 'bg-white border border-[#E5E7EB] text-gray-700 hover:bg-gray-50'
              }`}
            >
              10% OFF Deals
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubfilter(selectedSubfilter === 'veg' ? 'all' : 'veg')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                selectedSubfilter === 'veg'
                  ? 'bg-[#2e7d32] text-white'
                  : 'bg-white border border-[#E5E7EB] text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="veg-icon" />
              <span>Pure Veg</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubfilter(selectedSubfilter === 'non-veg' ? 'all' : 'non-veg')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                selectedSubfilter === 'non-veg'
                  ? 'bg-[#d32f2f] text-white'
                  : 'bg-white border border-[#E5E7EB] text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="non-veg-icon" />
              <span>Non-Veg</span>
            </button>
          </div>

          {/* Product Grid */}
          {activeCategory === 'laundry' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LAUNDRY_SERVICES_LIST.map((srv) => (
                  <div
                    key={srv.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:shadow-md transition-shadow relative space-y-3"
                  >
                    {srv.popular && (
                      <div className="absolute top-0 right-0 bg-[#4F9D2F] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                        Most Booked
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{srv.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{srv.name}</h3>
                        <div className="text-xs font-semibold text-gray-500">
                          Turnaround: <span className="text-gray-800">{srv.time}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{srv.desc}</p>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-gray-900">{srv.price}</span>
                        <span className="text-xs text-gray-500 ml-1">{srv.unit}</span>
                      </div>
                      <a
                        href="#laundry-booking-section"
                        className="px-3.5 py-1.5 rounded-lg bg-[#eef7e9] text-[#36751F] font-bold text-xs transition-colors"
                      >
                        Book Now
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div id="laundry-booking-section" className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    Schedule Hostel Room Pickup
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select your garments, hall number, and preferred pickup slot. You will receive a Dual-OTP for verification.
                  </p>
                </div>
                <LaundryBookingDrawer />
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">No items found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No items matched your current search or sub-filter. Clear your search or try another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchFilter('');
                  setSelectedSubfilter('all');
                  setActiveCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#4F9D2F] text-white text-xs font-bold hover:bg-[#36751F] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
