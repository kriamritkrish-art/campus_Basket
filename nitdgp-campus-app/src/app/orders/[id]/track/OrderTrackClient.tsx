'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest, getApiBase } from '../../../../lib/api';
import { useCart } from '../../../../context/CartContext';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  HelpCircle,
  RotateCcw,
  ShoppingBag,
  User,
  Phone,
  Copy,
  AlertTriangle,
  FileText,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Banknote,
  X,
  Edit3,
  ChevronRight,
  ExternalLink,
  Info,
  Plus,
  Minus,
  Camera,
  Package,
  RefreshCw,
  Check,
  Download,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string | null;
}

interface OrderData {
  id: string;
  orderNumber: string;
  serviceType?: string;
  status: string;
  providerAccepted?: boolean;
  providerAcceptedAt?: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  advancePaidAmount?: number;
  refundAmount?: number;
  refundStatus?: string;
  cancellationType?: string;
  cancellationReason?: string;
  deliveryOtp?: string | null;
  deliveryOtpVerified?: boolean;
  hallName: string;
  roomNumber: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  createdAt: string;
  items: OrderItem[];
  canCancel?: boolean;
  isAccepted?: boolean;
  isModifiable?: boolean;
  deliveryBoy?: {
    id: string;
    fullName: string;
    mobileNumber?: string;
    vehicleType?: string;
  } | null;
  provider?: {
    id?: string;
    fullName: string;
    mobileNumber?: string;
    serviceCategory?: string;
  } | null;
  refundAccount?: {
    accountType: string;
    accountHolderName: string;
    bankName?: string;
    accountNumberMasked?: string;
    upiIdMasked?: string;
  } | null;
  student?: {
    fullName?: string;
    rollNumber?: string;
    collegeEmail?: string;
  } | null;
}

export default function OrderTrackClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { addItem, showToast } = useCart();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plan / placed by mistake');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [modifying, setModifying] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newInstructions, setNewInstructions] = useState('');

  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState("Where is my delivery?");
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [showDeliveryHistory, setShowDeliveryHistory] = useState(false);

  // Refund destination account modal (opened only when student clicks "Update Refund Account")
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountType, setAccountType] = useState<'UPI' | 'BANK_ACCOUNT'>('UPI');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Return Request state
  const [returnRequest, setReturnRequest] = useState<any>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReasonType, setReturnReasonType] = useState<'PRODUCT_ISSUE' | 'MIND_CHANGE'>('PRODUCT_ISSUE');
  const [returnReasonDetails, setReturnReasonDetails] = useState('');
  const [returnProofImageUrl, setReturnProofImageUrl] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [adminReturnFee, setAdminReturnFee] = useState(15);

  // Add Products / Edit Order state
  const [addItemsModalOpen, setAddItemsModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedNewItems, setSelectedNewItems] = useState<{ [productId: string]: number }>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addingItems, setAddingItems] = useState(false);

  const fetchOrder = async () => {
    try {
      const [orderRes, returnRes] = await Promise.all([
        apiRequest(`/api/orders/${orderId}`),
        apiRequest(`/api/orders/${orderId}/return`).catch(() => null)
      ]);

      if (orderRes.success && orderRes.order) {
        setOrder(orderRes.order);
        setNewRoomNumber(orderRes.order.roomNumber || '');
        setNewInstructions(orderRes.order.specialInstructions || '');
      } else {
        setError(orderRes.message || 'Order not found');
      }

      if (returnRes?.success && returnRes.returnRequest) {
        setReturnRequest(returnRes.returnRequest);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load order tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      // Polling every 12 seconds for real-time runner/status updates
      const timer = setInterval(fetchOrder, 12000);
      return () => clearInterval(timer);
    }
  }, [orderId]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await apiRequest(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.success) {
        setCancelSuccessMsg(res.explanation || res.message || 'Order cancelled successfully.');
        fetchOrder();
        setTimeout(() => {
          setCancelModalOpen(false);
          setCancelSuccessMsg(null);
        }, 2000);
      } else {
        showToast(res.message || 'Unable to cancel order');
      }
    } catch (err: any) {
      showToast(err?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleModifyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setModifying(true);
    try {
      const res = await apiRequest(`/api/orders/${orderId}/modify`, {
        method: 'PATCH',
        body: JSON.stringify({
          roomNumber: newRoomNumber,
          specialInstructions: newInstructions
        })
      });
      if (res.success) {
        showToast('Delivery room details updated.');
        setModifyModalOpen(false);
        fetchOrder();
      } else {
        showToast(res.message || 'Could not update details');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update order details');
    } finally {
      setModifying(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSubmitting(true);
    try {
      await apiRequest('/api/campus/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          category: 'DELIVERY',
          message: `[Issue: ${supportCategory}] ${supportMessage}`,
          priority: 'HIGH'
        })
      });
      setSupportSuccess('Support query logged. Campus Desk will respond shortly.');
      setSupportMessage('');
      setTimeout(() => {
        setSupportModalOpen(false);
        setSupportSuccess(null);
      }, 1500);
    } catch {
      setSupportSuccess('Support request received. Runner desk alerted.');
      setTimeout(() => {
        setSupportModalOpen(false);
        setSupportSuccess(null);
      }, 1500);
    } finally {
      setSupportSubmitting(false);
    }
  };

  const handleSaveRefundAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolderName.trim()) {
      showToast('Account holder name is required.');
      return;
    }
    setSavingAccount(true);
    try {
      const res = await apiRequest('/api/orders/refund-account', {
        method: 'POST',
        body: JSON.stringify({
          accountType,
          accountHolderName,
          bankName: accountType === 'BANK_ACCOUNT' ? bankName : undefined,
          accountNumber: accountType === 'BANK_ACCOUNT' ? accountNumber : undefined,
          ifscCode: accountType === 'BANK_ACCOUNT' ? ifscCode : undefined,
          upiId: accountType === 'UPI' ? upiId : undefined
        })
      });
      if (res.success) {
        showToast('Refund destination account saved securely.');
        setAccountModalOpen(false);
        fetchOrder();
      } else {
        showToast(res.message || 'Failed to save account');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save account');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDownloadPdfReceipt = async () => {
    if (!order) return;
    setDownloadingReceipt(true);
    try {
      const base = getApiBase();
      const token = typeof window !== 'undefined' ? localStorage.getItem('nit_token') : null;
      const res = await fetch(`${base}/api/orders/${order.id}/receipt`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        throw new Error('Failed to generate PDF receipt');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Official PDF Receipt downloaded!');
    } catch (err: any) {
      showToast(err?.message || 'Error downloading receipt PDF');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handleReorder = () => {
    if (!order) return;
    let count = 0;
    for (const item of order.items || []) {
      addItem({
        id: item.id,
        name: item.productName,
        price: item.unitPrice,
        unit: 'unit',
        primaryImage: item.image || null,
        category: { id: 'cat_food', name: 'Food', slug: 'food' }
      } as any, item.quantity);
      count += item.quantity;
    }
    showToast(`${count} item(s) added to basket.`);
    router.push('/cart');
  };

  const fetchAvailableProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await apiRequest('/api/products?limit=25');
      if (res.success && res.products) {
        setAvailableProducts(res.products.filter((p: any) => p.availability && p.stock > 0));
      }
    } catch {
      // ignore
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setSelectedNewItems((prev) => {
      const current = prev[productId] || 0;
      const nextVal = Math.max(0, current + delta);
      if (nextVal === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: nextVal };
    });
  };

  const handleAddItemsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const addedItems = Object.entries(selectedNewItems)
      .map(([productId, quantity]) => ({ productId, quantity }))
      .filter((i) => i.quantity > 0);

    if (addedItems.length === 0) {
      showToast('Please select at least 1 item to add.');
      return;
    }

    setAddingItems(true);
    try {
      const res = await apiRequest(`/api/orders/${orderId}/add-items`, {
        method: 'POST',
        body: JSON.stringify({ addedItems })
      });
      if (res.success) {
        showToast('New products added to your order successfully!');
        setAddItemsModalOpen(false);
        setSelectedNewItems({});
        fetchOrder();
      } else {
        showToast(res.message || 'Failed to add items to order');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error updating order items');
    } finally {
      setAddingItems(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnReasonType === 'PRODUCT_ISSUE') {
      if (!returnProofImageUrl.trim() && returnReasonDetails.trim().length < 10) {
        showToast('Please provide a photo proof URL or a clear description of the defect.');
        return;
      }
    } else if (!returnReasonDetails.trim()) {
      showToast('Please specify the reason for return.');
      return;
    }

    setReturnSubmitting(true);
    try {
      const res = await apiRequest(`/api/orders/${orderId}/return`, {
        method: 'POST',
        body: JSON.stringify({
          reasonType: returnReasonType,
          reasonDetails: returnReasonDetails,
          proofImageUrl: returnProofImageUrl.trim() || undefined
        })
      });
      if (res.success) {
        showToast('Return request submitted for Admin review!');
        setReturnModalOpen(false);
        setReturnRequest(res.returnRequest);
        fetchOrder();
      } else {
        showToast(res.message || 'Unable to submit return request');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit return request');
    } finally {
      setReturnSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6">
        <div className="w-9 h-9 border-3 border-[#4F9D2F] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading order tracking...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Order Tracking Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm">{error || 'Could not find this order.'}</p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  // Derived flags
  const isCod = order.paymentMethod === 'CASH_ON_DELIVERY';
  const isPrepaid = !isCod;
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = ['DELIVERED', 'COMPLETED'].includes(order.status);
  const isProviderAccepted = Boolean(
    order.providerAccepted ||
    ['ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'DISPATCHED'].includes(order.status)
  );

  // Handover state: Only show OTP when order is at handover stage
  const isHandoverState = ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'READY', 'READY_FOR_PICKUP'].includes(order.status);

  // Service Type
  const service = (order.serviceType || 'FOOD').toUpperCase();
  const isFood = service === 'FOOD';
  const isLaundry = service === 'LAUNDRY';
  const isProduce = service === 'FRESH_PRODUCE';

  // Service-specific timeline steps
  let timelineSteps: { id: string; title: string; desc: string }[] = [];

  if (isFood) {
    timelineSteps = [
      { id: 'PLACED', title: 'Order Placed', desc: 'Received & sent to kitchen' },
      { id: 'ACCEPTED', title: 'Provider Accepted', desc: 'Kitchen queued preparation' },
      { id: 'PREPARING', title: 'Preparing', desc: 'Freshly cooking your meal' },
      { id: 'PACKED', title: 'Packed & Ready', desc: 'Food packed in insulated container' },
      { id: 'ASSIGNED', title: 'Runner Assigned', desc: 'Campus runner at dining hall' },
      { id: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Runner in transit to your hostel' },
      { id: 'DELIVERED', title: 'Delivered', desc: 'Handed over at your room door' }
    ];
  } else if (isProduce) {
    timelineSteps = [
      { id: 'PLACED', title: 'Order Placed', desc: 'Received at campus mandi' },
      { id: 'ACCEPTED', title: 'Provider Accepted', desc: 'Vendor confirmed harvest batch' },
      { id: 'PREPARING', title: 'Items Being Prepared', desc: 'Fresh sorting & weight audit' },
      { id: 'PACKED', title: 'Packed & Ready', desc: 'Bagged & tagged for transit' },
      { id: 'ASSIGNED', title: 'Runner Assigned', desc: 'Campus runner heading to store' },
      { id: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Runner on route to your hall' },
      { id: 'DELIVERED', title: 'Delivered', desc: 'Fresh produce delivered' }
    ];
  } else if (isLaundry) {
    timelineSteps = [
      { id: 'PLACED', title: 'Order Placed', desc: 'Pickup scheduled at hostel room' },
      { id: 'ACCEPTED', title: 'Laundry Accepted', desc: 'Dhobi vendor assigned' },
      { id: 'COLLECTED', title: 'Clothes Received', desc: 'Collected & weighed' },
      { id: 'PROCESSING', title: 'Processing', desc: 'Wash cycle & steam press' },
      { id: 'READY', title: 'Ready', desc: 'Folded & packaged in laundry bag' },
      { id: 'ASSIGNED', title: 'Runner Assigned', desc: 'Runner assigned for room return' },
      { id: 'DELIVERED', title: 'Delivered', desc: 'Returned intact to your room' }
    ];
  } else {
    // Stationery / Essentials default
    timelineSteps = [
      { id: 'PLACED', title: 'Order Placed', desc: 'Order logged & store notified' },
      { id: 'ACCEPTED', title: 'Provider Accepted', desc: 'Store clerk verified inventory' },
      { id: 'PREPARING', title: 'Items Being Prepared', desc: 'Articles picked from shelf' },
      { id: 'PACKED', title: 'Packed', desc: 'Parcel sealed & tagged' },
      { id: 'ASSIGNED', title: 'Runner Assigned', desc: 'Campus runner dispatched' },
      { id: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Runner on campus route' },
      { id: 'DELIVERED', title: 'Delivered', desc: 'Delivered at your doorstep' }
    ];
  }

  // Calculate current active step index strictly without contradictions
  const getTimelineStepIndex = () => {
    if (!isProviderAccepted) return 1; // Order placed is done (0), Provider Acceptance is current (1)
    const s = order.status;
    if (s === 'ACCEPTED') return 1;
    if (s === 'PREPARING') return 2;
    if (s === 'READY' || s === 'PACKED') return 3;
    if (s === 'DELIVERY_ASSIGNED' || s === 'PICKED_UP') return 4;
    if (s === 'OUT_FOR_DELIVERY' || s === 'IN_TRANSIT') return 5;
    if (s === 'DELIVERED' || s === 'COMPLETED') return 6;
    return 1;
  };

  const currentStepIdx = getTimelineStepIndex();

  // Current Status Headline & Explanation
  const getStatusBanner = () => {
    if (returnRequest && returnRequest.status !== 'REJECTED') {
      if (returnRequest.status === 'REFUNDED' || returnRequest.status === 'COMPLETED') {
        return {
          title: 'Return Completed & Refund Disbursed',
          desc: `Full refund of ₹${Number(returnRequest.refundAmount || 0).toFixed(2)} has been credited to your destination account.`,
          colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotClass: 'bg-emerald-500'
        };
      }
      if (returnRequest.status === 'PICKED_UP') {
        return {
          title: 'Item Picked Up — Refund Processing',
          desc: 'Product physically collected and OTP verified by campus runner. Admin is releasing your refund.',
          colorClass: 'bg-indigo-50 text-indigo-900 border-indigo-200',
          dotClass: 'bg-indigo-500 animate-pulse'
        };
      }
      if (['APPROVED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(returnRequest.status)) {
        return {
          title: 'Return Approved — Pickup Scheduled',
          desc: 'Campus runner assigned for hostel room pickup. Share your 6-digit Return OTP at handover.',
          colorClass: 'bg-blue-50 text-blue-900 border-blue-200',
          dotClass: 'bg-blue-500 animate-pulse'
        };
      }
      return {
        title: 'Return Under Review',
        desc: 'Return request submitted. Under review by Campus Basket Admin with defect proof & delivery history.',
        colorClass: 'bg-amber-50 text-amber-900 border-amber-200',
        dotClass: 'bg-amber-500 animate-pulse'
      };
    }
    if (isCancelled) {
      return {
        title: 'Order Cancelled',
        desc: order.cancellationReason || 'This order was cancelled before fulfillment.',
        colorClass: 'bg-red-50 text-red-800 border-red-200',
        dotClass: 'bg-red-500'
      };
    }
    if (isDelivered) {
      return {
        title: 'Delivered at Doorstep',
        desc: 'Delivery completed and verified via 6-digit handover OTP.',
        colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-500'
      };
    }
    if (!isProviderAccepted) {
      return {
        title: 'Waiting for Provider',
        desc: "Your order has been placed and we're waiting for the provider to accept it.",
        colorClass: 'bg-amber-50 text-amber-900 border-amber-200',
        dotClass: 'bg-amber-500 animate-pulse'
      };
    }
    if (['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(order.status)) {
      return {
        title: 'Out for Delivery',
        desc: 'Campus runner is in transit to your residence hall.',
        colorClass: 'bg-sky-50 text-sky-900 border-sky-200',
        dotClass: 'bg-sky-500 animate-pulse'
      };
    }
    if (['DELIVERY_ASSIGNED', 'PICKED_UP'].includes(order.status)) {
      return {
        title: 'Runner Assigned',
        desc: 'Campus runner assigned and heading to collect your parcel.',
        colorClass: 'bg-purple-50 text-purple-900 border-purple-200',
        dotClass: 'bg-purple-500'
      };
    }
    if (order.status === 'READY' || order.status === 'PACKED') {
      return {
        title: 'Packed & Ready',
        desc: 'Your items are securely packaged and waiting for runner dispatch.',
        colorClass: 'bg-indigo-50 text-indigo-900 border-indigo-200',
        dotClass: 'bg-indigo-500'
      };
    }
    if (order.status === 'PREPARING') {
      return {
        title: isFood ? 'Freshly Cooking' : 'Preparing Items',
        desc: isFood ? 'Chef is freshly preparing your meal in the kitchen.' : 'Vendor is packing your items.',
        colorClass: 'bg-blue-50 text-blue-900 border-blue-200',
        dotClass: 'bg-blue-500 animate-pulse'
      };
    }
    return {
      title: 'Provider Accepted',
      desc: 'Provider has accepted your order and queued fulfillment.',
      colorClass: 'bg-teal-50 text-teal-900 border-teal-200',
      dotClass: 'bg-teal-500'
    };
  };

  const statusBanner = getStatusBanner();

  // Payment amounts
  const totalAmount = Number(order.totalAmount || 0);
  const advancePaid = Number(order.advancePaidAmount || 0);
  const codCashDue = isCod ? Math.max(0, totalAmount - advancePaid) : 0;
  const isCodWithAdvance = isCod && advancePaid > 0;

  // Refund amount
  const refundableAmount = Number(order.refundAmount ?? (isPrepaid ? totalAmount : advancePaid));

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 antialiased py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ==================================================
            1. TOP NAVIGATION & ORDER HEADER
           ================================================== */}
        <div className="space-y-3">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Orders</span>
          </Link>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-mono text-base sm:text-lg font-bold text-slate-900">
                  Order #{order.orderNumber}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {isFood ? 'Food & Dining' : isProduce ? 'Produce' : isLaundry ? 'Laundry' : 'Stationery'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isCod ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {isCodWithAdvance ? 'COD + Advance' : isCod ? 'Cash on Delivery' : 'Online Paid'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                Placed on {orderDate}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            2. CURRENT STATUS BANNER (CLEAR, PROMINENT, COMPACT)
           ================================================== */}
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-xs flex items-start gap-3.5 ${statusBanner.colorClass}`}>
          <div className="mt-1">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${statusBanner.dotClass}`} />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="text-xs font-extrabold uppercase tracking-wider opacity-70">
              Current Status
            </div>
            <h2 className="text-sm sm:text-base font-black">
              {statusBanner.title}
            </h2>
            <p className="text-xs opacity-85 leading-relaxed">
              {statusBanner.desc}
            </p>
          </div>
        </div>

        {/* ==================================================
            3. MAIN FOCUS: TRACK YOUR ORDER TIMELINE
           ================================================== */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {returnRequest && returnRequest.status !== 'REJECTED'
                ? 'Product Return & Refund Journey'
                : isCancelled
                ? 'Cancellation & Refund Status'
                : 'Track Your Order'}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {returnRequest && returnRequest.status !== 'REJECTED'
                ? 'Gated Campus Pickup & Settlement'
                : isCancelled
                ? 'Policy Settlement'
                : 'Live Campus Dispatch'}
            </span>
          </div>

          {/* ==================== A. RETURN & REFUND ACTIVE ==================== */}
          {returnRequest && returnRequest.status !== 'REJECTED' ? (
            <div className="space-y-5">
              {/* Vertical Return & Refund Progress Timeline */}
              <div className="space-y-4 relative pl-2">
                {[
                  {
                    id: 'REQUESTED',
                    title: 'Return Requested',
                    desc: returnRequest.reasonType === 'PRODUCT_ISSUE'
                      ? 'Defect claimed with photo proof. Under Admin review.'
                      : 'Mind change return requested by student.'
                  },
                  {
                    id: 'APPROVED',
                    title: 'Return Approved & Runner Assigned',
                    desc: returnRequest.deliveryBoy
                      ? `Runner ${returnRequest.deliveryBoy.fullName} scheduled for room pickup.`
                      : 'Authorized by admin. Pickup runner assignment in progress.'
                  },
                  {
                    id: 'PICKED_UP',
                    title: 'Hostel Room Pickup Verified',
                    desc: ['PICKED_UP', 'REFUNDED', 'COMPLETED'].includes(returnRequest.status)
                      ? 'Physical item collected and 6-digit OTP verified by runner at room door.'
                      : 'Share your 6-digit Return OTP with runner upon collection.'
                  },
                  {
                    id: 'REFUNDED',
                    title: 'Refund Disbursed to Account',
                    desc: ['REFUNDED', 'COMPLETED'].includes(returnRequest.status)
                      ? `Net refund of ₹${Number(returnRequest.refundAmount || 0).toFixed(2)} disbursed to your account.`
                      : 'Admin releases payment directly to your account after physical pickup.'
                  }
                ].map((step, idx) => {
                  const st = returnRequest.status;
                  let activeIdx = 1;
                  if (st === 'REFUNDED' || st === 'COMPLETED') activeIdx = 4;
                  else if (st === 'PICKED_UP') activeIdx = 3;
                  else if (['APPROVED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(st)) activeIdx = 2;
                  else activeIdx = 1;

                  const isCompleted = idx < activeIdx - 1 || (st === 'REFUNDED' || st === 'COMPLETED');
                  const isCurrent = idx === activeIdx - 1 && !(st === 'REFUNDED' || st === 'COMPLETED');

                  return (
                    <div key={step.id} className="flex items-start gap-3 relative">
                      {idx < 3 && (
                        <div
                          className={`absolute left-3 top-5 bottom-0 w-0.5 -ml-px ${
                            isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}

                      <div className="relative z-10">
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-[#4F9D2F] text-white flex items-center justify-center ring-4 ring-emerald-100 shadow-xs scale-105">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px]">
                            ○
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 flex-1 pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-bold ${
                            isCurrent ? 'text-slate-900 font-black' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {step.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Active Stage
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed ${
                          isCurrent ? 'text-slate-700 font-medium' : isCompleted ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 6-Digit Return Pickup OTP Card */}
              {['APPROVED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(returnRequest.status) && returnRequest.pickupOtp && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider">
                        Your 6-Digit Return Pickup Code:
                      </span>
                      <div className="text-3xl font-black font-mono tracking-widest text-slate-900 mt-0.5">
                        {returnRequest.pickupOtp}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(returnRequest.pickupOtp);
                        showToast('Return Pickup OTP copied to clipboard');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Share this 6-digit code with the delivery runner at your room door to verify handover.</span>
                  </div>
                </div>
              )}

              {/* Pickup Runner Assignment Card */}
              {returnRequest.deliveryBoy && (
                <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{returnRequest.deliveryBoy.fullName}</span>
                      <span className="text-[11px] text-purple-700">Assigned Return Pickup Runner</span>
                    </div>
                  </div>
                  {returnRequest.deliveryBoy.mobileNumber && (
                    <a
                      href={`tel:${returnRequest.deliveryBoy.mobileNumber}`}
                      className="px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-purple-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-purple-50"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Runner</span>
                    </a>
                  )}
                </div>
              )}

              {/* Transparent Financial Calculation Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200/70 pb-2">
                  Return Payment Settlement Breakdown
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Delivered Item Subtotal:</span>
                    <span className="font-mono font-semibold">₹{Number(returnRequest.itemAmount || order.subtotal || totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Return Delivery Charge:</span>
                    <span className={`font-mono font-bold ${Number(returnRequest.deliveryFeeDeducted) > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {Number(returnRequest.deliveryFeeDeducted) > 0
                        ? `-₹${Number(returnRequest.deliveryFeeDeducted).toFixed(2)} (Mind Change Policy)`
                        : '₹0.00 (Waived for Defective Product)'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Net Refund Amount:</span>
                    <span className="font-mono text-emerald-700 text-base font-black">
                      ₹{Number(returnRequest.refundAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Refund Destination Account Card */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  {order.refundAccount ? (
                    <span className="text-slate-600 text-[11px]">
                      Payout Destination: <strong className="font-mono text-slate-900">{order.refundAccount.accountType === 'UPI' ? order.refundAccount.upiIdMasked : order.refundAccount.accountNumberMasked}</strong>
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium text-[11px]">Awaiting payout account</span>
                  )}
                  <button
                    onClick={() => setAccountModalOpen(true)}
                    className="text-xs font-bold text-[#4F9D2F] hover:underline cursor-pointer"
                  >
                    {order.refundAccount ? 'Update Account' : 'Set Refund Account'}
                  </button>
                </div>
              </div>

              {/* Collapsible Original Delivery History */}
              <div className="pt-1">
                <button
                  onClick={() => setShowDeliveryHistory(!showDeliveryHistory)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Original Delivery Journey</span>
                  </span>
                  {showDeliveryHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDeliveryHistory && (
                  <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 space-y-3 pl-4">
                    {timelineSteps.map((s) => (
                      <div key={s.id} className="flex items-center gap-2.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800">{s.title}</span>
                        <span className="text-[11px] text-slate-400">— {s.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : isCancelled ? (
            <div className="space-y-4">
              {/* Case A: Online Prepaid (Full refund) */}
              {isPrepaid && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Full Payment Refund</div>
                      <p className="text-[11px] text-slate-500">Your entire online payment is being refunded.</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base font-black text-slate-900">₹{totalAmount.toFixed(2)}</div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Refund Pending
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "Your order was cancelled before the provider accepted it. Your full payment of ₹{totalAmount.toFixed(0)} has been added to the refund process."
                  </p>
                </div>
              )}

              {/* Case B: Normal COD (No refund applicable) */}
              {isCod && advancePaid <= 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <div>
                      <div className="text-xs font-bold text-slate-900">No Refund Applicable</div>
                      <p className="text-[11px] text-slate-500">No advance payment was collected for this COD order.</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-slate-400">₹0.00</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "Since this was a Cash on Delivery order and no payment was collected in advance, there is no refund due."
                  </p>
                </div>
              )}

              {/* Case C: COD + Partial Advance */}
              {isCodWithAdvance && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Advance Payment Refund</div>
                      <p className="text-[11px] text-slate-500">Only the online advance is refunded. Doorstep COD cash was never paid.</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base font-black text-slate-900">₹{advancePaid.toFixed(2)}</div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Refund Pending
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "You paid ₹{advancePaid.toFixed(0)} as an advance for this COD order. The order was cancelled before the provider accepted it, so your ₹{advancePaid.toFixed(0)} advance payment has been added to the refund process."
                  </p>
                </div>
              )}

              {/* Refund 4-step Timeline (Only when refund > 0) */}
              {refundableAmount > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Refund Progress
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Order cancelled</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Refund generated</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-amber-700 font-bold">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      <span>Refund processing (Awaiting bank clearance)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                        ○
                      </div>
                      <span>Refund completed</span>
                    </div>
                  </div>

                  {/* Destination Account Link */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {order.refundAccount ? (
                      <span className="text-slate-600">
                        Payout Account: <strong className="font-mono text-slate-900">{order.refundAccount.accountType === 'UPI' ? order.refundAccount.upiIdMasked : order.refundAccount.accountNumberMasked}</strong>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">Awaiting destination account</span>
                    )}
                    <button
                      onClick={() => setAccountModalOpen(true)}
                      className="text-xs font-bold text-[#4F9D2F] hover:underline cursor-pointer"
                    >
                      {order.refundAccount ? 'Update Account' : 'Set Refund Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ==================== B. ACTIVE DELIVERY TIMELINE ==================== */
            <div className="space-y-4 relative pl-2">
              {timelineSteps.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isUpcoming = idx > currentStepIdx;

                return (
                  <div key={step.id} className="flex items-start gap-3 relative">
                    {/* Vertical connecting line */}
                    {idx < timelineSteps.length - 1 && (
                      <div
                        className={`absolute left-3 top-5 bottom-0 w-0.5 -ml-px ${
                          isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}

                    {/* Step Icon */}
                    <div className="relative z-10">
                      {isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-6 h-6 rounded-full bg-[#4F9D2F] text-white flex items-center justify-center ring-4 ring-emerald-100 shadow-xs scale-105">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px]">
                          ○
                        </div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="space-y-0.5 flex-1 pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${
                          isCurrent ? 'text-slate-900 font-black' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                        }`}>
                          {step.title}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active Step
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed ${
                        isCurrent ? 'text-slate-600' : isCompleted ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================================================
            4. DELIVERY RUNNER INFORMATION (STRICT DATA RULES)
           ================================================== */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Delivery Partner
            </div>

            {order.deliveryBoy ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/70 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {order.deliveryBoy.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Campus Delivery Partner • {order.deliveryBoy.vehicleType || 'Campus Bicycle'}
                    </p>
                  </div>
                </div>

                {order.deliveryBoy.mobileNumber && (
                  <a
                    href={`tel:${order.deliveryBoy.mobileNumber}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Runner</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Waiting for runner assignment
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Your Campus Runner will be assigned when your order is ready for dispatch.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            5. DELIVERY VERIFICATION CODE (OTP)
           ================================================== */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Delivery Verification
              </span>
              {isDelivered && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ Delivery Verified
                </span>
              )}
            </div>

            {isDelivered ? (
              <div className="flex items-center gap-2.5 text-xs text-emerald-800 font-semibold py-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Delivery confirmed and verified successfully with your 6-digit handover code.</span>
              </div>
            ) : isHandoverState && order.deliveryOtp ? (
              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-500">Your 6-digit delivery code:</span>
                    <div className="text-2xl sm:text-3xl font-black tracking-widest text-slate-900 font-mono">
                      {order.deliveryOtp}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (order.deliveryOtp) {
                        navigator.clipboard.writeText(order.deliveryOtp);
                        showToast('Delivery OTP copied to clipboard');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/70">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>DO NOT SHARE THIS CODE BEFORE RECEIVING YOUR ORDER. Share only after taking handover.</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-2 py-1">
                <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Your delivery verification code will appear here when your order is ready for handover.</span>
              </div>
            )}
          </div>
        )}


        {/* ==================================================
            6. ORDER SUMMARY (COMPACT & CLEAN)
           ================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Order Summary
          </div>

          <div className="space-y-2 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-slate-800">
                <span>
                  {item.productName} <span className="text-slate-400">× {item.quantity}</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  ₹{Number(item.totalPrice).toFixed(2)}
                </span>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-500 text-[11px]">
              <div className="flex justify-between">
                <span>Item Subtotal</span>
                <span className="font-mono">₹{Number(order.subtotal || totalAmount).toFixed(2)}</span>
              </div>
              {Number(order.deliveryFee) > 0 && (
                <div className="flex justify-between">
                  <span>Campus Delivery</span>
                  <span className="font-mono">₹{Number(order.deliveryFee).toFixed(2)}</span>
                </div>
              )}
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Student Discount</span>
                  <span className="font-mono">-₹{Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Order Total</span>
              <span className="font-mono text-base">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ==================================================
            7. PAYMENT SUMMARY (COMPACT & HONEST)
           ================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Payment
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Payment Method</span>
              <span className="font-bold text-slate-900">
                {isCodWithAdvance ? 'Cash on Delivery + Advance' : isCod ? 'Cash on Delivery' : 'Online Prepaid'}
              </span>
            </div>

            {isPrepaid && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Paid Online</span>
                  <span className="font-mono font-bold text-emerald-700">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Due at Handover</span>
                  <span className="font-mono font-bold text-slate-900">₹0.00</span>
                </div>
              </>
            )}

            {isCod && !isCodWithAdvance && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Paid Online</span>
                  <span className="font-mono text-slate-500">₹0.00</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Cash Due at Handover</span>
                  <span className="font-mono text-base text-amber-700">₹{totalAmount.toFixed(2)}</span>
                </div>
              </>
            )}

            {isCodWithAdvance && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Advance Paid Online</span>
                  <span className="font-mono font-bold text-emerald-700">₹{advancePaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Cash Due at Handover</span>
                  <span className="font-mono text-base text-amber-700">₹{codCashDue.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ==================================================
            8. DELIVERY DESTINATION
           ================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Delivery Destination
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-800">
            <MapPin className="w-4 h-4 text-[#4F9D2F] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900">
                {order.roomNumber ? `Room ${order.roomNumber}, ` : ''}{order.hallName || 'Hostel Residence'}
              </div>
              <div className="text-slate-500 text-[11px]">
                Campus Central Residence, NIT Durgapur
              </div>
              {order.specialInstructions && (
                <div className="text-[11px] text-slate-600 italic pt-1">
                  Note: "{order.specialInstructions}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            9. CONTEXTUAL ACTIONS
           ================================================== */}
        <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
          <button
            onClick={() => setSupportModalOpen(true)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Need Help?</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Pre-acceptance cancellation / modification / ADD PRODUCTS */}
            {!isCancelled && !isDelivered && !isProviderAccepted && (
              <>
                <button
                  onClick={() => {
                    fetchAvailableProducts();
                    setAddItemsModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#2E7D32] border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add Products / Edit</span>
                </button>

                <button
                  onClick={() => setModifyModalOpen(true)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modify Room</span>
                </button>

                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel Order
                </button>
              </>
            )}

            {/* Delivered Actions */}
            {isDelivered && (
              <>
                <button
                  onClick={() => setReturnModalOpen(true)}
                  disabled={Boolean(returnRequest && returnRequest.status !== 'REJECTED')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    returnRequest && returnRequest.status !== 'REJECTED'
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>{returnRequest && returnRequest.status !== 'REJECTED' ? 'Return In Progress' : 'Request Return & Refund'}</span>
                </button>

                <button
                  onClick={() => setReceiptModalOpen(true)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Receipt</span>
                </button>

                <button
                  onClick={handleReorder}
                  className="px-4 py-2 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reorder Items</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ==================================================
          MODAL 1: CANCELLATION CONFIRMATION DIALOG
         ================================================== */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Cancel Order #{order.orderNumber}</h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {cancelSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 text-center">
                {cancelSuccessMsg}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* Policy preview notice */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold">Refund Policy for this Cancellation:</div>
                  {isPrepaid && (
                    <p>Order has not been accepted by provider yet. Your full payment of <strong>₹{totalAmount.toFixed(2)}</strong> will be refunded.</p>
                  )}
                  {isCod && !isCodWithAdvance && (
                    <p>This is a standard COD order with zero advance. No payment was collected, so no refund is applicable.</p>
                  )}
                  {isCodWithAdvance && (
                    <p>Your online advance of <strong>₹{advancePaid.toFixed(2)}</strong> will be refunded. Doorstep COD cash (₹{codCashDue.toFixed(2)}) was never paid and will not be refunded.</p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason for Cancellation</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-red-500"
                  >
                    <option>Change of plan / placed by mistake</option>
                    <option>Delivery address / room number incorrect</option>
                    <option>Wait time too long</option>
                    <option>Other personal reason</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setCancelModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 2: MODIFY ROOM / INSTRUCTIONS
         ================================================== */}
      {modifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Modify Delivery Details</h3>
              <button onClick={() => setModifyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModifyOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hostel Room Number</label>
                <input
                  type="text"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  placeholder="e.g. B-304"
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-[#4F9D2F]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Special Delivery Instructions</label>
                <textarea
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="e.g. Please leave at door if in class"
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#4F9D2F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModifyModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modifying}
                  className="px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  {modifying ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 3: NEED HELP? SUPPORT DIALOG
         ================================================== */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Campus Help Desk</h3>
                <p className="text-[11px] text-slate-400 font-mono">Order #{order.orderNumber}</p>
              </div>
              <button onClick={() => setSupportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {supportSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 text-center">
                {supportSuccess}
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Issue Category</label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-[#4F9D2F]"
                  >
                    <option>Where is my delivery?</option>
                    <option>Delivery runner is unreachable</option>
                    <option>Wrong or missing items</option>
                    <option>Payment / refund query</option>
                    <option>Other issue</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Briefly describe what you need help with..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#4F9D2F]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting}
                    className="px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {supportSubmitting ? 'Submitting...' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 4: SET REFUND DESTINATION ACCOUNT
         ================================================== */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Refund Destination Account</h3>
              <button onClick={() => setAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRefundAccount} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('UPI')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      accountType === 'UPI' ? 'bg-[#4F9D2F] text-white border-[#4F9D2F]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('BANK_ACCOUNT')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      accountType === 'BANK_ACCOUNT' ? 'bg-[#4F9D2F] text-white border-[#4F9D2F]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Bank Account
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="As per bank / UPI record"
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                  required
                />
              </div>

              {accountType === 'UPI' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">UPI ID *</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-mono"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Name *</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Number *</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account number"
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0002108"
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-mono uppercase"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  {savingAccount ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 6: ADD MORE PRODUCTS (BEFORE ACCEPTANCE)
         ================================================== */}
      {addItemsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Products to Order #{order.orderNumber}</h3>
                <p className="text-[11px] text-slate-500">Order is pending kitchen acceptance. You can add more products right now!</p>
              </div>
              <button onClick={() => setAddItemsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingProducts ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                <div className="w-6 h-6 border-2 border-[#4F9D2F] border-t-transparent rounded-full animate-spin" />
                <span>Loading available products...</span>
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No additional products available in catalog.
              </div>
            ) : (
              <form onSubmit={handleAddItemsSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                <div className="space-y-2.5">
                  {availableProducts.map((p) => {
                    const price = Number(p.discountPrice || p.price);
                    const qty = selectedNewItems[p.id] || 0;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/60 transition"
                      >
                        <div className="space-y-0.5 flex-1 pr-3">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="font-mono text-slate-600 font-semibold">₹{price.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-400">{p.unit || 'unit'} • In Stock ({p.stock})</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {qty > 0 && (
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(p.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="font-mono font-bold w-6 text-center text-slate-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(p.id, 1)}
                            disabled={qty >= p.stock}
                            className="w-7 h-7 rounded-lg bg-[#4F9D2F] text-white flex items-center justify-center hover:bg-[#3d7c24] disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Calculation Summary Preview */}
                {Object.keys(selectedNewItems).length > 0 && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                    <div className="flex justify-between font-bold text-emerald-900">
                      <span>Added Products Subtotal:</span>
                      <span className="font-mono">
                        +₹{Object.entries(selectedNewItems).reduce((sum, [pid, q]) => {
                          const prod = availableProducts.find((p) => p.id === pid);
                          return sum + (prod ? Number(prod.discountPrice || prod.price) * q : 0);
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-800">
                      Your order total will be recalculated automatically and new items will be queued with the kitchen.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAddItemsModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingItems || Object.keys(selectedNewItems).length === 0}
                    className="px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {addingItems ? 'Updating Order...' : 'Confirm & Add to Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 7: REQUEST PRODUCT RETURN & REFUND
         ================================================== */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Request Product Return &amp; Refund</h3>
                <p className="text-[11px] text-slate-500">Order #{order.orderNumber} • Requires Admin Approval</p>
              </div>
              <button onClick={() => setReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              {/* Return Category Selector */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Choose Return Reason Category *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReturnReasonType('PRODUCT_ISSUE')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      returnReasonType === 'PRODUCT_ISSUE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Product Related Issue</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Defective, damaged, spoiled, or incorrect item received.
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      100% Full Refund (₹0 Fee)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnReasonType('MIND_CHANGE')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      returnReasonType === 'MIND_CHANGE'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      <span>Customer Mind Change</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Decided not to keep it / ordered by mistake.
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-indigo-700 bg-white/80 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                      Delivery Charge Deducted (-₹15)
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Live Refund Calculator */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Live Refund Amount Estimate:
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Eligible Product Value:</span>
                    <span className="font-mono">₹{Number(order.subtotal || totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Return Pickup Delivery Fee:</span>
                    <span className={`font-mono font-bold ${returnReasonType === 'MIND_CHANGE' ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {returnReasonType === 'MIND_CHANGE' ? '-₹15.00' : '₹0.00 (Waived for Defect)'}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                    <span>Net Estimated Refund:</span>
                    <span className="font-mono text-emerald-700 text-base">
                      ₹{Math.max(0, Number(order.subtotal || totalAmount) - (returnReasonType === 'MIND_CHANGE' ? 15 : 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason Details */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {returnReasonType === 'PRODUCT_ISSUE' ? 'Describe the Issue with Product *' : 'Reason for Changing Mind *'}
                </label>
                <textarea
                  value={returnReasonDetails}
                  onChange={(e) => setReturnReasonDetails(e.target.value)}
                  placeholder={
                    returnReasonType === 'PRODUCT_ISSUE'
                      ? 'e.g. The item arrived expired/broken seal. Please inspect...'
                      : 'e.g. I accidentally ordered duplicate stationery notebooks...'
                  }
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#4F9D2F]"
                  required
                />
              </div>

              {/* Proof Photo Upload / Link (Mandatory for Product Issue) */}
              {returnReasonType === 'PRODUCT_ISSUE' && (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                  <label className="font-bold text-amber-900 block text-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                    <span>Proof Image / Photo URL *</span>
                  </label>
                  <input
                    type="text"
                    value={returnProofImageUrl}
                    onChange={(e) => setReturnProofImageUrl(e.target.value)}
                    placeholder="e.g. https://drive.google.com/... or image URL showing the defect"
                    className="w-full border border-amber-200 rounded-xl p-2 text-xs text-slate-800 bg-white"
                  />
                  <p className="text-[10px] text-amber-800">
                    💡 Per platform policy, product defect claims must be verified with proof before Admin approval.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="px-4 py-1.5 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {returnSubmitting ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 8: OFFICIAL PAYMENT & ORDER RECEIPT
         ================================================== */}
      {receiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#4F9D2F]" />
                <h3 className="text-base font-bold text-slate-900">Official Order Receipt</h3>
              </div>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div id="printable-receipt" className="space-y-4 text-xs">
              {/* Brand & Order Header */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-start">
                <div>
                  <h4 className="font-black text-sm text-slate-900 tracking-tight">CAMPUS BASKET</h4>
                  <p className="text-[10px] text-slate-500">National Institute of Technology, Durgapur</p>
                  <p className="text-[10px] text-slate-400">Campus Delivery Desk & Fulfillment</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-slate-900">#{order.orderNumber}</span>
                  <div className="text-[10px] text-slate-500 mt-0.5">{orderDate}</div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {order.paymentStatus === 'PAID' || order.paymentStatus === 'COD_COLLECTED' || order.status === 'DELIVERED'
                      ? 'PAID / SETTLED'
                      : 'PAYMENT DUE'}
                  </span>
                </div>
              </div>

              {/* Student Details */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Billed To:</span>
                  <span className="font-bold text-slate-900">{order.student?.fullName || 'Student Customer'}</span>
                </div>
                {order.student?.rollNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Roll Number:</span>
                    <span className="font-mono text-slate-700">{order.student.rollNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Delivery Location:</span>
                  <span className="font-semibold text-slate-900">{order.roomNumber ? `Room ${order.roomNumber}, ` : ''}{order.hallName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items?.map((item) => (
                      <tr key={item.id} className="text-slate-800">
                        <td className="p-2.5 font-medium">{item.productName}</td>
                        <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-slate-500">₹{Number(item.unitPrice).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{Number(item.totalPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold">₹{Number(order.subtotal || totalAmount).toFixed(2)}</span>
                </div>
                {Number(order.deliveryFee) > 0 && (
                  <div className="flex justify-between">
                    <span>Campus Delivery Fee</span>
                    <span className="font-mono font-semibold">₹{Number(order.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Student Discount</span>
                    <span className="font-mono">-₹{Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-base font-black">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Notice */}
              <div className="flex justify-between items-center px-3 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                <span>Payment: <strong>{isCod ? 'Cash on Delivery (COD)' : 'Online Paid (Razorpay)'}</strong></span>
                <span className="text-[11px] font-bold text-emerald-700">✓ Digitally Recorded</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 flex-wrap">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdfReceipt}
                  disabled={downloadingReceipt}
                  className="px-4 py-2 bg-[#4F9D2F] hover:bg-[#3d7c24] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingReceipt ? 'Generating PDF...' : 'Download PDF Receipt'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
