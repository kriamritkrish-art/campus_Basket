'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import {
  Store,
  Phone,
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  User,
  ShoppingBag,
  IndianRupee,
  Package,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  RotateCcw,
  Wallet,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Food & Meals',
  'Fresh Fruits',
  'Express Laundry',
  'Stationery & Essentials'
];

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalProviders: 0,
    activeProviders: 0,
    totalProviderProducts: 0,
    totalOrders: 0,
    grossSales: 0,
    providerPayable: 0,
    cbGrossShare: 0,
    totalReturns: 0,
    totalReturnedAmount: 0,
    totalCancelledOrders: 0,
    totalRefundAmount: 0,
    pendingSettlement: 0,
    settledAmount: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 25
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [returnStatusFilter, setReturnStatusFilter] = useState('ALL');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Password visibility & clipboard state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    businessName: '',
    contactPerson: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    serviceCategory: 'Food & Meals',
    activeStatus: true,
    autoAssignDelivery: false,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    businessName: '',
    contactPerson: '',
    username: '',
    email: '',
    phone: '',
    serviceCategory: 'Food & Meals',
    activeStatus: true,
    autoAssignDelivery: false,
    password: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (returnStatusFilter !== 'ALL') params.append('returnStatus', returnStatusFilter);
      if (settlementStatusFilter !== 'ALL') params.append('settlementStatus', settlementStatusFilter);
      params.append('page', String(page));
      params.append('limit', '25');

      const res = await apiRequest(`/api/admin/providers?${params.toString()}`);
      if (res.success && res.providers) {
        setProviders(res.providers);
        if (res.summary) {
          setSummary(res.summary);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.warn('Providers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [page, categoryFilter, returnStatusFilter, settlementStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProviders();
  };

  const handleCopyPassword = (id: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  const handleToggleAutoAssign = async (providerId: string, currentAutoAssign: boolean) => {
    try {
      const res = await apiRequest(`/api/admin/providers/${providerId}/auto-assign`, {
        method: 'PATCH',
        body: JSON.stringify({ autoAssignDelivery: !currentAutoAssign })
      });
      if (res.success) {
        setProviders((prev) =>
          prev.map((p) => (p.id === providerId ? { ...p, autoAssignDelivery: !currentAutoAssign } : p))
        );
      }
    } catch (err) {
      alert('Error updating provider auto-assign setting');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await apiRequest('/api/admin/providers', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });

      if (res.success) {
        setCreateModalOpen(false);
        setCreateForm({
          businessName: '',
          contactPerson: '',
          username: '',
          email: '',
          password: '',
          phone: '',
          serviceCategory: 'Food & Meals',
          activeStatus: true,
          autoAssignDelivery: false,
        });
        fetchProviders();
      } else {
        setCreateError(res.message || 'Failed to create service provider');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error creating provider');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (provider: any) => {
    setEditingProvider(provider);
    setEditForm({
      businessName: provider.businessName || provider.fullName || '',
      contactPerson: provider.contactPerson || provider.fullName || '',
      username: provider.username || provider.user?.username || '',
      email: provider.email || provider.user?.email || '',
      phone: provider.phone || provider.mobileNumber || '',
      serviceCategory: provider.serviceCategory || provider.serviceType || 'Food & Meals',
      activeStatus: provider.activeStatus ?? true,
      autoAssignDelivery: provider.autoAssignDelivery ?? false,
      password: provider.plainPassword || '',
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setEditError(null);
    setEditLoading(true);

    try {
      const payload: any = {
        businessName: editForm.businessName,
        contactPerson: editForm.contactPerson,
        username: editForm.username,
        email: editForm.email,
        phone: editForm.phone,
        serviceCategory: editForm.serviceCategory,
        activeStatus: editForm.activeStatus,
        autoAssignDelivery: editForm.autoAssignDelivery,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      const res = await apiRequest(`/api/admin/providers/${editingProvider.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setEditModalOpen(false);
        fetchProviders();
      } else {
        setEditError(res.message || 'Failed to update provider');
      }
    } catch (err: any) {
      setEditError(err.message || 'Error updating provider');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteProvider = async (provider: any) => {
    const confirm = window.confirm(
      `Are you sure you want to delete service provider "${provider.businessName || provider.fullName}"? This action cannot be undone.`
    );
    if (!confirm) return;

    try {
      const res = await apiRequest(`/api/admin/providers/${provider.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setProviders((prev) => prev.filter((p) => p.id !== provider.id));
      } else {
        alert(res.message || 'Failed to delete provider');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting provider');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#347A27]">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#17202A] tracking-tight">
              Providers Management Dashboard
            </h1>
            <span className="text-[11px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
              {summary.totalProviders} Providers ({summary.activeProviders} Active)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Database-driven monitoring of service providers, earnings, return deductions, and settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchProviders()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#4F9D32]" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service Provider</span>
          </button>
        </div>
      </div>

      {/* TOP 13 SUMMARY CARDS (Requirement 7) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Network Financial &amp; Operational Metrics
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Real database values</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Card 1: Total Providers */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Providers</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{summary.totalProviders}</div>
            <span className="text-[10px] text-slate-500">Registered</span>
          </div>

          {/* Card 2: Active Providers */}
          <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Active Providers</span>
            <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">{summary.activeProviders}</div>
            <span className="text-[10px] text-emerald-600">Operating</span>
          </div>

          {/* Card 3: Total Provider Products */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Products</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{summary.totalProviderProducts}</div>
            <span className="text-[10px] text-slate-500">Assigned</span>
          </div>

          {/* Card 4: Total Orders */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Orders</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{summary.totalOrders}</div>
            <span className="text-[10px] text-slate-500">All-time</span>
          </div>

          {/* Card 5: Gross Sales */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Gross Sales</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">₹{summary.grossSales}</div>
            <span className="text-[10px] text-slate-500">Total volume</span>
          </div>

          {/* Card 6: Provider Payable */}
          <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Provider Payable</span>
            <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">₹{summary.providerPayable}</div>
            <span className="text-[10px] text-emerald-700">Calculated cut</span>
          </div>

          {/* Card 7: Campus Basket Gross Share */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">CB Gross Share</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">₹{summary.cbGrossShare}</div>
            <span className="text-[10px] text-slate-500">Platform margin</span>
          </div>

          {/* Card 8: Total Returns */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-amber-800">Total Returns</span>
            <div className="text-xl font-black text-amber-800 font-mono mt-0.5">{summary.totalReturns}</div>
            <span className="text-[10px] text-amber-700">Orders returned</span>
          </div>

          {/* Card 9: Total Returned Amount */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-amber-800">Returned Amount</span>
            <div className="text-xl font-black text-amber-800 font-mono mt-0.5">₹{summary.totalReturnedAmount}</div>
            <span className="text-[10px] text-amber-700">Gross value</span>
          </div>

          {/* Card 10: Total Cancelled Orders */}
          <div className="bg-white p-3.5 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-rose-800">Cancelled Orders</span>
            <div className="text-xl font-black text-rose-800 font-mono mt-0.5">{summary.totalCancelledOrders}</div>
            <span className="text-[10px] text-rose-700">Cancellations</span>
          </div>

          {/* Card 11: Total Refund Amount */}
          <div className="bg-white p-3.5 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-rose-800">Refund Amount</span>
            <div className="text-xl font-black text-rose-800 font-mono mt-0.5">₹{summary.totalRefundAmount}</div>
            <span className="text-[10px] text-rose-700">Returned to users</span>
          </div>

          {/* Card 12: Pending Provider Settlement */}
          <div className="bg-white p-3.5 rounded-2xl border border-purple-100 bg-purple-50/30 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-purple-800">Pending Settlement</span>
            <div className="text-xl font-black text-purple-800 font-mono mt-0.5">₹{summary.pendingSettlement}</div>
            <span className="text-[10px] text-purple-700">Unsettled</span>
          </div>

          {/* Card 13: Settled Amount */}
          <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-2xs sm:col-span-2">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Total Settled Amount</span>
            <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">₹{summary.settledAmount}</div>
            <span className="text-[10px] text-emerald-700">Disbursed via Admin Settlements</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search providers by name, User ID, email, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Return Status Filter */}
          <select
            value={returnStatusFilter}
            onChange={(e) => {
              setReturnStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Return Statuses</option>
            <option value="RETURNED">With Returns</option>
            <option value="NO_RETURN">No Returns</option>
          </select>

          {/* Settlement Status Filter */}
          <select
            value={settlementStatusFilter}
            onChange={(e) => {
              setSettlementStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Settlement Statuses</option>
            <option value="SETTLED">Settled</option>
            <option value="PENDING">Pending Settlement</option>
            <option value="ADJUSTED">Adjusted (Returns)</option>
          </select>
        </div>
      </div>

      {/* PROVIDER TABLE (Requirement 8, 17, 18) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading providers directory &amp; financial metrics...</span>
          </div>
        ) : providers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No service providers match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Provider Name &amp; Entity</th>
                  <th className="py-3.5 px-4">Contact &amp; Credentials</th>
                  <th className="py-3.5 px-4 text-center">Total Products</th>
                  <th className="py-3.5 px-4 text-center">Total Orders</th>
                  <th className="py-3.5 px-4">Gross Sales</th>
                  <th className="py-3.5 px-4">Provider Payable</th>
                  <th className="py-3.5 px-4">CB Gross Share</th>
                  <th className="py-3.5 px-4 text-center">Completed</th>
                  <th className="py-3.5 px-4 text-center">Cancelled</th>
                  <th className="py-3.5 px-4 text-center">Returned Orders</th>
                  <th className="py-3.5 px-4">Return Amount</th>
                  <th className="py-3.5 px-4">Refund Amount</th>
                  <th className="py-3.5 px-4">Pending Settlement</th>
                  <th className="py-3.5 px-4">Settled Amount</th>
                  <th className="py-3.5 px-4">Settlement Status</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map((p) => {
                  const businessName = p.businessName || p.fullName || 'Campus Service Provider';
                  const contactPerson = p.contactPerson || p.fullName || 'Manager';
                  const phone = p.phone || p.mobileNumber || 'N/A';
                  const userId = p.username || p.user?.username || p.id.slice(-6);
                  const email = p.email || p.user?.email || 'vendor@example.com';
                  const password = p.plainPassword || '••••••••';
                  const isPassVisible = showAllPasswords || !!visiblePasswords[p.id];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors font-mono">
                      {/* 1. Provider Name */}
                      <td className="py-3.5 px-4 font-sans">
                        <Link
                          href={`/admin/providers/${p.id}`}
                          className="font-bold text-slate-900 hover:text-[#4F9D32] transition block"
                        >
                          {businessName}
                        </Link>
                        <div className="text-[10px] text-purple-700 font-mono font-bold mt-0.5 flex items-center gap-1">
                          <span>User ID:</span>
                          <span className="bg-purple-50 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200">
                            {userId}
                          </span>
                        </div>
                      </td>

                      {/* 2. Contact & Credentials */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-slate-800">{contactPerson}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{phone}</span>
                        </div>
                        {p.plainPassword && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                              {isPassVisible ? password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(p.id)}
                              className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(p.id, password)}
                              className="p-0.5 text-slate-400 hover:text-[#4F9D32] cursor-pointer"
                            >
                              {copiedId === p.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 3. Total Products */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {p.totalProducts ?? 0}
                      </td>

                      {/* 4. Total Orders */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {p.totalOrders ?? 0}
                      </td>

                      {/* 5. Gross Sales */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{p.grossSales ?? 0}
                      </td>

                      {/* 6. Provider Payable */}
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        ₹{p.providerPayable ?? 0}
                      </td>

                      {/* 7. Campus Basket Gross Share */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{p.cbGrossShare ?? 0}
                      </td>

                      {/* 8. Completed Orders */}
                      <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                        {p.completedOrders ?? 0}
                      </td>

                      {/* 9. Cancelled Orders */}
                      <td className="py-3.5 px-4 text-center font-semibold text-rose-600">
                        {p.cancelledOrders ?? 0}
                      </td>

                      {/* 10. Returned Orders */}
                      <td className="py-3.5 px-4 text-center font-semibold text-amber-700">
                        {p.returnedOrders ?? 0}
                      </td>

                      {/* 11. Return Amount */}
                      <td className="py-3.5 px-4 font-bold text-amber-700">
                        ₹{p.returnAmount ?? 0}
                      </td>

                      {/* 12. Refund Amount */}
                      <td className="py-3.5 px-4 font-bold text-rose-600">
                        ₹{p.refundAmount ?? 0}
                      </td>

                      {/* 13. Pending Settlement */}
                      <td className="py-3.5 px-4 font-bold text-purple-700">
                        ₹{p.pendingSettlement ?? 0}
                      </td>

                      {/* 14. Settled Amount */}
                      <td className="py-3.5 px-4 font-bold text-emerald-800">
                        ₹{p.settledAmount ?? 0}
                      </td>

                      {/* 15. Settlement Status */}
                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.settlementStatus === 'SETTLED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : p.settlementStatus === 'ADJUSTED'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {p.settlementStatus || 'PENDING'}
                        </span>
                      </td>

                      {/* 16. Wallet Balance */}
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        ₹{p.walletBalance ?? 0}
                      </td>

                      {/* 17. Actions */}
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/providers/${p.id}`}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#347A27] border border-emerald-200 transition"
                            title="View Full Provider Details & Financials"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Provider Details"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleAutoAssign(p.id, Boolean(p.autoAssignDelivery))}
                            title={p.autoAssignDelivery ? 'Switch to Manual Acceptance' : 'Switch to Auto-Assign'}
                            className={`text-[9px] px-1.5 py-1 rounded-md font-bold border transition cursor-pointer ${
                              p.autoAssignDelivery
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-sky-50 text-sky-800 border-sky-200'
                            }`}
                          >
                            {p.autoAssignDelivery ? 'Auto' : 'Manual'}
                          </button>

                          <button
                            onClick={() => handleToggleStatus(p.id, p.activeStatus)}
                            title={p.activeStatus ? 'Suspend' : 'Activate'}
                            className={`text-[9px] font-bold px-1.5 py-1 rounded-md border transition cursor-pointer ${
                              p.activeStatus
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-[#347A27] border-emerald-200'
                            }`}
                          >
                            {p.activeStatus ? 'Suspend' : 'Activate'}
                          </button>

                          <button
                            onClick={() => handleDeleteProvider(p)}
                            title="Delete Provider"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && providers.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.totalPages}</span> ({pagination.total} total providers)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE SERVICE PROVIDER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#4F9D32]" />
                <div>
                  <h3 className="text-base font-bold text-[#17202A]">Create New Service Provider</h3>
                  <p className="text-[11px] text-slate-500">Service providers use personal Gmail. College @nitdgp.ac.in is not required.</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business / Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hall 11 Canteen Express"
                    value={createForm.businessName}
                    onChange={(e) => setCreateForm({ ...createForm, businessName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={createForm.contactPerson}
                    onChange={(e) => setCreateForm({ ...createForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">User ID / Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SP_VENDOR_01"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service Category *</label>
                  <select
                    value={createForm.serviceCategory}
                    onChange={(e) => setCreateForm({ ...createForm, serviceCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Personal Gmail Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="vendor.canteen@gmail.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile / Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  placeholder="Set initial password for vendor login"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Provider can log in directly at /provider/login using their User ID and this password.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-xs">Active Operating Status</div>
                    <div className="text-[10px] text-slate-500">Allow this provider to receive customer orders</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={createForm.activeStatus}
                    onChange={(e) => setCreateForm({ ...createForm, activeStatus: e.target.checked })}
                    className="rounded border-slate-300 text-[#4F9D32] focus:ring-[#4F9D32] h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div>
                    <div className="font-bold text-slate-800 text-xs">Automated Runner Dispatch</div>
                    <div className="text-[10px] text-slate-500">Automatically broadcast orders to delivery boys upon placement</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={createForm.autoAssignDelivery}
                    onChange={(e) => setCreateForm({ ...createForm, autoAssignDelivery: e.target.checked })}
                    className="rounded border-slate-300 text-[#4F9D32] focus:ring-[#4F9D32] h-4 w-4"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Provider Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SERVICE PROVIDER MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#4F9D32]" />
                <h3 className="text-base font-bold text-[#17202A]">Edit Service Provider</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.businessName}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={editForm.contactPerson}
                    onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">User ID / Username</label>
                  <input
                    type="text"
                    disabled
                    value={editForm.username}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service Category</label>
                  <select
                    value={editForm.serviceCategory}
                    onChange={(e) => setEditForm({ ...editForm, serviceCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Personal Gmail *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile / Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reset Password (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave blank to keep existing password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
