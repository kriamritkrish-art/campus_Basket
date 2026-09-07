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
  KeyRound,
  IndianRupee,
  Briefcase,
  Sliders,
  DollarSign,
  TrendingUp,
  History,
  ShieldAlert
} from 'lucide-react';

export default function AdminDeliveryBoysPage() {
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Password visibility & clipboard state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  // Aggregated Stats
  const [stats, setStats] = useState({
    totalDeliveryBoys: 0,
    totalPerDeliveryStaff: 0,
    totalMonthlyStaff: 0,
    totalCompletedDeliveries: 0,
    totalEarningsPaid: 0
  });

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    vehicleType: 'Bicycle / Walk',
    status: 'ACTIVE',
    paymentType: 'PER_DELIVERY',
    perDeliveryRate: 10,
    monthlySalary: 15000,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
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
    paymentType: 'PER_DELIVERY',
    perDeliveryRate: 10,
    monthlySalary: 15000,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Manual Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustingBoy, setAdjustingBoy] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({
    type: 'ADD', // 'ADD' | 'DEDUCT'
    amount: '',
    reason: '',
  });
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  // Earnings History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyBoy, setHistoryBoy] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchDeliveryBoys = async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        apiRequest('/api/admin/delivery-boys'),
        apiRequest('/api/admin/delivery-boys/stats').catch(() => null)
      ]);
      if (res.success && res.deliveryBoys) {
        setDeliveryBoys(res.deliveryBoys);
      }
      if (statsRes?.success && statsRes.stats) {
        setStats(statsRes.stats);
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

  // Create Delivery Boy
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const payload: any = {
        fullName: createForm.fullName,
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        phone: createForm.phone,
        vehicleType: createForm.vehicleType,
        status: createForm.status,
        paymentType: createForm.paymentType,
        perDeliveryRate: createForm.paymentType === 'PER_DELIVERY' ? Number(createForm.perDeliveryRate) : 0,
        monthlySalary: createForm.paymentType === 'MONTHLY_CONTRACT' ? Number(createForm.monthlySalary) : 0,
      };

      const res = await apiRequest('/api/admin/delivery-boys', {
        method: 'POST',
        body: JSON.stringify(payload),
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
          paymentType: 'PER_DELIVERY',
          perDeliveryRate: 10,
          monthlySalary: 15000,
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

  // Open Edit Modal
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
      paymentType: boy.paymentType || 'PER_DELIVERY',
      perDeliveryRate: boy.perDeliveryRate !== undefined ? boy.perDeliveryRate : 10,
      monthlySalary: boy.monthlySalary !== undefined ? boy.monthlySalary : 15000,
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  // Submit Edit
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
        paymentType: editForm.paymentType,
        perDeliveryRate: editForm.paymentType === 'PER_DELIVERY' ? Number(editForm.perDeliveryRate) : 0,
        monthlySalary: editForm.paymentType === 'MONTHLY_CONTRACT' ? Number(editForm.monthlySalary) : 0,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      const res = await apiRequest(`/api/admin/delivery-boys/${editingBoy.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setEditModalOpen(false);
        setEditingBoy(null);
        fetchDeliveryBoys();
      } else {
        setEditError(res.message || 'Failed to update delivery partner');
      }
    } catch (err: any) {
      setEditError(err.message || 'Error updating delivery partner');
    } finally {
      setEditLoading(false);
    }
  };

  // Open Adjust Modal
  const openAdjustModal = (boy: any) => {
    setAdjustingBoy(boy);
    setAdjustForm({ type: 'ADD', amount: '', reason: '' });
    setAdjustError(null);
    setAdjustSuccess(null);
    setAdjustModalOpen(true);
  };

  // Submit Adjustment
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingBoy) return;
    if (!adjustForm.amount || Number(adjustForm.amount) <= 0) {
      setAdjustError('Please enter a valid positive adjustment amount.');
      return;
    }
    if (!adjustForm.reason.trim()) {
      setAdjustError('A mandatory reason is required for audit compliance.');
      return;
    }

    setAdjustLoading(true);
    setAdjustError(null);
    try {
      const res = await apiRequest(`/api/admin/delivery-boys/${adjustingBoy.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(adjustForm.amount),
          type: adjustForm.type,
          reason: adjustForm.reason.trim(),
        }),
      });

      if (res.success) {
        setAdjustSuccess(res.message || 'Balance adjusted successfully.');
        setTimeout(() => {
          setAdjustModalOpen(false);
          setAdjustingBoy(null);
          fetchDeliveryBoys();
        }, 1200);
      } else {
        setAdjustError(res.message || 'Failed to adjust balance.');
      }
    } catch (err: any) {
      setAdjustError(err.message || 'Error adjusting balance.');
    } finally {
      setAdjustLoading(false);
    }
  };

  // Open History Modal
  const openHistoryModal = async (boy: any) => {
    setHistoryBoy(boy);
    setHistoryList([]);
    setHistoryModalOpen(true);
    setHistoryLoading(true);

    try {
      const res = await apiRequest(`/api/admin/delivery-boys/${boy.id}/earnings`);
      if (res.success && Array.isArray(res.earnings)) {
        setHistoryList(res.earnings);
      }
    } catch (err) {
      console.warn('Failed to load runner earnings history:', err);
    } finally {
      setHistoryLoading(false);
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

  const activeCount = deliveryBoys.filter((b) => b.status === 'ACTIVE' || b.activeStatus === true).length;
  const perDeliveryCount = deliveryBoys.filter((b) => b.paymentType !== 'MONTHLY_CONTRACT').length;
  const monthlyCount = deliveryBoys.filter((b) => b.paymentType === 'MONTHLY_CONTRACT').length;

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
              Campus Delivery Fleet &amp; Compensation
            </h1>
            <span className="text-[11px] bg-sky-50 text-sky-700 font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
              {deliveryBoys.length} Total ({activeCount} Active)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure delivery boy employment types (Per Delivery vs Monthly Contract), set rates, process manual adjustments, and review audit history.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Boy</span>
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Runners */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Fleet</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{deliveryBoys.length}</div>
            <p className="text-[11px] text-emerald-700 font-semibold">{activeCount} active on campus</p>
          </div>
        </div>

        {/* Per-Delivery Staff */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Per Delivery Staff</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-700">{perDeliveryCount}</div>
            <p className="text-[11px] text-slate-500 font-semibold">Configured rate per order</p>
          </div>
        </div>

        {/* Monthly Contract Staff */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Monthly Contract Staff</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-900">{monthlyCount}</div>
            <p className="text-[11px] text-purple-700 font-semibold">Fixed salary • ₹0 per order</p>
          </div>
        </div>

        {/* Total Deliveries Fulfilled */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Completed</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-blue-700">
              {deliveryBoys.reduce((sum, b) => sum + (b.completedDeliveries || 0), 0)}
            </div>
            <p className="text-[11px] text-slate-500 font-semibold">Verified OTP deliveries</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search runners by name, User ID (e.g. DB_BOY_01), email, or phone..."
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
                  <th className="py-3.5 px-4">Runner &amp; User ID</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Payment Type</th>
                  <th className="py-3.5 px-4">Rate / Salary</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4">Completed</th>
                  <th className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span>Password</span>
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
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBoys.map((boy) => {
                  const fallbackId = `DB_${boy.fullName?.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'RUN'}_01`;
                  const userId = boy.username || boy.user?.username || fallbackId;
                  const phone = boy.phone || boy.mobileNumber || '9876543220';
                  const password = boy.plainPassword || 'Delivery@12345';
                  const completedDeliveries = boy.completedDeliveries ?? 0;
                  const isActive = boy.status === 'ACTIVE' || boy.activeStatus === true;
                  const isPassVisible = showAllPasswords || !!visiblePasswords[boy.id];
                  const isMonthlyStaff = boy.paymentType === 'MONTHLY_CONTRACT';

                  return (
                    <tr key={boy.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4 font-bold text-[#17202A]">
                        <div>{boy.fullName}</div>
                        <div className="text-[10px] text-sky-700 font-mono font-bold mt-0.5 flex items-center gap-1">
                          <span>User ID:</span>
                          <span className="bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">
                            {userId}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{phone}</span>
                        </div>
                      </td>

                      {/* Payment Type Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            isMonthlyStaff
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isMonthlyStaff ? <Briefcase className="w-3 h-3" /> : <IndianRupee className="w-3 h-3" />}
                          <span>{isMonthlyStaff ? 'Monthly Contract' : 'Per Delivery'}</span>
                        </span>
                      </td>

                      {/* Rate / Salary */}
                      <td className="py-3.5 px-4 font-bold">
                        {isMonthlyStaff ? (
                          <div className="text-purple-950 font-mono">
                            ₹{(boy.monthlySalary || 15000).toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] font-normal text-slate-400">/ mo</span>
                          </div>
                        ) : (
                          <div className="text-emerald-800 font-mono">
                            ₹{boy.perDeliveryRate || 10}{' '}
                            <span className="text-[10px] font-normal text-slate-400">/ order</span>
                          </div>
                        )}
                      </td>

                      {/* Wallet Balance */}
                      <td className="py-3.5 px-4 font-bold font-mono">
                        {isMonthlyStaff ? (
                          <span className="text-slate-400 text-[11px]">— (Fixed Salary)</span>
                        ) : (
                          <span className="text-slate-900">
                            ₹{(boy.totalEarned !== undefined ? boy.totalEarned : boy.walletBalance || 0).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Total Completed */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700 font-mono">
                        {completedDeliveries}
                      </td>

                      {/* Password */}
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
                            {copiedId === boy.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Adjust Balance Button */}
                          <button
                            type="button"
                            onClick={() => openAdjustModal(boy)}
                            title="Adjust runner balance"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-sky-700 transition cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* View Earnings History Button */}
                          <button
                            type="button"
                            onClick={() => openHistoryModal(boy)}
                            title="View earnings history"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition cursor-pointer"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(boy)}
                            title="Edit delivery boy details"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-sky-700 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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

      {/* ==================================================
          CREATE DELIVERY BOY MODAL
         ================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-base font-bold text-[#17202A]">Register Delivery Personnel</h3>
                  <p className="text-[11px] text-slate-500">Configure employment type, rate, and credentials</p>
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
                    placeholder="e.g. Delivery@12345"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Personal Gmail *</label>
                  <input
                    type="email"
                    required
                    placeholder="runner@gmail.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* PAYMENT TYPE SELECTION */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block">Employment &amp; Payment Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      createForm.paymentType === 'PER_DELIVERY'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="createPaymentType"
                      value="PER_DELIVERY"
                      checked={createForm.paymentType === 'PER_DELIVERY'}
                      onChange={() => setCreateForm({ ...createForm, paymentType: 'PER_DELIVERY' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Per Delivery</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      createForm.paymentType === 'MONTHLY_CONTRACT'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="createPaymentType"
                      value="MONTHLY_CONTRACT"
                      checked={createForm.paymentType === 'MONTHLY_CONTRACT'}
                      onChange={() => setCreateForm({ ...createForm, paymentType: 'MONTHLY_CONTRACT' })}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>Monthly Contract</span>
                  </label>
                </div>

                {createForm.paymentType === 'PER_DELIVERY' ? (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Per Delivery Amount (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={createForm.perDeliveryRate}
                        onChange={(e) => setCreateForm({ ...createForm, perDeliveryRate: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2 font-mono font-bold text-slate-900"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                      Credited automatically upon successful customer 6-digit OTP verification.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Monthly Contract Salary (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        required
                        value={createForm.monthlySalary}
                        onChange={(e) => setCreateForm({ ...createForm, monthlySalary: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2 font-mono font-bold text-slate-900"
                      />
                    </div>
                    <p className="text-[10px] text-purple-700 font-semibold mt-1">
                      Per-delivery order payouts automatically disabled (₹0).
                    </p>
                  </div>
                )}
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
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
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

      {/* ==================================================
          EDIT DELIVERY BOY MODAL
         ================================================== */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-[#17202A]">Edit Runner Details &amp; Compensation</h3>
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
                  <label className="font-bold text-slate-700 block mb-1">User ID *</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase"
                  />
                </div>
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

              {/* PAYMENT TYPE SELECTION */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block">Employment &amp; Payment Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      editForm.paymentType === 'PER_DELIVERY'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editPaymentType"
                      value="PER_DELIVERY"
                      checked={editForm.paymentType === 'PER_DELIVERY'}
                      onChange={() => setEditForm({ ...editForm, paymentType: 'PER_DELIVERY' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Per Delivery</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      editForm.paymentType === 'MONTHLY_CONTRACT'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editPaymentType"
                      value="MONTHLY_CONTRACT"
                      checked={editForm.paymentType === 'MONTHLY_CONTRACT'}
                      onChange={() => setEditForm({ ...editForm, paymentType: 'MONTHLY_CONTRACT' })}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>Monthly Contract</span>
                  </label>
                </div>

                {editForm.paymentType === 'PER_DELIVERY' ? (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Per Delivery Amount (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={editForm.perDeliveryRate}
                        onChange={(e) => setEditForm({ ...editForm, perDeliveryRate: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2 font-mono font-bold text-slate-900"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                      New rate applies to future deliveries. Historic completed orders keep their earned rate.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Monthly Contract Amount (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        required
                        value={editForm.monthlySalary}
                        onChange={(e) => setEditForm({ ...editForm, monthlySalary: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2 font-mono font-bold text-slate-900"
                      />
                    </div>
                    <p className="text-[10px] text-purple-700 font-semibold mt-1">
                      Per-delivery order payouts automatically disabled (₹0).
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <label className="font-bold text-slate-700 block mb-1">Login Password</label>
                <input
                  type="text"
                  placeholder="Leave blank or enter new password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
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

      {/* ==================================================
          MANUAL BALANCE ADJUSTMENT MODAL
         ================================================== */}
      {adjustModalOpen && adjustingBoy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-base font-bold text-[#17202A]">Adjust Runner Balance</h3>
                  <p className="text-[11px] text-slate-500">
                    {adjustingBoy.fullName} ({adjustingBoy.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{adjustError}</span>
              </div>
            )}

            {adjustSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 rounded-xl flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{adjustSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-bold">Current Wallet Balance</span>
                <span className="text-base font-mono font-black text-slate-900">
                  ₹{(adjustingBoy.totalEarned !== undefined ? adjustingBoy.totalEarned : adjustingBoy.walletBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Adjustment Action *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: 'ADD' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      adjustForm.type === 'ADD'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    + Credit Balance (Add)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: 'DEDUCT' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      adjustForm.type === 'DEDUCT'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    - Debit Balance (Deduct)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 50"
                    value={adjustForm.amount}
                    onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Audit Trail Note *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Campus Fest Delivery Rush Incentive or Correction"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Immutable audit record will record your Admin account, amount, reason, and timestamp.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading || !adjustForm.amount || !adjustForm.reason.trim()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {adjustLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          EARNINGS & AUDIT HISTORY MODAL
         ================================================== */}
      {historyModalOpen && historyBoy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-base font-bold text-[#17202A]">Earnings &amp; Audit History</h3>
                  <p className="text-[11px] text-slate-500">
                    {historyBoy.fullName} •{' '}
                    <span className="font-bold text-slate-700">
                      {historyBoy.paymentType === 'MONTHLY_CONTRACT' ? 'Monthly Contract Staff' : 'Per Delivery Staff'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Pill */}
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-700 shrink-0">
              <div>
                <span>Rate: </span>
                <span className="font-bold text-slate-900 font-mono">
                  {historyBoy.paymentType === 'MONTHLY_CONTRACT'
                    ? `₹${(historyBoy.monthlySalary || 15000).toLocaleString('en-IN')}/mo`
                    : `₹${historyBoy.perDeliveryRate || 10}/order`}
                </span>
              </div>
              <div>
                <span>Wallet Balance: </span>
                <span className="font-bold text-emerald-700 font-mono text-sm">
                  ₹{(historyBoy.totalEarned !== undefined ? historyBoy.totalEarned : historyBoy.walletBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
              {historyLoading ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  <div className="w-6 h-6 border-2 border-sky-400 border-t-sky-600 rounded-full animate-spin mx-auto mb-2" />
                  Loading transactions...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No earnings or adjustment transactions found for this runner.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Order / Note</th>
                      <th className="py-2.5 px-3">Admin</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{item.date}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.earningType === 'ADMIN_ADJUSTMENT'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {item.earningType === 'ADMIN_ADJUSTMENT' ? 'Adjustment' : 'Delivery'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 font-medium">
                          {item.orderNumber || item.description || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {item.adminAdjustedBy || 'System'}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-black font-mono ${
                            item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {item.amount >= 0 ? `+₹${item.amount}` : `-₹${Math.abs(item.amount)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
