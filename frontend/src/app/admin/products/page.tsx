'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import { ProductFormModal } from '../../../components/admin/ProductFormModal';
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  BarChart2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Archive,
  Store,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AdminProductsPage() {
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection for Bulk Actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = `/api/admin/products?sort=${sortOrder}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (categoryFilter !== 'ALL') query += `&category=${categoryFilter}`;
      if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;
      if (stockFilter !== 'ALL') query += `&stockStatus=${stockFilter}`;

      const [prodRes, catRes] = await Promise.allSettled([
        apiRequest(query),
        apiRequest('/api/admin/categories')
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value?.success && prodRes.value?.products) {
        setProducts(prodRes.value.products);
      }
      if (catRes.status === 'fulfilled' && catRes.value?.success && catRes.value?.categories) {
        setCategories(catRes.value.categories);
      }
    } catch (err) {
      console.warn('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, statusFilter, stockFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleToggleVisibility = async (productId: string, currentStatus: boolean) => {
    try {
      const res = await apiRequest(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ availability: !currentStatus })
      });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, availability: !currentStatus } : p))
        );
      }
    } catch (err) {
      alert('Failed to update product visibility');
    }
  };

  const handleArchiveProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to archive this product? It will no longer be visible to students.')) return;
    try {
      const res = await apiRequest(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ availability: false })
      });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, availability: false } : p))
        );
      }
    } catch (err) {
      alert('Error archiving product');
    }
  };

  // Bulk actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkVisibility = async (active: boolean) => {
    try {
      for (const id of selectedProductIds) {
        await apiRequest(`/api/admin/products/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ availability: active })
        });
      }
      setSelectedProductIds([]);
      fetchProducts();
    } catch {
      alert('Error updating bulk products');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
            <span>Product Catalog &amp; SKU Control</span>
            <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
              {products.length} Products
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Google Drive 4:3 normalized imagery &bull; Real-time MySQL inventory tracking &bull; Table &amp; Grid views
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'TABLE' ? 'bg-[#4F9D32] text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'GRID' ? 'bg-[#4F9D32] text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Grid</span>
            </button>
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedProductIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#347A27]">
            <CheckCircle2 className="w-4 h-4" />
            <span>{selectedProductIds.length} products selected for batch operations</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkVisibility(true)}
              className="px-3 py-1 bg-white hover:bg-slate-50 border border-emerald-300 text-[#347A27] font-semibold rounded-lg"
            >
              Set Visible (Active)
            </button>
            <button
              onClick={() => handleBulkVisibility(false)}
              className="px-3 py-1 bg-white hover:bg-slate-50 border border-red-300 text-red-700 font-semibold rounded-lg"
            >
              Archive / Hide
            </button>
            <button
              onClick={() => setSelectedProductIds([])}
              className="px-2 py-1 text-slate-500 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt;5)</option>
            <option value="low_stock">Low Stock (1-5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="active">Active (Visible)</option>
            <option value="hidden">Hidden</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_asc">Price Low → High</option>
            <option value="price_desc">Price High → Low</option>
            <option value="lowest_stock">Lowest Stock</option>
          </select>
        </div>
      </div>

      {/* Content Rendering: TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-8">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedProductIds.length === products.length && products.length > 0}
                      className="rounded border-slate-300 text-[#4F9D32] focus:ring-[#4F9D32]"
                    />
                  </th>
                  <th className="py-3.5 px-4">Image (4:3)</th>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Provider</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => handleToggleSelectOne(p.id)}
                        className="rounded border-slate-300 text-[#4F9D32] focus:ring-[#4F9D32]"
                      />
                    </td>

                    {/* Image with 4:3 aspect ratio */}
                    <td className="py-3 px-4">
                      <div className="w-16 h-12 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative flex items-center justify-center">
                        {p.primaryImage ? (
                          <img
                            src={p.primaryImage}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#17202A] text-xs flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isFeatured && (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {p.sku || `SKU-${p.id.slice(-4)}`} &bull; {p.unit}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        {p.category?.name || 'General'}
                      </span>
                    </td>

                    {/* Provider */}
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <span className="flex items-center gap-1 font-medium">
                        <Store className="w-3 h-3 text-slate-400" />
                        <span>{p.provider?.businessName || 'Campus Main Canteen'}</span>
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-[#17202A]">₹{p.discountPrice || p.price}</div>
                      {p.discountPrice && (
                        <div className="text-[10px] text-slate-400 line-through">₹{p.price}</div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.stock > 5 ? 'bg-[#4F9D32]' : p.stock > 0 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="font-mono font-bold text-[#17202A]">{p.stock}</span>
                        <span className="text-[10px] text-slate-500">left</span>
                      </div>
                    </td>

                    {/* Visibility */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleVisibility(p.id, p.availability)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          p.availability
                            ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {p.availability ? 'Active' : 'Hidden'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/products/${p.id}/analytics`}
                          title="View Product Sales Analytics"
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 transition-colors"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsModalOpen(true);
                          }}
                          title="Edit Product"
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#4F9D32] border border-slate-200 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleArchiveProduct(p.id)}
                          title="Archive Product"
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Rendering: GRID VIEW (4:3 Cards) */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between"
            >
              <div>
                {/* 4:3 Image Container */}
                <div className="w-full aspect-[4/3] bg-slate-100 relative overflow-hidden border-b border-slate-100">
                  {p.primaryImage ? (
                    <img
                      src={p.primaryImage}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[#17202A] text-[10px] font-bold shadow-xs">
                      {p.category?.name || 'Item'}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                        p.stock > 5
                          ? 'bg-emerald-100 text-[#347A27]'
                          : p.stock > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {p.stock} left
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-[#17202A] line-clamp-1 group-hover:text-[#4F9D32] transition-colors">
                      {p.name}
                    </h4>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium line-clamp-1">
                    {p.provider?.businessName || 'Main Campus Provider'}
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="font-mono">
                      <span className="text-base font-black text-[#17202A]">
                        ₹{p.discountPrice || p.price}
                      </span>
                      {p.discountPrice && (
                        <span className="text-xs text-slate-400 line-through ml-1.5">
                          ₹{p.price}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">per {p.unit}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleVisibility(p.id, p.availability)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    p.availability
                      ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  {p.availability ? 'Active' : 'Hidden'}
                </button>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/products/${p.id}/analytics`}
                    title="Analytics"
                    className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setIsModalOpen(true);
                    }}
                    title="Edit"
                    className="p-1 rounded-lg text-slate-500 hover:text-[#4F9D32] hover:bg-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchiveProduct(p.id)}
                    title="Archive"
                    className="p-1 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCT FORM MODAL */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchProducts();
        }}
        categories={categories}
        initialProduct={editingProduct}
      />
    </div>
  );
}
