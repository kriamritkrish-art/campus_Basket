'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import {
  Truck,
  Phone,
  Mail,
  Plus,
  Search,
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
  PackageCheck,
  ClipboardList,
  AlertCircle,
  RefreshCw,
  KeyRound
} from 'lucide-react';

export default function AdminDeliveryBoysPage() {
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Password visibility & clipboard state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    vehicleType: 'Bicycle / Walk',
    status: 'ACTIVE',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBoy, setEditingBoy] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    vehicleType: 'Bicycle / Walk',
    status: 'ACTIVE',
    password: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchDeliveryBoys = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/delivery-boys');
      if (res.success && res.deliveryBoys) {
        setDeliveryBoys(res.deliveryBoys);
      }
    } catch (err) {
      console.warn('Delivery boys fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const handleCopyPassword = (id: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await apiRequest('/api/admin/delivery-boys', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });

      if (res.success) {
        setCreateModalOpen(false);
        setCreateForm({
          fullName: '',
          username: '',
          email: '',
          password: '',
          phone: '',
          vehicleType: 'Bicycle / Walk',
          status: 'ACTIVE',
        });
        fetchDeliveryBoys();
      } else {
        setCreateError(res.message || 'Failed to create delivery boy');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error creating delivery boy');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (boy: any) => {
    setEditingBoy(boy);
    setEditForm({
      fullName: boy.fullName || '',
      username: boy.username || boy.user?.username || '',
      email: boy.email || boy.user?.email || '',
      phone: boy.phone || boy.mobileNumber || '',
      vehicleType: boy.vehicleType || 'Bicycle / Walk',
      status: boy.status || (boy.activeStatus ? 'ACTIVE' : 'INACTIVE'),
      password: boy.plainPassword || '',
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoy) return;
    setEditError(null);
    setEditLoading(true);

    try {
      const payload: any = {
        fullName: editForm.fullName,
        username: editForm.username,
        email: editForm.email,
        phone: editForm.phone,
        vehicleType: editForm.vehicleType,
        status: editForm.status,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      const res = await apiRequest(`/api/admin/delivery-boys/${editingBoy.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setEditModalOpen(false);
        fetchDeliveryBoys();
      } else {
        setEditError(res.message || 'Failed to update delivery boy');
      }
    } catch (err: any) {
      setEditError(err.message || 'Error updating delivery boy');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (boy: any) => {
    const confirm = window.confirm(
      `Are you sure you want to remove delivery personnel "${boy.fullName}"?`
    );
    if (!confirm) return;

    try {
      const res = await apiRequest(`/api/admin/delivery-boys/${boy.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setDeliveryBoys((prev) => prev.filter((b) => b.id !== boy.id));
      } else {
        alert(res.message || 'Failed to delete delivery boy');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting delivery boy');
    }
  };

  const filteredBoys = deliveryBoys.filter((b) => {
    return (
      !search ||
      b.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeCount = deliveryBoys.filter((b) => b.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Truck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#17202A] tracking-tight">
              Campus Delivery Fleet &amp; Runners
            </h1>
            <span className="text-[11px] bg-sky-50 text-sky-700 font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
              {deliveryBoys.length} Total ({activeCount} Active)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create delivery runners, oversee order assignments, and monitor hostel delivery fulfilment
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Boy</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search runners by name, User ID (e.g. DB_RUNNER_01), email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Delivery Boys Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-sky-400 border-t-sky-600 rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Syncing delivery personnel directory...</span>
          </div>
        ) : filteredBoys.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No delivery boys found. Click &quot;Add Delivery Boy&quot; to register runner personnel.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Runner Name &amp; User ID</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Registered Gmail</th>
                  <th className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span>Login Password</span>
                      <button
                        type="button"
                        onClick={() => setShowAllPasswords(!showAllPasswords)}
                        title={showAllPasswords ? 'Hide all passwords' : 'Show all passwords'}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition cursor-pointer"
                      >
                        {showAllPasswords ? <EyeOff className="w-3.5 h-3.5 text-sky-700" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Active Deliveries</th>
                  <th className="py-3.5 px-4">Total Completed</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBoys.map((boy) => {
                  const fallbackId = `DB_${boy.fullName?.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'RUN'}_01`;
                  const userId = boy.username || boy.user?.username || fallbackId;
                  const email = boy.email || boy.user?.email || 'runner.delivery@gmail.com';
                  const phone = boy.phone || boy.mobileNumber || '9876543220';
                  const password = boy.plainPassword || 'Delivery@12345';
                  const activeAssignments = boy.activeAssignments ?? boy._count?.assignedOrders ?? 0;
                  const completedDeliveries = boy.completedDeliveries ?? 0;
                  const isActive = boy.status === 'ACTIVE' || boy.activeStatus === true;
                  const isPassVisible = showAllPasswords || !!visiblePasswords[boy.id];

                  return (
                    <tr key={boy.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#17202A]">
                        <div>{boy.fullName}</div>
                        <div className="text-[10px] text-sky-700 font-mono font-bold mt-0.5 flex items-center gap-1">
                          <span>User ID:</span>
                          <span className="bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">
                            {userId}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]">{email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 tracking-wider select-all">
                            {isPassVisible ? password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(boy.id)}
                            title={isPassVisible ? 'Hide password' : 'Show password'}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5 text-sky-700" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(boy.id, password)}
                            title="Copy password"
                            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          >
                            {copiedId === boy.id ? <Check className="w-3.5 h-3.5 text-sky-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          {activeAssignments} Assigned
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#347A27] text-[10px] font-bold border border-emerald-200">
                          {completedDeliveries} Drops
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isActive
                              ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {isActive ? 'ACTIVE & ON-DUTY' : 'INACTIVE'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(boy)}
                            title="Edit Details"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(boy)}
                            title="Delete Delivery Boy"
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

      {/* CREATE DELIVERY BOY MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-base font-bold text-[#17202A]">Register Delivery Personnel</h3>
                  <p className="text-[11px] text-slate-500">Delivery partners use personal Gmail. College @nitdgp.ac.in not required.</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
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
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">User ID / Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DB_RUNNER_01"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TempPass@2026"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Personal Gmail (for 2FA OTP) *</label>
                  <input
                    type="email"
                    required
                    placeholder="runner@gmail.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Personal Gmail supported</p>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Bicycle / Walk"
                    value={createForm.vehicleType}
                    onChange={(e) => setCreateForm({ ...createForm, vehicleType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800"
                  >
                    <option value="ACTIVE">ACTIVE &amp; ON-DUTY</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Register Runner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DELIVERY BOY MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-[#17202A]">Edit Runner Details</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">User ID / Username *</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Personal Gmail *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    value={editForm.vehicleType}
                    onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Operating Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="ACTIVE">ACTIVE &amp; ON-DUTY</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Login Password</label>
                <input
                  type="text"
                  placeholder="Leave blank or enter new password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Visible &amp; editable by administrator</p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
