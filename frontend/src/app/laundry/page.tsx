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
  Check,
  ArrowLeft
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
  const [scannerModal, setScannerModal] = useState<{
    isOpen: boolean;
    provider: any;
    orderNumber: string;
    totalAmount: number;
    codAmount: number;
    laundryBaseAmount?: number;
    serviceChargeAmount?: number;
  } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Laundry Complaint & Support System
  const [complaintModal, setComplaintModal] = useState<{
    isOpen: boolean;
    laundryOrderId: string;
    orderNumber: string;
    category: string;
    subject: string;
    description: string;
    attachmentUrl: string;
  } | null>(null);
  const [studentComplaints, setStudentComplaints] = useState<any[]>([]);
  const [showComplaintsTracker, setShowComplaintsTracker] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);
  const [complaintError, setComplaintError] = useState<string | null>(null);

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

  const fetchComplaints = async () => {
    if (!isAuthenticated) return;
    setLoadingComplaints(true);
    try {
      const res = await apiRequest('/api/laundry/complaints');
      if (res.success && Array.isArray(res.complaints)) {
        setStudentComplaints(res.complaints);
      }
    } catch {} finally {
      setLoadingComplaints(false);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintModal) return;
    setSubmittingComplaint(true);
    setComplaintError(null);
    setComplaintSuccess(null);
    try {
      const res = await apiRequest('/api/laundry/complaints', {
        method: 'POST',
        body: JSON.stringify({
          laundryOrderId: complaintModal.laundryOrderId,
          category: complaintModal.category,
          subject: complaintModal.subject,
          description: complaintModal.description,
          attachmentUrl: complaintModal.attachmentUrl || undefined
        })
      });
      if (res.success) {
        setComplaintSuccess(res.message || 'Complaint registered successfully!');
        fetchComplaints();
        setTimeout(() => {
          setComplaintModal(null);
          setComplaintSuccess(null);
          setShowComplaintsTracker(true);
        }, 1200);
      } else {
        setComplaintError(res.message || 'Failed to register complaint.');
      }
    } catch (err: any) {
      setComplaintError(err.message || 'Network error while submitting complaint.');
    } finally {
      setSubmittingComplaint(false);
    }
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
      fetchComplaints();
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
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* 1. MINIMAL CAMPUS BASKET HEADER (60–70px tall, clean, professional) */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Campus Basket Logo & Subtitle */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#4F9D2F] flex items-center justify-center text-white font-extrabold text-xs shadow-xs group-hover:bg-[#36751F] transition-colors">
              cb
            </div>
            <div>
              <div className="font-extrabold text-[#172033] text-base tracking-tight leading-none">
                campus<span className="text-[#4F9D2F]">basket</span>
              </div>
              <div className="text-[9px] sm:text-[9.5px] font-semibold tracking-wider text-[#667085] uppercase mt-0.5">
                CAMPUS MARKETPLACE &amp; SERVICES
              </div>
            </div>
          </Link>

          {/* Right: Back to Campus Services */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition py-1.5 px-3 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Back to Campus Services</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 w-full">
        {/* Booking Success Notification Banner */}
        {justBooked && (
          <div className="bg-gradient-to-r from-[#e8f5e9] to-[#f1f8e9] border border-[#a5d6a7] p-5 rounded-2xl shadow-sm flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2e7d32] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
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

        {/* 2. COMPACT LAUNDRY SERVICE HEADER (80–100px tall) */}
        <section className="bg-white rounded-2xl border border-gray-200/80 px-5 sm:px-6 py-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[80px]">
          <div>
            <h1 className="text-xl sm:text-[22px] font-bold text-gray-900 tracking-tight leading-tight">
              Express Campus Laundry
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Wash • Steam Press • Fold • Doorstep Pickup
            </p>
          </div>

          {/* Badges on right / below */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] font-semibold border border-[#dcedc8] text-[11px] sm:text-xs">
              <Check className="w-3 h-3 text-[#2e7d32]" /> Dual-OTP Protected
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200 text-[11px] sm:text-xs">
              ⚡ 24h Express
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-bold border border-gray-200 text-[11px] sm:text-xs">
              ₹{tariff.providerPricePerUnit || 15} + ₹{tariff.serviceChargePerUnit || 1} / garment
            </span>
          </div>
        </section>

      {/* 2. BOOKING NAVIGATION */}
      <div className="flex items-center">
        <div className="inline-flex p-1 rounded-xl bg-gray-200/60 border border-gray-300/50 shadow-2xs">
          <button
            onClick={() => setViewTab('BOOK')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
              viewTab === 'BOOK'
                ? 'bg-[#2e7d32] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
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
                ? 'bg-[#2e7d32] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>My Active Laundry</span>
            {studentOrders.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                viewTab === 'ORDERS' ? 'bg-white text-[#2e7d32]' : 'bg-[#2e7d32] text-white'
              }`}>
                {studentOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* View 1: Booking Form (Full-width responsive container) */}
      {viewTab === 'BOOK' && (
        <div id="booking-form" className="w-full pb-20 lg:pb-8">
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowComplaintsTracker(true);
                  fetchComplaints();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>My Complaints ({studentComplaints.length})</span>
              </button>
              <button
                onClick={fetchStudentLaundryOrders}
                className="inline-flex items-center gap-1 text-xs text-[#2e7d32] font-semibold hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
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

                  {/* Status Banner: Broadcast Pool vs Assigned Laundry Partner */}
                  {ord.status === 'REQUESTED' ? (
                    <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-900">Searching for Laundry Partner (Broadcast Pool)</span>
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-200 text-amber-900">
                            Available to All Dhobis
                          </span>
                        </div>
                        <p className="text-amber-800 mt-1 leading-relaxed text-[11px]">
                          Your booking is live in the campus broadcast pool. Any active laundry partner can accept it. Once accepted, their details and <strong>Payment Scanner (QR Code)</strong> will appear here immediately.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/40 rounded-2xl border border-emerald-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2e7d32] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              Laundry Partner: {ord.provider?.name || ord.provider?.fullName || 'Campus Laundry Partner'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#1b5e20] border border-emerald-200">
                              Accepted &amp; Active ✓
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1">
                            {ord.paymentMethod === 'COD'
                              ? `Pay ₹${ord.codAmount || ord.totalAmount} directly to partner via UPI Scanner or Cash (COD).`
                              : `Fully paid online (₹${ord.onlinePaidAmount}). Partner is managing pickup and wash.`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setScannerModal({
                            isOpen: true,
                            provider: ord.provider,
                            orderNumber: ord.orderNumber,
                            totalAmount: ord.totalAmount || ord.finalPrice || ord.estimatedPrice,
                            codAmount: ord.codAmount,
                            laundryBaseAmount: ord.laundryBaseAmount,
                            serviceChargeAmount: ord.serviceChargeAmount,
                          })
                        }
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>View Scanner</span>
                      </button>
                    </div>
                  )}

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
                            {['CLOTHES_COLLECTED', 'WASHING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(ord.status)
                              ? '------'
                              : (ord.pickupOtp || '------')}
                          </span>
                          {ord.pickupOtp && !['CLOTHES_COLLECTED', 'WASHING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(ord.status) && (
                            <button
                              onClick={() => copyToClipboard(ord.pickupOtp, `pickup_${ord.id}`)}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[#2e7d32] border border-[#dcedc8] transition shadow-xs flex items-center gap-1 text-[10px] font-bold cursor-pointer"
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
                              : ord.pickupOtp
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {['CLOTHES_COLLECTED', 'WASHING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(ord.status)
                            ? 'Verified ✓'
                            : ord.pickupOtp
                            ? 'Active • Share with Dhobi'
                            : 'Pending Generation'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {['CLOTHES_COLLECTED', 'WASHING', 'IRONING', 'READY', 'DELIVERY_SCHEDULED', 'COMPLETED'].includes(ord.status)
                          ? 'Pickup verified by dhobi. Clothes collected from your room.'
                          : 'Share this 6-digit OTP only with laundry personnel when handing over your clothes.'}
                      </p>
                    </div>

                    {/* Stage 2: Return Delivery OTP */}
                    <div
                      className={`rounded-2xl p-4 space-y-1.5 border transition ${
                        (ord.deliveryOtp || ord.returnOtp) && ord.status !== 'COMPLETED'
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
                            {ord.status === 'COMPLETED'
                              ? '------'
                              : (ord.deliveryOtp || ord.returnOtp || '------')}
                          </span>
                          {(ord.deliveryOtp || ord.returnOtp) && ord.status !== 'COMPLETED' && (
                            <button
                              onClick={() => copyToClipboard(ord.deliveryOtp || ord.returnOtp, `return_${ord.id}`)}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-purple-700 border border-purple-200 transition shadow-xs flex items-center gap-1 text-[10px] font-bold cursor-pointer"
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
                              : (ord.deliveryOtp || ord.returnOtp)
                              ? 'bg-purple-200 text-purple-800'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {ord.status === 'COMPLETED'
                            ? 'Delivered ✓'
                            : (ord.deliveryOtp || ord.returnOtp)
                            ? 'Active • Share at Door'
                            : 'Generated when Ready for Return'}
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-900/80 font-medium">
                        {ord.status === 'COMPLETED'
                          ? 'Clean clothes handed over and delivery OTP verified.'
                          : (ord.deliveryOtp || ord.returnOtp)
                          ? 'Share this code with laundry personnel when clean clothes are delivered to your room.'
                          : 'Authoritative code: will appear when clothes are washed, ironed & ready for delivery.'}
                      </p>
                    </div>
                  </div>

                  {/* Items Summary & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-gray-100">
                    <div className="text-slate-700">
                      <span className="font-semibold text-gray-900">Garments: </span>
                      {ord.items && ord.items.length > 0
                        ? ord.items.map((i: any) => `${i.quantity}x ${i.itemType}`).join(', ')
                        : `${ord.itemCount || 1} clothes`}
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.photos && ord.photos.length > 0 && (
                        <button
                          onClick={() => setSelectedPhotoModal(ord.photos)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{ord.photos.length} Clothes Photos</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setComplaintModal({
                            isOpen: true,
                            laundryOrderId: ord.id,
                            orderNumber: ord.orderNumber,
                            category: 'Pickup Issue',
                            subject: '',
                            description: '',
                            attachmentUrl: ''
                          });
                          setComplaintSuccess(null);
                          setComplaintError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 font-bold text-[11px] border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Complaint / Support</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      </main>

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

      {/* Laundry Partner Payment Scanner Modal */}
      {scannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1b5e20] flex items-center justify-center shadow-2xs">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Laundry Partner Payment Scanner</h3>
                  <p className="text-[10px] text-gray-500 font-mono">Order #{scannerModal.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setScannerModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount & Direct COD Notice */}
            <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Pay Directly to Partner</span>
                <span className="text-2xl font-black text-[#1b5e20]">
                  ₹{scannerModal.codAmount !== undefined && scannerModal.codAmount !== null ? scannerModal.codAmount : (scannerModal.laundryBaseAmount || scannerModal.totalAmount)}
                </span>
                <span className="text-[10px] text-emerald-700 block">
                  (₹{scannerModal.serviceChargeAmount || 0} advance paid online)
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white text-emerald-800 text-[10px] font-bold border border-emerald-200 shadow-2xs">
                💵 Laundry COD
              </span>
            </div>

            {/* Scanner Image (JPEG format provided by laundry partner) */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
              {scannerModal.provider?.paymentScanner?.qrImage ? (
                <div className="w-56 h-56 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-400 bg-white p-2 flex items-center justify-center shadow-xs">
                  <img
                    src={scannerModal.provider.paymentScanner.qrImage}
                    alt="Laundry Payment QR Scanner"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <QrCode className="w-16 h-16 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-700">UPI Scanner Image Not Uploaded</p>
                  <p className="text-[10px] text-gray-500">
                    Laundry partner has not uploaded a JPEG scanner yet. You can pay via UPI ID below or directly in Cash.
                  </p>
                </div>
              )}

              {/* Payee Info & UPI ID */}
              <div className="mt-3 text-center w-full">
                <div className="text-xs font-bold text-gray-900">
                  {scannerModal.provider?.paymentScanner?.accountName ||
                    scannerModal.provider?.name ||
                    scannerModal.provider?.fullName ||
                    'Campus Laundry Partner'}
                </div>
                {scannerModal.provider?.paymentScanner?.upiId ? (
                  <div className="mt-2 flex items-center justify-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs mx-auto max-w-xs">
                    <span className="text-xs font-mono font-bold text-gray-800">
                      {scannerModal.provider.paymentScanner.upiId}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(scannerModal.provider.paymentScanner.upiId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                      className="p-1 rounded-md text-[#2e7d32] hover:bg-[#e8f5e9] transition"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-[#2e7d32]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-500 mt-1">Cash on Doorstep Handover</div>
                )}
              </div>
            </div>

            {/* Direct COD Notice & Partner Instructions */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-[#2e7d32]" />
                <span>Payment Instructions &amp; Zero Record-Keeping:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {scannerModal.provider?.paymentScanner?.instructions ||
                  'Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM) and pay directly to the dhobi. No receipt upload is needed.'}
              </p>
              <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 rounded-lg p-2 border border-emerald-200/60">
                ⚡ Note: Treated as Laundry COD. Pay directly to the partner. The dhobi will verify and record the collection on their dashboard during cloth handover.
              </div>
            </div>

            {/* Done Action */}
            <div className="pt-1">
              <button
                onClick={() => setScannerModal(null)}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Laundry Complaint Submission Modal */}
      {complaintModal && complaintModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Raise Laundry Complaint / Support</h3>
                  <p className="text-[11px] text-slate-500">Linked to Laundry Order #{complaintModal.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setComplaintModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {complaintSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{complaintSuccess}</span>
              </div>
            )}

            {complaintError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{complaintError}</span>
              </div>
            )}

            <form onSubmit={handleCreateComplaint} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Laundry Order ID
                </label>
                <input
                  type="text"
                  readOnly
                  value={`#${complaintModal.orderNumber}`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Complaint Category *
                </label>
                <select
                  value={complaintModal.category}
                  onChange={(e) => setComplaintModal({ ...complaintModal, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="Pickup Issue">Pickup Issue (Delay / No Show)</option>
                  <option value="Delivery Issue">Delivery Issue (Delay / Incomplete Return)</option>
                  <option value="Wrong / Missing Garment">Wrong / Missing Garment</option>
                  <option value="Damaged Garment">Damaged Garment / Tear</option>
                  <option value="Quality Issue">Quality Issue / Stains not cleaned</option>
                  <option value="Delay">Unscheduled Delay</option>
                  <option value="Payment Issue">Payment / Billing Issue</option>
                  <option value="Refund Issue">Refund Request</option>
                  <option value="OTP Issue">OTP Verification Issue</option>
                  <option value="Address Issue">Address / Room Handover Issue</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 Shirt missing from delivered packet"
                  value={complaintModal.subject}
                  onChange={(e) => setComplaintModal({ ...complaintModal, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                  required
                  minLength={3}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Please describe the issue clearly (garment color, description, what happened)..."
                  value={complaintModal.description}
                  onChange={(e) => setComplaintModal({ ...complaintModal, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                  required
                  minLength={10}
                  maxLength={2000}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Optional Photo / Proof URL
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or image link (optional)"
                  value={complaintModal.attachmentUrl}
                  onChange={(e) => setComplaintModal({ ...complaintModal, attachmentUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setComplaintModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submittingComplaint ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Complaint</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Laundry Complaints Tracking Modal */}
      {showComplaintsTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">My Laundry Complaints &amp; Support</h3>
                  <p className="text-[11px] text-slate-500">Track resolution status and administrator responses</p>
                </div>
              </div>
              <button
                onClick={() => setShowComplaintsTracker(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingComplaints ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading your complaints...</p>
              </div>
            ) : studentComplaints.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Complaints Found</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  You have not submitted any complaints. If you experience any problem with a laundry order, click &quot;Complaint / Support&quot; on the order card.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentComplaints.map((cmp: any) => (
                  <div
                    key={cmp.id}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          #{cmp.complaintNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          &bull; Order #{cmp.laundryOrder?.orderNumber || cmp.laundryOrderId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            cmp.status === 'RESOLVED' || cmp.status === 'CLOSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cmp.status === 'IN_REVIEW' || cmp.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cmp.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(cmp.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {cmp.subject}
                      </div>
                      <div className="text-[11px] font-semibold text-amber-800 mt-0.5">
                        Category: {cmp.category}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                        {cmp.description}
                      </p>
                    </div>

                    {/* Admin Response Section */}
                    {cmp.adminResponse ? (
                      <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Admin Response:</span>
                        </div>
                        <p className="text-emerald-800 text-[11px] leading-relaxed">
                          {cmp.adminResponse}
                        </p>
                        {cmp.resolvedAt && (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Resolved on {new Date(cmp.resolvedAt).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">
                        Awaiting administrator review. Your complaint is currently being investigated.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowComplaintsTracker(false)}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
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

