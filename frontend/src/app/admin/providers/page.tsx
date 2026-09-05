'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import {
  Store,
  Phone,
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
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
  RefreshCw
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Food & Meals',
  'Fresh Fruits',
  'Express Laundry',
  'Stationery & Essentials'
];

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

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
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    serviceCategory: 'Food & Meals',
    activeStatus: true,
    password: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // View Details & Sales Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'OVERVIEW' | 'PRODUCTS' | 'ORDERS'>('OVERVIEW');

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
      businessName: provider.businessName || '',
      contactPerson: provider.contactPerson || '',
      phone: provider.phone || '',
      serviceCategory: provider.serviceCategory || provider.serviceType || 'Food & Meals',
      activeStatus: provider.activeStatus ?? true,
      password: '',
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
        phone: editForm.phone,
        serviceCategory: editForm.serviceCategory,
        activeStatus: editForm.activeStatus,
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
      `Are you sure you want to delete service provider "${provider.businessName}"? This action cannot be undone.`
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

  const openDetailsModal = async (providerId: string) => {
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setDetailsTab('OVERVIEW');
    try {
      const res = await apiRequest(`/api/admin/providers/${providerId}`);
      if (res.success) {
        setSelectedDetails(res);
      }
    } catch (err) {
      console.warn('Provider details error:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filtered providers list
  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      !search ||
      p.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      p.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.email?.toLowerCase().includes(search.toLowerCase());

    const category = p.serviceCategory || p.serviceType;
    const matchesCategory =
      categoryFilter === 'ALL' ||
      category?.toLowerCase().includes(categoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const activeCount = providers.filter((p) => p.activeStatus).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#347A27]">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#17202A] tracking-tight">
              Campus Service Providers &amp; Vendors
            </h1>
            <span className="text-[11px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
              {providers.length} Registered ({activeCount} Active)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage food cafeterias, express laundry operators, fresh fruits stalls, and stationery providers
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#4F9D32]/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Provider</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search providers by name, User ID, email, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading providers directory...</span>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No service providers match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Business Entity &amp; User ID</th>
                  <th className="py-3.5 px-4">Contact Person &amp; Phone</th>
                  <th className="py-3.5 px-4">Registered Gmail</th>
                  <th className="py-3.5 px-4">Service Category</th>
                  <th className="py-3.5 px-4">Operating Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProviders.map((p) => {
                  const category = p.serviceCategory || p.serviceType || 'Food & Meals';
                  const userId = p.user?.username || p.user?.id?.slice(0, 10) || 'N/A';
                  const email = p.user?.email || p.email || 'N/A';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#17202A]">
                        <div>{p.businessName}</div>
                        <div className="text-[10px] text-purple-700 font-mono font-bold mt-0.5">
                          User ID: {userId}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{p.contactPerson}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p.phone || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#347A27] text-[10px] font-bold border border-emerald-200">
                          {category}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetailsModal(p.id)}
                            title="View Sales & Analytics"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-purple-700 border border-slate-200 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Provider"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(p.id, p.activeStatus)}
                            title={p.activeStatus ? 'Suspend' : 'Activate'}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
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
      </div>

      {/* CREATE SERVICE PROVIDER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#4F9D32]" />
                <h3 className="text-base font-bold text-[#17202A]">Create New Service Provider</h3>
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
                    placeholder="e.g. SP_FOOD_01"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registered Gmail (for OTP) *</label>
                  <input
                    type="email"
                    required
                    placeholder="vendor@nitdgp.ac.in"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4F9D32] focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Assigned Category (Strict Single Category Enforcement) *
                </label>
                <select
                  value={createForm.serviceCategory}
                  onChange={(e) => setCreateForm({ ...createForm, serviceCategory: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:border-[#4F9D32]"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Provider will only be permitted to publish products under this single category.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="createActiveStatus"
                  checked={createForm.activeStatus}
                  onChange={(e) => setCreateForm({ ...createForm, activeStatus: e.target.checked })}
                  className="rounded text-[#4F9D32] focus:ring-[#4F9D32] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="createActiveStatus" className="font-semibold text-slate-700 cursor-pointer">
                  Activate Provider Immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Create Provider</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SERVICE PROVIDER MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#4F9D32]" />
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
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={editForm.contactPerson}
                    onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Category</label>
                <select
                  value={editForm.serviceCategory}
                  onChange={(e) => setEditForm({ ...editForm, serviceCategory: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reset Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editActiveStatus"
                  checked={editForm.activeStatus}
                  onChange={(e) => setEditForm({ ...editForm, activeStatus: e.target.checked })}
                  className="rounded text-[#4F9D32] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="editActiveStatus" className="font-semibold text-slate-700 cursor-pointer">
                  Authorized Operating Status
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS & SALES ANALYTICS MODAL (Section 19) */}
      {detailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#4F9D32]" />
                <h3 className="text-base font-bold text-[#17202A]">
                  Provider Details &amp; Revenue Breakdown
                </h3>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <div className="w-7 h-7 border-2 border-[#4F9D32] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500">Calculating revenue breakdown...</span>
              </div>
            ) : selectedDetails ? (
              <div className="space-y-4">
                {/* Provider Card Header */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#17202A]">
                      {selectedDetails.provider?.businessName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contact: {selectedDetails.provider?.contactPerson} &bull; {selectedDetails.provider?.phone}
                    </p>
                    <p className="text-[11px] font-mono text-purple-700 font-bold mt-1">
                      User ID: {selectedDetails.provider?.user?.username || 'N/A'} &bull; Category: {selectedDetails.provider?.serviceCategory || selectedDetails.provider?.serviceType}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedDetails.provider?.activeStatus
                        ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {selectedDetails.provider?.activeStatus ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>

                {/* Section 19 KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] uppercase font-bold text-emerald-700">Total Revenue</div>
                    <div className="text-2xl font-black text-[#17202A] mt-1">
                      ₹{(selectedDetails.stats?.totalRevenue || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <div className="text-[10px] uppercase font-bold text-purple-700">Total Orders</div>
                    <div className="text-2xl font-black text-[#17202A] mt-1">
                      {selectedDetails.stats?.totalOrders || 0}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                    <div className="text-[10px] uppercase font-bold text-sky-700">Products Listed</div>
                    <div className="text-2xl font-black text-[#17202A] mt-1">
                      {selectedDetails.stats?.productCount || 0}
                    </div>
                  </div>
                </div>

                {/* Tabs for Products and Orders */}
                <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
                  <button
                    onClick={() => setDetailsTab('OVERVIEW')}
                    className={`pb-2 border-b-2 transition ${
                      detailsTab === 'OVERVIEW'
                        ? 'border-[#4F9D32] text-[#347A27]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Catalog Items ({selectedDetails.products?.length || 0})
                  </button>
                  <button
                    onClick={() => setDetailsTab('ORDERS')}
                    className={`pb-2 border-b-2 transition ${
                      detailsTab === 'ORDERS'
                        ? 'border-[#4F9D32] text-[#347A27]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Fulfilled Orders ({selectedDetails.orders?.length || 0})
                  </button>
                </div>

                {/* Tab 1: Products */}
                {detailsTab === 'OVERVIEW' && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(!selectedDetails.products || selectedDetails.products.length === 0) ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No products added yet by this provider.
                      </div>
                    ) : (
                      selectedDetails.products.map((prod: any) => (
                        <div
                          key={prod.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{prod.name}</div>
                            <div className="text-[10px] text-slate-500">
                              ₹{prod.price} &bull; Stock: {prod.stockQuantity} &bull; Category: {prod.category?.name || 'General'}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              prod.approvalStatus === 'APPROVED'
                                ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                                : prod.approvalStatus === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {prod.approvalStatus || 'APPROVED'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 2: Orders */}
                {detailsTab === 'ORDERS' && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(!selectedDetails.orders || selectedDetails.orders.length === 0) ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No orders recorded yet.
                      </div>
                    ) : (
                      selectedDetails.orders.map((ord: any) => (
                        <div
                          key={ord.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-purple-700">{ord.orderNumber}</div>
                            <div className="text-[10px] text-slate-500">
                              {ord.student?.fullName || 'Student'} &bull; ₹{ord.totalAmount}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                            {ord.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
