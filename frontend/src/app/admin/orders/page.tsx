'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import { ReceiptModal } from '../../../components/admin/ReceiptModal';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  FileText,
  RotateCcw,
  CheckCircle,
  Clock,
  Truck,
  Download,
  X,
  User,
  Building,
  CreditCard,
  ChevronRight,
  Package,
  Calendar,
  AlertTriangle,
  Camera,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Check
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [hallFilter, setHallFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('30d');

  // Slide-over Order Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Delivery Boy Assignment State
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<any>(null);
  const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Return Requests Management State
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'RETURNS'>('ORDERS');
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [returnAssignBoyId, setReturnAssignBoyId] = useState('');
  const [returnRejectionReason, setReturnRejectionReason] = useState('');
  const [processingReturn, setProcessingReturn] = useState(false);

  const fetchDeliveryBoys = async () => {
    try {
      const res = await apiRequest('/api/admin/delivery-boys');
      if (res.success && Array.isArray(res.deliveryBoys)) {
        setDeliveryBoys(res.deliveryBoys);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const openAssignModal = (order: any) => {
    setSelectedOrderForAssign(order);
    setSelectedDeliveryBoyId(order.deliveryBoyId || '');
    setAssignModalOpen(true);
  };

  const handleAssignDeliveryBoy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForAssign || !selectedDeliveryBoyId) return;

    setAssignLoading(true);
    try {
      const res = await apiRequest(`/api/admin/orders/${selectedOrderForAssign.id}/assign-delivery`, {
        method: 'POST',
        body: JSON.stringify({ deliveryBoyId: selectedDeliveryBoyId })
      });
      if (res.success) {
        setAssignModalOpen(false);
        fetchOrders();
      } else {
        alert(res.message || 'Assignment failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error assigning delivery boy');
    } finally {
      setAssignLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let q = `/api/admin/orders?limit=50&range=${dateRange}`;
      if (search) q += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') q += `&status=${statusFilter}`;
      if (paymentFilter !== 'ALL') q += `&paymentMethod=${paymentFilter}`;
      if (hallFilter !== 'ALL') q += `&hall=${encodeURIComponent(hallFilter)}`;

      const res = await apiRequest(q);
      if (res.success && res.orders) {
        setOrders(res.orders);
        if (selectedOrder) {
          const updated = res.orders.find((o: any) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnRequests = async () => {
    try {
      setLoadingReturns(true);
      const res = await apiRequest('/api/returns');
      let returnsList = (res.success && Array.isArray(res.returns)) ? [...res.returns] : [];

      // Also merge any locally tracked returns from localStorage
      if (typeof window !== 'undefined') {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cb_return_')) {
              const itemStr = localStorage.getItem(key);
              if (itemStr) {
                const item = JSON.parse(itemStr);
                if (item && (item.id || item.orderId)) {
                  const exists = returnsList.some((r: any) => 
                    r.id === item.id || 
                    (item.orderId && r.orderId === item.orderId) ||
                    (item.orderNumber && r.order?.orderNumber === item.orderNumber)
                  );
                  if (!exists) {
                    returnsList.unshift(item);
                  }
                }
              }
            }
          }
        } catch {}
      }

      setReturnRequests(returnsList);
    } catch (e) {
      console.warn('Return requests fetch error:', e);
    } finally {
      setLoadingReturns(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchReturnRequests();
  }, [statusFilter, paymentFilter, hallFilter, dateRange]);

  const openReturnReviewModal = (ret: any) => {
    setSelectedReturn(ret);
    setReturnAssignBoyId(ret.deliveryBoyId || '');
    setReturnRejectionReason('');
    setReviewModalOpen(true);
  };

  const handleApproveReturn = async () => {
    if (!selectedReturn) return;
    setProcessingReturn(true);
    try {
      const returnId = encodeURIComponent(String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '').trim());
      const res = await apiRequest(`/api/returns/${returnId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ deliveryBoyId: returnAssignBoyId || undefined })
      });
      if (res.success) {
        if (typeof window !== 'undefined' && res.returnRequest) {
          try {
            const rawId = String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '');
            localStorage.setItem(`cb_return_${rawId}`, JSON.stringify(res.returnRequest));
            localStorage.setItem('cb_return_active', JSON.stringify(res.returnRequest));
            if (res.returnRequest.orderId) {
              localStorage.setItem(`cb_return_${res.returnRequest.orderId}`, JSON.stringify(res.returnRequest));
            }
          } catch {}
        }
        alert(returnAssignBoyId
          ? 'Return request approved and assigned directly to selected runner!'
          : 'Return request approved and broadcasted to all online delivery runners to accept!'
        );
        setReviewModalOpen(false);
        fetchReturnRequests();
        fetchOrders();
      } else {
        alert(res.message || 'Approval failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error approving return request');
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleRejectReturn = async () => {
    if (!selectedReturn) return;
    if (!returnRejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    setProcessingReturn(true);
    try {
      const returnId = encodeURIComponent(String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '').trim());
      const res = await apiRequest(`/api/returns/${returnId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: returnRejectionReason })
      });
      if (res.success) {
        alert('Return request has been rejected.');
        setReviewModalOpen(false);
        fetchReturnRequests();
        fetchOrders();
      } else {
        alert(res.message || 'Rejection failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error rejecting return request');
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleDisburseRefund = async () => {
    if (!selectedReturn) return;
    const isPickedUp = selectedReturn.status === 'PICKED_UP' || selectedReturn.status === 'PROCESSING' || Boolean(selectedReturn.pickupOtpVerified) || selectedReturn.order?.refundStatus === 'PICKED_UP';
    if (!isPickedUp) {
      alert('Cannot disburse refund yet: Product pickup must be completed and verified via 6-digit OTP first.');
      return;
    }
    const utr = prompt(`Confirm and disburse refund of ₹${selectedReturn.refundAmount} to student. Enter UTR / Payment Reference (optional):`, `CB-REF-${Date.now().toString().slice(-6)}`);
    if (utr === null) return;

    setProcessingReturn(true);
    try {
      const returnId = encodeURIComponent(String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '').trim());
      const res = await apiRequest(`/api/returns/${returnId}/disburse-refund`, {
        method: 'POST',
        body: JSON.stringify({ transactionReference: utr.trim() || undefined })
      });
      if (res.success) {
        alert(`Refund of ₹${selectedReturn.refundAmount} successfully disbursed! Financial ledger recorded.`);
        setReviewModalOpen(false);
        fetchReturnRequests();
        fetchOrders();
      } else {
        alert(res.message || 'Refund disbursement failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error disbursing refund');
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await apiRequest(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert('Error updating order status');
    }
  };

  const handleTriggerRefund = async (orderId: string) => {
    const reason = prompt('Please enter refund justification:');
    if (!reason) return;

    try {
      const res = await apiRequest('/api/admin/orders/refund', {
        method: 'POST',
        body: JSON.stringify({ orderId, reason })
      });
      if (res.success) {
        alert('Refund processed successfully via Razorpay');
        fetchOrders();
      } else {
        alert(res.message || 'Refund failed');
      }
    } catch (err: any) {
      alert(err.message || 'Refund failed');
    }
  };

  const handleExportCsv = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nit_token') : '';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    window.open(`${backendUrl}/api/admin/reports/export-csv?type=orders&token=${token}`, '_blank');
  };

  // KPIs
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING').length;
  const deliveryCount = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const requestedReturnsCount = returnRequests.filter((r) => r.status === 'REQUESTED').length;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-[#347A27] border-emerald-200';
      case 'CONFIRMED':
      case 'PREPARING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getReturnStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PICKUP_ASSIGNED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PICKED_UP':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'COMPLETED':
      case 'REFUNDED':
        return 'bg-emerald-100 text-[#347A27] border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const milestones = [
    { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Received & routed to provider' },
    { key: 'PREPARING', label: 'In Kitchen / Packing', desc: 'Vendor prepping order' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'In transit to student hall' },
    { key: 'DELIVERED', label: 'Order Delivered', desc: 'Verified drop at room door' }
  ];

  const getMilestoneIndex = (status: string) => {
    const map: Record<string, number> = {
      CONFIRMED: 0,
      PREPARING: 1,
      OUT_FOR_DELIVERY: 2,
      DELIVERED: 3
    };
    return map[status] ?? 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#4F9D32]" />
            <span>Orders Management &amp; Fulfillment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time fulfillment tracking, returns review, runner assignments, room drops &amp; refunds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchOrders();
              fetchReturnRequests();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Orders</div>
            <div className="text-xl font-black text-[#17202A]">{totalCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Processing</div>
            <div className="text-xl font-black text-amber-700">{pendingCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Out for Delivery</div>
            <div className="text-xl font-black text-blue-700">{deliveryCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#347A27]">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Delivered</div>
            <div className="text-xl font-black text-[#347A27]">{deliveredCount}</div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('RETURNS')}
          className="bg-white p-4 rounded-2xl border border-rose-200 hover:border-rose-400 shadow-xs flex items-center gap-3 cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center text-rose-700 transition">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Pending Returns</div>
            <div className="text-xl font-black text-rose-700 flex items-center gap-1.5">
              {requestedReturnsCount}
              {requestedReturnsCount > 0 && (
                <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                  Action
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'ORDERS'
              ? 'bg-[#4F9D32] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>All Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RETURNS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition relative ${
            activeTab === 'RETURNS'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-rose-700 hover:bg-slate-50'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Return &amp; Refund Requests ({returnRequests.length})</span>
          {requestedReturnsCount > 0 && (
            <span
              className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                activeTab === 'RETURNS' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
              }`}
            >
              {requestedReturnsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ALL ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by order #, student name, roll no..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#4F9D32]"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700"
              >
                <option value="ALL">All Payments</option>
                <option value="ONLINE">Online (Razorpay)</option>
                <option value="COD">Cash on Delivery</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No orders found matching criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Order</th>
                      <th className="px-5 py-3.5">Customer &amp; Drop</th>
                      <th className="px-5 py-3.5">Items</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Fulfillment Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                        onClick={() => setSelectedOrder(o)}
                      >
                        <td className="px-5 py-4 font-mono font-bold text-[#17202A]">
                          #{o.orderNumber}
                          <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                            {new Date(o.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800">{o.studentName}</div>
                          <div className="text-[11px] text-slate-500">
                            {o.hallName}, Room {o.roomNumber}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-800">{o.items?.length || 0} items</span>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {o.items?.map((it: any) => `${it.productName} (${it.quantity})`).join(', ')}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-[#17202A]">₹{o.totalAmount}</div>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              o.paymentMethod === 'COD'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-[#347A27] border-emerald-200'
                            }`}
                          >
                            {o.paymentMethod}
                          </span>
                        </td>

                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                            className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none ${getStatusBadgeClass(
                              o.status
                            )}`}
                          >
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PREPARING">PREPARING</option>
                            <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
                            <option value="DELIVERY_ASSIGNED">DELIVERY ASSIGNED</option>
                            <option value="PICKED_UP">PICKED UP</option>
                            <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="REFUNDED">REFUNDED</option>
                          </select>
                        </td>

                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openAssignModal(o)}
                              title="Assign Delivery Runner"
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedOrder(o)}
                              title="Open Order Drawer"
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#4F9D32] border border-slate-200 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedReceipt(o)}
                              title="Download Receipt PDF"
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#4F9D32] border border-slate-200 transition"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RETURN & REFUND REQUESTS */}
      {activeTab === 'RETURNS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-[#17202A] flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  Product Returns &amp; Dispute Management
                </h3>
                <p className="text-[11px] text-slate-500">
                  Review student defect proofs, enforce delivery fee deductions for mind-changes, and dispatch runners with secure pickup OTPs.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">
                {returnRequests.length} Total Requests
              </span>
            </div>

            {loadingReturns ? (
              <div className="p-12 text-center text-slate-400">Loading return requests...</div>
            ) : returnRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No return requests recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Return ID &amp; Order</th>
                      <th className="px-5 py-3.5">Student / Room</th>
                      <th className="px-5 py-3.5">Reason Type</th>
                      <th className="px-5 py-3.5">Refund Calculation</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Assigned Runner</th>
                      <th className="px-5 py-3.5 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnRequests.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-slate-900">
                            #{ret.id.substring(0, 8)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Order: #{ret.order?.orderNumber || ret.orderId?.substring(0, 8)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-[#17202A]">{ret.studentName || ret.order?.student?.fullName || ret.order?.studentName || 'Campus Student'}</div>
                          <div className="text-[11px] text-slate-500">
                            {ret.hallName || ret.order?.hallName || ret.order?.student?.hallName || 'Campus Hostel'}, Room {ret.roomNumber || ret.order?.roomNumber || ret.order?.student?.roomNumber || 'N/A'}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ret.reasonType === 'PRODUCT_ISSUE'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-purple-50 text-purple-800 border-purple-300'
                            }`}
                          >
                            {ret.reasonType === 'PRODUCT_ISSUE' ? '⚠️ Defective / Damaged' : '🔄 Mind Change'}
                          </span>
                          <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                            {ret.reasonDetails || 'No details provided'}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-emerald-700 text-sm">
                            ₹{ret.refundAmount}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Original: ₹{ret.originalAmount || ret.order?.totalAmount} | Fee Ded: ₹{ret.deliveryChargeDeducted || 0}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getReturnStatusBadge(
                              ret.status
                            )}`}
                          >
                            {ret.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {ret.deliveryBoy ? (
                            <div>
                              <div className="font-bold text-slate-800">{ret.deliveryBoy.fullName}</div>
                              <div className="text-[10px] text-slate-500">{ret.deliveryBoy.phone}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => openReturnReviewModal(ret)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-[#4F9D32] hover:text-white text-slate-700 font-bold rounded-xl text-xs transition shadow-2xs"
                          >
                            Review &amp; Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ORDER DETAIL SIDE DRAWER (Slide-over) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-left">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#4F9D32]/10 text-[#347A27]">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#17202A]">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              {/* Milestone Timeline */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">
                  Fulfillment Timeline
                </span>
                <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2">
                  {milestones.map((m, idx) => {
                    const currentIdx = getMilestoneIndex(selectedOrder.status);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <div key={m.key} className="relative">
                        <span
                          className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                            isPassed
                              ? 'border-[#4F9D32] text-[#4F9D32]'
                              : 'border-slate-300 text-transparent'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isPassed ? 'bg-[#4F9D32]' : 'bg-transparent'
                            }`}
                          />
                        </span>
                        <div>
                          <div
                            className={`font-bold ${
                              isCurrent ? 'text-[#347A27]' : isPassed ? 'text-[#17202A]' : 'text-slate-400'
                            }`}
                          >
                            {m.label}
                          </div>
                          <div className="text-[11px] text-slate-500">{m.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student & Destination */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">
                  Delivery Destination
                </span>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-[#17202A]">
                    <span>{selectedOrder.studentName}</span>
                    <span className="font-mono text-slate-500">{selectedOrder.rollNumber}</span>
                  </div>
                  <div className="text-slate-600">
                    {selectedOrder.hallName} &bull; Room {selectedOrder.roomNumber}
                  </div>
                  {selectedOrder.deliveryInstructions && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                      <strong>Note:</strong> {selectedOrder.deliveryInstructions}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">
                  Cart Line Items
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((it: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2.5 font-medium text-[#17202A]">{it.productName}</td>
                          <td className="p-2.5 text-center font-mono text-slate-600">{it.quantity}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-[#17202A]">
                            ₹{it.totalPrice || it.unitPrice * it.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-600 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono font-medium">₹{selectedOrder.subtotal || selectedOrder.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-mono font-medium text-[#347A27]">₹{selectedOrder.deliveryFee || 0}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#17202A] pt-2 border-t border-slate-200 text-sm">
                    <span>Total Amount</span>
                    <span className="font-mono text-[#347A27]">₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Status Change Control */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">
                  Advance Order State
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition"
                  >
                    Set: PREPARING
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'OUT_FOR_DELIVERY')}
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition"
                  >
                    Set: OUT FOR DELIVERY
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#347A27] border border-emerald-200 font-bold text-xs transition col-span-2"
                  >
                    Confirm: DELIVERED
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={() => handleTriggerRefund(selectedOrder.id)}
                className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Issue Refund</span>
              </button>

              <button
                onClick={() => {
                  setSelectedReceipt(selectedOrder);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs shadow-sm shadow-[#4F9D32]/20 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        order={selectedReceipt}
      />

      {/* ASSIGN DELIVERY RUNNER MODAL FOR ORDERS */}
      {assignModalOpen && selectedOrderForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-[#17202A]">Assign Delivery Runner</h3>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 space-y-1">
              <div>Order: <strong className="font-mono">{selectedOrderForAssign.orderNumber}</strong></div>
              <div>Drop Location: <strong>{selectedOrderForAssign.hallName}, Room {selectedOrderForAssign.roomNumber}</strong></div>
              <div>Student: <strong>{selectedOrderForAssign.studentName}</strong></div>
            </div>

            <form onSubmit={handleAssignDeliveryBoy} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select Active Delivery Personnel
                </label>
                {deliveryBoys.length === 0 ? (
                  <p className="text-red-600 text-[11px]">
                    No active delivery runners available. Please register runners under Delivery Fleet.
                  </p>
                ) : (
                  <select
                    value={selectedDeliveryBoyId}
                    onChange={(e) => setSelectedDeliveryBoyId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Choose Runner --</option>
                    {deliveryBoys.map((boy) => (
                      <option key={boy.id} value={boy.id}>
                        {boy.fullName} ({boy.user?.username || boy.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedDeliveryBoyId}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN REVIEW & RUNNER ASSIGN MODAL */}
      {reviewModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-[#17202A]">Review Return Request & Delivery History</h3>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Order #{selectedReturn.order?.orderNumber || selectedReturn.orderId}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getReturnStatusBadge(
                    selectedReturn.status
                  )}`}
                >
                  {selectedReturn.status === 'PICKED_UP'
                    ? '📦 PICKED UP (OTP VERIFIED)'
                    : selectedReturn.status === 'REFUNDED'
                    ? '✓ REFUND DISBURSED'
                    : selectedReturn.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div>
                  Customer: <strong>{selectedReturn.studentName || selectedReturn.order?.student?.fullName || selectedReturn.order?.studentName}</strong> ({selectedReturn.order?.student?.rollNumber || selectedReturn.order?.rollNumber || 'Student'})
                </div>
                <div>
                  Pickup Room: <strong>{selectedReturn.hallName || selectedReturn.order?.hallName}, Room {selectedReturn.roomNumber || selectedReturn.order?.roomNumber}</strong>
                </div>
              </div>
            </div>

            {/* Original Fulfillment & Delivery History */}
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
              <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wider block">
                Original Delivery & Fulfillment Audit
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-white rounded-lg border border-blue-200">
                  <span className="text-slate-400 block text-[10px] font-semibold">Delivered By Runner (Handover):</span>
                  <strong className="text-slate-800 text-xs block mt-0.5">
                    {selectedReturn.order?.deliveryBoy?.fullName || 'Campus Runner'}
                  </strong>
                  {selectedReturn.order?.deliveryBoy?.mobileNumber && (
                    <span className="text-blue-700 font-mono text-[10px] block mt-0.5">
                      📞 {selectedReturn.order.deliveryBoy.mobileNumber}
                    </span>
                  )}
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-blue-200">
                  <span className="text-slate-400 block text-[10px] font-semibold">Provider / Store Vendor:</span>
                  <strong className="text-slate-800 text-xs block mt-0.5">
                    {selectedReturn.order?.provider?.fullName || 'Campus Store'}
                  </strong>
                  {selectedReturn.order?.provider?.mobileNumber && (
                    <span className="text-blue-700 font-mono text-[10px] block mt-0.5">
                      📞 {selectedReturn.order.provider.mobileNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Reason & Clear Proof Image Breakdown */}
            <div className="p-3.5 rounded-xl border space-y-2 bg-amber-50/60 border-amber-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Return Reason Category:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  selectedReturn.reasonType === 'PRODUCT_ISSUE'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                }`}>
                  {selectedReturn.reasonType === 'PRODUCT_ISSUE' ? '⚠️ Defective / Damaged Product' : '🔄 Student Mind Change'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Student Explanation:</span>
                <p className="mt-1 p-2 bg-white rounded-lg border border-amber-200 text-slate-700 leading-relaxed">
                  {selectedReturn.reasonDetails || 'No explanation provided'}
                </p>
              </div>

              {/* Clear High-Res Defect Proof Photo Preview */}
              {selectedReturn.proofImageUrl && (
                <div className="pt-2 border-t border-amber-200 space-y-1.5">
                  <span className="font-bold text-amber-900 block text-xs">Clear Defect Proof Photo Evidence:</span>
                  <div className="relative group rounded-xl overflow-hidden border-2 border-amber-300 bg-slate-950 flex items-center justify-center max-h-56">
                    <img
                      src={selectedReturn.proofImageUrl}
                      alt="Defect Evidence"
                      className="max-h-56 w-full object-contain rounded-lg"
                    />
                    <a
                      href={selectedReturn.proofImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Full Resolution</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Refund Settlement */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-700 uppercase text-[10px] block">Transparent Financial Calculation</span>
              <div className="flex justify-between text-slate-600">
                <span>Original Order / Item Value:</span>
                <span className="font-mono font-semibold">₹{selectedReturn.itemAmount || selectedReturn.originalAmount || selectedReturn.order?.totalAmount}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Return Fee Deducted ({selectedReturn.reasonType === 'PRODUCT_ISSUE' ? '₹0 Defect Policy' : 'Mind Change Policy'}):</span>
                <span className="font-mono font-bold">-₹{selectedReturn.deliveryFeeDeducted || selectedReturn.deliveryChargeDeducted || 0}</span>
              </div>
              <div className="flex justify-between font-bold text-[#17202A] pt-1.5 border-t border-slate-200 text-sm">
                <span>Student Refund Amount:</span>
                <span className="font-mono text-emerald-700 text-base font-black">₹{selectedReturn.refundAmount}</span>
              </div>
            </div>

            {/* Confidential Pickup OTP Notice (Strictly visible only to student dashboard) */}
            {['APPROVED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(selectedReturn.status) && (
              <div className="p-3 bg-blue-50/90 rounded-xl border border-blue-200 text-blue-900 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold block text-blue-950">Student Handover OTP Active</span>
                  <span className="text-[11px] text-blue-800">
                    6-digit verification code is private to the student's dashboard. The delivery runner must collect and verify this OTP directly from the student at the hostel door.
                  </span>
                </div>
              </div>
            )}

            {/* Assigned Pickup Runner (Runner B) */}
            {selectedReturn.deliveryBoy ? (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-purple-700 font-bold uppercase block">Assigned Return Pickup Runner:</span>
                  <strong className="text-slate-900 text-sm">{selectedReturn.deliveryBoy.fullName}</strong>
                  {selectedReturn.deliveryBoy.mobileNumber && (
                    <span className="text-purple-800 font-mono text-[11px] block">📞 {selectedReturn.deliveryBoy.mobileNumber}</span>
                  )}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  Pickup Runner
                </span>
              </div>
            ) : selectedReturn.status === 'REQUESTED' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Delivery Runner Assignment (Choose Specific or Broadcast)
                </label>
                <select
                  value={returnAssignBoyId}
                  onChange={(e) => setReturnAssignBoyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
                >
                  <option value="">📢 Broadcast to All Runners (Available for any online delivery boy to accept)</option>
                  {deliveryBoys.map((boy) => (
                    <option key={boy.id} value={boy.id}>
                      Directly Assign to: {boy.fullName} ({boy.user?.username || boy.phone || 'Runner'}) {boy.status === 'ACTIVE' || boy.activeStatus ? '🟢 (Online)' : '⚪ (Offline)'}
                    </option>
                  ))}
                  {deliveryBoys.length === 0 && (
                    <>
                      <option value="db_bikash">Directly Assign to: Bikash Delivery (Runner)</option>
                      <option value="db_boy_1">Directly Assign to: Campus Express Runner #1</option>
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {returnAssignBoyId
                    ? 'Selected runner will be exclusively assigned to pick up this return.'
                    : 'This return pickup task will be available in the Delivery Boy portal for any active online runner to accept.'}
                </p>
              </div>
            )}

            {/* Rejection Input if in REQUESTED state */}
            {selectedReturn.status === 'REQUESTED' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="font-semibold text-slate-600 block mb-1">
                  Rejection Justification (required if rejecting):
                </label>
                <input
                  type="text"
                  value={returnRejectionReason}
                  onChange={(e) => setReturnRejectionReason(e.target.value)}
                  placeholder="e.g., Proof photo invalid or unverified damage"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
              </div>
            )}

            {/* Gated Status Guidance Banners */}
            {['APPROVED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(selectedReturn.status) && !selectedReturn.pickupOtpVerified && selectedReturn.status !== 'PICKED_UP' && selectedReturn.order?.refundStatus !== 'PICKED_UP' && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                <span>
                  <strong>Pickup in Progress:</strong> Refund disbursement is strictly gated until the runner visits the student room and verifies the 6-digit OTP.
                </span>
              </div>
            )}

            {(selectedReturn.status === 'PICKED_UP' || selectedReturn.status === 'PROCESSING' || Boolean(selectedReturn.pickupOtpVerified) || selectedReturn.order?.refundStatus === 'PICKED_UP') && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Physical Pickup Verified via OTP!</strong> The product has been collected by the runner. You can now disburse the refund.
                </span>
              </div>
            )}

            {selectedReturn.status === 'REFUNDED' && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Refund Disbursed & Completed:</strong> ₹{selectedReturn.refundAmount} has been released and recorded in financial ledgers.
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 flex-wrap">
              {selectedReturn.status === 'REQUESTED' ? (
                <button
                  type="button"
                  onClick={handleRejectReturn}
                  disabled={processingReturn}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {processingReturn ? 'Processing...' : 'Reject Return'}
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Close
                </button>

                {/* Phase 1: Approve & Assign */}
                {selectedReturn.status === 'REQUESTED' && (
                  <button
                    type="button"
                    onClick={handleApproveReturn}
                    disabled={processingReturn}
                    className="px-4 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white rounded-xl font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{processingReturn ? 'Processing...' : (returnAssignBoyId ? 'Accept Return & Assign Runner' : 'Accept Return & Broadcast to All Runners')}</span>
                  </button>
                )}

                {/* Phase 2: Awaiting Pickup (Locked) */}
                {['APPROVED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(selectedReturn.status) && !selectedReturn.pickupOtpVerified && selectedReturn.status !== 'PICKED_UP' && selectedReturn.order?.refundStatus !== 'PICKED_UP' && (
                  <button
                    type="button"
                    disabled={true}
                    className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl font-bold border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Disburse Refund (Locked until Pickup)</span>
                  </button>
                )}

                {/* Phase 3: Pickup completed (Enabled) */}
                {(selectedReturn.status === 'PICKED_UP' || selectedReturn.status === 'PROCESSING' || Boolean(selectedReturn.pickupOtpVerified) || selectedReturn.order?.refundStatus === 'PICKED_UP') && (
                  <button
                    type="button"
                    onClick={handleDisburseRefund}
                    disabled={processingReturn}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{processingReturn ? 'Disbursing...' : `Disburse Refund (₹${selectedReturn.refundAmount})`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
