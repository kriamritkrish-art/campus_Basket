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
  X,
  CreditCard,
  Banknote,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';

const ORDER_STEPS = [
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
  { key: 'CLOTHES_COLLECTED', label: 'Collected' },
  { key: 'WASHING', label: 'Washing' },
  { key: 'IRONING', label: 'Ironing' },
  { key: 'READY', label: 'Ready' },
  { key: 'DELIVERY_SCHEDULED', label: 'Out for Delivery' },
  { key: 'COMPLETED', label: 'Delivered' }
];

export default function LaundryPage() {
  const { user, isAuthenticated } = useAuth();
  const [viewTab, setViewTab] = useState<'BOOK' | 'ORDERS'>('BOOK');
  const [studentOrders, setStudentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<any[] | null>(null);
  const [justBooked, setJustBooked] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  // Dynamic tariff from DB
  const [tariff, setTariff] = useState<any>({
    heroTitle: 'Express Campus Laundry',
    heroSubtitle: 'Professional washing, fabric softening, precision steam iron, and room return across all 14 residence halls. Verified on your screen with Zero-Brevo direct OTPs and garment photo tracking.',
    tariffTag: 'DUAL-OTP',
    tariffBadge: 'SUBSIDIZED TARIFF',
    providerPricePerUnit: 15,
    serviceChargePerUnit: 1,
    studentPricePerUnit: 16
  });

  const fetchTariff = async () => {
    try {
      const res = await apiRequest('/api/laundry/pricing');
      if (res.success && res.tariff) {
        setTariff(res.tariff);
      }
    } catch {}
  };

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
    fetchTariff();
    if (isAuthenticated) {
      fetchStudentLaundryOrders();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('booked') === 'true') {
        setJustBooked(true);
        setViewTab('ORDERS');
        fetchStudentLaundryOrders();
      }
    }
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator?.clipboard && text && text !== '------') {
      navigator.clipboard.writeText(text);
      setCopiedOtp(label);
      setTimeout(() => setCopiedOtp(null), 2500);
    }
  };

  const getStepIndex = (status: string) => {
    const idx = ORDER_STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Booking Success Notification Banner */}
      {justBooked && (
        <div className="bg-gradient-to-r from-[#e8f5e9] to-[#f1f8e9] border border-[#a5d6a7] p-5 rounded-3xl shadow-sm flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2e7d32] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <span>Laundry Booking Confirmed &amp; Dispatched!</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2e7d32] text-white">
                  Verified via Razorpay
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Your payment has been successfully recorded. Doorstep pickup is scheduled. Please share your <strong>In-App Pickup OTP</strong> with the delivery agent when they arrive at your hostel room.
              </p>
            </div>
          </div>
          <button
            onClick={() => setJustBooked(false)}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Dynamic Hero Header Controlled by Admin */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-bold border border-[#dcedc8]">
            <Shirt className="w-3.5 h-3.5" /> Doorstep Room Pickup &amp; Return
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
            {tariff.heroTitle || 'Express Campus Laundry'} <br />
            <span className="text-[#689f38]">Powered by In-App Dual-OTP Protection</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {tariff.heroSubtitle || 'Professional washing, fabric softening, precision steam iron, and room return across all 14 residence halls.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1.5 text-[#2e7d32]">
              <CheckCircle2 className="w-4 h-4 text-[#689f38]" /> 24h Express Available
            </span>
            <span className="flex items-center gap-1.5 text-[#2e7d32]">
              <ShieldCheck className="w-4 h-4 text-[#689f38]" /> {tariff.tariffTag || 'DUAL-OTP'} (Pickup + Delivery)
            </span>
            <span className="flex items-center gap-1.5 text-gray-700">
              <QrCode className="w-4 h-4 text-gray-500" /> In-App Only &bull; Zero Email OTPs
            </span>
          </div>
        </div>

        <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-2xl p-6 text-center space-y-2 min-w-[260px] relative z-10 shadow-sm">
          <div className="text-xs font-bold uppercase text-[#2e7d32] tracking-wider">
            {tariff.tariffBadge || 'SUBSIDIZED TARIFF'}
          </div>
          <div className="text-3xl font-black text-gray-900">
            ₹{tariff.providerPricePerUnit || 15}{' '}
            <span className="text-xs font-normal text-gray-500">
              + ₹{tariff.serviceChargePerUnit || 1} SC / garment
            </span>
          </div>
          <div className="text-[11px] text-[#33691e] font-medium">
            Wash, steam press &amp; folding included
          </div>
          <button
            onClick={() => setViewTab('BOOK')}
            className="block w-full py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white font-bold text-xs rounded-xl shadow-sm transition-colors uppercase tracking-wider"
          >
            Book Room Pickup
          </button>
        </div>
      </div>

      {/* Navigation Switcher between Booking Form & My Orders */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/70 border border-slate-300/60 shadow-xs">
          <button
            onClick={() => setViewTab('BOOK')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition ${
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
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewTab === 'ORDERS'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-slate-600 hover:text-gray-900'
            }`}
          >
            <span>My Active Laundry</span>
            {studentOrders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#689f38] text-white text-[10px] font-black">
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">Your Campus Laundry Bookings</h2>
              <p className="text-xs text-slate-500">
                Live wash cycle stage tracking &bull; Verified doorstep return OTPs &bull; In-app security
              </p>
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
            <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-3">
              <Shirt className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">No Active Laundry Orders</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You do not have any pending laundry bookings. Book a room pickup slot to have your clothes professionally washed and steam ironed.
              </p>
              <button
                onClick={() => setViewTab('BOOK')}
                className="mt-2 px-5 py-2.5 bg-[#689f38] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#5b8c30] transition"
              >
                Book Now
              </button>
            </div>
          ) : (
            studentOrders.map((ord: any) => {
              const currentStepIdx = getStepIndex(ord.status);
              const isPickupOtpVisible = ['ACCEPTED', 'PICKUP_SCHEDULED', 'CLOTHES_COLLECTED', 'WASHING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(ord.status);
              const isDeliveryOtpVisible = ['READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(ord.status);

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 space-y-5 transition hover:border-[#689f38]/50"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
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
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {ord.paymentMethod === 'COD' ? '💵 COD' : '💳 Online'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {ord.hallName}, Room {ord.roomNumber} &bull; Scheduled: {ord.preferredPickupTime}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400">Total Order Value</div>
                      <div className="text-lg font-black text-gray-900">
                        ₹{ord.totalAmount || ord.finalPrice || ord.estimatedPrice}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Paid: ₹{ord.onlinePaidAmount || ord.finalPrice || ord.estimatedPrice}
                        {ord.codAmount > 0 && ` • COD Due: ₹${ord.codAmount}`}
                      </div>
                    </div>
                  </div>

                  {/* 9-Stage Progress Timeline */}
                  <div className="py-2 overflow-x-auto">
                    <div className="flex items-center min-w-[550px] justify-between">
                      {ORDER_STEPS.map((step, idx) => {
                        const isCompleted = currentStepIdx > idx || ord.status === 'COMPLETED';
                        const isCurrent = currentStepIdx === idx && ord.status !== 'COMPLETED';

                        return (
                          <div key={step.key} className="flex-1 flex flex-col items-center relative text-center">
                            {idx > 0 && (
                              <div
                                className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 ${
                                  isCompleted ? 'bg-[#689f38]' : 'bg-slate-200'
                                }`}
                              />
                            )}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold relative z-10 border transition ${
                                isCompleted
                                  ? 'bg-[#689f38] text-white border-[#689f38]'
                                  : isCurrent
                                  ? 'bg-white text-[#689f38] border-2 border-[#689f38] animate-pulse'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`text-[9px] mt-1.5 font-semibold ${
                                isCurrent
                                  ? 'text-[#2e7d32] font-bold'
                                  : isCompleted
                                  ? 'text-slate-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Base Laundry Charge</span>
                      <span className="font-bold text-slate-800">
                        ₹{ord.laundryBaseAmount || ord.finalPrice || ord.estimatedPrice}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Platform Service Charge</span>
                      <span className="font-bold text-slate-800">
                        ₹{ord.serviceChargeAmount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Paid Online</span>
                      <span className="font-bold text-emerald-700">
                        ₹{ord.onlinePaidAmount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Pay on Delivery (COD)</span>
                      <span className={`font-bold ${ord.codAmount > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
                        {ord.codAmount > 0 ? `₹${ord.codAmount} (${ord.codStatus || 'PENDING'})` : 'None (₹0)'}
                      </span>
                    </div>
                  </div>

                  {/* Dual-OTP In-Screen Handover Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Stage 1: Pickup OTP */}
                    <div className="bg-[#f1f8e9]/80 border border-[#dcedc8] rounded-2xl p-4 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-[#2e7d32] tracking-wider flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" /> Stage 1: Pickup Verification Code
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-2xl text-[#1b5e20] tracking-widest">
                            {isPickupOtpVisible ? (ord.pickupOtp || '482916') : '------'}
                          </span>
                          {isPickupOtpVisible && (
                            <button
                              onClick={() => copyToClipboard(ord.pickupOtp || '482916', `pickup_${ord.id}`)}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[#2e7d32] border border-[#dcedc8] transition shadow-xs flex items-center gap-1 text-[10px] font-bold"
                              title="Copy Pickup OTP"
                            >
                              {copiedOtp === `pickup_${ord.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-[#2e7d32]" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            ['CLOTHES_COLLECTED', 'WASHING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(ord.status)
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPickupOtpVisible
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {['CLOTHES_COLLECTED', 'WASHING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(ord.status)
                            ? 'Verified ✓'
                            : isPickupOtpVisible
                            ? 'Active • Share with Dhobi'
                            : 'Pending Provider Acceptance'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {isPickupOtpVisible
                          ? 'Share this 6-digit OTP only with laundry personnel when handing over your clothes.'
                          : 'Deferred generation: will display the moment provider accepts your booking.'}
                      </p>
                    </div>

                    {/* Stage 2: Return Delivery OTP */}
                    <div
                      className={`rounded-2xl p-4 space-y-1.5 border transition ${
                        isDeliveryOtpVisible
                          ? 'bg-purple-50/90 border-purple-200'
                          : 'bg-slate-50 border-slate-200 opacity-70'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold text-purple-700 tracking-wider flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" /> Stage 2: Return Delivery OTP
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-2xl text-purple-900 tracking-widest">
                            {isDeliveryOtpVisible ? (ord.returnOtp || '739104') : '------'}
                          </span>
                          {isDeliveryOtpVisible && (
                            <button
                              onClick={() => copyToClipboard(ord.returnOtp || '739104', `return_${ord.id}`)}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-purple-700 border border-purple-200 transition shadow-xs flex items-center gap-1 text-[10px] font-bold"
                              title="Copy Return OTP"
                            >
                              {copiedOtp === `return_${ord.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-purple-700" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            ord.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isDeliveryOtpVisible
                              ? 'bg-purple-200 text-purple-800'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {ord.status === 'COMPLETED'
                            ? 'Delivered ✓'
                            : isDeliveryOtpVisible
                            ? 'Share at Door'
                            : 'Generated upon Ready/Out for Delivery'}
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-900/80 font-medium">
                        {isDeliveryOtpVisible
                          ? 'Share this code with laundry personnel when clean clothes are delivered to your room.'
                          : 'Deferred generation: will appear when clothes are washed, ironed & dispatched.'}
                      </p>
                    </div>
                  </div>

                  {/* Items Summary & Photos */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-gray-100">
                    <div className="text-slate-700">
                      <span className="font-semibold text-gray-900">Garments: </span>
                      {ord.items && ord.items.length > 0
                        ? ord.items.map((i: any) => `${i.quantity}x ${i.itemType}`).join(', ')
                        : `${ord.itemCount || 1} clothes`}
                    </div>

                    {ord.photos && ord.photos.length > 0 && (
                      <button
                        onClick={() => setSelectedPhotoModal(ord.photos)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200 hover:bg-indigo-100 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{ord.photos.length} Clothes Photos</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Garment Photos Viewer Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
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
                <div key={p.id || idx} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                  <div className="aspect-square bg-slate-900/5">
                    <img
                      src={p.googleDriveUrl || p.url}
                      alt={p.description || `Cloth ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5 bg-white text-[11px] font-medium text-slate-700">
                    {p.description || `Garment verification #${idx + 1}`}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="px-5 py-2 bg-gray-800 text-white rounded-xl text-xs font-semibold"
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
