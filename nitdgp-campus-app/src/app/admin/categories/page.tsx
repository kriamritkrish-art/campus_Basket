'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Layers, Plus, CheckCircle, FolderTree } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/categories');
      if (res.success && res.categories) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.warn('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    setIsSubmitting(true);

    try {
      const res = await apiRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCatName,
          slug: newCatSlug || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: newCatDesc,
          displayOrder: categories.length + 1
        })
      });

      if (res.success) {
        setNewCatName('');
        setNewCatSlug('');
        setNewCatDesc('');
        fetchCategories();
      }
    } catch (err) {
      alert('Error creating category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#4F9D32]" />
          <span>Service Categories Hierarchy</span>
          <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
            {categories.length} Registered
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Define platform service lines, taxonomy order &amp; department mappings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Category Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#4F9D32]" />
            <span>Create New Category</span>
          </h3>

          <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Category Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Midnight Canteen Meals"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  if (!newCatSlug) {
                    setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Slug (URL Identifier)
              </label>
              <input
                type="text"
                placeholder="e.g. midnight-canteen"
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white font-mono transition"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Description &amp; Purpose
              </label>
              <textarea
                rows={3}
                placeholder="Available services, operational timeframes, or specific campus locations..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Save Category'}</span>
            </button>
          </form>
        </div>

        {/* Categories Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Category Directory
            </span>
            <span className="text-xs text-slate-500 font-mono">{categories.length} total</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Loading categories...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Name &amp; Slug</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Products</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 font-bold">
                        #{c.displayOrder || idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-[#17202A]">{c.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">/{c.slug}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs line-clamp-1">
                        {c.description || 'No description provided'}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#17202A]">
                        {c.productCount || 0}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#347A27] border border-emerald-200">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
