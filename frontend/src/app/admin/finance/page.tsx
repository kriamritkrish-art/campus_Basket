'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/api';
import OrderFinancialDetailsModal from '@/components/common/OrderFinancialDetailsModal';
import {
  IndianRupee,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  Landmark,
  Smartphone,
  ChevronRight,
  X,
  ExternalLink,
  Store,
  Bike,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Briefcase
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
    campusCommission: number;
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
  const [selectedProviderOrders, setSelectedProviderOrders] = useState<{
    providerName: string;
    orders: any[];
  } | null>(null);
  const [manageStatusModal, setManageStatusModal] = useState<{
    providerId: string;
    providerName: string;
    currentStatus: string;
    remainingAmount: number;
  } | null>(null);
  const [newStatus, setNewStatus] = useState('APPROVED');
  const [statusNote, setStatusNote] = useState('');
  const [statusConfirmedAmount, setStatusConfirmedAmount] = useState<number | ''>('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Partial Settlement Modal
  const [partialSettleModal, setPartialSettleModal] = useState<{
    providerId: string;
    providerName: string;
    totalPayable: number;
    settledAmount: number;
    remainingAmount: number;
  } | null>(null);
  const [partialAmount, setPartialAmount] = useState<number | ''>('');
  const [partialPaymentMode, setPartialPaymentMode] = useState('UPI');
  const [partialUtr, setPartialUtr] = useState('');
  const [partialNotes, setPartialNotes] = useState('');
  const [submittingPartial, setSubmittingPartial] = useState(false);

  // Tab 2: COD
  const [codSummary, setCodSummary] = useState<any>(null);
  const [codView, setCodView] = useState<'ORDERS' | 'PROVIDERS' | 'RUNNERS'>('ORDERS');
  const [codSearch, setCodSearch] = useState('');
  const [codStatusFilter, setCodStatusFilter] = useState('ALL');
  const [manageCodModal, setManageCodModal] = useState<{
    collectionId: string;
    orderId: string;
    orderNumber: string;
    expectedAmount: number;
    currentCollected: number;
    currentStatus: string;
  } | null>(null);
  const [newCodStatus, setNewCodStatus] = useState('COLLECTED');
  const [newCodAmount, setNewCodAmount] = useState<number | ''>('');
  const [codAdjustmentReason, setCodAdjustmentReason] = useState('');
  const [submittingCodStatus, setSubmittingCodStatus] = useState(false);

  // Tab 3: Delivery Earnings
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [deliverySearch, setDeliverySearch] = useState('');
  const [deliveryContractFilter, setDeliveryContractFilter] = useState('ALL');
  const [settleRunnerModal, setSettleRunnerModal] = useState<{
    deliveryBoyId: string;
    runnerName: string;
    pendingEarnings: number;
  } | null>(null);
  const [runnerSettleAmount, setRunnerSettleAmount] = useState<number | ''>('');
  const [runnerPaymentMode, setRunnerPaymentMode] = useState('UPI');
  const [runnerUtr, setRunnerUtr] = useState('');
  const [runnerNotes, setRunnerNotes] = useState('');
  const [submittingRunnerSettle, setSubmittingRunnerSettle] = useState(false);
  const [selectedRunnerOrders, setSelectedRunnerOrders] = useState<{
    runnerName: string;
    orders: any[];
  } | null>(null);

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
            settlementStatus: p.settlementStatus || 'PENDING'
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
        setCodSummary(res.data || res);
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

  // Initial and reactive loads
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

  useEffect(() => {
    loadAll();
  }, []);

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

  useEffect(() => {
    if (activeTab === 'HISTORY') fetchHistory();
  }, [historyRecipientFilter, historyStatusFilter]);

  useEffect(() => {
    if (activeTab === 'REPORTS') fetchReports();
  }, [reportDateFrom, reportDateTo, reportProviderFilter, reportStatusFilter]);

  // Provider Status Update Action
  const submitProviderStatusUpdate = async () => {
    if (!manageStatusModal) return;
    setSubmittingStatus(true);
    try {
      const res = await apiRequest('/api/admin/finance/providers/status', {
        method: 'POST',
        body: JSON.stringify({
          providerId: manageStatusModal.providerId,
          status: newStatus,
          notes: statusNote,
          confirmedAmount: statusConfirmedAmount !== '' ? Number(statusConfirmedAmount) : undefined
        })
      });
      if (res?.success) {
        setManageStatusModal(null);
        setStatusNote('');
        setStatusConfirmedAmount('');
        await Promise.all([fetchSummary(), fetchProviders()]);
      } else {
        alert(res?.message || 'Failed to update provider status');
      }
    } catch (err: any) {
      alert(err?.message || 'Error executing status update');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Provider Partial Settlement Action
  const submitPartialSettlement = async () => {
    if (!partialSettleModal || !partialAmount || Number(partialAmount) <= 0) {
      alert('Please enter a valid partial settlement amount');
      return;
    }
    setSubmittingPartial(true);
    try {
      const res = await apiRequest('/api/admin/finance/providers/status', {
        method: 'POST',
        body: JSON.stringify({
          providerId: partialSettleModal.providerId,
          status: 'PARTIALLY_SETTLED',
          settlementAmount: Number(partialAmount),
          paymentMode: partialPaymentMode,
          utrReference: partialUtr,
          notes: partialNotes
        })
      });
      if (res?.success) {
        setPartialSettleModal(null);
        setPartialAmount('');
        setPartialUtr('');
        setPartialNotes('');
        await Promise.all([fetchSummary(), fetchProviders(), fetchHistory()]);
      } else {
        alert(res?.message || 'Failed to execute partial settlement');
      }
    } catch (err: any) {
      alert(err?.message || 'Error executing settlement');
    } finally {
      setSubmittingPartial(false);
    }
  };

  // Handle Provider Settlement Request (Approve/Reject)
  const handleSettlementRequestAction = async (
    requestId: string,
    action: 'APPROVE' | 'REJECT'
  ) => {
    const adminNotes = prompt(`Enter ${action.toLowerCase()} note (optional):`) || '';
    let utrReference = '';
    if (action === 'APPROVE') {
      utrReference = prompt('Enter Bank UTR / Transaction Reference (optional):') || '';
    }
    try {
      const res = await apiRequest('/api/admin/finance/provider-requests/handle', {
        method: 'POST',
        body: JSON.stringify({
          requestId,
          action,
          adminNotes,
          utrReference
        })
      });
      if (res?.success) {
        await Promise.all([fetchSummary(), fetchProviders(), fetchHistory()]);
      } else {
        alert(res?.message || 'Failed to handle request');
      }
    } catch (err: any) {
      alert(err?.message || 'Error processing request');
    }
  };

  // COD Status Update Action (with Strict Amount Safety)
  const submitCodStatusUpdate = async () => {
    if (!manageCodModal) return;
    setSubmittingCodStatus(true);
    try {
      const res = await apiRequest('/api/admin/finance/cod/status', {
        method: 'POST',
        body: JSON.stringify({
          collectionId: manageCodModal.collectionId,
          status: newCodStatus,
          collectedAmount: newCodAmount !== '' ? Number(newCodAmount) : undefined,
          adjustmentReason: codAdjustmentReason
        })
      });
      if (res?.success) {
        setManageCodModal(null);
        setNewCodAmount('');
        setCodAdjustmentReason('');
        await Promise.all([fetchSummary(), fetchCod()]);
      } else {
        alert(res?.message || 'Failed to update COD status');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating COD status');
    } finally {
      setSubmittingCodStatus(false);
    }
  };

  // Delivery Runner Earnings Settlement Action
  const submitRunnerSettlement = async () => {
    if (!settleRunnerModal || !runnerSettleAmount || Number(runnerSettleAmount) <= 0) {
      alert('Please enter a valid payout amount');
      return;
    }
    setSubmittingRunnerSettle(true);
    try {
      const res = await apiRequest('/api/admin/finance/delivery-earnings/settle', {
        method: 'POST',
        body: JSON.stringify({
          deliveryBoyId: settleRunnerModal.deliveryBoyId,
          amount: Number(runnerSettleAmount),
          paymentMode: runnerPaymentMode,
          utrReference: runnerUtr,
          notes: runnerNotes
        })
      });
      if (res?.success) {
        setSettleRunnerModal(null);
        setRunnerSettleAmount('');
        setRunnerUtr('');
        setRunnerNotes('');
        await Promise.all([fetchSummary(), fetchDelivery(), fetchHistory()]);
      } else {
        alert(res?.message || 'Failed to settle runner earnings');
      }
    } catch (err: any) {
      alert(err?.message || 'Error executing runner settlement');
    } finally {
      setSubmittingRunnerSettle(false);
    }
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

  // Export PDF / Print
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
                  Financial Treasury &amp; Settlements
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Single Order Identity Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                Centralized reconciliation for Provider Payables, COD Remittance, and Delivery Partner Disbursements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : 'text-gray-500'}`} />
            <span>Refresh Treasury</span>
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
            <span>Print Report</span>
          </button>
        </div>
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
              ₹{Number(summary?.overall?.netProviderPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-gray-500">
              <span>Settled: <strong className="text-emerald-700 font-mono">₹{Number(summary?.overall?.providerSettled || 0).toFixed(0)}</strong></span>
              <span>Pending: <strong className="text-amber-700 font-mono">₹{Number(summary?.overall?.providerPending || 0).toFixed(0)}</strong></span>
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
              ₹{Number(summary?.overall?.totalCodExpected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-gray-500">
              <span>Collected: <strong className="text-emerald-700 font-mono">₹{Number(summary?.overall?.totalCodCollected || 0).toFixed(0)}</strong></span>
              <span>Shortfall: <strong className="text-rose-700 font-mono">₹{Number(summary?.overall?.totalCodPending || 0).toFixed(0)}</strong></span>
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
              ₹{Number(summary?.overall?.totalDeliveryEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-gray-500">
              <span>Settled: <strong className="text-blue-700 font-mono">₹{Number(summary?.overall?.totalDeliverySettled || 0).toFixed(0)}</strong></span>
              <span>Pending: <strong className="text-amber-700 font-mono">₹{Number(summary?.overall?.totalDeliveryPending || 0).toFixed(0)}</strong></span>
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
              ₹{Number(summary?.overall?.grossSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-gray-500">
              <span>Today Volume: <strong className="text-gray-800 font-mono">₹{Number(summary?.today?.todayGrossSales || 0).toFixed(0)}</strong></span>
              <span>Orders: <strong className="text-purple-800">{summary?.counts?.totalOrders || 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Settlement Requests Alert Banner */}
      {providerRequests.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Action Required: Provider Settlement Requests
              </div>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                There are <strong>{providerRequests.filter((r) => r.status === 'PENDING').length} pending payout request(s)</strong> submitted by campus providers awaiting approval.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('PROVIDERS')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap self-start sm:self-center cursor-pointer shadow-xs"
          >
            Review Requests Below
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('PROVIDERS')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'PROVIDERS'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Provider Payables</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-mono">
            {providersData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COD')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'COD'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>COD Collections</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 font-mono">
            {codSummary?.detailedOrders?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DELIVERY')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'DELIVERY'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Delivery Partner Earnings</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-mono">
            {deliveryData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Settlement History</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 font-mono">
            {historyData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'REPORTS'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Financial Reports</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROVIDER PAYABLES & REQUESTS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-6">
          {/* Provider Settlement Requests Section (if any) */}
          {providerRequests.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Incoming Provider Settlement Requests ({providerRequests.filter((r) => r.status === 'PENDING').length} Pending)
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] font-black uppercase text-gray-400">
                      <th className="py-2.5 px-3">Request ID</th>
                      <th className="py-2.5 px-3">Provider</th>
                      <th className="py-2.5 px-3">Requested At</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {providerRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">{req.id}</td>
                        <td className="py-3 px-3 font-semibold text-gray-800">{req.providerName}</td>
                        <td className="py-3 px-3 text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-800 font-mono text-sm">
                          ₹{Number(req.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-[11px]">
                          {req.settlementAccount?.accountType === 'UPI' ? (
                            <span>UPI: {req.settlementAccount?.upiId}</span>
                          ) : (
                            <span>{req.settlementAccount?.bankName} ({req.settlementAccount?.accountNumber})</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSettlementRequestAction(req.id, 'APPROVE')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shadow-xs cursor-pointer"
                              >
                                Approve Payout
                              </button>
                              <button
                                onClick={() => handleSettlementRequestAction(req.id, 'REJECT')}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 font-bold rounded-lg text-[11px] transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-mono">
                              {req.utrReference || 'Processed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Provider Search and Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search provider name or phone..."
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
                <option value="ALL">All Financial Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PARTIALLY_SETTLED">Partially Settled</option>
                <option value="SETTLED">Settled</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="REJECTED">Rejected</option>
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
                  Financial state across registered campus providers. Zero duplicate orders created.
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
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProviders.length > 0 ? (
                    filteredProviders.map((p) => {
                      const remaining = Number(p.remainingAmount || 0);
                      const isFullySettled = remaining <= 0 && Number(p.totalPayable) > 0;
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
                            {p.ordersCount}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-gray-900 font-mono">
                            ₹{Number(p.grossSales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black text-indigo-900 font-mono">
                            ₹{Number(p.totalPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-emerald-700 font-mono">
                            ₹{Number(p.settledAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black font-mono">
                            <span className={remaining > 0 ? 'text-amber-800' : 'text-gray-400'}>
                              ₹{remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                p.settlementStatus === 'SETTLED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : p.settlementStatus === 'PARTIALLY_SETTLED'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : p.settlementStatus === 'APPROVED'
                                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                  : p.settlementStatus === 'ON_HOLD'
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : p.settlementStatus === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {p.settlementStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Direct Partial Settlement Button */}
                              {remaining > 0 && (
                                <button
                                  onClick={() => {
                                    setPartialSettleModal({
                                      providerId: p.providerId,
                                      providerName: p.providerName,
                                      totalPayable: Number(p.totalPayable),
                                      settledAmount: Number(p.settledAmount),
                                      remainingAmount: remaining
                                    });
                                    setPartialAmount(remaining);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <Wallet className="w-3 h-3" />
                                  <span>Settle</span>
                                </button>
                              )}

                              {/* Manage Status Button */}
                              <button
                                onClick={() => {
                                  setManageStatusModal({
                                    providerId: p.providerId,
                                    providerName: p.providerName,
                                    currentStatus: p.settlementStatus,
                                    remainingAmount: remaining
                                  });
                                  setNewStatus(p.settlementStatus);
                                }}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                              >
                                <Sliders className="w-3 h-3 text-gray-500" />
                                <span>Status</span>
                              </button>

                              {/* Drilldown View Orders */}
                              <button
                                onClick={() => {
                                  setSelectedProviderOrders({
                                    providerName: p.providerName,
                                    orders: p.orders || []
                                  });
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Orders</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-400">
                        No provider financial records found matching your filters.
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
      {/* TAB 2: COD COLLECTIONS & RECONCILIATION                                   */}
      {/* ========================================================================= */}
      {activeTab === 'COD' && (
        <div className="space-y-6">
          {/* Sub-view switcher */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setCodView('ORDERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  codView === 'ORDERS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Order-Wise COD List
              </button>
              <button
                onClick={() => setCodView('PROVIDERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  codView === 'PROVIDERS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Provider-Wise COD Summary
              </button>
              <button
                onClick={() => setCodView('RUNNERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  codView === 'RUNNERS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Delivery Boy COD Collections
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order, customer, provider..."
                  value={codSearch}
                  onChange={(e) => setCodSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <select
                value={codStatusFilter}
                onChange={(e) => setCodStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none"
              >
                <option value="ALL">All COD Statuses</option>
                <option value="PENDING">Pending Collection</option>
                <option value="COLLECTED">Collected</option>
                <option value="HANDED_OVER">Handed Over</option>
                <option value="RECONCILED">Reconciled</option>
                <option value="SHORTFALL">Shortfall</option>
              </select>
            </div>
          </div>

          {/* Sub-view: Detailed Orders */}
          {codView === 'ORDERS' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-3">Customer</th>
                      <th className="py-3.5 px-3">Provider</th>
                      <th className="py-3.5 px-3">Delivery Runner</th>
                      <th className="py-3.5 px-3 text-right">Expected COD</th>
                      <th className="py-3.5 px-3 text-right">Collected</th>
                      <th className="py-3.5 px-3 text-right">Shortfall</th>
                      <th className="py-3.5 px-3 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCodOrders.length > 0 ? (
                      filteredCodOrders.map((row: any) => {
                        const expected = Number(row.expectedAmount || 0);
                        const collected = Number(row.collectedAmount || 0);
                        const shortfall = Math.max(0, expected - collected);
                        return (
                          <tr key={row.id} className="hover:bg-amber-50/30 transition">
                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => setDrilldownOrderId(row.orderId)}
                                className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>{row.orderNumber}</span>
                                <ExternalLink className="w-3 h-3 text-blue-400" />
                              </button>
                            </td>
                            <td className="py-3.5 px-3 font-medium text-gray-800">
                              {row.customerName}
                            </td>
                            <td className="py-3.5 px-3 text-gray-600 font-semibold">
                              {row.providerName}
                            </td>
                            <td className="py-3.5 px-3 text-gray-700">
                              {row.runnerName || (
                                <span className="text-gray-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900">
                              ₹{expected.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">
                              ₹{collected.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold">
                              {shortfall > 0 ? (
                                <span className="text-rose-600">-₹{shortfall.toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-400">₹0.00</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                  row.collectionStatus === 'COLLECTED' || row.collectionStatus === 'RECONCILED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : row.collectionStatus === 'HANDED_OVER'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
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
                                onClick={() => {
                                  setManageCodModal({
                                    collectionId: row.id,
                                    orderId: row.orderId,
                                    orderNumber: row.orderNumber,
                                    expectedAmount: expected,
                                    currentCollected: collected,
                                    currentStatus: row.collectionStatus
                                  });
                                  setNewCodStatus(row.collectionStatus);
                                  setNewCodAmount(collected);
                                }}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                              >
                                <Sliders className="w-3 h-3" />
                                <span>Reconcile</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-400">
                          No COD transactions matching the criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view: Provider-Wise COD */}
          {codView === 'PROVIDERS' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                      <th className="py-3.5 px-4">Provider</th>
                      <th className="py-3.5 px-3 text-right">COD Orders</th>
                      <th className="py-3.5 px-3 text-right">Expected COD</th>
                      <th className="py-3.5 px-3 text-right">Collected COD</th>
                      <th className="py-3.5 px-3 text-right">Pending / Shortfall</th>
                      <th className="py-3.5 px-3 text-center">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {codSummary?.providerWise && codSummary.providerWise.length > 0 ? (
                      codSummary.providerWise.map((item: any, idx: number) => {
                        const expected = Number(item.expectedAmount || 0);
                        const collected = Number(item.collectedAmount || 0);
                        const pending = Number(item.pendingAmount || 0);
                        const rate = expected > 0 ? Math.round((collected / expected) * 100) : 100;
                        return (
                          <tr key={idx} className="hover:bg-gray-50/80 transition">
                            <td className="py-3.5 px-4 font-bold text-gray-900">{item.providerName}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-700">{item.ordersCount}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900">₹{expected.toFixed(2)}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">₹{collected.toFixed(2)}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-800">₹{pending.toFixed(2)}</td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="font-mono font-bold text-xs text-blue-700">{rate}%</span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          No provider COD records available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view: Runner-Wise COD */}
          {codView === 'RUNNERS' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                      <th className="py-3.5 px-4">Delivery Runner</th>
                      <th className="py-3.5 px-3">Contact</th>
                      <th className="py-3.5 px-3 text-right">Assigned COD Orders</th>
                      <th className="py-3.5 px-3 text-right">Expected Collection</th>
                      <th className="py-3.5 px-3 text-right">Cash Collected</th>
                      <th className="py-3.5 px-3 text-right">Pending Handover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {codSummary?.runnerWise && codSummary.runnerWise.length > 0 ? (
                      codSummary.runnerWise.map((item: any, idx: number) => {
                        const expected = Number(item.expectedAmount || 0);
                        const collected = Number(item.collectedAmount || 0);
                        const pending = Number(item.pendingHandover || 0);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/80 transition">
                            <td className="py-3.5 px-4 font-bold text-gray-900">{item.runnerName}</td>
                            <td className="py-3.5 px-3 font-mono text-gray-500">{item.contactPhone || '—'}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-700">{item.ordersCount}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900">₹{expected.toFixed(2)}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">₹{collected.toFixed(2)}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-800">₹{pending.toFixed(2)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          No delivery runner COD records available.
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
      {/* TAB 3: DELIVERY PARTNER EARNINGS & CONTRACT BADGES                        */}
      {/* ========================================================================= */}
      {activeTab === 'DELIVERY' && (
        <div className="space-y-6">
          {/* Runner Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search delivery runner name or phone..."
                value={deliverySearch}
                onChange={(e) => setDeliverySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={deliveryContractFilter}
                onChange={(e) => setDeliveryContractFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Contract Types</option>
                <option value="PER_DELIVERY">Per Delivery Runners</option>
                <option value="MONTHLY_CONTRACT">Monthly Contract Partners</option>
              </select>
            </div>
          </div>

          {/* Delivery Runner Summary Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900">
                  Delivery Partner Earnings Summary ({filteredDeliveryBoys.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Distinguishes per-delivery incentives vs. fixed institutional staff. Deliveries require 6-digit OTP.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500">
                    <th className="py-3.5 px-4">Runner Name</th>
                    <th className="py-3.5 px-3">Contract Type</th>
                    <th className="py-3.5 px-3 text-right">Deliveries (OTP)</th>
                    <th className="py-3.5 px-3 text-right">Eligible Earnings</th>
                    <th className="py-3.5 px-3 text-right">Already Settled</th>
                    <th className="py-3.5 px-3 text-right">Pending Payout</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDeliveryBoys.length > 0 ? (
                    filteredDeliveryBoys.map((d) => {
                      const isMonthly = d.contractType === 'MONTHLY_CONTRACT';
                      const pending = Number(d.pendingEarnings || 0);
                      return (
                        <tr key={d.deliveryBoyId} className="hover:bg-emerald-50/20 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{d.runnerName}</div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                              {d.contactPhone || d.deliveryBoyId}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            {isMonthly ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                <span>Monthly Contractual - Not Applicable</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <Bike className="w-3 h-3" />
                                <span>Per Delivery (₹10/Order)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-700">
                            {d.completedDeliveries}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold">
                            {isMonthly ? (
                              <span className="text-gray-400 font-normal">₹0 (Fixed Salary)</span>
                            ) : (
                              <span className="text-emerald-900">₹{Number(d.totalEarnings).toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-blue-700">
                            {isMonthly ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              `₹${Number(d.settledAmount).toFixed(2)}`
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-black">
                            {isMonthly ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <span className={pending > 0 ? 'text-amber-800' : 'text-gray-400'}>
                                ₹{pending.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isMonthly && pending > 0 && (
                                <button
                                  onClick={() => {
                                    setSettleRunnerModal({
                                      deliveryBoyId: d.deliveryBoyId,
                                      runnerName: d.runnerName,
                                      pendingEarnings: pending
                                    });
                                    setRunnerSettleAmount(pending);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <Wallet className="w-3 h-3" />
                                  <span>Settle Payout</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedRunnerOrders({
                                    runnerName: d.runnerName,
                                    orders: d.orders || []
                                  });
                                }}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Deliveries</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        No delivery partners found matching the filter.
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
      {/* TAB 4: SETTLEMENT HISTORY & TRANSACTION LOG                              */}
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
                          {new Date(h.settledAt || h.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
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
                          ₹{Number(h.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-semibold text-gray-700">{h.paymentMode}</td>
                        <td className="py-3.5 px-3 font-mono text-gray-600">
                          {h.utrReference || <span className="text-gray-400 italic">Direct Manual</span>}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {h.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-gray-500 text-[11px] max-w-xs truncate">
                          {h.notes || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        No settlement records logged yet.
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
      {/* TAB 5: FINANCIAL REPORTS & EXPORTS                                        */}
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
                  ₹{Number(reportsData.totals.grossSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-purple-600 uppercase">Filtered Orders Count</div>
                <div className="text-xl font-black text-purple-900 font-mono mt-1">
                  {reportsData.orders?.length || 0}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-emerald-600 uppercase">Net Provider Payable</div>
                <div className="text-xl font-black text-emerald-900 font-mono mt-1">
                  ₹{Number(reportsData.totals.netProviderPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-amber-600 uppercase">Remaining Pending</div>
                <div className="text-xl font-black text-amber-900 font-mono mt-1">
                  ₹{Number(reportsData.totals.providerPending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                          {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-800">{ord.providerName}</td>
                        <td className="py-3 px-3 text-gray-700">{ord.customerName}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-600">{ord.paymentMethod}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                          ₹{Number(ord.totalAmount).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          ₹{Number(ord.providerPayable).toFixed(2)}
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
                      <td colSpan={8} className="py-8 text-center text-gray-400">
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
      {/* MODAL 1: MANAGE PROVIDER STATUS                                           */}
      {/* ========================================================================= */}
      {manageStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Manage Provider Financial Status
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Target Provider: <strong>{manageStatusModal.providerName}</strong>
                </p>
              </div>
              <button
                onClick={() => setManageStatusModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-gray-600 font-medium">Unsettled Remaining Balance:</span>
                <span className="font-mono font-black text-amber-800 text-sm">
                  ₹{manageStatusModal.remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">New Settlement Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 font-bold focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED (Authorized for Payout)</option>
                  <option value="PARTIALLY_SETTLED">PARTIALLY_SETTLED</option>
                  <option value="SETTLED">SETTLED (Fully Reconciled)</option>
                  <option value="ON_HOLD">ON_HOLD (Investigating Audit)</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="ADJUSTED">ADJUSTED (Manual Correction)</option>
                </select>
              </div>

              {/* Strict Amount Confirmation if marking SETTLED */}
              {newStatus === 'SETTLED' && manageStatusModal.remainingAmount > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Amount Safety Confirmation</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    To prevent accidental zeroing of balances, enter the exact remaining balance below to confirm full settlement:
                  </p>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`Enter ₹${manageStatusModal.remainingAmount.toFixed(2)}`}
                    value={statusConfirmedAmount}
                    onChange={(e) => setStatusConfirmedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">Audit Log Note / Reason</label>
                <textarea
                  rows={2}
                  placeholder="Enter reason or reference notes for this financial status modification..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setManageStatusModal(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={submitProviderStatusUpdate}
                disabled={submittingStatus}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {submittingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Save Status Change</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PROVIDER PARTIAL SETTLEMENT DISBURSAL                            */}
      {/* ========================================================================= */}
      {partialSettleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Process Provider Payout Settlement
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Beneficiary: <strong>{partialSettleModal.providerName}</strong>
                </p>
              </div>
              <button
                onClick={() => setPartialSettleModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Total Net</div>
                  <div className="font-mono font-bold text-gray-800 text-xs mt-0.5">
                    ₹{partialSettleModal.totalPayable.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600 uppercase font-bold">Settled</div>
                  <div className="font-mono font-bold text-emerald-700 text-xs mt-0.5">
                    ₹{partialSettleModal.settledAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-600 uppercase font-bold">Remaining</div>
                  <div className="font-mono font-bold text-amber-800 text-xs mt-0.5">
                    ₹{partialSettleModal.remainingAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Settlement Amount (₹) <span className="text-gray-400 font-normal">(Max ₹{partialSettleModal.remainingAmount.toFixed(2)})</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={partialSettleModal.remainingAmount}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm font-mono font-black px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Payment Method</label>
                  <select
                    value={partialPaymentMode}
                    onChange={(e) => setPartialPaymentMode(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="BANK_TRANSFER">NEFT / IMPS Bank</option>
                    <option value="CASH">Cash Remittance</option>
                    <option value="CHEQUE">Institutional Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">UTR / Bank Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR89324018"
                    value={partialUtr}
                    onChange={(e) => setPartialUtr(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Disbursal Notes</label>
                <input
                  type="text"
                  placeholder="Optional internal remark for financial records"
                  value={partialNotes}
                  onChange={(e) => setPartialNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl text-[11px] text-blue-800 leading-relaxed">
                <strong>Reconciliation Logic:</strong> This amount will be automatically credited to the provider&apos;s oldest unsettled orders. No duplicate orders will be created.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPartialSettleModal(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={submitPartialSettlement}
                disabled={submittingPartial || !partialAmount}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {submittingPartial ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                <span>Disburse ₹{Number(partialAmount || 0).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COD RECONCILIATION & SHORTFALL SAFETY                            */}
      {/* ========================================================================= */}
      {manageCodModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Reconcile Cash on Delivery
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Order: <strong className="font-mono">{manageCodModal.orderNumber}</strong>
                </p>
              </div>
              <button
                onClick={() => setManageCodModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl flex items-center justify-between">
                <span className="text-amber-900 font-medium">Expected Cash Collection:</span>
                <span className="font-mono font-black text-amber-900 text-sm">
                  ₹{manageCodModal.expectedAmount.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">COD Status</label>
                <select
                  value={newCodStatus}
                  onChange={(e) => setNewCodStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 font-bold focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="PENDING">PENDING (Awaiting Cash Collection)</option>
                  <option value="COLLECTED">COLLECTED (Runner Received Cash)</option>
                  <option value="HANDED_OVER">HANDED_OVER (Remitted to Admin/Provider)</option>
                  <option value="RECONCILED">RECONCILED (Accounted in Treasury)</option>
                  <option value="SHORTFALL">SHORTFALL (Short Cash Received)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Actual Cash Collected (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newCodAmount}
                  onChange={(e) => setNewCodAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm font-mono font-black px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Strict safety rule: If collected != expected, mandatory adjustment reason */}
              {newCodAmount !== '' && Number(newCodAmount) < manageCodModal.expectedAmount && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>Mandatory Shortfall Explanation</span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Collected amount (₹{Number(newCodAmount).toFixed(2)}) is less than expected (₹{manageCodModal.expectedAmount.toFixed(2)}). You must provide a valid audit reason:
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer short on cash / agreed coin discount / partial return"
                    value={codAdjustmentReason}
                    onChange={(e) => setCodAdjustmentReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-rose-300 bg-white"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setManageCodModal(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={submitCodStatusUpdate}
                disabled={submittingCodStatus}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {submittingCodStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Save COD Reconciliation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SETTLE DELIVERY RUNNER EARNINGS                                   */}
      {/* ========================================================================= */}
      {settleRunnerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Disburse Delivery Runner Earnings
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Runner: <strong>{settleRunnerModal.runnerName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSettleRunnerModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between">
                <span className="text-emerald-900 font-medium">Pending Earnings:</span>
                <span className="font-mono font-black text-emerald-900 text-sm">
                  ₹{settleRunnerModal.pendingEarnings.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Disbursal Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  max={settleRunnerModal.pendingEarnings}
                  value={runnerSettleAmount}
                  onChange={(e) => setRunnerSettleAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm font-mono font-black px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Payment Method</label>
                  <select
                    value={runnerPaymentMode}
                    onChange={(e) => setRunnerPaymentMode(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="BANK_TRANSFER">Direct IMPS / Bank</option>
                    <option value="CASH">Cash in Hand</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">UTR / Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 238910481"
                    value={runnerUtr}
                    onChange={(e) => setRunnerUtr(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional note"
                  value={runnerNotes}
                  onChange={(e) => setRunnerNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSettleRunnerModal(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={submitRunnerSettlement}
                disabled={submittingRunnerSettle || !runnerSettleAmount}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {submittingRunnerSettle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                <span>Disburse ₹{Number(runnerSettleAmount || 0).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PROVIDER ORDERS DRILLDOWN MODAL                                  */}
      {/* ========================================================================= */}
      {selectedProviderOrders && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Original Order Financial Breakdown
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Provider: <strong>{selectedProviderOrders.providerName}</strong> • {selectedProviderOrders.orders.length} order(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedProviderOrders(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-black uppercase text-gray-400">
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3 text-right">Order Amount</th>
                    <th className="py-2 px-3 text-right">Net Payable</th>
                    <th className="py-2 px-3 text-center">Settlement Status</th>
                    <th className="py-2 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedProviderOrders.orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-gray-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-gray-700">{ord.customerName}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                        ₹{Number(ord.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        ₹{Number(ord.providerPayable).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {ord.financialStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setDrilldownOrderId(ord.id)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px] hover:bg-blue-100"
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedProviderOrders(null)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: RUNNER ORDERS DRILLDOWN MODAL                                    */}
      {/* ========================================================================= */}
      {selectedRunnerOrders && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Delivery Runner Fulfillment History
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Runner: <strong>{selectedRunnerOrders.runnerName}</strong> • {selectedRunnerOrders.orders.length} order(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedRunnerOrders(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-black uppercase text-gray-400">
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Delivered At</th>
                    <th className="py-2 px-3">OTP Status</th>
                    <th className="py-2 px-3 text-right">COD Collected</th>
                    <th className="py-2 px-3 text-right">Earning Credit</th>
                    <th className="py-2 px-3 text-center">Settled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedRunnerOrders.orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-gray-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {new Date(ord.deliveredAt || ord.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>OTP Verified</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-800">
                        {ord.codCollected ? `₹${Number(ord.codCollected).toFixed(2)}` : '₹0.00 (Online)'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ₹{Number(ord.earningAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {ord.settlementStatus || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedRunnerOrders(null)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REUSABLE SINGLE ORDER FINANCIAL DETAILS MODAL                             */}
      {/* ========================================================================= */}
      <OrderFinancialDetailsModal
        orderId={drilldownOrderId}
        isOpen={Boolean(drilldownOrderId)}
        onClose={() => setDrilldownOrderId(null)}
      />
    </div>
  );
}
