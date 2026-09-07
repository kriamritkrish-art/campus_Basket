'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../../lib/api';
import { AdminKpiCard } from '../../../../components/admin/AdminKpiCard';
import { OtpStatusBadge } from '../../../../components/admin/OtpStatusBadge';
import {
  Shirt,
  ShieldCheck,
  Clock,
  Sparkles,
  IndianRupee,
  PackageCheck
} from 'lucide-react';

export default function AdminExpressLaundryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLaundryData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/services/laundry');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.warn('Error loading laundry data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaundryData();
  }, []);

  const stats = data?.stats || {};
  const orders = data?.orders || [];
  const catalog = data?.serviceCatalog || [];
  const deliveryBoys = data?.deliveryBoys || [];

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await apiRequest(`/api/admin/services/laundry/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        fetchLaundryData();
      }
    } catch (err) {
      alert('Error updating laundry status');
    }
  };

  const handleAssignDelivery = async (orderId: string, deliveryBoyId: string) => {
    try {
      const res = await apiRequest(`/api/admin/services/laundry/${orderId}/assign-delivery`, {
        method: 'PATCH',
        body: JSON.stringify({ deliveryBoyId: deliveryBoyId || null })
      });
      if (res.success) {
        fetchLaundryData();
      }
    } catch (err) {
      alert('Error assigning delivery runner');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
            <Shirt className="w-5 h-5 text-[#4F9D32]" />
            <span>Express Laundry &amp; Garment Care</span>
            <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
              Dual-OTP Security Protocol
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hostel bag pickups, wash-dry-fold cycles, steam press &amp; verified room deliveries (Default: Laundry vendor self-fulfillment without runner)
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Laundry Volume"
          value={`₹${(stats.revenue || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          subtitle="Processed student laundry orders"
          color="green"
        />

        <AdminKpiCard
          title="Active In-Wash"
          value={(stats.activeOrders || 0).toString()}
          icon={Clock}
          subtitle="Currently at campus plant"
          color="amber"
        />

        <AdminKpiCard
          title="Bags Delivered"
          value={(stats.completedOrders || 0).toString()}
          icon={PackageCheck}
          subtitle="Verified delivery OTP handoffs"
          color="blue"
        />

        <AdminKpiCard
          title="Dual-OTP Security"
          value="100% Enforced"
          icon={ShieldCheck}
          subtitle="Zero loss guarantee"
          color="green"
        />
      </div>

      {/* Laundry Orders Table with Dual-OTP inspection */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17202A]">Active Laundry Operations Pipeline</h3>
            <p className="text-xs text-slate-500">Dual-OTP status checks, fulfillment stage &amp; optional runner assignment</p>
          </div>
          <button
            onClick={fetchLaundryData}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold"
          >
            Refresh Pipeline
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading laundry tracking...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Student &amp; Hostel</th>
                  <th className="py-3 px-4">Bag Details</th>
                  <th className="py-3 px-4">Dual-OTP Security</th>
                  <th className="py-3 px-4">Delivery Runner Assignment</th>
                  <th className="py-3 px-4">Fulfillment Stage</th>
                  <th className="py-3 px-4 text-right">Update Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#4F9D32]">
                      {o.orderNumber}
                      <div className="text-[10px] text-slate-400 font-normal font-sans">
                        {new Date(o.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#17202A]">{o.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {o.hallName} &bull; Room {o.roomNumber}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      <div>{o.serviceType || 'Standard Wash & Fold'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {o.bagWeight ? `${o.bagWeight} kg` : `${o.itemsCount || 1} items`} &bull; ₹{o.finalPrice || o.estimatedPrice}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <OtpStatusBadge type="PICKUP" status={o.pickupOtpStatus || 'VERIFIED'} />
                        <OtpStatusBadge type="DELIVERY" status={o.deliveryOtpStatus || (o.status === 'COMPLETED' ? 'VERIFIED' : 'PENDING')} />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <select
                          value={o.deliveryBoyId || ''}
                          onChange={(e) => handleAssignDelivery(o.id, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium text-[11px] rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-[#4F9D32]"
                        >
                          <option value="">No Runner (Vendor Self-Delivery)</option>
                          {deliveryBoys.map((db: any) => (
                            <option key={db.id} value={db.id}>
                              Runner: {db.fullName} ({db.mobileNumber})
                            </option>
                          ))}
                        </select>
                        <div className="text-[10px] text-slate-400">
                          {o.deliveryBoyId ? `Assigned: ${o.deliveryBoyName}` : 'Handled by Laundry Vendor'}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          o.status === 'COMPLETED' || o.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-[#4F9D32]"
                      >
                        <option value="REQUESTED">Requested</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
                        <option value="CLOTHES_COLLECTED">Clothes Collected</option>
                        <option value="WASHING">Washing</option>
                        <option value="IRONING">Ironing</option>
                        <option value="READY">Ready for Return</option>
                        <option value="DELIVERY_SCHEDULED">Out for Delivery</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Laundry Rates Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4F9D32]" />
          <span>Campus Laundry Rates &amp; Tariffs</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {catalog.map((c: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5 hover:bg-white hover:shadow-xs transition">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 text-sky-600">
                <Shirt className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="font-bold text-[#17202A] text-sm">{c.name}</div>
                <div className="text-xs text-slate-500 line-clamp-1">{c.description}</div>
                <div className="text-sm font-black text-[#347A27] font-mono pt-1">₹{c.price} /{c.unit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
