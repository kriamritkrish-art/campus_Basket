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
  AlertCircle
} from 'lucide-react';

const LAUNDRY_RATES = [
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

  const estimatedTotal = Object.entries(counts).reduce((sum, [type, qty]) => {
    const rate = LAUNDRY_RATES.find((r) => r.type === type)?.price || 20;
    return sum + rate * qty;
  }, 0);

  const totalGarments = Object.values(counts).reduce((a, b) => a + b, 0);

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

        {/* Dual-OTP Safety Banner */}
        <div className="bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-2xl p-5 text-left space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-[#2e7d32] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#689f38]" /> Dual-OTP Verified Handover
          </div>

          <div className="space-y-3">
            <div className="bg-[#f1f8e9]/80 p-3.5 rounded-xl border border-[#dcedc8]">
              <div className="text-[11px] font-bold text-[#33691e] uppercase tracking-wide">
                Step 1: Your Room Pickup OTP
              </div>
              <div className="text-3xl font-mono font-black text-[#1b5e20] tracking-widest mt-1">
                {bookingSuccess.pickupOtp}
              </div>
              <div className="text-[11px] text-gray-600 mt-1 leading-snug">
                Share this 6-digit PIN with the laundry personnel at your hostel door upon clothes handover.
              </div>
            </div>

            <div className="bg-gray-50/90 p-3.5 rounded-xl border border-gray-200">
              <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                Step 2: Return Delivery OTP
              </div>
              <div className="text-xs font-semibold text-gray-600 mt-1">
                Active upon clean clothes return. Share only after inspecting washed &amp; ironed garments.
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Cloth Photos Confirmation Gallery */}
        {clothPhotos.length > 0 && (
          <div className="bg-white/70 backdrop-blur-md border border-gray-200/80 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
              <span className="flex items-center gap-1.5 text-[#2e7d32]">
                <Camera className="w-4 h-4 text-[#689f38]" /> {clothPhotos.length} Cloth Photos Attached
              </span>
              <span className="text-[10px] text-gray-500 font-normal">Stored in Token QR</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {clothPhotos.map((photo) => (
                <div key={photo.id} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
                  <img src={photo.dataUrl} alt={photo.name} className="w-full h-full object-cover" />
                  {photo.notes && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white p-1 truncate text-center">
                      {photo.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-gray-600 pt-1 border-t border-gray-200">
          <span>Estimated Total ({totalGarments} items):</span>
          <span className="text-xl font-black text-gray-900">₹{bookingSuccess.estimatedPrice}</span>
        </div>

        <button
          onClick={() => (window.location.href = '/dashboard')}
          className="w-full py-3.5 bg-[#689f38] hover:bg-[#5b8c30] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
        >
          Track in Student Dashboard
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleBook}
      className="bg-white/70 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl border border-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] space-y-8 relative overflow-hidden"
    >
      {/* Subtle modern ambient background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#689f38]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Modern Transparent Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f1f8e9] text-[#689f38] border border-[#dcedc8] flex items-center justify-center shadow-sm shrink-0">
            <Shirt className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Express Campus Laundry
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-[10px] font-extrabold uppercase border border-[#dcedc8]">
                Dual-OTP
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Automated wash, fabric softening &amp; steam iron with room-to-room pickup across Halls 1–14
            </p>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Subsidized Tariff</div>
          <div className="text-lg font-black text-gray-900">₹15 <span className="text-xs font-normal text-gray-500">/ garment</span></div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. SELECT GARMENTS & LINEN (Minimalist Modern Transparent Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#689f38] flex items-center justify-center text-[10px] font-black border border-[#dcedc8]">
              1
            </span>
            <span>Select Garments &amp; Linen</span>
          </label>
          <span className="text-xs text-gray-500 font-medium">
            {totalGarments} items selected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LAUNDRY_RATES.map((item) => {
            const currentQty = counts[item.type] || 0;
            const isSelected = currentQty > 0;

            return (
              <div
                key={item.type}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#f1f8e9]/80 border-[#689f38] shadow-md ring-1 ring-[#689f38]/20'
                    : 'bg-white/60 hover:bg-white/90 border-gray-200/70 hover:border-[#689f38]/50 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start text-xs font-bold">
                  <span className="text-gray-900 flex items-center gap-1.5">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.type}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/80 border border-gray-200/70 text-[#2e7d32] font-black text-[11px]">
                    ₹{item.price}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 bg-white/90 border border-gray-200/80 rounded-xl p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => updateItemCount(item.type, -1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 font-bold text-sm transition-colors"
                    aria-label={`Decrease ${item.type}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs sm:text-sm font-black text-gray-900 font-mono">
                    {currentQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateItemCount(item.type, 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#689f38] hover:text-white hover:bg-[#689f38] font-bold text-sm transition-colors"
                    aria-label={`Increase ${item.type}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CLOTH VERIFICATION PHOTOS (ANTI-LOSS PROTECTION FEATURE) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#689f38] flex items-center justify-center text-[10px] font-black border border-[#dcedc8]">
                2
              </span>
              <span>Upload Cloth Photos (Anti-Loss Protection)</span>
            </label>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Take photos of your clothes or bag so your items are verified with zero chance of loss or mismatch.
            </p>
          </div>

          {clothPhotos.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-extrabold border border-[#dcedc8]">
              {clothPhotos.length} {clothPhotos.length === 1 ? 'Photo' : 'Photos'} Attached
            </span>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {/* Modern Transparent Drag & Drop Upload Zone */}
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
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDragging
              ? 'border-[#689f38] bg-[#f1f8e9]/80 shadow-md'
              : 'border-gray-300/80 hover:border-[#689f38] bg-white/50 hover:bg-white/80 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-11 h-11 rounded-2xl bg-[#f1f8e9] text-[#689f38] flex items-center justify-center shrink-0 border border-[#dcedc8]">
              <Camera className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900">
                Click or Drop Photos of Your Clothes Here
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Take pictures with your mobile camera or upload from gallery (individual garments or overall bag spread)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-[#689f38]" />
              <span>Add Photos</span>
            </button>
          </div>
        </div>

        {/* Uploaded Photos Grid Preview with Tags */}
        {clothPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
            {clothPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/80 p-2.5 shadow-sm hover:shadow-md transition-shadow relative space-y-2 group"
              >
                {/* Delete Photo Button */}
                <button
                  type="button"
                  onClick={() => removeClothPhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow-sm transition-opacity z-10"
                  title="Remove cloth photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Thumbnail */}
                <div className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-white text-[9px] font-bold">
                    #{index + 1}
                  </div>
                </div>

                {/* Cloth Name / Label Input */}
                <div>
                  <input
                    type="text"
                    placeholder="e.g. Blue Levi's jeans, Zara shirt..."
                    value={photo.notes}
                    onChange={(e) => updatePhotoNote(photo.id, e.target.value)}
                    className="w-full bg-white/90 border border-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#689f38]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. RESIDENCE HALL & ROOM DETAILS */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#689f38] flex items-center justify-center text-[10px] font-black border border-[#dcedc8]">
            3
          </span>
          <span>Residence Hall &amp; Room Number</span>
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

      {/* 4. PICKUP DATE & SLOTS */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#f1f8e9] text-[#689f38] flex items-center justify-center text-[10px] font-black border border-[#dcedc8]">
            4
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

      {/* 5. SPECIAL WASHING INSTRUCTIONS */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-bold text-gray-700 block">
          Special Washing Instructions &amp; Fabric Notes (Optional)
        </label>
        <textarea
          rows={2}
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="e.g. Mild detergent only for woolen kurta, dark shirts separately, stain on white collar..."
          className="w-full bg-white/80 backdrop-blur-md border border-gray-200/80 hover:border-gray-300 focus:border-[#689f38] rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#689f38]/20 transition-all shadow-sm resize-none"
        />
      </div>

      {/* MODERN TRANSPARENT SUMMARY & CONFIRMATION BAR */}
      <div className="pt-4 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-gray-600">
            <span>
              Selected: <strong className="text-gray-900">{totalGarments} garments</strong>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-[#2e7d32] font-bold">
              📸 {clothPhotos.length} {clothPhotos.length === 1 ? 'photo' : 'photos'} for verification
            </span>
          </div>

          <div className="text-2xl font-black text-gray-900 tracking-tight flex items-baseline gap-1.5 justify-center sm:justify-start">
            <span>₹{estimatedTotal}</span>
            <span className="text-xs font-normal text-gray-500">
              (Includes automated wash, softener &amp; steam press)
            </span>
          </div>
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
              <span>Confirm Laundry Pickup</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

