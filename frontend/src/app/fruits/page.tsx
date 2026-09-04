'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Product } from '../../types';
import { FALLBACK_STORE_PRODUCTS } from '../../lib/fallbackCatalog';
import { ProductCard } from '../../components/products/ProductCard';
import { Apple, Search, Sparkles } from 'lucide-react';

const DEFAULT_FRUIT_PRODUCTS = FALLBACK_STORE_PRODUCTS.filter(
  (p) => p.categoryId === 'cat_fruits' || p.category?.slug === 'fruits'
);

export default function FruitsPage() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_FRUIT_PRODUCTS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadFruits() {
      try {
        const query = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await apiRequest(`/api/products?category=fruits${query}`);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        } else if (!search) {
          setProducts(DEFAULT_FRUIT_PRODUCTS);
        }
      } catch (err) {
        console.warn(err);
        if (!search) setProducts(DEFAULT_FRUIT_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    loadFruits();
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-bold border border-[#dcedc8] mb-3">
            <Apple className="w-3.5 h-3.5" /> Farm Fresh Orchards
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Fresh Farm Fruits</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
            Healthy seasonal fruits, apples by kg, bananas by the dozen, and juicy oranges delivered to your hostel room.
          </p>
        </div>

        <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-xl p-4 text-xs text-gray-800 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#689f38] shrink-0" />
          <div>
            <div className="font-extrabold text-gray-900">Handpicked Every Morning</div>
            <div className="text-gray-600 text-[11px]">100% natural, sorted for students</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search apples, bananas, oranges, seasonal fruits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225] shadow-sm"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm text-gray-500">
          <Apple className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-800">No fruits found</p>
          <p className="text-xs text-gray-400 mt-1">Try searching for apples, bananas, or oranges</p>
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
