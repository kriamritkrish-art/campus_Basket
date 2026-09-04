'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Product } from '../../types';
import { ProductCard } from '../../components/products/ProductCard';
import { Utensils, Clock, Search, Filter } from 'lucide-react';

export default function FoodPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFood() {
      try {
        const query = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await apiRequest(`/api/products?category=food${query}`);
        if (res.success && res.data) {
          setProducts(res.data);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    loadFood();
  }, [search]);

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

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search chicken biryani, egg curry, paratha, samosa chai..."
            value={search}
            onChange={(e) => setSearchQuerySafe(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225] shadow-sm"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm text-gray-500">
          <Utensils className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-800">No cafeteria dishes found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
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

  function setSearchQuerySafe(val: string) {
    setSearch(val);
  }
}
