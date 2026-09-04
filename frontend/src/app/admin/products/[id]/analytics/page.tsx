'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { AdminKpiCard } from '@/components/admin/AdminKpiCard';
import { HallDistributionChart } from '@/components/admin/AdminCharts';
import {
  ArrowLeft,
  ShoppingBag,
  IndianRupee,
  Star,
  Activity,
  PackageCheck
} from 'lucide-react';

export default function ProductAnalyticsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProductAnalytics() {
      try {
        const res = await apiRequest(`/api/admin/products/${id}/analytics`);
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.warn('Error loading product analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProductAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-40 bg-white border border-slate-200 rounded-xl" />
        <div className="h-32 bg-white border border-slate-200 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const product = data?.product || {};
  const metrics = data?.metrics || {};
  const hallDist = data?.hallDistribution || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back link */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#4F9D32] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Product Catalog</span>
      </Link>

      {/* Product Hero Banner */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-6">
        <div className="w-32 h-24 aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
          <img
            src={product.primaryImage || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
              {product.category?.name || 'Item'}
            </span>
            <span className="font-mono text-xs text-slate-400">SKU: {product.sku || product.id}</span>
          </div>
          <h1 className="text-xl font-black text-[#17202A]">{product.name}</h1>
          <p className="text-xs text-slate-500">{product.description || 'No description provided'}</p>
        </div>

        <div className="text-right font-mono shrink-0">
          <div className="text-2xl font-black text-[#17202A]">₹{product.price}</div>
          <div className="text-xs text-slate-400">Stock: {product.stock} units</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Gross SKU Revenue"
          value={`₹${(metrics.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          subtitle="Cumulative platform volume"
          color="green"
        />

        <AdminKpiCard
          title="Units Delivered"
          value={(metrics.unitsSold || 0).toString()}
          icon={ShoppingBag}
          subtitle="Fulfilled orders"
          color="blue"
        />

        <AdminKpiCard
          title="Cart Reorder Rate"
          value="42.8%"
          icon={Activity}
          subtitle="Repeat student purchases"
          color="amber"
        />

        <AdminKpiCard
          title="Student Rating"
          value="4.8 / 5.0"
          icon={Star}
          subtitle="Verified feedback"
          color="purple"
        />
      </div>

      {/* Hall Consumption Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#17202A]">Hostel Hall Consumption Spread</h3>
          <p className="text-xs text-slate-500">Distribution of {product.name} orders per hall</p>
        </div>
        <HallDistributionChart data={hallDist} />
      </div>
    </div>
  );
}
