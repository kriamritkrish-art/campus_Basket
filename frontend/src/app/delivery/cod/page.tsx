'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Banknote,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Store,
  User,
  PackageCheck,
  ChevronDown
} from 'lucide-react';

export default function DeliveryCodPage() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any>({
    todayCod: 0,
    todayCollected: 0,
    todayPending: 0,
    todayDeliveredCount: 0,
    totalFilteredCod: 0,
    totalFilteredCollected: 0,
    totalFilteredPending: 0
  });
  const [orders, setOrders] = useState<any[]>([]);

  // Filter States
  const [dateRange, setDateRange] = useState<string>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [providers, setProviders] = useState<string[]>([]);

  const fetchCodData = async () => {
    setLoading(true);
    try {
      let query = `?dateRange=${dateRange}`;
      if (dateRange === 'custom' && startDate && endDate) {
        query = `?startDate=${startDate}&endDate=${endDate}`;
      }
      if (providerFilter !== 'ALL') query += `&providerId=${providerFilter}`;
      if (statusFilter !== 'ALL') query += `&collectionStatus=${statusFilter}`;

      const res = await apiRequest(`/api/delivery/cod${query}`).catch(() => null);
      if (res?.success) {
        setCards(res.cards || {});
        setOrders(res.orders || []);

        // Unique providers
        const pSet = new Set<string>();
        (res.orders || []).forEach((o: any) => {
          if (o.provider) pSet.add(o.provider);
        });
        setProviders(Array.from(pSet));
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodData();
  }, [dateRange, providerFilter, statusFilter]);

  const filteredOrders = orders.filter((o: any) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.student?.toLowerCase().includes(q) ||
      o.provider?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">MY COD COLLECTION</h1>
              <p className="text-xs text-slate-500">Doorstep Cash Collection Ledger &bull; Real-time Verification</p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchCodData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's COD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's COD</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{Number(cards.todayCod || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Expected today from students</div>
        </div>

        {/* Collected */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Collected</span>
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{Number(cards.todayCollected || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Received at doorstep today</div>
        </div>

        {/* Pending */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending</span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-800 mt-2">
            ₹{Number(cards.todayPending || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-600 mt-1">To be collected/handed over</div>
        </div>

        {/* Delivered COD Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered Orders</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <PackageCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {cards.todayDeliveredCount || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">COD deliveries today</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg transition ${dateRange === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('yesterday')}
              className={`px-3 py-1.5 rounded-lg transition ${dateRange === 'yesterday' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-lg transition ${dateRange === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-lg transition ${dateRange === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg transition ${dateRange === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Records
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order # or Student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Second Row Filters: Provider & Collection Status */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="COLLECTED">Collected</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_COLLECTED">Partially Collected</option>
            </select>
          </div>

          {providers.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">Provider:</span>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
              >
                <option value="ALL">All Providers</option>
                {providers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Delivered COD Orders ({filteredOrders.length})
          </h3>
          <span className="text-xs text-slate-500">
            Total COD: ₹{Number(cards.totalFilteredCod || 0).toLocaleString('en-IN')} &bull; Collected: ₹{Number(cards.totalFilteredCollected || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading COD records...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No COD orders found for this timeframe.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3.5 font-bold">Order ID</th>
                  <th className="p-3.5 font-bold">Date</th>
                  <th className="p-3.5 font-bold">Student</th>
                  <th className="p-3.5 font-bold">Provider</th>
                  <th className="p-3.5 font-bold text-right">Order Amount</th>
                  <th className="p-3.5 font-bold text-right">COD Amount</th>
                  <th className="p-3.5 font-bold text-right">Collected</th>
                  <th className="p-3.5 font-bold text-right">Pending</th>
                  <th className="p-3.5 font-bold text-center">Collection Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord: any) => (
                  <tr key={ord.orderId} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">
                      {ord.orderNumber}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(ord.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">
                      {ord.student}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {ord.provider}
                    </td>
                    <td className="p-3.5 text-right font-semibold text-slate-900">
                      ₹{ord.orderAmount.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-blue-700">
                      ₹{ord.codAmount.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-700">
                      ₹{ord.collectedAmount.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-amber-800">
                      ₹{ord.pendingAmount.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.collectionStatus === 'COLLECTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : (ord.collectionStatus === 'PARTIALLY_COLLECTED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')
                      }`}>
                        {ord.collectionStatus}
                      </span>
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
