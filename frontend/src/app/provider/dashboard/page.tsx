'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  Store,
  Truck,
  Shirt,
  ShoppingBag,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  Upload,
  Layers,
  Boxes,
  Lock,
  MapPin,
  Camera,
  KeyRound,
  RefreshCw,
  LogOut,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  CircleDollarSign,
  PackageCheck,
  PackageX,
  ChefHat,
  Bike
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function ProviderDashboardPage() {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'LIVE_OPERATIONS' | 'CUSTOMERS' | 'PRODUCTS' | 'DELIVERY' | 'FINANCE' | 'LAUNDRY'
  >('OVERVIEW');

  // Global Date Filter
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  // Analytics API Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Raw Data for Products & Orders
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Product Filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');

  // Order Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Customer Filter
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSortBy, setCustomerSortBy] = useState<'spent' | 'orders' | 'recent'>('spent');

  // Monthly Sales Metric Toggle
  const [monthlyMetric, setMonthlyMetric] = useState<'sales' | 'orders' | 'itemsSold'>('sales');

  // Product Chart Selector & Sorter
  const [productChartLimit, setProductChartLimit] = useState<number>(5);
  const [productChartMetric, setProductChartMetric] = useState<'revenue' | 'unitsSold' | 'ordersCount'>('revenue');

  // Detail Modals
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [monthlyReportModalOpen, setMonthlyReportModalOpen] = useState(false);
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>('August 2026');

  // Add Product Modal
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '20',
    unit: 'piece',
    lowStockThreshold: '5',
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [addProductLoading, setAddProductLoading] = useState(false);
  const [addProductError, setAddProductError] = useState<string | null>(null);

  // Edit Product Modal
  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editProductForm, setEditProductForm] = useState({
    price: '',
    discountPrice: '',
    stock: '',
    lowStockThreshold: '',
    availability: true,
  });
  const [editProductLoading, setEditProductLoading] = useState(false);

  // Laundry Jobs State (Doorstep dual-OTP feature preserved)
  const [laundryJobs, setLaundryJobs] = useState<any[]>([]);
  const [otpModal, setOtpModal] = useState<{
    isOpen: boolean;
    jobId: string;
    type: 'PICKUP' | 'DELIVERY';
    orderNumber: string;
  } | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [submittingOtp, setSubmittingOtp] = useState(false);

  // Toast / notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth Guard
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (role !== 'SERVICE_PROVIDER' && role !== 'ADMIN'))) {
      window.location.href = '/login?redirect=/provider/dashboard';
    }
  }, [isAuthenticated, role, isLoading]);

  // Fetch full analytics
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      let query = `/api/provider/analytics?timeframe=${timeframe}`;
      if (timeframe === 'custom' && customStartDate && customEndDate) {
        query += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      const res = await apiRequest(query);
      if (res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.warn('Analytics fetch error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await apiRequest('/api/provider/products');
      if (res.success && res.products) {
        setProducts(res.products);
      }
    } catch (err) {
      console.warn('Products fetch error:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await apiRequest('/api/provider/orders');
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadLaundryJobs = async () => {
    try {
      const res = await apiRequest('/api/provider/dashboard');
      if (res.success && res.laundryJobs) {
        setLaundryJobs(res.laundryJobs);
      }
    } catch (err) {}
  };

  const refreshAll = () => {
    loadAnalytics();
    loadProducts();
    loadOrders();
    loadLaundryJobs();
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    }
  }, [isAuthenticated, timeframe]);

  // Order status progression handler
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await apiRequest(`/api/provider/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        showToast(`Order status updated to ${status.replace(/_/g, ' ')}`);
        refreshAll();
      } else {
        alert(res.message || 'Failed to update order status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating order status');
    }
  };

  // Add Product Submit (Preserves existing pending approval workflow)
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddProductError(null);
    setAddProductLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      if (productForm.discountPrice) formData.append('discountPrice', productForm.discountPrice);
      formData.append('stock', productForm.stock);
      formData.append('unit', productForm.unit);
      formData.append('lowStockThreshold', productForm.lowStockThreshold);

      // Determine category ID matching provider's assigned category
      const catId =
        analytics?.provider?.serviceCategory?.toLowerCase().includes('fruit')
          ? 'cat_fruits'
          : analytics?.provider?.serviceCategory?.toLowerCase().includes('laundry')
          ? 'cat_laundry'
          : analytics?.provider?.serviceCategory?.toLowerCase().includes('essential')
          ? 'cat_essentials'
          : 'cat_food';

      formData.append('categoryId', catId);

      if (productImageFile) {
        formData.append('image', productImageFile);
      }

      const token = localStorage.getItem('nit_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/provider/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setAddProductModalOpen(false);
        setProductForm({
          name: '',
          description: '',
          price: '',
          discountPrice: '',
          stock: '20',
          unit: 'piece',
          lowStockThreshold: '5',
        });
        setProductImageFile(null);
        setImagePreview(null);
        showToast('Product submitted successfully for Admin approval.');
        refreshAll();
      } else {
        setAddProductError(data.message || 'Product creation failed');
      }
    } catch (err: any) {
      setAddProductError(err.message || 'Error submitting product');
    } finally {
      setAddProductLoading(false);
    }
  };

  // Edit Product Submit
  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditProductLoading(true);

    try {
      const res = await apiRequest(`/api/provider/products/${editingProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          price: parseFloat(editProductForm.price),
          discountPrice: editProductForm.discountPrice ? parseFloat(editProductForm.discountPrice) : null,
          stock: parseInt(editProductForm.stock, 10),
          lowStockThreshold: parseInt(editProductForm.lowStockThreshold, 10),
          availability: editProductForm.availability,
        }),
      });

      if (res.success) {
        setEditProductModalOpen(false);
        showToast('Product updated successfully.');
        refreshAll();
      } else {
        alert(res.message || 'Update failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating product');
    } finally {
      setEditProductLoading(false);
    }
  };

  // CSV Export Trigger
  const handleExportCsv = (type: 'orders' | 'customers' | 'products') => {
    const token = localStorage.getItem('nit_token');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const downloadUrl = `${backendUrl}/api/provider/export?type=${type}&token=${token}`;
    window.open(downloadUrl, '_blank');
  };

  // Colors for charts
  const CHART_COLORS = ['#059669', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  // Status badge style helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
      case 'PREPARING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'READY':
      case 'READY_FOR_PICKUP':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category?.name || '').toLowerCase().includes(productSearch.toLowerCase());
      if (!matchSearch) return false;

      if (productStatusFilter === 'APPROVED') return p.approvalStatus === 'APPROVED';
      if (productStatusFilter === 'PENDING') return p.approvalStatus === 'PENDING';
      if (productStatusFilter === 'LOW_STOCK') return p.stock > 0 && p.stock <= (p.lowStockThreshold || 5);
      if (productStatusFilter === 'OUT_OF_STOCK') return p.stock <= 0;
      return true;
    });
  }, [products, productSearch, productStatusFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.student?.fullName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.roomNumber || '').toLowerCase().includes(orderSearch.toLowerCase());
      if (!matchSearch) return false;

      if (orderStatusFilter !== 'ALL') {
        if (orderStatusFilter === 'ACTIVE') {
          return ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status);
        }
        return o.status === orderStatusFilter;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Filtered & Sorted Customer List
  const processedCustomers = useMemo(() => {
    const list = analytics?.customerAnalytics?.customerList || [];
    const filtered = list.filter(
      (c: any) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.hall.toLowerCase().includes(customerSearch.toLowerCase())
    );

    return filtered.sort((a: any, b: any) => {
      if (customerSortBy === 'spent') return b.netSales - a.netSales;
      if (customerSortBy === 'orders') return b.totalOrders - a.totalOrders;
      return new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime();
    });
  }, [analytics, customerSearch, customerSortBy]);

  const kpis = analytics?.kpiCards;
  const isLaundryVendor =
    analytics?.provider?.serviceCategory === 'Express Laundry' ||
    analytics?.provider?.serviceCategory === 'LAUNDRY' ||
    analytics?.provider?.serviceCategory === 'ALL';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-emerald-500 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: SERVICE PROVIDER CONSOLE */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Provider Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Service Provider Console
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  ● Active
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {analytics?.provider?.fullName || (user as any)?.fullName || (user as any)?.provider?.fullName || 'Campus Partner Hub'}
                </h1>
                <span className="text-xs text-slate-400">
                  ID: <span className="text-slate-200 font-mono font-medium">{analytics?.provider?.username || 'SP_VENDOR'}</span>
                </span>
                <span className="text-xs text-slate-400">
                  Category: <span className="text-emerald-300 font-medium">{analytics?.provider?.serviceCategory || 'All Campus Stores'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions: Global Date Filter, Export, Refresh, Logout */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Global Date Filter Dropdown */}
            <div className="relative">
              <select
                value={timeframe}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomDateOpen(true);
                  } else {
                    setIsCustomDateOpen(false);
                    setTimeframe(e.target.value);
                  }
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer hover:bg-slate-700/80 transition-colors"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="90d">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">This Year</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {/* Monthly Report PDF Generator */}
            <button
              onClick={() => setMonthlyReportModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
              title="Download Monthly Business Analytics PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              Download Monthly Report
            </button>

            {/* CSV Export Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Export Data
              </button>
              <div className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-50 overflow-hidden">
                <button
                  onClick={() => handleExportCsv('orders')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  Orders CSV
                </button>
                <button
                  onClick={() => handleExportCsv('customers')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Customers CSV
                </button>
                <button
                  onClick={() => handleExportCsv('products')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                >
                  <Boxes className="w-3.5 h-3.5 text-amber-400" />
                  Products CSV
                </button>
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={refreshAll}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Business Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Sign Out */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker Sub-bar */}
        {isCustomDateOpen && (
          <div className="bg-slate-800/90 border-t border-slate-700/60 px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs">
              <span className="text-slate-300 font-medium">Custom Range:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
              />
              <button
                onClick={() => {
                  setTimeframe('custom');
                  loadAnalytics();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1 rounded"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Console Navigation Tabs */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'OVERVIEW'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Overview & Analytics
            </button>
            <button
              onClick={() => setActiveTab('LIVE_OPERATIONS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'LIVE_OPERATIONS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Live Operations & Orders
              {kpis?.activeOrders?.value > 0 && (
                <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {kpis?.activeOrders?.value}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Customer Analytics & Top Buyers
            </button>
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'PRODUCTS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              Products & Catalog
            </button>
            <button
              onClick={() => setActiveTab('DELIVERY')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'DELIVERY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5 text-teal-400" />
              Delivery Performance
            </button>
            <button
              onClick={() => setActiveTab('FINANCE')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'FINANCE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CircleDollarSign className="w-3.5 h-3.5 text-yellow-400" />
              Finance & Settlements
            </button>
            {isLaundryVendor && (
              <button
                onClick={() => setActiveTab('LAUNDRY')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'LAUNDRY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Shirt className="w-3.5 h-3.5 text-indigo-400" />
                Doorstep Laundry OTPs
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* =======================================================
            SECTION 2: 10 TOP KPI CARDS
            ======================================================= */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Enterprise Key Performance Indicators (KPIs)
            </h2>
            <span className="text-xs text-slate-500 font-medium">Real-time aggregate calculations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Today's Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Today's Sales</span>
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
                ₹{Number(kpis?.todaySales?.value || 0).toLocaleString('en-IN')}
              </div>
              <div className="mt-1.5 flex items-center text-xs">
                {kpis?.todaySales?.trend === 'up' ? (
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis?.todaySales?.percentChange}%
                  </span>
                ) : kpis?.todaySales?.trend === 'down' ? (
                  <span className="text-rose-600 font-semibold flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5" /> -{kpis?.todaySales?.percentChange}%
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">0%</span>
                )}
                <span className="text-slate-400 ml-1 text-[11px]">{kpis?.todaySales?.subtitle || 'vs yesterday'}</span>
              </div>
            </div>

            {/* 2. This Week's Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>This Week's Sales</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
                ₹{Number(kpis?.thisWeekSales?.value || 0).toLocaleString('en-IN')}
              </div>
              <div className="mt-1.5 flex items-center text-xs">
                {kpis?.thisWeekSales?.trend === 'up' ? (
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis?.thisWeekSales?.percentChange}%
                  </span>
                ) : kpis?.thisWeekSales?.trend === 'down' ? (
                  <span className="text-rose-600 font-semibold flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5" /> -{kpis?.thisWeekSales?.percentChange}%
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">0%</span>
                )}
                <span className="text-slate-400 ml-1 text-[11px]">{kpis?.thisWeekSales?.subtitle || 'vs last week'}</span>
              </div>
            </div>

            {/* 3. This Month's Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>This Month's Sales</span>
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
                ₹{Number(kpis?.thisMonthSales?.value || 0).toLocaleString('en-IN')}
              </div>
              <div className="mt-1.5 flex items-center text-xs">
                {kpis?.thisMonthSales?.trend === 'up' ? (
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis?.thisMonthSales?.percentChange}%
                  </span>
                ) : kpis?.thisMonthSales?.trend === 'down' ? (
                  <span className="text-rose-600 font-semibold flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5" /> -{kpis?.thisMonthSales?.percentChange}%
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">0%</span>
                )}
                <span className="text-slate-400 ml-1 text-[11px]">{kpis?.thisMonthSales?.subtitle || 'vs last month'}</span>
              </div>
            </div>

            {/* 4. Total Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Total Sales</span>
                <Award className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-emerald-700 tracking-tight">
                ₹{Number(kpis?.totalSales?.value || 0).toLocaleString('en-IN')}
              </div>
              <div className="mt-1.5 text-xs text-slate-400 truncate">
                {kpis?.totalSales?.subtitle || 'All-time gross volume'}
              </div>
            </div>

            {/* 5. Total Orders */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Total Orders</span>
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
                {kpis?.totalOrders?.value || 0}
              </div>
              <div className="mt-1.5 flex items-center text-xs">
                {kpis?.totalOrders?.trend === 'up' ? (
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis?.totalOrders?.percentChange}%
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">--</span>
                )}
                <span className="text-slate-400 ml-1 text-[11px]">{kpis?.totalOrders?.subtitle || 'vs prior 7 days'}</span>
              </div>
            </div>

            {/* 6. Completed Orders */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Completed Orders</span>
                <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
                {kpis?.completedOrders?.value || 0}
              </div>
              <div className="mt-1.5 text-xs text-emerald-700 font-medium">
                {kpis?.completedOrders?.subtitle || '100% fulfillment rate'}
              </div>
            </div>

            {/* 7. Active Orders */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Active Orders</span>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-amber-600 tracking-tight">
                {kpis?.activeOrders?.value || 0}
              </div>
              <div className="mt-1.5 text-xs text-slate-500 truncate">
                {kpis?.activeOrders?.subtitle || '0 currently being prepared'}
              </div>
            </div>

            {/* 8. Total Products */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Total Products</span>
                <Boxes className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
                {kpis?.totalProducts?.value || 0}
              </div>
              <div className="mt-1.5 text-xs text-slate-400">
                {kpis?.totalProducts?.subtitle || 'Catalog items'}
              </div>
            </div>

            {/* 9. Available Products */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Available Products</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-emerald-700 tracking-tight">
                {kpis?.availableProducts?.value || 0}
              </div>
              <div className="mt-1.5 text-xs text-emerald-600 font-medium">
                {kpis?.availableProducts?.subtitle || 'Live & in stock'}
              </div>
            </div>

            {/* 10. Out-of-Stock Products */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Out of Stock</span>
                <PackageX className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-rose-600 tracking-tight">
                {kpis?.outOfStockProducts?.value || 0}
              </div>
              <div className="mt-1.5 text-xs text-rose-500 font-medium">
                {kpis?.outOfStockProducts?.subtitle || 'Needs restocking'}
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            SECTION 20: BUSINESS INSIGHTS CHIPS
            ======================================================= */}
        {analytics?.businessInsights && analytics.businessInsights.length > 0 && (
          <section className="bg-gradient-to-r from-emerald-900/90 to-slate-900 rounded-xl p-4 text-white shadow-sm border border-emerald-800/40">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Automated Business Intelligence & Insights
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {analytics.businessInsights.map((insight: string, idx: number) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 flex items-start gap-2"
                >
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =======================================================
            TAB 1: OVERVIEW & POWER BI STYLE CHARTS
            ======================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Chart Grid: Sales Trends & Monthly Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Power BI Sales Trend Line / Area Chart */}
              <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Sales Analytics & Trend Curve
                    </h3>
                    <p className="text-xs text-slate-500">Interactive revenue, orders & items sold progression</p>
                  </div>

                  {/* Range Selector */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
                    {['7d', '30d', '90d', '6m', '1y'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setTimeframe(opt)}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          timeframe === opt
                            ? 'bg-white text-emerald-700 font-bold shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {analytics?.salesTrends && analytics.salesTrends.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.salesTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `₹${v}`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1">
                                  <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">{label}</div>
                                  <div className="text-emerald-400 font-semibold">Sales: ₹{data.sales.toLocaleString('en-IN')}</div>
                                  <div className="text-slate-300">Orders: {data.orders}</div>
                                  <div className="text-slate-300">Items Sold: {data.itemsSold}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="sales" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <BarChart3 className="w-8 h-8 mb-2 text-slate-300" />
                    <span>No sales data recorded for this timeframe.</span>
                    <span className="text-[11px] text-slate-400">Sales curve will dynamically render once students order.</span>
                  </div>
                )}
              </div>

              {/* Order Status Distribution Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    Order Status Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Fulfillment stage proportions</p>
                </div>

                <div className="h-56 w-full flex items-center justify-center">
                  {analytics?.orderPerformance?.totalOrders > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Delivered', value: analytics.orderPerformance.statusCounts.DELIVERED },
                            { name: 'Preparing', value: analytics.orderPerformance.statusCounts.PREPARING },
                            { name: 'Out Delivery', value: analytics.orderPerformance.statusCounts.OUT_FOR_DELIVERY },
                            { name: 'Ready Pickup', value: analytics.orderPerformance.statusCounts.READY_FOR_PICKUP },
                            { name: 'Pending', value: analytics.orderPerformance.statusCounts.PENDING },
                            { name: 'Cancelled', value: analytics.orderPerformance.statusCounts.CANCELLED },
                          ].filter((i) => i.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {CHART_COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-slate-400 text-xs">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No order statistics recorded yet.
                    </div>
                  )}
                </div>

                {/* Status Percentages Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Delivered
                    </span>
                    <span className="font-bold text-slate-800">
                      {analytics?.orderPerformance?.statusPercentages?.DELIVERED || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Preparing
                    </span>
                    <span className="font-bold text-slate-800">
                      {analytics?.orderPerformance?.statusPercentages?.PREPARING || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Out Delivery
                    </span>
                    <span className="font-bold text-slate-800">
                      {analytics?.orderPerformance?.statusPercentages?.OUT_FOR_DELIVERY || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Cancelled
                    </span>
                    <span className="font-bold text-slate-800">
                      {analytics?.orderPerformance?.statusPercentages?.CANCELLED || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Sales Chart (Jan - Dec) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    12-Month Performance Comparison
                  </h3>
                  <p className="text-xs text-slate-500">Annual monthly breakdown (Jan - Dec)</p>
                </div>

                {/* Metric Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setMonthlyMetric('sales')}
                    className={`px-3 py-1 rounded transition-colors ${
                      monthlyMetric === 'sales'
                        ? 'bg-white text-emerald-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sales (₹)
                  </button>
                  <button
                    onClick={() => setMonthlyMetric('orders')}
                    className={`px-3 py-1 rounded transition-colors ${
                      monthlyMetric === 'orders'
                        ? 'bg-white text-emerald-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Total Orders
                  </button>
                  <button
                    onClick={() => setMonthlyMetric('itemsSold')}
                    className={`px-3 py-1 rounded transition-colors ${
                      monthlyMetric === 'itemsSold'
                        ? 'bg-white text-emerald-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Items Sold
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.monthlySales || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (monthlyMetric === 'sales' ? `₹${v}` : v)}
                    />
                    <Tooltip
                      formatter={(val: any) => [
                        monthlyMetric === 'sales' ? `₹${Number(val).toLocaleString('en-IN')}` : val,
                        monthlyMetric === 'sales' ? 'Sales Revenue' : monthlyMetric === 'orders' ? 'Orders Placed' : 'Items Sold',
                      ]}
                    />
                    <Bar
                      dataKey={monthlyMetric}
                      fill={monthlyMetric === 'sales' ? '#059669' : monthlyMetric === 'orders' ? '#3b82f6' : '#f59e0b'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inventory Alerts & Live Orders Peek */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inventory Alerts Section */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Inventory & Stock Action Center
                </h3>

                <div className="space-y-2.5">
                  {analytics?.productPerformance?.lowStock?.length === 0 &&
                  analytics?.productPerformance?.outOfStock?.length === 0 &&
                  analytics?.productPerformance?.pendingApproval?.length === 0 ? (
                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Catalog healthy: all approved products are well-stocked.
                    </div>
                  ) : null}

                  {analytics?.productPerformance?.outOfStock?.map((p: any) => (
                    <div key={p.id} className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-rose-800">{p.name}</span>
                        <div className="text-[11px] text-rose-600">Completely Out of Stock (0 remaining)</div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setEditProductForm({
                            price: String(p.price || ''),
                            discountPrice: '',
                            stock: '25',
                            lowStockThreshold: String(p.lowStockThreshold || '5'),
                            availability: true,
                          });
                          setEditProductModalOpen(true);
                        }}
                        className="bg-rose-600 text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-rose-700"
                      >
                        Restock
                      </button>
                    </div>
                  ))}

                  {analytics?.productPerformance?.lowStock?.map((p: any) => (
                    <div key={p.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-amber-900">⚠ {p.name}</span>
                        <div className="text-[11px] text-amber-700">Only {p.currentStock} remaining in stock</div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setEditProductForm({
                            price: String(p.price || ''),
                            discountPrice: '',
                            stock: String(p.currentStock + 20),
                            lowStockThreshold: String(p.lowStockThreshold || '5'),
                            availability: true,
                          });
                          setEditProductModalOpen(true);
                        }}
                        className="bg-amber-600 text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-amber-700"
                      >
                        Add Stock
                      </button>
                    </div>
                  ))}

                  {analytics?.productPerformance?.pendingApproval?.map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{p.name}</span>
                        <div className="text-[11px] text-slate-500">Submitted to Admin • Awaiting Verification</div>
                      </div>
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Pipeline Peek */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Active Orders Pipeline
                  </h3>
                  <button
                    onClick={() => setActiveTab('LIVE_OPERATIONS')}
                    className="text-xs text-emerald-700 font-semibold hover:underline"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {analytics?.liveOperations && analytics.liveOperations.length > 0 ? (
                    analytics.liveOperations.slice(0, 4).map((ord: any) => (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">#{ord.orderNumber}</div>
                          <div className="text-[11px] text-slate-600 truncate max-w-xs">{ord.itemsSummary}</div>
                          <div className="text-[11px] text-slate-400">
                            Drop: {ord.customerName} • {ord.hallName} {ord.roomNumber}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-700">₹{ord.totalAmount}</div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 ${getStatusBadge(ord.status)}`}>
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      <PackageCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      All orders fulfilled! No pending or active prep tasks.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 2: LIVE OPERATIONS & CUSTOMER ORDERS
            ======================================================= */}
        {activeTab === 'LIVE_OPERATIONS' && (
          <div className="space-y-6">
            {/* Real-Time Queue Header */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-emerald-600" />
                  Live Order Dispatch & Operations Board
                </h3>
                <p className="text-xs text-slate-500">Fulfill incoming orders and advance preparation stages</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Order # or Room..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-1.5 font-medium text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Workflows Only</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Hostel / Room</th>
                      <th className="py-3 px-4">Items Ordered</th>
                      <th className="py-3 px-4 text-right">Total (₹)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Assigned Runner</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((ord: any) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            #{ord.orderNumber}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            {ord.student?.fullName || 'Campus Student'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {ord.student?.hallName || ord.hallName || 'Hostel'} • {ord.student?.roomNumber || ord.roomNumber || ''}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                            {ord.items && ord.items.length > 0
                              ? ord.items.map((i: any) => `${i.productName} (x${i.quantity || 1})`).join(', ')
                              : 'Products'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-right">
                            ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(ord.status)}`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-600">
                            {ord.deliveryBoy?.fullName ? (
                              <span className="flex items-center justify-center gap-1 text-xs text-teal-700 font-medium">
                                <Bike className="w-3 h-3" />
                                {ord.deliveryBoy.fullName}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {/* Workflow buttons */}
                            {['CONFIRMED', 'ACCEPTED'].includes(ord.status) && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                                className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded font-semibold text-[11px]"
                              >
                                Mark Preparing
                              </button>
                            )}
                            {ord.status === 'PREPARING' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'READY_FOR_PICKUP')}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded font-semibold text-[11px]"
                              >
                                Ready for Pickup
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200"
                              title="Inspect Full Timeline & Items"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No customer orders matching selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 3: CUSTOMER ANALYTICS & "WHO IS BUYING FROM ME?"
            ======================================================= */}
        {activeTab === 'CUSTOMERS' && (
          <div className="space-y-6">
            {/* Customer KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-medium">Total Customers</span>
                <div className="mt-1.5 text-xl font-bold text-slate-900">
                  {analytics?.customerAnalytics?.totalCustomers || 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-medium">Active Customers</span>
                <div className="mt-1.5 text-xl font-bold text-emerald-700">
                  {analytics?.customerAnalytics?.activeCustomers || 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-medium">Returning Customers</span>
                <div className="mt-1.5 text-xl font-bold text-blue-700">
                  {analytics?.customerAnalytics?.returningCustomers || 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-medium">Repeat Purchase Rate</span>
                <div className="mt-1.5 text-xl font-bold text-purple-700">
                  {analytics?.customerAnalytics?.repeatPurchaseRate || 0}%
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1 lg:col-span-2">
                <span className="text-slate-500 text-xs font-medium">Average Order Value (AOV)</span>
                <div className="mt-1.5 text-xl font-bold text-slate-900">
                  ₹{Number(analytics?.customerAnalytics?.averageOrderValue || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* TOP CUSTOMERS LEADERBOARD: "WHO IS BUYING FROM ME?" */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Top Customers Leaderboard ("Who is buying from me?")
                  </h3>
                  <p className="text-xs text-slate-500">Ranked by cumulative spend and repeat orders</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700">Top Revenue Champions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics?.customerAnalytics?.topCustomers && analytics.customerAnalytics.topCustomers.length > 0 ? (
                  analytics.customerAnalytics.topCustomers.slice(0, 4).map((c: any) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            c.rank === 1
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : c.rank === 2
                              ? 'bg-slate-200 text-slate-800 border border-slate-300'
                              : 'bg-orange-100 text-orange-900 border border-orange-300'
                          }`}
                        >
                          #{c.rank} Customer
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{c.totalOrders} orders</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">{c.hall} • {c.room}</div>
                      <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Total Spent:</span>
                        <span className="text-base font-bold text-emerald-700">₹{c.totalSpent.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-6 text-slate-400 text-xs">
                    No customer leaderboard data yet.
                  </div>
                )}
              </div>
            </div>

            {/* CUSTOMER-WISE REVENUE TABLE */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-bold text-sm text-slate-900">Customer-Wise Sales Directory</h4>
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search customer by name..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <select
                    value={customerSortBy}
                    onChange={(e: any) => setCustomerSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1 text-slate-700"
                  >
                    <option value="spent">Sort: Total Spend</option>
                    <option value="orders">Sort: Order Count</option>
                    <option value="recent">Sort: Most Recent</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Hostel / Room</th>
                      <th className="py-3 px-4 text-center">Orders</th>
                      <th className="py-3 px-4 text-center">Items Purchased</th>
                      <th className="py-3 px-4 text-right">Gross Sales</th>
                      <th className="py-3 px-4 text-right">Discount</th>
                      <th className="py-3 px-4 text-right">Net Sales</th>
                      <th className="py-3 px-4 text-right">Average Order</th>
                      <th className="py-3 px-4 text-center">Last Purchase</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedCustomers.length > 0 ? (
                      processedCustomers.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                          <td className="py-3 px-4 text-slate-500">{c.hall} • {c.room}</td>
                          <td className="py-3 px-4 text-center font-medium">{c.totalOrders}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{c.itemsPurchased}</td>
                          <td className="py-3 px-4 text-right text-slate-600">₹{c.grossSales.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right text-rose-500">-₹{c.discount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{c.netSales.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right font-medium">₹{c.averageOrderValue.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-center text-slate-500">{c.lastPurchase}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                c.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-slate-400">
                          No customer activity recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 4: PRODUCTS & CATALOG MANAGEMENT
            ======================================================= */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-6">
            {/* Top Bar: Add Product & Search */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-emerald-600" />
                  Product Catalog & Stock Management
                </h3>
                <p className="text-xs text-slate-500">Products are approved by Admin before student storefront display</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-1.5 font-medium text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="PENDING">Pending Admin Review</option>
                  <option value="LOW_STOCK">Low Stock Alert</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
                <button
                  onClick={() => setAddProductModalOpen(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Product
                </button>
              </div>
            </div>

            {/* Product Performance Bar Chart */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Product Sales & Revenue Ranking</h4>
                  <p className="text-xs text-slate-500">Compare top performing menu & catalog items</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <select
                    value={productChartLimit}
                    onChange={(e) => setProductChartLimit(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700"
                  >
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                  </select>
                  <select
                    value={productChartMetric}
                    onChange={(e: any) => setProductChartMetric(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700"
                  >
                    <option value="revenue">Sort by Revenue (₹)</option>
                    <option value="unitsSold">Sort by Units Sold</option>
                    <option value="ordersCount">Sort by Orders</option>
                  </select>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(analytics?.productPerformance?.products || [])
                      .sort((a: any, b: any) => b[productChartMetric] - a[productChartMetric])
                      .slice(0, productChartLimit)}
                    margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: any) => [
                        productChartMetric === 'revenue' ? `₹${Number(v).toLocaleString('en-IN')}` : v,
                        productChartMetric === 'revenue' ? 'Revenue' : productChartMetric === 'unitsSold' ? 'Units Sold' : 'Orders',
                      ]}
                    />
                    <Bar dataKey={productChartMetric} fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Selling Price</th>
                      <th className="py-3 px-4 text-center">Stock Remaining</th>
                      <th className="py-3 px-4 text-center">Units Sold</th>
                      <th className="py-3 px-4 text-right">Revenue Generated</th>
                      <th className="py-3 px-4 text-center">Approval Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 text-slate-500">{p.category?.name || 'Assigned'}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900 text-right">
                            ₹{Number(p.price).toLocaleString('en-IN')}
                            {p.discountPrice && (
                              <span className="line-through text-slate-400 ml-1 text-[11px]">
                                ₹{Number(p.discountPrice)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                                p.stock <= 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : p.stock <= (p.lowStockThreshold || 5)
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stock} {p.unit || 'units'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-700">
                            {analytics?.productPerformance?.products?.find((x: any) => x.id === p.id)?.unitsSold || 0}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            ₹{(analytics?.productPerformance?.products?.find((x: any) => x.id === p.id)?.revenue || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                p.approvalStatus === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : p.approvalStatus === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {p.approvalStatus || 'APPROVED'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setEditProductForm({
                                  price: String(p.price || ''),
                                  discountPrice: String(p.discountPrice || ''),
                                  stock: String(p.stock || '20'),
                                  lowStockThreshold: String(p.lowStockThreshold || '5'),
                                  availability: p.availability ?? true,
                                });
                                setEditProductModalOpen(true);
                              }}
                              className="p-1 text-slate-600 hover:text-emerald-700 rounded hover:bg-slate-100"
                              title="Edit Price and Stock"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No products in your catalog matching filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 5: DELIVERY PERFORMANCE & FLEET RUNNERS
            ======================================================= */}
        {activeTab === 'DELIVERY' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-medium">Awaiting Pickup</span>
                <div className="mt-2 text-xl font-bold text-amber-600">
                  {analytics?.deliveryPerformance?.awaitingPickup || 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-medium">Out for Delivery</span>
                <div className="mt-2 text-xl font-bold text-blue-600">
                  {analytics?.deliveryPerformance?.outForDelivery || 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-medium">Delivered Today</span>
                <div className="mt-2 text-xl font-bold text-emerald-700">
                  {analytics?.deliveryPerformance?.deliveredToday || 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-medium">Fulfillment Completion Rate</span>
                <div className="mt-2 text-xl font-bold text-slate-900">
                  {analytics?.deliveryPerformance?.deliveryCompletionRate || 100}%
                </div>
              </div>
            </div>

            {/* Assigned Runners Performance Table */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-600" />
                Assigned Delivery Runner Roster
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics?.deliveryPerformance?.runners && analytics.deliveryPerformance.runners.length > 0 ? (
                  analytics.deliveryPerformance.runners.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                        <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded">
                          {r.vehicleType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Mobile: {r.mobile || '+91-Campus-Dispatch'}</div>

                      <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-3 text-center text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase">Assigned</div>
                          <div className="font-bold text-slate-800">{r.totalAssigned}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase">Completed</div>
                          <div className="font-bold text-emerald-700">{r.completed}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase">Rate</div>
                          <div className="font-bold text-blue-700">{r.completionRate}%</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-slate-400 text-xs">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No delivery runners actively assigned to current batch orders.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 6: REVENUE BREAKDOWN & PAYMENT ANALYTICS
            ======================================================= */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                  Revenue Breakdown Statement
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Gross Sales Volume</span>
                    <span className="font-bold text-slate-900">
                      ₹{Number(analytics?.revenueBreakdown?.grossSales || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                    <span>Discounts & Coupons</span>
                    <span className="font-bold">
                      -₹{Number(analytics?.revenueBreakdown?.discounts || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                    <span>Cancelled Order Refunds</span>
                    <span className="font-bold">
                      -₹{Number(analytics?.revenueBreakdown?.refunds || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 text-slate-500">
                    <span>Campus Platform / Service Fees</span>
                    <span className="font-bold text-slate-700">₹0 (None)</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-slate-900 text-sm font-bold text-slate-900 bg-emerald-50 px-3 rounded-lg">
                    <span className="text-emerald-900">Final Provider Earnings</span>
                    <span className="text-emerald-700">
                      ₹{Number(analytics?.revenueBreakdown?.finalEarnings || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment & Settlement Summary */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  Payment & Settlement Tracking
                </h4>

                <div className="grid grid-cols-2 gap-3.5 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Total Earned</span>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      ₹{Number(analytics?.paymentAnalytics?.totalEarned || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-[11px] text-amber-700 font-medium">Pending Settlement</span>
                    <div className="text-base font-bold text-amber-800 mt-1">
                      ₹{Number(analytics?.paymentAnalytics?.pendingSettlement || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-[11px] text-emerald-700 font-medium">Settled to Account</span>
                    <div className="text-base font-bold text-emerald-800 mt-1">
                      ₹{Number(analytics?.paymentAnalytics?.settledAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Paid Orders Count</span>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {analytics?.paymentAnalytics?.paidOrdersCount || 0}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
                  Campus settlements are reconciled directly via the NIT Durgapur Institutional Finance Cell on a bi-weekly cycle.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 7: LAUNDRY SERVICES & DUAL-OTP VERIFICATION
            ======================================================= */}
        {activeTab === 'LAUNDRY' && isLaundryVendor && (
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-indigo-600" />
                  Express Laundry Doorstep Verification Desk
                </h3>
                <p className="text-xs text-slate-500">Student dual-OTP room pickup & delivery cycle</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Room Drop</th>
                    <th className="py-3 px-4">Service Type</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-center">Pickup OTP</th>
                    <th className="py-3 px-4 text-center">Delivery OTP</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {laundryJobs.length > 0 ? (
                    laundryJobs.map((job: any) => (
                      <tr key={job.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">#{job.orderNumber}</td>
                        <td className="py-3 px-4 font-medium">{job.student?.fullName || 'Student'}</td>
                        <td className="py-3 px-4 text-slate-500">{job.hallName} {job.roomNumber}</td>
                        <td className="py-3 px-4 text-indigo-700 font-medium">{job.serviceType}</td>
                        <td className="py-3 px-4 text-center">{job.totalClothesCount || 1}</td>
                        <td className="py-3 px-4 text-right font-bold">₹{job.finalPrice || job.estimatedPrice}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              job.pickupOtpStatus === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {job.pickupOtpStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              job.deliveryOtpStatus === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {job.deliveryOtpStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {job.pickupOtpStatus === 'PENDING' && (
                            <button
                              onClick={() => {
                                setOtpModal({
                                  isOpen: true,
                                  jobId: job.id,
                                  type: 'PICKUP',
                                  orderNumber: job.orderNumber,
                                });
                                setEnteredOtp('');
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                            >
                              Verify Pickup OTP
                            </button>
                          )}
                          {job.pickupOtpStatus === 'VERIFIED' && job.deliveryOtpStatus === 'PENDING' && (
                            <button
                              onClick={() => {
                                setOtpModal({
                                  isOpen: true,
                                  jobId: job.id,
                                  type: 'DELIVERY',
                                  orderNumber: job.orderNumber,
                                });
                                setEnteredOtp('');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                            >
                              Verify Return OTP
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No active doorstep laundry orders right now.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* =======================================================
          ORDER DETAILS MODAL WITH 7-STEP VISUAL TIMELINE
          ======================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase">Order Inspection Details</span>
                <h3 className="text-lg font-bold text-slate-900 font-mono">#{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 7-Step Visual Timeline */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Order Fulfillment Progression Timeline
              </h4>
              <div className="flex items-center justify-between relative">
                {[
                  'Order Placed',
                  'Accepted',
                  'Preparing',
                  'Ready for Pickup',
                  'Picked Up',
                  'Out for Delivery',
                  'Delivered',
                ].map((step, idx) => {
                  const stepIndexMap: Record<string, number> = {
                    CONFIRMED: 1,
                    PENDING: 0,
                    ACCEPTED: 1,
                    PREPARING: 2,
                    READY: 3,
                    READY_FOR_PICKUP: 3,
                    PICKED_UP: 4,
                    OUT_FOR_DELIVERY: 5,
                    DELIVERED: 6,
                  };
                  const currentIdx = stepIndexMap[selectedOrder.status] ?? 0;
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step} className="flex flex-col items-center text-center flex-1 relative z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                          isDone
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isCurrent
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-slate-300 border-slate-200'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[10px] mt-1.5 font-medium leading-tight ${isDone ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer & Items Breakdown */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Customer Info</span>
                <div className="font-bold text-slate-900 text-sm">{selectedOrder.student?.fullName || selectedOrder.customerName}</div>
                <div className="text-slate-600">{selectedOrder.student?.mobileNumber || selectedOrder.customerMobile || '+91-Student-Mobile'}</div>
                <div className="text-slate-600">{selectedOrder.student?.hallName || selectedOrder.hallName} • {selectedOrder.student?.roomNumber || selectedOrder.roomNumber}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 uppercase text-[10px]">Delivery Partner</span>
                <div className="font-bold text-slate-900 text-sm">{selectedOrder.deliveryBoy?.fullName || selectedOrder.deliveryBoyName || 'Unassigned'}</div>
                <div className="text-slate-600">{selectedOrder.deliveryBoy?.vehicleType || 'Hostel Runner'}</div>
                <div className="text-emerald-700 font-bold mt-1">Status: {selectedOrder.status}</div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-900">{it.productName}</td>
                        <td className="py-2 px-3 text-center">{it.quantity || 1}</td>
                        <td className="py-2 px-3 text-right">₹{it.unitPrice}</td>
                        <td className="py-2 px-3 text-right font-bold">₹{it.totalPrice || it.unitPrice * (it.quantity || 1)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        {selectedOrder.itemsSummary || 'Standard Order Items'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-sm font-bold border-t border-slate-100 pt-3">
              <span className="text-slate-600">Grand Total:</span>
              <span className="text-emerald-700 text-base">₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          SECTION 17: MONTHLY BUSINESS REPORT PDF MODAL
          ======================================================= */}
      {monthlyReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 text-slate-900 print:p-0 print:border-none print:shadow-none print:max-w-full">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">Select Month:</span>
                <select
                  value={selectedReportMonth}
                  onChange={(e) => setSelectedReportMonth(e.target.value)}
                  className="bg-slate-100 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium"
                >
                  <option value="August 2026">August 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="July 2026">July 2026</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setMonthlyReportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-6 text-xs text-slate-800 font-sans print:text-sm">
              {/* Report Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <div className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                  National Institute of Technology Durgapur
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  CAMPUS BASKET — SERVICE PROVIDER BUSINESS REPORT
                </h1>
                <p className="text-xs text-slate-500">Official Operational Audit & Business Performance Summary</p>
              </div>

              {/* Provider Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Provider Name</span>
                  <div className="font-bold text-slate-900 text-sm">{analytics?.provider?.fullName || 'Campus Vendor'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Provider ID</span>
                  <div className="font-mono font-bold text-slate-900">{analytics?.provider?.username || 'SP_FOOD_01'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Assigned Category</span>
                  <div className="font-semibold text-emerald-700">{analytics?.provider?.serviceCategory || 'Food & Meals'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Reporting Period</span>
                  <div className="font-bold text-slate-900">{selectedReportMonth}</div>
                </div>
              </div>

              {/* 1. Executive Summary */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  1. Executive Summary
                </h2>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500">Total Sales</span>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5">
                      ₹{Number(kpis?.totalSales?.value || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500">Total Orders</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{kpis?.totalOrders?.value || 0}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500">Total Customers</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{analytics?.customerAnalytics?.totalCustomers || 0}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500">Products Sold</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {analytics?.productPerformance?.products?.reduce((s: number, p: any) => s + p.unitsSold, 0) || 0}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500">Average Order</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      ₹{analytics?.customerAnalytics?.averageOrderValue || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Top Products Table */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  2. Top Performing Products
                </h2>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="py-1.5 px-2">Product Name</th>
                      <th className="py-1.5 px-2 text-center">Units Sold</th>
                      <th className="py-1.5 px-2 text-right">Revenue (INR)</th>
                      <th className="py-1.5 px-2 text-center">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(analytics?.productPerformance?.topSelling || []).slice(0, 5).map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-1.5 px-2 font-medium">{p.name}</td>
                        <td className="py-1.5 px-2 text-center">{p.unitsSold}</td>
                        <td className="py-1.5 px-2 text-right font-bold">₹{p.revenue.toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-2 text-center">{p.currentStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 3. Top Customers Table */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  3. Top Customer Accounts
                </h2>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="py-1.5 px-2">Customer</th>
                      <th className="py-1.5 px-2 text-center">Orders</th>
                      <th className="py-1.5 px-2 text-right">Total Spent (INR)</th>
                      <th className="py-1.5 px-2 text-right">Average Order (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(analytics?.customerAnalytics?.topCustomers || []).slice(0, 5).map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-1.5 px-2 font-medium">{c.name}</td>
                        <td className="py-1.5 px-2 text-center">{c.totalOrders}</td>
                        <td className="py-1.5 px-2 text-right font-bold">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-2 text-right">₹{c.averageOrderValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. Revenue & Settlement Summary */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  4. Revenue Summary
                </h2>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="flex justify-between">
                    <span>Gross Sales:</span>
                    <span className="font-bold">₹{Number(analytics?.revenueBreakdown?.grossSales || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Discounts:</span>
                    <span>-₹{Number(analytics?.revenueBreakdown?.discounts || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Refunds:</span>
                    <span>-₹{Number(analytics?.revenueBreakdown?.refunds || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-900">
                    <span>Net Provider Earnings:</span>
                    <span className="text-emerald-700">₹{Number(analytics?.revenueBreakdown?.finalEarnings || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Report Footer */}
              <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">
                Generated securely by Campus Basket Platform • NIT Durgapur Campus Services • Verified Institutional Record
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          ADD PRODUCT MODAL (Preserves Existing Workflow)
          ======================================================= */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Add New Product to Catalog
              </h3>
              <button
                onClick={() => setAddProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addProductError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {addProductError}
              </div>
            )}

            <form onSubmit={handleAddProductSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Product Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Chicken Biryani"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, preparation details, or pack specifications..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="140"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="125"
                    value={productForm.discountPrice}
                    onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Low Alert At</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.lowStockThreshold}
                    onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Product Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setProductImageFile(f);
                      setImagePreview(URL.createObjectURL(f));
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg text-amber-900 text-[11px] border border-amber-200">
                Notice: Newly submitted products undergo validation and require Admin approval before appearing on the student portal.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addProductLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {addProductLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          EDIT PRODUCT MODAL
          ======================================================= */}
      {editProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">Edit Price & Stock: {editingProduct?.name}</h3>
              <button onClick={() => setEditProductModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    value={editProductForm.discountPrice}
                    onChange={(e) => setEditProductForm({ ...editProductForm, discountPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    required
                    value={editProductForm.stock}
                    onChange={(e) => setEditProductForm({ ...editProductForm, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    value={editProductForm.lowStockThreshold}
                    onChange={(e) => setEditProductForm({ ...editProductForm, lowStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="availabilityToggle"
                  checked={editProductForm.availability}
                  onChange={(e) => setEditProductForm({ ...editProductForm, availability: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="availabilityToggle" className="text-slate-800 font-medium">
                  Active & Available in Storefront
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editProductLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          LAUNDRY DUAL-OTP VERIFICATION MODAL
          ======================================================= */}
      {otpModal && otpModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Verify {otpModal.type === 'PICKUP' ? 'Doorstep Pickup' : 'Delivery Return'} OTP
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the 6-digit student code for order #{otpModal.orderNumber}
            </p>

            {otpError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {otpError}
              </div>
            )}
            {otpSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
                {otpSuccess}
              </div>
            )}

            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-xl font-mono tracking-widest px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:border-emerald-600 focus:outline-none mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOtpModal(null)}
                className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (enteredOtp.length !== 6) return;
                  setSubmittingOtp(true);
                  try {
                    const endpoint =
                      otpModal.type === 'PICKUP'
                        ? `/api/laundry/${otpModal.jobId}/verify-pickup-otp`
                        : `/api/laundry/${otpModal.jobId}/verify-delivery-otp`;
                    const res = await apiRequest(endpoint, {
                      method: 'POST',
                      body: JSON.stringify({ otp: enteredOtp }),
                    });
                    if (res.success) {
                      setOtpSuccess('Verified successfully!');
                      setTimeout(() => {
                        setOtpModal(null);
                        setOtpSuccess(null);
                        refreshAll();
                      }, 1200);
                    } else {
                      setOtpError(res.message || 'Incorrect verification code');
                    }
                  } catch (err: any) {
                    setOtpError(err.message || 'Verification error');
                  } finally {
                    setSubmittingOtp(false);
                  }
                }}
                disabled={enteredOtp.length !== 6 || submittingOtp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                {submittingOtp ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
