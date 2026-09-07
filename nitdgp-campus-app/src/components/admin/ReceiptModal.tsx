'use client';

import React from 'react';
import { X, Download, FileText } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function ReceiptModal({ isOpen, onClose, order }: ReceiptModalProps) {
  if (!isOpen || !order) return null;

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('nit_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/admin/orders/${order.id}/receipt`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to generate receipt PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Error downloading receipt PDF');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-6 my-8">
        {/* Modal Top */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4F9D32]" />
            <h3 className="text-base font-bold text-[#17202A]">Order Tax &amp; Delivery Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5 text-xs text-slate-700">
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="text-xs font-black tracking-wider text-[#347A27] uppercase">
                NIT Durgapur Campus Services
              </div>
              <div className="text-[11px] text-slate-500">Order Delivery Voucher</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-[#17202A] text-xs">{order.orderNumber}</div>
              <div className="text-[10px] text-slate-500">
                {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>

          {/* Student details */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Student Name</span>
              <span className="text-[#17202A] font-semibold">{order.student?.fullName || 'Student'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Roll / Hostel</span>
              <span className="text-[#17202A] font-semibold">
                {order.student?.rollNumber} &bull; {order.hallName} (Room {order.roomNumber})
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-b border-slate-200 py-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex justify-between">
              <span>Item Description</span>
              <span>Total</span>
            </div>
            {order.items?.map((it: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs">
                <span>
                  {it.quantity}x {it.productName}
                </span>
                <span className="font-mono font-semibold text-[#17202A]">₹{it.totalPrice || it.unitPrice * it.quantity}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹{order.subtotal || order.totalAmount}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee:</span>
              <span>₹{order.deliveryFee || 0}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[#347A27] font-semibold">
                <span>Coupon Discount:</span>
                <span>- ₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[#17202A] pt-2 border-t border-slate-200">
              <span>Total Amount Paid:</span>
              <span className="text-[#347A27]">₹{order.totalAmount}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 pt-1">
            Payment Method: <span className="text-[#17202A] font-semibold">{order.paymentMethod}</span> ({order.paymentStatus})
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-5 py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-md shadow-[#4F9D32]/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
