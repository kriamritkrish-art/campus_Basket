'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Trash2,
  Sparkles,
  Plus,
  Minus,
  Image as ImageIcon,
  AlertCircle,
  CreditCard,
  Banknote,
  Info
} from 'lucide-react';

const DEFAULT_RATES = [
  { type: 'Shirt', price: 15, icon: '👔' },
  { type: 'T-Shirt', price: 15, icon: '👕' },
  { type: 'Pants', price: 20, icon: '👖' },
  { type: 'Jeans', price: 25, icon: '👖' },
  { type: 'Kurta', price: 20, icon: '👘' },
  { type: 'Bedsheet', price: 35, icon: '🛏️' },
  { type: 'Towel', price: 15, icon: '🧖' },
  { type: 'Blanket', price: 90, icon: '🛋️' },
];

interface ClothPhoto {
  id: string;
  dataUrl: string;
  name: string;
  notes: string;
}

export function LaundryBookingDrawer({ onSuccess }: { onSuccess?: (order: any) => void }) {
  const { user, isAuthenticated } = useAuth();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    'Shirt': 2,
    'Pants': 2,
    'T-Shirt': 1,
  });

  // Dynamic pricing & hero config from backend DB
  const [tariff, setTariff] = useState<any>({
    heroTitle: 'Express Campus Laundry',
    heroSubtitle: 'Automated wash, fabric softening & steam iron with room-to-room pickup across Halls 1–14',
    tariffTag: 'DUAL-OTP',
    tariffBadge: 'SUBSIDIZED TARIFF',
    unitDisplayName: 'per garment',
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
  const [codEnabled, setCodEnabled] = useState(true);

  // Payment Method: ONLINE vs COD
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');

  const [clothPhotos, setClothPhotos] = useState<ClothPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hallName, setHallName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [pickupDate, setPickupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [pickupTime, setPickupTime] = useState('08:00 AM - 10:00 AM');
  const [returnTime, setReturnTime] = useState('05:00 PM - 07:00 PM');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill from student profile
  useEffect(() => {
    if (user?.student) {
      setHallName(user.student.hall?.name || 'Hall 11');
      setRoomNumber(user.student.roomNumber || 'B-304');
    }
  }, [user]);

  // Fetch dynamic tariff config from DB
  useEffect(() => {
    apiRequest('/api/laundry/pricing')
      .then((res) => {
        if (res.success && res.tariff) {
          setTariff(res.tariff);
          if (res.itemRates && Object.keys(res.itemRates).length > 0) {
            setItemRates(res.itemRates);
          }
          if (res.policy) {
            setCodEnabled(res.policy.codEnabled !== false);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch halls from backend
  useEffect(() => {
    apiRequest('/api/campus/halls')
      .then((res) => {
        if (res.success && res.halls) {
          setHalls(res.halls);
          if (!hallName && res.halls.length > 0) {
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

  const updatePhotoNote = (id: string, notes: string) => {
    setClothPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, notes } : p))
    );
  };

  // Financial calculations
  const totalGarments = Object.values(counts).reduce((a, b) => a + b, 0);

  const laundryBaseAmount = Object.entries(counts).reduce((sum, [type, qty]) => {
    const rate = itemRates[type] !== undefined ? itemRates[type] : (tariff.providerPricePerUnit || 15);
    return sum + rate * qty;
  }, 0);

  const serviceChargeAmount = (tariff.serviceChargePerUnit || 1) * totalGarments;
  const totalOrderAmount = laundryBaseAmount + serviceChargeAmount;

  // COD Rule Breakdown:
  // In COD mode: student pays serviceChargeAmount online in advance as booking confirmation;
  // laundryBaseAmount is collected in cash by provider at doorstep upon delivery.
  const payOnlineNow = paymentMethod === 'ONLINE' ? totalOrderAmount : serviceChargeAmount;
  const payOnDelivery = paymentMethod === 'ONLINE' ? 0 : laundryBaseAmount;

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/laundry/book';
      return;
    }

    if (totalGarments === 0) {
      setError('Please select at least 1 clothing item for pickup.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const items = Object.entries(counts).map(([type, quantity]) => ({
      itemType: type,
      quantity,
    }));

    try {
      const res = await apiRequest('/api/laundry/orders', {
        method: 'POST',
        body: JSON.stringify({
          hallName,
          roomNumber,
          pickupDate,
          preferredPickupTime: pickupTime,
          preferredReturnTime: returnTime,
          specialInstructions,
          items,
          paymentMethod,
          clothPhotos: clothPhotos.map((p) => p.dataUrl),
          photos: clothPhotos.map((p) => ({
            url: p.dataUrl,
            description: p.notes || p.name,
          })),
        }),
      });

      if (res.success) {
        setBookingSuccess(res.laundryOrder);
        if (onSuccess) onSuccess(res.laundryOrder);
      } else {
        setError(res.message || 'Failed to book laundry service.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with laundry dispatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modern Transparent Booking Success Screen
  if (bookingSuccess) {
    return (
      <div className="bg-white/80 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl border border-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-center max-w-xl mx-auto space-y-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#689f38]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 bg-[#f1f8e9] text-[#689f38] rounded-2xl flex items-center justify-center mx-auto border border-[#dcedc8] shadow-sm">
          <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-extrabold uppercase tracking-wider border border-[#dcedc8]">
            Booking Confirmed
          </span>
          <h3 className="text-2xl font-black text-gray-900 mt-3 tracking-tight">
            Order #{bookingSuccess.orderNumber}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
            Campus laundry team dispatched. Scheduled pickup at{' '}
            <strong className="text-gray-900">{hallName}, Room {roomNumber}</strong>.
          </p>
        </div>

        {/* Financial Separation Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2">
            Payment &amp; Financial Breakdown
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Laundry Service (Base Amount):</span>
            <span className="font-semibold text-slate-900">₹{bookingSuccess.laundryBaseAmount || laundryBaseAmount}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Campus Basket Service Charge (₹{tariff.serviceChargePerUnit || 1}/garment):</span>
            <span className="font-semibold text-slate-900">₹{bookingSuccess.serviceChargeAmount || serviceChargeAmount}</span>
          </div>
          <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
            <span>Total Order Value:</span>
            <span>₹{bookingSuccess.totalAmount || totalOrderAmount}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
            <span className="text-[#2e7d32] font-bold">Paid Online (Advance):</span>
            <span className="font-black text-[#2e7d32]">₹{bookingSuccess.onlinePaidAmount || payOnlineNow}</span>
          </div>
          {(bookingSuccess.codAmount > 0 || payOnDelivery > 0) && (
            <div className="flex justify-between text-amber-800 bg-amber-50 p-2 rounded-lg font-bold border border-amber-200">
              <span>Cash on Delivery (Pay to Provider):</span>
              <span>₹{bookingSuccess.codAmount || payOnDelivery}</span>
            </div>
          )}
        </div>

        {/* Deferred Dual-OTP Notice */}
        <div className="bg-[#f1f8e9]/90 border border-[#dcedc8] rounded-2xl p-4 text-left space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-[#2e7d32] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#689f38]" /> Direct In-App Dual-OTP Protection
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your <strong>Pickup OTP</strong> will be generated directly on your Student Dashboard screen the moment your laundry provider accepts your order. Zero email OTP dispatch.
          </p>
        </div>

        <button
          onClick={() => (window.location.href = '/laundry')}
          className="w-full py-3.5 bg-[#689f38] hover:bg-[#5b8c30] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
        >
          View in Laundry Dashboard
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleBook}
      className="bg-white/70 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl border border-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] space-y-8 relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#689f38]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dynamic Header & Hero Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f1f8e9] text-[#689f38] border border-[#dcedc8] flex items-center justify-center shadow-sm shrink-0">
            <Shirt className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                {tariff.heroTitle || 'Express Campus Laundry'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-[10px] font-extrabold uppercase border border-[#dcedc8]">
                {tariff.tariffTag || 'DUAL-OTP'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {tariff.heroSubtitle || 'Professional wash, fabric softening & steam iron with hostel doorstep collection'}
            </p>
          </div>
        </div>

        <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-xl px-4 py-2 text-right self-start sm:self-auto">
          <div className="text-[10px] uppercase font-bold text-[#2e7d32] tracking-wider">
            {tariff.tariffBadge || 'SUBSIDIZED TARIFF'}
          </div>
          <div className="text-lg font-black text-gray-900">
            ₹{tariff.providerPricePerUnit || 15}{' '}
            <span className="text-[11px] font-normal text-gray-500">
              +{tariff.serviceChargePerUnit || 1} SC / garment
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. SELECT GARMENT QUANTITIES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#689f38] flex items-center justify-center text-[10px] font-black border border-[#dcedc8]">
              1
            </span>
            <span>Select Garments for Pickup</span>
          </label>
          <span className="text-xs font-bold text-[#2e7d32]">
            Total: {totalGarments} {totalGarments === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DEFAULT_RATES.map((item) => {
            const currentCount = counts[item.type] || 0;
            const unitBasePrice = itemRates[item.type] !== undefined ? itemRates[item.type] : item.price;
            const unitTotalStudentPrice = unitBasePrice + (tariff.serviceChargePerUnit || 1);

            return (
              <div
                key={item.type}
                className={`p-3.5 rounded-2xl border transition-all ${
                  currentCount > 0
                    ? 'bg-white border-[#689f38] shadow-sm ring-1 ring-[#689f38]/20'
                    : 'bg-white/60 border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="text-right">
                    <span className="text-xs font-black text-gray-900">
                      ₹{unitTotalStudentPrice}
                    </span>
                    <div className="text-[9px] text-gray-400">
                      (₹{unitBasePrice} + ₹{tariff.serviceChargePerUnit || 1})
                    </div>
                  </div>
                </div>

                <div className="font-bold text-xs text-gray-800 truncate mb-2">
                  {item.type}
                </div>

                <div className="flex items-center justify-between bg-slate-100/80 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => updateItemCount(item.type, -1)}
                    disabled={currentCount === 0}
                    className="w-7 h-7 rounded-lg bg-white disabled:opacity-30 text-gray-700 flex items-center justify-center shadow-xs hover:bg-gray-50 active:scale-95 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="font-black text-xs text-gray-900 w-6 text-center">
                    {currentCount}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateItemCount(item.type, 1)}
                    className="w-7 h-7 rounded-lg bg-[#689f38] text-white flex items-center justify-center shadow-xs hover:bg-[#5b8c30] active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. PAYMENT METHOD SELECTION */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#689f38] flex items-center justify-center text-[10px] font-black border border-[#dcedc8]">
            2
          </span>
          <span>Payment Method</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Online Payment */}
          <div
            onClick={() => setPaymentMethod('ONLINE')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              paymentMethod === 'ONLINE'
                ? 'bg-[#f1f8e9]/80 border-[#689f38] ring-2 ring-[#689f38]/20 shadow-sm'
                : 'bg-white/70 border-gray-200/80 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <CreditCard className={`w-4 h-4 ${paymentMethod === 'ONLINE' ? 'text-[#2e7d32]' : 'text-gray-500'}`} />
                <span className="font-bold text-xs text-gray-900">Pay Online (Full)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Recommended
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-snug">
              Pay total order amount (₹{totalOrderAmount}) now via UPI / Net Banking. Seamless room delivery without cash hassles.
            </p>
          </div>

          {/* COD Option */}
          {codEnabled && (
            <div
              onClick={() => setPaymentMethod('COD')}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                paymentMethod === 'COD'
                  ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white/70 border-gray-200/80 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Banknote className={`w-4 h-4 ${paymentMethod === 'COD' ? 'text-amber-700' : 'text-gray-500'}`} />
                  <span className="font-bold text-xs text-gray-900">Cash on Delivery (COD)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Advance SC Required
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">
                Pay Service Charge (<strong>₹{serviceChargeAmount}</strong>) online now to lock booking slot; pay laundry base (<strong>₹{laundryBaseAmount}</strong>) in cash to provider upon delivery.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. CLOTH PHOTOS FOR ANTI-LOSS VERIFICATION */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#689f38] flex items-center justify-center text-[10px] font-black border border-[#dcedc8]">
              3
            </span>
            <span>Upload Garment Photos (Anti-Loss Protection)</span>
          </label>
          <span className="text-[11px] text-gray-500">Optional but recommended</span>
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
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            isDragging
              ? 'border-[#689f38] bg-[#f1f8e9]/50'
              : 'border-gray-200 hover:border-gray-300 bg-white/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <div className="text-xs font-bold text-gray-800">
            Click to upload or drag &amp; drop photos of your clothes
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            Photos are saved to your order QR code so the dhobi can inspect garments at pickup and return.
          </div>
        </div>

        {clothPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {clothPhotos.map((p) => (
              <div key={p.id} className="relative rounded-xl border border-gray-200 bg-white p-2 space-y-1">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <input
                  type="text"
                  placeholder="Note (e.g. blue jeans)"
                  value={p.notes}
                  onChange={(e) => updatePhotoNote(p.id, e.target.value)}
                  className="w-full text-[10px] px-1.5 py-0.5 border border-gray-200 rounded"
                />
                <button
                  type="button"
                  onClick={() => removeClothPhoto(p.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. RESIDENCE HALL & ROOM */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#689f38] flex items-center justify-center text-[10px] font-black border border-[#dcedc8]">
            4
          </span>
          <span>Hostel Hall &amp; Room Details</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Hostel Hall
            </label>
            <select
              value={hallName}
              onChange={(e) => setHallName(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-md border border-gray-200/80 hover:border-gray-300 focus:border-[#689f38] rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#689f38]/20 transition-all shadow-sm"
              required
            >
              {halls.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name}
                </option>
              ))}
              {halls.length === 0 && (
                <>
                  <option value="Hall 1">Hall 1</option>
                  <option value="Hall 2">Hall 2</option>
                  <option value="Hall 3">Hall 3</option>
                  <option value="Hall 4">Hall 4</option>
                  <option value="Hall 5">Hall 5</option>
                  <option value="Hall 7">Hall 7</option>
                  <option value="Hall 8">Hall 8</option>
                  <option value="Hall 9">Hall 9</option>
                  <option value="Hall 10">Hall 10</option>
                  <option value="Hall 11">Hall 11</option>
                  <option value="Hall 12">Hall 12</option>
                  <option value="Hall 13">Hall 13</option>
                  <option value="Hall 14">Hall 14</option>
                  <option value="Mother Teresa Hall">Mother Teresa Hall</option>
                  <option value="Sister Nivedita Hall">Sister Nivedita Hall</option>
                  <option value="Gargi Hall">Gargi Hall</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Room Number &amp; Wing
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. B-304 / Ground Wing Common Room"
              className="w-full bg-white/80 backdrop-blur-md border border-gray-200/80 hover:border-gray-300 focus:border-[#689f38] rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#689f38]/20 transition-all shadow-sm"
              required
            />
          </div>
        </div>
      </div>

      {/* 5. PICKUP DATE & SLOTS */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#689f38] flex items-center justify-center text-[10px] font-black border border-[#dcedc8]">
            5
          </span>
          <span>Pickup &amp; Return Slots</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Pickup Date
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-md border border-gray-200/80 hover:border-gray-300 focus:border-[#689f38] rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#689f38]/20 transition-all shadow-sm"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Preferred Pickup Slot
            </label>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-md border border-gray-200/80 hover:border-gray-300 focus:border-[#689f38] rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#689f38]/20 transition-all shadow-sm"
            >
              <option value="08:00 AM - 10:00 AM">Morning (08:00 AM - 10:00 AM)</option>
              <option value="12:00 PM - 02:00 PM">Noon (12:00 PM - 02:00 PM)</option>
              <option value="05:00 PM - 07:00 PM">Evening (05:00 PM - 07:00 PM)</option>
              <option value="08:00 PM - 10:00 PM">Night (08:00 PM - 10:00 PM)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Preferred Return Slot
            </label>
            <select
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-md border border-gray-200/80 hover:border-gray-300 focus:border-[#689f38] rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#689f38]/20 transition-all shadow-sm"
            >
              <option value="Next Day 05:00 PM">Next Day Evening (24h Express)</option>
              <option value="Next Day 08:00 PM">Next Day Night (24h Express)</option>
              <option value="48 Hours Delivery">Standard 48 Hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. SPECIAL INSTRUCTIONS */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-bold text-gray-700 block">
          Special Washing Instructions &amp; Fabric Notes (Optional)
        </label>
        <textarea
          rows={2}
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="e.g. Mild detergent only for woolen kurta, dark shirts separately..."
          className="w-full bg-white/80 backdrop-blur-md border border-gray-200/80 hover:border-gray-300 focus:border-[#689f38] rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#689f38]/20 transition-all shadow-sm resize-none"
        />
      </div>

      {/* TRANSPARENT CHECKOUT & FINANCIAL SEPARATION SUMMARY */}
      <div className="pt-4 border-t border-gray-200/80 bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0 sm:pr-4">
            <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Transparent Tariff Breakdown
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Laundry Service Charges:</span>
              <span className="font-semibold text-slate-900">₹{laundryBaseAmount}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Campus Basket Service Charge:</span>
              <span className="font-semibold text-slate-900">
                ₹{serviceChargeAmount}{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  ({totalGarments} × ₹{tariff.serviceChargePerUnit || 1})
                </span>
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Order Value:</span>
              <span className="text-sm">₹{totalOrderAmount}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-black uppercase text-[#2e7d32] tracking-wider">
              Payment Schedule ({paymentMethod})
            </div>
            <div className="flex justify-between font-bold text-[#2e7d32]">
              <span>Pay Online Now:</span>
              <span className="text-base font-black">₹{payOnlineNow}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Pay to Provider on Delivery:</span>
              <span className="font-bold text-slate-900">₹{payOnDelivery}</span>
            </div>
            <div className="text-[10px] text-slate-500 pt-1">
              {paymentMethod === 'ONLINE'
                ? 'Full amount paid safely via campus escrow.'
                : 'Campus Basket service charge paid online to confirm slot; provider base paid on delivery.'}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            In-App Dual-OTP enabled &bull; No email notifications &bull; Direct room pickup
          </div>

          <button
            type="submit"
            disabled={isSubmitting || totalGarments === 0}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#689f38] to-[#7cb342] hover:from-[#5b8c30] hover:to-[#689f38] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {isSubmitting ? (
              <span>Scheduling Pickup...</span>
            ) : (
              <>
                <span>
                  Confirm &amp; Pay ₹{payOnlineNow} {paymentMethod === 'COD' ? '(Advance)' : ''}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
