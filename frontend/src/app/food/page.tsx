'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from '../../lib/api';
import { Product } from '../../types';
import { FALLBACK_STORE_PRODUCTS } from '../../lib/fallbackCatalog';
import { ProductCard } from '../../components/products/ProductCard';
import { Utensils, Clock, Search, History, Sparkles, X } from 'lucide-react';

const DEFAULT_FOOD_PRODUCTS = FALLBACK_STORE_PRODUCTS.filter(
  (p) => p.categoryId === 'cat_food' || p.category?.slug === 'food'
);

const POPULAR_SEARCHES = [
  'Chicken Biryani',
  'Cold Coffee',
  'Aloo Paratha',
  'Egg Curry',
  'Paneer Butter Masala',
  'Samosa Chai'
];

function FoodContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>(DEFAULT_FOOD_PRODUCTS);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cb_recent_searches') || '[]');
      if (Array.isArray(saved)) setRecentSearches(saved.slice(0, 5));
    } catch {}
  }, []);

  // Sync if query param changed
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== undefined) {
      setSearch(q);
    }
  }, [searchParams]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('cb_recent_searches') || '[]');
      const filtered = [term.trim(), ...existing.filter((s: string) => s.toLowerCase() !== term.trim().toLowerCase())].slice(0, 5);
      localStorage.setItem('cb_recent_searches', JSON.stringify(filtered));
      setRecentSearches(filtered);
    } catch {}
  };

  useEffect(() => {
    async function loadFood() {
      setLoading(true);
      try {
        const query = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await apiRequest(`/api/products?category=food${query}`);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        } else if (search) {
          // Robust client fallback search
          const lower = search.toLowerCase();
          const matched = DEFAULT_FOOD_PRODUCTS.filter(
            (p) =>
              p.name.toLowerCase().includes(lower) ||
              p.description?.toLowerCase().includes(lower) ||
              p.category?.name.toLowerCase().includes(lower)
          );
          setProducts(matched);
        } else {
          setProducts(DEFAULT_FOOD_PRODUCTS);
        }
      } catch (err) {
        console.warn(err);
        if (search) {
          const lower = search.toLowerCase();
          const matched = DEFAULT_FOOD_PRODUCTS.filter(
            (p) =>
              p.name.toLowerCase().includes(lower) ||
              p.description?.toLowerCase().includes(lower)
          );
          setProducts(matched);
        } else {
          setProducts(DEFAULT_FOOD_PRODUCTS);
        }
      } finally {
        setLoading(false);
      }
    }
    loadFood();
  }, [search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      saveRecentSearch(search);
      router.replace(`/food?search=${encodeURIComponent(search.trim())}`, { scroll: false });
    }
  };

  const handlePillClick = (term: string) => {
    setSearch(term);
    saveRecentSearch(term);
    router.replace(`/food?search=${encodeURIComponent(term)}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-bold border border-[#dcedc8] mb-3">
            <Utensils className="w-3.5 h-3.5" /> Campus Cafeteria &amp; Canteens
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Food &amp; Meals Delivery</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
            Order fresh meals, Kolkata biryani, paneer combos, parathas, and snacks. Delivered in 10-15 mins to all halls of residence.
          </p>
        </div>

        <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-xl p-4 text-xs text-gray-800 flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#689f38] shrink-0" />
          <div>
            <div className="font-extrabold text-gray-900">Service Hours: 7:00 AM – 11:30 PM</div>
            <div className="text-gray-600 text-[11px]">Late night hostel study delivery active</div>
          </div>
        </div>
      </div>

      {/* Search Bar & Popular / Recent Searches */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search chicken biryani, egg curry, paratha, samosa chai..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225] shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  router.replace('/food', { scroll: false });
                }}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Popular Searches & Recent Searches (Requirement 24) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#689f38]" />
            <span className="text-[11px] uppercase tracking-wider">Popular:</span>
          </div>
          {POPULAR_SEARCHES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handlePillClick(item)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-[#f1f8e9] hover:text-[#2e7d32] border border-gray-200 text-[11px] font-semibold text-gray-700 shadow-2xs transition-colors"
            >
              {item}
            </button>
          ))}

          {recentSearches.length > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1.5 text-gray-500 font-bold">
                <History className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] uppercase tracking-wider">Recent:</span>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handlePillClick(term)}
                  className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[11px] font-medium text-gray-600 transition-colors"
                >
                  {term}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm text-gray-500 space-y-3">
          <Utensils className="w-12 h-12 mx-auto text-gray-300" />
          <p className="font-bold text-gray-800 text-sm">No cafeteria dishes found</p>
          <p className="text-xs text-gray-400">Try adjusting your search terms or tap one of the popular search pills above.</p>
          <button
            onClick={() => {
              setSearch('');
              router.replace('/food', { scroll: false });
            }}
            className="inline-block px-4 py-2 bg-[#689f38] text-white text-xs font-bold rounded-xl"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FoodPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <FoodContent />
    </Suspense>
  );
}
