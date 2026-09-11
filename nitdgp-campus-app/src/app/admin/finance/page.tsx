'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import OrderFinancialDetailsModal from '@/components/common/OrderFinancialDetailsModal';
import {
  IndianRupee,
  Wallet,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ExternalLink,
  Store,
  Bike,
  Building2,
  Calendar,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Receipt,
  X,
  User,
  Package,
  CreditCard,
  Lock,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

interface FinanceSummary {
  today: {
    todayGrossSales?: number;
    grossSales?: number;
    providerPayable: number;
    providerSettled: number;
    providerPending: number;
    codExpected: number;
    codCollected: number;
    codPending: number;
    deliveryEarnings: number;
    deliveryPending: number;
  };
  overall: {
    grossSales: number;
    campusCommission?: number;
    netProviderPayable: number;
    providerSettled: number;
    providerPending: number;
    totalCodExpected: number;
    totalCodCollected: number;
    totalCodPending: number;
    totalDeliveryEarnings: number;
    totalDeliverySettled: number;
    totalDeliveryPending: number;
  };
  counts: {
    totalOrders: number;
    settledOrders: number;
    pendingOrders: number;
    codOrders: number;
    providersCount: number;
    deliveryBoysCount: number;
  };
}

// ---------------------------------------------------------------------------
// Robust Formatting Helpers (Zero NaN, Zero Invalid Date)
// ---------------------------------------------------------------------------
const formatCurrency = (val: any): string => {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNum = (val: any): string => {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return '0';
  return num.toLocaleString('en-IN');
};

const formatDateSafe = (val: any, includeTime = false): string => {
  if (!val) return 'N/A';
  const d = new Date(val);
  if (isNaN(d.getTime())) return 'N/A';
  if (includeTime) {
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const safeText = (val: any, fallback = '—'): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    return val.fullName || val.name || val.businessName || val.rollNumber || fallback;
  }
  return String(val);
};

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<
    'PROVIDERS' | 'COD' | 'DELIVERY' | 'HISTORY' | 'REPORTS'
  >('PROVIDERS');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  // Tab 1: Providers
  const [providersData, setProvidersData] = useState<any[]>([]);
  const [providerRequests, setProviderRequests] = useState<any[]>([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerStatusFilter, setProviderStatusFilter] = useState('ALL');

  // Read-only Provider Drilldown State
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [drillProviderSearch, setDrillProviderSearch] = useState('');
  const [drillPaymentFilter, setDrillPaymentFilter] = useState('ALL');
  const [drillStatusFilter, setDrillStatusFilter] = useState('ALL');

  // Tab 2: COD
  const [codSummary, setCodSummary] = useState<any>(null);
  const [codView, setCodView] = useState<'RUNNERS' | 'ORDERS' | 'PROVIDERS'>('RUNNERS');
  const [codSearch, setCodSearch] = useState('');
  const [codStatusFilter, setCodStatusFilter] = useState('ALL');

  // Read-only Runner COD Drilldown State
  const [selectedRunnerCod, setSelectedRunnerCod] = useState<any | null>(null);

  // Tab 3: Delivery Earnings
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [deliverySearch, setDeliverySearch] = useState('');
  const [deliveryContractFilter, setDeliveryContractFilter] = useState('ALL');

  // Read-only Runner Earnings Drilldown State
  const [selectedRunnerEarnings, setSelectedRunnerEarnings] = useState<any | null>(null);

  // Tab 4: Settlement History
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyRecipientFilter, setHistoryRecipientFilter] = useState('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');

  // Tab 5: Reports
  const [reportsData, setReportsData] = useState<any>(null);
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportProviderFilter, setReportProviderFilter] = useState('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');

  // Common Financial Detail Modal for any single order
  const [drilldownOrderId, setDrilldownOrderId] = useState<string | null>(null);

  // Load High-Level Summary
  const fetchSummary = async () => {
    try {
      const res = await apiRequest('/api/admin/finance/summary').catch(() => null);
      if (res?.success) {
        setSummary(res.data || res);
      }
    } catch {}
  };

  // Load Providers Tab Data
  const fetchProviders = async () => {
    try {
      const res = await apiRequest('/api/admin/finance/provider-payables').catch(() => null);
      if (res?.success) {
        const list = res.data?.providers || res.providers || (Array.isArray(res.data) ? res.data : []);
        setProvidersData(
          list.map((p: any) => ({
            ...p,
            providerName: p.providerName || p.name || 'Vendor Partner',
            businessCategory: p.businessCategory || p.category || 'CAMPUS',
            ordersCount: p.ordersCount ?? p.totalOrders ?? (p.orders?.length || 0),
            grossSales: Number(p.grossSales ?? p.grossOrderValue ?? 0),
            campusCommission: 0,
            totalPayable: Number(p.totalPayable ?? p.providerPayable ?? (p.grossSales ?? p.grossOrderValue ?? 0)),
            settledAmount: Number(p.settledAmount ?? p.alreadySettled ?? 0),
            remainingAmount: Number(p.remainingAmount ?? p.remainingPayable ?? 0),
            settlementStatus: p.settlementStatus || 'PENDING',
            orders: Array.isArray(p.orders) ? p.orders : []
          }))
        );
      }
      const reqRes = await apiRequest('/api/admin/finance/provider-requests').catch(() => null);
      if (reqRes?.success) {
        setProviderRequests(reqRes.data || reqRes.requests || (Array.isArray(reqRes) ? reqRes : []));
      }
    } catch {}
  };

  // Load COD Tab Data
  const fetchCod = async () => {
    try {
      const res = await apiRequest('/api/admin/finance/cod').catch(() => null);
      if (res?.success) {
        const payload = res.data || res;
        const boys = payload.deliveryBoys || payload.deliveryBoySummary || [];
        setCodSummary({
          ...payload,
          deliveryBoys: boys,
          deliveryBoySummary: boys
        });
      }
    } catch {}
  };

  // Load Delivery Boys Tab Data
  const fetchDelivery = async () => {
    try {
      const res = await apiRequest('/api/admin/finance/delivery-earnings').catch(() => null);
      if (res?.success) {
        const list = res.data?.deliveryBoys || res.deliveryBoys || (Array.isArray(res.data) ? res.data : []);
        setDeliveryData(list);
      }
    } catch {}
  };

  // Load Settlement History
  const fetchHistory = async () => {
    try {
      const query = new URLSearchParams();
      if (historyRecipientFilter !== 'ALL') query.set('recipientType', historyRecipientFilter);
      if (historyStatusFilter !== 'ALL') query.set('status', historyStatusFilter);
      const res = await apiRequest(`/api/admin/finance/history?${query.toString()}`).catch(() => null);
      if (res?.success) {
        setHistoryData(res.data?.settlements || res.settlements || res.history || (Array.isArray(res.data) ? res.data : []));
      }
    } catch {}
  };

  // Load Reports
  const fetchReports = async () => {
    try {
      const query = new URLSearchParams();
      if (reportDateFrom) query.set('startDate', reportDateFrom);
      if (reportDateTo) query.set('endDate', reportDateTo);
      if (reportProviderFilter !== 'ALL') query.set('providerId', reportProviderFilter);
      if (reportStatusFilter !== 'ALL') query.set('status', reportStatusFilter);
      const res = await apiRequest(`/api/admin/finance/reports?${query.toString()}`).catch(() => null);
      if (res?.success) {
        setReportsData(res.data || res);
      }
    } catch {}
  };

  // Initial Boot
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchSummary(),
        fetchProviders(),
        fetchCod(),
        fetchDelivery(),
        fetchHistory(),
        fetchReports()
      ]);
      setLoading(false);
    };
    loadAll();
  }, []);

  // Reload tab when filter changes
  useEffect(() => {
    if (activeTab === 'HISTORY') fetchHistory();
  }, [historyRecipientFilter, historyStatusFilter]);

  useEffect(() => {
    if (activeTab === 'REPORTS') fetchReports();
  }, [reportDateFrom, reportDateTo, reportProviderFilter, reportStatusFilter]);

  // Refresh treasury data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSummary(),
      fetchProviders(),
      fetchCod(),
      fetchDelivery(),
      fetchHistory(),
      fetchReports()
    ]);
    setRefreshing(false);
  };

  // Export CSV
  const handleExportCsv = () => {
    const query = new URLSearchParams();
    if (reportDateFrom) query.set('startDate', reportDateFrom);
    if (reportDateTo) query.set('endDate', reportDateTo);
    if (reportProviderFilter !== 'ALL') query.set('providerId', reportProviderFilter);
    if (reportStatusFilter !== 'ALL') query.set('status', reportStatusFilter);
    window.open(`/api/admin/finance/reports/export/csv?${query.toString()}`, '_blank');
  };

  // Export PDF
  const handleExportPdf = () => {
    const query = new URLSearchParams();
    if (reportDateFrom) query.set('startDate', reportDateFrom);
    if (reportDateTo) query.set('endDate', reportDateTo);
    if (reportProviderFilter !== 'ALL') query.set('providerId', reportProviderFilter);
    if (reportStatusFilter !== 'ALL') query.set('status', reportStatusFilter);
    window.open(`/api/admin/finance/reports/export/pdf?${query.toString()}`, '_blank');
  };

  // Filtered Providers (Safe against undefined properties)
  const filteredProviders = useMemo(() => {
    if (!Array.isArray(providersData)) return [];
    const search = (providerSearch || '').trim().toLowerCase();
    return providersData.filter((p) => {
      if (!p) return false;
      const name = String(p.providerName || '').toLowerCase();
      const category = String(p.businessCategory || '').toLowerCase();
      const phone = String(p.contactPhone || '').toLowerCase();
      const matchesSearch =
        !search ||
        name.includes(search) ||
        category.includes(search) ||
        phone.includes(search);
      const matchesStatus =
        providerStatusFilter === 'ALL' || p.settlementStatus === providerStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [providersData, providerSearch, providerStatusFilter]);

  // Filtered COD Collections (Safe against undefined properties)
  const filteredCodOrders = useMemo(() => {
    if (!codSummary?.detailedOrders || !Array.isArray(codSummary.detailedOrders)) return [];
    const search = (codSearch || '').trim().toLowerCase();
    return codSummary.detailedOrders.filter((o: any) => {
      if (!o) return false;
      const orderNum = String(o.orderNumber || o.id || '').toLowerCase();
      const cust = String(o.customerName || '').toLowerCase();
      const prov = String(o.providerName || '').toLowerCase();
      const runner = String(o.runnerName || '').toLowerCase();
      const matchesSearch =
        !search ||
        orderNum.includes(search) ||
        cust.includes(search) ||
        prov.includes(search) ||
        runner.includes(search);
      const matchesStatus =
        codStatusFilter === 'ALL' || o.collectionStatus === codStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [codSummary, codSearch, codStatusFilter]);

  // Filtered Delivery Boys for COD Collections Tab (Safe against undefined properties)
  const filteredCodDeliveryBoys = useMemo(() => {
    const list = codSummary?.deliveryBoys || codSummary?.deliveryBoySummary || [];
    if (!Array.isArray(list)) return [];
    const search = (codSearch || '').trim().toLowerCase();
    return list.filter((r: any) => {
      if (!r) return false;
      const runner = String(r.runnerName || r.deliveryBoyName || '').toLowerCase();
      const phone = String(r.contactPhone || r.deliveryBoyId || '').toLowerCase();
      const matchesSearch = !search || runner.includes(search) || phone.includes(search);
      const matchesStatus = codStatusFilter === 'ALL' || r.collectionStatus === codStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [codSummary, codSearch, codStatusFilter]);

  // Filtered Delivery Boys (Safe against undefined properties)
  const filteredDeliveryBoys = useMemo(() => {
    if (!Array.isArray(deliveryData)) return [];
    const search = (deliverySearch || '').trim().toLowerCase();
    return deliveryData.filter((d) => {
      if (!d) return false;
      const runner = String(d.runnerName || '').toLowerCase();
      const phone = String(d.contactPhone || '').toLowerCase();
      const matchesSearch =
        !search ||
        runner.includes(search) ||
        phone.includes(search);
      const matchesContract =
        deliveryContractFilter === 'ALL' || d.contractType === deliveryContractFilter;
      return matchesSearch && matchesContract;
    });
  }, [deliveryData, deliverySearch, deliveryContractFilter]);

  // Filtered Orders within Selected Provider Details
  const providerFilteredOrders = useMemo(() => {
    if (!selectedProvider || !Array.isArray(selectedProvider.orders)) return [];
    const search = (drillProviderSearch || '').trim().toLowerCase();
    return selectedProvider.orders.filter((ord: any) => {
      if (!ord) return false;
      const orderNum = String(ord.orderNumber || ord.id || '').toLowerCase();
      const student = String(ord.studentName || ord.customerName || '').toLowerCase();
      const product = String(ord.productService || '').toLowerCase();
      const matchesSearch = !search || orderNum.includes(search) || student.includes(search) || product.includes(search);
      const matchesPayment = drillPaymentFilter === 'ALL' || ord.paymentMode === drillPaymentFilter;
      const matchesStatus = drillStatusFilter === 'ALL' || ord.financialStatus === drillStatusFilter || ord.settlementStatus === drillStatusFilter;
      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [selectedProvider, drillProviderSearch, drillPaymentFilter, drillStatusFilter]);

  // Filtered Settlements for Selected Provider
  const providerSettlementHistory = useMemo(() => {
    if (!selectedProvider || !Array.isArray(historyData)) return [];
    const pid = selectedProvider.providerId;
    const pname = selectedProvider.providerName;
    return historyData.filter(
      (h) => (h.recipientId && h.recipientId === pid) || (h.recipientName && h.recipientName === pname)
    );
  }, [selectedProvider, historyData]);

  // Derived metrics for Selected Provider (11 metric cards)
  const providerMetrics = useMemo(() => {
    if (!selectedProvider) return null;
    const orders: any[] = selectedProvider.orders || [];
    const totalOrders = orders.length;
    const grossSales = orders.reduce((sum, o) => sum + (Number(o.orderAmount) || Number(o.totalAmount) || 0), 0);
    const providerPayable = Number(selectedProvider.totalPayable) || grossSales;
    const alreadySettled = Number(selectedProvider.settledAmount) || 0;
    const remainingPayable = Math.max(0, providerPayable - alreadySettled);

    const codOrders = orders.filter((o) => o.paymentMode === 'COD' || o.paymentMethod === 'CASH_ON_DELIVERY');
    const codOrdersCount = codOrders.length;
    const codValue = codOrders.reduce((sum, o) => sum + (Number(o.orderAmount) || Number(o.totalAmount) || 0), 0);

    const onlineOrders = orders.filter((o) => o.paymentMode !== 'COD' && o.paymentMethod !== 'CASH_ON_DELIVERY');
    const onlineOrdersCount = onlineOrders.length;
    const onlineValue = onlineOrders.reduce((sum, o) => sum + (Number(o.orderAmount) || Number(o.totalAmount) || 0), 0);

    const refundsCount = orders.filter((o) => o.refundStatus && o.refundStatus !== 'NOT_APPLICABLE').length;
    const refundsAmount = orders.filter((o) => o.refundStatus && o.refundStatus !== 'NOT_APPLICABLE')
      .reduce((sum, o) => sum + (Number(o.refundAmount) || 0), 0);

    return {
      totalOrders,
      grossSales,
      providerPayable,
      alreadySettled,
      remainingPayable,
      codOrdersCount,
      codValue,
      onlineOrdersCount,
      onlineValue,
      refundsCount,
      refundsAmount,
      adjustments: 0
    };
  }, [selectedProvider]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Financial Treasury &amp; Reconciliation
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Read-Only Reporting Layer</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                Centralized financial audit and reconciliation. Single Order Identity synchronized with ledger.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/payments"
            className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Payments &amp; Transactions</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
          </Link>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : 'text-gray-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-gray-300" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Read-Only Architecture Notice Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-slate-900">Source of Truth Separation:</strong> Finance Hub is a 100% read-only reporting and audit layer. All settlements, payout authorizations, COD collections, and status adjustments are strictly executed from{' '}
            <Link href="/admin/payments" className="font-bold text-indigo-600 hover:underline">
              Payments &rarr; Transactions
            </Link>.
          </div>
        </div>
        <Link
          href="/admin/payments"
          className="shrink-0 font-bold text-[11px] text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
        >
          <span>Open Transactions</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* High-Level Overview Cards (Separate Concepts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Concept 1: Provider Payable */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Provider Payables
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-950 font-mono">
              {formatCurrency(summary?.overall?.netProviderPayable)}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-gray-500">
              <span>Settled: <strong className="text-emerald-700 font-mono">{formatCurrency(summary?.overall?.providerSettled)}</strong></span>
              <span>Pending: <strong className="text-amber-700 font-mono">{formatCurrency(summary?.overall?.providerPending)}</strong></span>
            </div>
          </div>
        </div>

        {/* Concept 2: COD Collection */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              COD Collections
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-950 font-mono">
              {formatCurrency(summary?.overall?.totalCodExpected)}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-gray-500">
              <span>Collected: <strong className="text-emerald-700 font-mono">{formatCurrency(summary?.overall?.totalCodCollected)}</strong></span>
              <span>Pending: <strong className="text-rose-700 font-mono">{formatCurrency(summary?.overall?.totalCodPending)}</strong></span>
            </div>
          </div>
        </div>

        {/* Concept 3: Delivery Boy Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Delivery Partner Earnings
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {formatCurrency(summary?.overall?.totalDeliveryEarnings)}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-gray-500">
              <span>Settled: <strong className="text-blue-700 font-mono">{formatCurrency(summary?.overall?.totalDeliverySettled)}</strong></span>
              <span>Pending: <strong className="text-amber-700 font-mono">{formatCurrency(summary?.overall?.totalDeliveryPending)}</strong></span>
            </div>
          </div>
        </div>

        {/* Concept 4: Total Campus Volume */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs hover:border-purple-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Campus Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-950 font-mono">
              {formatCurrency(summary?.overall?.grossSales)}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-gray-500">
              <span>Today Volume: <strong className="text-gray-800 font-mono">{formatCurrency((summary?.today as any)?.todayGrossSales || (summary?.today as any)?.providerPayable)}</strong></span>
              <span>Orders: <strong className="text-purple-800">{formatNum(summary?.counts?.totalOrders)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Settlement Requests Notification Banner (Read-Only) */}
      {providerRequests.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {providerRequests.filter((r) => r.status === 'PENDING').length} Settlement Request(s) Awaiting Payout
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Providers have requested treasury disbursals. To review and approve payments, go to the Transactions module.
              </p>
            </div>
          </div>
          <Link
            href="/admin/payments"
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center gap-1.5"
          >
            <span>Review in Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PROVIDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'PROVIDERS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Provider Payables ({providersData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('COD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'COD'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>COD Collections ({codSummary?.counts?.totalOrders || codSummary?.detailedOrders?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('DELIVERY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'DELIVERY'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Delivery Partner Earnings ({deliveryData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Settlement History ({historyData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'REPORTS'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Financial Reports</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROVIDER PAYABLES SUMMARY (READ-ONLY)                               */}
      {/* ========================================================================= */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-6">
          {/* Provider Search and Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search provider name, category, or phone..."
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={providerStatusFilter}
                onChange={(e) => setProviderStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Settlement Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PARTIALLY_SETTLED">Partially Settled</option>
                <option value="SETTLED">Settled</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
          </div>

          {/* Provider Summary Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900">
                  Provider Payables Summary ({filteredProviders.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Institutional reconciliation of provider payables. All payouts are executed in Transactions.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                    <th className="py-3.5 px-4">Provider</th>
                    <th className="py-3.5 px-3">Category</th>
                    <th className="py-3.5 px-3 text-right">Orders</th>
                    <th className="py-3.5 px-3 text-right">Gross Sales</th>
                    <th className="py-3.5 px-3 text-right">Net Payable</th>
                    <th className="py-3.5 px-3 text-right">Settled</th>
                    <th className="py-3.5 px-3 text-right">Remaining</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProviders.length > 0 ? (
                    filteredProviders.map((p) => {
                      const remaining = Number(p.remainingAmount || 0);
                      return (
                        <tr key={p.providerId} className="hover:bg-blue-50/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{p.providerName}</div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                              {p.contactPhone || p.providerId}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {p.businessCategory}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-gray-700 font-mono">
                            {formatNum(p.ordersCount)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-gray-900 font-mono">
                            {formatCurrency(p.grossSales)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black text-indigo-900 font-mono">
                            {formatCurrency(p.totalPayable)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-emerald-700 font-mono">
                            {formatCurrency(p.settledAmount)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black font-mono">
                            <span className={remaining > 0 ? 'text-amber-800' : 'text-gray-400'}>
                              {formatCurrency(remaining)}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                p.settlementStatus === 'SETTLED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : p.settlementStatus === 'PARTIALLY_SETTLED'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {p.settlementStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedProvider(p)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                        No provider financial records found matching the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COD COLLECTIONS SUMMARY (READ-ONLY)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'COD' && (
        <div className="space-y-6">
          {/* Sub-view switcher */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setCodView('RUNNERS')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  codView === 'RUNNERS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By Delivery Partner ({filteredCodDeliveryBoys.length})
              </button>
              <button
                onClick={() => setCodView('ORDERS')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  codView === 'ORDERS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All COD Orders ({filteredCodOrders.length})
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order, customer, runner..."
                  value={codSearch}
                  onChange={(e) => setCodSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <select
                value={codStatusFilter}
                onChange={(e) => setCodStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="COLLECTED">Collected</option>
                <option value="PENDING">Pending</option>
                <option value="HANDED_OVER">Handed Over</option>
                <option value="RECONCILED">Reconciled</option>
                <option value="SHORTFALL">Shortfall</option>
              </select>
            </div>
          </div>

          {/* Delivery Boy COD Summary View */}
          {codView === 'RUNNERS' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    COD Collections By Delivery Partner ({filteredCodDeliveryBoys.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cash collection status by runner. Read-only audit overview.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                      <th className="py-3.5 px-4">Delivery Boy</th>
                      <th className="py-3.5 px-3 text-right">COD Orders</th>
                      <th className="py-3.5 px-3 text-right">COD Expected</th>
                      <th className="py-3.5 px-3 text-right">Cash Collected</th>
                      <th className="py-3.5 px-3 text-right">Pending</th>
                      <th className="py-3.5 px-3 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCodDeliveryBoys && filteredCodDeliveryBoys.length > 0 ? (
                      filteredCodDeliveryBoys.map((runner: any, idx: number) => {
                        const expected = Number(runner.expectedAmount || runner.codExpected || 0);
                        const collected = Number(runner.collectedAmount || runner.codCollected || 0);
                        const pending = Math.max(0, expected - collected);
                        const status = pending === 0 && expected > 0 ? 'COLLECTED' : (collected > 0 ? 'PARTIALLY_COLLECTED' : 'PENDING');
                        return (
                          <tr key={idx} className="hover:bg-amber-50/30 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-gray-900">{runner.runnerName || runner.deliveryBoyName || 'Campus Runner'}</div>
                              <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                {runner.contactPhone || runner.deliveryBoyId || 'ID Verified'}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-bold text-gray-700 font-mono">
                              {formatNum(runner.totalOrders || runner.codOrdersCount || 0)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-bold text-gray-900 font-mono">
                              {formatCurrency(expected)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-bold text-emerald-700 font-mono">
                              {formatCurrency(collected)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-black font-mono">
                              <span className={pending > 0 ? 'text-rose-700' : 'text-gray-400'}>
                                {formatCurrency(pending)}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                  status === 'COLLECTED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedRunnerCod(runner)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                          No delivery partner COD collections recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All COD Orders View */}
          {codView === 'ORDERS' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    COD Reconciliation Order Items ({filteredCodOrders.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Detailed per-order doorstep cash collection log.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-3">Date</th>
                      <th className="py-3.5 px-3">Customer</th>
                      <th className="py-3.5 px-3">Provider</th>
                      <th className="py-3.5 px-3">Runner</th>
                      <th className="py-3.5 px-3 text-right">COD Expected</th>
                      <th className="py-3.5 px-3 text-right">Cash Collected</th>
                      <th className="py-3.5 px-3 text-right">Shortfall</th>
                      <th className="py-3.5 px-3 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCodOrders.length > 0 ? (
                      filteredCodOrders.map((row: any) => {
                        const expected = Number(row.expectedAmount || row.totalAmount || 0);
                        const collected = Number(row.collectedAmount || 0);
                        const shortfall = Math.max(0, expected - collected);
                        return (
                          <tr key={row.id} className="hover:bg-amber-50/30 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                              {row.orderNumber}
                            </td>
                            <td className="py-3.5 px-3 text-gray-500">
                              {formatDateSafe(row.createdAt || row.date)}
                            </td>
                            <td className="py-3.5 px-3 font-medium text-gray-800">{safeText(row.customerName, 'Customer')}</td>
                            <td className="py-3.5 px-3 text-gray-600">{safeText(row.providerName, 'Provider')}</td>
                            <td className="py-3.5 px-3 font-medium text-gray-700">{safeText(row.runnerName, 'Unassigned')}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900">
                              {formatCurrency(expected)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">
                              {formatCurrency(collected)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-black">
                              {shortfall > 0 ? (
                                <span className="text-rose-600">-{formatCurrency(shortfall)}</span>
                              ) : (
                                <span className="text-gray-400">₹0.00</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                  row.collectionStatus === 'COLLECTED' || row.collectionStatus === 'RECONCILED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : row.collectionStatus === 'SHORTFALL'
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {row.collectionStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setDrilldownOrderId(row.orderId || row.id)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-[11px] transition cursor-pointer"
                              >
                                View Ledger
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-gray-400 text-xs">
                          No COD orders match the current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DELIVERY PARTNER EARNINGS SUMMARY (READ-ONLY)                        */}
      {/* ========================================================================= */}
      {activeTab === 'DELIVERY' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search runner name or phone..."
                value={deliverySearch}
                onChange={(e) => setDeliverySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={deliveryContractFilter}
                onChange={(e) => setDeliveryContractFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Contract Types</option>
                <option value="PER_ORDER">Per Order Runner</option>
                <option value="MONTHLY_CONTRACT">Monthly Contractual</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900">
                  Delivery Partner Earnings Summary ({filteredDeliveryBoys.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Institutional record of runner earnings. Payout disbursals are executed in Transactions.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                    <th className="py-3.5 px-4">Delivery Boy</th>
                    <th className="py-3.5 px-3 text-right">Orders</th>
                    <th className="py-3.5 px-3 text-right">Eligible Earnings</th>
                    <th className="py-3.5 px-3 text-right">Settled</th>
                    <th className="py-3.5 px-3 text-right">Remaining</th>
                    <th className="py-3.5 px-3">Contract Type</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDeliveryBoys.length > 0 ? (
                    filteredDeliveryBoys.map((d: any) => {
                      const remaining = Number(d.pendingEarnings || 0);
                      const status = d.contractType === 'MONTHLY_CONTRACT' ? 'N/A' : (remaining <= 0 && Number(d.eligibleEarnings) > 0 ? 'SETTLED' : (Number(d.settledEarnings) > 0 ? 'PARTIALLY_SETTLED' : 'PENDING'));
                      return (
                        <tr key={d.deliveryBoyId} className="hover:bg-emerald-50/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{d.runnerName}</div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                              {d.contactPhone || d.deliveryBoyId}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-gray-700 font-mono">
                            {formatNum(d.deliveredOrdersCount)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-gray-900 font-mono">
                            {formatCurrency(d.eligibleEarnings)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-emerald-700 font-mono">
                            {formatCurrency(d.settledEarnings)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black font-mono">
                            <span className={remaining > 0 ? 'text-amber-800' : 'text-gray-400'}>
                              {formatCurrency(remaining)}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {d.contractType === 'MONTHLY_CONTRACT' ? 'Monthly Contractual' : 'Per Order'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                status === 'SETTLED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : status === 'PARTIALLY_SETTLED'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : status === 'N/A'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedRunnerEarnings(d)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                        No delivery partner earnings records found matching the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SETTLEMENT HISTORY & TRANSACTION AUDIT LOG (READ-ONLY)              */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Filter By Recipient:</span>
              <select
                value={historyRecipientFilter}
                onChange={(e) => setHistoryRecipientFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Recipients</option>
                <option value="PROVIDER">Providers Only</option>
                <option value="DELIVERY_BOY">Delivery Runners Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Status:</span>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SETTLED">Settled</option>
                <option value="PARTIALLY_SETTLED">Partially Settled</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                    <th className="py-3.5 px-4">Settlement ID</th>
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3">Recipient</th>
                    <th className="py-3.5 px-3">Type</th>
                    <th className="py-3.5 px-3 text-right">Amount</th>
                    <th className="py-3.5 px-3">Mode</th>
                    <th className="py-3.5 px-3">Bank UTR / Reference</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-3">Admin Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyData.length > 0 ? (
                    historyData.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{h.id}</td>
                        <td className="py-3.5 px-3 text-gray-500">
                          {formatDateSafe(h.settledAt || h.createdAt)}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-gray-800">{h.recipientName}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              h.recipientType === 'PROVIDER'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {h.recipientType}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-800 text-sm">
                          {formatCurrency(h.amount)}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-semibold text-gray-700">{h.paymentMode || 'BANK_TRANSFER'}</td>
                        <td className="py-3.5 px-3 font-mono text-gray-600">
                          {h.utrReference || <span className="text-gray-400 italic">Direct Manual</span>}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {h.status || 'SETTLED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-gray-500 text-[11px] max-w-xs truncate">
                          {h.notes || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                        No settlement history records logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FINANCIAL REPORTS & EXPORTS (READ-ONLY)                            */}
      {/* ========================================================================= */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          {/* Multi-Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                Report Filters &amp; Reconciliation Range
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Filtered CSV</span>
                </button>
                <button
                  onClick={handleExportPdf}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-300" />
                  <span>Print PDF Report</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">From Date</label>
                <input
                  type="date"
                  value={reportDateFrom}
                  onChange={(e) => setReportDateFrom(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">To Date</label>
                <input
                  type="date"
                  value={reportDateTo}
                  onChange={(e) => setReportDateTo(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">Provider</label>
                <select
                  value={reportProviderFilter}
                  onChange={(e) => setReportProviderFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="ALL">All Providers</option>
                  {providersData.map((p) => (
                    <option key={p.providerId} value={p.providerId}>
                      {p.providerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">Settlement Status</label>
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PARTIALLY_SETTLED">Partially Settled</option>
                  <option value="SETTLED">Settled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filtered Dynamic Totals */}
          {reportsData?.totals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase">Filtered Gross Sales</div>
                <div className="text-xl font-black text-gray-900 font-mono mt-1">
                  {formatCurrency(reportsData.totals.grossSales)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-purple-600 uppercase">Filtered Orders Count</div>
                <div className="text-xl font-black text-purple-900 font-mono mt-1">
                  {formatNum(reportsData.orders?.length || 0)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-emerald-600 uppercase">Net Provider Payable</div>
                <div className="text-xl font-black text-emerald-900 font-mono mt-1">
                  {formatCurrency(reportsData.totals.netProviderPayable)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-amber-600 uppercase">Remaining Pending</div>
                <div className="text-xl font-black text-amber-900 font-mono mt-1">
                  {formatCurrency(reportsData.totals.providerPending)}
                </div>
              </div>
            </div>
          )}

          {/* Report Orders Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900">
                Reconciliation Order Items ({reportsData?.orders?.length || 0})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Provider</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3 text-right">Order Amount</th>
                    <th className="py-3 px-3 text-right">Net Payable</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportsData?.orders && reportsData.orders.length > 0 ? (
                    reportsData.orders.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setDrilldownOrderId(ord.id)}
                            className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>{ord.orderNumber}</span>
                            <ExternalLink className="w-3 h-3 text-blue-400" />
                          </button>
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {formatDateSafe(ord.createdAt)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-800">{safeText(ord.providerName, 'Provider')}</td>
                        <td className="py-3 px-3 text-gray-700">{safeText(ord.customerName, 'Customer')}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-600">{safeText(ord.paymentMethod, 'ONLINE')}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatCurrency(ord.providerPayable)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {ord.financialStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                        No orders found in the selected report criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* READ-ONLY DRILLDOWN MODAL 1: PROVIDER FINANCIAL DETAILS                   */}
      {/* ========================================================================= */}
      {selectedProvider && providerMetrics && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-gray-900">
                      {selectedProvider.providerName}
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {selectedProvider.businessCategory}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      READ-ONLY DETAILS
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">
                    Contact: {selectedProvider.contactPhone || 'N/A'} • Provider ID: {selectedProvider.providerId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/payments"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Go to Transactions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Institutional Read-Only Advisory */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>This breakdown is calculated directly from ledger transactions. All financial actions must be performed in Payments &rarr; Transactions.</span>
                </span>
                <span className="font-bold text-indigo-700 font-mono">
                  Status: {selectedProvider.settlementStatus}
                </span>
              </div>

              {/* 11 Summary Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Total Orders</div>
                  <div className="text-base font-black text-gray-900 font-mono mt-1">
                    {formatNum(providerMetrics.totalOrders)}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Gross Sales</div>
                  <div className="text-base font-black text-gray-900 font-mono mt-1">
                    {formatCurrency(providerMetrics.grossSales)}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase">Provider Payable</div>
                  <div className="text-base font-black text-indigo-950 font-mono mt-1">
                    {formatCurrency(providerMetrics.providerPayable)}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Already Settled</div>
                  <div className="text-base font-black text-emerald-800 font-mono mt-1">
                    {formatCurrency(providerMetrics.alreadySettled)}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <div className="text-[10px] font-bold text-amber-600 uppercase">Remaining Payable</div>
                  <div className="text-base font-black text-amber-900 font-mono mt-1">
                    {formatCurrency(providerMetrics.remainingPayable)}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">COD Orders</div>
                  <div className="text-base font-black text-gray-800 font-mono mt-1">
                    {formatNum(providerMetrics.codOrdersCount)} ({formatCurrency(providerMetrics.codValue)})
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Online Orders</div>
                  <div className="text-base font-black text-gray-800 font-mono mt-1">
                    {formatNum(providerMetrics.onlineOrdersCount)} ({formatCurrency(providerMetrics.onlineValue)})
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Refunds</div>
                  <div className="text-base font-black text-gray-800 font-mono mt-1">
                    {formatNum(providerMetrics.refundsCount)} ({formatCurrency(providerMetrics.refundsAmount)})
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Adjustments</div>
                  <div className="text-base font-black text-gray-800 font-mono mt-1">
                    {formatCurrency(providerMetrics.adjustments)}
                  </div>
                </div>
              </div>

              {/* Order Breakdown Section */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Provider Original Order Breakdown ({providerFilteredOrders.length})
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Real-time synchronized order items for this provider.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Search order #, student..."
                      value={drillProviderSearch}
                      onChange={(e) => setDrillProviderSearch(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none w-44"
                    />
                    <select
                      value={drillPaymentFilter}
                      onChange={(e) => setDrillPaymentFilter(e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                    >
                      <option value="ALL">All Modes</option>
                      <option value="COD">COD</option>
                      <option value="ONLINE">Online</option>
                    </select>
                    <select
                      value={drillStatusFilter}
                      onChange={(e) => setDrillStatusFilter(e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                    >
                      <option value="ALL">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="PARTIALLY_SETTLED">Partially Settled</option>
                      <option value="SETTLED">Settled</option>
                    </select>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400">
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-2">Date</th>
                        <th className="py-2.5 px-2">Student</th>
                        <th className="py-2.5 px-2">Product</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-2 text-right">Order Amount</th>
                        <th className="py-2.5 px-2">Mode</th>
                        <th className="py-2.5 px-2">Delivery Boy</th>
                        <th className="py-2.5 px-2 text-right">Provider Payable</th>
                        <th className="py-2.5 px-2 text-right">Settled</th>
                        <th className="py-2.5 px-2 text-right">Remaining</th>
                        <th className="py-2.5 px-2 text-center">Settlement Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {providerFilteredOrders.length > 0 ? (
                        providerFilteredOrders.map((ord: any) => {
                          const orderAmt = Number(ord.orderAmount || ord.totalAmount || 0);
                          const payable = Number(ord.providerPayable !== undefined ? ord.providerPayable : orderAmt);
                          const settled = Number(ord.settledAmount || ord.providerSettledAmount || 0);
                          const remaining = Math.max(0, payable - settled);
                          return (
                            <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                              <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                                {ord.orderNumber}
                              </td>
                              <td className="py-2.5 px-2 text-gray-500 whitespace-nowrap">
                                {formatDateSafe(ord.createdAt || ord.orderDate)}
                              </td>
                              <td className="py-2.5 px-2 font-medium text-gray-800 truncate max-w-[100px]">
                                {safeText(ord.studentName || ord.customerName || ord.student, 'Student')}
                              </td>
                              <td className="py-2.5 px-2 text-gray-700 truncate max-w-[130px]">
                                {safeText(ord.productService || ord.product, 'Products')}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono">
                                {ord.quantity || 1}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-gray-900">
                                {formatCurrency(orderAmt)}
                              </td>
                              <td className="py-2.5 px-2 font-mono text-[10px] text-gray-600">
                                {safeText(ord.paymentMode, 'ONLINE')}
                              </td>
                              <td className="py-2.5 px-2 text-gray-600 truncate max-w-[90px]">
                                {safeText(ord.deliveryBoy || ord.deliveryBoyName, 'Unassigned')}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-800">
                                {formatCurrency(payable)}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-emerald-700">
                                {formatCurrency(settled)}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-black text-amber-800">
                                {formatCurrency(remaining)}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                                  {ord.settlementStatus || ord.financialStatus || 'PENDING'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => setDrilldownOrderId(ord.id)}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-bold text-[10px]"
                                >
                                  View Ledger
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={13} className="py-8 text-center text-gray-400">
                            No orders found matching the drilldown filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Related Settlement History for this Provider */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Provider Historical Disbursals ({providerSettlementHistory.length})
                </h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3">Mode</th>
                        <th className="py-2 px-3">UTR Reference</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {providerSettlementHistory.length > 0 ? (
                        providerSettlementHistory.map((h: any) => (
                          <tr key={h.id}>
                            <td className="py-2.5 px-3 text-gray-500 font-mono">
                              {formatDateSafe(h.settledAt || h.createdAt)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                              {formatCurrency(h.amount)}
                            </td>
                            <td className="py-2.5 px-3 font-mono">{h.paymentMode || 'BANK_TRANSFER'}</td>
                            <td className="py-2.5 px-3 font-mono text-gray-600">{h.utrReference || 'Direct'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {h.status || 'SETTLED'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-gray-500 text-[11px] truncate max-w-xs">
                              {h.notes || '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-gray-400">
                            No settlement disbursements logged yet for this provider.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                To create a payout or modify status, go to <strong>Payments &rarr; Transactions</strong>.
              </span>
              <button
                onClick={() => setSelectedProvider(null)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* READ-ONLY DRILLDOWN MODAL 2: DELIVERY BOY COD DETAILS                      */}
      {/* ========================================================================= */}
      {selectedRunnerCod && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900">
                      Delivery Partner COD Details
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      READ-ONLY
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Runner: <strong>{selectedRunnerCod.runnerName || selectedRunnerCod.deliveryBoyName}</strong> • Phone: {selectedRunnerCod.contactPhone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/payments"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Adjust in Transactions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setSelectedRunnerCod(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">COD Orders</div>
                  <div className="text-base font-black text-gray-900 font-mono mt-1">
                    {formatNum(selectedRunnerCod.totalOrders || selectedRunnerCod.codOrdersCount || selectedRunnerCod.orders?.length || 0)}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">COD Expected</div>
                  <div className="text-base font-black text-gray-900 font-mono mt-1">
                    {formatCurrency(selectedRunnerCod.expectedAmount || selectedRunnerCod.codExpected || 0)}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Cash Collected</div>
                  <div className="text-base font-black text-emerald-800 font-mono mt-1">
                    {formatCurrency(selectedRunnerCod.collectedAmount || selectedRunnerCod.codCollected || 0)}
                  </div>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Pending / Shortfall</div>
                  <div className="text-base font-black text-rose-900 font-mono mt-1">
                    {formatCurrency(Math.max(0, (Number(selectedRunnerCod.expectedAmount || selectedRunnerCod.codExpected || 0) - Number(selectedRunnerCod.collectedAmount || selectedRunnerCod.codCollected || 0))))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">Collection Rate</div>
                  <div className="text-base font-black text-blue-900 font-mono mt-1">
                    {Number(selectedRunnerCod.expectedAmount || selectedRunnerCod.codExpected || 0) > 0
                      ? `${Math.round((Number(selectedRunnerCod.collectedAmount || selectedRunnerCod.codCollected || 0) / Number(selectedRunnerCod.expectedAmount || selectedRunnerCod.codExpected || 1)) * 100)}%`
                      : '100%'}
                  </div>
                </div>
              </div>

              {/* Cash Collections Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Cash Collections By Runner
                </h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400">
                        <th className="py-2 px-3">Order ID</th>
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-2">Customer</th>
                        <th className="py-2 px-2">Provider</th>
                        <th className="py-2 px-2 text-right">Order Amount</th>
                        <th className="py-2 px-2 text-right">COD Expected</th>
                        <th className="py-2 px-2 text-right">Cash Collected</th>
                        <th className="py-2 px-2 text-center">Status</th>
                        <th className="py-2 px-2 text-center">OTP Verified</th>
                        <th className="py-2 px-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedRunnerCod.orders && selectedRunnerCod.orders.length > 0 ? (
                        selectedRunnerCod.orders.map((ord: any) => (
                          <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                              {ord.orderNumber}
                            </td>
                            <td className="py-2.5 px-2 text-gray-500">
                              {formatDateSafe(ord.createdAt || ord.date)}
                            </td>
                            <td className="py-2.5 px-2 text-gray-700">{safeText(ord.customerName || ord.student, 'Student')}</td>
                            <td className="py-2.5 px-2 text-gray-600">{safeText(ord.providerName || ord.provider, 'Vendor')}</td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-gray-900">
                              {formatCurrency(ord.totalAmount || ord.orderAmount)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-gray-800">
                              {formatCurrency(ord.codExpected || ord.expectedAmount || ord.totalAmount)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-700">
                              {formatCurrency(ord.codCollected || ord.collectedAmount || 0)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {ord.collectionStatus || ord.codStatus || 'COLLECTED'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {ord.otpVerified || ord.deliveryOtpVerified ? 'YES' : 'PENDING'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => setDrilldownOrderId(ord.id || ord.orderId)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]"
                              >
                                View Ledger
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-gray-400">
                            No individual COD order rows linked to this summary view.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedRunnerCod(null)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* READ-ONLY DRILLDOWN MODAL 3: DELIVERY BOY EARNINGS DETAILS                */}
      {/* ========================================================================= */}
      {selectedRunnerEarnings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900">
                      Delivery Boy Financial Details
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      READ-ONLY
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Runner: <strong>{selectedRunnerEarnings.runnerName}</strong> • Phone: {selectedRunnerEarnings.contactPhone || 'N/A'} • Contract: {selectedRunnerEarnings.contractType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/payments"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Settle in Transactions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setSelectedRunnerEarnings(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Total Eligible</div>
                  <div className="text-base font-black text-gray-900 font-mono mt-1">
                    {formatCurrency(selectedRunnerEarnings.eligibleEarnings)}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Already Settled</div>
                  <div className="text-base font-black text-emerald-800 font-mono mt-1">
                    {formatCurrency(selectedRunnerEarnings.settledEarnings)}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Remaining</div>
                  <div className="text-base font-black text-amber-900 font-mono mt-1">
                    {formatCurrency(selectedRunnerEarnings.pendingEarnings)}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Delivered Orders</div>
                  <div className="text-base font-black text-gray-900 font-mono mt-1">
                    {formatNum(selectedRunnerEarnings.deliveredOrdersCount)}
                  </div>
                </div>
              </div>

              {/* Delivered Orders Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Delivered Orders Breakdown
                </h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400">
                        <th className="py-2 px-3">Order ID</th>
                        <th className="py-2 px-2">Delivered Date</th>
                        <th className="py-2 px-2 text-center">OTP Verified</th>
                        <th className="py-2 px-2 text-right">COD Collected</th>
                        <th className="py-2 px-2 text-right">Earning Credit</th>
                        <th className="py-2 px-2 text-center">Settlement Status</th>
                        <th className="py-2 px-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedRunnerEarnings.orders && selectedRunnerEarnings.orders.length > 0 ? (
                        selectedRunnerEarnings.orders.map((ord: any) => (
                          <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                              {ord.orderNumber}
                            </td>
                            <td className="py-2.5 px-2 text-gray-500">
                              {formatDateSafe(ord.deliveredAt || ord.createdAt)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                OTP Verified
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-gray-700">
                              {ord.codCollected ? formatCurrency(ord.codCollected) : '₹0.00'}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-700">
                              {formatCurrency(ord.earningAmount || 10)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {ord.settlementStatus || 'PENDING'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => setDrilldownOrderId(ord.id)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]"
                              >
                                View Ledger
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            No individual delivered orders linked to this summary view.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedRunnerEarnings(null)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REUSABLE SINGLE ORDER FINANCIAL DETAILS MODAL (READ-ONLY)                 */}
      {/* ========================================================================= */}
      <OrderFinancialDetailsModal
        orderId={drilldownOrderId}
        isOpen={Boolean(drilldownOrderId)}
        onClose={() => setDrilldownOrderId(null)}
      />
    </div>
  );
}
