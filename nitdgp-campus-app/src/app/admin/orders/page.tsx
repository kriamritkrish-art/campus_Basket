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
  Check,
  Banknote
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
  const [adminEnteredOtp, setAdminEnteredOtp] = useState('');
  const [adminVerifyingOtp, setAdminVerifyingOtp] = useState(false);

  // Refund Disbursal Configuration State in Return Review Modal
  const [refundMethod, setRefundMethod] = useState<'RAZORPAY_GATEWAY' | 'MANUAL'>('MANUAL');
  const [refundUtr, setRefundUtr] = useState('');
  const [refundAdminNotes, setRefundAdminNotes] = useState('');
  const [isCashHandover, setIsCashHandover] = useState(false);
  const [requestingDetails, setRequestingDetails] = useState(false);

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

      // Status order: higher index = more advanced
      const STATUS_ORDER = ['REQUESTED', 'APPROVED', 'ACCEPTED', 'PICKUP_ASSIGNED', 'AWAITING_STUDENT_DETAILS', 'PROCESSING', 'PICKED_UP', 'COMPLETED', 'REFUNDED'];
      const statusRank = (s: string) => { const i = STATUS_ORDER.indexOf(s); return i === -1 ? 0 : i; };

      // Merge localStorage entries — always prefer the more advanced status
      if (typeof window !== 'undefined') {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cb_return_')) {
              const itemStr = localStorage.getItem(key);
              if (itemStr) {
                const item = JSON.parse(itemStr);
                if (item && (item.id || item.orderId)) {
                  const idx = returnsList.findIndex((r: any) =>
                    r.id === item.id ||
                    (item.orderId && r.orderId === item.orderId) ||
                    (item.orderNumber && r.order?.orderNumber === item.orderNumber)
                  );
                  if (idx >= 0) {
                    // Override if localStorage has a more advanced status than what API returned
                    if (statusRank(item.status) > statusRank(returnsList[idx].status)) {
                      returnsList[idx] = { ...returnsList[idx], ...item };
                    }
                  } else if (item.status && item.status !== 'REQUESTED') {
                    // Only add as a new row if it's not just a plain REQUESTED stale entry
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

  const openReturnReviewModal = async (ret: any) => {
    const isOnline = (ret.paymentMethod === 'ONLINE' || ret.order?.paymentMethod === 'ONLINE' || ret.order?.payment?.paymentMethod === 'ONLINE');
    setSelectedReturn(ret);
    setRefundMethod(isOnline ? 'RAZORPAY_GATEWAY' : 'MANUAL');
    setRefundUtr(`CB-REF-${Date.now().toString().slice(-6)}`);
    setRefundAdminNotes('');
    setIsCashHandover(false);
    setReturnAssignBoyId(ret.deliveryBoyId || '');
    setReturnRejectionReason('');
    setAdminEnteredOtp('');
    setReviewModalOpen(true);

    try {
      const returnId = encodeURIComponent(String(ret.id || ret.orderId || '').replace(/^#+/, '').trim());
      const res = await apiRequest(`/api/returns/${returnId}`);
      if (res.success && res.returnRequest) {
        setSelectedReturn(res.returnRequest);
        const latestIsOnline = (res.returnRequest.paymentMethod === 'ONLINE' || res.returnRequest.order?.paymentMethod === 'ONLINE' || res.returnRequest.order?.payment?.paymentMethod === 'ONLINE');
        if (!latestIsOnline) {
          setRefundMethod('MANUAL');
        }
      }
    } catch {}
  };

  const handleAdminVerifyOtp = async () => {
    if (!selectedReturn || adminEnteredOtp.trim().length !== 6) {
      alert('Please enter a valid 6-digit Return OTP.');
      return;
    }
    setAdminVerifyingOtp(true);
    try {
      const returnId = encodeURIComponent(String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '').trim());
      const res = await apiRequest(`/api/returns/${returnId}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ otp: adminEnteredOtp.trim() })
      });
      if (res.success) {
        alert('✓ Return pickup verified successfully! Refund disbursement is now unlocked.');
        setAdminEnteredOtp('');
        const updatedObj = {
          ...selectedReturn,
          status: 'COMPLETED',
          pickupOtpVerified: true,
          pickupOtpVerifiedAt: new Date().toISOString()
        };
        setSelectedReturn(updatedObj);
        if (typeof window !== 'undefined') {
          try {
            const rawId = String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '');
            localStorage.setItem(`cb_return_${rawId}`, JSON.stringify(updatedObj));
            localStorage.setItem('cb_return_active', JSON.stringify(updatedObj));
            if (selectedReturn.orderId) {
              localStorage.setItem(`cb_return_${selectedReturn.orderId}`, JSON.stringify(updatedObj));
            }
          } catch {}
        }
        fetchReturnRequests();
        fetchOrders();
      } else {
        alert(res.message || 'Incorrect 6-digit Return OTP. Please check the student live tracking screen.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to verify Return OTP.');
    } finally {
      setAdminVerifyingOtp(false);
    }
  };

  const handleDirectAssignRunner = async () => {
    if (!selectedReturn || !returnAssignBoyId) return;
    setProcessingReturn(true);
    try {
      const returnId = encodeURIComponent(String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '').trim());
      const res = await apiRequest(`/api/returns/${returnId}/assign-delivery`, {
        method: 'POST',
        body: JSON.stringify({ deliveryBoyId: returnAssignBoyId })
      });
      if (res.success) {
        alert('Delivery runner assigned successfully!');
        if (res.returnRequest) {
          setSelectedReturn(res.returnRequest);
        }
        fetchReturnRequests();
        fetchOrders();
      } else {
        alert(res.message || 'Failed to assign runner.');
      }
    } catch (err: any) {
      alert(err.message || 'Error assigning runner');
    } finally {
      setProcessingReturn(false);
    }
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
        const newStatus = returnAssignBoyId ? 'PICKUP_ASSIGNED' : 'APPROVED';
        const updatedReturn = res.returnRequest
          ? { ...selectedReturn, ...res.returnRequest, status: res.returnRequest.status || newStatus }
          : { ...selectedReturn, status: newStatus };

        // Optimistic update: immediately reflect new status in the table
        setReturnRequests((prev: any[]) =>
          prev.map((r: any) =>
            (r.id === selectedReturn.id || r.orderId === selectedReturn.orderId)
              ? { ...r, ...updatedReturn }
              : r
          )
        );
        setSelectedReturn(updatedReturn);

        if (typeof window !== 'undefined') {
          try {
            const rawId = String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '');
            const toStore = res.returnRequest || updatedReturn;
            localStorage.setItem(`cb_return_${rawId}`, JSON.stringify(toStore));
            localStorage.setItem('cb_return_active', JSON.stringify(toStore));
            if (toStore.orderId) {
              localStorage.setItem(`cb_return_${toStore.orderId}`, JSON.stringify(toStore));
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
    const isPickedUp = selectedReturn.status === 'COMPLETED' || selectedReturn.status === 'PICKED_UP' || selectedReturn.status === 'PROCESSING' || selectedReturn.status === 'AWAITING_STUDENT_DETAILS' || Boolean(selectedReturn.pickupOtpVerified) || selectedReturn.order?.refundStatus === 'PICKED_UP' || selectedReturn.order?.refundStatus === 'PROCESSING';
    if (!isPickedUp) {
      alert('Cannot disburse refund yet: Product pickup must be completed and verified via 6-digit OTP first.');
      return;
    }

    const orderPaymentMethod = selectedReturn.paymentMethod || selectedReturn.order?.paymentMethod || selectedReturn.order?.payment?.paymentMethod || 'ONLINE';
    const isOnline = orderPaymentMethod === 'ONLINE' || orderPaymentMethod === 'RAZORPAY';

    if (refundMethod === 'RAZORPAY_GATEWAY' && !isOnline) {
      alert('Direct Razorpay Gateway Refund is not available for Cash on Delivery (COD) orders. Please select Manual Disbursal.');
      return;
    }

    if (refundMethod === 'MANUAL' && !selectedReturn.refundAccount && !isCashHandover) {
      const proceed = confirm('Student has not provided bank or UPI details yet. If you are paying cash in person, please check "Physical cash handed over". Would you like to flag this return as "Bank Details Missing" instead?');
      if (proceed) {
        handleRequestStudentAccountDetails();
        return;
      }
    }

    setProcessingReturn(true);
    try {
      const returnId = encodeURIComponent(String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '').trim());
      const res = await apiRequest(`/api/returns/${returnId}/disburse-refund`, {
        method: 'POST',
        body: JSON.stringify({
          refundMethod,
          utrReference: refundMethod === 'MANUAL' ? (isCashHandover ? `CASH-${refundUtr.trim() || Date.now()}` : refundUtr.trim() || undefined) : undefined,
          adminNotes: refundAdminNotes.trim() || undefined
        })
      });
      if (res.success) {
        alert(`Refund of ₹${selectedReturn.refundAmount} successfully disbursed via ${refundMethod === 'RAZORPAY_GATEWAY' ? 'Direct Razorpay Reversal' : 'Manual Disbursal'}!`);
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

  const handleRequestStudentAccountDetails = async () => {
    if (!selectedReturn) return;
    setRequestingDetails(true);
    try {
      const returnId = encodeURIComponent(String(selectedReturn.id || selectedReturn.orderId || '').replace(/^#+/, '').trim());
      const res = await apiRequest(`/api/returns/${returnId}/request-account-details`, {
        method: 'POST',
        body: JSON.stringify({
          notes: refundAdminNotes.trim() || 'Student bank account or UPI details required for manual refund disbursal.'
        })
      });
      if (res.success) {
        alert('Disbursal paused. Status updated to AWAITING STUDENT DETAILS and Failure Reason recorded as: BANK/ACCOUNT DETAILS REQUIRED. The student will be prompted to submit account details.');
        const updated = {
          ...selectedReturn,
          status: 'AWAITING_STUDENT_DETAILS',
          refundFailureReason: 'BANK/ACCOUNT DETAILS REQUIRED'
        };
        setSelectedReturn(updated);
        setReturnRequests((prev) =>
          prev.map((r) => (r.id === selectedReturn.id || r.orderId === selectedReturn.orderId ? updated : r))
        );
        fetchReturnRequests();
      } else {
        alert(res.message || 'Failed to update failure reason.');
      }
    } catch (err: any) {
      alert(err.message || 'Error requesting account details');
    } finally {
      setRequestingDetails(false);
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
    const token = typeof window !== 'undefined' ? (localStorage.getItem('nit_token') || sessionStorage.getItem('nit_token')) : '';
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
      case 'AWAITING_STUDENT_DETAILS':
        return 'bg-amber-100 text-amber-900 border-amber-400';
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
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getReturnStatusBadge(
                              ret.status
                            )}`}
                          >
                            {ret.status === 'AWAITING_STUDENT_DETAILS'
                              ? '⚠️ Awaiting Account Details'
                              : ret.status === 'PICKED_UP'
                              ? '📦 Picked Up (Verified)'
                              : ret.status}
                          </span>
                          {ret.refundFailureReason && (
                            <div className="text-[10px] font-bold text-rose-700 mt-1">
                              Reason: {ret.refundFailureReason}
                            </div>
                          )}
                          {ret.status === 'REFUNDED' && (
                            <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                              {ret.refundMethod === 'RAZORPAY_GATEWAY' ? '⚡ Razorpay Gateway' : `🏦 Manual ${ret.refundTransactionRef ? `(${ret.refundTransactionRef})` : ''}`}
                            </div>
                          )}
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
                            className={`px-3 py-1.5 font-bold rounded-xl text-xs transition shadow-2xs ${
                              ret.status === 'AWAITING_STUDENT_DETAILS'
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-slate-100 hover:bg-[#4F9D32] hover:text-white text-slate-700'
                            }`}
                          >
                            {ret.status === 'AWAITING_STUDENT_DETAILS' ? 'Re-Distribute Refund' : 'Review & Manage'}
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

            {/* ── Return Workflow Progress Stepper ── */}
            {(() => {
              const s = selectedReturn.status;
              const otpDone = Boolean(selectedReturn.pickupOtpVerified) || s === 'COMPLETED' || s === 'PICKED_UP' || s === 'PROCESSING' || selectedReturn.order?.refundStatus === 'PICKED_UP' || selectedReturn.order?.refundStatus === 'PROCESSING';
              const approved = ['APPROVED','ACCEPTED','PICKUP_ASSIGNED','COMPLETED','PICKED_UP','PROCESSING','REFUNDED'].includes(s) || otpDone;
              const refunded = s === 'REFUNDED';

              const stages = [
                {
                  icon: <RotateCcw className="w-4 h-4" />,
                  label: 'Return Requested',
                  sub: 'Student submitted return',
                  done: true,
                  active: s === 'REQUESTED'
                },
                {
                  icon: <Check className="w-4 h-4" />,
                  label: 'Admin Approved',
                  sub: approved ? (selectedReturn.deliveryBoy ? `Runner: ${selectedReturn.deliveryBoy.fullName}` : 'Broadcast to runners') : 'Awaiting your approval',
                  done: approved,
                  active: approved && !otpDone
                },
                {
                  icon: <ShieldCheck className="w-4 h-4" />,
                  label: 'Pickup OTP Verified',
                  sub: otpDone ? 'Item collected by runner ✓' : approved ? 'Waiting for runner to collect' : 'Locked until approved',
                  done: otpDone,
                  active: otpDone && !refunded
                },
                {
                  icon: <Banknote className="w-4 h-4" />,
                  label: `Refund Disbursed`,
                  sub: refunded ? `₹${selectedReturn.refundAmount} released ✓` : otpDone ? `Ready — ₹${selectedReturn.refundAmount} to disburse` : 'Locked until pickup verified',
                  done: refunded,
                  active: otpDone && !refunded
                }
              ];

              return (
                <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">Return Pickup Workflow</span>
                  <div className="flex items-start gap-0">
                    {stages.map((stage, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                          {/* Circle */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                            stage.done
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                              : stage.active
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 animate-pulse'
                              : 'bg-white border-slate-200 text-slate-300'
                          }`}>
                            {stage.icon}
                          </div>
                          {/* Label */}
                          <div className="text-center px-0.5">
                            <div className={`text-[10px] font-bold leading-tight ${
                              stage.done ? 'text-emerald-700' : stage.active ? 'text-blue-700' : 'text-slate-400'
                            }`}>{stage.label}</div>
                            <div className="text-[9px] text-slate-400 leading-tight mt-0.5 truncate">{stage.sub}</div>
                          </div>
                        </div>
                        {/* Connector line */}
                        {idx < stages.length - 1 && (
                          <div className={`h-0.5 mt-4 flex-1 mx-1 rounded-full transition-all ${
                            stages[idx + 1].done || stages[idx + 1].active
                              ? 'bg-emerald-400'
                              : 'bg-slate-200'
                          }`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  {/* Active step hint */}
                  {!refunded && (
                    <div className={`mt-3 text-[11px] font-semibold px-3 py-2 rounded-xl ${
                      !approved
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : !otpDone
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {!approved && '⏳ Action required: Review and approve this return request below.'}
                      {approved && !otpDone && '⏳ Waiting for runner to visit student\'s room and verify the 6-digit OTP.'}
                      {otpDone && !refunded && '✅ Pickup verified! You can now disburse the refund to the student.'}
                    </div>
                  )}
                </div>
              );
            })()}

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

            {/* Confidential Pickup OTP Notice & Direct Admin Handover Verification */}
            {['APPROVED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(selectedReturn.status) && !selectedReturn.pickupOtpVerified && selectedReturn.status !== 'COMPLETED' && selectedReturn.status !== 'PICKED_UP' && (
              <div className="p-3 bg-blue-50/90 rounded-xl border border-blue-200 text-blue-900 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block text-blue-950">Student Handover OTP Verification</span>
                    <span className="text-[11px] text-blue-800">
                      The runner collects and verifies this 6-digit code at the student's door. You can also verify the student's code here directly to complete the pickup and unlock refund disbursement.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={adminEnteredOtp}
                    onChange={(e) => setAdminEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-40 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold tracking-widest text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAdminVerifyOtp}
                    disabled={adminVerifyingOtp || adminEnteredOtp.length !== 6}
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{adminVerifyingOtp ? 'Verifying...' : 'Verify Pickup OTP'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Assigned Pickup Runner (Runner B) or Assignment Selector */}
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
            ) : (selectedReturn.status === 'REQUESTED' || selectedReturn.status === 'APPROVED') && (
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-700 block">
                  Delivery Runner Assignment (Choose Specific or Broadcast)
                </label>
                <div className="flex gap-2">
                  <select
                    value={returnAssignBoyId}
                    onChange={(e) => setReturnAssignBoyId(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-rose-500 text-xs"
                  >
                    <option value="">📢 Broadcast to All Runners (Available for any online runner to accept)</option>
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
                  {selectedReturn.status === 'APPROVED' && returnAssignBoyId && (
                    <button
                      type="button"
                      onClick={handleDirectAssignRunner}
                      disabled={processingReturn}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                    >
                      Assign
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {returnAssignBoyId
                    ? 'Selected runner will be exclusively assigned to pick up this return.'
                    : 'This return pickup task is broadcast to the Delivery Boy portal for any active online runner to accept.'}
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
                  <strong>Refund Disbursed &amp; Completed:</strong> ₹{selectedReturn.refundAmount} has been released and recorded in financial ledgers via {selectedReturn.refundMethod === 'RAZORPAY_GATEWAY' ? 'Direct Razorpay Gateway Reversal' : 'Manual Disbursal'}.
                </span>
              </div>
            )}

            {/* Student Refund Destination Account & Disbursal Channels (Online Razorpay vs Manual COD) */}
            {(() => {
              const orderPaymentMethod = selectedReturn.paymentMethod || selectedReturn.order?.paymentMethod || selectedReturn.order?.payment?.paymentMethod || 'ONLINE';
              const isOnline = orderPaymentMethod === 'ONLINE' || orderPaymentMethod === 'RAZORPAY';
              const hasAccount = Boolean(selectedReturn.refundAccount);
              const isAwaitingDetails = selectedReturn.status === 'AWAITING_STUDENT_DETAILS';
              const isPickedUp = selectedReturn.status === 'COMPLETED' || selectedReturn.status === 'PICKED_UP' || selectedReturn.status === 'PROCESSING' || isAwaitingDetails || Boolean(selectedReturn.pickupOtpVerified) || selectedReturn.order?.refundStatus === 'PICKED_UP' || selectedReturn.order?.refundStatus === 'PROCESSING';

              return (
                <div className="space-y-3 pt-2">
                  {/* Student Provided Account Details Card */}
                  <div className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                    hasAccount
                      ? 'bg-emerald-50/50 border-emerald-300 text-slate-800'
                      : isAwaitingDetails
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className={`w-4 h-4 ${hasAccount ? 'text-emerald-700' : 'text-amber-600'}`} />
                        <span className="font-bold text-xs uppercase tracking-wider">
                          Student Refund Destination Account Details
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        hasAccount
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {hasAccount ? '✓ Verified Details Provided' : '⚠️ Bank Details Missing'}
                      </span>
                    </div>

                    {hasAccount ? (
                      <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1.5 text-xs shadow-2xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Account Holder</span>
                            <strong className="text-slate-900">{selectedReturn.refundAccount.accountHolderName || selectedReturn.studentName || selectedReturn.order?.student?.fullName}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Bank Name</span>
                            <strong className="text-slate-900">{selectedReturn.refundAccount.bankName || 'State Bank of India (NIT Campus)'}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Account Number</span>
                            <strong className="font-mono text-emerald-800 tracking-wider">
                              {selectedReturn.refundAccount.accountNumber || '•••• •••• ••••'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">IFSC Code</span>
                            <strong className="font-mono text-slate-800">{selectedReturn.refundAccount.ifscCode || 'SBIN0002110'}</strong>
                          </div>
                        </div>
                        {selectedReturn.refundAccount.upiId && (
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">UPI VPA / ID:</span>
                            <strong className="font-mono text-indigo-700 font-bold">{selectedReturn.refundAccount.upiId}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white/80 p-3 rounded-lg border border-amber-300 space-y-2 text-xs">
                        <p className="text-amber-900 font-medium leading-relaxed">
                          Student has <strong>not yet submitted</strong> bank account or UPI details in their profile or tracking screen.
                        </p>

                        {/* If status is already Awaiting or has Failure Reason */}
                        {(isAwaitingDetails || selectedReturn.refundFailureReason) && (
                          <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Payment Status: FAILED / PAUSED</span>
                            </div>
                            <div className="text-[11px]">
                              Failure Reason: <strong className="text-rose-950 font-black">BANK/ACCOUNT DETAILS REQUIRED</strong>
                            </div>
                            <p className="text-[10px] text-rose-700">
                              Student has been notified to enter their bank details on the order tracking page. Once provided, this order will be unlocked for re-distribution.
                            </p>
                          </div>
                        )}

                        {/* Action to flag as Bank Details Missing */}
                        {!isAwaitingDetails && isPickedUp && selectedReturn.status !== 'REFUNDED' && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={handleRequestStudentAccountDetails}
                              disabled={requestingDetails}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{requestingDetails ? 'Flagging...' : 'Flag: Bank Details Missing (Request Student Details)'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Disbursal Channel Options (Only shown when pickup is ready or completed and not yet refunded) */}
                  {isPickedUp && selectedReturn.status !== 'REFUNDED' && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
                          Refund Disbursal Channel
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isOnline
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          Original Payment: {isOnline ? '💳 Online (Prepaid)' : '💵 Cash On Delivery (COD)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Option 1: Direct Razorpay Gateway */}
                        <div
                          onClick={() => {
                            if (isOnline) setRefundMethod('RAZORPAY_GATEWAY');
                          }}
                          className={`p-3 rounded-xl border transition-all ${
                            !isOnline
                              ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                              : refundMethod === 'RAZORPAY_GATEWAY'
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs cursor-pointer'
                              : 'bg-white border-slate-200 hover:border-blue-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                              <span>⚡ Direct Razorpay Gateway</span>
                            </div>
                            <input
                              type="radio"
                              name="refundMethodRadio"
                              checked={refundMethod === 'RAZORPAY_GATEWAY'}
                              onChange={() => { if (isOnline) setRefundMethod('RAZORPAY_GATEWAY'); }}
                              disabled={!isOnline}
                              className="accent-blue-600 cursor-pointer"
                            />
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {isOnline
                              ? 'Instant direct reversal to student’s original source (Card/UPI/Netbanking) via Razorpay. Does not require bank account details.'
                              : '❌ Not available for COD orders — physical cash was collected, so no Razorpay gateway payment exists to reverse.'}
                          </p>
                        </div>

                        {/* Option 2: Manual Disbursal */}
                        <div
                          onClick={() => setRefundMethod('MANUAL')}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            refundMethod === 'MANUAL'
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                              <Banknote className="w-4 h-4 text-emerald-600" />
                              <span>🏦 Manual Disbursal</span>
                            </div>
                            <input
                              type="radio"
                              name="refundMethodRadio"
                              checked={refundMethod === 'MANUAL'}
                              onChange={() => setRefundMethod('MANUAL')}
                              className="accent-emerald-600 cursor-pointer"
                            />
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            Admin manually transfers funds via IMPS/NEFT/UPI to student’s bank account or hands over physical cash directly.
                          </p>
                        </div>
                      </div>

                      {/* Manual Disbursal Fields */}
                      {refundMethod === 'MANUAL' && (
                        <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2.5 animate-fade-in text-xs">
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">
                              UTR Reference / Bank Transaction ID / Cash Receipt Ref:
                            </label>
                            <input
                              type="text"
                              value={refundUtr}
                              onChange={(e) => setRefundUtr(e.target.value)}
                              placeholder="e.g. UTR12345678 or CB-CASH-REF"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {!hasAccount && (
                            <label className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isCashHandover}
                                onChange={(e) => setIsCashHandover(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-[11px] font-semibold">
                                Physical cash has been handed over directly to the student in person. (Bypasses missing bank details)
                              </span>
                            </label>
                          )}

                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">
                              Admin Notes / Settlement Memo (Optional):
                            </label>
                            <input
                              type="text"
                              value={refundAdminNotes}
                              onChange={(e) => setRefundAdminNotes(e.target.value)}
                              placeholder="e.g. Transferred via campus SBI branch or UPI"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

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
                {['APPROVED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(selectedReturn.status) && !selectedReturn.pickupOtpVerified && selectedReturn.status !== 'COMPLETED' && selectedReturn.status !== 'PICKED_UP' && selectedReturn.order?.refundStatus !== 'PICKED_UP' && selectedReturn.order?.refundStatus !== 'PROCESSING' && (
                  <button
                    type="button"
                    disabled={true}
                    className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl font-bold border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Disburse Refund (Locked until Pickup)</span>
                  </button>
                )}

                {/* Phase 3: Pickup completed OR Awaiting Student Details */}
                {(selectedReturn.status === 'COMPLETED' || selectedReturn.status === 'PICKED_UP' || selectedReturn.status === 'PROCESSING' || selectedReturn.status === 'AWAITING_STUDENT_DETAILS' || Boolean(selectedReturn.pickupOtpVerified) || selectedReturn.order?.refundStatus === 'PICKED_UP' || selectedReturn.order?.refundStatus === 'PROCESSING') && selectedReturn.status !== 'REFUNDED' && (
                  <>
                    {/* If in Awaiting Details and student STILL hasn't provided details AND not cash handover AND refundMethod is MANUAL */}
                    {selectedReturn.status === 'AWAITING_STUDENT_DETAILS' && !selectedReturn.refundAccount && !isCashHandover && refundMethod === 'MANUAL' ? (
                      <button
                        type="button"
                        onClick={handleRequestStudentAccountDetails}
                        disabled={requestingDetails}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>{requestingDetails ? 'Updating...' : '⚠️ Awaiting Student Account Details'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDisburseRefund}
                        disabled={processingReturn}
                        className={`px-5 py-2 rounded-xl font-black shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          selectedReturn.status === 'AWAITING_STUDENT_DETAILS'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : refundMethod === 'RAZORPAY_GATEWAY'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {selectedReturn.status === 'AWAITING_STUDENT_DETAILS' ? (
                          <>
                            <RefreshCw className={`w-4 h-4 ${processingReturn ? 'animate-spin' : ''}`} />
                            <span>{processingReturn ? 'Re-Distributing...' : `Re-Distribute Refund (₹${selectedReturn.refundAmount})`}</span>
                          </>
                        ) : refundMethod === 'RAZORPAY_GATEWAY' ? (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>{processingReturn ? 'Processing Gateway Reversal...' : `Disburse via Razorpay Gateway (₹${selectedReturn.refundAmount})`}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>{processingReturn ? 'Disbursing...' : `Disburse Manual Refund (₹${selectedReturn.refundAmount})`}</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
