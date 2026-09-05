'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Order, LaundryOrder } from '../../types';
import {
  User,
  ShoppingBag,
  Shirt,
  MapPin,
  Clock,
  ShieldCheck,
  RotateCw,
  FileText,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  Truck,
  Camera
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [laundryOrders, setLaundryOrders] = useState<LaundryOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ORDERS' | 'LAUNDRY'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        window.location.href = '/login?role=STUDENT';
        return;
      }
      if (role === 'ADMIN') {
        window.location.href = '/admin/dashboard';
        return;
      }
      if (role === 'SERVICE_PROVIDER') {
        window.location.href = '/provider/dashboard';
        return;
      }
      if (role === 'DELIVERY_BOY') {
        window.location.href = '/delivery/dashboard';
        return;
      }
    }

    async function loadStudentData() {
      try {
        const [ordRes, lauRes] = await Promise.all([
          apiRequest('/api/orders'),
          apiRequest('/api/laundry/orders'),
        ]);

        if (ordRes.success && ordRes.orders) setOrders(ordRes.orders);
        if (lauRes.success && lauRes.orders) setLaundryOrders(lauRes.orders);
      } catch (err) {
        console.warn('Dashboard data load:', err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadStudentData();
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="glass-panel h-80 rounded-3xl animate-shimmer" />
      </div>
    );
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'OUT_FOR_DELIVERY':
      case 'READY':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'PREPARING':
      case 'WASHING':
      case 'IN_LAUNDRY':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* 1. Student Identity Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-sky-600/20 flex-shrink-0">
            {user?.student?.fullName?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {user?.student?.fullName || 'Verified Student'}
              </h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> College Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">{user?.email}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300 mt-2">
              <span>Roll: <strong className="font-mono text-white">{user?.student?.rollNumber}</strong></span>
              <span>Reg: <strong className="font-mono text-white">{user?.student?.registrationNumber}</strong></span>
              <span>Mobile: <strong className="text-white">{user?.student?.mobileNumber}</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-xs">
          <MapPin className="w-6 h-6 text-sky-400 flex-shrink-0" />
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Assigned Delivery Room</div>
            <div className="font-bold text-white text-sm">
              {user?.student?.hall?.name || 'Hall 11'}, Room {user?.student?.roomNumber || 'B-304'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'ALL'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Activity ({orders.length + laundryOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'ORDERS'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Food &amp; Essentials ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('LAUNDRY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'LAUNDRY'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shirt className="w-3.5 h-3.5" /> Laundry Tracking ({laundryOrders.length})
        </button>
      </div>

      {/* 3. ACTIVE LAUNDRY JOBS WITH DUAL OTP DISPLAY */}
      {(activeTab === 'ALL' || activeTab === 'LAUNDRY') && laundryOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shirt className="w-4 h-4 text-sky-400" /> Active Campus Laundry Bookings
            </h3>
            <Link href="/laundry/book" className="text-xs font-bold text-sky-400 hover:underline">
              + Book Another Pickup
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {laundryOrders.map((lo) => (
              <div
                key={lo.id}
                className="glass-panel p-6 rounded-2xl border border-sky-500/30 space-y-4 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-sky-400 block">{lo.orderNumber}</span>
                    <h4 className="font-bold text-white text-sm mt-0.5">
                      {lo.items?.map((i) => `${i.quantity}x ${i.itemType}`).join(', ') || 'Laundry Items'}
                    </h4>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Pickup Slot: {lo.preferredPickupTime}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getOrderStatusBadge(
                      lo.status
                    )}`}
                  >
                    {lo.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* DUAL OTP CARD */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Pickup OTP
                    </span>
                    <span className="text-xl font-mono font-bold text-sky-300 tracking-wider">
                      {lo.pickupOtp || '● ● ● ● ● ●'}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Give at room collection
                    </span>
                  </div>

                  <div className="space-y-1 border-l border-slate-800 pl-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Delivery OTP
                    </span>
                    <span className="text-xl font-mono font-bold text-emerald-400 tracking-wider">
                      {lo.deliveryOtp || '● ● ● ● ● ●'}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Give at room return
                    </span>
                  </div>
                </div>

                {/* Uploaded Cloth Photos (Anti-Loss Protection) */}
                {lo.photos && lo.photos.length > 0 && (
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-sky-900/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-sky-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Verified Cloth Photos ({lo.photos.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Anti-Loss Protected</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {lo.photos.map((photo, pIdx) => (
                        <div
                          key={photo.id || pIdx}
                          className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 relative group"
                          title={photo.description || `Cloth item #${pIdx + 1}`}
                        >
                          <img
                            src={photo.googleDriveUrl}
                            alt={photo.description || 'Garment'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-400">
                    Estimated: <strong className="text-white">₹{lo.estimatedPrice}</strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Hostel: {lo.hallName}, Room {lo.roomNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PRODUCT ORDERS LIST */}
      {(activeTab === 'ALL' || activeTab === 'ORDERS') && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-sky-400" /> Food, Fruits &amp; Essentials Orders
          </h3>

          {orders.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="font-semibold text-white">No orders yet</p>
              <p className="text-xs text-slate-500">
                You haven't placed any meals, fruits, or stationery orders yet.
              </p>
              <Link
                href="/food"
                className="inline-block mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl"
              >
                Browse Campus Menu
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-sky-400">{o.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getOrderStatusBadge(
                          o.status
                        )}`}
                      >
                        {o.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      {o.items?.map((i) => `${i.quantity}x ${i.productName}`).join(' &bull; ')}
                    </div>

                    <div className="text-xs text-slate-400">
                      Delivered to: <strong className="text-slate-200">{o.hallName}, Room {o.roomNumber}</strong> &bull; Total: <strong className="text-white">₹{o.totalAmount}</strong> ({o.paymentMethod})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Details / Timeline */}
                    <Link
                      href={`/orders/${o.id}`}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      View Timeline <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Download Receipt */}
                    {o.receiptNumber && (
                      <a
                        href={`http://localhost:5000/api/payments/receipt/${o.receiptNumber}?format=html`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/60 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> Receipt
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
