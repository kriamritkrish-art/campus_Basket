'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../../lib/api';
import { AdminKpiCard } from '../../../../components/admin/AdminKpiCard';
import { ProductFormModal } from '../../../../components/admin/ProductFormModal';
import {
  BookOpen,
  Plus,
  Boxes,
  CheckCircle,
  Edit2,
  IndianRupee,
  PackageCheck
} from 'lucide-react';

export default function AdminEssentialsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const fetchEssentialsData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/services/essentials');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.warn('Error loading essentials data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEssentialsData();
  }, []);

  const stats = data?.stats || {};
  const products = data?.products || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#4F9D32]" />
            <span>Stationery &amp; Academic Essentials</span>
            <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
              Campus Store
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Engineering tools, notebooks, lab manuals, stationery &amp; room utilities
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Essential Item</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Essentials Revenue"
          value={`₹${(stats.revenue || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          subtitle="Academic supplies volume"
          color="green"
        />

        <AdminKpiCard
          title="Items Dispatched"
          value={(stats.orderCount || 0).toString()}
          icon={PackageCheck}
          subtitle="Hostel deliveries fulfilled"
          color="blue"
        />

        <AdminKpiCard
          title="Catalog Size"
          value={(products.length || 0).toString()}
          icon={Boxes}
          subtitle="Stationery & utilities SKUs"
          color="purple"
        />

        <AdminKpiCard
          title="Stock Readiness"
          value="99.2%"
          icon={CheckCircle}
          subtitle="Buffer availability"
          color="green"
        />
      </div>

      {/* Essentials Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Stationery &amp; Essentials ({products.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Syncing essentials...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock In-House</th>
                  <th className="py-3 px-4">Provider / Store</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.primaryImage || p.images?.[0]?.googleDriveUrl ? (
                            <img
                              src={p.primaryImage || p.images?.[0]?.googleDriveUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <BookOpen className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#17202A] text-xs truncate max-w-[220px] sm:max-w-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono font-normal mt-0.5">
                            Per {p.unit}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#17202A]">
                      ₹{p.price}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#17202A]">
                      {p.stock} units
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {p.provider?.businessName || 'NIT Cooperative Store'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.availability
                            ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {p.availability ? 'AVAILABLE' : 'OUT OF STOCK'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#4F9D32] border border-slate-200 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchEssentialsData()}
        categories={[{ id: 'cat_essentials', name: 'Stationery & Essentials' }]}
        initialProduct={editingProduct}
      />
    </div>
  );
}
