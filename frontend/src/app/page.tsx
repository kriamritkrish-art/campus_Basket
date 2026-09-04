'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest } from '../lib/api';
import { Product } from '../types';
import { ProductCard } from '../components/products/ProductCard';
import { LaundryBookingDrawer } from '../components/laundry/LaundryBookingDrawer';
import {
  Utensils,
  Apple,
  Shirt,
  BookOpen,
  ChevronRight,
  Zap,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Sparkles,
  Search,
  ShoppingBag
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSubfilter, setSelectedSubfilter] = useState('all');

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await apiRequest('/api/products?limit=50');
        if (res.success && res.data) {
          setProducts(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch catalog:', err);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="w-2 h-2 rounded-full bg-[#689f38] animate-pulse" />
              <span className="font-bold text-gray-900">NIT Durgapur Campus Superstore</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#689f38]" /> Delivering to all 14 Residence Halls in 10-15 mins
              </span>
            </div>

            <div className="flex items-center gap-4 font-semibold text-gray-600">
              <span className="flex items-center gap-1 text-[#2e7d32]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#689f38]" /> Subsidized Campus Pricing
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Room Doorstep Delivery
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 xl:col-span-4 sticky top-24 space-y-4">
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

          <div className="lg:col-span-8 xl:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-[11px] font-bold uppercase tracking-wider border border-[#dcedc8]">
                    {activeCategoryObj.badge}
                  </span>
                  <span className="text-xs text-gray-400">
                    {activeCategory === 'laundry'
                      ? '4 Services Available'
                      : `${categoryProducts.length} Items Available`}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#212121] tracking-tight">
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

            {/* Options in Active Category (Displaying sub-options vertically / in responsive cards) */}
            {activeCategory !== 'laundry' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-3">
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
