'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { AdminKpiCard } from '../../../components/admin/AdminKpiCard';
import {
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle,
  Save
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'COD' | 'REFUNDS'>('TRANSACTIONS');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // COD config state
  const [codEnabled, setCodEnabled] = useState(true);
  const [maxCodAmount, setMaxCodAmount] = useState('1500');
  const [isSaving, setIsSaving] = useState(false);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/orders?limit=50');
      const settingsRes = await apiRequest('/api/admin/settings');

      if (res.success && res.orders) setOrders(res.orders);
      if (settingsRes.success && settingsRes.settings) {
        const cod = settingsRes.settings.find((s: any) => s.key === 'ENABLE_CASH_ON_DELIVERY');
        if (cod) setCodEnabled(cod.value === 'true');
        const maxCod = settingsRes.settings.find((s: any) => s.key === 'MAX_COD_AMOUNT');
        if (maxCod) setMaxCodAmount(maxCod.value);
      }
    } catch (err) {
      console.warn('Payment fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const handleSaveCodSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await Promise.all([
        apiRequest('/api/admin/settings', {
          method: 'POST',
          body: JSON.stringify({
            key: 'ENABLE_CASH_ON_DELIVERY',
            value: codEnabled ? 'true' : 'false',
            description: 'Allow Cash on Delivery for hostel deliveries'
          })
        }),
        apiRequest('/api/admin/settings', {
          method: 'POST',
          body: JSON.stringify({
            key: 'MAX_COD_AMOUNT',
            value: maxCodAmount,
            description: 'Maximum permitted amount for Cash on Delivery orders'
          })
        })
      ]);
      alert('COD parameters saved successfully to Railway MySQL');
    } catch (err) {
      alert('Error saving COD settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Aggregations
  const totalVolume = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const razorpayOrders = orders.filter((o) => o.paymentMethod !== 'COD');
  const codOrders = orders.filter((o) => o.paymentMethod === 'COD');
  const refundOrders = orders.filter((o) => o.status === 'REFUNDED' || o.status === 'REFUND_REQUESTED');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#4F9D32]" />
            <span>Campus Payments &amp; Settlement Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Razorpay gateway transactions, hostel Cash on Delivery (COD) limits &amp; student refunds
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-[#4F9D32] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('COD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'COD'
                ? 'bg-[#4F9D32] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            COD Controls
          </button>
          <button
            onClick={() => setActiveTab('REFUNDS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'REFUNDS'
                ? 'bg-[#4F9D32] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disputes &amp; Refunds
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Gross Captured"
          value={`₹${totalVolume.toLocaleString('en-IN')}`}
          icon={CreditCard}
          subtitle="All payment channels"
          color="green"
        />

        <AdminKpiCard
          title="Online / Razorpay"
          value={razorpayOrders.length.toString()}
          icon={CheckCircle}
          subtitle="Instant UPI & cards"
          color="blue"
        />

        <AdminKpiCard
          title="Cash on Delivery"
          value={codOrders.length.toString()}
          icon={Banknote}
          subtitle="Hostel room collections"
          color="amber"
        />

        <AdminKpiCard
          title="Total Refunds"
          value={refundOrders.length.toString()}
          icon={RotateCcw}
          subtitle="Returned to student bank"
          color="purple"
        />
      </div>

      {/* TAB 1: TRANSACTIONS TABLE */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Settlement Ledger
            </span>
            <span className="text-xs text-slate-500 font-mono">{orders.length} transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction / Order</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Capture Status</th>
                  <th className="py-3 px-4 text-right">Settlement Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#4F9D32]">
                      {o.orderNumber}
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        Gate: {o.hallName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#17202A]">{o.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{o.rollNumber}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#17202A]">
                      ₹{o.totalAmount}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          o.paymentMethod === 'COD'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {o.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          o.paymentStatus === 'COMPLETED' || o.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COD SETTINGS */}
      {activeTab === 'COD' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#4F9D32]" />
              <span>Cash on Delivery (COD) Rules</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hostel room delivery cash policies &amp; risk limits
            </p>
          </div>

          <form onSubmit={handleSaveCodSettings} className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-[#17202A] block">Enable COD for Students</span>
                <span className="text-slate-500 text-[11px]">
                  Allow paying upon hostel room arrival
                </span>
              </div>
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-[#4F9D32] focus:ring-[#4F9D32]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Maximum COD Order Ceiling (₹)
              </label>
              <input
                type="number"
                value={maxCodAmount}
                onChange={(e) => setMaxCodAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Carts exceeding this amount must be paid online via Razorpay.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating...' : 'Save COD Settings'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: REFUNDS */}
      {activeTab === 'REFUNDS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Student Refunds &amp; Cancellations
            </span>
            <span className="text-xs text-slate-500 font-mono">{refundOrders.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Refund Reason</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refundOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#4F9D32]">
                      {o.orderNumber}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#17202A]">
                      {o.studentName}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#17202A]">
                      ₹{o.totalAmount}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      Out of stock / kitchen operational cancellation
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        REFUNDED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
