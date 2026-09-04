'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Store, Phone, Mail } from 'lucide-react';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/providers');
      if (res.success && res.providers) {
        setProviders(res.providers);
      }
    } catch (err) {
      console.warn('Providers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggleStatus = async (providerId: string, currentStatus: boolean) => {
    try {
      const res = await apiRequest(`/api/admin/providers/${providerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ activeStatus: !currentStatus })
      });
      if (res.success) {
        setProviders((prev) =>
          prev.map((p) => (p.id === providerId ? { ...p, activeStatus: !currentStatus } : p))
        );
      }
    } catch (err) {
      alert('Error updating provider status');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
          <Store className="w-5 h-5 text-[#4F9D32]" />
          <span>Campus Service Providers &amp; Vendors</span>
          <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
            {providers.length} Registered
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Canteen operators, laundry units, stationery distributors, and dispatch partners
        </p>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Syncing provider directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Business Entity</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Service Category</th>
                  <th className="py-3.5 px-4">Operating Status</th>
                  <th className="py-3.5 px-4 text-right">Vendor Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#17202A]">
                      <div>{p.businessName}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        ID: {p.id.slice(0, 10)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{p.contactPerson}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        {p.serviceType || 'Canteen / Multi-Services'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.activeStatus
                            ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {p.activeStatus ? 'AUTHORIZED OPERATING' : 'SUSPENDED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.activeStatus)}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border transition ${
                          p.activeStatus
                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-[#347A27] border-emerald-200'
                        }`}
                      >
                        {p.activeStatus ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
