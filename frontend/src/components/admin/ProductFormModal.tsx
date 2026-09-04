'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{ id: string; name: string }>;
  initialProduct?: any;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  initialProduct
}: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [unit, setUnit] = useState('piece');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('25');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [deliveryTime, setDeliveryTime] = useState('20-30 mins');
  const [isFeatured, setIsFeatured] = useState(false);
  const [availability, setAvailability] = useState(true);

  // Image Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setCategoryId(initialProduct.categoryId || (categories[0]?.id ?? ''));
      setDescription(initialProduct.description || '');
      setPrice(initialProduct.price?.toString() || '');
      setDiscountPrice(initialProduct.discountPrice?.toString() || '');
      setUnit(initialProduct.unit || 'piece');
      setSku(initialProduct.sku || '');
      setStock(initialProduct.stock?.toString() || '20');
      setLowStockThreshold(initialProduct.lowStockThreshold?.toString() || '5');
      setDeliveryTime(initialProduct.deliveryTime || '20-30 mins');
      setIsFeatured(initialProduct.isFeatured || false);
      setAvailability(initialProduct.availability !== undefined ? initialProduct.availability : true);
      setImagePreviewUrl(initialProduct.primaryImage || null);
    } else {
      setName('');
      setCategoryId(categories[0]?.id || 'cat_food');
      setDescription('');
      setPrice('');
      setDiscountPrice('');
      setUnit('piece');
      setSku('');
      setStock('25');
      setLowStockThreshold('5');
      setDeliveryTime('20-30 mins');
      setIsFeatured(false);
      setAvailability(true);
      setSelectedFile(null);
      setImagePreviewUrl(null);
    }
    setErrorMsg(null);
  }, [initialProduct, categories, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('categoryId', categoryId);
    formData.append('description', description);
    formData.append('price', price);
    if (discountPrice) formData.append('discountPrice', discountPrice);
    formData.append('unit', unit);
    if (sku) formData.append('sku', sku);
    formData.append('stock', stock);
    formData.append('lowStockThreshold', lowStockThreshold);
    formData.append('deliveryTime', deliveryTime);
    formData.append('isFeatured', String(isFeatured));
    formData.append('availability', String(availability));

    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    try {
      const token = localStorage.getItem('nit_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const endpoint = initialProduct
        ? `${backendUrl}/api/admin/products/${initialProduct.id}`
        : `${backendUrl}/api/admin/products`;

      const res = await fetch(endpoint, {
        method: initialProduct ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save product');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while uploading product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#17202A] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4F9D32]" />
              <span>{initialProduct ? 'Edit Product' : 'Add New Product'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Google Drive automated 4:3 (1200×900) normalization &amp; Railway MySQL persistence
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kolkata Chicken Biryani"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Price, Discount Price & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="140"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Discount Price (₹)
              </label>
              <input
                type="number"
                step="0.5"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="125"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
              >
                <option value="plate">plate</option>
                <option value="meal">meal</option>
                <option value="combo">combo</option>
                <option value="kg">kg</option>
                <option value="dozen">dozen</option>
                <option value="500g">500g</option>
                <option value="piece">piece</option>
                <option value="book">book</option>
                <option value="pack">pack</option>
                <option value="set">set</option>
              </select>
            </div>
          </div>

          {/* Row 3: Stock, Threshold & Estimated Delivery */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Initial Stock *
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Delivery Estimate
              </label>
              <input
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g. 20-30 mins"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Description &amp; Specifications
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh ingredients, dietary information, or engineering utility details..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
            />
          </div>

          {/* Google Drive Image Normalization Upload Area with 4:3 Live Preview */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Product Image (Auto-normalized to 4:3 1200×900 for Google Drive)
            </label>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Upload trigger */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:flex-1 border-2 border-dashed border-slate-300 hover:border-[#4F9D32] rounded-2xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-7 h-7 text-[#4F9D32] mx-auto mb-1.5" />
                <div className="text-xs font-bold text-[#17202A]">Click to select product image</div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Sharp automatically resizes &amp; centers to 4:3 aspect ratio
                </p>
              </div>

              {/* 4:3 Aspect Ratio Card Preview */}
              <div className="w-40 shrink-0">
                <div className="text-[10px] text-slate-500 font-semibold mb-1 text-center">
                  4:3 Ratio Card Preview
                </div>
                <div className="w-40 h-30 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative flex items-center justify-center">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Normalized Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <ImageIcon className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">No image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-slate-300 text-[#4F9D32] focus:ring-[#4F9D32] w-4 h-4"
              />
              <span className="text-xs text-slate-700 font-medium">Mark as Featured</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availability}
                onChange={(e) => setAvailability(e.target.checked)}
                className="rounded border-slate-300 text-[#4F9D32] focus:ring-[#4F9D32] w-4 h-4"
              />
              <span className="text-xs text-slate-700 font-medium">Available for Student Orders</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-md shadow-[#4F9D32]/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Uploading &amp; Normalizing...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{initialProduct ? 'Save Product Changes' : 'Publish Product to Campus'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
