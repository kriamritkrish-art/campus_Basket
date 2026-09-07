'use client';

import React, { useEffect, useState } from 'react';
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
  X,
  Filter,
  Layers,
  Scale,
  RefreshCw,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

type AdminTab = 'OVERVIEW' | 'TRANSACTIONS' | 'REFUNDS' | 'SETTLEMENTS' | 'COD' | 'LEDGER';

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [loading, setLoading] = useState(true);

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

  // COD Reconciliation State
  const [codCollections, setCodCollections] = useState<any[]>([]);
  const [selectedCodCollection, setSelectedCodCollection] = useState<any>(null);
  const [reconcileAmount, setReconcileAmount] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [reconciling, setReconciling] = useState(false);

  // Financial Ledger State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');

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
      } else if (activeTab === 'COD') {
        const res = await apiRequest('/api/admin/payments/cod');
        if (res.success) setCodCollections(res.data || []);
      } else if (activeTab === 'LEDGER') {
        let query = '/api/admin/payments/ledger';
        if (ledgerTypeFilter !== 'ALL') query += `?entryType=${ledgerTypeFilter}`;
        const res = await apiRequest(query);
        if (res.success) setLedgerEntries(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load tab data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, serviceFilter, paymentStatusFilter, refundStatusFilter, settlementStatusFilter, ledgerTypeFilter]);

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
              subtitle={`${overviewMetrics?.totalOrdersCount || 0} total platform orders`}
              icon={IndianRupee}
              color="green"
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
                    <td className="py-3 px-3 font-bold text-red-600">₹{Number(r.totalAmount).toFixed(2)}</td>
                    <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{r.cancellationReason || 'Student cancellation request'}</td>
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
      {/* SECTION 5: COD RUNNER RECONCILIATION                     */}
      {/* ======================================================== */}
      {activeTab === 'COD' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Cash on Delivery Reconciliation</h3>
              <p className="text-xs text-gray-500">Runner vault collections, expected vs collected verification, mismatch logging.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-extrabold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Delivery Runner</th>
                  <th className="py-3 px-3">Expected Amount</th>
                  <th className="py-3 px-3">Amount Collected</th>
                  <th className="py-3 px-3">Difference</th>
                  <th className="py-3 px-3">Collection Status</th>
                  <th className="py-3 px-3">Reconciliation</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {codCollections.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">{c.order?.orderNumber || c.orderId}</td>
                    <td className="py-3 px-3 font-medium text-gray-900">{c.deliveryBoy?.fullName || 'Assigned Runner'}</td>
                    <td className="py-3 px-3 font-bold text-gray-800">₹{Number(c.amountExpected).toFixed(2)}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">₹{Number(c.amountCollected).toFixed(2)}</td>
                    <td className={`py-3 px-3 font-bold ${Number(c.difference) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      ₹{Number(c.difference).toFixed(2)}
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
                      <button
                        onClick={() => {
                          setSelectedCodCollection(c);
                          setReconcileAmount(String(c.amountCollected));
                          setReconcileNotes(c.reconciliationNotes || '');
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Reconcile
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
                <strong className="text-red-600 font-bold text-sm">₹{Number(selectedRefundOrder.totalAmount).toFixed(2)}</strong>
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
                <strong className="text-gray-900">{selectedCodCollection.deliveryBoy?.fullName}</strong>
              </div>
              <div>
                <span className="text-gray-500">Expected Amount:</span>{' '}
                <strong className="text-gray-900 font-bold">₹{Number(selectedCodCollection.amountExpected).toFixed(2)}</strong>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Actual Amount Collected (₹):</label>
                <input
                  type="number"
                  value={reconcileAmount}
                  onChange={(e) => setReconcileAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-900"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Reconciliation Notes:</label>
                <textarea
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="Verified and counted against physical cash vault drop."
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-800"
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
    </div>
  );
}
