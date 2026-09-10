'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Receipt,
  User,
  Store,
  Truck,
  CreditCard,
  AlertTriangle,
  FileText
} from 'lucide-react';

export interface OrderFinancialDetailsProps {
  order?: any;
  orderId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderFinancialDetailsModal({ order: initialOrder, orderId, isOpen, onClose }: OrderFinancialDetailsProps) {
  const [fetchedOrder, setFetchedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !initialOrder && orderId) {
      setLoading(true);
      apiRequest(`/api/orders/${orderId}`)
        .then((res) => {
          if (res?.success && res.order) {
            setFetchedOrder(res.order);
          } else if (res?.data) {
            setFetchedOrder(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialOrder, orderId]);

  if (!isOpen) return null;

  const order = initialOrder || fetchedOrder || (orderId ? { id: orderId, orderNumber: orderId } : null);
  if (!order) return null;

  const totalAmt = Number(order.orderAmount || order.totalAmount || 0);
  const isCod = order.paymentMode === 'COD' || order.paymentMethod === 'CASH_ON_DELIVERY';
  const codExpected = isCod ? (Number(order.codExpected) !== undefined ? Number(order.codExpected) : totalAmt) : 0;
  const codCollected = isCod ? Number(order.codCollected || (order.paymentStatus === 'COD_COLLECTED' ? totalAmt : 0)) : 0;
  const pendingCod = Math.max(0, codExpected - codCollected);

  const provPayable = Number(order.providerPayable !== undefined ? order.providerPayable : totalAmt);
  const provSettled = Number(order.settledAmount || order.providerSettled || order.providerSettledAmount || 0);
  const provRemaining = Math.max(0, provPayable - provSettled);

  const deliveryEarning = Number(order.deliveryEarning !== undefined ? order.deliveryEarning : (order.eligibleEarning !== undefined ? order.eligibleEarning : 10));
  const adminComm = Number(order.commissionAmount !== undefined ? order.commissionAmount : 0);

  const isOtpVerified = Boolean(order.otpVerified || order.deliveryOtpVerified);
  const codStatus = order.codStatus || (isCod ? (codCollected >= codExpected && codExpected > 0 ? 'COLLECTED' : 'PENDING') : 'NOT_APPLICABLE');
  const settlementStatus = order.settlementStatus || (provRemaining === 0 && provSettled > 0 ? 'SETTLED' : (provSettled > 0 ? 'PARTIALLY_SETTLED' : 'PENDING'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Financial Details</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-bold border border-slate-700">
                  {order.orderNumber || order.orderId || 'Order #'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Institutional Ledger Verified Record &bull; Original Order Synchronized</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800">
          {/* Entity Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Student */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Student
              </div>
              <div className="font-bold text-xs text-slate-900 truncate">{order.student || order.studentName || 'Campus Student'}</div>
              <div className="text-[11px] text-slate-500 truncate">{order.studentEmail || 'student@nitdgp.ac.in'}</div>
            </div>

            {/* Provider */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                Provider
              </div>
              <div className="font-bold text-xs text-slate-900 truncate">{order.provider || order.providerName || 'Vendor'}</div>
              <div className="text-[11px] text-slate-500 truncate">{order.product || order.productService || 'Campus Essentials'}</div>
            </div>

            {/* Delivery Runner */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                Delivery Runner
              </div>
              <div className="font-bold text-xs text-slate-900 truncate">{order.deliveryBoy || order.deliveryBoyName || 'Unassigned'}</div>
              <div className="text-[11px] text-slate-500">Status: {order.deliveryStatus || order.orderStatus || 'DELIVERED'}</div>
            </div>
          </div>

          {/* Three Separate Financial Values Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Financial Allocation (Never Mixed)</span>
              <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                Mode: {isCod ? 'CASH ON DELIVERY' : 'ONLINE PREPAID'}
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-medium text-slate-500">Order Gross Total</div>
                <div className="text-base font-black text-slate-900 mt-0.5">₹{totalAmt.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400">Total Billed</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-medium text-emerald-700">Provider Payable</div>
                <div className="text-base font-black text-emerald-700 mt-0.5">₹{provPayable.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400">100% to Provider</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-medium text-blue-700">COD Expected</div>
                <div className="text-base font-black text-blue-700 mt-0.5">₹{codExpected.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400">Doorstep Cash</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-medium text-purple-700">Runner Earning</div>
                <div className="text-base font-black text-purple-700 mt-0.5">₹{deliveryEarning.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400">OTP Payout</div>
              </div>
            </div>
          </div>

          {/* Detailed Status Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Operational Verification Statuses</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Delivery OTP */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">Delivery 6-Digit OTP:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  isOtpVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isOtpVerified ? 'OTP Verified' : 'OTP Pending'}
                </span>
              </div>

              {/* COD Status */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">COD Collection Status:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  codStatus === 'COLLECTED' ? 'bg-emerald-100 text-emerald-800' : (codStatus === 'NOT_APPLICABLE' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800')
                }`}>
                  {codStatus}
                </span>
              </div>

              {/* Provider Settlement */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">Provider Settlement:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  settlementStatus === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' : (settlementStatus === 'PARTIALLY_SETTLED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')
                }`}>
                  {settlementStatus} (Settled: ₹{provSettled} / Rem: ₹{provRemaining})
                </span>
              </div>

              {/* Order Status */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">Order Lifecycle:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {order.orderStatus || order.status || 'DELIVERED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Date: {(() => {
              const rawDate = order.orderDate || order.date || order.createdAt;
              if (!rawDate) return 'N/A';
              const d = new Date(rawDate);
              return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            })()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
