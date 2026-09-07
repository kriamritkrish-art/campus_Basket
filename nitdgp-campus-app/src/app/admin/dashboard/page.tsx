'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import { AdminKpiCard } from '../../../components/admin/AdminKpiCard';
import { AttentionAlerts } from '../../../components/admin/AttentionAlerts';
import {
  RevenueTrendChart,
  CategoryBarChart,
  DistributionPieChart,
  HallDistributionChart
} from '../../../components/admin/AdminCharts';
import { ReceiptModal } from '../../../components/admin/ReceiptModal';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Clock,
  Shirt,
  AlertTriangle,
  CreditCard,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await apiRequest('/api/admin/dashboard?range=30d');
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-white border border-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white border border-slate-200 rounded-3xl" />
          <div className="h-80 bg-white border border-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const alerts = data?.attentionRequired || {};
  const viz = data?.visualizations || {};
  const recentOrders = data?.recentOrders || [];

  const orderStatusPieData = viz.orderStatus
    ? Object.entries(viz.orderStatus).map(([name, value]) => ({
        name,
        value: Number(value)
      }))
    : [];

  const paymentBreakdownPieData = viz.paymentBreakdown
    ? [
        { name: 'Razorpay UPI/Cards', value: viz.paymentBreakdown.razorpay || 0 },
        { name: 'Cash on Delivery (COD)', value: viz.paymentBreakdown.cod || 0 }
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. ATTENTION REQUIRED BANNER */}
      <AttentionAlerts alerts={alerts} />

      {/* 2. PRIMARY EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Total Revenue"
          value={`₹${(metrics.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          change={metrics.revenueChange || 14}
          subtitle="Net verified platform volume"
          color="green"
        />

        <AdminKpiCard
          title="Total Orders"
          value={(metrics.totalOrders || 0).toString()}
          icon={ShoppingBag}
          change={metrics.ordersChange || 9}
          subtitle="Food, fruits, essentials & laundry"
          color="blue"
        />

        <AdminKpiCard
          title="Active Students"
          value={(metrics.activeStudents || 1240).toString()}
          icon={Users}
          subtitle="100% verified campus roll numbers"
          color="purple"
        />

        <AdminKpiCard
          title="Avg Order Value"
          value={`₹${metrics.averageOrderValue || 260}`}
          icon={TrendingUp}
          subtitle="Per verified cart checkout"
          color="amber"
        />

        <AdminKpiCard
          title="Pending Orders"
          value={(metrics.pendingOrders || 0).toString()}
          icon={Clock}
          subtitle="Awaiting kitchen / vendor dispatch"
          color="amber"
        />

        <AdminKpiCard
          title="Active Laundry"
          value={(metrics.laundryOrders || 0).toString()}
          icon={Shirt}
          subtitle="Under dual-OTP custody"
          color="indigo"
        />

        <AdminKpiCard
          title="Low Stock Alerts"
          value={(metrics.lowStockProducts || 0).toString()}
          icon={AlertTriangle}
          subtitle="Inventory below threshold"
          color="red"
        />

        <AdminKpiCard
          title="Pending Payments"
          value={(metrics.pendingPayments || 0).toString()}
          icon={CreditCard}
          subtitle="Unsettled student transactions"
          color="blue"
        />
      </div>

      {/* 3. CHARTS SECTION: REVENUE TREND & CATEGORY REVENUE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Line/Area Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
                <span>Revenue Performance Trend</span>
                <span className="text-[10px] text-[#347A27] font-mono bg-[#4F9D32]/10 px-2 py-0.5 rounded-full border border-[#4F9D32]/20 font-bold">
                  Daily Timeline
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregated daily earnings from authorized orders
              </p>
            </div>
            <Link
              href="/admin/analytics?tab=sales"
              className="text-xs text-[#4F9D32] hover:text-[#347A27] flex items-center gap-1 font-bold transition-colors"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <RevenueTrendChart data={viz.revenueTrend || []} />
        </div>

        {/* Category Performance Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
                <span>Category Revenue Distribution</span>
                <span className="text-[10px] text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                  4 Services
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Food &bull; Fruits &bull; Express Laundry &bull; Essentials
              </p>
            </div>
            <Link
              href="/admin/analytics?tab=categories"
              className="text-xs text-[#4F9D32] hover:text-[#347A27] flex items-center gap-1 font-bold transition-colors"
            >
              <span>Drill-down</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <CategoryBarChart data={viz.categoryRevenue || []} />
        </div>
      </div>

      {/* 4. DONUT BREAKDOWNS: ORDER STATUS & PAYMENT METHODS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
              Order Fulfillment Stages
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">Live Status</span>
          </div>
          <DistributionPieChart
            data={orderStatusPieData}
            colors={['#2563EB', '#4F9D32', '#F59E0B', '#7C3AED', '#DC2626', '#64748B']}
          />
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
              Payment Settlement
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">Razorpay vs COD</span>
          </div>
          <DistributionPieChart
            data={paymentBreakdownPieData}
            colors={['#2563EB', '#4F9D32']}
          />
        </div>

        {/* Hall Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
              Hostel Hall Volume
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">Top Destinations</span>
          </div>
          <HallDistributionChart data={viz.hallDistribution || []} />
        </div>
      </div>

      {/* 5. TOP PRODUCTS TABLE & RECENT ORDERS TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Products Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
              Top Selling Products
            </h3>
            <Link
              href="/admin/products"
              className="text-[11px] text-[#4F9D32] hover:text-[#347A27] font-bold"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {(viz.topProducts || []).map((p: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#17202A] line-clamp-1">{p.name}</div>
                    <div className="text-[10px] text-slate-500">{p.unitsSold} units delivered</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-xs text-[#347A27] shrink-0">
                  ₹{p.revenue.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
                Recent Campus Orders
              </h3>
              <p className="text-[11px] text-slate-500">Real-time orders across all residence halls</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-[#4F9D32] hover:text-[#347A27] font-bold flex items-center gap-1 transition-colors"
            >
              <span>Manage Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 pb-2">
                <tr>
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Hostel Hall</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-mono font-bold text-[#4F9D32]">
                      <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3">
                      <div className="font-semibold text-[#17202A]">{o.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{o.rollNumber}</div>
                    </td>
                    <td className="py-3 text-slate-700">
                      <div>{o.hallName}</div>
                      <div className="text-[10px] text-slate-500">Room {o.roomNumber}</div>
                    </td>
                    <td className="py-3 font-mono font-bold text-[#17202A]">
                      ₹{o.totalAmount}
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedReceiptOrder(o)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#4F9D32] hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold">PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />
    </div>
  );
}
