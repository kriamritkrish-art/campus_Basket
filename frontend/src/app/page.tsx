'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest } from '../lib/api';
import { Product } from '../types';
import { FALLBACK_STORE_PRODUCTS } from '../lib/fallbackCatalog';
import { ProductCard } from '../components/products/ProductCard';
import { LaundryBookingDrawer } from '../components/laundry/LaundryBookingDrawer';
import {
  Utensils,
  Apple,
  Shirt,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Zap,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Sparkles,
  Search,
  ShoppingBag,
  Menu,
  Check,
  X
} from 'lucide-react';

type CategoryKey = 'food' | 'fruits' | 'laundry' | 'essentials';

interface SubOption {
  name: string;
  desc: string;
  filterKey?: string;
  badge?: string;
}

interface CategoryOption {
  id: CategoryKey;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  badge: string;
  subOptions: SubOption[];
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'food',
    name: 'Food & Meals',
    subtitle: 'Biryani, Thali, Snacks & Beverages',
    icon: Utensils,
    tagline: 'Freshly prepared hot canteen meals, biryani & evening snacks',
    badge: '10-15 Min Delivery',
    subOptions: [
      { name: 'Hot Meals & Biryani', desc: 'Kolkata chicken biryani & egg curry with steamed rice', filterKey: 'biryani' },
      { name: 'Hostel Night Snacks', desc: 'Chicken kathi rolls, samosas & ginger masala chai', filterKey: 'snacks', badge: 'Till 2 AM' },
      { name: 'Student Thali & Curries', desc: 'Paneer butter masala, butter rotis & fresh salad', filterKey: 'thali' },
      { name: 'South Indian Specials', desc: 'Crispy ghee roast masala dosa with fresh coconut chutney', filterKey: 'dosa' }
    ]
  },
  {
    id: 'fruits',
    name: 'Fresh Fruits',
    subtitle: 'Apples, Bananas, Seasonal Orchards',
    icon: Apple,
    tagline: 'Handpicked fresh orchard fruits delivered directly to your room',
    badge: 'Farm Fresh',
    subOptions: [
      { name: 'Fresh Farm Fruits', desc: 'Daily handpicked orchard-fresh fruits for hostel rooms', filterKey: 'all' },
      { name: 'Crisp Apples & Bananas', desc: 'Sweet Kashmiri red apples & Robusta ripe bananas', filterKey: 'apples' },
      { name: 'Nagpur Sweet Oranges', desc: 'Juicy, vitamin-C rich hand-sorted Nagpur mandarins', filterKey: 'oranges' },
      { name: 'Ruby Pomegranate & Grapes', desc: 'Nutrient-rich antioxidant fruits for daily health', filterKey: 'pomegranate' }
    ]
  },
  {
    id: 'laundry',
    name: 'Express Laundry',
    subtitle: 'Room pickup & Dual-OTP steam iron',
    icon: Shirt,
    tagline: 'Automated campus wash, steam press, and room pickup across Halls 1–14',
    badge: 'Dual OTP Secured',
    subOptions: [
      { name: 'Dual-OTP Laundry', desc: 'Automated wash, steam press & room pickup across Halls 1–14', badge: 'Verified' },
      { name: 'Book Doorstep Wash', desc: 'Schedule contactless room pickup with dual security OTPs', badge: 'Fast Slot' },
      { name: '12-Hour Urgent Express Wash', desc: 'Priority queue wash & press for exams & presentations' },
      { name: 'Heavy Blanket & Winterwear', desc: 'Deep drum wash & sanitization for duvets and comforters' }
    ]
  },
  {
    id: 'essentials',
    name: 'Stationery & Essentials',
    subtitle: 'Casio Calculators, Notes & Lab Paper',
    icon: BookOpen,
    tagline: 'Casio scientific calculators, exercise notebooks & lab printing paper',
    badge: 'Exam & Lab Ready',
    subOptions: [
      { name: 'Casio & Scientific Calculators', desc: 'Casio fx-991EX Classwiz 552 functions for engineering', filterKey: 'calculator', badge: 'Exam Ready' },
      { name: 'Notebooks & Lab Printing Paper', desc: 'Classmate exercise notebooks & JK Cedar A4 copier sheets', filterKey: 'notebooks' },
      { name: 'Engineering Drafters & Instruments', desc: 'Heavy-duty steel mini-drafter & compass drawing set', filterKey: 'instruments' },
      { name: 'Pens & Exam Essentials', desc: 'Gel pens, graph paper sheets and laboratory stationary', filterKey: 'pens' }
    ]
  },
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
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('food');
  const [products, setProducts] = useState<Product[]>(FALLBACK_STORE_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSubfilter, setSelectedSubfilter] = useState('all');
  const [isSubcategoryDrawerOpen, setIsSubcategoryDrawerOpen] = useState(false);

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
        console.warn('Failed to fetch catalog from backend, using robust client catalog:', err);
        setProducts(FALLBACK_STORE_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category') as CategoryKey;
      if (cat && ['food', 'fruits', 'laundry', 'essentials'].includes(cat)) {
        setActiveCategory(cat);
      }
    }
  }, []);

  const categoryProducts = useMemo(() => {
    return products.filter((p) => p.category?.slug === activeCategory || p.categoryId === 'cat_' + activeCategory);
  }, [products, activeCategory]);

  const filteredProducts = useMemo(() => {
    let list = categoryProducts;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
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
      } else if (selectedSubfilter === 'biryani') {
        list = list.filter((p) => p.name.toLowerCase().includes('biryani') || p.name.toLowerCase().includes('rice'));
      } else if (selectedSubfilter === 'snacks') {
        list = list.filter((p) => p.name.toLowerCase().includes('roll') || p.name.toLowerCase().includes('samosa') || p.name.toLowerCase().includes('chai'));
      } else if (selectedSubfilter === 'thali') {
        list = list.filter((p) => p.name.toLowerCase().includes('paneer') || p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('curry'));
      } else if (selectedSubfilter === 'dosa') {
        list = list.filter((p) => p.name.toLowerCase().includes('dosa'));
      } else if (selectedSubfilter === 'apples') {
        list = list.filter((p) => p.name.toLowerCase().includes('apple') || p.name.toLowerCase().includes('banana'));
      } else if (selectedSubfilter === 'oranges') {
        list = list.filter((p) => p.name.toLowerCase().includes('orange'));
      } else if (selectedSubfilter === 'pomegranate') {
        list = list.filter((p) => p.name.toLowerCase().includes('pomegranate') || p.name.toLowerCase().includes('grape'));
      } else if (selectedSubfilter === 'calculator') {
        list = list.filter((p) => p.name.toLowerCase().includes('casio') || p.name.toLowerCase().includes('calculator'));
      } else if (selectedSubfilter === 'notebooks') {
        list = list.filter((p) => p.name.toLowerCase().includes('classmate') || p.name.toLowerCase().includes('paper') || p.name.toLowerCase().includes('notebook'));
      } else if (selectedSubfilter === 'instruments') {
        list = list.filter((p) => p.name.toLowerCase().includes('drafter') || p.name.toLowerCase().includes('drawing'));
      } else if (selectedSubfilter === 'pens') {
        list = list.filter((p) => p.name.toLowerCase().includes('pen') || p.name.toLowerCase().includes('notebook'));
      }
    }

    return list;
  }, [categoryProducts, searchFilter, selectedSubfilter]);

  const activeCategoryObj =
    CATEGORY_OPTIONS.find((c) => c.id === activeCategory) || CATEGORY_OPTIONS[0];

  return (
    <div className="bg-[#f8f8f8] min-h-screen pb-20">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-gray-700">
              <span className="flex items-center gap-1.5 font-bold text-gray-900">
                <span className="w-2 h-2 rounded-full bg-[#689f38] animate-pulse shrink-0" />
                NIT Durgapur Superstore
              </span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="text-gray-600 flex items-center gap-1 text-[10.5px] sm:text-xs">
                <MapPin className="w-3 h-3 text-[#689f38] shrink-0" />
                <span>Delivering to all 14 Residence Halls in 10-15 mins</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 font-semibold text-gray-600 text-[10.5px] sm:text-xs">
              <span className="flex items-center gap-1 text-[#2e7d32]">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#689f38] shrink-0" /> Subsidized Campus Pricing
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" /> Room Doorstep Delivery
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* Desktop Left Sidebar (Hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
              {CATEGORY_OPTIONS.map((option) => {
                const IconComponent = option.icon;
                const isActive = activeCategory === option.id;

                return (
                  <div
                    key={option.id}
                    className={`transition-all duration-150 ${
                      isActive
                        ? 'bg-[#f1f8e9]/90 border-l-[5px] border-l-[#689f38]'
                        : 'hover:bg-gray-50 border-l-[5px] border-l-transparent'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(option.id);
                        setSelectedSubfilter('all');
                        setSearchFilter('');
                      }}
                      className="w-full text-left p-4 sm:p-5 flex items-center gap-4 group"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#e8f5e9] text-[#2e7d32] ring-2 ring-[#c8e6c9]'
                            : 'bg-[#f4f9ed] text-[#689f38] group-hover:bg-[#e8f5e9]'
                        }`}
                      >
                        <IconComponent className="w-6 h-6 stroke-[1.8]" />
                      </div>

                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm sm:text-[15px] font-bold tracking-tight truncate ${
                              isActive ? 'text-[#1b5e20]' : 'text-[#1f2937] group-hover:text-[#689f38]'
                            }`}
                          >
                            {option.name}
                          </span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-[#689f38] shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-normal leading-tight mt-0.5 line-clamp-1">
                          {option.subtitle}
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                          isActive
                            ? 'text-[#689f38] translate-x-1 stroke-[2.5]'
                            : 'text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5'
                        }`}
                      />
                    </button>

                    {/* Vertical Sub-options shown under active main category */}
                    {isActive && (
                      <div className="px-4 pb-4 pt-1 space-y-1 border-t border-gray-200/60 pl-6 animate-in fade-in duration-150">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#2e7d32] py-1">
                          Vertical Options in {option.name}:
                        </div>
                        {option.subOptions.map((sub) => {
                          const isSubSelected = selectedSubfilter === sub.filterKey;
                          return (
                            <button
                              key={sub.name}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (sub.filterKey) setSelectedSubfilter(sub.filterKey);
                              }}
                              className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs transition-colors text-left ${
                                isSubSelected
                                  ? 'bg-[#689f38] text-white font-bold shadow-sm'
                                  : 'text-gray-700 hover:bg-white hover:text-[#689f38] font-medium'
                              }`}
                            >
                              <span className="truncate">{sub.name}</span>
                              <ChevronRight
                                className={`w-3 h-3 shrink-0 ${
                                  isSubSelected ? 'text-white' : 'text-gray-400'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-[#f1f8e9] to-[#e8f5e9] border border-[#dcedc8] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#2e7d32] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#689f38]" /> NIT Durgapur Promise
              </div>

              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#689f38] shrink-0 mt-0.5" />
                  <span><strong>10-15 Min Fast Delivery:</strong> Direct to Hall security or common room.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#689f38] shrink-0 mt-0.5" />
                  <span><strong>Dual-OTP Protection:</strong> Zero lost laundry or misplaced meal boxes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#689f38] shrink-0 mt-0.5" />
                  <span><strong>Hostel Subsidized:</strong> Transparent student tariffs with no hidden charges.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-8 space-y-4 sm:space-y-6">
            {/* Mobile Category Stories Bar (BigBasket Style App Bubbles) */}
            <div className="lg:hidden bg-white rounded-2xl border border-gray-200 p-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#689f38]" />
                  Categories
                </span>
                <span className="text-[10px] font-bold text-[#2e7d32] bg-[#f1f8e9] px-2 py-0.5 rounded-full border border-[#dcedc8]">
                  ⚡ 10-15 Min Delivery
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 pt-0.5 px-0.5">
                {CATEGORY_OPTIONS.map((cat) => {
                  const IconComp = cat.icon;
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setSelectedSubfilter('all');
                        setSearchFilter('');
                      }}
                      className="flex flex-col items-center shrink-0 w-[68px] group transition-transform active:scale-95 text-center"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-2xs ${
                          isSelected
                            ? 'bg-[#2e7d32] text-white ring-2 ring-[#2e7d32] ring-offset-2 scale-105'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 group-hover:border-[#689f38]'
                        }`}
                      >
                        <IconComp className={`w-5 h-5 ${isSelected ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 leading-tight font-bold line-clamp-2 ${
                          isSelected ? 'text-[#1b5e20]' : 'text-gray-700'
                        }`}
                      >
                        {cat.name.split('&')[0].trim()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-[#dcedc8]">
                    {activeCategoryObj.badge}
                  </span>
                  <span className="text-xs text-gray-400">
                    {activeCategory === 'laundry'
                      ? '4 Services Available'
                      : `${categoryProducts.length} Items Available`}
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-[#212121] tracking-tight">
                  {activeCategoryObj.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {activeCategoryObj.tagline}
                </p>
              </div>

              {activeCategory !== 'laundry' && (
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder={`Search in ${activeCategoryObj.name}...`}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#689f38] focus:bg-white transition-colors"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              )}
            </div>

            {/* Options in Active Category (Desktop View: Grid of Cards) */}
            {activeCategory !== 'laundry' && (
              <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#689f38]" />
                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Options in {activeCategoryObj.name}
                    </span>
                  </div>
                  {selectedSubfilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedSubfilter('all')}
                      className="text-xs font-bold text-[#689f38] hover:underline"
                    >
                      Show All ({categoryProducts.length})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {activeCategoryObj.subOptions.map((sub) => {
                    const isSelected = selectedSubfilter === sub.filterKey;
                    return (
                      <button
                        key={sub.name}
                        type="button"
                        onClick={() => {
                          if (sub.filterKey) {
                            setSelectedSubfilter(isSelected ? 'all' : sub.filterKey);
                          }
                        }}
                        className={`text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#f1f8e9] border-[#689f38] shadow-sm'
                            : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-[#689f38]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-[#1b5e20]' : 'text-gray-900'
                            }`}
                          >
                            {sub.name}
                          </span>
                          {sub.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#689f38] text-white">
                              {sub.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight mt-1 line-clamp-1">
                          {sub.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Filters Row */}
                <div className="pt-2 border-t border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
                  <span className="text-gray-400 font-semibold text-[11px] shrink-0">Filters:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSubfilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                      selectedSubfilter === 'all'
                        ? 'bg-[#689f38] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Items
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubfilter('discount')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                      selectedSubfilter === 'discount'
                        ? 'bg-[#689f38] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Discounts 🏷️
                  </button>
                  {activeCategory === 'food' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedSubfilter('veg')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                          selectedSubfilter === 'veg'
                            ? 'bg-[#689f38] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🌱 Pure Veg
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSubfilter('non-veg')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                          selectedSubfilter === 'non-veg'
                            ? 'bg-[#689f38] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🍗 Non-Veg &amp; Biryani
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mobile 3-Lines Subcategory Selector Bar (User Request: Select Subcategory from 3 lines in mobile) */}
            {activeCategory !== 'laundry' && (
              <div className="sm:hidden bg-white rounded-xl border border-gray-200 p-2.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSubcategoryDrawerOpen(true)}
                    className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-[#f4f9ed] border border-[#dcedc8] text-[#1b5e20] hover:bg-[#e8f5e9] transition-all active:scale-[0.98] shadow-2xs"
                    id="mobile-subcategory-3lines-btn"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Visual 3 Horizontal Lines (Hamburger Icon) */}
                      <div className="w-6 h-6 rounded-lg bg-[#689f38] text-white flex flex-col justify-center items-center gap-[3px] shrink-0 shadow-xs">
                        <span className="w-3.5 h-[1.8px] bg-white rounded-full" />
                        <span className="w-3.5 h-[1.8px] bg-white rounded-full" />
                        <span className="w-2.5 h-[1.8px] bg-white rounded-full self-start ml-1.5" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-[9px] uppercase tracking-wider text-[#2e7d32] font-black leading-none flex items-center gap-1">
                          <span>Subcategory</span>
                          <span className="text-[9px] text-gray-400 font-normal">☰ Tap to change</span>
                        </div>
                        <div className="text-xs font-black text-gray-900 truncate leading-tight mt-0.5">
                          {selectedSubfilter === 'all'
                            ? `All ${activeCategoryObj.name}`
                            : selectedSubfilter === 'discount'
                            ? '🏷️ Deals & Discounts'
                            : selectedSubfilter === 'veg'
                            ? '🌱 Pure Veg Items'
                            : selectedSubfilter === 'non-veg'
                            ? '🍗 Non-Veg & Biryani'
                            : (activeCategoryObj.subOptions.find((s) => s.filterKey === selectedSubfilter)?.name || selectedSubfilter)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#2e7d32] shrink-0">
                      <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded-md border border-[#c8e6c9]">
                        {activeCategoryObj.subOptions.length}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  </button>

                  {selectedSubfilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedSubfilter('all')}
                      className="px-2.5 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold shrink-0 border border-red-200 transition-colors"
                      title="Clear Subcategory Filter"
                    >
                      ✕ Reset
                    </button>
                  )}
                </div>

                {/* Quick horizontal filter chips for instant access */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedSubfilter('all')}
                    className={`px-2.5 py-1 rounded-full font-bold shrink-0 transition-colors ${
                      selectedSubfilter === 'all'
                        ? 'bg-[#689f38] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    All ({categoryProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubfilter(selectedSubfilter === 'discount' ? 'all' : 'discount')}
                    className={`px-2.5 py-1 rounded-full font-bold shrink-0 transition-colors ${
                      selectedSubfilter === 'discount'
                        ? 'bg-[#689f38] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    🏷️ Offers
                  </button>
                  {activeCategory === 'food' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedSubfilter(selectedSubfilter === 'veg' ? 'all' : 'veg')}
                        className={`px-2.5 py-1 rounded-full font-bold shrink-0 transition-colors ${
                          selectedSubfilter === 'veg'
                            ? 'bg-[#2e7d32] text-white shadow-2xs'
                            : 'bg-emerald-50 text-[#2e7d32] border border-emerald-200'
                        }`}
                      >
                        🌱 Pure Veg
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSubfilter(selectedSubfilter === 'non-veg' ? 'all' : 'non-veg')}
                        className={`px-2.5 py-1 rounded-full font-bold shrink-0 transition-colors ${
                          selectedSubfilter === 'non-veg'
                            ? 'bg-[#c62828] text-white shadow-2xs'
                            : 'bg-red-50 text-[#c62828] border border-red-200'
                        }`}
                      >
                        🍗 Non-Veg
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeCategory === 'laundry' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {LAUNDRY_SERVICES_LIST.map((srv) => (
                    <div
                      key={srv.id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative space-y-3"
                    >
                      {srv.popular && (
                        <div className="absolute top-0 right-0 bg-[#689f38] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
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

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {srv.desc}
                      </p>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-black text-gray-900">{srv.price}</span>
                          <span className="text-xs text-gray-500 ml-1">{srv.unit}</span>
                        </div>
                        <a
                          href="#laundry-booking-section"
                          className="px-3.5 py-1.5 rounded-lg bg-[#f1f8e9] hover:bg-[#e8f5e9] text-[#2e7d32] font-bold text-xs transition-colors"
                        >
                          Book Now
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div id="laundry-booking-section" className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Schedule Hostel Room Pickup
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Select your garments, hall number, and preferred pickup slot. You will receive a Dual-OTP for verification.
                    </p>
                  </div>

                  <LaundryBookingDrawer />
                </div>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse space-y-3">
                    <div className="w-full h-36 bg-gray-200 rounded-lg" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded-lg w-full" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-gray-800">No items found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  No items matched your current search or sub-filter. Clear your search or try another category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchFilter('');
                    setSelectedSubfilter('all');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#689f38] text-white text-xs font-bold hover:bg-[#5b8c30] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile Subcategory Selection Bottom Sheet (Triggered by the 3 lines button) */}
      {isSubcategoryDrawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsSubcategoryDrawerOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
            {/* Drag Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#689f38] text-white flex flex-col justify-center items-center gap-[3px] shrink-0 shadow-xs">
                  <span className="w-4 h-[1.8px] bg-white rounded-full" />
                  <span className="w-4 h-[1.8px] bg-white rounded-full" />
                  <span className="w-2.5 h-[1.8px] bg-white rounded-full self-start ml-1.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    Select Subcategory
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    In {activeCategoryObj.name} • 10–15 Min Room Delivery
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSubcategoryDrawerOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subcategory Options List */}
            <div className="p-4 overflow-y-auto space-y-2 pb-safe">
              {/* 'All Items' option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSubfilter('all');
                  setIsSubcategoryDrawerOpen(false);
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedSubfilter === 'all'
                    ? 'bg-[#f1f8e9] border-[#689f38] shadow-xs ring-1 ring-[#689f38]'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                    <span>All {activeCategoryObj.name} Items</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#689f38] text-white">
                      {categoryProducts.length} items
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Browse complete catalog without subcategory filters
                  </div>
                </div>
                {selectedSubfilter === 'all' && (
                  <Check className="w-4 h-4 text-[#2e7d32] stroke-[3]" />
                )}
              </button>

              <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 pt-2 pb-1">
                {activeCategoryObj.name} Subcategories
              </div>

              {activeCategoryObj.subOptions.map((sub) => {
                const isSelected = selectedSubfilter === sub.filterKey;
                return (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => {
                      if (sub.filterKey) setSelectedSubfilter(sub.filterKey);
                      setIsSubcategoryDrawerOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#f1f8e9] border-[#689f38] shadow-xs ring-1 ring-[#689f38]'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                        <span>{sub.name}</span>
                        {sub.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-extrabold bg-[#f1f8e9] text-[#2e7d32] border border-[#dcedc8]">
                            {sub.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                        {sub.desc}
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#2e7d32] stroke-[3] shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* Special Filters */}
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 pt-2 pb-1">
                Special Filters
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedSubfilter('discount');
                  setIsSubcategoryDrawerOpen(false);
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedSubfilter === 'discount'
                    ? 'bg-[#f1f8e9] border-[#689f38] shadow-xs ring-1 ring-[#689f38]'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>🏷️ Campus Deals & Discounts</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Special subsidized rates and student savings
                  </div>
                </div>
                {selectedSubfilter === 'discount' && (
                  <Check className="w-4 h-4 text-[#2e7d32] stroke-[3] shrink-0" />
                )}
              </button>

              {activeCategory === 'food' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubfilter('veg');
                      setIsSubcategoryDrawerOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedSubfilter === 'veg'
                        ? 'bg-[#f1f8e9] border-[#689f38] shadow-xs ring-1 ring-[#689f38]'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <div className="veg-icon" />
                        <span>100% Pure Veg Canteen Items</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Paneer dishes, veg thali, parathas & snacks
                      </div>
                    </div>
                    {selectedSubfilter === 'veg' && (
                      <Check className="w-4 h-4 text-[#2e7d32] stroke-[3] shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubfilter('non-veg');
                      setIsSubcategoryDrawerOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedSubfilter === 'non-veg'
                        ? 'bg-[#f1f8e9] border-[#689f38] shadow-xs ring-1 ring-[#689f38]'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <div className="non-veg-icon" />
                        <span>Non-Veg & Biryani Special</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Chicken biryani, egg curry, chicken rolls
                      </div>
                    </div>
                    {selectedSubfilter === 'non-veg' && (
                      <Check className="w-4 h-4 text-[#2e7d32] stroke-[3] shrink-0" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
