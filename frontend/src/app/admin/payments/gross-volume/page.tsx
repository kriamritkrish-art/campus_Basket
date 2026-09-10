'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, getApiBase } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import {
  ShieldCheck,
  ArrowLeft,
  Download,
  Printer,
  RefreshCw,
  Search,
  Calendar,
  IndianRupee,
  CreditCard,
  Banknote,
  RotateCcw,
  XCircle,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronRight,
  User,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Copy,
  Check,
  X,
  Building2,
  Truck,
  Store,
  ChevronLeft,
  Bell,
  LogOut,
  Info,
  Shield,
  FileSpreadsheet,
  AlertTriangle,
  Zap,
  Activity,
  BookOpen,
  HelpCircle,
  GitMerge,
  ArrowDown,
  ArrowUpRight
} from 'lucide-react';


export interface PaymentAttempt {
  attemptId: string;
  razorpayPaymentId: string;
  eventType: string;
  status: string;
  time: string;
}

export interface LedgerOrder {
  id: string;
  orderNumber: string;
  rawOrderNumber: string;
  createdAt: string;
  date: string;
  orderDate: string;
  formattedDate: string;
  formattedTime: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentEmail: string;
  studentRoom: string;
  studentHall: string;
  providerId: string;
  providerName: string;
  deliveryBoyId: string | null;
  deliveryBoyName: string;
  serviceType: string;
  status: string;
  providerAccepted: boolean;
  itemsSummary: string;
  itemsCount: number;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  grossAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  onlinePaid: number;
  onlineAmount: number;
  codAdvance: number;
  codCash: number;
  codAmount: number;
  commissionRate: number;
  commissionAmount: number;
  // ── Razorpay / Reconciliation Fields ──────────────────────────────────────
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpayEventId: string | null;
  capturedAt: string | null;
  failureReason: string | null;
  failureCode?: string | null;
  paymentFailureReason?: string;
  paymentFailureCode?: string | null;
  reconciliationTimestamp?: string | null;
  paymentAttemptCount: number;
  paymentAttempts: PaymentAttempt[];
  reconciliationStatus: string;
  paymentReconciliationStatus: string;
  reconciledAt: string | null;
  reconciledBy: string | null;
  // ── Settlement Fields ──────────────────────────────────────────────────────
  settlementStatus: string;
  providerPayable: number;
  // ── Refund Fields ──────────────────────────────────────────────────────────
  cancellationRefund: {
    status: 'UNCLAIMED' | 'CLAIMED' | 'DISTRIBUTED' | 'NOT_APPLICABLE';
    eligibleAmount: number;
    claimedAmount: number;
    distributedAmount: number;
    deduction: number;
    reason: string;
  };
  returnRefund: {
    status: 'UNCLAIMED' | 'CLAIMED' | 'DISTRIBUTED' | 'REJECTED' | 'NOT_APPLICABLE';
    eligibleAmount: number;
    claimedAmount: number;
    distributedAmount: number;
    deduction: number;
    reasonType: string | null;
    reasonDetails: string | null;
  };
  refundTotal: number;
  finalCampusBasketEarning: number;
}

export interface LedgerMetrics {
  totalOrders: number;
  grossOrderValue: number;
  onlinePaid: number;
  codAdvance: number;
  codCash: number;
  refundsDistributed: number;
  finalCampusBasketEarning: number;
  reconciliationRequired: number;
}


export default function OrderPaymentSettlementLedgerPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<LedgerOrder[]>([]);
  const [metrics, setMetrics] = useState<LedgerMetrics>({
    totalOrders: 0,
    grossOrderValue: 0,
    onlinePaid: 0,
    codAdvance: 0,
    codCash: 0,
    refundsDistributed: 0,
    finalCampusBasketEarning: 0,
    reconciliationRequired: 0
  });


  const [distinctProviders, setDistinctProviders] = useState<string[]>([]);
  const [distinctDeliveryBoys, setDistinctDeliveryBoys] = useState<string[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [refundStatusFilter, setRefundStatusFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [reconciliationStatusFilter, setReconciliationStatusFilter] = useState('ALL');
  const [paymentFailureReasonFilter, setPaymentFailureReasonFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');

  const [deliveryBoyFilter, setDeliveryBoyFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');

  // Documentation & Flowchart interactive tab state
  const [docTab, setDocTab] = useState<'FLOWCHARTS' | 'GLOSSARY' | 'PROTOCOLS'>('FLOWCHARTS');
  const [docOpen, setDocOpen] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // UI Interactive States
  const [selectedOrder, setSelectedOrder] = useState<LedgerOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [expandedMobileOrderId, setExpandedMobileOrderId] = useState<string | null>(null);

  // Refund processing state in drawer
  const [distributeAmountInput, setDistributeAmountInput] = useState<number>(0);
  const [distributeNotesInput, setDistributeNotesInput] = useState<string>('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);
  const [refundErrorMsg, setRefundErrorMsg] = useState<string | null>(null);

  // Sync date presets
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
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toDateStr(m));
      setEndDate(toDateStr(now));
    }
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setServiceTypeFilter('ALL');
    setPaymentMethodFilter('ALL');
    setPaymentStatusFilter('ALL');
    setRefundStatusFilter('ALL');
    setOrderStatusFilter('ALL');
    setReconciliationStatusFilter('ALL');
    setPaymentFailureReasonFilter('ALL');
    setProviderFilter('ALL');

    setDeliveryBoyFilter('ALL');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  // Fetch Data from API
  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceTypeFilter !== 'ALL') params.append('serviceType', serviceTypeFilter);
      if (paymentMethodFilter !== 'ALL') params.append('paymentMethod', paymentMethodFilter);
      if (paymentStatusFilter !== 'ALL') params.append('paymentStatus', paymentStatusFilter);
      if (refundStatusFilter !== 'ALL') params.append('refundStatus', refundStatusFilter);
      if (orderStatusFilter !== 'ALL') params.append('orderStatus', orderStatusFilter);
      if (reconciliationStatusFilter !== 'ALL') params.append('reconciliationStatus', reconciliationStatusFilter);
      if (paymentFailureReasonFilter !== 'ALL') params.append('paymentFailureReason', paymentFailureReasonFilter);
      if (providerFilter !== 'ALL') params.append('providerId', providerFilter);
      if (deliveryBoyFilter !== 'ALL') params.append('deliveryBoyId', deliveryBoyFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sortBy) params.append('sortBy', sortBy);

      const res = await apiRequest(`/api/admin/payments/gross-volume?${params.toString()}`);
      if (res.success && res.data) {
        const fetchedOrders: LedgerOrder[] = res.data.orders || [];
        setOrders(fetchedOrders);
        if (res.data.metrics) {
          setMetrics({
            totalOrders: res.data.metrics.totalOrders ?? fetchedOrders.length,
            grossOrderValue: res.data.metrics.grossOrderValue ?? 0,
            onlinePaid: res.data.metrics.onlinePaid ?? 0,
            codAdvance: res.data.metrics.codAdvance ?? 0,
            codCash: res.data.metrics.codCash ?? 0,
            refundsDistributed: res.data.metrics.refundsDistributed ?? 0,
            finalCampusBasketEarning: res.data.metrics.finalCampusBasketEarning ?? 0,
            reconciliationRequired: res.data.metrics.reconciliationRequired ?? 0
          });
        }
        if (res.data.distinctProviders) setDistinctProviders(res.data.distinctProviders);
        if (res.data.distinctDeliveryBoys) setDistinctDeliveryBoys(res.data.distinctDeliveryBoys);
      }
    } catch (err) {
      console.error('[Ledger] Failed to fetch ledger orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [
    startDate,
    endDate,
    serviceTypeFilter,
    paymentMethodFilter,
    paymentStatusFilter,
    refundStatusFilter,
    orderStatusFilter,
    reconciliationStatusFilter,
    paymentFailureReasonFilter,
    providerFilter,
    deliveryBoyFilter,
    sortBy
  ]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLedgerData();
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Copy Order ID to clipboard
  const handleCopyOrderId = (orderNum: string) => {
    navigator.clipboard.writeText(orderNum.replace('#', ''));
    setCopiedOrderId(orderNum);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Open Manage Drawer for an Order
  const handleOpenDrawer = (order: LedgerOrder) => {
    setSelectedOrder(order);
    const eligibleTotal =
      (order.cancellationRefund.status === 'CLAIMED' ? order.cancellationRefund.eligibleAmount : 0) +
      (order.returnRefund.status === 'CLAIMED' ? order.returnRefund.eligibleAmount : 0);
    setDistributeAmountInput(eligibleTotal || 0);
    setDistributeNotesInput('');
    setRefundSuccessMsg(null);
    setRefundErrorMsg(null);
    setDrawerOpen(true);
  };

  // Process and Distribute Refund Action
  const handleProcessRefund = async () => {
    if (!selectedOrder) return;
    const maxAllowed =
      (selectedOrder.cancellationRefund.status === 'CLAIMED' ? selectedOrder.cancellationRefund.eligibleAmount : 0) +
      (selectedOrder.returnRefund.status === 'CLAIMED' ? selectedOrder.returnRefund.eligibleAmount : 0);

    if (distributeAmountInput <= 0) {
      setRefundErrorMsg('Please enter a valid refund amount greater than ₹0.');
      return;
    }
    if (distributeAmountInput > maxAllowed) {
      setRefundErrorMsg(`Amount exceeds maximum eligible refund of ₹${maxAllowed.toFixed(2)}.`);
      return;
    }

    setProcessingRefund(true);
    setRefundErrorMsg(null);
    setRefundSuccessMsg(null);

    try {
      const res = await apiRequest('/api/admin/payments/refunds/process', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder.id,
          amount: distributeAmountInput,
          notes: distributeNotesInput || 'Refund verified and distributed by admin via Settlement Ledger'
        })
      });

      if (res.success) {
        setRefundSuccessMsg(`Refund of ₹${distributeAmountInput.toFixed(2)} successfully recorded as DISTRIBUTED.`);
        await fetchLedgerData();
        // Update currently opened order snapshot
        setSelectedOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            paymentStatus: 'REFUNDED',
            cancellationRefund:
              prev.cancellationRefund.status === 'CLAIMED'
                ? { ...prev.cancellationRefund, status: 'DISTRIBUTED', distributedAmount: distributeAmountInput }
                : prev.cancellationRefund,
            returnRefund:
              prev.returnRefund.status === 'CLAIMED'
                ? { ...prev.returnRefund, status: 'DISTRIBUTED', distributedAmount: distributeAmountInput }
                : prev.returnRefund,
            refundTotal: distributeAmountInput,
            finalCampusBasketEarning:
              prev.status === 'CANCELLED'
                ? prev.cancellationRefund.deduction
                : prev.commissionAmount + prev.deliveryFee
          };
        });
      } else {
        setRefundErrorMsg(res.message || 'Failed to process refund.');
      }
    } catch (err: any) {
      setRefundErrorMsg(err?.message || 'Server error while processing refund.');
    } finally {
      setProcessingRefund(false);
    }
  };

  // Export PDF: ONLY filtered orders
  const handleExportPdf = async () => {
    if (orders.length === 0) return;
    setExportingPdf(true);
    try {
      const base = getApiBase();
      const token = typeof window !== 'undefined' ? localStorage.getItem('nit_token') : null;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceTypeFilter !== 'ALL') params.append('serviceType', serviceTypeFilter);
      if (paymentMethodFilter !== 'ALL') params.append('paymentMethod', paymentMethodFilter);
      if (paymentStatusFilter !== 'ALL') params.append('paymentStatus', paymentStatusFilter);
      if (refundStatusFilter !== 'ALL') params.append('refundStatus', refundStatusFilter);
      if (orderStatusFilter !== 'ALL') params.append('orderStatus', orderStatusFilter);
      if (providerFilter !== 'ALL') params.append('providerId', providerFilter);
      if (deliveryBoyFilter !== 'ALL') params.append('deliveryBoyId', deliveryBoyFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`${base}/api/admin/payments/gross-volume/pdf?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Backend PDF endpoint error');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CampusBasket-Order-Settlement-Report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 500);
    } catch (err) {
      console.warn('[PDF] Falling back to browser landscape print view:', err);
      window.print();
    } finally {
      setExportingPdf(false);
      setExportMenuOpen(false);
    }
  };

  // Export CSV: ONLY filtered orders
  const handleExportCsv = () => {
    if (orders.length === 0) return;
    setExportingCsv(true);

    const headers = [
      'Order Date',
      'Order ID',
      'Student Name',
      'Student Email',
      'Student Roll',
      'Student Room & Hall',
      'Provider',
      'Delivery Boy',
      'Total Order Amount (INR)',
      'Payment Method',
      'Online Paid (INR)',
      'COD Advance Paid (INR)',
      'COD Cash Collected (INR)',
      'Payment Status',
      'Cancellation Refund Status',
      'Cancellation Refund Amount (INR)',
      'Return Refund Status',
      'Return Refund Amount (INR)',
      'Total Refund Distributed (INR)',
      'Final Campus Basket Earning (INR)',
      'Items Summary'
    ];

    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = orders.map((o) => [
      escapeCsv(o.orderDate),
      escapeCsv(o.orderNumber),
      escapeCsv(o.studentName),
      escapeCsv(o.studentEmail),
      escapeCsv(o.studentRoll),
      escapeCsv(`${o.studentRoom}, ${o.studentHall}`),
      escapeCsv(o.providerName),
      escapeCsv(o.deliveryBoyName),
      o.totalAmount.toFixed(2),
      escapeCsv(o.paymentMethod),
      o.onlinePaid.toFixed(2),
      o.codAdvance.toFixed(2),
      o.codCash.toFixed(2),
      escapeCsv(o.paymentStatus),
      escapeCsv(o.cancellationRefund.status),
      (o.cancellationRefund.distributedAmount || o.cancellationRefund.claimedAmount || 0).toFixed(2),
      escapeCsv(o.returnRefund.status),
      (o.returnRefund.distributedAmount || o.returnRefund.claimedAmount || 0).toFixed(2),
      o.refundTotal.toFixed(2),
      o.finalCampusBasketEarning.toFixed(2),
      escapeCsv(o.itemsSummary)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CampusBasket-Order-Settlement-Ledger-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportingCsv(false);
    setExportMenuOpen(false);
  };

  // Export Excel Table
  const handleExportExcel = () => {
    handleExportCsv();
  };

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const currentOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, currentPage]);

  // Helper helper text
  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    datePreset !== 'ALL' ||
    startDate !== '' ||
    endDate !== '' ||
    serviceTypeFilter !== 'ALL' ||
    paymentMethodFilter !== 'ALL' ||
    paymentStatusFilter !== 'ALL' ||
    paymentFailureReasonFilter !== 'ALL' ||
    refundStatusFilter !== 'ALL' ||
    orderStatusFilter !== 'ALL' ||
    reconciliationStatusFilter !== 'ALL' ||
    providerFilter !== 'ALL' ||
    deliveryBoyFilter !== 'ALL';


  const exportHelperText = useMemo(() => {
    if (orders.length === 0) return 'No matching orders to export.';
    if (isAnyFilterActive) return `Exporting ${orders.length} filtered ${orders.length === 1 ? 'order' : 'orders'}`;
    return `Exporting all ${orders.length} orders`;
  }, [orders.length, isAnyFilterActive]);

  // Payment badge helper — CAPTURED is the canonical successful status
  // Maps legacy SUCCESS/PAID to CAPTURED for display
  const renderPaymentBadge = (status: string) => {
    switch (status) {
      case 'CAPTURED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">CAPTURED</span>;
      case 'PAID':
      case 'SUCCESS':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">CAPTURED</span>;
      case 'AUTHORIZED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">AUTHORIZED</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">FAILED</span>;
      case 'FAILED_ACCOUNT_DETAILS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-700 flex-shrink-0" />
            <span>FAILED (ACCT)</span>
          </span>
        );
      case 'PARTIALLY_PAID':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">PARTIAL</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">PENDING</span>;
      case 'REFUNDED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">REFUNDED</span>;
      case 'RECONCILIATION_REQUIRED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300">⚠ REVIEW</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  // Payment failure reason badge
  const renderFailureReasonBadge = (reason?: string | null, code?: string | null) => {
    const r = (reason || 'N/A').toUpperCase();
    switch (r) {
      case 'BANK/ACCOUNT DETAILS REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300 whitespace-nowrap">
            <AlertTriangle className="w-3 h-3 text-amber-700 flex-shrink-0" />
            <span>ACCOUNT REQ</span>
          </span>
        );
      case 'INSUFFICIENT FUNDS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-900 border border-yellow-300 whitespace-nowrap">
            LOW BALANCE
          </span>
        );
      case 'PAYMENT DECLINED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 whitespace-nowrap">
            DECLINED
          </span>
        );
      case 'PAYMENT TIMEOUT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 whitespace-nowrap">
            TIMEOUT
          </span>
        );
      case 'PAYMENT CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap">
            CANCELLED
          </span>
        );
      case 'RISK/SECURITY DECLINE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-950 border border-red-300 whitespace-nowrap">
            RISK DECLINE
          </span>
        );
      case 'RAZORPAY ERROR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
            GATEWAY ERR
          </span>
        );
      case 'NETWORK/TECHNICAL ERROR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-300 whitespace-nowrap">
            NETWORK ERR
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">
            UNKNOWN
          </span>
        );
      case 'N/A':
      default:
        return <span className="text-slate-300 text-[10px] font-medium">—</span>;
    }
  };


  const renderRefundStatusBadge = (status: string, amount: number) => {
    switch (status) {
      case 'DISTRIBUTED':
        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-tight">
              DISTRIBUTED
            </span>
            <span className="text-[11px] font-bold text-emerald-700 mt-0.5">₹{amount.toFixed(2)}</span>
          </div>
        );
      case 'CLAIMED':
        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-tight">
              CLAIMED
            </span>
            <span className="text-[11px] font-bold text-amber-800 mt-0.5">₹{amount.toFixed(2)}</span>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
              REJECTED
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">₹0.00</span>
          </div>
        );
      case 'UNCLAIMED':
        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
              UNCLAIMED
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">₹0.00</span>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-medium">—</span>
            <span className="text-[10px] text-slate-400">N/A</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col">
      {/* =========================================================================
          1. DEDICATED FULL-WIDTH TOP HEADER
      ========================================================================= */}
      <header className="w-full bg-[#FFFFFF] border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-[#0F172A] tracking-wider uppercase">CAMPUS BASKET</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  FINANCIAL LEDGER
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">Admin Financial Control</p>
            </div>
          </div>

          {/* Right Navigation & Profile */}
          <div className="flex items-center gap-3">
            {/* Notifications Button */}
            <button
              onClick={() => router.push('/admin/system/audit')}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 relative cursor-pointer"
              title="System Audit & Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>

            {/* Admin Profile Pill */}
            <div className="hidden md:flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full bg-slate-100 border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-bold">
                {user?.admin?.fullName ? user.admin.fullName.charAt(0) : (user?.email ? user.email.charAt(0).toUpperCase() : 'A')}
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-800 leading-tight">
                  {user?.admin?.fullName || user?.username || user?.email || 'Institutional Administrator'}
                </p>
                <p className="text-[9px] text-slate-500 leading-none">Super Admin</p>
              </div>
            </div>

            {/* Back to Admin Dashboard Button */}
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-50 hover:border-slate-400 font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back to Admin Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          PAGE MAIN CONTENT
      ========================================================================= */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* =========================================================================
            2. PAGE TITLE & SUBTITLE
        ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Order Payment &amp; Settlement Ledger
              </h1>
            </div>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              Complete order-wise payment, refund and final earning records
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Track every order from payment collection through refund settlement and final Campus Basket earnings.
              (Excluding Institution Fee)
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchLedgerData}
              disabled={loading}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Reload Ledger Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export Dropdown Group */}
            <div className="relative">
              <div className="flex items-center">
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf || orders.length === 0}
                  className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-l-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Generate Landscape A4 PDF Report of currently filtered orders"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{exportingPdf ? 'Exporting PDF...' : 'Export PDF'}</span>
                </button>
                <button
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  disabled={orders.length === 0}
                  className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-r-xl border-l border-slate-700 text-xs transition cursor-pointer disabled:opacity-50"
                  title="More Export Formats"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Export Menu Dropdown */}
              {exportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40">
                  <button
                    onClick={handleExportPdf}
                    disabled={exportingPdf}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>PDF Report (A4 Landscape)</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    disabled={exportingCsv}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>CSV Statement</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel Spreadsheet</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. TOP SUMMARY CARDS (NO INSTITUTION FEE ANYWHERE)
        ========================================================================= */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {/* 1. TOTAL ORDERS */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL ORDERS</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#0F172A]">{metrics.totalOrders}</span>
              <span className="text-xs text-slate-500 ml-1 font-semibold">Orders</span>
            </div>
          </div>

          {/* 2. GROSS ORDER VALUE */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">GROSS ORDER VALUE</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#0F172A]">₹{metrics.grossOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* 3. ONLINE PAID */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ONLINE PAID</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#0284C7]">₹{metrics.onlinePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* 4. COD ADVANCE */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">COD ADVANCE</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#6366F1]">₹{metrics.codAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* 5. COD CASH */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">COD CASH</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#8B5CF6]">₹{metrics.codCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* 6. REFUNDS DISTRIBUTED */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">REFUNDS DISTRIBUTED</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#D97706]">₹{metrics.refundsDistributed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* 7. NET CAMPUS BASKET RECEIVED */}
          <div className="bg-white p-3.5 rounded-xl border-2 border-emerald-500 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">CAMPUS BASKET EARNING</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-700">₹{metrics.finalCampusBasketEarning.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-1 text-[9px] font-semibold text-emerald-600/80 leading-tight">
              Student Paid − Refunds Distributed
            </div>
          </div>

          {/* 8. RECONCILIATION REQUIRED (clickable red card) */}
          {metrics.reconciliationRequired > 0 && (
            <button
              onClick={() => setReconciliationStatusFilter('PENDING')}
              className="bg-orange-50 p-3.5 rounded-xl border-2 border-orange-400 shadow-xs flex flex-col justify-between hover:bg-orange-100 transition cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-800">RECONCILIATION REQUIRED</span>
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
              </div>
              <div className="mt-1">
                <span className="text-xl sm:text-2xl font-black text-orange-700">{metrics.reconciliationRequired}</span>
                <span className="text-xs text-orange-600 ml-1 font-semibold">Orders</span>
              </div>
              <div className="mt-1 text-[9px] font-semibold text-orange-600/80 leading-tight">
                Tap to filter → Admin review needed
              </div>
            </button>
          )}
        </section>

        {/* =========================================================================
            4. SEARCH & FILTER BAR
        ========================================================================= */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          {/* Top Row: Search + Date Presets */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Live Search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Student, Email, Roll No., Order ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Preset Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {(['ALL', 'TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'CUSTOM'] as const).map((preset) => {
                const labels: Record<string, string> = {
                  ALL: 'All Time',
                  TODAY: 'Today',
                  YESTERDAY: 'Yesterday',
                  WEEK: 'Last 7 Days',
                  MONTH: 'This Month',
                  CUSTOM: 'Custom'
                };
                const isActive = datePreset === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {labels[preset]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Pickers Row (if CUSTOM preset selected) */}
          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-3 pt-1 border-t border-slate-100 flex-wrap">
              <span className="text-xs font-bold text-slate-600">Custom Date Range:</span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-500">FROM:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-500">TO:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          )}

          {/* Bottom Dropdowns Row: 9 Specific Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5 pt-2 border-t border-slate-100">
            {/* 1. Service Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SERVICE</label>
              <select
                value={serviceTypeFilter}
                onChange={(e) => {
                  setServiceTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="ALL">All Services</option>
                <option value="FOOD">Food &amp; Meals</option>
                <option value="FRESH_PRODUCE">Fresh Fruits</option>
                <option value="LAUNDRY">Express Laundry</option>
                <option value="STATIONERY">Stationery &amp; Essentials</option>
              </select>
            </div>

            {/* 2. Payment Method */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">PAYMENT</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="ONLINE">Online</option>
                <option value="COD">COD</option>
              </select>
            </div>

            {/* 3. Payment Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">PAY STATUS</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="CAPTURED">Captured</option>
                <option value="PAID">Paid (Legacy)</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="FAILED">Failed</option>
                <option value="FAILED_ACCOUNT_DETAILS">Failed (Account Required)</option>
                <option value="PARTIALLY_REFUNDED">Partial Refund</option>
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
                <option value="RECONCILIATION_REQUIRED">Review Required</option>
              </select>
            </div>

            {/* 3b. Payment Failure Reason */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">FAILURE REASON</label>
              <select
                value={paymentFailureReasonFilter}
                onChange={(e) => {
                  setPaymentFailureReasonFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="FAILED">Failed (Any)</option>
                <option value="FAILED_ACCOUNT_DETAILS">Failed — Account Details Required</option>
                <option value="PAYMENT_DECLINED">Payment Declined</option>
                <option value="PAYMENT_TIMEOUT">Payment Timeout</option>
                <option value="RAZORPAY_ERROR">Razorpay Error</option>
                <option value="NETWORK_TECHNICAL_ERROR">Network/Technical Error</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>

            {/* 4. Refund Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">REFUND STATUS</label>
              <select
                value={refundStatusFilter}
                onChange={(e) => {
                  setRefundStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="NO_REFUND">No Refund</option>
                <option value="UNCLAIMED">Unclaimed</option>
                <option value="CLAIMED">Claimed</option>
                <option value="DISTRIBUTED">Distributed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* 5. Order Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ORDER STATUS</label>
              <select
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>

            {/* 6. Provider */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">PROVIDER</label>
              <select
                value={providerFilter}
                onChange={(e) => {
                  setProviderFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer truncate"
              >
                <option value="ALL">All Providers</option>
                {distinctProviders.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Delivery Boy */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">DELIVERY BOY</label>
              <select
                value={deliveryBoyFilter}
                onChange={(e) => {
                  setDeliveryBoyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer truncate"
              >
                <option value="ALL">All Delivery Boys</option>
                {distinctDeliveryBoys.map((db) => (
                  <option key={db} value={db}>
                    {db}
                  </option>
                ))}
              </select>
            </div>

            {/* 8. Reconciliation Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">RECONCILIATION</label>
              <select
                value={reconciliationStatusFilter}
                onChange={(e) => {
                  setReconciliationStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="NOT_REQUIRED">Not Required</option>
                <option value="AUTO_RECONCILED">Auto Reconciled</option>
                <option value="MANUALLY_RECONCILED">Manually Reconciled</option>
                <option value="PENDING">Pending</option>
                <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
                <option value="PAYMENT_NOT_FOUND">Not Found</option>
                <option value="CUSTOMER_DEBIT_REVIEW">Customer Debit Review</option>
              </select>
            </div>

            {/* 9. Sort By */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SORT BY</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="date_desc">Newest Order</option>
                <option value="date_asc">Oldest Order</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
                <option value="earning_desc">Highest CB Earning</option>
              </select>
            </div>
          </div>

          {/* Action Row: Reset + Helper text for PDF */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">{exportHelperText}</span>
              {isAnyFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Showing page {currentPage} of {totalPages} ({orders.length} total matched)
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. MAIN FINANCIAL LEDGER TABLE (ONE ROW PER ORDER)
        ========================================================================= */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Desktop & Tablet Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              {/* Sticky Header */}
              <thead>
                <tr className="bg-[#0F172A] text-white border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider select-none sticky top-16 z-10">
                  <th className="py-3 px-3.5 whitespace-nowrap">ORDER DATE</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">ORDER ID</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">STUDENT</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">PROVIDER</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">DELIVERY BOY</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">TOTAL AMOUNT</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">PAYMENT METHOD</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">ONLINE PAID</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">COD ADVANCE</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">COD CASH</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">PAYMENT STATUS</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">FAILURE REASON</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">RECONCILIATION</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">CANCEL REFUND</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">RETURN REFUND</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">REFUND TOTAL</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">NET CB RECEIVED</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={17} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                        <span className="text-xs font-semibold">Loading ledger records...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">No orders found</h4>
                        <p className="text-xs text-slate-500">Try changing your filters or search terms.</p>
                        {isAnyFilterActive && (
                          <button
                            onClick={handleResetFilters}
                            className="mt-2 px-3 py-1.5 bg-[#0F172A] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((ord, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={ord.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isEven ? 'bg-white' : 'bg-slate-50/40'
                        }`}
                      >
                        {/* 1. Order Date */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 leading-tight">{ord.formattedDate}</div>
                          <div className="text-[11px] text-slate-500">{ord.formattedTime}</div>
                        </td>

                        {/* 2. Order ID */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-slate-900 text-xs">{ord.orderNumber}</span>
                            <button
                              onClick={() => handleCopyOrderId(ord.orderNumber)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Copy Order ID"
                            >
                              {copiedOrderId === ord.orderNumber ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">
                            {ord.serviceType.replace('_', ' ')}
                          </div>
                        </td>

                        {/* 3. Student */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 leading-tight">{ord.studentName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{ord.studentEmail}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Roll: {ord.studentRoll} • {ord.studentHall}
                          </div>
                        </td>

                        {/* 4. Provider */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{ord.providerName}</span>
                        </td>

                        {/* 5. Delivery Boy */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={
                              ord.deliveryBoyName === 'Not Assigned'
                                ? 'text-slate-400 italic text-[11px]'
                                : 'font-semibold text-slate-800'
                            }
                          >
                            {ord.deliveryBoyName}
                          </span>
                        </td>

                        {/* 6. Total Order Amount */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-black text-slate-900 text-sm">
                          ₹{ord.totalAmount.toFixed(2)}
                        </td>

                        {/* 7. Payment Method */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {ord.paymentMethod === 'CASH_ON_DELIVERY' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                              COD
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black bg-sky-100 text-sky-800 border border-sky-200">
                              ONLINE
                            </span>
                          )}
                        </td>

                        {/* 8. Online Paid */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-semibold text-[#0284C7]">
                          {ord.onlinePaid > 0 ? `₹${ord.onlinePaid.toFixed(2)}` : '₹0.00'}
                        </td>

                        {/* 9. COD Advance Paid */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-semibold">
                          {ord.paymentMethod === 'ONLINE' ? (
                            <span className="text-slate-300 font-normal text-xs">N/A</span>
                          ) : ord.codAdvance > 0 ? (
                            <span className="text-[#6366F1] font-bold">₹{ord.codAdvance.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </td>

                        {/* 10. COD Cash */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-semibold">
                          {ord.paymentMethod === 'ONLINE' ? (
                            <span className="text-slate-300 font-normal text-xs">N/A</span>
                          ) : ord.codCash > 0 ? (
                            <span className="text-[#8B5CF6] font-bold">₹{ord.codCash.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </td>

                        {/* 11. Payment Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {renderPaymentBadge(ord.paymentStatus)}
                        </td>

                        {/* 11b. Payment Failure Reason */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {renderFailureReasonBadge(
                            ord.paymentFailureReason || ord.failureReason,
                            ord.paymentFailureCode || ord.failureCode
                          )}
                        </td>

                        {/* 11c. Reconciliation Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {(() => {
                            const rs = ord.reconciliationStatus || 'NOT_REQUIRED';
                            if (rs === 'NOT_REQUIRED') return <span className="text-slate-300 text-[10px] font-medium">—</span>;
                            if (rs === 'AUTO_RECONCILED') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">AUTO ✓</span>;
                            if (rs === 'MANUALLY_RECONCILED') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">MANUAL ✓</span>;
                            if (rs === 'PENDING') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">PENDING</span>;
                            if (rs === 'AMOUNT_MISMATCH') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-300">⚠ MISMATCH</span>;
                            if (rs === 'PAYMENT_NOT_FOUND') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-300">NOT FOUND</span>;
                            if (rs === 'CUSTOMER_DEBIT_REVIEW') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-300">DEBIT REVIEW</span>;
                            return <span className="text-[10px] text-slate-500">{rs}</span>;
                          })()}
                        </td>

                        {/* 12. Cancellation Refund */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {renderRefundStatusBadge(
                            ord.cancellationRefund.status,
                            ord.cancellationRefund.distributedAmount || ord.cancellationRefund.claimedAmount
                          )}
                        </td>

                        {/* 13. Return Refund */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {renderRefundStatusBadge(
                            ord.returnRefund.status,
                            ord.returnRefund.distributedAmount || ord.returnRefund.claimedAmount
                          )}
                        </td>

                        {/* 14. Refund Total */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-slate-800">
                          {ord.refundTotal > 0 ? (
                            <span className="text-amber-700">₹{ord.refundTotal.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </td>

                        {/* 15. Net Campus Basket Received */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-black text-emerald-700 text-sm">₹{ord.finalCampusBasketEarning.toFixed(2)}</span>
                            {ord.refundTotal > 0 && (
                              <span className="text-[9px] text-slate-400 font-medium">
                                ₹{ord.totalAmount.toFixed(2)} − ₹{ord.refundTotal.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 16. Actions */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleOpenDrawer(ord)}
                            className="px-3 py-1 bg-slate-100 hover:bg-[#0F172A] hover:text-white text-slate-800 font-bold text-xs rounded-lg transition border border-slate-300 shadow-2xs cursor-pointer"
                          >
                            View / Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Expandable Financial Cards */}
          <div className="md:hidden divide-y divide-slate-200">
            {loading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                <span className="text-xs font-semibold">Loading ledger records...</span>
              </div>
            ) : currentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-xs font-bold text-slate-800">No orders found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Try adjusting your filters.</p>
              </div>
            ) : (
              currentOrders.map((ord) => {
                const isExpanded = expandedMobileOrderId === ord.id;
                return (
                  <div key={ord.id} className="p-4 space-y-2.5">
                    {/* Collapsed Top Row: Order ID, Student, Total, Payment Status, CB Earning */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-slate-900">{ord.orderNumber}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{ord.serviceType}</span>
                        </div>
                        <p className="font-bold text-xs text-slate-800 mt-0.5">{ord.studentName}</p>
                        <p className="text-[10px] text-slate-500">{ord.orderDate}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-mono font-black text-sm text-slate-900">₹{ord.totalAmount.toFixed(2)}</p>
                        <div className="mt-1 flex items-center justify-end gap-1">
                          {renderPaymentBadge(ord.paymentStatus)}
                        </div>
                        <p className="text-[11px] font-bold text-emerald-700 mt-1 font-mono">
                          CB: ₹{ord.finalCampusBasketEarning.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Expand/Collapse Trigger */}
                    <button
                      onClick={() => setExpandedMobileOrderId(isExpanded ? null : ord.id)}
                      className="w-full py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 bg-slate-50 rounded border border-slate-200"
                    >
                      <span>{isExpanded ? 'Hide Full Breakdown' : 'Show Full Breakdown'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Expanded Financial Details */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 text-xs space-y-2 text-slate-700 bg-slate-50/50 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Provider:</span>
                          <span className="font-semibold">{ord.providerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Delivery Boy:</span>
                          <span className="font-semibold">{ord.deliveryBoyName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payment Method:</span>
                          <span className="font-bold">{ord.paymentMethod}</span>
                        </div>
                        {(ord.paymentFailureReason || ord.failureReason) && ord.paymentFailureReason !== 'N/A' && (
                          <div className="flex justify-between items-center py-1 px-2 rounded bg-amber-50 border border-amber-200">
                            <span className="text-[11px] font-bold text-amber-900">Failure Reason:</span>
                            {renderFailureReasonBadge(ord.paymentFailureReason || ord.failureReason, ord.paymentFailureCode || ord.failureCode)}
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-500">Online Paid:</span>
                          <span className="font-mono font-semibold text-[#0284C7]">₹{ord.onlinePaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">COD Advance:</span>
                          <span className="font-mono font-semibold text-[#6366F1]">
                            {ord.paymentMethod === 'ONLINE' ? 'N/A' : `₹${ord.codAdvance.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">COD Cash:</span>
                          <span className="font-mono font-semibold text-[#8B5CF6]">
                            {ord.paymentMethod === 'ONLINE' ? 'N/A' : `₹${ord.codCash.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cancellation Refund:</span>
                          <span>{ord.cancellationRefund.status} (₹{ord.cancellationRefund.distributedAmount || ord.cancellationRefund.claimedAmount || 0})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Return Refund:</span>
                          <span>{ord.returnRefund.status} (₹{ord.returnRefund.distributedAmount || ord.returnRefund.claimedAmount || 0})</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                          <span>Total Refund Distributed:</span>
                          <span className="font-mono text-amber-800">₹{ord.refundTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-black text-emerald-800">
                          <span>Final Campus Basket Earning:</span>
                          <span className="font-mono">₹{ord.finalCampusBasketEarning.toFixed(2)}</span>
                        </div>

                        <button
                          onClick={() => handleOpenDrawer(ord)}
                          className="w-full mt-2 py-2 bg-[#0F172A] text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition"
                        >
                          Manage Order &amp; Refunds
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#0F172A] text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* =========================================================================
            5B. COMPREHENSIVE STATUS DOCUMENTATION & INTERACTIVE FINANCIAL FLOWCHARTS
        ========================================================================= */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Header & Tab Selector */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0F172A] via-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
                <BookOpen className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black tracking-tight text-white">
                    FINANCIAL ENGINE DOCUMENTATION &amp; FLOWCHARTS
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    Authoritative Reference
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Interactive lifecycle flowcharts, status definitions, auto-reversal protocols, and admin recovery procedures.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/10">
                <button
                  onClick={() => { setDocTab('FLOWCHARTS'); setDocOpen(true); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    docTab === 'FLOWCHARTS' && docOpen
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Visual Flowcharts</span>
                </button>
                <button
                  onClick={() => { setDocTab('GLOSSARY'); setDocOpen(true); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    docTab === 'GLOSSARY' && docOpen
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Status Glossary</span>
                </button>
                <button
                  onClick={() => { setDocTab('PROTOCOLS'); setDocOpen(true); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    docTab === 'PROTOCOLS' && docOpen
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Recovery Protocols</span>
                </button>
              </div>

              <button
                onClick={() => setDocOpen(!docOpen)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/10 flex items-center gap-1 cursor-pointer"
              >
                <span>{docOpen ? 'Collapse' : 'Expand'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${docOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Content */}
          {docOpen && (
            <div className="p-4 sm:p-6 bg-slate-50/50 space-y-6">
              {/* TAB 1: VISUAL FLOWCHARTS */}
              {docTab === 'FLOWCHARTS' && (
                <div className="space-y-6">
                  {/* Flowchart 1: Standard Payment Lifecycle */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">1</span>
                        <h3 className="text-sm font-bold text-slate-900">Standard Order Payment &amp; Capture Flow</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">Normal Successful Flow</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                      {/* Step 1 */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">STEP 1</span>
                        <h4 className="font-bold text-xs text-slate-900">Cart Checkout</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Order created with universal ID <code className="font-mono text-[10px] text-slate-700 font-bold">CB-ORD-...</code>. Status = <span className="font-bold text-amber-700">PENDING_PAYMENT</span>.
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">STEP 2</span>
                        <h4 className="font-bold text-xs text-blue-950">Razorpay Gateway</h4>
                        <p className="text-[11px] text-blue-700 leading-relaxed">
                          Razorpay order generated (<code className="font-mono text-[10px]">order_xxx</code>). Student selects UPI, Card, Netbanking, or COD.
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">STEP 3</span>
                        <h4 className="font-bold text-xs text-indigo-950">Dual-Channel Verify</h4>
                        <p className="text-[11px] text-indigo-700 leading-relaxed">
                          Frontend HMAC signature check <strong className="text-indigo-900">OR</strong> server webhook (<code className="font-mono text-[10px]">payment.captured</code>).
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 space-y-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">STEP 4</span>
                        <h4 className="font-bold text-xs text-emerald-950">Canonical Capture</h4>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          Status updated to <span className="font-bold text-emerald-900">CAPTURED</span>. Reconciliation = <span className="font-bold">NOT_REQUIRED</span>.
                        </p>
                      </div>

                      {/* Step 5 */}
                      <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">STEP 5</span>
                        <h4 className="font-bold text-xs text-white">Order Confirmed</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Order status becomes <span className="font-bold text-emerald-400">CONFIRMED</span>. Kitchen/Store preparation initiates.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Flowchart 2: Payment Failure, Auto-Reversal & Reconciliation Protocol */}
                  <div className="bg-white p-5 rounded-xl border-2 border-amber-300 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">2</span>
                        <h3 className="text-sm font-bold text-slate-900">Payment Failure, Money Debit Discrepancy &amp; Auto-Reversal Protocol</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        CRITICAL RECOVERY ENGINE
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      This protocol answers: <strong className="text-slate-900">If student was debited by bank, but order failed to confirm due to network drops/timeouts, how does the student get their refund?</strong>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Branch A: Failed with No Bank Debit */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                          <XCircle className="w-4 h-4 text-rose-500" />
                          <span>PATHWAY A: Normal Payment Failure (No Bank Debit)</span>
                        </div>
                        <ul className="text-[11px] text-slate-600 space-y-2 list-disc pl-4">
                          <li>
                            Student payment declined, insufficient funds, or missing account details (<span className="font-bold text-amber-800">FAILED_ACCOUNT_DETAILS</span>).
                          </li>
                          <li>
                            Payment record updated with <span className="font-mono text-slate-800 font-bold">status: FAILED</span> and gateway failure code.
                          </li>
                          <li>
                            <strong className="text-slate-900">Zero duplicate orders:</strong> The original order record (<code className="font-mono text-[10px]">CB-ORD-...</code>) is preserved.
                          </li>
                          <li>
                            Student is shown friendly message: <em>"Please check your payment details and try again."</em>
                          </li>
                          <li>
                            Student retries payment; subsequent attempt links to the <strong className="text-slate-900">SAME order ID</strong>.
                          </li>
                        </ul>
                      </div>

                      {/* Branch B: Money Debited but Order Not Confirmed */}
                      <div className="p-4 rounded-xl bg-orange-50/70 border-2 border-orange-300 space-y-3">
                        <div className="flex items-center gap-2 text-orange-950 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span>PATHWAY B: Student Debited, But Website/Webhook Timed Out</span>
                        </div>
                        <div className="space-y-2 text-[11px] text-slate-700">
                          <div className="p-2.5 rounded-lg bg-white border border-orange-200">
                            <span className="font-bold text-orange-900 block mb-0.5">1. Auto-Reversal at Gateway (Most Frequent)</span>
                            If Campus Basket never captured the payment, Razorpay automatically voids authorization. <strong className="text-emerald-800 font-black">100% of money is refunded directly back to the student's original UPI/bank account in 5–7 business days</strong>. Student needs zero bank forms.
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-orange-200">
                            <span className="font-bold text-orange-900 block mb-0.5">2. Server Reconciliation (If Actually Captured)</span>
                            Status marked as <span className="font-bold text-orange-800">CUSTOMER_DEBIT_REVIEW</span>. Admin or cron rechecks via Razorpay API:
                            <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                              <li><strong>If Order can be fulfilled:</strong> Auto-reconciled to <span className="font-bold text-emerald-700">CAPTURED + CONFIRMED</span>.</li>
                              <li><strong>If Order cannot be fulfilled:</strong> Admin clicks "Process Refund" → Instant Gateway Refund back to original payment source.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flowchart 3 & 4: Refund Lifecycle & Settlement Flow */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Refund Lifecycle */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-black flex items-center justify-center">3</span>
                        <h3 className="text-sm font-bold text-slate-900">Refund Lifecycle &amp; Deduction Rules</h3>
                      </div>
                      <div className="space-y-2 text-[11px] text-slate-600">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-0.5">Pre-Acceptance Cancellation</span>
                          Provider has not accepted order. <strong className="text-emerald-700">100% refund of paid amount</strong>. Zero non-refundable deduction.
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-0.5">Post-Acceptance / In-Transit Cancellation</span>
                          Delivery fee is retained by Campus Basket to compensate runner (<span className="font-mono text-rose-700 font-bold">-₹DeliveryFee</span>). Remaining order value eligible for refund.
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-0.5">Return Request Refund</span>
                          Product verified by provider/admin upon physical inspection. Refund distributed to original payment source.
                        </div>
                      </div>
                    </div>

                    {/* Settlement Flow */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">4</span>
                        <h3 className="text-sm font-bold text-slate-900">Provider Settlement &amp; Platform Revenue</h3>
                      </div>
                      <div className="space-y-2 text-[11px] text-slate-600">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-0.5">Eligibility Trigger</span>
                          Order marked <span className="font-bold text-emerald-700">DELIVERED</span>. Settlement status moves from <span className="font-mono text-[10px]">PENDING</span> to <span className="font-mono text-[10px] font-bold text-indigo-700">ELIGIBLE</span>.
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-0.5">Platform Revenue (5% Commission)</span>
                          Campus Basket retains standard 5% commission on items subtotal. Net provider payable = Subtotal - 5% Commission.
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-0.5">Batch Disbursal</span>
                          Admin generates weekly/bi-weekly settlement batch and disburses via Bank UTR / Razorpay Payouts.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STATUS MASTER GLOSSARY */}
              {docTab === 'GLOSSARY' && (
                <div className="space-y-6">
                  {/* Payment Statuses Table */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                      PAYMENT STATUSES (ORDER &amp; TRANSACTION LEDGER)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                            <th className="p-2.5">STATUS</th>
                            <th className="p-2.5">CANONICAL MEANING</th>
                            <th className="p-2.5">TRIGGER CONDITION</th>
                            <th className="p-2.5">NEXT EXPECTED ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          <tr>
                            <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black">CAPTURED</span></td>
                            <td className="p-2.5 text-slate-700">Payment captured and finalized by gateway. Preferred standard status.</td>
                            <td className="p-2.5 text-slate-500">Successful payment verification or <code className="font-mono text-[10px]">payment.captured</code> webhook.</td>
                            <td className="p-2.5 text-emerald-700 font-bold">Fulfill &amp; deliver order.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">AUTHORIZED</span></td>
                            <td className="p-2.5 text-slate-700">Bank authorized funds, pending final gateway capture.</td>
                            <td className="p-2.5 text-slate-500">2-step authorization enabled; waiting for server auto-capture.</td>
                            <td className="p-2.5 text-blue-700 font-bold">Await auto-capture or webhook.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">FAILED</span></td>
                            <td className="p-2.5 text-slate-700">Payment attempt unsuccessful at gateway or bank.</td>
                            <td className="p-2.5 text-slate-500">Declined, insufficient balance, timeout, or security filter.</td>
                            <td className="p-2.5 text-slate-700 font-bold">Allow student retry on SAME order.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 font-black border border-amber-300">FAILED_ACCOUNT_DETAILS</span></td>
                            <td className="p-2.5 text-slate-700">Payment failed because student's bank account or payment details were missing, invalid, unlinked, or rejected.</td>
                            <td className="p-2.5 text-slate-500">Razorpay error confirming invalid VPA, beneficiary bank offline, or account details missing.</td>
                            <td className="p-2.5 text-amber-800 font-bold">Prompt student to verify bank/UPI details and retry on SAME order.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">PENDING</span></td>
                            <td className="p-2.5 text-slate-700">Order placed, awaiting customer payment initiation.</td>
                            <td className="p-2.5 text-slate-500">Order initiated in checkout; Razorpay window active.</td>
                            <td className="p-2.5 text-slate-600 font-bold">Expires if unpaid within timeout.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">REFUNDED</span></td>
                            <td className="p-2.5 text-slate-700">Eligible refund amount has been distributed to customer.</td>
                            <td className="p-2.5 text-slate-500">Admin distributed refund via ledger or automated gateway refund.</td>
                            <td className="p-2.5 text-slate-500">Lifecycle complete. Recorded in ledger.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold"><span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">RECONCILIATION_REQUIRED</span></td>
                            <td className="p-2.5 text-slate-700">Discrepancy detected between gateway status and platform records.</td>
                            <td className="p-2.5 text-slate-500">Potential debit review, timeout discrepancy, or amount mismatch.</td>
                            <td className="p-2.5 text-orange-800 font-bold">Admin reviews via "Recheck via Razorpay API".</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Failure Reasons Reference */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                      PAYMENT FAILURE REASONS TAXONOMY
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                        <span className="text-xs font-black text-amber-900">BANK/ACCOUNT DETAILS REQUIRED</span>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Student entered an invalid UPI ID, unlinked bank account, or beneficiary bank was inactive. Student action required.
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 space-y-1">
                        <span className="text-xs font-black text-yellow-900">INSUFFICIENT FUNDS</span>
                        <p className="text-[11px] text-yellow-800 leading-relaxed">
                          Bank declined transaction due to low balance in student account. Advise student to top up balance.
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-1">
                        <span className="text-xs font-black text-purple-900">PAYMENT TIMEOUT</span>
                        <p className="text-[11px] text-purple-800 leading-relaxed">
                          Gateway or issuing bank took too long to authenticate. <strong className="text-purple-950">Verify before retrying</strong> as money might have debited.
                        </p>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 space-y-1">
                        <span className="text-xs font-black text-rose-900">PAYMENT DECLINED</span>
                        <p className="text-[11px] text-rose-800 leading-relaxed">
                          Issuing bank rejected transaction (card limits, disabled online transactions, or OTP validation failed).
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-xs font-black text-slate-800">PAYMENT CANCELLED</span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Student closed the Razorpay payment modal before entering credentials or intentionally dismissed checkout.
                        </p>
                      </div>
                      <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200 space-y-1">
                        <span className="text-xs font-black text-cyan-900">NETWORK/TECHNICAL ERROR</span>
                        <p className="text-[11px] text-cyan-800 leading-relaxed">
                          Drop in client internet or socket disconnect between browser and bank authentication page.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ADMIN RECOVERY PROTOCOLS */}
              {docTab === 'PROTOCOLS' && (
                <div className="space-y-6">
                  {/* 7-Step SOP */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">7-Step Admin Standard Operating Procedure for Failed / Unconfirmed Payments</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-700">
                      <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">1</span>
                        <div>
                          <strong className="text-slate-900 block">Do Not Mark As Paid Prematurely</strong>
                          Never mark an order as CAPTURED or CONFIRMED until cryptographic signature or webhook verification confirms receipt.
                        </div>
                      </div>

                      <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">2</span>
                        <div>
                          <strong className="text-slate-900 block">Zero Duplicate Orders</strong>
                          Never create a second Campus Basket order when a student retries. Every payment attempt must link to the existing <code className="font-mono text-[10px] font-bold">CB-ORD-...</code> row.
                        </div>
                      </div>

                      <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">3</span>
                        <div>
                          <strong className="text-slate-900 block">Preserve Razorpay IDs</strong>
                          Store Razorpay Order ID and Razorpay Payment ID on the Payment record even for failed attempts to maintain an audit trail.
                        </div>
                      </div>

                      <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">4</span>
                        <div>
                          <strong className="text-slate-900 block">Store Exact Gateway Error Code</strong>
                          Never overwrite original Razorpay failure codes. Record error codes (<code className="font-mono text-[10px]">BAD_REQUEST_ERROR</code>, etc.) in the attempt transaction history.
                        </div>
                      </div>

                      <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">5</span>
                        <div>
                          <strong className="text-slate-900 block">Enable Student Retry</strong>
                          Allow student to retry with clean payment details. Ensure cart is retained on failure so students do not re-select items.
                        </div>
                      </div>

                      <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">6</span>
                        <div>
                          <strong className="text-slate-900 block">Check for Existing Capture Before Retry</strong>
                          If customer reports money was deducted, click <strong className="text-indigo-700">"Recheck via Razorpay API"</strong> in the drawer before asking them to pay again.
                        </div>
                      </div>

                      <div className="flex gap-3 items-start p-3 bg-emerald-50 rounded-xl border border-emerald-300 md:col-span-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">7</span>
                        <div>
                          <strong className="text-emerald-950 block">Update Existing Order on Later Confirmation</strong>
                          If Razorpay webhook delivers a delayed capture event, update the <strong className="text-emerald-900">SAME existing order</strong> to <code className="font-mono font-bold">CAPTURED</code>. Never create a separate order row.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Separation of Concerns Policy */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>CRITICAL RULE: NEVER CONFUSE PAYMENT FAILURE WITH REFUND ACCOUNT DETAILS</span>
                    </div>
                    <p className="text-blue-800 leading-relaxed">
                      <strong>Payment Account Failure</strong> refers strictly to an initiation error where required bank or payment details were invalid, unlinked, or rejected during checkout.
                    </p>
                    <p className="text-blue-800 leading-relaxed">
                      <strong>Refund Account Details</strong> refers to beneficiary details required only when an offline/manual disbursal is needed. For all normal Razorpay online payments, refunds are routed <strong className="underline">directly back to the original source payment method</strong> (UPI ID or issuing bank card) via Razorpay's Refund API. Do not demand student bank account details for standard online refunds.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* =========================================================================
          6. SLIDE-OVER DRAWER (VIEW / MANAGE ORDER FINANCIAL DETAILS)
      ========================================================================= */}
      {drawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="h-16 px-6 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm">{selectedOrder.orderNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    FINANCIAL RECORD
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
                {/* 1. Order Information */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-slate-600" />
                    <span>ORDER INFORMATION</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">STUDENT</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.studentName}</p>
                      <p className="text-slate-500 text-[11px]">{selectedOrder.studentEmail}</p>
                      <p className="text-slate-400 text-[10px]">Roll: {selectedOrder.studentRoll}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">DELIVERY LOCATION</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.studentHall}</p>
                      <p className="text-slate-500 text-[11px]">Room {selectedOrder.studentRoom}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">PROVIDER</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.providerName}</p>
                      <p className="text-slate-400 text-[10px]">Service: {selectedOrder.serviceType}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">DELIVERY BOY</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.deliveryBoyName}</p>
                      <p className="text-slate-400 text-[10px]">Status: {selectedOrder.status}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Payment Information */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-600" />
                    <span>PAYMENT BREAKDOWN</span>
                  </h3>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Total Order Amount:</span>
                      <span className="font-mono font-black text-sm text-slate-900">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Payment Method:</span>
                      <span className="font-bold text-slate-800">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Online Paid:</span>
                      <span className="font-mono font-bold text-[#0284C7]">₹{selectedOrder.onlinePaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">COD Advance Paid:</span>
                      <span className="font-mono font-bold text-[#6366F1]">
                        {selectedOrder.paymentMethod === 'ONLINE' ? 'N/A' : `₹${selectedOrder.codAdvance.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">COD Cash Collected at Handover:</span>
                      <span className="font-mono font-bold text-[#8B5CF6]">
                        {selectedOrder.paymentMethod === 'ONLINE' ? 'N/A' : `₹${selectedOrder.codCash.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                      <span className="text-slate-600 font-bold">Payment Status:</span>
                      <span>{renderPaymentBadge(selectedOrder.paymentStatus)}</span>
                    </div>
                  </div>
                </div>

                {/* C. Razorpay / Gateway Information */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <span>RAZORPAY GATEWAY INFORMATION</span>
                  </h3>
                  {selectedOrder.paymentMethod === 'CASH_ON_DELIVERY' && !selectedOrder.razorpayOrderId ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-400 italic">
                      COD order — no Razorpay gateway used for this payment.
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Razorpay Order ID:</span>
                        <span className="font-mono font-bold text-slate-800 text-[10px] break-all text-right max-w-[50%]">
                          {selectedOrder.razorpayOrderId || <span className="text-slate-300 not-italic">Not available</span>}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Razorpay Payment ID:</span>
                        <span className="font-mono font-bold text-slate-800 text-[10px] break-all text-right max-w-[50%]">
                          {selectedOrder.razorpayPaymentId || <span className="text-slate-300 not-italic">Not yet captured</span>}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Captured At:</span>
                        <span className="font-bold text-slate-800">
                          {selectedOrder.capturedAt
                            ? new Date(selectedOrder.capturedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : <span className="text-slate-300">Not captured</span>}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                        <span className="text-slate-500 font-semibold">Reconciliation:</span>
                        <span className="font-bold text-[10px]">
                          {(() => {
                            const rs = selectedOrder.reconciliationStatus || 'NOT_REQUIRED';
                            if (rs === 'NOT_REQUIRED') return <span className="text-slate-400">Not Required</span>;
                            if (rs === 'AUTO_RECONCILED') return <span className="text-emerald-700">✓ Auto Reconciled{selectedOrder.reconciledAt ? ` (${new Date(selectedOrder.reconciledAt).toLocaleDateString('en-IN')})` : ''}</span>;
                            if (rs === 'MANUALLY_RECONCILED') return <span className="text-blue-700">✓ Admin Reconciled{selectedOrder.reconciledBy ? ` by ${selectedOrder.reconciledBy}` : ''}</span>;
                            if (rs === 'PENDING') return <span className="text-amber-700 animate-pulse">⏳ Pending Review</span>;
                            if (rs === 'AMOUNT_MISMATCH') return <span className="text-red-700">⚠ Amount Mismatch</span>;
                            if (rs === 'PAYMENT_NOT_FOUND') return <span className="text-red-700">✗ Payment Not Found on Razorpay</span>;
                            if (rs === 'CUSTOMER_DEBIT_REVIEW') return <span className="text-orange-700">⚠ Customer Debit Review</span>;
                            return <span>{rs}</span>;
                          })()}
                        </span>
                      </div>
                      {(selectedOrder.failureReason || selectedOrder.paymentFailureReason) && (selectedOrder.failureReason !== 'N/A' || selectedOrder.paymentFailureReason !== 'N/A') && (
                        <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-900 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Failure Classification:</span>
                            {renderFailureReasonBadge(selectedOrder.paymentFailureReason || selectedOrder.failureReason, selectedOrder.paymentFailureCode || selectedOrder.failureCode)}
                          </div>
                          {(selectedOrder.failureCode || selectedOrder.paymentFailureCode) && (
                            <div>
                              <span className="font-semibold text-red-700">Gateway Error Code: </span>
                              <span className="font-mono font-bold text-slate-800">{selectedOrder.failureCode || selectedOrder.paymentFailureCode}</span>
                            </div>
                          )}
                          {selectedOrder.failureReason && (
                            <div>
                              <span className="font-semibold text-red-700">Gateway Description: </span>
                              <span className="text-slate-800">{selectedOrder.failureReason}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* D. Payment Attempt History */}
                {Array.isArray(selectedOrder.paymentAttempts) && selectedOrder.paymentAttempts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-slate-600" />
                      <span>PAYMENT ATTEMPT HISTORY ({selectedOrder.paymentAttempts.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {selectedOrder.paymentAttempts.map((attempt, i) => (
                        <div key={attempt.attemptId || i} className="flex items-start justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
                          <div className="space-y-0.5">
                            <div className="font-mono text-slate-600">{attempt.razorpayPaymentId || attempt.attemptId}</div>
                            <div className="text-slate-400">{attempt.eventType}</div>
                            <div className="text-slate-400">{attempt.time ? new Date(attempt.time).toLocaleString('en-IN') : '—'}</div>
                          </div>
                          <div>
                            {attempt.status === 'CAPTURED' || attempt.status === 'SUCCESS' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">CAPTURED</span>
                            ) : attempt.status === 'FAILED' ? (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-bold">FAILED</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">{attempt.status}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* E. Manual Reconciliation Panel (only shown when admin review needed) */}
                {['PENDING', 'AMOUNT_MISMATCH', 'PAYMENT_NOT_FOUND', 'CUSTOMER_DEBIT_REVIEW'].includes(selectedOrder.reconciliationStatus) && (
                  <div className="p-4 rounded-xl bg-orange-50 border-2 border-orange-300 space-y-3">
                    <div className="flex items-center gap-2 text-orange-900 font-bold">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span>ADMIN RECONCILIATION REQUIRED</span>
                      <span className="text-[10px] font-normal text-orange-700 ml-auto">Status: {selectedOrder.reconciliationStatus}</span>
                    </div>
                    {selectedOrder.reconciliationStatus === 'AMOUNT_MISMATCH' && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-800">
                        ⚠ Razorpay payment amount does not match the expected order amount. Review before confirming.
                        {selectedOrder.failureReason && <div className="mt-1 font-bold">{selectedOrder.failureReason}</div>}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={async () => {
                          try {
                            const res = await apiRequest('/api/admin/payments/recheck-payment', {
                              method: 'POST',
                              body: JSON.stringify({ orderId: selectedOrder.id })
                            });
                            if (res.success) {
                              setRefundSuccessMsg(`Recheck: ${res.message}`);
                              await fetchLedgerData();
                            } else {
                              setRefundErrorMsg(res.message || 'Recheck failed');
                            }
                          } catch (e: any) {
                            setRefundErrorMsg(e?.message || 'Server error');
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Recheck via Razorpay API
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-orange-900">MANUAL RECONCILIATION NOTE (required, min 10 chars):</label>
                      <textarea
                        value={distributeNotesInput}
                        onChange={(e) => setDistributeNotesInput(e.target.value)}
                        rows={2}
                        placeholder="Describe why this payment is being manually reconciled..."
                        className="w-full bg-white border border-orange-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 resize-none"
                      />
                      <button
                        disabled={distributeNotesInput.trim().length < 10}
                        onClick={async () => {
                          if (distributeNotesInput.trim().length < 10) return;
                          try {
                            const res = await apiRequest('/api/admin/payments/mark-reconciled', {
                              method: 'POST',
                              body: JSON.stringify({ orderId: selectedOrder.id, note: distributeNotesInput.trim() })
                            });
                            if (res.success) {
                              setRefundSuccessMsg(`Order marked as reconciled. ${res.message}`);
                              await fetchLedgerData();
                            } else {
                              setRefundErrorMsg(res.message || 'Failed');
                            }
                          } catch (e: any) {
                            setRefundErrorMsg(e?.message || 'Server error');
                          }
                        }}
                        className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Mark as Manually Reconciled
                      </button>
                    </div>
                    {refundErrorMsg && <div className="p-2 rounded bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300">{refundErrorMsg}</div>}
                    {refundSuccessMsg && <div className="p-2 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">{refundSuccessMsg}</div>}
                  </div>
                )}

                {/* F. Refund Information & Policy Calculation */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                    <span>REFUND LIFECYCLE &amp; RULE CALCULATION</span>
                  </h3>

                  {/* Cancellation Refund Card */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">CANCELLATION REFUND</span>
                      <span>{renderRefundStatusBadge(selectedOrder.cancellationRefund.status, selectedOrder.cancellationRefund.distributedAmount || selectedOrder.cancellationRefund.claimedAmount)}</span>
                    </div>
                    {selectedOrder.cancellationRefund.status !== 'NOT_APPLICABLE' ? (
                      <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span>Original Customer Payment:</span>
                          <span className="font-mono font-bold">₹{selectedOrder.onlinePaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-rose-600">
                          <span>Less Non-Refundable Deduction (Delivery fee):</span>
                          <span className="font-mono font-bold">-₹{selectedOrder.cancellationRefund.deduction.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                          <span>Eligible Refund Amount:</span>
                          <span className="font-mono">₹{selectedOrder.cancellationRefund.eligibleAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Actually Distributed:</span>
                          <span className="font-mono">₹{selectedOrder.cancellationRefund.distributedAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No cancellation refund applicable for this order.</p>
                    )}
                  </div>

                  {/* Return Refund Card */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">RETURN REFUND</span>
                      <span>{renderRefundStatusBadge(selectedOrder.returnRefund.status, selectedOrder.returnRefund.distributedAmount || selectedOrder.returnRefund.claimedAmount)}</span>
                    </div>
                    {selectedOrder.returnRefund.status !== 'NOT_APPLICABLE' ? (
                      <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span>Return Reason:</span>
                          <span className="font-semibold">{selectedOrder.returnRefund.reasonType || 'Doorstep return'}</span>
                        </div>
                        <div className="flex justify-between text-rose-600">
                          <span>Deductions (Return processing / Delivery):</span>
                          <span className="font-mono font-bold">-₹{selectedOrder.returnRefund.deduction.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                          <span>Eligible Refund Amount:</span>
                          <span className="font-mono">₹{selectedOrder.returnRefund.eligibleAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Actually Distributed:</span>
                          <span className="font-mono">₹{selectedOrder.returnRefund.distributedAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No product return requested on this order.</p>
                    )}
                  </div>
                </div>

                {/* 4. Final Financial Summary */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>FINAL FINANCIAL RESULT</span>
                  </h3>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Student Paid (Total Order):</span>
                      <span className="font-mono font-black text-sm text-slate-900">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-800">
                      <span className="font-semibold">Less: Refund Distributed to Student:</span>
                      <span className="font-mono font-bold">−₹{selectedOrder.refundTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-emerald-400 pt-2 mt-1">
                      <span className="text-sm font-black text-emerald-900">NET CAMPUS BASKET RECEIVED:</span>
                      <span className="font-mono font-black text-lg text-emerald-700">₹{selectedOrder.finalCampusBasketEarning.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-emerald-700/80 leading-tight pt-1 border-t border-emerald-200">
                      This is the exact amount Campus Basket retains after paying back the student's refund. Formula: Total Paid − Refund Distributed.
                    </p>
                  </div>
                </div>

                {/* 5. Admin Refund Action Box (if CLAIMED) */}
                {(selectedOrder.cancellationRefund.status === 'CLAIMED' || selectedOrder.returnRefund.status === 'CLAIMED') && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Pending Refund Claim Awaiting Distribution</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        DISTRIBUTE REFUND AMOUNT (INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={
                          (selectedOrder.cancellationRefund.status === 'CLAIMED' ? selectedOrder.cancellationRefund.eligibleAmount : 0) +
                          (selectedOrder.returnRefund.status === 'CLAIMED' ? selectedOrder.returnRefund.eligibleAmount : 0)
                        }
                        value={distributeAmountInput}
                        onChange={(e) => setDistributeAmountInput(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                      <p className="text-[10px] text-amber-700 mt-1">
                        Eligible cap:{' '}
                        ₹{(
                          (selectedOrder.cancellationRefund.status === 'CLAIMED' ? selectedOrder.cancellationRefund.eligibleAmount : 0) +
                          (selectedOrder.returnRefund.status === 'CLAIMED' ? selectedOrder.returnRefund.eligibleAmount : 0)
                        ).toFixed(2)}. Over-distribution is prevented by validation.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">ADMIN AUDIT NOTE</label>
                      <input
                        type="text"
                        placeholder="e.g. Verified UPI / Razorpay refund disbursal"
                        value={distributeNotesInput}
                        onChange={(e) => setDistributeNotesInput(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {refundErrorMsg && (
                      <div className="p-2 rounded bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300">
                        {refundErrorMsg}
                      </div>
                    )}

                    {refundSuccessMsg && (
                      <div className="p-2 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                        {refundSuccessMsg}
                      </div>
                    )}

                    <button
                      onClick={handleProcessRefund}
                      disabled={processingRefund}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{processingRefund ? 'Processing Distribution...' : 'Process & Mark as Distributed'}</span>
                    </button>
                  </div>
                )}

                {/* If already distributed */}
                {selectedOrder.refundTotal > 0 && (selectedOrder.cancellationRefund.status === 'DISTRIBUTED' || selectedOrder.returnRefund.status === 'DISTRIBUTED') && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-xs">✓ Refund Distributed</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Total ₹{selectedOrder.refundTotal.toFixed(2)} has been recorded in the platform financial ledger and deducted from merchant payout.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
