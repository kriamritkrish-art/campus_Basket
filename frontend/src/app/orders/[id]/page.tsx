'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import { Order } from '../../../types';
import {
  CheckCircle2,
  Clock,
  FileText,
  RotateCcw,
  ArrowLeft,
  Truck,
  AlertCircle,
  MapPin,
  XCircle
} from 'lucide-react';

const ORDER_STEPS = [
  { key: 'CONFIRMED', label: 'Order Placed & Confirmed' },
  { key: 'PREPARING', label: 'Kitchen / Provider Preparing' },
  { key: 'READY', label: 'Packed & Ready for Dispatch' },
  { key: 'OUT_FOR_DELIVERY', label: 'Campus Runner Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered to Hostel Room' },
];

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { addItem } = useCart();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await apiRequest(`/api/orders/${id}`);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    setCancelMsg(null);

    try {
      const res = await apiRequest(`/api/orders/${id}/cancel`, { method: 'POST' });
      if (res.success) {
        setCancelMsg('Order cancelled successfully.');
        // Refresh
        const updated = await apiRequest(`/api/orders/${id}`);
        if (updated.success) setOrder(updated.order);
      } else {
        setCancelMsg(res.message || 'Could not cancel order.');
      }
    } catch (err: any) {
      setCancelMsg(err.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  const handleOrderAgain = () => {
    if (!order?.items) return;
    for (const item of order.items) {
      if (item.product) {
        addItem(item.product, item.quantity);
      }
    }
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="glass-panel h-80 rounded-3xl animate-shimmer" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-slate-400">
        <p className="font-bold text-white text-base">Order not found</p>
        <Link href="/dashboard" className="mt-4 inline-block text-xs font-semibold text-sky-400">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 0;
      case 'PREPARING':
        return 1;
      case 'READY':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex items-center gap-2">
          {/* Download Receipt */}
          {order.receipt?.receiptNumber && (
            <a
              href={`http://localhost:5000/api/payments/receipt/${order.receipt.receiptNumber}?format=html`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-sky-950/70 hover:bg-sky-900/70 border border-sky-800/70 text-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" /> Download Official Receipt
            </a>
          )}

          <button
            onClick={handleOrderAgain}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" /> Order Again
          </button>
        </div>
      </div>

      {/* Order Header Summary */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-white font-mono">{order.orderNumber}</span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isCancelled
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                }`}
              >
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Total Billed</div>
            <div className="text-2xl font-black text-white">₹{order.totalAmount}</div>
            <div className="text-[11px] text-slate-400">Paid via {order.paymentMethod}</div>
          </div>
        </div>

        {cancelMsg && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 text-xs text-rose-300 rounded-xl">
            {cancelMsg}
          </div>
        )}

        {/* Real-time Order Timeline Progress Bar */}
        {!isCancelled ? (
          <div className="pt-4 space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Order Milestones
            </h4>

            <div className="relative">
              <div className="hidden sm:grid grid-cols-5 gap-2 relative z-10">
                {ORDER_STEPS.map((step, idx) => {
                  const isPast = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.key} className="text-center space-y-2">
                      <div
                        className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                          isPast
                            ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-500/20'
                            : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                      >
                        {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div
                        className={`text-[11px] leading-tight font-medium ${
                          isCurrent ? 'text-sky-400 font-bold' : isPast ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Status Card */}
              <div className="sm:hidden p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <Truck className="w-6 h-6 text-sky-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-white">Current Milestone</div>
                  <div className="text-xs text-sky-400">{ORDER_STEPS[currentStep]?.label}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-950/40 border border-rose-800/40 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>This order has been cancelled and refunded if payment was captured.</span>
          </div>
        )}

        {/* Cancellation Button (Only if still in CONFIRMED / PREPARING) */}
        {['CONFIRMED', 'PREPARING'].includes(order.status) && (
          <div className="pt-2 text-right">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold"
            >
              Cancel Order
            </button>
          </div>
        )}
      </div>

      {/* Items & Delivery Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Items Ordered</h3>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">{item.productName}</div>
                  <div className="text-slate-400">Qty: {item.quantity} &bull; ₹{item.unitPrice} each</div>
                </div>
                <div className="font-bold text-white text-sm">₹{item.totalPrice}</div>
              </div>
            ))}
          </div>

          <div className="pt-3 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white">₹{order.subtotal}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>-₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-white">₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-slate-800">
              <span>Total Paid</span>
              <span className="text-sky-400">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Drop Location */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" /> Delivery Address
          </h3>
          <div className="space-y-2 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block text-[11px]">Hostel</span>
              <strong className="text-white">{order.hallName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Room Number</span>
              <strong className="text-white">Room {order.roomNumber}</strong>
            </div>
            {order.specialInstructions && (
              <div>
                <span className="text-slate-500 block text-[11px]">Notes</span>
                <span className="text-slate-300 italic">{order.specialInstructions}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
