'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LaundryBookingDrawer } from '../../components/laundry/LaundryBookingDrawer';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  Shirt,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  QrCode,
  Clock,
  KeyRound,
  Camera,
  RefreshCw,
  MapPin,
  X
} from 'lucide-react';

export default function LaundryPage() {
  const { user, isAuthenticated } = useAuth();
  const [viewTab, setViewTab] = useState<'BOOK' | 'ORDERS'>('BOOK');
  const [studentOrders, setStudentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<any[] | null>(null);

  const fetchStudentLaundryOrders = async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const res = await apiRequest('/api/laundry/orders');
      if (res.success && Array.isArray(res.orders)) {
        setStudentOrders(res.orders);
      }
    } catch (err) {
      console.warn('Could not fetch student laundry orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudentLaundryOrders();
    }
  }, [isAuthenticated]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-bold border border-[#dcedc8]">
            <Shirt className="w-3.5 h-3.5" /> Doorstep Room Pickup &amp; Return
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
            Automated Campus Laundry <br />
            <span className="text-[#689f38]">Powered by In-App Dual-OTP Protection</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Professional washing, fabric softening, precision steam iron, and room return across all 14 residence halls. Verified on your screen with Zero-Brevo direct OTPs and garment photo tracking.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1.5 text-[#2e7d32]">
              <CheckCircle2 className="w-4 h-4 text-[#689f38]" /> 24h Express Available
            </span>
            <span className="flex items-center gap-1.5 text-[#2e7d32]">
              <ShieldCheck className="w-4 h-4 text-[#689f38]" /> Separate Pickup &amp; Return OTPs
            </span>
            <span className="flex items-center gap-1.5 text-gray-700">
              <QrCode className="w-4 h-4 text-gray-500" /> Anti-Loss Garment Photo Verification
            </span>
          </div>
        </div>

        <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-2xl p-6 text-center space-y-2 min-w-[240px]">
          <div className="text-xs font-bold uppercase text-gray-500 tracking-wider">Campus Subsidized</div>
          <div className="text-3xl font-black text-gray-900">₹15 <span className="text-xs font-normal text-gray-500">/ garment</span></div>
          <div className="text-[11px] text-[#33691e] font-medium">Includes wash, steam press &amp; folding</div>
          <button
            onClick={() => setViewTab('BOOK')}
            className="block w-full py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white font-bold text-xs rounded-lg shadow-sm transition-colors uppercase tracking-wider"
          >
            Book Room Pickup
          </button>
        </div>
      </div>

      {/* Navigation Switcher between Booking Form & My Orders */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-300/60 shadow-xs">
          <button
            onClick={() => setViewTab('BOOK')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
              viewTab === 'BOOK'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-slate-600 hover:text-gray-900'
            }`}
          >
            Schedule New Booking
          </button>
          <button
            onClick={() => {
              setViewTab('ORDERS');
              fetchStudentLaundryOrders();
            }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewTab === 'ORDERS'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-slate-600 hover:text-gray-900'
            }`}
          >
            <span>My Active Laundry</span>
            {studentOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#689f38] text-white text-[10px] font-bold">
                {studentOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* View 1: Booking Form */}
      {viewTab === 'BOOK' && (
        <div id="booking-form" className="max-w-3xl mx-auto">
          <LaundryBookingDrawer
            onSuccess={() => {
              fetchStudentLaundryOrders();
              setViewTab('ORDERS');
            }}
          />
        </div>
      )}

      {/* View 2: Active Laundry Orders & In-Screen OTP Cards */}
      {viewTab === 'ORDERS' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">Your Campus Laundry Bookings</h2>
              <p className="text-xs text-slate-500">Live wash cycle stage tracking &amp; verified doorstep return OTPs</p>
            </div>
            <button
              onClick={fetchStudentLaundryOrders}
              className="inline-flex items-center gap-1 text-xs text-[#2e7d32] font-semibold hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingOrders ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-[#689f38]/30 border-t-[#689f38] rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading laundry bookings...</p>
            </div>
          ) : studentOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
              <Shirt className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">No Active Laundry Orders</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You do not have any pending laundry bookings. Book a room pickup slot to have your clothes professionally washed and steam ironed.
              </p>
              <button
                onClick={() => setViewTab('BOOK')}
                className="mt-2 px-4 py-2 bg-[#689f38] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Book Now
              </button>
            </div>
          ) : (
            studentOrders.map((ord: any) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4 transition hover:border-[#689f38]/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        #{ord.orderNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : ['READY', 'DELIVERY_SCHEDULED'].includes(ord.status)
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {ord.hallName}, Room {ord.roomNumber} &bull; Scheduled: {ord.preferredPickupTime}
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <div className="text-xs text-slate-400">Total Bill</div>
                    <div className="text-base font-black text-gray-900">
                      ₹{ord.finalPrice || ord.estimatedPrice}
                    </div>
                  </div>
                </div>

                {/* Items Summary & Photos */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-700">
                    <span className="font-semibold text-gray-900">Garments: </span>
                    {ord.items && ord.items.length > 0
                      ? ord.items.map((i: any) => `${i.quantity}x ${i.itemType}`).join(', ')
                      : 'Laundry Bag'}
                  </div>

                  {ord.photos && ord.photos.length > 0 && (
                    <button
                      onClick={() => setSelectedPhotoModal(ord.photos)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200 hover:bg-indigo-100 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{ord.photos.length} Clothes Photos</span>
                    </button>
                  )}
                </div>

                {/* Dual-OTP In-Screen Handover Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Step 1: Pickup OTP */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Stage 1: Pickup Verification Code
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xl text-slate-900 tracking-widest">
                        {ord.pickupOtp || '------'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-700">
                        {ord.status === 'REQUESTED' ? 'Pending Pickup' : 'Collected ✓'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Provided to laundry personnel upon room clothes pickup.
                    </p>
                  </div>

                  {/* Step 2: Return OTP */}
                  <div
                    className={`rounded-xl p-3.5 space-y-1 border transition ${
                      ['READY', 'DELIVERY_SCHEDULED', 'CLOTHES_COLLECTED', 'WASHING', 'IRONING'].includes(ord.status)
                        ? 'bg-purple-50/80 border-purple-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-purple-700 tracking-wider flex items-center gap-1">
                      <KeyRound className="w-3 h-3" />
                      Stage 2: Your Return Delivery OTP
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xl text-purple-900 tracking-widest">
                        {ord.returnOtp || '------'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-200 text-purple-800">
                        {ord.status === 'COMPLETED' ? 'Delivered ✓' : 'Share at Door'}
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-900/80 font-medium">
                      Share this code with laundry personnel when receiving clean clothes.
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Garment Photos Viewer Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#689f38]" />
                <h3 className="font-bold text-sm text-gray-900">Your Uploaded Garment Photos</h3>
              </div>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 grid grid-cols-2 gap-3">
              {selectedPhotoModal.map((p: any, idx: number) => (
                <div key={p.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  <div className="aspect-square bg-slate-900/5">
                    <img
                      src={p.googleDriveUrl || p.url}
                      alt={p.description || `Cloth ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 bg-white text-[11px] font-medium text-slate-700">
                    {p.description || `Garment verification #${idx + 1}`}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

