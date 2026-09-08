'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../../lib/api';
import { useCart } from '../../../../context/CartContext';
import {
  CheckCircle2,
  Clock,
  MapPin,
  HelpCircle,
  RotateCcw,
  ArrowLeft,
  XCircle,
  AlertTriangle,
  Zap,
  ShoppingBag,
  Sparkles,
  Phone,
  FileText,
  ChevronRight,
  Send,
  Building,
  Check,
  Calendar,
  User,
  Printer,
  X,
  PackageCheck,
  KeyRound,
  Shirt,
  Utensils,
  BookOpen,
  Apple,
  CreditCard,
  ShieldCheck,
  Lock,
  Copy,
  Info,
  ExternalLink,
  Banknote,
  Edit3
} from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string | null;
  product?: any;
}

interface OrderData {
  id: string;
  orderNumber: string;
  serviceType?: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  providerAccepted?: boolean;
  providerAcceptedAt?: string;
  advancePaidAmount?: number;
  cancellationType?: string;
  cancellationReason?: string;
  refundStatus?: string;
  settlementStatus?: string;
  refundAmount?: number;
  refundReason?: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  hallName: string;
  roomNumber: string;
  specialInstructions?: string;
  createdAt: string;
  items: OrderItem[];
  statusHistory?: any[];
  deliveryBoy?: {
    id: string;
    fullName: string;
    mobileNumber?: string;
    vehicleType?: string;
  };
  provider?: {
    fullName: string;
    mobileNumber?: string;
    serviceCategory?: string;
  };
  foodDetails?: {
    preparationTimeMinutes?: number;
    isVegetarian?: boolean;
    spiceLevel?: string;
    cookingInstructions?: string;
    prepStartTime?: string;
    prepEndTime?: string;
  };
  laundryDetails?: {
    serviceTier?: string;
    weightKg?: number;
    pieceCount?: number;
    specialCareInstructions?: string;
    washCycleStage?: string;
    pickupSlot?: string;
    deliverySlot?: string;
    pickupOtp?: string;
    deliveryOtp?: string;
    isDamagedReported?: boolean;
    damageDescription?: string;
    damagePhotos?: string[];
  };
  produceDetails?: {
    isOrganic?: boolean;
    packagingType?: string;
    qualityGrade?: string;
    harvestDate?: string;
  };
  stationeryDetails?: {
    paperGsm?: number;
    bindingType?: string;
    isExamEssential?: boolean;
    colorType?: string;
  };
}

const DEFAULT_CHECKPOINTS = [
  { id: 'HUB', label: 'Hub', sub: 'Campus Central Hub' },
  { id: 'CONFIRMED', label: 'Order Confirmed', sub: 'Verified & Queued' },
  { id: 'ASSIGNED', label: 'Partner Assigned', sub: 'Runner Dispatched' },
  { id: 'PICKED_UP', label: 'Picked Up', sub: 'Bag Packed & Tagged' },
  { id: 'TRANSIT', label: 'Campus Transit', sub: 'Runner In Route' },
  { id: 'DELIVERED', label: 'Doorstep Delivered', sub: 'Handed Over' }
];

const FOOD_CHECKPOINTS = [
  { id: 'RECEIVED', label: 'Order Placed', sub: 'Sent to Kitchen' },
  { id: 'CONFIRMED', label: 'Kitchen Accepted', sub: 'Order Queued' },
  { id: 'PREPARING', label: 'Freshly Cooking', sub: 'Chef at Work' },
  { id: 'READY', label: 'Food Packed', sub: 'Awaiting Pickup' },
  { id: 'TRANSIT', label: 'Hot Delivery', sub: 'Runner In Route' },
  { id: 'DELIVERED', label: 'Enjoy Meal', sub: 'Delivered at Door' }
];

const PRODUCE_CHECKPOINTS = [
  { id: 'RECEIVED', label: 'Order Placed', sub: 'Mandi/Farm Batch' },
  { id: 'CONFIRMED', label: 'Produce Accepted', sub: 'Crate Assigned' },
  { id: 'PREPARING', label: 'Quality Graded', sub: 'Freshness Inspected' },
  { id: 'READY', label: 'Fruit Basket Packed', sub: 'Eco-Crate Tagged' },
  { id: 'TRANSIT', label: 'Fresh Transit', sub: 'Runner In Route' },
  { id: 'DELIVERED', label: 'Delivered Fresh', sub: 'Handed Over at Door' }
];

const STATIONERY_CHECKPOINTS = [
  { id: 'RECEIVED', label: 'Order Placed', sub: 'Sent to Bookstore' },
  { id: 'CONFIRMED', label: 'Store Accepted', sub: 'Stock Reserved' },
  { id: 'PREPARING', label: 'Items Assembled', sub: 'Desk Collection' },
  { id: 'READY', label: 'Packaged Securely', sub: 'Bag Sealed & Labeled' },
  { id: 'TRANSIT', label: 'Campus Delivery', sub: 'Runner In Route' },
  { id: 'DELIVERED', label: 'Doorstep Handover', sub: 'Delivered to Student' }
];

const LAUNDRY_CHECKPOINTS = [
  { id: 'REQUESTED', label: 'Booking Placed', sub: 'Slot Confirmed' },
  { id: 'PICKUP_SCHEDULED', label: 'Runner Scheduled', sub: 'Doorstep Pickup' },
  { id: 'CLOTHES_COLLECTED', label: 'Clothes Collected', sub: 'Weighed & Tagged' },
  { id: 'WASHING', label: 'Wash & Sanitize', sub: 'Gentle Cycle' },
  { id: 'IRONING', label: 'Steam Press', sub: 'Folded & Bagged' },
  { id: 'DELIVERY_SCHEDULED', label: 'Out for Return', sub: 'Hostel Dropoff' },
  { id: 'COMPLETED', label: 'Delivered', sub: 'Doorstep Completed' }
];

export default function OrderTrackClient() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isJustPlaced = searchParams.get('placed') === 'true';

  const { addItem, showToast } = useCart();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROCESSING' | 'TRANSIT' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Changed mind');

  // Modification state (only prior to vendor acceptance)
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [modifying, setModifying] = useState(false);
  const [modifyRoom, setModifyRoom] = useState('');
  const [modifyInstructions, setModifyInstructions] = useState('');
  const [modifyError, setModifyError] = useState<string | null>(null);
  const [modifySuccess, setModifySuccess] = useState<string | null>(null);

  // Return request state (for delivered orders)
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returning, setReturning] = useState(false);
  const [returnReason, setReturnReason] = useState('Quality/Freshness issue');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);

  // Support ticket modal state
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState('Order hasn\'t arrived');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  // View Receipt state
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Confidential Refund Account state
  const [refundAccountModalOpen, setRefundAccountModalOpen] = useState(false);
  const [savedRefundAccount, setSavedRefundAccount] = useState<any>(null);
  const [refundAccountLoading, setRefundAccountLoading] = useState(false);
  const [refundAccountSaving, setRefundAccountSaving] = useState(false);
  const [refundAccountSuccess, setRefundAccountSuccess] = useState<string | null>(null);
  const [refundAccountError, setRefundAccountError] = useState<string | null>(null);
  const [refundAccountForm, setRefundAccountForm] = useState({
    accountType: 'UPI' as 'UPI' | 'BANK',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  // Fetch Current Order
  const fetchOrder = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await apiRequest(`/api/orders/${id}`);
      if (res.success && res.order) {
        setOrder(res.order);
        setError(null);
      } else {
        setError(res.message || 'Order not found');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load your order.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Fetch all student orders for tab statistics
  const fetchAllOrders = async () => {
    try {
      const res = await apiRequest('/api/orders');
      if (res.success && Array.isArray(res.orders)) {
        setAllOrders(res.orders);
      }
    } catch {
      // Ignored
    }
  };

  // Fetch student confidential refund account
  const fetchRefundAccount = async () => {
    try {
      setRefundAccountLoading(true);
      const res = await apiRequest('/api/orders/refund-account');
      if (res.success && res.data) {
        setSavedRefundAccount(res.data);
        if (res.data.accountHolderName) {
          setRefundAccountForm(prev => ({
            ...prev,
            accountHolderName: res.data.accountHolderName || '',
            accountType: res.data.accountType || 'UPI',
            bankName: res.data.bankName || '',
            upiId: res.data.upiIdMasked || '',
            accountNumber: res.data.accountNumberMasked || ''
          }));
        }
      }
    } catch {
      // Ignore if not created yet
    } finally {
      setRefundAccountLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(true);
    fetchAllOrders();
    fetchRefundAccount();
    const interval = setInterval(() => {
      fetchOrder(false);
      fetchAllOrders();
    }, 6000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSaveRefundAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundAccountSaving(true);
    setRefundAccountSuccess(null);
    setRefundAccountError(null);

    try {
      const payload: any = {
        accountType: refundAccountForm.accountType,
        accountHolderName: refundAccountForm.accountHolderName
      };

      if (refundAccountForm.accountType === 'UPI') {
        if (!refundAccountForm.upiId.includes('@')) {
          setRefundAccountError('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
          setRefundAccountSaving(false);
          return;
        }
        payload.upiId = refundAccountForm.upiId;
      } else {
        if (!refundAccountForm.accountNumber || !refundAccountForm.ifscCode) {
          setRefundAccountError('Account Number and IFSC Code are required for Bank transfer');
          setRefundAccountSaving(false);
          return;
        }
        payload.accountNumber = refundAccountForm.accountNumber;
        payload.ifscCode = refundAccountForm.ifscCode.toUpperCase();
        payload.bankName = refundAccountForm.bankName || 'Bank';
      }

      const res = await apiRequest('/api/orders/refund-account', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setRefundAccountSuccess('Confidential refund destination saved securely.');
        setSavedRefundAccount(res.data);
        setTimeout(() => setRefundAccountModalOpen(false), 1500);
      } else {
        setRefundAccountError(res.message || 'Failed to save refund account details.');
      }
    } catch (err: any) {
      setRefundAccountError(err.message || 'Network error saving refund account.');
    } finally {
      setRefundAccountSaving(false);
    }
  };

  // Determine service checkpoints and active step
  const serviceType = (order?.serviceType || 'FOOD').toUpperCase();
  const isLaundry = serviceType === 'LAUNDRY';
  const isProduce = serviceType === 'FRESH_PRODUCE' || (order as any)?.isProduce;
  const isStationery = serviceType === 'STATIONERY' || (order as any)?.isStationery;
  const isFood = serviceType === 'FOOD' && !isProduce && !isStationery;

  const checkpoints = isLaundry
    ? LAUNDRY_CHECKPOINTS
    : isProduce
    ? PRODUCE_CHECKPOINTS
    : isStationery
    ? STATIONERY_CHECKPOINTS
    : isFood
    ? FOOD_CHECKPOINTS
    : DEFAULT_CHECKPOINTS;

  const getActiveStepIndex = (status: string, laundryStage?: string) => {
    if (status === 'CANCELLED') return -1;

    if (isLaundry) {
      const stage = (laundryStage || status).toUpperCase();
      switch (stage) {
        case 'REQUESTED':
        case 'PENDING':
        case 'PENDING_PAYMENT':
          return 0;
        case 'ACCEPTED':
        case 'PICKUP_SCHEDULED':
          return 1;
        case 'CLOTHES_COLLECTED':
          return 2;
        case 'WASHING':
          return 3;
        case 'IRONING':
          return 4;
        case 'READY':
        case 'DELIVERY_SCHEDULED':
          return 5;
        case 'COMPLETED':
        case 'DELIVERED':
          return 6;
        default:
          return 1;
      }
    }

    if (isProduce) {
      switch (status) {
        case 'PENDING_PAYMENT':
        case 'PENDING':
          return 0;
        case 'CONFIRMED':
        case 'ACCEPTED':
          return 1;
        case 'PREPARING':
          return 2;
        case 'READY':
        case 'READY_FOR_PICKUP':
        case 'DELIVERY_ASSIGNED':
          return 3;
        case 'PICKED_UP':
        case 'OUT_FOR_DELIVERY':
        case 'IN_TRANSIT':
        case 'AT_HOSTEL':
        case 'OTP_VERIFIED':
          return 4;
        case 'DELIVERED':
          return 5;
        default:
          return 1;
      }
    }

    if (isStationery) {
      switch (status) {
        case 'PENDING_PAYMENT':
        case 'PENDING':
          return 0;
        case 'CONFIRMED':
        case 'ACCEPTED':
          return 1;
        case 'PREPARING':
          return 2;
        case 'READY':
        case 'READY_FOR_PICKUP':
        case 'DELIVERY_ASSIGNED':
          return 3;
        case 'PICKED_UP':
        case 'OUT_FOR_DELIVERY':
        case 'IN_TRANSIT':
        case 'AT_HOSTEL':
        case 'OTP_VERIFIED':
          return 4;
        case 'DELIVERED':
          return 5;
        default:
          return 1;
      }
    }

    if (isFood) {
      switch (status) {
        case 'PENDING_PAYMENT':
        case 'PENDING':
          return 0;
        case 'CONFIRMED':
        case 'ACCEPTED':
          return 1;
        case 'PREPARING':
          return 2;
        case 'READY':
        case 'READY_FOR_PICKUP':
        case 'DELIVERY_ASSIGNED':
          return 3;
        case 'PICKED_UP':
        case 'OUT_FOR_DELIVERY':
        case 'IN_TRANSIT':
        case 'AT_HOSTEL':
        case 'OTP_VERIFIED':
          return 4;
        case 'DELIVERED':
          return 5;
        default:
          return 1;
      }
    }

    // Default Retail
    switch (status) {
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
      case 'ACCEPTED':
      case 'PREPARING':
        return 1;
      case 'DELIVERY_ASSIGNED':
      case 'READY':
      case 'READY_FOR_PICKUP':
        return 2;
      case 'PICKED_UP':
        return 3;
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
      case 'AT_HOSTEL':
      case 'OTP_VERIFIED':
        return 4;
      case 'DELIVERED':
        return 5;
      default:
        return 1;
    }
  };

  const activeStep = order ? getActiveStepIndex(order.status, order.laundryDetails?.washCycleStage) : 1;

  // Radar status headline
  const getRadarHeadline = (status: string) => {
    if (status === 'CANCELLED') return 'This order has been cancelled.';
    if (isLaundry) {
      const stage = (order?.laundryDetails?.washCycleStage || status).toUpperCase();
      switch (stage) {
        case 'COMPLETED':
        case 'DELIVERED':
          return 'Fresh laundry delivered back to your hostel room! 🧺✨';
        case 'DELIVERY_SCHEDULED':
        case 'READY':
          return 'Cleaned & ironed garments are out for delivery to your room 🛵';
        case 'IRONING':
          return 'Garments are being steam ironed and packed neatly 👔';
        case 'WASHING':
          return 'Clothes are undergoing eco-friendly washing and sanitization 🫧';
        case 'CLOTHES_COLLECTED':
          return 'Garments collected from your room and weighed at facility ⚖️';
        case 'PICKUP_SCHEDULED':
          return 'Runner is assigned to collect laundry from your hostel room 🚪';
        default:
          return 'Laundry pickup booked! Please keep clothes ready 🧺';
      }
    }

    if (isProduce) {
      switch (status) {
        case 'DELIVERED':
          return 'Fresh fruits & produce delivered at your hostel door! Enjoy healthy bites 🍎🍊';
        case 'OUT_FOR_DELIVERY':
        case 'IN_TRANSIT':
        case 'AT_HOSTEL':
          return 'Campus runner is cycling your fresh fruit basket directly to your hostel 🚴💨';
        case 'PICKED_UP':
        case 'READY':
        case 'READY_FOR_PICKUP':
          return 'Fruit basket packed in eco-crate & verified fresh for delivery 🧺';
        case 'PREPARING':
          return 'Quality grading & crispness inspection in progress at produce desk 🍏🔍';
        case 'CONFIRMED':
        case 'ACCEPTED':
          return 'Produce vendor accepted your order! Packing fresh morning batch 📋';
        default:
          return 'Fruit & produce order placed! Awaiting vendor harvest confirmation 🍎';
      }
    }

    if (isStationery) {
      switch (status) {
        case 'DELIVERED':
          return 'Stationery & academic essentials delivered at your door! 📚✏️';
        case 'OUT_FOR_DELIVERY':
        case 'IN_TRANSIT':
        case 'AT_HOSTEL':
          return 'Campus runner is on the way to your hostel with your bookstore bag 🛵💨';
        case 'PICKED_UP':
        case 'READY':
        case 'READY_FOR_PICKUP':
          return 'Items verified from bookstore shelf and securely sealed in bag 🎒';
        case 'PREPARING':
          return 'Bookstore desk assembling copies, pens, and lab essentials 📝';
        case 'CONFIRMED':
        case 'ACCEPTED':
          return 'Bookstore accepted your order! Reserving verified academic stock 📋';
        default:
          return 'Stationery order placed! Sent to campus bookstore desk 📦';
      }
    }

    if (isFood) {
      switch (status) {
        case 'DELIVERED':
          return 'Delivered at your hostel doorstep! Bon appétit 🎉';
        case 'OUT_FOR_DELIVERY':
        case 'IN_TRANSIT':
        case 'AT_HOSTEL':
          return 'Campus runner is speeding your hot meal to your hostel 🛵💨';
        case 'PICKED_UP':
        case 'READY':
        case 'READY_FOR_PICKUP':
          return 'Food freshly packed and picked up from kitchen counter 🎒';
        case 'PREPARING':
          return 'Chef is cooking your order right now in the kitchen 🍳🔥';
        case 'CONFIRMED':
        case 'ACCEPTED':
          return 'Kitchen confirmed your order! Preparation starting shortly 📋';
        default:
          return 'Order placed and queued in campus cafeteria 📦';
      }
    }

    switch (status) {
      case 'DELIVERED':
        return 'Delivered at doorstep 🎉';
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
      case 'AT_HOSTEL':
        return 'Express: Runner is on the way to your hostel 🛵';
      case 'PICKED_UP':
        return 'Order picked up from provider hub & packed 🎒';
      case 'DELIVERY_ASSIGNED':
      case 'READY':
        return 'Delivery partner assigned & heading to store 🏃';
      case 'PREPARING':
      case 'CONFIRMED':
        return 'Order confirmed! Items being assembled & packed 📦';
      default:
        return 'Order placed and logged at campus store hub 📦';
    }
  };

  // Modify Order Handler (before vendor acceptance)
  const handleModifyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setModifying(true);
    setModifyError(null);
    setModifySuccess(null);
    try {
      const res = await apiRequest(`/api/orders/${id}/modify`, {
        method: 'PUT',
        body: JSON.stringify({
          roomNumber: modifyRoom || undefined,
          specialInstructions: modifyInstructions || undefined
        })
      });
      if (res.success) {
        setModifySuccess('Order details updated successfully!');
        await fetchOrder(false);
        setTimeout(() => setModifyModalOpen(false), 1200);
      } else {
        setModifyError(res.message || 'Failed to modify order.');
      }
    } catch (err: any) {
      setModifyError(err.message || 'Unable to update order details.');
    } finally {
      setModifying(false);
    }
  };

  // Request Return Handler
  const handleRequestReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturning(true);
    setReturnError(null);
    setReturnSuccess(null);
    try {
      const res = await apiRequest(`/api/orders/${id}/return`, {
        method: 'POST',
        body: JSON.stringify({
          reason: `${returnReason}${returnNotes ? `: ${returnNotes}` : ''}`
        })
      });
      if (res.success) {
        setReturnSuccess('Return request submitted successfully. Support team is reviewing.');
        await fetchOrder(false);
        setTimeout(() => setReturnModalOpen(false), 1500);
      } else {
        setReturnError(res.message || 'Failed to submit return request.');
      }
    } catch (err: any) {
      setReturnError(err.message || 'Unable to submit return request.');
    } finally {
      setReturning(false);
    }
  };

  // Status badge config
  const getStatusBadge = (status: string) => {
    if (status === 'DELIVERED' || status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2e7d32]" />
          Delivered
        </span>
      );
    }
    if (status === 'OUT_FOR_DELIVERY' || status === 'IN_TRANSIT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
          <Zap className="w-3.5 h-3.5 text-[#0284c7]" />
          In Transit
        </span>
      );
    }
    if (status === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  // Reorder Handler
  const handleReorder = () => {
    if (!order?.items) return;
    let addedCount = 0;
    for (const item of order.items) {
      addItem({
        id: item.id,
        name: item.productName,
        slug: item.productName.toLowerCase().replace(/\s+/g, '-'),
        price: item.unitPrice,
        stock: 50,
        isOutOfStock: false,
        unit: 'piece',
        primaryImage: item.image || null,
        category: { id: 'cat_campus', name: 'Campus', slug: 'campus' }
      } as any, item.quantity);
      addedCount += item.quantity;
    }
    showToast(`${addedCount} items added to your basket.`);
    router.push('/cart');
  };

  // Service-Adaptive Cancellation Eligibility
  const cancellationEligibility = (() => {
    if (!order) return { cancellable: false, reason: 'Order not loaded' };
    if (order.status === 'CANCELLED') return { cancellable: false, reason: 'Order is already cancelled' };
    if (order.status === 'DELIVERED' || order.status === 'COMPLETED') {
      return { cancellable: false, reason: 'Order has already been delivered' };
    }

    if (isFood) {
      if (['PREPARING', 'READY', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(order.status)) {
        return {
          cancellable: false,
          reason: 'Kitchen has already started cooking your food. Meals in preparation cannot be cancelled.'
        };
      }
      return { cancellable: true, reason: 'Allowed prior to kitchen preparation.' };
    }

    if (isLaundry) {
      const stage = (order.laundryDetails?.washCycleStage || order.status).toUpperCase();
      if (['CLOTHES_COLLECTED', 'WASHING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(stage)) {
        return {
          cancellable: false,
          reason: 'Garments have already been collected from your room and sent for washing. Cancellation is closed.'
        };
      }
      return { cancellable: true, reason: 'Allowed prior to room collection.' };
    }

    // Default Retail / Produce / Stationery
    if (['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'PICKED_UP'].includes(order.status)) {
      return { cancellable: false, reason: 'Order is already out for delivery with runner.' };
    }
    return { cancellable: true, reason: 'Allowed prior to dispatch.' };
  })();

  // Order Cancellation Handler
  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelMessage(null);
    try {
      const res = await apiRequest(`/api/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.success) {
        setCancelMessage('Order cancelled successfully.');
        await fetchOrder(false);
        setTimeout(() => setCancelModalOpen(false), 1800);
      } else {
        setCancelMessage(res.message || 'Cancellation could not be completed.');
      }
    } catch (err: any) {
      setCancelMessage(err.message || 'Unable to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // Support Ticket Submission Handler
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSupportSubmitting(true);
    setSupportSuccess(null);

    try {
      const res = await apiRequest('/api/campus/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order?.id,
          category: 'DELIVERY',
          message: `[Issue: ${supportCategory}] ${supportMessage}`,
          priority: 'HIGH'
        })
      });

      if (res.success) {
        setSupportSuccess('Support ticket submitted. Campus helpdesk will contact your mobile shortly.');
        setSupportMessage('');
        setTimeout(() => setSupportModalOpen(false), 2200);
      } else {
        setCancelMessage(res.message || 'Failed to submit ticket');
      }
    } catch (err: any) {
      setCancelMessage(err.message || 'Submission error');
    } finally {
      setSupportSubmitting(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0284c7] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Connecting to Campus Basket Dispatch...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Order Not Located</h2>
          <p className="text-xs text-gray-500">{error || 'Unable to find order details.'}</p>
          <div className="pt-2">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Orders</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate order counts for tabs
  const ordersList = allOrders.length > 0 ? allOrders : [order];
  const countAll = ordersList.length;
  const countProcessing = ordersList.filter((o) => ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PREPARING'].includes(o.status)).length;
  const countTransit = ordersList.filter((o) => ['READY', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(o.status)).length;
  const countDelivered = ordersList.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;
  const countCancelled = ordersList.filter((o) => o.status === 'CANCELLED').length;

  const purchasedItemsText =
    order.items && order.items.length > 0
      ? order.items.map((i) => `${i.productName} (×${i.quantity})`).join(', ')
      : isLaundry ? 'Doorstep Laundry Service' : 'Campus Essential Items';

  const deliveryAddressText =
    order.roomNumber || order.hallName
      ? `${order.roomNumber ? `Room ${order.roomNumber}, ` : ''}${order.hallName || 'Hostel Hall'}, Campus Central Residence`
      : 'Campus Hostel Residence';

  const partnerName = order.deliveryBoy?.fullName || 'Campus Runner';
  const partnerId = order.deliveryBoy?.id
    ? (order.deliveryBoy.id.startsWith('DEL') ? order.deliveryBoy.id : `DEL${order.deliveryBoy.id.slice(-4).toUpperCase()}`)
    : 'DEL-RUNNER';
  const partnerPhone = order.deliveryBoy?.mobileNumber || 'Campus Helpdesk';
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');

  const showRefundSection = order.refundStatus && order.refundStatus !== 'NOT_APPLICABLE';

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ==================================================
            1. TOP PILL FILTER TABS
           ================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'ALL'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            All Orders ({countAll})
          </button>

          <button
            onClick={() => setActiveTab('PROCESSING')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'PROCESSING'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            Processing ({countProcessing})
          </button>

          <button
            onClick={() => setActiveTab('TRANSIT')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'TRANSIT'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            In Transit ({countTransit})
          </button>

          <button
            onClick={() => setActiveTab('DELIVERED')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'DELIVERED'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            Delivered ({countDelivered})
          </button>

          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === 'CANCELLED'
                ? 'border-2 border-[#0284c7] text-[#0284c7] bg-sky-50/70 shadow-xs'
                : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
            }`}
          >
            Cancelled ({countCancelled})
          </button>
        </div>

        {/* ==================================================
            2. THE ORDER CARD
           ================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">

          {/* Top Row: Order Header, Multi-Dimensional Status Badges, Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Order #{order.orderNumber}
              </h2>

              {/* Service Type Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isLaundry ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                isFood ? 'bg-amber-50 text-amber-800 border-amber-200' :
                serviceType === 'FRESH_PRODUCE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                {isLaundry && <Shirt className="w-3.5 h-3.5" />}
                {isFood && <Utensils className="w-3.5 h-3.5" />}
                {serviceType === 'FRESH_PRODUCE' && <Apple className="w-3.5 h-3.5" />}
                {serviceType === 'STATIONERY' && <BookOpen className="w-3.5 h-3.5" />}
                <span>{serviceType.replace(/_/g, ' ')}</span>
              </span>

              {/* Primary Order Status */}
              {getStatusBadge(order.status)}

              {/* Payment Status Badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                order.paymentStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                order.paymentStatus === 'REFUNDED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <CreditCard className="w-3 h-3" />
                <span>{order.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'ONLINE'}: {order.paymentStatus}</span>
              </span>

              {/* Refund Badge (if active) */}
              {order.refundStatus && order.refundStatus !== 'NOT_APPLICABLE' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <RotateCcw className="w-3 h-3" />
                  <span>REFUND: {order.refundStatus.replace(/_/g, ' ')}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium self-start sm:self-auto">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{orderDate}</span>
            </div>
          </div>

          {/* 4-Column Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">

            {/* Column 1: PURCHASED ITEMS */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                {isLaundry ? 'SERVICE TYPE' : 'PURCHASED ITEMS'}
              </div>
              <p className="text-sm font-bold text-gray-900 leading-snug">
                {purchasedItemsText}
              </p>
              {isLaundry && order.laundryDetails && (
                <div className="text-[11px] text-indigo-700 font-semibold mt-1">
                  Tier: {order.laundryDetails.serviceTier || 'Wash & Fold'} • Weight: {order.laundryDetails.weightKg ? `${order.laundryDetails.weightKg} kg` : 'Pending weigh-in'}
                </div>
              )}
            </div>

            {/* Column 2: DELIVERY DESTINATION */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                DELIVERY DESTINATION
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-gray-800 leading-relaxed">
                  {deliveryAddressText}
                </span>
              </div>
            </div>

            {/* Column 3: DELIVERY PARTNER / RUNNER */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                CAMPUS RUNNER
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2e7d32] flex items-center justify-center shrink-0">
                  <User className="w-3 h-3" />
                </div>
                <span className="font-black text-gray-900 text-sm">
                  {partnerName}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono">
                ID: {partnerId} • {partnerPhone}
              </p>
            </div>

            {/* Column 4: TOTAL AMOUNT & RECEIPT */}
            <div className="space-y-1.5 sm:text-right">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                TOTAL PAID
              </div>
              <div className="text-xl font-black text-gray-900">
                ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </div>
              <button
                onClick={() => setShowReceiptModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0284c7] hover:underline cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Receipt</span>
              </button>
            </div>
          </div>

          {/* =======================================================
              SERVICE-SPECIFIC DETAIL PANELS & GOVERNANCE BANNERS
             ======================================================= */}

          {/* COD PARTIAL ADVANCE PAYMENT BREAKDOWN */}
          {order.paymentMethod === 'CASH_ON_DELIVERY' && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-amber-950 text-xs">Cash on Delivery Settlement Breakdown</h4>
                  <div className="text-[11px] text-amber-800 mt-0.5 space-x-2">
                    <span>Advance Paid Online: <strong className="text-[#2e7d32]">₹{(order as any).codPaidAdvance || (order.paymentStatus === 'COD_PENDING' ? 10 : 0)}</strong></span>
                    <span>•</span>
                    <span>Cash Due on Doorstep Delivery: <strong className="text-amber-950 font-bold">₹{(order as any).codRemainingCash || Math.max(0, order.totalAmount - ((order as any).codPaidAdvance || 10))}</strong></span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                Doorstep Cash Handover
              </span>
            </div>
          )}

          {/* ORDER LOCK / MODIFICATION STATUS BANNER */}
          {(order as any).isModifiable ? (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">Order Placed • Vendor Acceptance Pending</h4>
                  <p className="text-[11px] text-emerald-700">
                    You can modify your delivery room number or special notes until the vendor accepts the order.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setModifyRoom(order.roomNumber);
                  setModifyInstructions(order.specialInstructions || '');
                  setModifyModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs cursor-pointer shrink-0"
              >
                Modify Delivery Details
              </button>
            </div>
          ) : order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong>Order Locked:</strong> Vendor has accepted your order and fulfillment has started. Items and delivery details are locked against modifications.
              </span>
            </div>
          )}

          {/* PRODUCE INSPECTION & GRADING PANEL */}
          {isProduce && order.status !== 'CANCELLED' && (
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Produce Inspection &amp; Quality Grading Status</h4>
                  <p className="text-[11px] text-emerald-700">
                    {order.status === 'PREPARING'
                      ? 'Quality grading in progress • Checking crispness, ripeness & weight'
                      : order.status === 'CONFIRMED' || order.status === 'ACCEPTED'
                      ? 'Produce vendor accepted order. Preparing fresh eco-crate harvest batch.'
                      : 'Fresh produce inspected, packed in eco-crate & ready for runner dispatch.'}
                  </p>
                  {(order as any).produceDetails?.freshnessNotes && (
                    <div className="text-[10px] text-emerald-800 italic mt-0.5">
                      Inspector Note: "{(order as any).produceDetails.freshnessNotes}"
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {order.status === 'PREPARING' ? '🍏 Quality Grading' : '🧺 Farm/Mandi Fresh Batch'}
                </span>
              </div>
            </div>
          )}

          {/* STATIONERY DESK ASSEMBLY PANEL */}
          {isStationery && order.status !== 'CANCELLED' && (
            <div className="bg-sky-50/70 border border-sky-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-sky-950">Stationery Desk Assembly &amp; Academic Stock Status</h4>
                  <p className="text-[11px] text-sky-700">
                    {order.status === 'PREPARING'
                      ? 'Items being assembled from campus bookstore shelves & verified against syllabus specs'
                      : order.status === 'CONFIRMED' || order.status === 'ACCEPTED'
                      ? 'Bookstore accepted order. Reserving academic stock from shelf.'
                      : 'Stationery items checked, packaged in sealed campus bag & ready for delivery.'}
                  </p>
                  {(order as any).stationeryDetails?.brandRequirements && (
                    <div className="text-[10px] text-sky-800 italic mt-0.5">
                      Desk Spec: "{(order as any).stationeryDetails.brandRequirements}"
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-sky-900 bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200">
                  {order.status === 'PREPARING' ? '📚 Assembling Desk' : '📋 Verified Academic Stock'}
                </span>
              </div>
            </div>
          )}
          
          {/* FOOD PREP PROGRESS PANEL */}
          {isFood && order.status !== 'CANCELLED' && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Kitchen Preparation Status</h4>
                  <p className="text-[11px] text-amber-700">
                    {order.status === 'PREPARING'
                      ? `Cooking in progress • Approx ${order.foodDetails?.preparationTimeMinutes || 15} mins remaining`
                      : order.status === 'CONFIRMED' || order.status === 'ACCEPTED'
                      ? 'Order accepted by cafeteria. Preparation starting shortly.'
                      : 'Meal cooked & ready for runner dispatch.'}
                  </p>
                  {order.foodDetails?.cookingInstructions && (
                    <div className="text-[10px] text-amber-800 italic mt-0.5">
                      Chef Note: "{order.foodDetails.cookingInstructions}"
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                  {order.status === 'PREPARING' ? '🔥 Cooking Live' : '📋 Queued in Kitchen'}
                </span>
              </div>
            </div>
          )}

          {/* LAUNDRY DOORSTEP DUAL-OTP & WASH CYCLE PANEL */}
          {isLaundry && order.status !== 'CANCELLED' && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950">Campus Doorstep Laundry Verification</h4>
                    <p className="text-[11px] text-indigo-700">Dual-OTP secure handover protocol</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-100/80 px-2.5 py-1 rounded-md">
                    Stage: {(order.laundryDetails?.washCycleStage || order.status).replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* OTP Display Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pickup OTP */}
                <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1 text-indigo-900">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      Step 1: Doorstep Pickup OTP
                    </span>
                    <span className="text-[10px] text-slate-400">Share during pickup</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black tracking-widest text-indigo-700 font-mono">
                      {order.pickupOtp || order.laundryDetails?.pickupOtp || '••••••'}
                    </span>
                    <button
                      onClick={() => {
                        const otp = order.pickupOtp || order.laundryDetails?.pickupOtp;
                        if (otp) {
                          navigator.clipboard.writeText(otp);
                          showToast('Pickup OTP copied to clipboard');
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Provide this code to runner when handing over your laundry bag.
                  </p>
                </div>

                {/* Delivery OTP */}
                <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-900">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      Step 2: Clean Clothes Delivery OTP
                    </span>
                    <span className="text-[10px] text-slate-400">Share after inspecting</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black tracking-widest text-emerald-700 font-mono">
                      {order.deliveryOtp || order.laundryDetails?.deliveryOtp || '••••••'}
                    </span>
                    <button
                      onClick={() => {
                        const otp = order.deliveryOtp || order.laundryDetails?.deliveryOtp;
                        if (otp) {
                          navigator.clipboard.writeText(otp);
                          showToast('Delivery OTP copied to clipboard');
                        }
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Share only after checking that all clothes have been returned intact.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STANDARD ORDERS: SECURE CUSTOMER DELIVERY OTP PANEL */}
          {!isLaundry && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.deliveryOtp && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-blue-500/10 border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      Customer Delivery Verification OTP
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Active Handover Code
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600">
                      Share this 6-digit code with your campus runner only after receiving your items at your room door.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'PICKED_UP'].includes(order.status) ? 'Runner En Route' : 'Ready for Handover'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Customer Delivery OTP
                  </span>
                  <div className="text-3xl sm:text-4xl font-black tracking-widest text-emerald-700 font-mono">
                    {order.deliveryOtp}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (order.deliveryOtp) {
                        navigator.clipboard.writeText(order.deliveryOtp);
                        showToast('Delivery OTP copied to clipboard');
                      }
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy OTP</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Zero fraud guarantee: The delivery runner must enter this exact 6-digit OTP on their device to successfully complete delivery.
                </span>
              </div>
            </div>
          )}

          {/* STANDARD ORDERS: DELIVERED CONFIRMATION BANNER */}
          {!isLaundry && order.status === 'DELIVERED' && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">Delivery Confirmed & Handed Over</h4>
                  <p className="text-[11px] text-emerald-700">
                    Order successfully delivered at your door and verified via 6-digit customer OTP.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200">
                OTP Verified
              </span>
            </div>
          )}

          {/* ==================================================
              3. RADAR & PROGRESS STEPPER
             ================================================== */}
          {order.status !== 'CANCELLED' && (
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-2xl p-5 sm:p-6 space-y-6">

              {/* Headline Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#0284c7] animate-ping" />
                  <span className="text-xs sm:text-sm font-black text-gray-900">
                    {getRadarHeadline(order.status)}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[#0284c7] bg-white px-3 py-1 rounded-full border border-[#bae6fd] self-start sm:self-auto">
                  Live Dispatch Tracking
                </div>
              </div>

              {/* Horizontal Stepper */}
              <div className="relative pt-2 pb-2">
                <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-[#0284c7] rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(100, Math.max(0, (activeStep / (checkpoints.length - 1)) * 100))}%`
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 sm:gap-2 relative z-10">
                  {checkpoints.map((cp, idx) => {
                    const isCompleted = idx < activeStep;
                    const isCurrent = idx === activeStep;

                    return (
                      <div key={cp.id} className="flex flex-col items-center text-center space-y-1.5">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${
                            isCompleted
                              ? 'bg-[#2e7d32] text-white shadow-xs'
                              : isCurrent
                              ? 'bg-[#0284c7] text-white ring-4 ring-sky-200 shadow-md scale-105'
                              : 'bg-white border-2 border-gray-300 text-gray-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                        </div>

                        <div className="space-y-0.5">
                          <span
                            className={`block text-xs font-bold leading-tight ${
                              isCurrent
                                ? 'text-[#0284c7]'
                                : isCompleted
                                ? 'text-gray-900'
                                : 'text-gray-400'
                            }`}
                          >
                            {cp.label}
                          </span>
                          <span className="hidden sm:block text-[10px] text-gray-400 font-medium">
                            {cp.sub}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              4. TRANSPARENT REFUND STATUS TRACKER (IF REFUND ACTIVE)
             ======================================================= */}
          {/* =======================================================
              4. CRITICAL CANCELLATION & REFUND TIMING RULE DISPLAY
             ======================================================= */}
          {order.status === 'CANCELLED' && (
            <div className="bg-rose-50/80 border-2 border-rose-300 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
              
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black tracking-widest text-rose-600 uppercase">
                        ORDER CANCELLED
                      </span>
                      {/* Case Pill */}
                      <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                        order.paymentMethod !== 'CASH_ON_DELIVERY'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : Number(order.advancePaidAmount || order.refundAmount || 0) > 0
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}>
                        {order.paymentMethod !== 'CASH_ON_DELIVERY'
                          ? 'Full Refund'
                          : Number(order.advancePaidAmount || order.refundAmount || 0) > 0
                          ? 'Advance Payment Refund'
                          : 'No Refund Applicable'}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-rose-950 mt-1">
                      {order.paymentMethod !== 'CASH_ON_DELIVERY' ? (
                        <span>₹{Number(order.refundAmount || order.totalAmount).toLocaleString('en-IN')} Refund Pending</span>
                      ) : Number(order.advancePaidAmount || order.refundAmount || 0) > 0 ? (
                        <span>₹{Number(order.advancePaidAmount || order.refundAmount).toLocaleString('en-IN')} Refund Pending</span>
                      ) : (
                        <span>No Refund Applicable</span>
                      )}
                    </h3>
                  </div>
                </div>

                {/* Right Badge */}
                <div className="sm:text-right">
                  <span className="text-xs font-semibold text-rose-700 block">Cancellation Timing</span>
                  <span className="text-xs font-black text-rose-950 bg-white px-3 py-1 rounded-lg border border-rose-200 inline-block mt-0.5">
                    {order.providerAccepted ? 'Post-Provider Acceptance' : 'Before Provider Acceptance'}
                  </span>
                </div>
              </div>

              {/* Exact Policy Message */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 text-xs leading-relaxed text-gray-800 shadow-2xs">
                {order.paymentMethod !== 'CASH_ON_DELIVERY' ? (
                  <p className="font-semibold text-gray-900">
                    "Your order was cancelled before the provider accepted it. Your full payment of <strong className="text-emerald-700 font-bold">₹{Number(order.refundAmount || order.totalAmount).toLocaleString('en-IN')}</strong> has been added to the refund process."
                  </p>
                ) : Number(order.advancePaidAmount || order.refundAmount || 0) > 0 ? (
                  <p className="font-semibold text-gray-900">
                    "You paid <strong className="text-emerald-700 font-bold">₹{Number(order.advancePaidAmount || order.refundAmount).toLocaleString('en-IN')}</strong> as an advance for this COD order. The order was cancelled before the provider accepted it, so your <strong className="text-emerald-700 font-bold">₹{Number(order.advancePaidAmount || order.refundAmount).toLocaleString('en-IN')}</strong> advance payment has been added to the refund process."
                    <span className="block text-[11px] text-gray-500 font-normal mt-1">
                      (The ₹{Number(order.totalAmount - (order.advancePaidAmount || order.refundAmount || 0)).toLocaleString('en-IN')} COD amount is not included in the refund because it was never collected.)
                    </span>
                  </p>
                ) : (
                  <p className="font-semibold text-gray-900">
                    "Since this was a Cash on Delivery order and no payment was collected in advance, there is no refund due."
                  </p>
                )}
              </div>

              {/* Timeline Stepper for Cases with Refund (Case A & Case C) */}
              {(order.paymentMethod !== 'CASH_ON_DELIVERY' || Number(order.advancePaidAmount || order.refundAmount || 0) > 0) && (
                <div className="space-y-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-900">
                    Refund Lifecycle Timeline
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    {/* Timeline Item 1 */}
                    <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Order cancelled</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Order voided before provider accepted.</p>
                    </div>

                    {/* Timeline Item 2 */}
                    <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{order.paymentMethod !== 'CASH_ON_DELIVERY' ? 'Full refund generated' : 'Refund generated'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Refund claim logged in financial escrow.</p>
                    </div>

                    {/* Timeline Item 3 */}
                    <div className={`p-3.5 rounded-xl border shadow-2xs space-y-1 ${
                      order.refundStatus === 'COMPLETED' ? 'bg-white border-rose-200' : 'bg-amber-50 border-amber-300'
                    }`}>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {order.refundStatus === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        )}
                        <span>Refund processing</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Central Finance Cell auditing disbursal.</p>
                    </div>

                    {/* Timeline Item 4 */}
                    <div className={`p-3.5 rounded-xl border shadow-2xs space-y-1 ${
                      order.refundStatus === 'COMPLETED' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5">
                        {order.refundStatus === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                        )}
                        <span>Refund completed</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {order.refundStatus === 'COMPLETED' ? 'Credited to student account.' : 'Awaiting gateway transfer.'}
                      </p>
                    </div>
                  </div>

                  {/* Confidential Destination Account Details */}
                  <div className="bg-white p-4 rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Refund Destination: {savedRefundAccount ? `${savedRefundAccount.accountType} (${savedRefundAccount.upiIdMasked || savedRefundAccount.accountNumberMasked})` : 'Default Payment Source (UPI/Card)'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Encrypted institutional record. Strictly protected from delivery runners and providers.
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setRefundAccountModalOpen(true)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{savedRefundAccount ? 'Change Refund Account' : 'Set Refund Account'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Return / Post-Delivered Refund Tracker */}
          {order.status !== 'CANCELLED' && showRefundSection && (
            <div className="bg-rose-50/70 border-2 border-rose-200 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-950 flex items-center gap-2">
                      Return Refund Tracking & Financial Disbursal
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                        {order.refundStatus?.replace(/_/g, ' ')}
                      </span>
                    </h4>
                    <p className="text-xs text-rose-700">
                      Transparent status of funds returning to your source account
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-rose-700 font-semibold block">Refund Amount</span>
                  <span className="text-lg font-black text-rose-900">
                    ₹{Number(order.refundAmount || order.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              5. ACTION ROW AT BOTTOM OF CARD
             ================================================== */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSupportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Help with Order</span>
              </button>

              <button
                onClick={handleReorder}
                className="px-4 py-2 rounded-xl bg-[#f1f8e9] hover:bg-[#e8f5e9] text-[#2e7d32] border border-[#dcedc8] text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reorder Items</span>
              </button>

              <button
                onClick={() => setRefundAccountModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Confidential Refund A/C</span>
              </button>

              {(order as any).isModifiable && (
                <button
                  onClick={() => {
                    setModifyRoom((order as any).deliveryRoom || (order as any).roomNumber || '');
                    setModifyInstructions((order as any).deliveryInstructions || '');
                    setModifyModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modify Room / Notes</span>
                </button>
              )}

              {((order as any).canReturn || (order.status === 'DELIVERED' && order.serviceType !== 'LAUNDRY')) && (
                <button
                  onClick={() => {
                    setReturnReason('');
                    setReturnModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Request Return</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {cancellationEligibility.cancellable ? (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Order</span>
                </button>
              ) : order.status !== 'CANCELLED' && (
                <span
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-semibold flex items-center gap-1 cursor-not-allowed"
                  title={cancellationEligibility.reason}
                >
                  <Lock className="w-3 h-3" />
                  <span>Cancellation Locked</span>
                </span>
              )}

              <Link
                href={isLaundry ? '/laundry/book' : isFood ? '/food' : '/dashboard'}
                className="px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold transition shadow-xs"
              >
                {isLaundry ? 'Book More Laundry' : isFood ? 'Browse Campus Menu' : 'Campus Store'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          RECEIPT MODAL (Opened via [View Receipt])
         ================================================== */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#2e7d32] flex items-center justify-center font-black">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Campus Basket Receipt</h3>
                  <p className="text-[11px] text-gray-400 font-mono">Invoice #{order.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Summary Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Customer</span>
                <strong className="text-gray-900">{order.roomNumber ? `Room ${order.roomNumber}` : 'Student'}, {order.hallName}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Date</span>
                <strong className="text-gray-900">{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Payment Method</span>
                <strong className="text-gray-900">{order.paymentMethod.replace(/_/g, ' ')} ({order.paymentStatus})</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Service Category</span>
                <strong className="text-gray-900">{serviceType.replace(/_/g, ' ')}</strong>
              </div>
            </div>

            {/* Itemized list */}
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                Order Items ({order.items.length})
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900">{item.productName}</span>
                      <span className="text-gray-400 ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-black text-gray-900">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials Breakdown */}
            <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount Applied</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Campus Delivery Fee</span>
                <span className="font-semibold text-gray-900">{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-base font-black text-gray-900">
                <span>Total Paid</span>
                <span className="text-xl text-[#0284c7]">₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-gray-500" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          CANCEL ORDER MODAL (Service-Adaptive)
         ================================================== */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Cancel Order #{order.orderNumber}?</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {isFood
                ? 'Your order has not started kitchen cooking yet. You may cancel now for a full refund.'
                : isLaundry
                ? 'Your laundry bag has not been collected yet. You may cancel now for a full refund.'
                : 'Are you sure you want to cancel this order? Any payments will be refunded to your source account.'}
            </p>

            <div className="text-left space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Reason for cancellation:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
              >
                <option value="Changed mind">Changed my mind</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Wait time too long">Wait time too long</option>
                <option value="Need to change items">Need to change items</option>
                <option value="Other">Other campus reason</option>
              </select>
            </div>

            {cancelMessage && (
              <div className="p-3 rounded-xl bg-gray-100 text-xs font-bold text-gray-800">
                {cancelMessage}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          CONFIDENTIAL STUDENT REFUND ACCOUNT MODAL
         ================================================== */}
      {refundAccountModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Confidential Refund Account</h3>
                  <p className="text-[11px] text-slate-500">Campus Bank & UPI Payout Privacy Vault</p>
                </div>
              </div>
              <button
                onClick={() => setRefundAccountModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Privacy Alert */}
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-950">
              <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Protected Institutional Privacy</span>
                Your banking & UPI details are encrypted and accessible exclusively by Central Campus Finance Administrators for disbursing refund claims. Service providers and delivery runners have <strong>zero</strong> visibility to this account.
              </div>
            </div>

            {savedRefundAccount && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Currently Stored Account</div>
                <div className="font-bold text-slate-800">
                  {savedRefundAccount.accountType === 'UPI' ? `UPI: ${savedRefundAccount.upiIdMasked}` : `Bank A/C: ${savedRefundAccount.accountNumberMasked} (${savedRefundAccount.bankName})`}
                </div>
                <div className="text-[11px] text-slate-500">Beneficiary: {savedRefundAccount.accountHolderName}</div>
              </div>
            )}

            <form onSubmit={handleSaveRefundAccount} className="space-y-4 text-xs">
              {/* Account Type Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Disbursal Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRefundAccountForm(prev => ({ ...prev, accountType: 'UPI' }))}
                    className={`py-2 px-3 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 ${
                      refundAccountForm.accountType === 'UPI'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Instant UPI ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundAccountForm(prev => ({ ...prev, accountType: 'BANK' }))}
                    className={`py-2 px-3 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 ${
                      refundAccountForm.accountType === 'BANK'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Bank Account (IMPS/NEFT)</span>
                  </button>
                </div>
              </div>

              {/* Beneficiary Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Holder Full Name</label>
                <input
                  type="text"
                  required
                  value={refundAccountForm.accountHolderName}
                  onChange={(e) => setRefundAccountForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* UPI Fields */}
              {refundAccountForm.accountType === 'UPI' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UPI ID (VPA)</label>
                  <input
                    type="text"
                    required
                    value={refundAccountForm.upiId}
                    onChange={(e) => setRefundAccountForm(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="e.g. rahul@oksbi, rahul@paytm"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Campus refunds are disbursed instantly through the campus banking gateway.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={refundAccountForm.bankName}
                      onChange={(e) => setRefundAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="e.g. State Bank of India"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        required
                        value={refundAccountForm.accountNumber}
                        onChange={(e) => setRefundAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="e.g. 30291823901"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        required
                        value={refundAccountForm.ifscCode}
                        onChange={(e) => setRefundAccountForm(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                        placeholder="e.g. SBIN0002108"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {refundAccountError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium">
                  {refundAccountError}
                </div>
              )}

              {refundAccountSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{refundAccountSuccess}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundAccountModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundAccountSaving}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {refundAccountSaving ? 'Encrypting & Saving...' : 'Save Confidential Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0284c7]" />
                <h3 className="text-sm font-black text-gray-900">Campus Helpdesk Support</h3>
              </div>
              <button
                onClick={() => setSupportModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 font-bold mb-1">Issue Category</label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                >
                  <option>Order hasn't arrived</option>
                  <option>Missing items or wrong item delivered</option>
                  <option>Runner unreachable or delayed</option>
                  <option>Refund or billing issue</option>
                  <option>Other hostel delivery assistance</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">Message Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your issue in detail for campus operators..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] text-xs"
                />
              </div>

              {supportSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{supportSuccess}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSupportModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={supportSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{supportSubmitting ? 'Submitting...' : 'Send Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Delivery Details Modal */}
      {modifyModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-900">Modify Delivery Information</h3>
                  <p className="text-[11px] text-gray-500">Allowed only prior to provider acceptance</p>
                </div>
              </div>
              <button
                onClick={() => setModifyModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModifyOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-bold mb-1">Room / Door Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 402, Hall 4"
                  value={modifyRoom}
                  onChange={(e) => setModifyRoom(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Special Delivery Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please leave near security desk if away"
                  value={modifyInstructions}
                  onChange={(e) => setModifyInstructions(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-gray-800"
                />
              </div>

              {modifySuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{modifySuccess}</span>
                </div>
              )}

              {modifyError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-bold">
                  {modifyError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModifyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modifying}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {modifying ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-900">Request Item Return</h3>
                  <p className="text-[11px] text-gray-500">
                    {isProduce ? 'Freshness guarantee return window' : isStationery ? 'Stationery 24-Hour Return Window' : 'Quality verification return'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestReturn} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <p className="font-bold text-slate-700 mb-1">Return Eligibility Guidelines:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {isProduce && <li>Fruits / Produce: within 2 hours of delivery for freshness defects</li>}
                  {isStationery && <li>Stationery / Bookstore: within 24 hours in original seal/condition</li>}
                  {isFood && <li>Kitchen food items: within 30 minutes for incorrect or damaged prep</li>}
                </ul>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Reason for Return</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why you are requesting a return (e.g. damaged seal, damaged fruit, wrong notebook size)..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs text-gray-800"
                />
              </div>

              {returnSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{returnSuccess}</span>
                </div>
              )}

              {returnError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-bold">
                  {returnError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returning}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {returning ? 'Submitting...' : 'Submit Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
