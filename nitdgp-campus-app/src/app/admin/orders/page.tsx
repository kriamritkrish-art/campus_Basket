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
  AlertTriangle
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

  const fetchDeliveryBoys = async () => {
    try {
      const res = await apiRequest('/api/admin/delivery-boys');
      if (res.success && res.deliveryBoys) {
        setDeliveryBoys(res.deliveryBoys.filter((b: any) => b.status === 'ACTIVE'));
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
        // If drawer is open, keep selected order updated
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

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter, hallFilter, dateRange]);

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
      }
    } catch (err: any) {
      alert(err.message || 'Refund failed');
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('nit_token');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    window.open(`${backendUrl}/api/admin/reports/export-csv?type=orders&token=${token}`, '_blank');
  };

  // KPIs
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING').length;
  const deliveryCount = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'REFUNDED').length;

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

  const getPaymentBadgeClass = (method: string, status: string) => {
    if (status === 'COMPLETED' || status === 'PAID') {
      return 'bg-emerald-50 text-[#347A27] border-emerald-200';
    }
    if (method === 'COD') {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Milestones helper
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
            Real-time fulfillment tracking, room drops, payment captures &amp; dispute resolutions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 1. ORDER SUMMARY KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Listed</span>
          <div className="text-xl font-black text-[#17202A] mt-1">{totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase">Pending Prep</span>
          <div className="text-xl font-black text-amber-700 mt-1">{pendingCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase">Out for Delivery</span>
          <div className="text-xl font-black text-blue-700 mt-1">{deliveryCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-[#347A27] uppercase">Delivered</span>
          <div className="text-xl font-black text-[#347A27] mt-1">{deliveredCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-red-700 uppercase">Cancelled / Refunded</span>
          <div className="text-xl font-black text-red-700 mt-1">{cancelledCount}</div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order Number, Student Name, Roll No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32]"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUND_REQUESTED">Refund Requested</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32]"
          >
            <option value="ALL">All Payments</option>
            <option value="ONLINE">Razorpay / Online</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>

          {/* Hall Filter */}
          <select
            value={hallFilter}
            onChange={(e) => setHallFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32]"
          >
            <option value="ALL">All Halls</option>
            <option value="Hall 1">Hall 1</option>
            <option value="Hall 2">Hall 2</option>
            <option value="Hall 3">Hall 3</option>
            <option value="Hall 4">Hall 4</option>
            <option value="Hall 5">Hall 5</option>
            <option value="Hall 6">Hall 6</option>
            <option value="Hall 7">Hall 7</option>
            <option value="Hall 8">Hall 8</option>
            <option value="Hall 9">Hall 9</option>
            <option value="Hall 10">Hall 10</option>
            <option value="Hall 11">Hall 11</option>
            <option value="Hall 12">Hall 12</option>
            <option value="Hall 13">Hall 13</option>
            <option value="Hall 14">Hall 14</option>
          </select>
        </div>
      </div>

      {/* 3. ORDERS DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Fetching orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-[#17202A]">No orders matched your filters</div>
            <p className="text-xs text-slate-500 mt-1">Try resetting the status or date filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Student &amp; Hostel</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Order Stage</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-[#4F9D32]">
                      {o.orderNumber}
                      <div className="text-[10px] text-slate-400 font-normal font-sans">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-[#17202A]">{o.studentName}</div>
                      <div className="text-[11px] text-slate-500">
                        {o.hallName} &bull; Room {o.roomNumber}
                      </div>
                      <div className="text-[10px] mt-0.5 flex items-center gap-1 font-semibold">
                        <Truck className="w-3 h-3 text-sky-600" />
                        {o.deliveryBoy ? (
                          <span className="text-sky-700 font-bold">{o.deliveryBoy.fullName}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Unassigned</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-700 max-w-xs">
                      <div className="line-clamp-1 font-medium">
                        {o.items?.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ') || '1x Order item'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {o.items?.length || 1} distinct item(s)
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-sm text-[#17202A]">
                      ₹{o.totalAmount}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPaymentBadgeClass(
                          o.paymentMethod,
                          o.paymentStatus
                        )}`}
                      >
                        {o.paymentMethod} &bull; {o.paymentStatus}
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
                        <option value="REFUND_REQUESTED">REFUND REQUESTED</option>
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
                    <span className="font-mono font-medium">₹{selectedOrder.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-mono font-medium text-[#347A27]">₹0 (Campus Drop)</span>
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

      {/* ASSIGN DELIVERY RUNNER MODAL */}
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
    </div>
  );
}
