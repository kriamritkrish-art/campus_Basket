'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Product } from '../../types';
import { FALLBACK_STORE_PRODUCTS } from '../../lib/fallbackCatalog';
import { ProductCard } from '../../components/products/ProductCard';
import { BookOpen, Search } from 'lucide-react';

const DEFAULT_ESSENTIALS_PRODUCTS = FALLBACK_STORE_PRODUCTS.filter(
  (p) => p.categoryId === 'cat_essentials' || p.category?.slug === 'essentials'
);

export default function EssentialsPage() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_ESSENTIALS_PRODUCTS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadEssentials() {
      try {
        const query = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await apiRequest(`/api/products?category=essentials${query}`);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        } else if (!search) {
          setProducts(DEFAULT_ESSENTIALS_PRODUCTS);
        }
      } catch (err) {
        console.warn(err);
        if (!search) setProducts(DEFAULT_ESSENTIALS_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    loadEssentials();
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-bold border border-[#dcedc8] mb-2 sm:mb-3">
            <BookOpen className="w-3.5 h-3.5" /> Academic &amp; Dorm Essentials
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Stationery &amp; Student Equipment</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
            Casio scientific calculators, Classmate notebooks, A4 print paper, pens, and daily hostel necessities.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search Casio calculator, Classmate notebook, print paper, pens..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225] shadow-xs"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 bg-white rounded-2xl border border-gray-200 animate-pulse p-4 space-y-3">
              <div className="w-full h-36 bg-gray-100 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-gray-200 shadow-sm text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-800">No stationery items found</p>
          <p className="text-xs text-gray-400 mt-1">Try searching for Casio, notebook, or paper</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
