'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  Truck,
  Shirt,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Clock,
  KeyRound,
  AlertTriangle,
  X,
  Camera,
  Eye
} from 'lucide-react';

export default function ProviderDashboardPage() {
  const { user, role, isAuthenticated, isLoading } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [laundryJobs, setLaundryJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // OTP Modal State
  const [otpModal, setOtpModal] = useState<{
    isOpen: boolean;
    jobId: string;
    type: 'PICKUP' | 'DELIVERY';
    orderNumber: string;
  } | null>(null);

  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  // Load Data
  const loadData = async () => {
    try {
      const res = await apiRequest('/api/provider/dashboard');
      if (res.success) {
        setStats(res.stats);
        setAssignedOrders(res.assignedOrders || []);
        setLaundryJobs(res.laundryJobs || []);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (role !== 'SERVICE_PROVIDER' && role !== 'ADMIN'))) {
      window.location.href = '/login?redirect=/provider/dashboard';
      return;
    }

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, role, isLoading]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModal || enteredOtp.length !== 6) return;

    setSubmittingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);

    const endpoint =
      otpModal.type === 'PICKUP'
        ? `/api/laundry/${otpModal.jobId}/verify-pickup`
        : `/api/laundry/${otpModal.jobId}/verify-delivery`;

    try {
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ otp: enteredOtp.trim() }),
      });

      if (res.success) {
        setOtpSuccess(res.message || 'Verified successfully!');
        setTimeout(() => {
          setOtpModal(null);
          setEnteredOtp('');
          loadData();
        }, 1200);
      } else {
        setOtpError(res.message || 'OTP verification failed.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification error.');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await apiRequest(`/api/provider/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="glass-panel h-80 rounded-3xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-extrabold text-white">Campus Dispatch &amp; Runner Console</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Assigned Service Vendor: <strong>{user?.provider?.fullName || 'Campus Vendor'}</strong> &bull; Category: {user?.provider?.serviceCategory || 'LAUNDRY & FOOD'}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Active Laundry Pickups/Deliveries</div>
          <div className="text-3xl font-black text-sky-400 mt-1">{stats?.activeLaundryCount || 0}</div>
          <div className="text-[11px] text-slate-400">Hostel room visits</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Assigned Meal / Item Orders</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{stats?.pendingOrdersCount || 0}</div>
          <div className="text-[11px] text-slate-400">Delivery in progress</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Completed Today</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">{stats?.completedToday || 12}</div>
          <div className="text-[11px] text-emerald-400">● 100% verified drops</div>
        </div>
      </div>

      {/* Section 1: Laundry Jobs with OTP Verification */}
      <div className="glass-panel p-6 rounded-3xl border border-sky-500/30 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shirt className="w-5 h-5 text-sky-400" /> Doorstep Laundry Tasks (Dual-OTP Verification)
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {laundryJobs.length} active assignment{laundryJobs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {laundryJobs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No active laundry pickups or deliveries assigned right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {laundryJobs.map((job) => {
              const isPickupStage = ['REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED'].includes(job.status);
              const isDeliveryStage = ['READY', 'DELIVERY_SCHEDULED'].includes(job.status);

              return (
                <div key={job.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-mono text-sky-400 font-bold">{job.orderNumber}</span>
                      <h4 className="font-bold text-white text-sm">{job.student?.fullName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 inline text-emerald-400 mr-1" />
                        <strong>{job.hallName}</strong> &bull; Room {job.roomNumber}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    Items: {job.items?.map((i: any) => `${i.quantity}x ${i.itemType}`).join(', ')} &bull; ₹{job.estimatedPrice}
                  </div>

                  {/* Anti-Loss Cloth Verification Photos */}
                  {job.photos && job.photos.length > 0 && (
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-900/40 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-sky-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" /> Cloth Photos ({job.photos.length}) - Anti-Loss
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Click to zoom</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {job.photos.map((photo: any, pIdx: number) => (
                          <div
                            key={photo.id || pIdx}
                            onClick={() =>
                              setSelectedPhoto({
                                url: photo.googleDriveUrl,
                                title: photo.description || `Cloth item #${pIdx + 1} (${job.orderNumber})`,
                              })
                            }
                            className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 cursor-pointer hover:border-sky-400 transition-colors relative group"
                            title={photo.description || `Garment #${pIdx + 1}`}
                          >
                            <img
                              src={photo.googleDriveUrl}
                              alt={photo.description || 'Garment'}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OTP Action Trigger */}
                  <div className="pt-2">
                    {isPickupStage && (
                      <button
                        onClick={() =>
                          setOtpModal({
                            isOpen: true,
                            jobId: job.id,
                            type: 'PICKUP',
                            orderNumber: job.orderNumber,
                          })
                        }
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
                      >
                        <KeyRound className="w-4 h-4" /> Verify Student Pickup OTP
                      </button>
                    )}

                    {isDeliveryStage && (
                      <button
                        onClick={() =>
                          setOtpModal({
                            isOpen: true,
                            jobId: job.id,
                            type: 'DELIVERY',
                            orderNumber: job.orderNumber,
                          })
                        }
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
                      >
                        <KeyRound className="w-4 h-4" /> Verify Student Delivery OTP
                      </button>
                    )}

                    {!isPickupStage && !isDeliveryStage && (
                      <div className="text-xs text-slate-400 text-center py-1">
                        Status: <strong>{job.status.replace(/_/g, ' ')}</strong> (In washing / iron cycle)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Product Deliveries */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-400" /> Meal &amp; Essentials Dispatch List
        </h2>

        {assignedOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No meal or essentials deliveries in queue.
          </div>
        ) : (
          <div className="space-y-4">
            {assignedOrders.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{o.orderNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                      {o.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {o.student?.fullName} &bull; <strong>{o.hallName}, Room {o.roomNumber}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Items: {o.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>
                </div>

                {/* Status Advancement Buttons */}
                <div className="flex items-center gap-2">
                  {o.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'PREPARING')}
                      className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Start Preparing
                    </button>
                  )}
                  {o.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'READY')}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Mark Ready
                    </button>
                  )}
                  {o.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'OUT_FOR_DELIVERY')}
                      className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Out for Delivery
                    </button>
                  )}
                  {o.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Confirm Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OTP VERIFICATION MODAL */}
      {otpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-sky-500/40 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setOtpModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-10 h-10 bg-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">
                Verify Student {otpModal.type === 'PICKUP' ? 'Pickup' : 'Delivery'} Code
              </h3>
              <p className="text-xs text-slate-400">
                Ask the student for their 6-digit code for order <strong>{otpModal.orderNumber}</strong>
              </p>
            </div>

            {otpError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-xs text-rose-300 rounded-xl">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{otpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="••••••"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingOtp || enteredOtp.length !== 6}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
              >
                {submittingOtp ? 'Verifying...' : `Confirm ${otpModal.type} OTP`}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Photo Inspection Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-3 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <h4 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
                  {selectedPhoto.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black/60 max-h-[70vh] flex items-center justify-center border border-slate-800">
              <img
                src={selectedPhoto.url}
                alt="Cloth item"
                className="max-h-[68vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="text-center">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
