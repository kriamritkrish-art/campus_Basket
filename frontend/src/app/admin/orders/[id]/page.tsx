'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '../../../../lib/api';
import { ReceiptModal } from '../../../../components/admin/ReceiptModal';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  User,
  MapPin,
  CreditCard,
  Building2,
  Package
} from 'lucide-react';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await apiRequest(`/api/admin/orders/${id}`);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch (err) {
        console.warn('Error loading order:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-slate-200 rounded-xl" />
        <div className="h-40 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-[#17202A]">Order not found</h2>
        <Link href="/admin/orders" className="text-xs font-semibold text-[#4F9D32] hover:underline mt-2 inline-block">
          Return to Orders Console
        </Link>
      </div>
    );
  }

  const milestones = [
    { label: 'Order Placed', statusKey: 'CONFIRMED' },
    { label: 'Kitchen Preparing', statusKey: 'PREPARING' },
    { label: 'Order Ready', statusKey: 'READY' },
    { label: 'Out for Delivery', statusKey: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', statusKey: 'DELIVERED' }
  ];

  const statusHierarchy = ['PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIndex = statusHierarchy.indexOf(order.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#17202A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>
      </div>

      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#17202A] font-mono tracking-tight">{order.orderNumber}</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#347A27] border border-emerald-200">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN')} &bull; Payment via {order.paymentMethod}
          </p>
        </div>

        <button
          onClick={() => setReceiptOpen(true)}
          className="px-4 py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Tax Receipt PDF</span>
        </button>
      </div>

      {/* Milestone Progress Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
          Fulfillment Milestone Progression
        </h3>

        <div className="grid grid-cols-5 gap-2 pt-2">
          {milestones.map((m, idx) => {
            const milestoneIndex = statusHierarchy.indexOf(m.statusKey);
            const isCompleted = currentIndex >= milestoneIndex;
            const isCurrent = order.status === m.statusKey;

            return (
              <div key={idx} className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-[#4F9D32] text-white ring-4 ring-[#4F9D32]/20'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    isCurrent ? 'text-[#347A27] font-bold' : isCompleted ? 'text-[#17202A]' : 'text-slate-400'
                  }`}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Student Details vs Payment & Pricing Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student & Destination */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-[#4F9D32]" />
            <span>Student &amp; Hostel Delivery</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Full Name</div>
              <div className="text-[#17202A] font-bold text-sm mt-0.5">{order.student?.fullName || 'Campus Student'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Roll Number</div>
              <div className="text-slate-700 font-mono mt-0.5">{order.student?.rollNumber || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">College Email</div>
              <div className="text-slate-700 mt-0.5">{order.student?.user?.email || 'student@nitdgp.ac.in'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mobile</div>
              <div className="text-slate-700 font-mono mt-0.5">{order.student?.mobileNumber || 'N/A'}</div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[10px] text-[#347A27] uppercase font-bold tracking-wider">Hostel Hall &amp; Room</div>
              <div className="text-[#17202A] font-bold text-sm mt-0.5">
                {order.hallName || 'Hall of Residence'} &bull; Room {order.roomNumber || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Breakdown & Pricing Summary */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[#4F9D32]" />
            <span>Order Line Items ({order.items?.length || 1})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50/70 border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((it: any) => (
                  <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#17202A]">{it.productName}</td>
                    <td className="py-3 px-3 text-center text-slate-600 font-mono">{it.quantity}</td>
                    <td className="py-3 px-3 text-right text-slate-600 font-mono">₹{it.unitPrice}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#17202A] font-mono">
                      ₹{it.totalPrice || it.unitPrice * it.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-[#17202A]">₹{order.subtotal || order.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Campus Delivery Fee:</span>
              <span className="font-mono font-semibold text-[#17202A]">₹{order.deliveryFee || 0}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[#347A27] font-semibold">
                <span>Discount Applied:</span>
                <span className="font-mono">- ₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#17202A] pt-3 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="font-mono text-[#347A27] text-lg">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        order={order}
      />
    </div>
  );
}
