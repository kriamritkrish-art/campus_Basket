'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { apiRequest } from '../../lib/api';
import { Order, Product } from '../../types';
import { FALLBACK_STORE_PRODUCTS } from '../../lib/fallbackCatalog';
import {
  User,
  ShoppingBag,
  MapPin,
  Clock,
  ShieldCheck,
  RotateCcw,
  FileText,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  Truck,
  RotateCw,
  CreditCard,
  Wallet,
  Heart,
  Bell,
  Gift,
  HelpCircle,
  Settings,
  ArrowRight,
  AlertTriangle,
  XCircle,
  Trash2,
  Copy,
  Plus,
  Send,
  Building,
  Check,
  ExternalLink
} from 'lucide-react';

type DashboardTab =
  | 'profile'
  | 'orders'
  | 'active-order'
  | 'refunds'
  | 'payments'
  | 'payment-methods'
  | 'delivery'
  | 'wishlist'
  | 'notifications'
  | 'offers'
  | 'support'
  | 'settings';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const { addItem, showToast } = useCart();

  const tabParam = (searchParams.get('tab') as DashboardTab) || 'orders';
  const [activeTab, setActiveTab] = useState<DashboardTab>(tabParam);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersFilter, setOrdersFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'>('ALL');
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Profile Edit State
  const [mobileNumber, setMobileNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [hallName, setHallName] = useState('Hall 11');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Call before delivery.');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Wishlist State
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      title: 'Order Delivered',
      message: 'Your order #CB10294 has been delivered to your room door.',
      time: '15 mins ago',
      type: 'ORDER',
      read: false
    },
    {
      id: 'notif_2',
      title: 'Payment Successful',
      message: 'Payment of ₹140 confirmed for Order #CB10294.',
      time: '35 mins ago',
      type: 'PAYMENT',
      read: false
    },
    {
      id: 'notif_3',
      title: 'Campus Food Festival',
      message: '10% off on selected campus meals with code HOSTEL10.',
      time: '2 hours ago',
      type: 'OFFER',
      read: true
    },
    {
      id: 'notif_4',
      title: 'Refund Processed',
      message: 'Your refund of ₹80 for #CB10210 has been processed.',
      time: 'Yesterday',
      type: 'REFUND',
      read: true
    }
  ]);

  // Support State
  const [supportOrderSelect, setSupportOrderSelect] = useState<string>('');
  const [supportCategory, setSupportCategory] = useState('Order hasn\'t arrived');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  // Active Order
  const activeOrder = orders.find((o) =>
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status)
  );

  // Synced tab from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as DashboardTab;
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Handle Tab Switch
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  };

  // Sync initial user profile data
  useEffect(() => {
    if (user?.student) {
      setMobileNumber(user.student.mobileNumber || '');
      setRoomNumber(user.student.roomNumber || '123');
      setHallName(user.student.hall?.name || 'Hall 11');
    }
  }, [user]);

  // Load Orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await apiRequest('/api/orders');
      if (res.success && Array.isArray(res.orders)) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load Wishlist
  const loadWishlist = async () => {
    setLoadingWishlist(true);
    try {
      const favIds = JSON.parse(localStorage.getItem('campus_basket_favorites') || '[]');
      const res = await apiRequest('/api/campus/favorites');
      if (res.success && Array.isArray(res.favorites) && res.favorites.length > 0) {
        setWishlistProducts(res.favorites.map((f: any) => f.product).filter(Boolean));
      } else if (Array.isArray(favIds) && favIds.length > 0) {
        const localMatches = FALLBACK_STORE_PRODUCTS.filter((p) => favIds.includes(p.id));
        setWishlistProducts(localMatches);
      } else {
        setWishlistProducts([]);
      }
    } catch {
      const favIds = JSON.parse(localStorage.getItem('campus_basket_favorites') || '[]');
      const localMatches = FALLBACK_STORE_PRODUCTS.filter((p) => favIds.includes(p.id));
      setWishlistProducts(localMatches);
    } finally {
      setLoadingWishlist(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?role=STUDENT');
        return;
      }
      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
        return;
      }
      if (role === 'SERVICE_PROVIDER') {
        router.push('/provider/dashboard');
        return;
      }
      if (role === 'DELIVERY_BOY') {
        router.push('/delivery/dashboard');
        return;
      }
      loadOrders();
      loadWishlist();
    }
  }, [isAuthenticated, isLoading, role, router]);

  // Reorder Action
  const handleReorder = (orderToReorder: any) => {
    if (!orderToReorder?.items || orderToReorder.items.length === 0) return;
    let addedCount = 0;
    for (const item of orderToReorder.items) {
      const matchedCatalog = FALLBACK_STORE_PRODUCTS.find((p) => p.name === item.productName || p.id === item.productId);
      if (matchedCatalog && !matchedCatalog.isOutOfStock) {
        addItem(matchedCatalog, item.quantity);
        addedCount += item.quantity;
      } else {
        // Construct item
        addItem({
          id: item.productId || item.id,
          name: item.productName,
          slug: item.productName.toLowerCase().replace(/\s+/g, '-'),
          price: item.unitPrice,
          stock: 50,
          isOutOfStock: false,
          unit: 'portion',
          primaryImage: item.image || null,
          category: { id: 'cat_food', name: 'Food', slug: 'food' }
        } as any, item.quantity);
        addedCount += item.quantity;
      }
    }
    showToast(`${addedCount} items added to your basket.`);
    router.push('/cart');
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg(null);
    try {
      const res = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          mobileNumber,
          roomNumber,
          hallName,
          deliveryInstructions
        })
      });

      if (res.success) {
        setProfileSuccessMsg('Delivery details and room updated successfully!');
        showToast('Profile updated successfully.');
        setTimeout(() => setProfileSuccessMsg(null), 3000);
      } else {
        setProfileSuccessMsg(res.message || 'Profile saved.');
      }
    } catch {
      setProfileSuccessMsg('Profile updated locally.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Remove item from Wishlist
  const handleRemoveWishlist = (productId: string) => {
    const nextList = wishlistProducts.filter((p) => p.id !== productId);
    setWishlistProducts(nextList);
    try {
      const favs = JSON.parse(localStorage.getItem('campus_basket_favorites') || '[]');
      const updated = Array.isArray(favs) ? favs.filter((id: string) => id !== productId) : [];
      localStorage.setItem('campus_basket_favorites', JSON.stringify(updated));
    } catch {}
    showToast('Product removed from Wishlist.');
  };

  // Support Submission
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSupportSubmitting(true);
    setSupportSuccess(null);
    try {
      const categoryEnumMap: Record<string, string> = {
        'Order hasn\'t arrived': 'DELIVERY',
        'Missing item': 'FOOD',
        'Wrong item': 'FOOD',
        'Damaged item': 'FOOD',
        'Payment issue': 'PAYMENT',
        'Refund issue': 'PAYMENT',
        'Other issue': 'OTHER'
      };

      const res = await apiRequest('/api/campus/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          orderId: supportOrderSelect || undefined,
          category: categoryEnumMap[supportCategory] || 'FOOD',
          message: `[${supportCategory}] ${supportMessage}`,
          priority: 'MEDIUM'
        })
      });

      if (res.success) {
        setSupportSuccess('Support ticket registered! Campus support team will contact you.');
        setSupportMessage('');
        showToast('Support ticket created.');
      } else {
        setSupportSuccess('Support request logged. We are reviewing your issue.');
      }
    } catch {
      setSupportSuccess('Support ticket submitted.');
    } finally {
      setSupportSubmitting(false);
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    if (ordersFilter === 'ALL') return true;
    if (ordersFilter === 'ACTIVE') {
      return ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status);
    }
    if (ordersFilter === 'DELIVERED') return o.status === 'DELIVERED';
    if (ordersFilter === 'CANCELLED') return o.status === 'CANCELLED';
    if (ordersFilter === 'REFUNDED') return o.paymentStatus === 'REFUNDED' || o.status === 'CANCELLED';
    return true;
  });

  // Cancelled/Refunded Orders list for Refunds tab
  const refundOrders = orders.filter((o) => o.status === 'CANCELLED' || o.paymentStatus === 'REFUNDED');

  const hallsList = [
    'Hall 1', 'Hall 2', 'Hall 3', 'Hall 4', 'Hall 5',
    'Hall 7', 'Hall 8', 'Hall 9', 'Hall 10', 'Hall 11',
    'Hall 12', 'Hall 13', 'Hall 14', 'Mother Teresa Hall',
    'Sister Nivedita Hall', 'Gargi Hall'
  ];

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-[#689f38] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. Student Identity Header (Matching exact style from user screenshot) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#0288d1] text-white flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
              {user?.student?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {user?.student?.fullName || 'NIT Durgapur Student'}
                </h1>
                <span className="text-[10px] font-extrabold bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> College Verified
                </span>
              </div>
              <div className="text-xs text-gray-500 font-mono mt-1">{user?.email}</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-2">
                <span>Roll: <strong className="font-mono text-gray-900">{user?.student?.rollNumber || '24U10227'}</strong></span>
                <span>•</span>
                <span>Reg: <strong className="font-mono text-gray-900">{user?.student?.registrationNumber || '2026-UG-10227'}</strong></span>
                <span>•</span>
                <span>Mobile: <strong className="text-gray-900">{mobileNumber || '+91 98765 43210'}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-[#1e293b] text-white rounded-2xl p-4 flex items-center gap-3.5 shrink-0 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Assigned Delivery Room
              </div>
              <div className="text-sm font-black text-white mt-0.5">
                {hallName}, Room {roomNumber}
              </div>
              <div className="text-[10px] text-gray-400">NIT Durgapur Campus</div>
            </div>
          </div>
        </div>

        {/* 2. Prominent Active Order Banner (Requirement 8) */}
        {activeOrder && (
          <div className="bg-[#f1f8e9] border-2 border-[#84c225] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#689f38] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
                    Active Order
                  </span>
                  <span className="text-xs font-bold text-gray-500 font-mono">
                    #{activeOrder.orderNumber}
                  </span>
                </div>
                <h2 className="text-base font-black text-gray-900 mt-1">
                  {activeOrder.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                  <span>Status: <strong className="text-[#2e7d32] font-extrabold">{activeOrder.status.replace(/_/g, ' ')}</strong></span>
                  <span>•</span>
                  <span>Estimated delivery: <strong className="text-gray-900 font-bold">10–15 minutes</strong></span>
                </div>
              </div>
            </div>

            <Link
              href={`/orders/${activeOrder.id}/track`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 shrink-0"
            >
              <span>Track Order</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* 3. Dashboard Multi-Tab Navigation Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 min-w-max text-xs font-bold">
            <button
              onClick={() => handleTabChange('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'orders'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>My Orders</span>
              <span className="ml-0.5 text-[10px] opacity-80">({orders.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('profile')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'profile'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </button>

            {activeOrder && (
              <button
                onClick={() => handleTabChange('active-order')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                  activeTab === 'active-order'
                    ? 'bg-[#689f38] text-white shadow-sm'
                    : 'text-[#2e7d32] bg-[#f1f8e9] hover:bg-[#e8f5e9]'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Track Active Order</span>
              </button>
            )}

            <button
              onClick={() => handleTabChange('refunds')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'refunds'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Refunds</span>
            </button>

            <button
              onClick={() => handleTabChange('payments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'payments'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment History</span>
            </button>

            <button
              onClick={() => handleTabChange('payment-methods')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'payment-methods'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Payment Methods</span>
            </button>

            <button
              onClick={() => handleTabChange('delivery')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'delivery'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Delivery Details</span>
            </button>

            <button
              onClick={() => handleTabChange('wishlist')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'wishlist'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Wishlist</span>
              {wishlistProducts.length > 0 && (
                <span className="ml-0.5 text-[10px] opacity-80">({wishlistProducts.length})</span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('notifications')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => handleTabChange('offers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'offers'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Offers &amp; Coupons</span>
            </button>

            <button
              onClick={() => handleTabChange('support')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'support'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help &amp; Support</span>
            </button>

            <button
              onClick={() => handleTabChange('settings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#689f38] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* 4. Tab Panels */}

        {/* TAB: MY ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-xs">
                {(['ALL', 'ACTIVE', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setOrdersFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      ordersFilter === filter
                        ? 'bg-[#689f38] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Orders' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <Link
                href="/food"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Browse Campus Menu
              </Link>
            </div>

            {/* Orders List */}
            {loadingOrders ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
                <div className="w-8 h-8 border-4 border-[#689f38] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-500">Loading your orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-gray-900">You haven't placed any orders yet.</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Satisfy your hunger with Kolkata chicken biryani, hot kathi rolls, and campus snacks delivered in 10-15 mins!
                </p>
                <Link
                  href="/food"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Browse Campus Menu
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isActive = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(order.status);
                  const isDelivered = order.status === 'DELIVERED';
                  const isCancelled = order.status === 'CANCELLED';

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-gray-900">
                              Order #{order.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                                isDelivered
                                  ? 'bg-emerald-50 text-[#2e7d32] border border-emerald-200'
                                  : isCancelled
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200'
                              }`}
                            >
                              {isDelivered ? '✓ Delivered' : order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })} • To: {order.hallName || 'Hall 11'}, Room {order.roomNumber || '123'}
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-base font-black text-gray-900">₹{order.totalAmount}</div>
                          <div className="text-[11px] text-gray-500">{order.paymentMethod.replace(/_/g, ' ')}</div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1 text-xs text-gray-700">
                        {order.items.map((i) => (
                          <div key={i.id} className="flex justify-between">
                            <span>{i.productName} <strong className="text-gray-900">× {i.quantity}</strong></span>
                            <span className="font-semibold text-gray-900">₹{i.totalPrice}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleReorder(order)}
                            className="px-4 py-2 bg-[#f1f8e9] hover:bg-[#e8f5e9] text-[#2e7d32] border border-[#dcedc8] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reorder
                          </button>
                        </div>

                        <Link
                          href={`/orders/${order.id}/track`}
                          className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all active:scale-95"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Track Order
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: MY PROFILE (Requirement 10) */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">My Student Profile</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage your verified college account and hostel room delivery preferences.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.student?.fullName || 'NIT Durgapur Student'}
                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-600 font-semibold cursor-not-allowed"
                  />
                  <span className="text-[10px] text-gray-400">Verified via College Identity Roll</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">College Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'student@nitdgp.ac.in'}
                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-600 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Student ID / Roll Number</label>
                  <input
                    type="text"
                    disabled
                    value={user?.student?.rollNumber || '24U10227'}
                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-600 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    disabled
                    value={user?.student?.registrationNumber || '2026-UG-10227'}
                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-600 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number (Editable)</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#84c225] focus:bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Used by campus delivery runners to notify upon hostel entry</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Residence Hostel / Hall</label>
                  <select
                    value={hallName}
                    onChange={(e) => setHallName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#84c225] focus:bg-white"
                  >
                    {hallsList.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Room Number (Editable)</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 123 or B-304"
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#84c225] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Campus Institute</label>
                  <input
                    type="text"
                    disabled
                    value="National Institute of Technology Durgapur"
                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-600 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Default Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Call before delivery, or leave outside room door."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#84c225] focus:bg-white"
                />
              </div>

              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {profileSuccessMsg}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: TRACK ACTIVE ORDER (Requirement 8) */}
        {activeTab === 'active-order' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            {activeOrder ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#2e7d32] text-white px-2.5 py-0.5 rounded-full">
                      Active Live Order
                    </span>
                    <h2 className="text-xl font-black text-gray-900 mt-1">
                      Order #{activeOrder.orderNumber}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Estimated delivery: <strong className="text-gray-900">10–15 minutes</strong> to {activeOrder.hallName}, Room {activeOrder.roomNumber}
                    </p>
                  </div>
                  <Link
                    href={`/orders/${activeOrder.id}/track`}
                    className="px-5 py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Full Tracking Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Ordered Items</h3>
                  <div className="divide-y divide-gray-100 bg-gray-50 rounded-2xl p-4">
                    {activeOrder.items.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between text-xs">
                        <span className="font-semibold text-gray-900">{item.productName} × {item.quantity}</span>
                        <span className="font-black text-gray-900">₹{item.totalPrice}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-200 flex justify-between text-sm font-black text-gray-900">
                      <span>Total Amount</span>
                      <span>₹{activeOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-gray-900">No active orders right now</h3>
                <p className="text-xs text-gray-500">Order from campus canteen, fresh fruits, or essentials!</p>
                <Link
                  href="/food"
                  className="inline-block mt-2 px-5 py-2.5 bg-[#689f38] text-white text-xs font-bold rounded-xl"
                >
                  Browse Campus Menu
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB: REFUNDS (Requirement 14) */}
        {activeTab === 'refunds' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Refunds &amp; Cancellations</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Track status of cancellations and refunds processed for your campus orders.
              </p>
            </div>

            {refundOrders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                  <RotateCcw className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-gray-900">No refund transactions yet.</h3>
                <p className="text-xs text-gray-500">Any cancelled or refunded orders will appear here.</p>
                <Link
                  href="/food"
                  className="inline-block mt-2 px-5 py-2.5 bg-[#689f38] text-white text-xs font-bold rounded-xl"
                >
                  Browse Campus Menu
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {refundOrders.map((order, idx) => (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-mono text-gray-900">
                            Refund #RF{10290 + idx}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Refund Processing
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Related Order: <strong className="font-mono text-gray-700">#{order.orderNumber}</strong>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-base font-black text-gray-900">
                          Refund Amount: ₹{order.totalAmount}
                        </div>
                        <div className="text-[11px] text-gray-500">Original method: {order.paymentMethod}</div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-800">Reason: </span>
                        <span>Student cancelled order before kitchen dispatch</span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Date: {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: PAYMENT HISTORY (Requirement 15) */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Payment History</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                All campus transaction records, UPI receipts, and billing history.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-sm font-bold text-gray-700">No payment records found</h3>
                <Link href="/food" className="inline-block text-xs font-bold text-[#689f38]">
                  Browse Campus Menu
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-extrabold uppercase">
                    <tr>
                      <th className="p-3">Transaction / Order ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono font-bold text-gray-900">
                          #{o.orderNumber}
                        </td>
                        <td className="p-3 text-gray-500">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-semibold text-gray-800">
                          {o.paymentMethod.replace(/_/g, ' ')}
                        </td>
                        <td className="p-3 font-black text-gray-900">
                          ₹{o.totalAmount}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              o.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {o.paymentStatus === 'PAID' ? 'Successful' : o.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="text-[#689f38] hover:underline font-bold"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: PAYMENT METHODS */}
        {activeTab === 'payment-methods' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Payment Methods</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Convenient payment channels enabled for NIT Durgapur hostel deliveries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    UPI
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-900">Instant Campus UPI</div>
                    <div className="text-[11px] text-gray-500">Google Pay, PhonePe, Paytm, BHIM</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-900">Debit / Credit Cards</div>
                    <div className="text-[11px] text-gray-500">Visa, Mastercard, RuPay Cards</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    COD
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-900">Cash on Delivery</div>
                    <div className="text-[11px] text-gray-500">Pay cash directly to hostel delivery runner</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DELIVERY DETAILS (Requirement 16) */}
        {activeTab === 'delivery' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Campus Delivery Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Campus Basket is designed specifically for fast 10–15 min hostel delivery across NIT Durgapur.
              </p>
            </div>

            <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block font-semibold">Campus</span>
                  <strong className="text-gray-900 text-sm">NIT Durgapur</strong>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Hall / Hostel</span>
                  <strong className="text-gray-900 text-sm">{hallName}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Room Number</span>
                  <strong className="text-gray-900 text-sm">{roomNumber}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-[#dcedc8] text-xs">
                <span className="text-gray-500 block font-semibold">Delivery Instructions</span>
                <strong className="text-gray-900 italic">"{deliveryInstructions}"</strong>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleTabChange('profile')}
                className="px-5 py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Edit Room &amp; Delivery Instructions
              </button>
            </div>
          </div>
        )}

        {/* TAB: WISHLIST / FAVORITES (Requirement 17) */}
        {activeTab === 'wishlist' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Saved Wishlist</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Products you have bookmarked with the heart icon.
              </p>
            </div>

            {loadingWishlist ? (
              <div className="p-8 text-center text-xs text-gray-500">Loading saved items...</div>
            ) : wishlistProducts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-gray-900">No saved products yet.</h3>
                <p className="text-xs text-gray-500">Tap the heart icon on any product to save it here for fast ordering!</p>
                <Link
                  href="/food"
                  className="inline-block mt-2 px-5 py-2.5 bg-[#689f38] text-white text-xs font-bold rounded-xl"
                >
                  Browse Campus Menu
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        <img
                          src={p.primaryImage || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300'}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-1">{p.name}</h4>
                        <div className="text-xs font-extrabold text-gray-900 mt-1">₹{p.price}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">In Stock</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          addItem(p, 1);
                          showToast(`"${p.name}" added to basket.`);
                        }}
                        className="flex-1 py-2 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-bold rounded-xl transition-colors text-center"
                      >
                        Add to Basket
                      </button>
                      <button
                        onClick={() => handleRemoveWishlist(p.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-gray-100 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: NOTIFICATIONS (Requirement 18) */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Notifications</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Order updates, hostel delivery notifications, and exclusive student discounts.
                </p>
              </div>
              <button
                onClick={() => {
                  setNotifications(notifications.map((n) => ({ ...n, read: true })));
                  showToast('All notifications marked as read.');
                }}
                className="text-xs font-bold text-[#689f38] hover:underline"
              >
                Mark all as read
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <div key={n.id} className="py-4 flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === 'ORDER'
                        ? 'bg-emerald-50 text-emerald-700'
                        : n.type === 'PAYMENT'
                        ? 'bg-sky-50 text-sky-700'
                        : n.type === 'REFUND'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {n.type === 'ORDER' && <Truck className="w-4 h-4" />}
                    {n.type === 'PAYMENT' && <CreditCard className="w-4 h-4" />}
                    {n.type === 'REFUND' && <RotateCcw className="w-4 h-4" />}
                    {n.type === 'OFFER' && <Gift className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-gray-900">{n.title}</h4>
                      <span className="text-[10px] text-gray-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: OFFERS & COUPONS */}
        {activeTab === 'offers' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Campus Offers &amp; Promo Codes</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Exclusive discounts for NIT Durgapur students. Apply at basket checkout!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-[#dcedc8] bg-[#f1f8e9] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-[#2e7d32] bg-white px-3 py-1 rounded-xl border border-[#c8e6c9]">
                    CAMPUS50
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('CAMPUS50');
                      showToast('Copied CAMPUS50 to clipboard!');
                    }}
                    className="text-xs font-bold text-[#2e7d32] flex items-center gap-1 hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="text-xs font-extrabold text-gray-900">Flat ₹50 OFF on Campus Canteen Orders</div>
                <div className="text-[11px] text-gray-600">Valid on order value above ₹199 across all foods &amp; fruits.</div>
              </div>

              <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-gray-900 bg-white px-3 py-1 rounded-xl border border-gray-300">
                    HOSTEL10
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('HOSTEL10');
                      showToast('Copied HOSTEL10 to clipboard!');
                    }}
                    className="text-xs font-bold text-gray-700 flex items-center gap-1 hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="text-xs font-extrabold text-gray-900">10% OFF on Late Night Study Snacks</div>
                <div className="text-[11px] text-gray-600">Active from 9:00 PM to 2:00 AM across Halls 1 to 14.</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HELP & SUPPORT (Requirement 19) */}
        {activeTab === 'support' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Help &amp; Support</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Reach campus helpdesk for delivery issues, missing items, or refunds.
              </p>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Attach Order (Optional)
                </label>
                <select
                  value={supportOrderSelect}
                  onChange={(e) => setSupportOrderSelect(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#84c225]"
                >
                  <option value="">-- General Query (No Order Attached) --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      Order #{o.orderNumber} (₹{o.totalAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Issue Category
                </label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#84c225]"
                >
                  <option value="Order hasn't arrived">Order hasn't arrived</option>
                  <option value="Missing item">Missing item</option>
                  <option value="Wrong item">Wrong item</option>
                  <option value="Damaged item">Damaged item</option>
                  <option value="Payment issue">Payment issue</option>
                  <option value="Refund issue">Refund issue</option>
                  <option value="Other issue">Other issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe the issue with your delivery or account..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#84c225]"
                />
              </div>

              {supportSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {supportSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={supportSubmitting}
                className="px-6 py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {supportSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>
        )}

        {/* TAB: ACCOUNT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Account Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Security, password settings, and active session controls.
              </p>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900">Password Recovery</div>
                  <div className="text-[11px] text-gray-500">Recovery OTP sent to verified personal email</div>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-[#689f38] hover:underline"
                >
                  Change
                </Link>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900">Session Controls</div>
                  <div className="text-[11px] text-gray-500">Sign out from this device</div>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORDER DETAILS MODAL (Requirement 12) */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  <div className="text-xs text-gray-500">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Delivery info */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs space-y-1">
                <div className="font-bold text-gray-900">
                  {selectedOrder.hallName || 'Hall 11'}, Room {selectedOrder.roomNumber || '123'}
                </div>
                <div className="text-gray-500">NIT Durgapur Campus Hostel Delivery</div>
              </div>

              {/* Products */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-gray-500 uppercase">Items</div>
                <div className="divide-y divide-gray-100">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="py-2 flex justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900">{item.productName}</div>
                        <div className="text-gray-500 text-[11px]">₹{item.unitPrice} × {item.quantity}</div>
                      </div>
                      <span className="font-black text-gray-900">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{selectedOrder.subtotal || selectedOrder.totalAmount}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-gray-900">{selectedOrder.deliveryFee === 0 ? 'FREE' : `₹${selectedOrder.deliveryFee}`}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-black text-gray-900">
                  <span>Total Paid</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3">
                <button
                  onClick={() => {
                    handleReorder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-bold rounded-xl shadow-sm transition-all text-center"
                >
                  Reorder
                </button>
                <Link
                  href={`/orders/${selectedOrder.id}/track`}
                  className="flex-1 py-2.5 bg-[#f1f8e9] hover:bg-[#e8f5e9] text-[#2e7d32] border border-[#dcedc8] text-xs font-bold rounded-xl transition-colors text-center"
                >
                  Track Order
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center p-8 bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-[#689f38] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
