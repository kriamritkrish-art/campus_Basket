'use client';

import React, { useEffect, useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

export default function ProviderDashboardPage() {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS' | 'LAUNDRY'>('PRODUCTS');

  // KPIs
  const [kpi, setKpi] = useState<any>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Laundry Jobs State (Preserving Doorstep dual-OTP feature)
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
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  // Add Product Modal
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stockQuantity: '20',
    unit: 'piece',
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
    stockQuantity: '',
    isActive: true,
  });
  const [editProductLoading, setEditProductLoading] = useState(false);

  // Initial Guard
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (role !== 'SERVICE_PROVIDER' && role !== 'ADMIN'))) {
      window.location.href = '/login?redirect=/provider/dashboard';
    }
  }, [isAuthenticated, role, isLoading]);

  const loadKpis = async () => {
    try {
      setKpiLoading(true);
      const res = await apiRequest('/api/provider/kpi');
      if (res.success && res.kpi) {
        setKpi(res.kpi);
      }
    } catch (err) {
      console.warn('KPI fetch error:', err);
    } finally {
      setKpiLoading(false);
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
    loadKpis();
    loadProducts();
    loadOrders();
    loadLaundryJobs();
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    }
  }, [isAuthenticated]);

  // Handle Add Product Submit
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
      formData.append('stockQuantity', productForm.stockQuantity);
      formData.append('unit', productForm.unit);
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
          stockQuantity: '20',
          unit: 'piece',
        });
        setProductImageFile(null);
        setImagePreview(null);
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

  const openEditProductModal = (p: any) => {
    setEditingProduct(p);
    setEditProductForm({
      price: String(p.price || ''),
      discountPrice: String(p.discountPrice || ''),
      stockQuantity: String(p.stockQuantity || ''),
      isActive: p.isActive ?? true,
    });
    setEditProductModalOpen(true);
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditProductLoading(true);

    try {
      const res = await apiRequest(`/api/provider/products/${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          price: parseFloat(editProductForm.price),
          discountPrice: editProductForm.discountPrice ? parseFloat(editProductForm.discountPrice) : undefined,
          stockQuantity: parseInt(editProductForm.stockQuantity),
          isActive: editProductForm.isActive,
        }),
      });

      if (res.success) {
        setEditProductModalOpen(false);
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

  const handleDeleteProduct = async (p: any) => {
    const confirm = window.confirm(`Are you sure you want to delete product "${p.name}"?`);
    if (!confirm) return;

    try {
      const res = await apiRequest(`/api/provider/products/${p.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setProducts((prev) => prev.filter((item) => item.id !== p.id));
        loadKpis();
      } else {
        alert(res.message || 'Failed to delete');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  // Status updates on Orders
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await apiRequest(`/api/provider/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        loadOrders();
        loadKpis();
      } else {
        alert(res.message || 'Failed to update order status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating order status');
    }
  };

  // Laundry OTP verification handlers
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModal || enteredOtp.length !== 6) return;

    setSubmittingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);

    const endpoint =
      otpModal.type === 'PICKUP'
        ? `/api/laundry/${otpModal.jobId}/verify-pickup`
        : `/api/laundry/${otpModal.jobId}/verify-delivery`;

    try {
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ otp: enteredOtp.trim() }),
      });

      if (res.success) {
        setOtpSuccess(res.message || 'OTP successfully verified!');
        setTimeout(() => {
          setOtpModal(null);
          setEnteredOtp('');
          loadLaundryJobs();
        }, 1200);
      } else {
        setOtpError(res.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification error');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const assignedCategory = kpi?.assignedCategory || user?.provider?.serviceCategory || 'Food & Meals';

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !productSearch ||
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'APPROVED' && p.approvalStatus === 'APPROVED') ||
      (statusFilter === 'PENDING' && p.approvalStatus === 'PENDING') ||
      (statusFilter === 'REJECTED' && p.approvalStatus === 'REJECTED');

    return matchesSearch && matchesStatus;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'ALL') return true;
    return o.status === orderStatusFilter;
  });

  return (
    <div className="min-h-screen bg-[#F5F7F5] pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-[#17202A] tracking-tight leading-none uppercase">
                {user?.provider?.businessName || 'Service Provider Console'}
              </div>
              <div className="text-[10px] text-emerald-700 font-bold uppercase mt-1 flex items-center gap-1.5">
                <span>Category:</span>
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {assignedCategory}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshAll}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${kpiLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <button
              onClick={logout}
              title="Log Out"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 7: KPI CARDS (Financials & Operations) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Operational Performance &amp; Revenue
            </h2>
            <span className="text-[11px] font-bold text-emerald-700">
              Provider ID: {user?.username || user?.id?.slice(0, 8)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Today's Sales */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                <span>Today&apos;s Sales</span>
              </div>
              <div className="text-xl font-black text-[#17202A] mt-1 font-mono">
                ₹{(kpi?.todaySales || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Live daily collection</div>
            </div>

            {/* Monthly Sales */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                <span>Monthly Sales</span>
              </div>
              <div className="text-xl font-black text-[#17202A] mt-1 font-mono">
                ₹{(kpi?.monthlySales || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Calendar month to date</div>
            </div>

            {/* Total Products */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Boxes className="w-3 h-3 text-[#4F9D32]" />
                <span>Total Products</span>
              </div>
              <div className="text-xl font-black text-[#17202A] mt-1">
                {kpi?.totalProducts ?? products.length}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                {kpi?.availableProducts ?? 0} active in stock
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-purple-600" />
                <span>Total Orders</span>
              </div>
              <div className="text-xl font-black text-[#17202A] mt-1">
                {kpi?.totalOrders ?? orders.length}
              </div>
              <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                {kpi?.completedOrders ?? 0} completed
              </div>
            </div>

            {/* In Preparation / Pending */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Active Queue</span>
              </div>
              <div className="text-xl font-black text-[#17202A] mt-1">
                {(kpi?.pendingOrders || 0) + (kpi?.processingOrders || 0)}
              </div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                {kpi?.processingOrders ?? 0} in preparation
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'PRODUCTS'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Products &amp; Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'ORDERS'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          {laundryJobs.length > 0 && (
            <button
              onClick={() => setActiveTab('LAUNDRY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'LAUNDRY'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Shirt className="w-4 h-4 text-sky-500" />
              <span>Doorstep Laundry ({laundryJobs.length})</span>
            </button>
          )}
        </div>

        {/* TAB 1: PRODUCT CATALOG & MANAGEMENT */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filter & Add Product Header */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search your items by name or description..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="ALL">All Approval Statuses</option>
                  <option value="APPROVED">APPROVED (Live)</option>
                  <option value="PENDING">PENDING APPROVAL</option>
                  <option value="REJECTED">REJECTED</option>
                </select>

                <button
                  onClick={() => setAddProductModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-emerald-700 rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Loading catalog items...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-sm text-[#17202A]">No products in your catalog</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click &quot;Add Product&quot; to publish items to your assigned category: <strong>{assignedCategory}</strong>.
                </p>
                <button
                  onClick={() => setAddProductModalOpen(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((p) => {
                  const isApproved = p.approvalStatus === 'APPROVED';
                  const isPending = p.approvalStatus === 'PENDING';
                  const isRejected = p.approvalStatus === 'REJECTED';
                  const img = p.imageUrl || p.image || '/placeholder.png';

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        {/* Image & Status Badge */}
                        <div className="h-40 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                          <img
                            src={img}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
                            }}
                          />
                          {/* Approval Status Badge */}
                          <span
                            className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs ${
                              isApproved
                                ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {isApproved ? 'APPROVED' : isPending ? 'PENDING APPROVAL' : 'REJECTED'}
                          </span>

                          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                            {p.category?.name || assignedCategory}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-2">
                          <h4 className="font-bold text-sm text-[#17202A] line-clamp-1">{p.name}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {p.description || 'No description provided.'}
                          </p>

                          <div className="pt-2 flex items-center justify-between">
                            <div>
                              <span className="font-black text-sm text-[#17202A] font-mono">₹{p.price}</span>
                              {p.discountPrice && (
                                <span className="text-[10px] text-slate-400 line-through ml-1 font-mono">
                                  ₹{p.discountPrice}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-600 font-semibold">
                              Stock: <strong className={p.stockQuantity <= 5 ? 'text-red-600' : 'text-slate-800'}>{p.stockQuantity}</strong> {p.unit || 'unit'}
                            </span>
                          </div>

                          {/* Rejection Alert Banner */}
                          {isRejected && (
                            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 space-y-0.5 mt-2">
                              <span className="font-bold">Admin Rejection Reason:</span>
                              <p className="text-red-700">{p.rejectionReason || 'Item does not meet marketplace standards.'}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                        <button
                          onClick={() => openEditProductModal(p)}
                          className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDER MANAGEMENT */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="text-xs font-bold text-[#17202A]">
                Customer Orders for {assignedCategory}
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600"
              >
                <option value="ALL">All Order Statuses</option>
                <option value="CONFIRMED">CONFIRMED (Pending Kitchen)</option>
                <option value="PREPARING">PREPARING</option>
                <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
                <option value="DELIVERY_ASSIGNED">DELIVERY ASSIGNED</option>
                <option value="PICKED_UP">PICKED UP</option>
                <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>

            {ordersLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-emerald-700 rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Loading incoming orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
                No orders match your filter criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          {o.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {o.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {o.paymentMethod} &bull; {o.paymentStatus}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-[#17202A]">
                        {o.studentName} &bull; <MapPin className="w-3.5 h-3.5 inline text-emerald-600" /> {o.hallName}, Room {o.roomNumber}
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {o.items?.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')}
                      </div>
                    </div>

                    {/* Financials & Status Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-end lg:self-center">
                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-[#17202A]">₹{o.totalAmount}</div>
                        <div className="text-[10px] text-slate-400">Total payable</div>
                      </div>

                      {/* Section 13: Order Progression Buttons */}
                      <div className="flex items-center gap-2">
                        {o.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'ACCEPTED')}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                          >
                            Accept Order
                          </button>
                        )}

                        {(o.status === 'ACCEPTED' || o.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'PREPARING')}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                          >
                            Start Preparing
                          </button>
                        )}

                        {o.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'READY_FOR_PICKUP')}
                            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                          >
                            Ready for Pickup
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPRESS LAUNDRY JOBS (Dual-OTP preserved) */}
        {activeTab === 'LAUNDRY' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Dual-OTP Doorstep Laundry System: Verify student pickup code upon room collection and student delivery code upon clean clothes return.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {laundryJobs.map((job) => {
                const isPickupStage = ['REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED'].includes(job.status);
                const isDeliveryStage = ['READY', 'DELIVERY_SCHEDULED'].includes(job.status);

                return (
                  <div key={job.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-mono text-sky-600 font-bold">{job.orderNumber}</span>
                        <h4 className="font-bold text-[#17202A] text-sm">{job.student?.fullName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 inline text-emerald-600 mr-1" />
                          <strong>{job.hallName}</strong> &bull; Room {job.roomNumber}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {job.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      Items: {job.items?.map((i: any) => `${i.quantity}x ${i.itemType}`).join(', ')} &bull; ₹{job.estimatedPrice}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2">
                      {isPickupStage && (
                        <button
                          onClick={() =>
                            setOtpModal({
                              isOpen: true,
                              jobId: job.id,
                              type: 'PICKUP',
                              orderNumber: job.orderNumber,
                            })
                          }
                          className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                        >
                          <KeyRound className="w-4 h-4" /> Verify Student Pickup OTP
                        </button>
                      )}

                      {isDeliveryStage && (
                        <button
                          onClick={() =>
                            setOtpModal({
                              isOpen: true,
                              jobId: job.id,
                              type: 'DELIVERY',
                              orderNumber: job.orderNumber,
                            })
                          }
                          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                        >
                          <KeyRound className="w-4 h-4" /> Verify Student Delivery OTP
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ADD PRODUCT MODAL (Strict Category Lock — Section 12) */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-[#17202A]">Add Catalog Product</h3>
              </div>
              <button
                onClick={() => setAddProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 12 Strict Category Indicator */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold">Assigned Category: {assignedCategory}</span>
                <p className="text-[11px] text-emerald-700">
                  You are authorized to publish items strictly within this category.
                </p>
              </div>
            </div>

            {addProductError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {addProductError}
              </div>
            )}

            <form onSubmit={handleAddProductSubmit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa with Chutney"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Freshly made crispy dosa served with coconut & tomato chutney"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-emerald-600 focus:bg-white resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="60"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="50"
                    value={productForm.discountPrice}
                    onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit of Measurement</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="plate">Plate</option>
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="combo">Combo</option>
                    <option value="packet">Packet</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Photograph</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProductImageFile(e.target.files[0]);
                      setImagePreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                />
                {imagePreview && (
                  <div className="mt-2 h-24 w-32 rounded-xl overflow-hidden border border-slate-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Section 9 Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                <strong>Section 9 Approval Workflow:</strong> Your product will start in <strong>PENDING APPROVAL</strong> status and will become visible to students once verified by Campus Administration.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addProductLoading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addProductLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-base font-bold text-[#17202A]">Edit Product Details</h3>
              </div>
              <button
                onClick={() => setEditProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editProductForm.price}
                  onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Discount Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={editProductForm.discountPrice}
                  onChange={(e) => setEditProductForm({ ...editProductForm, discountPrice: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={editProductForm.stockQuantity}
                  onChange={(e) => setEditProductForm({ ...editProductForm, stockQuantity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editProductForm.isActive}
                  onChange={(e) => setEditProductForm({ ...editProductForm, isActive: e.target.checked })}
                  className="rounded text-emerald-700 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="editIsActive" className="font-semibold text-slate-700 cursor-pointer">
                  Item is Available for Ordering
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editProductLoading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editProductLoading ? 'Saving...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LAUNDRY OTP MODAL */}
      {otpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setOtpModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mx-auto mb-2 border border-sky-200">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#17202A] text-base">
                Verify Student {otpModal.type === 'PICKUP' ? 'Pickup' : 'Delivery'} Code
              </h3>
              <p className="text-xs text-slate-500">
                Ask student for their 6-digit OTP for order <strong>{otpModal.orderNumber}</strong>
              </p>
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-[#347A27] rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{otpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-[#17202A] focus:outline-none focus:border-sky-500"
                required
              />

              <button
                type="submit"
                disabled={submittingOtp || enteredOtp.length !== 6}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
              >
                {submittingOtp ? 'Verifying...' : `Confirm ${otpModal.type} OTP`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
