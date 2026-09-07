'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Hall } from '../../types';
import {
  Shirt,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Camera,
  UploadCloud,
  X,
  Plus,
  Minus,
  AlertCircle,
  Sparkles,
  Info,
  Check
} from 'lucide-react';

const CLOTHING_ITEMS = [
  { type: 'Shirt', defaultPrice: 15, icon: '👔' },
  { type: 'T-Shirt', defaultPrice: 15, icon: '👕' },
  { type: 'Pants', defaultPrice: 20, icon: '👖' },
  { type: 'Jeans', defaultPrice: 25, icon: '👖' },
  { type: 'Kurta', defaultPrice: 20, icon: '👘' },
];

const HOUSEHOLD_ITEMS = [
  { type: 'Bedsheet', defaultPrice: 35, icon: '🛏️' },
  { type: 'Towel', defaultPrice: 15, icon: '🧖' },
  { type: 'Blanket', defaultPrice: 90, icon: '🛋️' },
];

const PICKUP_SLOTS = [
  '08:00 AM - 10:00 AM (Morning Slot)',
  '12:00 PM - 02:00 PM (Noon Slot)',
  '04:00 PM - 06:00 PM (Evening Slot)',
  '07:00 PM - 09:00 PM (Night Slot)',
];

const RETURN_SLOTS = [
  'Tomorrow • 05:00 PM - 07:00 PM (24h Express)',
  'Day After Tomorrow • 05:00 PM - 07:00 PM (Standard 48h)',
  'Weekend Delivery • 10:00 AM - 01:00 PM',
];

interface ClothPhoto {
  id: string;
  dataUrl: string;
  name: string;
  notes: string;
}

export function LaundryBookingDrawer({ onSuccess }: { onSuccess?: (order: any) => void }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [halls, setHalls] = useState<Hall[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    'Shirt': 2,
    'Pants': 2,
    'T-Shirt': 1,
  });

  // Dynamic pricing config from DB
  const [tariff, setTariff] = useState<any>({
    providerPricePerUnit: 15,
    serviceChargePerUnit: 1,
    studentPricePerUnit: 16
  });

  const [itemRates, setItemRates] = useState<Record<string, number>>({
    Shirt: 15,
    'T-Shirt': 15,
    Pants: 20,
    Jeans: 25,
    Kurta: 20,
    Bedsheet: 35,
    Towel: 15,
    Blanket: 90
  });

  const [clothPhotos, setClothPhotos] = useState<ClothPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hallName, setHallName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [pickupDate, setPickupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [pickupTime, setPickupTime] = useState(PICKUP_SLOTS[0]);
  const [returnTime, setReturnTime] = useState(RETURN_SLOTS[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-fill from student profile
  useEffect(() => {
    if (user?.student) {
      if (!hallName) setHallName(user.student.hall?.name || 'Hall 11');
      if (!roomNumber) setRoomNumber(user.student.roomNumber || 'B-304');
    }
  }, [user]);

  // Restore draft if student is returning from /laundry/checkout
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('CB_LAUNDRY_CHECKOUT_DRAFT') || sessionStorage.getItem('laundry_checkout_draft');
      if (stored) {
        const d = JSON.parse(stored);
        if (d.counts && Object.keys(d.counts).length > 0) setCounts(d.counts);
        if (d.hallName) setHallName(d.hallName);
        if (d.roomNumber) setRoomNumber(d.roomNumber);
        if (d.pickupDate) setPickupDate(d.pickupDate);
        if (d.pickupTime) setPickupTime(d.pickupTime);
        if (d.returnTime) setReturnTime(d.returnTime);
        if (d.specialInstructions) setSpecialInstructions(d.specialInstructions);
        if (d.clothPhotos) setClothPhotos(d.clothPhotos);
      }
    } catch {}
  }, []);

  // Fetch dynamic tariff config from DB
  useEffect(() => {
    apiRequest('/api/laundry/pricing')
      .then((res) => {
        if (res.success && res.tariff) {
          setTariff(res.tariff);
          if (res.itemRates && Object.keys(res.itemRates).length > 0) {
            setItemRates(res.itemRates);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch halls from backend
  useEffect(() => {
    apiRequest('/api/campus/halls')
      .then((res) => {
        if (res.success && Array.isArray(res.halls) && res.halls.length > 0) {
          setHalls(res.halls);
          if (!hallName) {
            setHallName(res.halls[0].name);
          }
        }
      })
      .catch(() => {});
  }, []);

  const updateItemCount = (type: string, delta: number) => {
    setCounts((prev) => {
      const current = prev[type] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[type];
        return copy;
      }
      return { ...prev, [type]: updated };
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setClothPhotos((prev) => [
            ...prev,
            {
              id: `cloth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              dataUrl: result,
              name: file.name.replace(/\.[^/.]+$/, ''),
              notes: '',
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeClothPhoto = (id: string) => {
    setClothPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Dynamic Financial Calculations
  const totalGarments = Object.values(counts).reduce((a, b) => a + b, 0);

  const laundryBaseAmount = Object.entries(counts).reduce((sum, [type, qty]) => {
    const rate = itemRates[type] !== undefined ? itemRates[type] : (tariff.providerPricePerUnit || 15);
    return sum + rate * qty;
  }, 0);

  const serviceChargePerUnit = tariff.serviceChargePerUnit || 1;
  const serviceChargeAmount = serviceChargePerUnit * totalGarments;
  const totalOrderAmount = laundryBaseAmount + serviceChargeAmount;

  // Selected itemized list for sticky order summary
  const selectedItemsList = [
    ...CLOTHING_ITEMS.map((item) => ({ ...item, category: 'Clothing' })),
    ...HOUSEHOLD_ITEMS.map((item) => ({ ...item, category: 'Household' }))
  ]
    .filter((item) => (counts[item.type] || 0) > 0)
    .map((item) => {
      const qty = counts[item.type] || 0;
      const unitRate = itemRates[item.type] !== undefined ? itemRates[item.type] : item.defaultPrice;
      const unitStudentPrice = unitRate + serviceChargePerUnit;
      return {
        type: item.type,
        icon: item.icon,
        qty,
        unitRate,
        unitStudentPrice,
        totalItemPrice: unitStudentPrice * qty,
      };
    });

  // Handle Checkout Navigation (Passes complete draft to /laundry/checkout)
  const handleProceedToCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/laundry/checkout';
      return;
    }

    if (totalGarments === 0) {
      setError('Please select at least 1 clothing or household item for pickup.');
      return;
    }

    setError(null);

    const draft = {
      counts,
      totalGarments,
      hallName: hallName || user?.student?.hall?.name || 'Hall 11',
      roomNumber: roomNumber || user?.student?.roomNumber || '101',
      pickupDate,
      pickupTime,
      returnTime,
      specialInstructions,
      clothPhotos,
      tariff,
      itemRates,
      laundryBaseAmount,
      serviceChargeAmount,
      totalOrderAmount,
    };

    try {
      sessionStorage.setItem('CB_LAUNDRY_CHECKOUT_DRAFT', JSON.stringify(draft));
      sessionStorage.setItem('laundry_checkout_draft', JSON.stringify(draft));
    } catch {}

    router.push('/laundry/checkout');
  };

  // Helper to render a compact garment row
  const renderGarmentRow = (item: { type: string; defaultPrice: number; icon: string }) => {
    const qty = counts[item.type] || 0;
    const unitBasePrice = itemRates[item.type] !== undefined ? itemRates[item.type] : item.defaultPrice;
    const unitStudentPrice = unitBasePrice + serviceChargePerUnit;
    const isSelected = qty > 0;

    return (
      <div
        key={item.type}
        className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl border transition-all ${
          isSelected
            ? 'bg-[#f4fbf4] border-[#c8e6c9] shadow-2xs'
            : 'bg-white border-gray-200/80 hover:border-gray-300'
        }`}
      >
        {/* Left: Icon & Garment Specs */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg border border-gray-100 shrink-0">
            {item.icon}
          </div>
          <div className="truncate">
            <span className="font-semibold text-gray-900 text-xs sm:text-sm block truncate">
              {item.type}
            </span>
            <span className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
              <strong className="text-gray-900 font-semibold">₹{unitStudentPrice} / garment</strong>
              <span className="text-gray-400">&bull;</span>
              <span>₹{unitBasePrice} laundry + ₹{serviceChargePerUnit} service charge</span>
            </span>
          </div>
        </div>

        {/* Right: Quantity Stepper */}
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          <button
            type="button"
            onClick={() => updateItemCount(item.type, -1)}
            disabled={qty === 0}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 shadow-2xs"
            aria-label={`Decrease ${item.type}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="w-7 text-center font-bold text-xs sm:text-sm text-gray-900 font-mono">
            {qty}
          </span>

          <button
            type="button"
            onClick={() => updateItemCount(item.type, 1)}
            className="w-8 h-8 rounded-lg border border-[#2e7d32] bg-[#2e7d32] hover:bg-[#1b5e20] text-white flex items-center justify-center text-sm font-bold transition active:scale-95 shadow-2xs"
            aria-label={`Increase ${item.type}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleProceedToCheckout} className="w-full">
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Two-Column Desktop Grid (68% Left / 32% Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* ============================================================ */}
        {/* LEFT COLUMN: BOOK YOUR LAUNDRY (3 SECTIONS ONLY)             */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 space-y-6">

          {/* SECTION ① — SELECT GARMENTS */}
          <section className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#2e7d32] flex items-center justify-center text-xs font-black border border-[#dcedc8]">
                    1
                  </span>
                  <span>SELECT GARMENTS</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose the clothes you want to send.
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                totalGarments > 0
                  ? 'bg-[#f1f8e9] text-[#2e7d32] border-[#c8e6c9]'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {totalGarments} {totalGarments === 1 ? 'item' : 'items'} selected
              </span>
            </div>

            {/* Sub-Category: Clothing */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <Shirt className="w-3.5 h-3.5 text-[#2e7d32]" />
                <span>Clothing</span>
              </div>
              <div className="space-y-2">
                {CLOTHING_ITEMS.map(renderGarmentRow)}
              </div>
            </div>

            {/* Sub-Category: Household */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <span>🛏️</span>
                <span>Household</span>
              </div>
              <div className="space-y-2">
                {HOUSEHOLD_ITEMS.map(renderGarmentRow)}
              </div>
            </div>
          </section>

          {/* SECTION ② — PICKUP & RETURN */}
          <section className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#2e7d32] flex items-center justify-center text-xs font-black border border-[#dcedc8]">
                  2
                </span>
                <span>PICKUP &amp; RETURN</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Where and when should we collect your clothes?
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Row 1: Hostel / Hall & Room Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2e7d32]" /> Hostel / Hall
                  </label>
                  <select
                    value={hallName}
                    onChange={(e) => setHallName(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition shadow-2xs font-medium"
                  >
                    {halls.length > 0 ? (
                      halls.map((h) => (
                        <option key={h.id || h.name} value={h.name}>
                          {h.name} {h.hallNumber ? `(${h.hallNumber})` : ''}
                        </option>
                      ))
                    ) : (
                      Array.from({ length: 14 }).map((_, idx) => (
                        <option key={idx + 1} value={`Hall ${idx + 1}`}>
                          Hall {idx + 1}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. B-304, Room 12"
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition shadow-2xs font-medium"
                  />
                </div>
              </div>

              {/* Row 2: Pickup Date & Pickup Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#2e7d32]" /> Pickup Date
                  </label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition shadow-2xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#2e7d32]" /> Pickup Slot
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition shadow-2xs font-medium"
                  >
                    {PICKUP_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Return Slot */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2e7d32]" /> Return Slot (24–48h Turnaround)
                </label>
                <select
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition shadow-2xs font-medium"
                >
                  {RETURN_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* SECTION ③ — ADDITIONAL DETAILS (OPTIONAL) */}
          <section className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-black">
                  3
                </span>
                <span>ADDITIONAL DETAILS</span>
              </h2>
              <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                Optional
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Garment Photos Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-gray-500" /> Garment Photos (Anti-Loss Protection)
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {clothPhotos.length} attached
                  </span>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-24 rounded-xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center p-3 ${
                    isDragging
                      ? 'border-[#2e7d32] bg-[#f1f8e9]/50'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                  <UploadCloud className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs font-semibold text-[#2e7d32]">
                    + Upload garment photos
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Optional &bull; Cross-checked during room pickup
                  </span>
                </div>

                {clothPhotos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {clothPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0 group"
                      >
                        <img
                          src={photo.dataUrl}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeClothPhoto(photo.id);
                          }}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Special Washing Instructions
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Add special washing instructions (e.g., wash woolen kurta separately, gentle detergent)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition shadow-2xs resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: STICKY ORDER SUMMARY (NO PAYMENT SELECTION)    */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 space-y-4">
            {/* Header */}
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  ORDER SUMMARY
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  {totalGarments} {totalGarments === 1 ? 'garment' : 'garments'}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#2e7d32] animate-pulse" />
            </div>

            {/* Selected Garments Itemized List */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {selectedItemsList.length > 0 ? (
                selectedItemsList.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2 truncate text-gray-700">
                      <span>{item.icon}</span>
                      <span className="font-medium truncate">{item.type}</span>
                      <span className="text-gray-400 font-normal">× {item.qty}</span>
                    </div>
                    <span className="font-semibold text-gray-900 shrink-0 font-mono">
                      ₹{item.totalItemPrice}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  No garments selected yet. Select items on the left to start.
                </div>
              )}
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Laundry charges:</span>
                <span className="font-semibold text-gray-900 font-mono">
                  ₹{laundryBaseAmount}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span>
                  Service charge{' '}
                  <span className="text-[10px] text-gray-400">
                    ({totalGarments} × ₹{serviceChargePerUnit})
                  </span>:
                </span>
                <span className="font-semibold text-gray-900 font-mono">
                  ₹{serviceChargeAmount}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-gray-900">
                <span className="font-bold text-sm">TOTAL:</span>
                <span className="font-black text-xl text-gray-900 font-mono">
                  ₹{totalOrderAmount}
                </span>
              </div>
            </div>

            {/* Logistics Preview */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3 h-3 text-[#2e7d32] shrink-0" />
                <span className="truncate">
                  Pickup: <strong>{pickupDate}</strong> &bull; {pickupTime.split('(')[0]}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">
                  Return: {returnTime.split('(')[0]}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">
                  {hallName || 'Hall 11'}, Room {roomNumber || '101'}
                </span>
              </div>
            </div>

            {/* Proceed to Checkout CTA */}
            <button
              type="submit"
              disabled={totalGarments === 0}
              className="w-full py-3.5 bg-[#2e7d32] hover:bg-[#1b5e20] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>PROCEED TO CHECKOUT (₹{totalOrderAmount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] text-gray-400 text-center leading-tight">
              Payment mode (Razorpay / COD) selected on next screen &bull; Zero Email OTPs
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Checkout Bar (Hidden on Desktop) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-lg lg:hidden flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-gray-500 block">
            {totalGarments} {totalGarments === 1 ? 'garment' : 'garments'} selected
          </span>
          <span className="text-lg font-black text-gray-900 font-mono">
            ₹{totalOrderAmount}
          </span>
        </div>

        <button
          type="submit"
          disabled={totalGarments === 0}
          className="py-2.5 px-5 rounded-xl bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center gap-1.5"
        >
          <span>Review &amp; Pay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
}
