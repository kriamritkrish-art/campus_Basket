'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Store,
  Flame,
  Tag,
  IndianRupee,
  Layers,
  Box,
  Clock,
  Check
} from 'lucide-react';
import { getApiBase, apiRequest } from '../../lib/api';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{ id: string; name: string; slug?: string }>;
  initialProduct?: any;
}

// 5 Core Categories requested by user
export const CORE_CATEGORIES = [
  { id: 'cat_food', name: 'Food & Meals', slug: 'food' },
  { id: 'cat_fruits', name: 'Fresh Produce', slug: 'fruits' },
  { id: 'cat_stationery', name: 'Stationery', slug: 'stationery' },
  { id: 'cat_essentials', name: 'Hostel Essentials', slug: 'essentials' },
  { id: 'cat_other', name: 'Other', slug: 'other' }
];

// Dynamic Subcategories mapped to each Category
export const SUBCATEGORIES_MAP: Record<string, string[]> = {
  'Food & Meals': ['Burgers', 'Pizza', 'Snacks', 'Meals', 'Beverages', 'Desserts', 'Other'],
  'cat_food': ['Burgers', 'Pizza', 'Snacks', 'Meals', 'Beverages', 'Desserts', 'Other'],
  'food': ['Burgers', 'Pizza', 'Snacks', 'Meals', 'Beverages', 'Desserts', 'Other'],

  'Fresh Produce': ['Fruits', 'Vegetables', 'Dairy', 'Other'],
  'cat_fruits': ['Fruits', 'Vegetables', 'Dairy', 'Other'],
  'fruits': ['Fruits', 'Vegetables', 'Dairy', 'Other'],

  'Stationery': ['Notebooks', 'Pens', 'Calculators', 'Art Supplies', 'Other'],
  'cat_stationery': ['Notebooks', 'Pens', 'Calculators', 'Art Supplies', 'Other'],
  'stationery': ['Notebooks', 'Pens', 'Calculators', 'Art Supplies', 'Other'],

  'Hostel Essentials': ['Personal Care', 'Cleaning', 'Daily Essentials', 'Other'],
  'cat_essentials': ['Personal Care', 'Cleaning', 'Daily Essentials', 'Other'],
  'essentials': ['Personal Care', 'Cleaning', 'Daily Essentials', 'Other'],

  'Other': ['General', 'Other'],
  'cat_other': ['General', 'Other'],
  'other': ['General', 'Other']
};

export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  categories = [],
  initialProduct
}: ProductFormModalProps) {
  // 1. PRODUCT INFORMATION
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('cat_food');
  const [subcategory, setSubcategory] = useState('Meals');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // 2. PRICING
  const [price, setPrice] = useState(''); // Original Price / MRP
  const [sellingPrice, setSellingPrice] = useState(''); // Selling Price
  const [unit, setUnit] = useState('piece');

  // 3. CLASSIFICATION
  const [dietaryType, setDietaryType] = useState<'Pure Veg' | 'Non-Veg' | 'Not Applicable'>('Pure Veg');
  const [isPopular, setIsPopular] = useState(false);

  // 4. INVENTORY & LOGISTICS
  const [availability, setAvailability] = useState(true);
  const [stock, setStock] = useState('25');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [deliveryTime, setDeliveryTime] = useState('10-15 mins');
  const [providerId, setProviderId] = useState('');
  const [providersList, setProvidersList] = useState<Array<{ id: string; fullName: string; businessName?: string; serviceCategory: string }>>([]);

  // Image Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Merge available categories: prefer CORE_CATEGORIES, plus any custom categories from backend
  const availableCategories = useMemo(() => {
    const list = [...CORE_CATEGORIES];
    categories.forEach((cat) => {
      if (!list.some((c) => c.id === cat.id || c.name === cat.name)) {
        list.push({ id: cat.id, name: cat.name, slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-') });
      }
    });
    return list;
  }, [categories]);

  // Selected Category Object
  const selectedCategoryObj = useMemo(() => {
    return availableCategories.find((c) => c.id === categoryId || c.name === categoryId) || availableCategories[0];
  }, [availableCategories, categoryId]);

  // Available Subcategories based on Category selection
  const availableSubcategories = useMemo(() => {
    const key = selectedCategoryObj?.name || selectedCategoryObj?.id || 'Food & Meals';
    return SUBCATEGORIES_MAP[key] || SUBCATEGORIES_MAP[selectedCategoryObj?.id] || ['Other'];
  }, [selectedCategoryObj]);

  // Automatically calculate discount percentage: ((Original - Selling) / Original) * 100
  const originalPriceNum = parseFloat(price);
  const sellingPriceNum = parseFloat(sellingPrice);

  const calculatedDiscount = useMemo(() => {
    if (isNaN(originalPriceNum) || originalPriceNum <= 0) return 0;
    if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) return 0;
    if (sellingPriceNum >= originalPriceNum) return 0;
    return Math.max(0, Math.round(((originalPriceNum - sellingPriceNum) / originalPriceNum) * 100));
  }, [originalPriceNum, sellingPriceNum]);

  // Fetch campus providers for vendor assignment
  useEffect(() => {
    if (isOpen) {
      apiRequest('/api/admin/providers')
        .then((res) => {
          if (res.success && res.providers) {
            setProvidersList(res.providers);
            if (!providerId && !initialProduct?.providerId && res.providers.length > 0) {
              setProviderId(res.providers[0].id);
            }
          }
        })
        .catch((err) => {
          console.warn('Failed to load providers list:', err);
        });
    }
  }, [isOpen]);

  // Initialize or reset form values
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      const catId = initialProduct.categoryId || initialProduct.category?.id || 'cat_food';
      setCategoryId(catId);
      setSubcategory(initialProduct.subcategory || 'Meals');
      setDescription(initialProduct.description || '');
      setTags(initialProduct.tags || '');

      const origPrice = initialProduct.originalPrice || initialProduct.price || '';
      const sellPrice = initialProduct.sellingPrice || initialProduct.discountPrice || origPrice;
      setPrice(origPrice.toString());
      setSellingPrice(sellPrice.toString());

      setUnit(initialProduct.unit || 'piece');
      setDietaryType(initialProduct.dietaryType || 'Not Applicable');
      setIsPopular(Boolean(initialProduct.isPopular));
      setAvailability(initialProduct.availability !== undefined ? Boolean(initialProduct.availability) : true);
      setStock(initialProduct.stock?.toString() || '25');
      setLowStockThreshold(initialProduct.lowStockThreshold?.toString() || '5');
      setDeliveryTime(initialProduct.deliveryType || initialProduct.deliveryTime || '10-15 mins');
      setProviderId(initialProduct.providerId || '');
      setImagePreviewUrl(initialProduct.image || initialProduct.primaryImage || null);
    } else {
      setName('');
      setCategoryId('cat_food');
      setSubcategory('Meals');
      setDescription('');
      setTags('');
      setPrice('');
      setSellingPrice('');
      setUnit('plate');
      setDietaryType('Pure Veg');
      setIsPopular(false);
      setAvailability(true);
      setStock('25');
      setLowStockThreshold('5');
      setDeliveryTime('10-15 mins');
      setSelectedFile(null);
      setImagePreviewUrl(null);
      if (providersList.length > 0) {
        setProviderId(providersList[0].id);
      }
    }
    setErrorMsg(null);
  }, [initialProduct, isOpen, providersList]);

  // When Category changes, validate subcategory and default dietary type
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const catObj = availableCategories.find((c) => c.id === newCatId || c.name === newCatId);
    const subcats = SUBCATEGORIES_MAP[catObj?.name || ''] || SUBCATEGORIES_MAP[newCatId] || ['Other'];
    if (!subcats.includes(subcategory)) {
      setSubcategory(subcats[0]);
    }

    // Default dietary type: If non-food (stationery, essentials, other), default to 'Not Applicable'
    if (newCatId === 'cat_stationery' || newCatId === 'cat_essentials' || newCatId === 'cat_other') {
      setDietaryType('Not Applicable');
      setUnit(newCatId === 'cat_stationery' ? 'piece' : 'pack');
    } else if (dietaryType === 'Not Applicable') {
      setDietaryType('Pure Veg');
      setUnit('plate');
    }
  };

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
    setErrorMsg(null);

    // Strict Validations
    if (!name.trim()) {
      setErrorMsg('Product Name is strictly required.');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select a valid Category.');
      return;
    }

    if (isNaN(originalPriceNum) || originalPriceNum <= 0) {
      setErrorMsg('Original Price / MRP must be a positive number greater than 0.');
      return;
    }

    if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
      setErrorMsg('Selling Price must be a positive number greater than 0.');
      return;
    }

    if (sellingPriceNum > originalPriceNum) {
      setErrorMsg('Selling Price cannot be greater than the Original Price / MRP.');
      return;
    }

    if (!providerId) {
      setErrorMsg('Please select which Service Provider / Shop sells this product.');
      return;
    }

    setLoading(true);

    const productPayload = {
      name: name.trim(),
      categoryId,
      subcategory,
      dietaryType,
      description: description.trim(),
      tags: tags.trim(),
      price: originalPriceNum,
      discountPrice: sellingPriceNum < originalPriceNum ? sellingPriceNum : undefined,
      sellingPrice: sellingPriceNum,
      discountPercentage: calculatedDiscount,
      isPopular,
      availability,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      unit,
      deliveryTime,
      providerId
    };

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('nit_token') || sessionStorage.getItem('nit_token')) : null;
      const apiBase = getApiBase();
      const endpoint = initialProduct
        ? `${apiBase}/api/admin/products/${initialProduct.id}`
        : `${apiBase}/api/admin/products`;
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      let body: BodyInit;

      if (selectedFile) {
        const formData = new FormData();
        Object.entries(productPayload).forEach(([key, value]) => {
          if (value !== undefined) formData.append(key, String(value));
        });
        formData.append('image', selectedFile);
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(productPayload);
      }

      const res = await fetch(endpoint, {
        method: initialProduct ? 'PATCH' : 'POST',
        headers,
        body
      });

      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        const text = await res.text().catch(() => '');
        if (!res.ok) {
          throw new Error(
            `Server returned status ${res.status}: ${res.statusText || 'Unable to complete request'}.`
          );
        }
      }

      if (!res.ok || (data && !data.success)) {
        throw new Error(data?.message || `Failed to save product (Status ${res.status})`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while uploading product.');
    } finally {
      setLoading(false);
    }
  };

  const isDietaryDisabled = categoryId === 'cat_stationery' || categoryId === 'cat_essentials';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#17202A] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4F9D32]" />
              <span>{initialProduct ? 'Edit Product Attributes' : 'Add New Campus Product'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              One source of truth: product attributes entered here directly power customer discovery &amp; filters.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ==================================================== */}
          {/* SECTION 1: PRODUCT INFORMATION                        */}
          {/* ==================================================== */}
          <div className="space-y-3.5 border border-slate-200 p-4 sm:p-5 rounded-2xl bg-slate-50/50">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Layers className="w-4 h-4 text-[#4F9D32]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-[#17202A]">
                1. Product Information
              </h4>
            </div>

            {/* Product Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Burger Special, Casio Calculator, Fresh Apples"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:ring-1 focus:ring-[#4F9D32] transition"
                required
              />
            </div>

            {/* Category & Subcategory Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#17202A] focus:outline-none focus:border-[#4F9D32] transition"
                  required
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Controls which primary category tab the product displays under.
                </p>
              </div>

              {/* Subcategory (Dynamic based on selected category) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Subcategory <span className="text-red-500">*</span>
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#17202A] focus:outline-none focus:border-[#4F9D32] transition"
                  required
                >
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Dynamically updated based on {selectedCategoryObj?.name}.
                </p>
              </div>
            </div>

            {/* Product Image Upload & 4:3 Live Preview */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Product Image (Upload / Select with Live Preview)
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:flex-1 border-2 border-dashed border-slate-300 hover:border-[#4F9D32] rounded-2xl p-4 text-center cursor-pointer bg-white hover:bg-emerald-50/40 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-6 h-6 text-[#4F9D32] mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-[#17202A]">Click to select product image</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Live 4:3 preview will display on the right
                  </p>
                </div>

                {/* 4:3 Aspect Ratio Card Preview */}
                <div className="w-36 sm:w-44 shrink-0">
                  <div className="text-[10px] text-slate-500 font-semibold mb-1 text-center">
                    Image Preview
                  </div>
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative flex items-center justify-center">
                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-400 font-medium">No image selected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Product Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ingredients, materials, model specs, or hostel utility..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Search &amp; Discovery Tags <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. burger, spicy, lunch, casio, exam"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] transition"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Comma-separated keywords to match customer searches.
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION 2: PRICING & AUTO-CALCULATED DISCOUNT        */}
          {/* ==================================================== */}
          <div className="space-y-3.5 border border-slate-200 p-4 sm:p-5 rounded-2xl bg-slate-50/50">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <IndianRupee className="w-4 h-4 text-[#4F9D32]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-[#17202A]">
                2. Pricing &amp; Automated Discount
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              {/* Original Price / MRP */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Original Price / MRP (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="200"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] transition"
                  required
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Selling Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="180"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] transition"
                  required
                />
              </div>

              {/* Unit */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#17202A] focus:outline-none focus:border-[#4F9D32] transition"
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
                  <option value="kit">kit</option>
                  <option value="set">set</option>
                  <option value="ream">ream</option>
                </select>
              </div>

              {/* Automatically Calculated Discount */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Calculated Discount
                </label>
                <div className="h-[42px] px-3.5 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800">
                    {calculatedDiscount > 0 ? `${calculatedDiscount}% OFF` : '0% (No Discount)'}
                  </span>
                  {calculatedDiscount >= 10 && (
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded">
                      10% Deals ✓
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * Formula: <span className="font-mono text-slate-700">((Original Price - Selling Price) / Original Price) × 100</span>.
              Calculated automatically. Eligible for <span className="font-bold text-emerald-800">&quot;10% OFF Deals&quot;</span> when discount &ge; 10%.
            </p>
          </div>

          {/* ==================================================== */}
          {/* SECTION 3: CLASSIFICATION                            */}
          {/* ==================================================== */}
          <div className="space-y-3.5 border border-slate-200 p-4 sm:p-5 rounded-2xl bg-slate-50/50">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Tag className="w-4 h-4 text-[#4F9D32]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-[#17202A]">
                3. Classification &amp; Student Placement
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dietary Type Radio Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Dietary Type
                  {isDietaryDisabled && (
                    <span className="text-slate-400 font-normal ml-1.5">(Not applicable for non-food)</span>
                  )}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Pure Veg', label: 'Pure Veg', icon: '🟢', desc: 'Vegetarian' },
                    { id: 'Non-Veg', label: 'Non-Veg', icon: '🔴', desc: 'Chicken/Egg' },
                    { id: 'Not Applicable', label: 'N/A', icon: '⚪', desc: 'Non-food/Other' },
                  ].map((diet) => (
                    <button
                      key={diet.id}
                      type="button"
                      disabled={isDietaryDisabled && diet.id !== 'Not Applicable'}
                      onClick={() => setDietaryType(diet.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        dietaryType === diet.id
                          ? 'border-[#4F9D32] bg-emerald-50 ring-2 ring-emerald-200 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 opacity-90'
                      } ${isDietaryDisabled && diet.id !== 'Not Applicable' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        <span>{diet.icon}</span>
                        <span className="truncate">{diet.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Items marked &quot;Not Applicable&quot; never appear under Veg or Non-Veg filters.
                </p>
              </div>

              {/* Popular on Campus Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Popular on Campus
                </label>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className={`w-5 h-5 ${isPopular ? 'text-amber-500 fill-amber-400' : 'text-slate-300'}`} />
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        {isPopular ? 'Eligible for Popular Section' : 'Standard Catalog Placement'}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Controls appearance under 🔥 POPULAR ON CAMPUS
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPopular(!isPopular)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      isPopular
                        ? 'bg-[#4F9D32] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isPopular ? '[ ON ] Popular' : '[ OFF ] Standard'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION 4: INVENTORY & LOGISTICS                     */}
          {/* ==================================================== */}
          <div className="space-y-3.5 border border-slate-200 p-4 sm:p-5 rounded-2xl bg-slate-50/50">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Box className="w-4 h-4 text-[#4F9D32]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-[#17202A]">
                4. Inventory &amp; Service Provider
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              {/* Availability */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Availability Status
                </label>
                <select
                  value={availability ? 'true' : 'false'}
                  onChange={(e) => setAvailability(e.target.value === 'true')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-[#17202A] focus:outline-none focus:border-[#4F9D32] transition"
                >
                  <option value="true">Available</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#17202A] focus:outline-none focus:border-[#4F9D32] transition"
                  required
                />
              </div>

              {/* Delivery Estimate */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Delivery / Service Time
                </label>
                <input
                  type="text"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="e.g. 10-15 mins"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] transition"
                />
              </div>

              {/* Assigned Service Provider */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Assigned Vendor / Shop <span className="text-red-500">*</span>
                </label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#17202A] focus:outline-none focus:border-[#4F9D32] transition"
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {providersList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || p.businessName} ({p.serviceCategory})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-md shadow-[#4F9D32]/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Saving Product...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialProduct ? 'Update Product Details' : 'Add Product to Marketplace'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
