'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { AdminKpiCard } from '../../../components/admin/AdminKpiCard';
import { Boxes, PackageCheck, AlertTriangle, PackageX, Edit2, Check, X } from 'lucide-react';

export default function AdminInventoryPage() {
  const [summary, setSummary] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline stock editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStockVal, setEditStockVal] = useState<string>('');
  const [editThresholdVal, setEditThresholdVal] = useState<string>('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/inventory');
      if (res.success) {
        setSummary(res.summary);
        setInventory(res.inventory);
      }
    } catch (err) {
      console.warn('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditStockVal(item.stock.toString());
    setEditThresholdVal(item.lowStockThreshold.toString());
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await apiRequest(`/api/admin/inventory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          stock: parseInt(editStockVal, 10),
          lowStockThreshold: parseInt(editThresholdVal, 10)
        })
      });

      if (res.success) {
        setEditingId(null);
        fetchInventory();
      }
    } catch (err) {
      alert('Failed to update inventory stock');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
          <span>Campus Inventory &amp; Stock Levels</span>
          <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
            Real-time Sync
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor warehouse quantities, set safety stock buffers &amp; execute inline restock updates
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Total SKUs"
          value={(summary?.totalProducts || inventory.length || 0).toString()}
          icon={Boxes}
          subtitle="Monitored campus items"
          color="blue"
        />

        <AdminKpiCard
          title="Healthy Stock"
          value={(summary?.inStockCount || 0).toString()}
          icon={PackageCheck}
          subtitle="Above safety threshold"
          color="green"
        />

        <AdminKpiCard
          title="Low Stock Warning"
          value={(summary?.lowStockCount || 0).toString()}
          icon={AlertTriangle}
          subtitle="Needs supplier replenishment"
          color="amber"
        />

        <AdminKpiCard
          title="Out of Stock"
          value={(summary?.outOfStockCount || 0).toString()}
          icon={PackageX}
          subtitle="Student orders disabled"
          color="red"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17202A]">SKU Stock Buffer Table</h3>
            <p className="text-xs text-slate-500">Edit stock counts and thresholds directly inline</p>
          </div>
          <button
            onClick={fetchInventory}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold"
          >
            Refresh Stock
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Syncing inventory records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Low Threshold</th>
                  <th className="py-3 px-4">Health Status</th>
                  <th className="py-3 px-4 text-right">Inline Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => {
                  const isEditing = editingId === item.id;
                  const isLow = item.stock <= item.lowStockThreshold && item.stock > 0;
                  const isOut = item.stock === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#17202A]">
                        {item.name}
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          {item.sku || `SKU-${item.id.slice(-4)}`} &bull; {item.unit}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                          {item.category?.name || 'Item'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStockVal}
                            onChange={(e) => setEditStockVal(e.target.value)}
                            className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32]"
                          />
                        ) : (
                          <span className="font-bold text-sm text-[#17202A]">{item.stock}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editThresholdVal}
                            onChange={(e) => setEditThresholdVal(e.target.value)}
                            className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32]"
                          />
                        ) : (
                          <span className="text-slate-500 font-medium">{item.lowStockThreshold}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isOut
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-[#347A27] border-emerald-200'
                          }`}
                        >
                          {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK ALERT' : 'HEALTHY BUFFER'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1.5 rounded-lg bg-[#4F9D32] hover:bg-[#347A27] text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#4F9D32] border border-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
