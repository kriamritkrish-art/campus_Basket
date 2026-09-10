'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { AdminKpiCard } from '../../../components/admin/AdminKpiCard';
import {
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  IndianRupee,
  Store,
  Clock,
  ArrowUpRight,
  Percent,
  Receipt,
  ShieldAlert,
  FileText,
  Check,
  CheckCheck,
  X,
  Filter,
  Layers,
  Scale,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Bike,
  Wallet,
  Users,
  ArrowLeft,
  ChevronRight,
  Eye
} from 'lucide-react';

type AdminTab = 'OVERVIEW' | 'TRANSACTIONS' | 'REFUNDS' | 'SETTLEMENTS' | 'RUNNER_SETTLEMENTS' | 'COD' | 'LEDGER';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [loading, setLoading] = useState(true);

  // Safe formatting helpers to prevent NaN
  const formatCur = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Overview Metrics State
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [actionCenter, setActionCenter] = useState<any>(null);

  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [refundStatusFilter, setRefundStatusFilter] = useState('ALL');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Refunds State
  const [refunds, setRefunds] = useState<any[]>([]);
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<any>(null);
  const [refundNotes, setRefundNotes] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  // Settlements State
  const [settlements, setSettlements] = useState<any[]>([]);
  const [selectedDisburseSettlement, setSelectedDisburseSettlement] = useState<any>(null);
  const [payoutReference, setPayoutReference] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');
  const [disbursing, setDisbursing] = useState(false);

  // COD Reconciliation State (Level 1-4)
  const [codCollections, setCodCollections] = useState<any[]>([]);
  const [codSummary, setCodSummary] = useState<any>(null);
  const [codDeliveryBoys, setCodDeliveryBoys] = useState<any[]>([]);
  const [selectedCodRunner, setSelectedCodRunner] = useState<any>(null);
  const [selectedCodCollection, setSelectedCodCollection] = useState<any>(null);
  const [reconcileAmount, setReconcileAmount] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [reconciling, setReconciling] = useState(false);

  // Bulk COD Reconciliation State
  const [showBulkReconcileModal, setShowBulkReconcileModal] = useState(false);
  const [bulkReconcileRunner, setBulkReconcileRunner] = useState<any>(null);
  const [bulkReconcileNotes, setBulkReconcileNotes] = useState('');
  const [bulkReconciling, setBulkReconciling] = useState(false);

  // COD Filter State
  const [codDateFilter, setCodDateFilter] = useState('ALL');
  const [codRunnerFilter, setCodRunnerFilter] = useState('ALL');
  const [codProviderFilter, setCodProviderFilter] = useState('ALL');
  const [codCollectionStatusFilter, setCodCollectionStatusFilter] = useState('ALL');
  const [codReconciliationStatusFilter, setCodReconciliationStatusFilter] = useState('ALL');
  const [codSearchQuery, setCodSearchQuery] = useState('');

  // Financial Ledger State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');

  // Delivery Boy Settlements State
  const [deliverySettlements, setDeliverySettlements] = useState<any[]>([]);
  const [deliverySettlementSummary, setDeliverySettlementSummary] = useState<any>(null);
  const [deliveryBoysList, setDeliveryBoysList] = useState<any[]>([]);
  const [selectedRunnerFilter, setSelectedRunnerFilter] = useState('ALL');
  const [runnerSettlementStatusFilter, setRunnerSettlementStatusFilter] = useState('ALL');
  const [runnerSearchQuery, setRunnerSearchQuery] = useState('');

  // Disburse Runner Settlement Modal State
  const [selectedDisburseRunnerWithdrawal, setSelectedDisburseRunnerWithdrawal] = useState<any>(null);
  const [runnerUtrReference, setRunnerUtrReference] = useState('');
  const [runnerDisburseNotes, setRunnerDisburseNotes] = useState('');
  const [disbursingRunner, setDisbursingRunner] = useState(false);

  // PDF Download Dialog State
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfFilterType, setPdfFilterType] = useState<'ALL' | 'MONTHLY' | 'DAILY' | 'CUSTOM'>('ALL');
  const [pdfSelectedRunner, setPdfSelectedRunner] = useState('ALL');
  const [pdfMonth, setPdfMonth] = useState(new Date().getMonth() + 1);
  const [pdfYear, setPdfYear] = useState(new Date().getFullYear());
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Status Override Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideOrderId, setOverrideOrderId] = useState('');
  const [overrideStatusType, setOverrideStatusType] = useState<'ORDER' | 'PAYMENT' | 'REFUND' | 'SETTLEMENT'>('ORDER');
  const [overrideNewStatus, setOverrideNewStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overriding, setOverriding] = useState(false);

  // Alerts
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Tab Data
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'OVERVIEW') {
        const res = await apiRequest('/api/admin/payments/overview');
        if (res.success) {
          setOverviewMetrics(res.data.metrics);
          setActionCenter(res.data.actionCenter);
        }
        // Also prefetch runner settlement stats for the tab notification badge
        apiRequest('/api/admin/payments/delivery-settlements?status=ALL&deliveryBoyId=ALL')
          .then((r) => {
            if (r?.success && r?.summary) {
              setDeliverySettlementSummary(r.summary);
            }
          })
          .catch(() => {});
      } else if (activeTab === 'TRANSACTIONS') {
        let query = `/api/admin/payments/transactions?serviceType=${serviceFilter}&paymentStatus=${paymentStatusFilter}&refundStatus=${refundStatusFilter}&settlementStatus=${settlementStatusFilter}`;
        if (searchQuery) query += `&search=${encodeURIComponent(searchQuery)}`;
        const res = await apiRequest(query);
        if (res.success) setTransactions(res.data || []);
      } else if (activeTab === 'REFUNDS') {
        const res = await apiRequest('/api/admin/payments/refunds');
        if (res.success) setRefunds(res.data || []);
      } else if (activeTab === 'SETTLEMENTS') {
        const res = await apiRequest('/api/admin/payments/settlements');
        if (res.success) setSettlements(res.data || []);
      } else if (activeTab === 'RUNNER_SETTLEMENTS') {
        let query = `/api/admin/payments/delivery-settlements?status=${runnerSettlementStatusFilter}&deliveryBoyId=${selectedRunnerFilter}`;
        if (runnerSearchQuery) query += `&search=${encodeURIComponent(runnerSearchQuery)}`;
        const res = await apiRequest(query);
        if (res.success) {
          setDeliverySettlements(res.data || []);
          setDeliverySettlementSummary(res.summary);
          if (Array.isArray(res.deliveryBoys)) {
            setDeliveryBoysList(res.deliveryBoys);
          }
        } else if (res.message) {
          showToast(res.message, 'error');
        }
      } else if (activeTab === 'COD') {
        let query = '/api/admin/payments/cod?';
        if (codDateFilter !== 'ALL') query += `&dateRange=${codDateFilter}`;
        if (codRunnerFilter !== 'ALL') query += `&deliveryBoyId=${codRunnerFilter}`;
        if (codProviderFilter !== 'ALL') query += `&providerId=${codProviderFilter}`;
        if (codReconciliationStatusFilter !== 'ALL') query += `&status=${codReconciliationStatusFilter}`;
        const res = await apiRequest(query);
        if (res.success) {
          const list = res.collections || res.data || [];
          setCodCollections(list);
          setCodSummary(res.summary);
          setCodDeliveryBoys(res.deliveryBoys || []);
          if (selectedCodRunner) {
            const updated = (res.deliveryBoys || []).find((b: any) => b.deliveryBoyId === selectedCodRunner.deliveryBoyId);
            if (updated) setSelectedCodRunner(updated);
          }
        }
      } else if (activeTab === 'LEDGER') {
        let query = '/api/admin/payments/ledger';
        if (ledgerTypeFilter !== 'ALL') query += `?entryType=${ledgerTypeFilter}`;
        const res = await apiRequest(query);
        if (res.success) setLedgerEntries(res.data || []);
      }
    } catch (err: any) {
      console.warn('Failed to load tab data:', err);
      if (err?.message?.includes('403') || err?.message?.includes('Forbidden')) {
        showToast('Administrative session required. If you recently used the Runner portal in this browser, please log in with your Admin account.', 'error');
      } else if (err?.message && !err.message.includes('abort')) {
        showToast(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    activeTab,
    serviceFilter,
    paymentStatusFilter,
    refundStatusFilter,
    settlementStatusFilter,
    ledgerTypeFilter,
    selectedRunnerFilter,
    runnerSettlementStatusFilter,
    codDateFilter,
    codRunnerFilter,
    codProviderFilter,
    codReconciliationStatusFilter
  ]);

  // Execute Refund Action
  const handleProcessRefund = async () => {
    if (!selectedRefundOrder) return;
    setProcessingRefund(true);
    try {
      const res = await apiRequest('/api/admin/payments/refunds/process', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedRefundOrder.id,
          amount: selectedRefundOrder.totalAmount,
          notes: refundNotes
        })
      });
      if (res.success) {
        showToast('Refund processed successfully and recorded in financial ledger!');
        setSelectedRefundOrder(null);
        setRefundNotes('');
        loadData();
      } else {
        showToast(res.message || 'Refund processing failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Refund failed', 'error');
    } finally {
      setProcessingRefund(false);
    }
  };

  // Execute Settlement Disbursement
  const handleDisburseSettlement = async () => {
    if (!selectedDisburseSettlement || !payoutReference) {
      showToast('Payout Reference is required', 'error');
      return;
    }
    setDisbursing(true);
    try {
      const res = await apiRequest('/api/admin/payments/settlements/disburse', {
        method: 'POST',
        body: JSON.stringify({
          settlementId: selectedDisburseSettlement.id,
          payoutReference,
          notes: disburseNotes
        })
      });
      if (res.success) {
        showToast('Settlement disbursed and recognized in financial ledger!');
        setSelectedDisburseSettlement(null);
        setPayoutReference('');
        setDisburseNotes('');
        loadData();
      } else {
        showToast(res.message || 'Disbursement failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Disbursement error', 'error');
    } finally {
      setDisbursing(false);
    }
  };

  // Execute Runner Settlement Disbursement
  const handleDisburseRunnerSettlement = async () => {
    if (!selectedDisburseRunnerWithdrawal) return;
    setDisbursingRunner(true);
    try {
      const res = await apiRequest('/api/admin/payments/delivery-settlements/disburse', {
        method: 'POST',
        body: JSON.stringify({
          withdrawalId: selectedDisburseRunnerWithdrawal.id,
          action: 'DISTRIBUTE',
          utrReference: runnerUtrReference.trim() || `UTR-${Date.now().toString().slice(-8)}`,
          adminNotes: runnerDisburseNotes.trim()
        })
      });
      if (res.success) {
        showToast(res.message || 'Runner withdrawal disbursed and settled successfully!');
        setSelectedDisburseRunnerWithdrawal(null);
        setRunnerUtrReference('');
        setRunnerDisburseNotes('');
        loadData();
      } else {
        showToast(res.message || 'Disbursement failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Disbursement error', 'error');
    } finally {
      setDisbursingRunner(false);
    }
  };

  const handleApproveRunnerSettlement = async (withdrawal: any) => {
    try {
      const res = await apiRequest('/api/admin/payments/delivery-settlements/disburse', {
        method: 'POST',
        body: JSON.stringify({
          withdrawalId: withdrawal.id,
          action: 'APPROVE',
          adminNotes: 'Approved by administrator'
        })
      });
      if (res.success) {
        showToast(res.message || 'Withdrawal approved');
        loadData();
      } else {
        showToast(res.message || 'Approval failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Approval error', 'error');
    }
  };

  const handleRejectRunnerSettlement = async (withdrawal: any) => {
    const reason = window.prompt('Enter rejection reason for delivery partner:');
    if (reason === null) return;
    try {
      const res = await apiRequest('/api/admin/payments/delivery-settlements/disburse', {
        method: 'POST',
        body: JSON.stringify({
          withdrawalId: withdrawal.id,
          action: 'REJECT',
          adminNotes: reason || 'Rejected by administrator'
        })
      });
      if (res.success) {
        showToast(res.message || 'Withdrawal rejected');
        loadData();
      } else {
        showToast(res.message || 'Rejection failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Rejection error', 'error');
    }
  };

  const handleDownloadDeliverySettlementsPdf = () => {
    setPdfGenerating(true);
    try {
      let query = `/api/admin/payments/delivery-settlements/pdf?deliveryBoyId=${pdfSelectedRunner}&filterType=${pdfFilterType}`;
      if (pdfFilterType === 'MONTHLY') {
        query += `&month=${pdfMonth}&year=${pdfYear}`;
      } else if (pdfFilterType === 'DAILY') {
        query += `&startDate=${pdfStartDate}`;
      } else if (pdfFilterType === 'CUSTOM') {
        query += `&startDate=${pdfStartDate}&endDate=${pdfEndDate}`;
      }
      window.open(query, '_blank');
      setPdfDialogOpen(false);
      showToast('Downloading delivery settlements PDF statement...');
    } catch (err: any) {
      showToast(err.message || 'Failed to download PDF', 'error');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Execute COD Reconciliation
  const handleReconcileCod = async () => {
    if (!selectedCodCollection) return;
    setReconciling(true);
    try {
      const res = await apiRequest('/api/admin/payments/cod/reconcile', {
        method: 'POST',
        body: JSON.stringify({
          collectionId: selectedCodCollection.id,
          amountCollected: reconcileAmount ? Number(reconcileAmount) : undefined,
          notes: reconcileNotes
        })
      });
      if (res.success) {
        showToast('COD collection reconciled successfully!');
        setSelectedCodCollection(null);
        setReconcileAmount('');
        setReconcileNotes('');
        loadData();
      } else {
        showToast(res.message || 'Reconciliation failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Reconciliation error', 'error');
    } finally {
      setReconciling(false);
    }
  };

  // Execute Bulk COD Reconciliation for a Delivery Boy
  const handleBulkReconcileCod = async () => {
    if (!bulkReconcileRunner) return;
    setBulkReconciling(true);
    try {
      const res = await apiRequest('/api/admin/payments/cod/bulk-reconcile', {
        method: 'POST',
        body: JSON.stringify({
          deliveryBoyId: bulkReconcileRunner.deliveryBoyId,
          providerId: codProviderFilter !== 'ALL' ? codProviderFilter : undefined,
          dateRange: codDateFilter !== 'ALL' ? codDateFilter : undefined,
          notes: bulkReconcileNotes || undefined
        })
      });
      if (res.success) {
        showToast(res.message || `Successfully reconciled ${res.reconciledCount} eligible orders for ${bulkReconcileRunner.name}!`);
        setShowBulkReconcileModal(false);
        setBulkReconcileRunner(null);
        setBulkReconcileNotes('');
        await loadData();
      } else {
        showToast(res.message || 'Bulk reconciliation failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Bulk reconciliation error', 'error');
    } finally {
      setBulkReconciling(false);
    }
  };

  // Dynamic filter lists and memos for COD
  const availableCodProviders = useMemo(() => {
    const map = new Map<string, string>();
    codDeliveryBoys.forEach((r) => {
      r.orders?.forEach((o: any) => {
        if (o.provider?.id && (o.provider?.businessName || o.provider?.name)) {
          map.set(o.provider.id, o.provider.businessName || o.provider.name);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [codDeliveryBoys]);

  const filteredCodRunners = useMemo(() => {
    return codDeliveryBoys.filter((r) => {
      const q = codSearchQuery.trim().toLowerCase();
      const matchesSearch = !q || (r.name || '').toLowerCase().includes(q) || (r.phone || '').toLowerCase().includes(q);
      const matchesStatus = codReconciliationStatusFilter === 'ALL' || r.status === codReconciliationStatusFilter;
      const matchesRunner = codRunnerFilter === 'ALL' || r.deliveryBoyId === codRunnerFilter;
      return matchesSearch && matchesStatus && matchesRunner;
    });
  }, [codDeliveryBoys, codSearchQuery, codReconciliationStatusFilter, codRunnerFilter]);

  const filteredRunnerOrders = useMemo(() => {
    if (!selectedCodRunner || !selectedCodRunner.orders) return [];
    return selectedCodRunner.orders.filter((c: any) => {
      const q = codSearchQuery.trim().toLowerCase();
      const orderNum = (c.order?.orderNumber || c.orderId || '').toLowerCase();
      const customer = (c.order?.user?.fullName || c.order?.customerName || '').toLowerCase();
      const product = (c.order?.items?.[0]?.product?.name || c.order?.productName || '').toLowerCase();
      const provider = (c.order?.items?.[0]?.product?.provider?.name || c.order?.providerName || c.provider?.name || c.provider?.businessName || '').toLowerCase();
      const matchesSearch = !q || orderNum.includes(q) || customer.includes(q) || product.includes(q) || provider.includes(q);
      const matchesStatus = codReconciliationStatusFilter === 'ALL' || c.reconciliationStatus === codReconciliationStatusFilter;
      const matchesCollectionStatus = codCollectionStatusFilter === 'ALL' || c.collectionStatus === codCollectionStatusFilter;
      const matchesProvider = codProviderFilter === 'ALL' || (c.provider?.id === codProviderFilter || c.order?.items?.[0]?.product?.provider?.id === codProviderFilter);
      return matchesSearch && matchesStatus && matchesCollectionStatus && matchesProvider;
    });
  }, [selectedCodRunner, codSearchQuery, codReconciliationStatusFilter, codCollectionStatusFilter, codProviderFilter]);

  // Execute Status Override
  const handleStatusOverride = async () => {
    if (!overrideOrderId || !overrideNewStatus || overrideReason.trim().length < 5) {
      showToast('Order ID, New Status, and Detailed Reason (min 5 characters) are required', 'error');
      return;
    }
    setOverriding(true);
    try {
      const res = await apiRequest('/api/admin/payments/override-status', {
        method: 'POST',
        body: JSON.stringify({
          orderId: overrideOrderId,
          statusType: overrideStatusType,
          newStatus: overrideNewStatus,
          reason: overrideReason,
          notes: overrideNotes
        })
      });
      if (res.success) {
        showToast(`Status overridden to ${overrideNewStatus} successfully!`);
        setOverrideModalOpen(false);
        setOverrideOrderId('');
        setOverrideReason('');
        setOverrideNotes('');
        loadData();
      } else {
        showToast(res.message || 'Status override failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Status override error', 'error');
    } finally {
      setOverriding(false);
    }
  };

  // Filtered Export
  const handleExport = (type: 'csv' | 'json') => {
    let url = `/api/admin/payments/export?type=${type}&serviceType=${serviceFilter}&paymentStatus=${paymentStatusFilter}&refundStatus=${refundStatusFilter}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm flex items-center gap-2 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4F9D2F] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Unified Financial Operations &amp; Settlements
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Single source of truth across Food, Laundry, Fresh Produce, and Stationery. Double-entry immutable ledger &amp; audit control.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setOverrideModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Status Override
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 bg-[#4F9D2F] hover:bg-[#36751F] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={loadData}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#4F9D2F]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 Dedicated Sections Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#4F9D2F]" />
          Overview &amp; Action Center
        </button>

        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'TRANSACTIONS'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Receipt className="w-4 h-4 text-blue-600" />
          Transactions
        </button>

        <button
          onClick={() => setActiveTab('REFUNDS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'REFUNDS'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-amber-600" />
          Refunds
        </button>

        <button
          onClick={() => setActiveTab('SETTLEMENTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'SETTLEMENTS'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Store className="w-4 h-4 text-purple-600" />
          Provider Settlements
        </button>

        <button
          onClick={() => setActiveTab('RUNNER_SETTLEMENTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'RUNNER_SETTLEMENTS'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Bike className="w-4 h-4 text-emerald-600" />
          Delivery Boy Settlements
          {deliverySettlementSummary?.totalPendingAmount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">
              ₹{Math.round(deliverySettlementSummary.totalPendingAmount)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('COD')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'COD'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Banknote className="w-4 h-4 text-emerald-600" />
          COD Reconciliation
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'LEDGER'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          Financial Ledger
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: OVERVIEW & ACTION CENTER                      */}
      {/* ======================================================== */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Action Center Critical Alerts Widget */}
          {actionCenter && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab('REFUNDS')}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Action Center: Pending Refunds</div>
                  <div className="text-2xl font-black text-amber-900 mt-1">{actionCenter.pendingRefunds} orders</div>
                  <p className="text-[11px] text-amber-700 mt-0.5">Awaiting admin review &amp; disbursement</p>
                </div>
                <RotateCcw className="w-8 h-8 text-amber-600 opacity-80" />
              </div>

              <div
                onClick={() => setActiveTab('SETTLEMENTS')}
                className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-purple-800 uppercase tracking-wider">Pending Settlements</div>
                  <div className="text-2xl font-black text-purple-900 mt-1">{actionCenter.pendingSettlements} batches</div>
                  <p className="text-[11px] text-purple-700 mt-0.5">Ready for provider payout approval</p>
                </div>
                <Store className="w-8 h-8 text-purple-600 opacity-80" />
              </div>

              <div
                onClick={() => setActiveTab('COD')}
                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-100 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-red-800 uppercase tracking-wider">COD Mismatches</div>
                  <div className="text-2xl font-black text-red-900 mt-1">{actionCenter.codMismatches} flagged</div>
                  <p className="text-[11px] text-red-700 mt-0.5">Runner collection discrepancies</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600 opacity-80" />
              </div>
            </div>
          )}

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminKpiCard
              title="Total Gross Platform Volume"
              value={`₹${(overviewMetrics?.totalGrossVolume || 0).toLocaleString('en-IN')}`}
              subtitle={`${overviewMetrics?.totalOrdersCount || 0} total platform orders • Click for full breakdown & exports →`}
              icon={IndianRupee}
              color="green"
              onClick={() => router.push('/admin/payments/gross-volume')}
            />
            <AdminKpiCard
              title="Online Payments Collected"
              value={`₹${(overviewMetrics?.totalOnlinePayments || 0).toLocaleString('en-IN')}`}
              subtitle="Razorpay UPI / Cards / NetBanking"
              icon={CreditCard}
              color="blue"
            />
            <AdminKpiCard
              title="COD Cash Reconciled"
              value={`₹${(overviewMetrics?.totalCodCollected || 0).toLocaleString('en-IN')}`}
              subtitle="Doorstep delivery collection"
              icon={Banknote}
              color="indigo"
            />
            <AdminKpiCard
              title="Platform Commission (5%)"
              value={`₹${(overviewMetrics?.totalCommissionEarned || 0).toLocaleString('en-IN')}`}
              subtitle="Recognized institutional revenue"
              icon={Percent}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold text-gray-500 uppercase">Provider Settlements Disbursed</div>
              <div className="text-2xl font-black text-gray-900 mt-2">
                ₹{(overviewMetrics?.settledPayoutsAmount || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-gray-500 mt-1">Transferred via NEFT / UPI to verified accounts</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold text-gray-500 uppercase">Pending Provider Payable</div>
              <div className="text-2xl font-black text-amber-600 mt-2">
                ₹{(overviewMetrics?.pendingSettlementsAmount || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting next disbursement cycle</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold text-gray-500 uppercase">Total Completed Refunds</div>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                ₹{(overviewMetrics?.completedRefundsAmount || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-gray-500 mt-1">{overviewMetrics?.completedRefundsCount || 0} student claims completed</p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: UNIFIED TRANSACTIONS TABLE                    */}
      {/* ======================================================== */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase block mb-1">Service</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800"
              >
                <option value="ALL">All Services</option>
                <option value="FOOD">Food &amp; Meals</option>
                <option value="LAUNDRY">Express Laundry</option>
                <option value="FRESH_PRODUCE">Fresh Produce</option>
                <option value="STATIONERY">Stationery</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase block mb-1">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">Paid / Success</option>
                <option value="COD_PENDING">COD Pending</option>
                <option value="COD_COLLECTED">COD Collected</option>
                <option value="REFUNDED">Refunded</option>
                <option value="REFUND_PENDING">Refund Pending</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase block mb-1">Refund Status</label>
              <select
                value={refundStatusFilter}
                onChange={(e) => setRefundStatusFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800"
              >
                <option value="ALL">All Refund Statuses</option>
                <option value="NOT_APPLICABLE">Not Applicable</option>
                <option value="REQUESTED">Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase block mb-1">Settlement Status</label>
              <select
                value={settlementStatusFilter}
                onChange={(e) => setSettlementStatusFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800"
              >
                <option value="ALL">All Settlement Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ELIGIBLE">Eligible</option>
                <option value="PROCESSING">Processing</option>
                <option value="SETTLED">Settled</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase block mb-1">Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Order ID, student, room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Provider</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Refund</th>
                  <th className="py-3 px-3">Settlement</th>
                  <th className="py-3 px-3">Comm (5%)</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      {o.orderNumber}
                      <div className="text-[10px] text-gray-400 font-normal">
                        {new Date(o.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.serviceType === 'FOOD' ? 'bg-amber-100 text-amber-800' :
                        o.serviceType === 'LAUNDRY' ? 'bg-sky-100 text-sky-800' :
                        o.serviceType === 'FRESH_PRODUCE' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {o.serviceType || 'FOOD'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{o.student?.fullName || 'Student'}</div>
                      <div className="text-[10px] text-gray-400">{o.hallName}, Room {o.roomNumber}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-800">{o.provider?.fullName || 'Campus Cell'}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-900">
                      ₹{Number(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        ['PAID', 'SUCCESS'].includes(o.paymentStatus) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        o.paymentStatus === 'COD_PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        o.paymentStatus === 'REFUNDED' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        o.refundStatus === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                        o.refundStatus === 'REQUESTED' ? 'bg-amber-100 text-amber-800 font-bold' :
                        'text-gray-400'
                      }`}>
                        {o.refundStatus || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        o.settlementStatus === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' :
                        o.settlementStatus === 'ELIGIBLE' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {o.settlementStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-purple-700">
                      ₹{Number(o.commissionAmount || (o.totalAmount * 0.05)).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setOverrideOrderId(o.id);
                          setOverrideStatusType('ORDER');
                          setOverrideNewStatus(o.status);
                          setOverrideModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: REFUNDS MANAGEMENT QUEUE                      */}
      {/* ======================================================== */}
      {activeTab === 'REFUNDS' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Student Cancellation &amp; Refund Queue</h3>
            <span className="text-xs text-gray-500">{refunds.length} claims</span>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Confidential Refund Destination</th>
                  <th className="py-3 px-3">Refund Amount</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">{r.orderNumber}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{r.student?.fullName || 'Student'}</div>
                      <div className="text-[10px] text-gray-400">{r.student?.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      {r.refundAccount ? (
                        <div className="font-mono text-xs text-gray-800 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md inline-block">
                          {r.refundAccount.accountType === 'UPI' ? (
                            <span>UPI: {r.refundAccount.upiIdMasked}</span>
                          ) : (
                            <span>Bank: {r.refundAccount.bankName} ({r.refundAccount.accountNumberMasked})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-600 font-semibold text-[11px]">Awaiting Student Account</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-red-600">₹{Number(r.refundAmount ?? (r.refunds?.[0]?.amount || r.totalAmount)).toFixed(2)}</td>
                    <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{r.refunds?.[0]?.reason || r.cancellationReason || 'Cancelled before provider acceptance'}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        r.refundStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.refundStatus || 'REQUESTED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {r.refundStatus !== 'COMPLETED' && (
                        <button
                          onClick={() => setSelectedRefundOrder(r)}
                          className="px-3 py-1.5 bg-[#4F9D2F] hover:bg-[#36751F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          Disburse Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: PROVIDER SETTLEMENTS                          */}
      {/* ======================================================== */}
      {activeTab === 'SETTLEMENTS' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Provider Settlement Batches</h3>
              <p className="text-xs text-gray-500">Gross sales, discounts, refunds, 5% commission, and net payable.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Batch Number</th>
                  <th className="py-3 px-3">Provider</th>
                  <th className="py-3 px-3">Gross Sales</th>
                  <th className="py-3 px-3">Discounts</th>
                  <th className="py-3 px-3">Refunds Deducted</th>
                  <th className="py-3 px-3">Commission (5%)</th>
                  <th className="py-3 px-3">Net Payable</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">{s.settlementNumber}</td>
                    <td className="py-3 px-3 font-medium text-gray-900">{s.provider?.fullName || 'Provider'}</td>
                    <td className="py-3 px-3">₹{Number(s.grossSales).toFixed(2)}</td>
                    <td className="py-3 px-3 text-amber-600">-₹{Number(s.discountsTotal).toFixed(2)}</td>
                    <td className="py-3 px-3 text-red-600">-₹{Number(s.refundsDeducted).toFixed(2)}</td>
                    <td className="py-3 px-3 text-purple-700 font-bold">-₹{Number(s.commissionDeducted).toFixed(2)}</td>
                    <td className="py-3 px-3 font-black text-[#4F9D2F] text-sm">₹{Number(s.netPayable).toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        s.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {s.status !== 'SETTLED' && (
                        <button
                          onClick={() => setSelectedDisburseSettlement(s)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4B: DELIVERY FLEET SETTLEMENTS & RUNNER PAYOUTS  */}
      {/* ======================================================== */}
      {activeTab === 'RUNNER_SETTLEMENTS' && (
        <div className="space-y-6">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-800 mt-2 font-mono">
                ₹{Number(deliverySettlementSummary?.totalPendingAmount || 0).toFixed(2)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Awaiting admin review</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700 uppercase tracking-wider">
                <span>Approved (Ready to Disburse)</span>
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-800 mt-2 font-mono">
                ₹{Number(deliverySettlementSummary?.totalApprovedAmount || 0).toFixed(2)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Ready for bank transfer</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <span>Total Fleet Settled</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-800 mt-2 font-mono">
                ₹{Number(deliverySettlementSummary?.totalFleetSettled || 0).toFixed(2)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">All-time settled to runners</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider">
                <span>Fleet Wallet Balances</span>
                <Wallet className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
                ₹{Number(deliverySettlementSummary?.totalFleetPendingBalance || 0).toFixed(2)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Undrawn in runner wallets</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            {/* Header and Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delivery Fleet Settlement &amp; Disbursal Ledger
                </h3>
                <p className="text-xs text-gray-500">
                  Approve withdrawals, input UTR numbers, deduct runner wallets to ₹0 upon distribution, and view full settlement history.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setPdfDialogOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Generate Statement PDF
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by runner name, phone, withdrawal #, or UTR..."
                    value={runnerSearchQuery}
                    onChange={(e) => setRunnerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Runner Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-gray-500">Runner:</span>
                <select
                  value={selectedRunnerFilter}
                  onChange={(e) => setSelectedRunnerFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:border-blue-600 focus:outline-none bg-white"
                >
                  <option value="ALL">All Delivery Boys</option>
                  {deliveryBoysList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.fullName} ({b.mobileNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-gray-500">Status:</span>
                <select
                  value={runnerSettlementStatusFilter}
                  onChange={(e) => setRunnerSettlementStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:border-blue-600 focus:outline-none bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DISTRIBUTED">Distributed / Settled</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Withdrawal #</th>
                    <th className="py-3 px-3">Delivery Partner</th>
                    <th className="py-3 px-3">Requested Amount</th>
                    <th className="py-3 px-3">Payout Destination</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Bank Reference / UTR</th>
                    <th className="py-3 px-3">Requested At</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliverySettlements.length > 0 ? (
                    deliverySettlements.map((w) => {
                      let dest = 'UPI / Bank';
                      try {
                        if (w.accountDetails) {
                          const parsed = JSON.parse(w.accountDetails);
                          dest = parsed.accountType === 'UPI'
                            ? `UPI: ${parsed.upiId}`
                            : `${parsed.bankName || 'Bank'} (${parsed.accountNumber || ''})`;
                        }
                      } catch {}

                      return (
                        <tr key={w.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-gray-900">
                            {w.withdrawalNumber}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-900">
                              {w.deliveryBoy?.fullName || 'Delivery Partner'}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {w.deliveryBoy?.mobileNumber || 'N/A'} • Wallet: ₹{Number(w.deliveryBoy?.walletBalance || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-black text-gray-900 text-sm font-mono">
                            ₹{Number(w.amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded-md inline-block font-medium text-gray-800">
                              {dest}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                w.status === 'DISTRIBUTED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : w.status === 'APPROVED'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : w.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {w.status === 'DISTRIBUTED'
                                ? '✓ Distributed'
                                : w.status === 'APPROVED'
                                ? 'Approved'
                                : w.status === 'REJECTED'
                                ? 'Rejected'
                                : 'Pending Approval'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            {w.utrReference ? (
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                {w.utrReference}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Pending UTR</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-500 text-[11px]">
                            {new Date(w.requestedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {w.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApproveRunnerSettlement(w)}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedDisburseRunnerWithdrawal(w);
                                      setRunnerUtrReference(`UTR-${Date.now().toString().slice(-8)}`);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Settle
                                  </button>
                                  <button
                                    onClick={() => handleRejectRunnerSettlement(w)}
                                    className="px-2 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {w.status === 'APPROVED' && (
                                <button
                                  onClick={() => {
                                    setSelectedDisburseRunnerWithdrawal(w);
                                    setRunnerUtrReference(`UTR-${Date.now().toString().slice(-8)}`);
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                                >
                                  Disburse / Settle
                                </button>
                              )}

                              {w.status === 'DISTRIBUTED' && (
                                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Settled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        No delivery runner withdrawal records found matching active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 5: COD RUNNER RECONCILIATION                     */}
      {/* ======================================================== */}
      {activeTab === 'COD' && (
        <div className="space-y-6">
          {/* LEVEL 1: OVERALL COD SUMMARY CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Delivery Boys</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">
                {codSummary?.totalDeliveryBoys ?? codDeliveryBoys.length ?? 0}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Active Runners</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">COD Orders</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">
                {codSummary?.totalOrders ?? 0}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Total Cash Orders</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Expected COD</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">
                {formatCur(codSummary?.totalExpected ?? 0)}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Invoice Value</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Cash Collected</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                {formatCur(codSummary?.totalCollected ?? 0)}
              </span>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Vault Drops</span>
            </div>

            <div className={`bg-white p-4 rounded-xl border shadow-xs ${
              Number(codSummary?.totalDifference || 0) < 0 
                ? 'border-red-200 bg-red-50/30 text-red-900' 
                : 'border-gray-200'
            }`}>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Difference</span>
              <span className={`text-xl font-black mt-1 block ${
                Number(codSummary?.totalDifference || 0) < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {formatCur(codSummary?.totalDifference ?? 0)}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                {Number(codSummary?.totalDifference || 0) === 0 ? 'Balanced' : 'Discrepancy'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Reconciled</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                {codSummary?.reconciledOrders ?? 0}
              </span>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Audited Orders</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Pending</span>
              <span className="text-xl font-black text-amber-700 mt-1 block">
                {codSummary?.pendingOrders ?? 0}
              </span>
              <span className="text-[10px] text-amber-600 mt-0.5 block">Awaiting Audit</span>
            </div>
          </div>

          {/* VIEW TOGGLE: LEVEL 1 (ALL RUNNERS) VS LEVEL 2 & 3 (SINGLE RUNNER DRILLDOWN) */}
          {!selectedCodRunner ? (
            /* ======================================================== */
            /* LEVEL 1: ALL DELIVERY BOYS COD SUMMARY TABLE             */
            /* ======================================================== */
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Bike className="w-5 h-5 text-indigo-600" />
                    Delivery Boy COD Reconciliation
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select a delivery runner to review individual customer orders and perform bulk batch reconciliation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadData()}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* LEVEL 1 FILTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-xs">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search runner name / phone..."
                    value={codSearchQuery}
                    onChange={(e) => setCodSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <select
                    value={codDateFilter}
                    onChange={(e) => setCodDateFilter(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ALL">All Time Periods</option>
                    <option value="TODAY">Today's Collections</option>
                    <option value="THIS_WEEK">This Week</option>
                    <option value="THIS_MONTH">This Month</option>
                  </select>
                </div>

                <div>
                  <select
                    value={codRunnerFilter}
                    onChange={(e) => setCodRunnerFilter(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ALL">All Delivery Runners</option>
                    {codDeliveryBoys.map((r) => (
                      <option key={r.deliveryBoyId} value={r.deliveryBoyId}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={codReconciliationStatusFilter}
                    onChange={(e) => setCodReconciliationStatusFilter(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="READY TO RECONCILE">Ready to Reconcile</option>
                    <option value="RECONCILED">Fully Reconciled</option>
                    <option value="PENDING">Pending Audit</option>
                    <option value="MISMATCH">Cash Discrepancy</option>
                  </select>
                </div>
              </div>

              {/* LEVEL 1 DELIVERY BOYS TABLE */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Delivery Boy</th>
                      <th className="py-3 px-3">COD Orders</th>
                      <th className="py-3 px-3">Expected COD</th>
                      <th className="py-3 px-3">Cash Collected</th>
                      <th className="py-3 px-3">Difference</th>
                      <th className="py-3 px-3">Reconciled</th>
                      <th className="py-3 px-3">Pending</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCodRunners.length > 0 ? (
                      filteredCodRunners.map((runner) => {
                        const hasMismatch = runner.differenceRequiringAttention !== 0 || runner.difference < 0;
                        const isFullyReconciled = runner.pendingOrdersCount === 0 && runner.codOrdersCount > 0;
                        const isReady = runner.eligibleOrdersCount > 0;

                        return (
                          <tr key={runner.deliveryBoyId} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-gray-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                                  {runner.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">{runner.name}</div>
                                  <div className="text-[11px] text-gray-400 font-mono">{runner.phone || 'Campus Runner'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 font-bold text-gray-800">
                              {runner.codOrdersCount} orders
                            </td>
                            <td className="py-3.5 px-3 font-bold text-gray-800">
                              {formatCur(runner.expectedAmount)}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-emerald-700">
                              {formatCur(runner.collectedAmount)}
                            </td>
                            <td className={`py-3.5 px-3 font-bold ${runner.difference < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                              {formatCur(runner.difference)}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-emerald-700">
                              {runner.reconciledOrdersCount}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-amber-700">
                              {runner.pendingOrdersCount}
                            </td>
                            <td className="py-3.5 px-3">
                              {hasMismatch ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                                  <AlertCircle className="w-3 h-3 text-red-600" />
                                  MISMATCH ({formatCur(Math.abs(runner.difference))})
                                </span>
                              ) : isFullyReconciled ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  RECONCILED
                                </span>
                              ) : isReady ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                  <Check className="w-3 h-3 text-blue-600" />
                                  READY ({runner.eligibleOrdersCount})
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-700">
                                  PENDING
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {runner.eligibleOrdersCount > 0 && (
                                  <button
                                    onClick={() => {
                                      setBulkReconcileRunner(runner);
                                      setShowBulkReconcileModal(true);
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    title="Quick Bulk Reconcile"
                                  >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Bulk ({runner.eligibleOrdersCount})
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedCodRunner(runner)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  VIEW
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-gray-400">
                          No delivery runners found matching selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* LEVEL 2 & 3: SELECTED DELIVERY BOY DRILLDOWN             */
            /* ======================================================== */
            <div className="space-y-4">
              {/* TOP HEADER & BREADCRUMB */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCodRunner(null)}
                      className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors cursor-pointer"
                      title="Back to All Delivery Boys"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-gray-900">{selectedCodRunner.name}</h2>
                        <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[11px] font-bold">
                          Campus Delivery Partner
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        Phone: {selectedCodRunner.phone || 'N/A'} • ID: {selectedCodRunner.deliveryBoyId}
                      </p>
                    </div>
                  </div>

                  {/* LEVEL 4 BULK RECONCILE ACTION BUTTON */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setBulkReconcileRunner(selectedCodRunner);
                        setShowBulkReconcileModal(true);
                      }}
                      disabled={selectedCodRunner.eligibleOrdersCount === 0}
                      className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                        selectedCodRunner.eligibleOrdersCount > 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-[1.02]'
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      <CheckCheck className="w-4 h-4" />
                      RECONCILE ALL ELIGIBLE ({selectedCodRunner.eligibleOrdersCount})
                    </button>
                  </div>
                </div>

                {/* RUNNER KPIS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">COD Orders</span>
                    <span className="text-lg font-black text-gray-900 mt-1 block">
                      {selectedCodRunner.codOrdersCount}
                    </span>
                  </div>

                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Expected Cash</span>
                    <span className="text-lg font-black text-gray-900 mt-1 block">
                      {formatCur(selectedCodRunner.expectedAmount)}
                    </span>
                  </div>

                  <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Cash Collected</span>
                    <span className="text-lg font-black text-emerald-700 mt-1 block">
                      {formatCur(selectedCodRunner.collectedAmount)}
                    </span>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    selectedCodRunner.difference < 0 
                      ? 'bg-red-50/60 border-red-200 text-red-900' 
                      : 'bg-gray-50/80 border-gray-200 text-gray-900'
                  }`}>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Difference</span>
                    <span className={`text-lg font-black mt-1 block ${selectedCodRunner.difference < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCur(selectedCodRunner.difference)}
                    </span>
                  </div>

                  <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">Ready for Batch</span>
                    <span className="text-lg font-black text-blue-700 mt-1 block">
                      {selectedCodRunner.eligibleOrdersCount} orders ({formatCur(selectedCodRunner.eligibleAmount)})
                    </span>
                  </div>
                </div>

                {/* DIFFERENCE CALLOUT BANNER */}
                {selectedCodRunner.differenceRequiringAttention !== 0 ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Cash Discrepancy Requiring Investigation:</span>
                      <p className="mt-0.5">
                        A discrepancy of <strong className="font-bold text-amber-950">{formatCur(Math.abs(selectedCodRunner.differenceRequiringAttention))}</strong> was detected among this runner's orders. 
                        Discrepant orders are excluded from bulk reconciliation and require individual physical verification or admin status adjustment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Cash Collections Verified:</strong> All physical vault drops match expected customer order amounts (₹0.00 difference).
                    </span>
                  </div>
                )}

                {/* RUNNER ORDER DRILLDOWN FILTERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-xs">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search order #, customer, product..."
                      value={codSearchQuery}
                      onChange={(e) => setCodSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <select
                      value={codProviderFilter}
                      onChange={(e) => setCodProviderFilter(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="ALL">All Providers</option>
                      {availableCodProviders.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={codReconciliationStatusFilter}
                      onChange={(e) => setCodReconciliationStatusFilter(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="ALL">All Audit Statuses</option>
                      <option value="RECONCILED">Reconciled</option>
                      <option value="PENDING">Pending Audit</option>
                      <option value="MISMATCH">Mismatch</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={codCollectionStatusFilter}
                      onChange={(e) => setCodCollectionStatusFilter(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="ALL">All Collection States</option>
                      <option value="COLLECTED">Collected</option>
                      <option value="PENDING">Pending Collection</option>
                    </select>
                  </div>
                </div>

                {/* LEVEL 3: INDIVIDUAL CUSTOMER ORDERS TABLE */}
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">Order Number</th>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Provider</th>
                        <th className="py-3 px-3">Items / Products</th>
                        <th className="py-3 px-3">Order Amount</th>
                        <th className="py-3 px-3">Expected Cash</th>
                        <th className="py-3 px-3">Collected</th>
                        <th className="py-3 px-3">Difference</th>
                        <th className="py-3 px-3">Collection</th>
                        <th className="py-3 px-3">Audit Status</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRunnerOrders.length > 0 ? (
                        filteredRunnerOrders.map((c: any) => {
                          const isEligible = c.reconciliationStatus !== 'RECONCILED' && 
                            Number(c.difference ?? 0) === 0 && 
                            c.collectionStatus === 'COLLECTED';
                          const isMismatch = Number(c.difference ?? 0) < 0 || c.reconciliationStatus === 'MISMATCH';

                          return (
                            <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-gray-900">
                                <div>{c.order?.orderNumber || c.orderId}</div>
                                <div className="text-[10px] text-gray-400 font-normal">
                                  {c.order?.createdAt ? new Date(c.order.createdAt).toLocaleDateString() : 'N/A'}
                                </div>
                              </td>

                              <td className="py-3 px-3 font-medium text-gray-900">
                                <div>{c.order?.user?.fullName || c.order?.customerName || 'Student'}</div>
                                <div className="text-[10px] text-gray-400">{c.order?.user?.collegeEmail || c.order?.user?.phone || 'Campus'}</div>
                              </td>

                              <td className="py-3 px-3 font-medium text-gray-800">
                                {c.provider?.businessName || c.provider?.name || c.order?.items?.[0]?.product?.provider?.name || 'Campus Provider'}
                              </td>

                              <td className="py-3 px-3 text-gray-700 max-w-[180px] truncate">
                                {c.order?.items?.[0]?.product?.name || c.order?.productName || 'Order Items'}
                                {(c.order?.items?.length || 1) > 1 && ` +${(c.order?.items?.length || 1) - 1} more`}
                              </td>

                              <td className="py-3 px-3 font-bold text-gray-900">
                                {formatCur(c.order?.totalAmount ?? c.expectedAmount ?? c.amountExpected)}
                              </td>

                              <td className="py-3 px-3 font-bold text-gray-800">
                                {formatCur(c.expectedAmount ?? c.amountExpected)}
                              </td>

                              <td className="py-3 px-3 font-bold text-emerald-700">
                                {formatCur(c.collectedAmount ?? c.amountCollected)}
                              </td>

                              <td className={`py-3 px-3 font-bold ${Number(c.difference) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                {formatCur(c.difference)}
                              </td>

                              <td className="py-3 px-3">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                                  {c.collectionStatus}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  c.reconciliationStatus === 'RECONCILED' ? 'bg-emerald-100 text-emerald-800' :
                                  c.reconciliationStatus === 'MISMATCH' ? 'bg-red-100 text-red-800 animate-pulse' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {c.reconciliationStatus}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-right">
                                {c.reconciliationStatus === 'RECONCILED' ? (
                                  <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-end gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Reconciled
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedCodCollection(c);
                                      setReconcileAmount(String(c.collectedAmount ?? c.amountCollected ?? '0'));
                                      setReconcileNotes(c.reconciliationNotes || '');
                                    }}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                      isEligible
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                                    }`}
                                  >
                                    {isMismatch ? 'Audit Mismatch' : 'Reconcile'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-gray-400">
                            No orders found for this runner matching active filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 6: FINANCIAL LEDGER                              */}
      {/* ======================================================== */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Double-Entry Immutable Financial Ledger</h3>
              <p className="text-xs text-gray-500">Append-only audit trail of all platform disbursements, commissions, and collections.</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-600">Entry Type:</label>
              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800"
              >
                <option value="ALL">All Types</option>
                <option value="ORDER_PAYMENT">Order Payment</option>
                <option value="COMMISSION_EARNED">Commission Earned</option>
                <option value="PROVIDER_PAYABLE">Provider Payable</option>
                <option value="REFUND_ISSUED">Refund Issued</option>
                <option value="SETTLEMENT_PAYOUT">Settlement Payout</option>
                <option value="COD_COLLECTION">COD Collection</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Entry ID &amp; Time</th>
                  <th className="py-3 px-3">Entry Type</th>
                  <th className="py-3 px-3">Debit Account</th>
                  <th className="py-3 px-3">Credit Account</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Reference ID</th>
                  <th className="py-3 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledgerEntries.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-gray-900">
                      <div>{l.id}</div>
                      <div className="text-[10px] text-gray-400 font-normal">
                        {new Date(l.createdAt).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.entryType === 'COMMISSION_EARNED' ? 'bg-purple-100 text-purple-800' :
                        l.entryType === 'REFUND_ISSUED' ? 'bg-red-100 text-red-800' :
                        l.entryType === 'SETTLEMENT_PAYOUT' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {l.entryType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-gray-800">{l.debitAccount}</td>
                    <td className="py-3 px-3 font-mono text-xs text-gray-800">{l.creditAccount}</td>
                    <td className="py-3 px-3 font-bold text-gray-900">₹{Number(l.amount).toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-gray-500">{l.referenceId || '—'}</td>
                    <td className="py-3 px-3 text-gray-600">{l.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PROCESS REFUND                                   */}
      {/* ======================================================== */}
      {selectedRefundOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Approve &amp; Disburse Refund</h3>
              <button onClick={() => setSelectedRefundOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500">Order Number:</span>{' '}
                <strong className="font-mono text-gray-900">{selectedRefundOrder.orderNumber}</strong>
              </div>
              <div>
                <span className="text-gray-500">Student:</span>{' '}
                <strong className="text-gray-900">{selectedRefundOrder.student?.fullName}</strong>
              </div>
              <div>
                <span className="text-gray-500">Refund Amount:</span>{' '}
                <strong className="text-red-600 font-bold text-sm">₹{Number(selectedRefundOrder.refundAmount ?? (selectedRefundOrder.refunds?.[0]?.amount || selectedRefundOrder.totalAmount)).toFixed(2)}</strong>
              </div>

              {selectedRefundOrder.refundAccount && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="font-bold text-gray-700 mb-1">Confidential Refund Account</div>
                  {selectedRefundOrder.refundAccount.accountType === 'UPI' ? (
                    <div>UPI: {selectedRefundOrder.refundAccount.upiIdMasked}</div>
                  ) : (
                    <div>Bank: {selectedRefundOrder.refundAccount.bankName} ({selectedRefundOrder.refundAccount.accountNumberMasked})</div>
                  )}
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">Admin Resolution Notes:</label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="e.g. Student cancelled prior to kitchen cooking; refund approved per dining policy."
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-800"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSelectedRefundOrder(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                disabled={processingRefund}
                className="px-4 py-2 bg-[#4F9D2F] hover:bg-[#36751F] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {processingRefund ? 'Processing...' : 'Confirm Disbursement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DISBURSE SETTLEMENT                             */}
      {/* ======================================================== */}
      {selectedDisburseSettlement && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Disburse Provider Settlement</h3>
              <button onClick={() => setSelectedDisburseSettlement(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500">Batch:</span>{' '}
                <strong className="font-mono text-gray-900">{selectedDisburseSettlement.settlementNumber}</strong>
              </div>
              <div>
                <span className="text-gray-500">Provider:</span>{' '}
                <strong className="text-gray-900">{selectedDisburseSettlement.provider?.fullName}</strong>
              </div>
              <div>
                <span className="text-gray-500">Net Payable Amount:</span>{' '}
                <strong className="text-emerald-600 font-black text-base">₹{Number(selectedDisburseSettlement.netPayable).toFixed(2)}</strong>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Payout Bank Reference / UTR Number *</label>
                <input
                  type="text"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  placeholder="e.g. NEFT_SBI_982348123 or UPI_918239"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Internal Notes:</label>
                <textarea
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  placeholder="e.g. Fortnightly payout approved via SBI Corporate Banking."
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-800"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSelectedDisburseSettlement(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDisburseSettlement}
                disabled={disbursing || !payoutReference}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {disbursing ? 'Disbursing...' : 'Mark as Settled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RECONCILE COD                                   */}
      {/* ======================================================== */}
      {selectedCodCollection && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Reconcile COD Collection</h3>
              <button onClick={() => setSelectedCodCollection(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500">Order:</span>{' '}
                <strong className="font-mono text-gray-900">{selectedCodCollection.order?.orderNumber || selectedCodCollection.orderId}</strong>
              </div>
              <div>
                <span className="text-gray-500">Runner:</span>{' '}
                <strong className="text-gray-900">{selectedCodCollection.deliveryBoy?.fullName || selectedCodCollection.deliveryBoy?.name || 'Campus Runner'}</strong>
              </div>
              <div>
                <span className="text-gray-500">Expected Amount:</span>{' '}
                <strong className="text-gray-900 font-bold">{formatCur(selectedCodCollection.expectedAmount ?? selectedCodCollection.amountExpected)}</strong>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Actual Amount Collected (₹):</label>
                <input
                  type="number"
                  value={reconcileAmount}
                  onChange={(e) => setReconcileAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Reconciliation Notes:</label>
                <textarea
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="Verified and counted against physical cash vault drop."
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSelectedCodCollection(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReconcileCod}
                disabled={reconciling}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {reconciling ? 'Saving...' : 'Confirm Reconciliation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: BULK RECONCILE DELIVERY BOY COD (LEVEL 4)       */}
      {/* ======================================================== */}
      {showBulkReconcileModal && bulkReconcileRunner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCheck className="w-5 h-5" />
                <h3 className="text-base font-black text-gray-900">Bulk Reconcile Delivery Boy COD</h3>
              </div>
              <button 
                onClick={() => setShowBulkReconcileModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* RUNNER DETAILS */}
              <div className="bg-gray-50/90 p-3 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Assigned Runner</span>
                    <span className="font-extrabold text-sm text-gray-900 block mt-0.5">{bulkReconcileRunner.name}</span>
                    <span className="text-[11px] text-gray-500 font-mono">{bulkReconcileRunner.phone || 'Campus Delivery Boy'}</span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                    Zero Shortfall Verified
                  </span>
                </div>
              </div>

              {/* BATCH NUMERICAL BREAKDOWN */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Eligible Orders</span>
                  <span className="text-xl font-black text-gray-900 mt-1 block">
                    {bulkReconcileRunner.eligibleOrdersCount} orders
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">Delivered & Balanced</span>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Expected Cash</span>
                  <span className="text-xl font-black text-gray-900 mt-1 block">
                    {formatCur(bulkReconcileRunner.eligibleAmount)}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Total invoice value</span>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Cash Collected</span>
                  <span className="text-xl font-black text-emerald-700 mt-1 block">
                    {formatCur(bulkReconcileRunner.eligibleAmount)}
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">Vault deposit matched</span>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Difference</span>
                  <span className="text-xl font-black text-emerald-600 mt-1 block">
                    ₹0.00
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">100% Balanced</span>
                </div>
              </div>

              {/* ACTIVE FILTER SCOPE */}
              {(codDateFilter !== 'ALL' || codProviderFilter !== 'ALL') && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-800">
                  <strong>Active Filter Scoping:</strong> Reconciling orders for date range [{codDateFilter}]
                  {codProviderFilter !== 'ALL' && ` and selected provider.`}
                </div>
              )}

              {/* AUDIT NOTES */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Audit / Verification Notes:</label>
                <textarea
                  value={bulkReconcileNotes}
                  onChange={(e) => setBulkReconcileNotes(e.target.value)}
                  placeholder="e.g. Physical cash counted and verified against evening vault collection drop. Batch matched."
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  rows={2}
                />
              </div>

              {/* FINANCIAL AUDIT & SAFETY NOTICE */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 text-[11px] text-gray-600">
                <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                  Audited Batch Ledger Notice:
                </span>
                <p>
                  1. A unique batch audit ID (e.g. <span className="font-mono text-gray-800 font-semibold">REC-BATCH-...</span>) will be generated.
                </p>
                <p>
                  2. Each original order preserves its original Order ID — no duplicates or synthetic orders are created.
                </p>
                <p>
                  3. Synchronized double-entry ledger records will be posted to the Financial Ledger, and Finance Hub will reflect these updates in real time.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowBulkReconcileModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReconcileCod}
                disabled={bulkReconciling || bulkReconcileRunner.eligibleOrdersCount === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-100 hover:scale-[1.01] transition-all cursor-pointer flex items-center gap-2"
              >
                {bulkReconciling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing Batch...
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    Confirm Bulk Reconciliation ({bulkReconcileRunner.eligibleOrdersCount})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ADMIN STATUS OVERRIDE WITH JUSTIFICATION        */}
      {/* ======================================================== */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">Admin Status Override (Audited)</h3>
              </div>
              <button onClick={() => setOverrideModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
              <strong>Mandatory Compliance Notice:</strong> All administrative status overrides are recorded permanently in the financial audit log with your operator ID, IP address, and timestamp. A clear operational justification is strictly required.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Target Order ID or Number *</label>
                <input
                  type="text"
                  value={overrideOrderId}
                  onChange={(e) => setOverrideOrderId(e.target.value)}
                  placeholder="e.g. ord_101 or CB-ORD-9021"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Status Dimension *</label>
                  <select
                    value={overrideStatusType}
                    onChange={(e: any) => setOverrideStatusType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800"
                  >
                    <option value="ORDER">Order Fulfillment</option>
                    <option value="PAYMENT">Payment Status</option>
                    <option value="REFUND">Refund Status</option>
                    <option value="SETTLEMENT">Settlement Status</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">New Value *</label>
                  <input
                    type="text"
                    value={overrideNewStatus}
                    onChange={(e) => setOverrideNewStatus(e.target.value)}
                    placeholder="e.g. DELIVERED, REFUNDED"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mandatory Justification / Audit Reason (min 5 characters) *</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Gate security verified runner completed physical handoff at 20:45; marking delivered."
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Internal Note (Optional):</label>
                <input
                  type="text"
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Incident ticket number or student mobile reference"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusOverride}
                disabled={overriding || !overrideOrderId || !overrideNewStatus || overrideReason.trim().length < 5}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {overriding ? 'Logging Override...' : 'Commit Status Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: DISBURSE RUNNER WITHDRAWAL / SETTLEMENT        */}
      {/* ======================================================== */}
      {selectedDisburseRunnerWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <Bike className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">Settle Delivery Boy Payout</h3>
              </div>
              <button
                onClick={() => setSelectedDisburseRunnerWithdrawal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
              <strong>Balance Deduction Policy:</strong> Confirming disbursement will mark status as{' '}
              <strong>DISTRIBUTED</strong>, deduct <strong>₹{Number(selectedDisburseRunnerWithdrawal.amount).toFixed(2)}</strong> from the delivery runner&apos;s available wallet (reducing to ₹0 if all was withdrawn), and add to their <strong>Already Settled</strong> total.
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Withdrawal #:</span>
                <strong className="font-mono text-gray-900">{selectedDisburseRunnerWithdrawal.withdrawalNumber}</strong>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Delivery Partner:</span>
                <strong className="text-gray-900">{selectedDisburseRunnerWithdrawal.deliveryBoy?.fullName}</strong>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Disbursement Amount:</span>
                <strong className="text-emerald-700 text-sm font-black font-mono">
                  ₹{Number(selectedDisburseRunnerWithdrawal.amount).toFixed(2)}
                </strong>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Bank Reference Number / UTR *
                </label>
                <input
                  type="text"
                  value={runnerUtrReference}
                  onChange={(e) => setRunnerUtrReference(e.target.value)}
                  placeholder="e.g. UTR-98421039 or CMS-881923"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">Transaction number from your banking / UPI portal</p>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Disbursement Remarks / Notes:</label>
                <input
                  type="text"
                  value={runnerDisburseNotes}
                  onChange={(e) => setRunnerDisburseNotes(e.target.value)}
                  placeholder="e.g. Cleared via Campus HDFC Corporate Netbanking"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSelectedDisburseRunnerWithdrawal(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDisburseRunnerSettlement}
                disabled={disbursingRunner}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {disbursingRunner ? 'Disbursing...' : 'Confirm Disbursement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: GENERATE & DOWNLOAD SETTLEMENTS PDF STATEMENT    */}
      {/* ======================================================== */}
      {pdfDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <FileText className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">Generate Delivery Settlement PDF</h3>
              </div>
              <button onClick={() => setPdfDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Runner Scope */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Delivery Partner *</label>
                <select
                  value={pdfSelectedRunner}
                  onChange={(e) => setPdfSelectedRunner(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="ALL">All Delivery Boys (Fleet Wide Statement)</option>
                  {deliveryBoysList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.fullName} ({b.mobileNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Horizon Filter */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Time Horizon *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['ALL', 'MONTHLY', 'DAILY', 'CUSTOM'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPdfFilterType(mode)}
                      className={`py-2 px-2.5 rounded-xl font-bold text-xs border text-center transition ${
                        pdfFilterType === mode
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {mode === 'ALL' ? 'All Time' : mode === 'MONTHLY' ? 'Monthly' : mode === 'DAILY' ? 'Daily' : 'Custom'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Selector */}
              {pdfFilterType === 'MONTHLY' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Month</label>
                    <select
                      value={pdfMonth}
                      onChange={(e) => setPdfMonth(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 bg-white"
                    >
                      {[
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ].map((m, i) => (
                        <option key={i + 1} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Year</label>
                    <select
                      value={pdfYear}
                      onChange={(e) => setPdfYear(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 bg-white"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Daily Selector */}
              {pdfFilterType === 'DAILY' && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="font-bold text-gray-700 block mb-1">Select Statement Date</label>
                  <input
                    type="date"
                    value={pdfStartDate}
                    onChange={(e) => setPdfStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 bg-white"
                  />
                </div>
              )}

              {/* Custom Date Range */}
              {pdfFilterType === 'CUSTOM' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">From Date</label>
                    <input
                      type="date"
                      value={pdfStartDate}
                      onChange={(e) => setPdfStartDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">To Date</label>
                    <input
                      type="date"
                      value={pdfEndDate}
                      onChange={(e) => setPdfEndDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setPdfDialogOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadDeliverySettlementsPdf}
                disabled={pdfGenerating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{pdfGenerating ? 'Generating PDF...' : 'Download Statement PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
