'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  Layers,
  IndianRupee,
  Boxes,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function AdminProductApprovalsPage() {
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/products/pending');
      if (res.success && res.products) {
        setPendingProducts(res.products);
      }
    } catch (err) {
      console.warn('Pending products fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (product: any) => {
    const confirm = window.confirm(
      `Approve "${product.name}"? It will immediately become visible to all students in the ${product.category?.name || 'catalog'} store.`
    );
    if (!confirm) return;

    setActionLoading(product.id);
    try {
      const res = await apiRequest(`/api/admin/products/${product.id}/approve`, {
        method: 'POST',
      });

      if (res.success) {
        setPendingProducts((prev) => prev.filter((p) => p.id !== product.id));
      } else {
        alert(res.message || 'Approval failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error approving product');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (product: any) => {
    setSelectedProduct(product);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setRejectSubmitting(true);
    try {
      const res = await apiRequest(`/api/admin/products/${selectedProduct.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });

      if (res.success) {
        setPendingProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
        setRejectModalOpen(false);
      } else {
        alert(res.message || 'Rejection failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error rejecting product');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const filtered = pendingProducts.filter((p) => {
    return (
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.provider?.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#17202A] tracking-tight">
              Service Provider Product Approval Queue
            </h1>
            <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {pendingProducts.length} Pending Review
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 9 Workflow: New vendor-submitted items remain hidden from student catalog until approved by Campus Administration.
          </p>
        </div>

        <button
          onClick={fetchPending}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter pending items by product name, vendor brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Products Queue List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-amber-600 rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Checking product verification queue...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#347A27] flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-[#17202A]">Queue Fully Cleared</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no provider-added products awaiting administrative approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prod) => {
            const providerName = prod.provider?.businessName || 'Independent Vendor';
            const categoryName = prod.category?.name || 'Assigned Category';
            const imageUrl = prod.image || prod.imageUrl || '/placeholder.png';

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Image container */}
                  <div className="h-44 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                    <img
                      src={imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
                      }}
                    />
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                      PENDING APPROVAL
                    </span>
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                      {categoryName}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <h3 className="font-bold text-sm text-[#17202A] line-clamp-1">{prod.name}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {prod.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Provider:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Store className="w-3 h-3 text-[#4F9D32]" />
                          <span>{providerName}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Price / Discount:</span>
                        <span className="font-bold text-[#17202A]">
                          ₹{prod.price} {prod.discountPrice ? <span className="text-slate-400 line-through font-normal text-[10px] ml-1">₹{prod.discountPrice}</span> : null}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Stock / Unit:</span>
                        <span className="font-bold text-slate-800">
                          {prod.stockQuantity} {prod.unit || 'units'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decision Actions */}
                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openRejectModal(prod)}
                    disabled={actionLoading === prod.id}
                    className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleApprove(prod)}
                    disabled={actionLoading === prod.id}
                    className="py-2.5 px-3 rounded-xl bg-[#4F9D32] hover:bg-[#347A27] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {actionLoading === prod.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-[#17202A]">Reject Product Submission</h3>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800">
              You are rejecting <strong>&quot;{selectedProduct.name}&quot;</strong> submitted by{' '}
              <strong>{selectedProduct.provider?.businessName}</strong>. The vendor will see the reason on their dashboard.
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Reason for Rejection (Optional but Recommended)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Unclear product photo, incorrect unit pricing, or policy non-compliance..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-red-500 focus:bg-white resize-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {rejectSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
