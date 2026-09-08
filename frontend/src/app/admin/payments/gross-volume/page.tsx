'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, getApiBase } from '../../../../lib/api';
import {
  ArrowLeft,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  IndianRupee,
  CreditCard,
  Banknote,
  Percent,
  RotateCcw,
  XCircle,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';

interface GrossVolumeOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  date: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentEmail: string;
  studentRoom: string;
  studentHall: string;
  serviceType: string;
  status: string;
  providerAccepted: boolean;
  itemsSummary: string;
  itemsCount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  grossAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  onlineAmount: number;
  codAmount: number;
  commissionRate: number;
  commissionAmount: number;
  refundDetails: {
    hasReturn: boolean;
    refundStatus: string;
    refundAmount: number;
    retainedReturnFee: number;
    reasonType: string | null;
    reasonDetails: string | null;
  };
  cancellationDetails: {
    isCancelled: boolean;
    cancellationReason: string | null;
    retainedCancellationFee: number;
  };
  retainedReturnFee: number;
  retainedCancellationFee: number;
  netPlatformRevenue: number;
}

interface DateWiseSummary {
  date: string;
  orderCount: number;
  grossVolume: number;
  onlineAmount: number;
  codAmount: number;
  commissionAmount: number;
  retainedReturnFees: number;
  retainedCancellationFees: number;
  netPlatformRevenue: number;
}

interface GrossVolumeMetrics {
  totalGrossVolume: number;
  totalOnlinePayments: number;
  totalCodCollected: number;
  totalCommissionEarned: number;
  totalRetainedReturnFees: number;
  totalRetainedCancellationFees: number;
  totalRefundsDisbursed: number;
  totalNetPlatformRevenue: number;
  totalOrdersCount: number;
}

export default function GrossVolumePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<GrossVolumeOrder[]>([]);
  const [metrics, setMetrics] = useState<GrossVolumeMetrics | null>(null);
  const [dateWiseBreakdown, setDateWiseBreakdown] = useState<DateWiseSummary[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');

  // UI Toggles
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<GrossVolumeOrder | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Sync date preset dates
  const handlePresetChange = (preset: typeof datePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const todayStr = toDateStr(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toDateStr(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'WEEK') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      setStartDate(toDateStr(w));
      setEndDate(toDateStr(now));
    } else if (preset === 'MONTH') {
      const m = new Date(now);
      m.setDate(1);
      setStartDate(toDateStr(m));
      setEndDate(toDateStr(now));
    }
  };

  const fetchGrossVolumeData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceTypeFilter !== 'ALL') params.append('serviceType', serviceTypeFilter);
      if (paymentMethodFilter !== 'ALL') params.append('paymentMethod', paymentMethodFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sortBy) params.append('sortBy', sortBy);

      const res = await apiRequest(`/api/admin/payments/gross-volume?${params.toString()}`);
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        setMetrics(res.data.metrics || null);
        setDateWiseBreakdown(res.data.dateWiseBreakdown || []);
      }
    } catch (err: any) {
      console.error('Failed to load gross volume breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrossVolumeData();
  }, [startDate, endDate, serviceTypeFilter, paymentMethodFilter, statusFilter, sortBy]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGrossVolumeData();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client CSV Export
  const handleExportCsv = () => {
    if (orders.length === 0) return;
    setExportingCsv(true);

    const headers = [
      'Order Number',
      'Order Date',
      'Student ID',
      'Student Name',
      'Student Roll',
      'Student Hall/Room',
      'Service Category',
      'Order Status',
      'Gross Order Total (INR)',
      'Payment Method',
      'Online Amount (INR)',
      'COD Cash Amount (INR)',
      'Retained Return Charge (INR)',
      'Retained Cancellation Charge (INR)',
      'Refund Disbursed (INR)',
      'Platform Commission 5% (INR)',
      'Net Platform Earnings (INR)',
      'Items Purchased'
    ];

    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = orders.map((o) => [
      escapeCsv(o.orderNumber),
      escapeCsv(o.date),
      escapeCsv(o.studentId),
      escapeCsv(o.studentName),
      escapeCsv(o.studentRoll),
      escapeCsv(`${o.studentRoom}, ${o.studentHall}`),
      escapeCsv(o.serviceType),
      escapeCsv(o.status),
      o.grossAmount.toFixed(2),
      escapeCsv(o.paymentMethod),
      o.onlineAmount.toFixed(2),
      o.codAmount.toFixed(2),
      o.retainedReturnFee.toFixed(2),
      o.retainedCancellationFee.toFixed(2),
      o.refundDetails.refundAmount.toFixed(2),
      o.commissionAmount.toFixed(2),
      o.netPlatformRevenue.toFixed(2),
      escapeCsv(o.itemsSummary)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CampusBasket-Gross-Volume-Statement-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportingCsv(false);
  };

  // Download Server PDF
  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const base = getApiBase();
      const token = typeof window !== 'undefined' ? localStorage.getItem('nit_token') : null;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceTypeFilter !== 'ALL') params.append('serviceType', serviceTypeFilter);
      if (paymentMethodFilter !== 'ALL') params.append('paymentMethod', paymentMethodFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`${base}/api/admin/payments/gross-volume/pdf?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to generate PDF statement');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CampusBasket-Gross-Volume-Audit-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 500);
    } catch (err) {
      console.error(err);
      // Fallback: window.print()
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/admin/payments')}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-2xs flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Finance</span>
            </button>
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 tracking-wider">
              Institutional Financial Ledger
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Total Gross Platform Volume & Comprehensive Revenue Breakdown
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Live auditable breakdown of every student transaction, COD reconciliations, Razorpay online payments, policy-governed return & cancellation fee retention, and net platform earnings.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchGrossVolumeData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exportingCsv || orders.length === 0}
            className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="px-4 py-2.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{exportingPdf ? 'Generating PDF...' : 'Print / Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Cards (7 Dimension Live Audit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* Metric 1: Total Gross Platform Volume */}
        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Gross Volume</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            ₹{(metrics?.totalGrossVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-semibold text-slate-500">
            {metrics?.totalOrdersCount || 0} total platform orders
          </p>
        </div>

        {/* Metric 2: Online Payments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Online Paid</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            ₹{(metrics?.totalOnlinePayments || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-semibold text-slate-500">
            Razorpay UPI / Card / NetBanking
          </p>
        </div>

        {/* Metric 3: COD Cash Reconciled */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">COD Cash</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            ₹{(metrics?.totalCodCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-semibold text-slate-500">
            Doorstep cash collected by runners
          </p>
        </div>

        {/* Metric 4: Platform Commission (5%) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Commission (5%)</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-900 tracking-tight">
            ₹{(metrics?.totalCommissionEarned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-semibold text-slate-500">
            Recognized order margin
          </p>
        </div>

        {/* Metric 5: Retained Return Fees (Mind change deductions) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Return Fees Kept</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-900 tracking-tight">
            ₹{(metrics?.totalRetainedReturnFees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-semibold text-slate-500">
            ₹15/return mind change fee rule
          </p>
        </div>

        {/* Metric 6: Retained Cancellation Fees */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Cancel Fees Kept</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-900 tracking-tight">
            ₹{(metrics?.totalRetainedCancellationFees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-semibold text-slate-500">
            Policy delivery fee deductions
          </p>
        </div>

        {/* Metric 7: Total Net Platform Revenue */}
        <div className="bg-gradient-to-br from-emerald-600 to-[#2E7D32] p-4 rounded-2xl shadow-sm space-y-1 text-white">
          <div className="flex items-center justify-between text-emerald-100">
            <span className="text-[10px] font-black uppercase tracking-wider">Net Platform Gets</span>
            <div className="p-1.5 rounded-lg bg-white/20 text-white">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tight">
            ₹{(metrics?.totalNetPlatformRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-medium text-emerald-100">
            Commission + Retained Fees + Delivery
          </p>
        </div>
      </div>

      {/* 3. Date-Wise Aggregated Summary Section (Collapsible) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div
          onClick={() => setShowDailyBreakdown(!showDailyBreakdown)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition border-b border-slate-100"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Date-Wise Revenue & Order Volume Breakdown</h3>
              <p className="text-[11px] text-slate-500">
                Audited daily aggregates showing orders, gross amount, online vs COD, and net earnings per date
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>{showDailyBreakdown ? 'Hide Daily Table' : 'View Daily Breakdown'}</span>
            {showDailyBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {showDailyBreakdown && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3 font-extrabold">Statement Date</th>
                  <th className="py-2.5 px-3 font-extrabold text-center">Orders</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Gross Volume</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Online Collected</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">COD Cash</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Commission (5%)</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Retained Fees</th>
                  <th className="py-2.5 px-3 font-extrabold text-right text-emerald-700">Net Platform Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dateWiseBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-400">No date-wise data available for this range.</td>
                  </tr>
                ) : (
                  dateWiseBreakdown.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/60 font-mono">
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">
                        {new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {row.orderCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        ₹{row.grossVolume.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-700 font-semibold">
                        ₹{row.onlineAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-700 font-semibold">
                        ₹{row.codAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-purple-700 font-semibold">
                        ₹{row.commissionAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">
                        +₹{(row.retainedReturnFees + row.retainedCancellationFees).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-800 bg-emerald-50/40">
                        ₹{row.netPlatformRevenue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Multi-Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Row 1: Search & Quick Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Student ID, Name, Roll No, Room, Order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4F9D2F] bg-slate-50/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                ×
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'CUSTOM'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  datePreset === preset
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset === 'ALL' ? 'All Time' : preset === 'TODAY' ? 'Today' : preset === 'YESTERDAY' ? 'Yesterday' : preset === 'WEEK' ? 'Last 7 Days' : preset === 'MONTH' ? 'This Month' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100 text-xs">
          {/* Custom Date Range Pickers (shown when CUSTOM or when dates set) */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 bg-white"
            />
          </div>

          {/* Service Type Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Service Type</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">All Services</option>
              <option value="FOOD">Food & Dining</option>
              <option value="FRESH_PRODUCE">Fresh Produce</option>
              <option value="STATIONERY">Stationery & Essentials</option>
              <option value="LAUNDRY">Express Laundry</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="ONLINE">Razorpay Online (Prepaid)</option>
              <option value="CASH_ON_DELIVERY">Cash on Delivery (COD)</option>
              <option value="COD_WITH_ADVANCE">COD with Online Advance</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="DELIVERED">Delivered & Verified</option>
              <option value="RETURNED">Returned / Refund Processed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="IN_PROGRESS">Active Fulfillment</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 bg-white"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: Highest First</option>
              <option value="amount_asc">Amount: Lowest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Main Detailed Transactions & Calculations Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Comprehensive Financial Calculation Audit
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
              {orders.length} orders
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Calculations auto-reflect delivery fee deductions, refund rules & 5% institutional margin
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3 px-3.5 font-black">Date & Time</th>
                <th className="py-3 px-3 font-black">Order Info</th>
                <th className="py-3 px-3 font-black">Student Details</th>
                <th className="py-3 px-3 font-black text-right">Gross Total</th>
                <th className="py-3 px-3 font-black text-right">Online Paid</th>
                <th className="py-3 px-3 font-black text-right">COD Cash</th>
                <th className="py-3 px-3 font-black text-center">Return Fee Kept</th>
                <th className="py-3 px-3 font-black text-center">Cancel Fee Kept</th>
                <th className="py-3 px-3 font-black text-right">Commission (5%)</th>
                <th className="py-3 px-3.5 font-black text-right text-emerald-800">Net Platform Gets</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="w-7 h-7 border-2 border-[#4F9D2F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading financial calculation ledger...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700">No matching orders found</p>
                    <p className="text-xs text-slate-400">Adjust your date range or filters to view platform volume.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isDelivered = o.status === 'DELIVERED' || o.status === 'COMPLETED';
                  const isCancelled = o.status === 'CANCELLED';
                  const hasReturn = o.refundDetails.hasReturn;

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => setSelectedOrder(o)}
                    >
                      {/* 1. Date & Time */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* 2. Order Info */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-black text-slate-900 text-xs flex items-center gap-1">
                          <span>#{o.orderNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                            {o.serviceType}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-800'
                              : isCancelled
                              ? 'bg-red-50 text-red-700'
                              : hasReturn
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={o.itemsSummary}>
                          {o.itemsSummary}
                        </div>
                      </td>

                      {/* 3. Student Details */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{o.studentName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          ID: <span className="font-bold text-slate-700">{o.studentId}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {o.studentRoll} • {o.studentRoom ? `Room ${o.studentRoom}, ` : ''}{o.studentHall}
                        </div>
                      </td>

                      {/* 4. Gross Total */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-black text-slate-900 text-xs">
                        ₹{o.grossAmount.toFixed(2)}
                      </td>

                      {/* 5. Online Paid */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                        {o.onlineAmount > 0 ? (
                          <span className="font-bold text-blue-700">₹{o.onlineAmount.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-300">₹0.00</span>
                        )}
                        <div className="text-[9px] text-slate-400 uppercase">
                          {o.paymentMethod === 'CASH_ON_DELIVERY' && o.onlineAmount > 0 ? 'Advance Online' : o.paymentMethod !== 'CASH_ON_DELIVERY' ? 'Online' : '-'}
                        </div>
                      </td>

                      {/* 6. COD Cash */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                        {o.codAmount > 0 ? (
                          <span className="font-bold text-indigo-700">₹{o.codAmount.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-300">₹0.00</span>
                        )}
                        <div className="text-[9px] text-slate-400 uppercase">
                          {o.codAmount > 0 ? 'Cash at Handover' : '-'}
                        </div>
                      </td>

                      {/* 7. Refund Money (Money Platform Keeps per return rule) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {hasReturn ? (
                          <div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              o.retainedReturnFee > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-mono'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {o.retainedReturnFee > 0 ? `+₹${o.retainedReturnFee.toFixed(2)} Kept` : '₹0 Kept (Defect)'}
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Refund: ₹{o.refundDetails.refundAmount.toFixed(0)} ({o.refundDetails.reasonType === 'MIND_CHANGE' ? 'Mind Change' : 'Defect'})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* 8. Cancellation Money (Money Platform Keeps per cancellation rule) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isCancelled ? (
                          <div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              o.retainedCancellationFee > 0
                                ? 'bg-rose-100 text-rose-900 border border-rose-300 font-mono'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {o.retainedCancellationFee > 0 ? `+₹${o.retainedCancellationFee.toFixed(2)} Kept` : '₹0 Kept (Pre-Accept)'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* 9. Commission (5%) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-purple-700">
                        ₹{o.commissionAmount.toFixed(2)}
                      </td>

                      {/* 10. Net Money Platform Gets */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-black text-emerald-800 bg-emerald-50/40 text-xs">
                        ₹{o.netPlatformRevenue.toFixed(2)}
                      </td>

                      {/* 11. Action Details */}
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-[11px] font-bold shadow-2xs cursor-pointer"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Totals */}
        {orders.length > 0 && (
          <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-slate-400">Total Filtered Result:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {orders.length} orders
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL GROSS:</span>
                <span className="font-black text-white text-sm">₹{(metrics?.totalGrossVolume || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL ONLINE:</span>
                <span className="font-bold text-blue-300">₹{(metrics?.totalOnlinePayments || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL COD:</span>
                <span className="font-bold text-indigo-300">₹{(metrics?.totalCodCollected || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">RETAINED FEES:</span>
                <span className="font-bold text-amber-300">
                  +₹{((metrics?.totalRetainedReturnFees || 0) + (metrics?.totalRetainedCancellationFees || 0)).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">COMMISSION (5%):</span>
                <span className="font-bold text-purple-300">₹{(metrics?.totalCommissionEarned || 0).toFixed(2)}</span>
              </div>
              <div className="pl-3 border-l border-slate-700">
                <span className="text-emerald-400 block text-[10px] font-bold">NET PLATFORM REVENUE:</span>
                <span className="font-black text-emerald-300 text-base">
                  ₹{(metrics?.totalNetPlatformRevenue || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Order Audit Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Financial Audit</div>
                <h3 className="text-base font-black text-slate-900">Order #{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Student & Delivery Profile */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Student Details</div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">STUDENT NAME:</span>
                  <strong>{selectedOrder.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">STUDENT ID:</span>
                  <strong className="font-mono">{selectedOrder.studentId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ROLL NUMBER:</span>
                  <strong className="font-mono">{selectedOrder.studentRoll}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">HOSTEL RESIDENCE:</span>
                  <span>Room {selectedOrder.studentRoom}, {selectedOrder.studentHall}</span>
                </div>
              </div>
            </div>

            {/* Detailed Financial Equation Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Detailed Financial Math</div>
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Gross Order Face Value:</span>
                  <span className="font-mono font-bold">₹{selectedOrder.grossAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pl-3">
                  <span>• Paid Online (Razorpay):</span>
                  <span className="font-mono text-blue-700">₹{selectedOrder.onlineAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pl-3">
                  <span>• COD Cash at Handover:</span>
                  <span className="font-mono text-indigo-700">₹{selectedOrder.codAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-emerald-200/80 pt-2 flex justify-between text-slate-700">
                  <span>Platform Commission (5%):</span>
                  <span className="font-mono font-bold text-purple-700">+₹{selectedOrder.commissionAmount.toFixed(2)}</span>
                </div>

                {selectedOrder.refundDetails.hasReturn && (
                  <div className="flex justify-between text-slate-700">
                    <span>
                      Return Policy Retention ({selectedOrder.refundDetails.reasonType === 'MIND_CHANGE' ? 'Mind Change Charge' : 'Defect Waived'}):
                    </span>
                    <span className="font-mono font-bold text-amber-800">+₹{selectedOrder.retainedReturnFee.toFixed(2)}</span>
                  </div>
                )}

                {selectedOrder.cancellationDetails.isCancelled && (
                  <div className="flex justify-between text-slate-700">
                    <span>Cancellation Fee Retained:</span>
                    <span className="font-mono font-bold text-rose-800">+₹{selectedOrder.retainedCancellationFee.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t-2 border-emerald-400 pt-2 flex justify-between items-center text-sm font-black text-emerald-950">
                  <span>Total Net Money Platform Gets:</span>
                  <span className="font-mono text-base font-black text-emerald-700">
                    ₹{selectedOrder.netPlatformRevenue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchased Items</span>
              <p className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium">
                {selectedOrder.itemsSummary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link
                href={`/orders/${selectedOrder.id}/track`}
                target="_blank"
                className="text-xs font-bold text-[#4F9D2F] hover:underline flex items-center gap-1"
              >
                <span>Live Student Tracking</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
