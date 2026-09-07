'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { AdminKpiCard } from '../../../components/admin/AdminKpiCard';
import {
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle,
  Save,
  Calendar,
  Search,
  Download,
  IndianRupee,
  Store,
  Users,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Receipt
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'PROVIDERS' | 'CUSTOMERS' | 'TRANSACTIONS' | 'COD' | 'REFUNDS'>('PROVIDERS');
  
  // Timeframe Filter (Default to 30 Days as requested)
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  // Financial Data State
  const [financialData, setFinancialData] = useState<any>(null);
  const [financialLoading, setFinancialLoading] = useState(true);

  // Search & Secondary Filters
  const [providerSearch, setProviderSearch] = useState('');
  const [providerCategoryFilter, setProviderCategoryFilter] = useState('ALL');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerHallFilter, setCustomerHallFilter] = useState('ALL');

  // Transactions Tab State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // COD config state
  const [codEnabled, setCodEnabled] = useState(true);
  const [maxCodAmount, setMaxCodAmount] = useState('1500');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Financial Ledger Data from backend
  const fetchFinancialSummary = async () => {
    setFinancialLoading(true);
    try {
      let query = `/api/admin/financial-summary?timeframe=${timeframe}`;
      if (timeframe === 'custom' && customStartDate && customEndDate) {
        query += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      const res = await apiRequest(query);
      if (res.success) {
        setFinancialData(res);
      }
    } catch (err) {
      console.warn('Financial summary fetch error:', err);
    } finally {
      setFinancialLoading(false);
    }
  };

  // Fetch raw orders and settings
  const fetchGeneralData = async () => {
    setOrdersLoading(true);
    try {
      const [ordersRes, settingsRes] = await Promise.all([
        apiRequest('/api/admin/orders?limit=100'),
        apiRequest('/api/admin/settings')
      ]);

      if (ordersRes.success && ordersRes.orders) {
        setOrders(ordersRes.orders);
      }
      if (settingsRes.success && settingsRes.settings) {
        const cod = settingsRes.settings.find((s: any) => s.key === 'ENABLE_CASH_ON_DELIVERY');
        if (cod) setCodEnabled(cod.value === 'true');
        const maxCod = settingsRes.settings.find((s: any) => s.key === 'MAX_COD_AMOUNT');
        if (maxCod) setMaxCodAmount(maxCod.value);
      }
    } catch (err) {
      console.warn('General data fetch error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialSummary();
  }, [timeframe]);

  useEffect(() => {
    fetchGeneralData();
  }, []);

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStartDate && customEndDate) {
      setTimeframe('custom');
      fetchFinancialSummary();
    }
  };

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
      alert('COD parameters saved successfully to Railway MySQL database.');
    } catch (err) {
      alert('Error saving COD settings');
    } finally {
      setIsSaving(false);
    }
  };

  const kpis = financialData?.kpis || {};
  const rawProviders: any[] = financialData?.providers || [];
  const rawCustomers: any[] = financialData?.customers || [];

  // Filtered Providers
  const filteredProviders = rawProviders.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(providerSearch.toLowerCase()) ||
      p.username.toLowerCase().includes(providerSearch.toLowerCase());
    const matchesCat =
      providerCategoryFilter === 'ALL' ||
      p.category.toLowerCase().includes(providerCategoryFilter.toLowerCase());
    return matchesQuery && matchesCat;
  });

  // Filtered Customers
  const filteredCustomers = rawCustomers.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.rollNumber.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.roomNumber.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesHall =
      customerHallFilter === 'ALL' ||
      c.hallName.toLowerCase().includes(customerHallFilter.toLowerCase());
    return matchesQuery && matchesHall;
  });

  const refundOrders = orders.filter((o) => o.status === 'REFUNDED' || o.status === 'REFUND_REQUESTED');

  const exportFinancialCsv = () => {
    if (!rawProviders.length && !rawCustomers.length) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'PROVIDER FINANCIAL LEDGER (Filtered Timeframe: ' + timeframe + ')\n';
    csvContent += 'Provider Name,Category,Username,Total Orders,Delivered Orders,Gross Sales (INR),Discounts (INR),Refunds (INR),Platform Fee (INR),Net Payable (INR),Settled (INR),Pending Settlement (INR),Online Sales (INR),COD Sales (INR),AOV (INR)\n';
    rawProviders.forEach((p) => {
      csvContent += `"${p.name}","${p.category}","${p.username}",${p.totalOrders},${p.deliveredOrders},${p.grossSales},${p.totalDiscounts},${p.totalRefunds},${p.platformFee},${p.netPayable},${p.settledAmount},${p.pendingSettlement},${p.onlineSales},${p.codSales},${p.aov}\n`;
    });
    csvContent += '\nCUSTOMER FINANCIAL LEDGER\n';
    csvContent += 'Student Name,Roll Number,Email,Hall,Room,Total Orders,Completed Orders,Total Spent (INR),Discounts Saved (INR),Refunds (INR),AOV (INR),Online Orders,COD Orders,Last Order Date\n';
    rawCustomers.forEach((c) => {
      csvContent += `"${c.name}","${c.rollNumber}","${c.email}","${c.hallName}","${c.roomNumber}",${c.totalOrders},${c.deliveredOrders},${c.totalSpent},${c.totalDiscounts},${c.totalRefunded},${c.aov},${c.onlineOrdersCount},${c.codOrdersCount},"${c.lastOrderDate || 'N/A'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campus_financial_summary_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Top Header & Global Timeframe Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
            <CreditCard className="w-4 h-4" />
            <span>Campus Financial Audit &amp; Settlement System</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Financial Ledger &amp; Money Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provider settlements, student expenditure drilldowns, platform commissions &amp; automated fee ledger
          </p>
        </div>

        {/* Global Timeframe Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => { setTimeframe('today'); setIsCustomDateOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'today' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => { setTimeframe('7d'); setIsCustomDateOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === '7d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => { setTimeframe('30d'); setIsCustomDateOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === '30d' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => { setTimeframe('90d'); setIsCustomDateOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === '90d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => { setTimeframe('this_month'); setIsCustomDateOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'this_month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => { setTimeframe('all'); setIsCustomDateOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setIsCustomDateOpen(!isCustomDateOpen)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                timeframe === 'custom' || isCustomDateOpen
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>

          <button
            onClick={fetchFinancialSummary}
            className="p-2 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition shadow-xs"
            title="Refresh financial ledger"
          >
            <RefreshCw className={`w-4 h-4 ${financialLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportFinancialCsv}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Custom Date Selector Drawer */}
      {isCustomDateOpen && (
        <form
          onSubmit={handleApplyCustomDates}
          className="bg-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-800 flex flex-wrap items-center gap-4 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Filter Financial Data by Custom Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs transition"
          >
            Apply Range
          </button>
        </form>
      )}

      {/* Financial Executive KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Gross Platform Volume</span>
            <IndianRupee className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            ₹{Number(kpis.totalGrossVolume || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            {kpis.totalOrdersCount || 0} total campus orders
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Delivered &amp; Settled</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-900">
            ₹{Number(kpis.deliveredVolume || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-emerald-700 mt-1">
            {kpis.completedOrdersCount || 0} orders delivered
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
            <span>Net Provider Payable</span>
            <Store className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-black text-blue-950">
            ₹{Number(kpis.totalProviderPayable || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-blue-700 mt-1">
            Payable after 5% platform fee
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold">
            <span>Platform Commission</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-xl font-black text-indigo-950">
            ₹{Number(kpis.netPlatformRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-indigo-700 mt-1">
            5% campus tech infrastructure fee
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Student Savings</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-black text-amber-950">
            ₹{Number(kpis.totalDiscounts || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-amber-700 mt-1">
            Coupon &amp; promo savings
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>Refunds Processed</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-black text-rose-950">
            ₹{Number(kpis.totalRefunds || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-rose-700 mt-1">
            Deducted from payouts
          </div>
        </div>
      </div>

      {/* Tab Navigation Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('PROVIDERS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PROVIDERS'
                ? 'bg-[#4F9D32] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Service Provider Financials</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'PROVIDERS' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {rawProviders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CUSTOMERS'
                ? 'bg-[#4F9D32] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer &amp; Student Spend</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'CUSTOMERS' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {rawCustomers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-[#4F9D32] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Transactions Ledger</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'TRANSACTIONS' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('REFUNDS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'REFUNDS'
                ? 'bg-[#4F9D32] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refunds &amp; Disputes</span>
            {refundOrders.length > 0 && (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px]">
                {refundOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('COD')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'COD'
                ? 'bg-[#4F9D32] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>COD Parameters</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span>Active Timeframe:</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {timeframe === '30d' ? 'Last 30 Days' : timeframe.toUpperCase()}
          </span>
        </div>
      </div>

      {/* =========================================================
          TAB 1: SERVICE PROVIDER-WISE FINANCIAL LEDGER
          ========================================================= */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search provider by name, category, or vendor username..."
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Category:</span>
              <select
                value={providerCategoryFilter}
                onChange={(e) => setProviderCategoryFilter(e.target.value)}
                className="border border-slate-200 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Food">Food &amp; Meals</option>
                <option value="Laundry">Express Laundry</option>
                <option value="Essential">Stationery &amp; Essentials</option>
                <option value="Fruit">Fresh Fruits</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Service Provider</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-center">Orders (Done / Total)</th>
                    <th className="py-3.5 px-4 text-right">Gross Volume</th>
                    <th className="py-3.5 px-4 text-right">Discounts</th>
                    <th className="py-3.5 px-4 text-right">Refunds</th>
                    <th className="py-3.5 px-4 text-right">Platform Fee (5%)</th>
                    <th className="py-3.5 px-4 text-right font-black text-slate-900">Net Provider Payable</th>
                    <th className="py-3.5 px-4 text-center">Online vs COD</th>
                    <th className="py-3.5 px-4 text-center">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProviders.length > 0 ? (
                    filteredProviders.map((prov) => (
                      <tr key={prov.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{prov.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {prov.username} • {prov.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            prov.category.toLowerCase().includes('laundry')
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : prov.category.toLowerCase().includes('food')
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : prov.category.toLowerCase().includes('fruit')
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-teal-50 text-teal-700 border-teal-200'
                          }`}>
                            {prov.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-slate-900">
                            {prov.deliveredOrders} <span className="text-slate-400 font-normal">/ {prov.totalOrders}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {prov.totalOrders > 0
                              ? Math.round((prov.deliveredOrders / prov.totalOrders) * 100)
                              : 0}% fulfillment
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          ₹{Number(prov.grossSales).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right text-amber-700 font-medium">
                          {prov.totalDiscounts > 0 ? `-₹${Number(prov.totalDiscounts).toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-600 font-medium">
                          {prov.totalRefunds > 0 ? `-₹${Number(prov.totalRefunds).toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td className="py-3.5 px-4 text-right text-indigo-700 font-medium">
                          ₹{Number(prov.platformFee).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                          ₹{Number(prov.netPayable).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="text-[11px] font-semibold text-slate-700">
                            ₹{Number(prov.onlineSales).toLocaleString('en-IN')} <span className="text-blue-600 text-[10px] font-bold">UPI</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ₹{Number(prov.codSales).toLocaleString('en-IN')} COD
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {prov.pendingSettlement > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              ₹{Number(prov.pendingSettlement).toLocaleString('en-IN')} Pending
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Settled / Cleared
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No service providers found matching filters for this timeframe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: CUSTOMER / STUDENT-WISE FINANCIAL LEDGER
          ========================================================= */}
      {activeTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name, roll number, college email or room..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Residence Hall:</span>
              <select
                value={customerHallFilter}
                onChange={(e) => setCustomerHallFilter(e.target.value)}
                className="border border-slate-200 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Campus Halls</option>
                <option value="Hall 11">Hall 11</option>
                <option value="Hall 2">Hall 2</option>
                <option value="Hall 5">Hall 5</option>
                <option value="Mother Teresa">Mother Teresa Hall</option>
                <option value="Hall 14">Hall 14</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Student Name &amp; Roll</th>
                    <th className="py-3.5 px-4">Hostel / Room</th>
                    <th className="py-3.5 px-4 text-center">Orders Count</th>
                    <th className="py-3.5 px-4 text-right">Total Money Spent</th>
                    <th className="py-3.5 px-4 text-right">Discounts Saved</th>
                    <th className="py-3.5 px-4 text-right">Refunds</th>
                    <th className="py-3.5 px-4 text-right">Average Order (AOV)</th>
                    <th className="py-3.5 px-4 text-center">Payment Channels</th>
                    <th className="py-3.5 px-4 text-right">Last Order Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{cust.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {cust.rollNumber} • {cust.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{cust.hallName}</span>
                          <div className="text-[11px] text-slate-500 font-mono">Room {cust.roomNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800">
                            {cust.totalOrders} orders
                          </span>
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            {cust.deliveredOrders} delivered
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                          ₹{Number(cust.totalSpent).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold">
                          {cust.totalDiscounts > 0 ? `₹${Number(cust.totalDiscounts).toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-600 font-semibold">
                          {cust.totalRefunded > 0 ? `₹${Number(cust.totalRefunded).toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                          ₹{Number(cust.aov).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="text-[11px] font-semibold text-slate-700">
                            {cust.onlineOrdersCount} Online <span className="text-slate-400">|</span> {cust.codOrdersCount} COD
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                          {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : 'No orders yet'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No students found matching filters for this timeframe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: TRANSACTIONS LIST
          ========================================================= */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Gateway &amp; COD Transactions</h3>
            <span className="text-xs text-slate-500">Showing last {orders.length} campus transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4 text-right">Gross Amount</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-center">Fulfillment</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{o.student?.fullName || 'Student'}</div>
                      <div className="text-[11px] text-slate-400">{o.hallName} • {o.roomNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        o.paymentMethod === 'COD' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay UPI'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.paymentStatus === 'REFUNDED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.paymentStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[11px] font-semibold text-slate-600">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(o.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: COD CONTROLS
          ========================================================= */}
      {activeTab === 'COD' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <span>Hostel Cash on Delivery (COD) Rules</span>
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Configure COD availability and maximum ceiling limits across student halls.
          </p>

          <form onSubmit={handleSaveCodSettings} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Enable Cash on Delivery</span>
                <span className="text-xs text-slate-500">Allow students to pay delivery runners upon physical delivery</span>
              </div>
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Maximum COD Limit per Order (INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={maxCodAmount}
                  onChange={(e) => setMaxCodAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="1500"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Orders exceeding this value must use Razorpay Online Gateway.</p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving parameters...' : 'Save COD Settings'}</span>
            </button>
          </form>
        </div>
      )}

      {/* =========================================================
          TAB 5: REFUNDS & DISPUTES
          ========================================================= */}
      {activeTab === 'REFUNDS' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span>Student Refund Requests &amp; Disputes</span>
            </h3>
            <span className="text-xs text-slate-500">{refundOrders.length} records requiring attention</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-slate-600">Payment Method</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refundOrders.length > 0 ? (
                  refundOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-3 px-4 font-semibold">{o.student?.fullName || 'Student'}</td>
                      <td className="py-3 px-4 font-black text-rose-700">₹{Number(o.totalAmount || 0)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{o.paymentMethod}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={async () => {
                            if (confirm(`Authorize refund of ₹${o.totalAmount} for ${o.orderNumber}?`)) {
                              await apiRequest('/api/admin/orders/refund', {
                                method: 'POST',
                                body: JSON.stringify({ orderId: o.id, amount: o.totalAmount, reason: 'Admin Approved' })
                              });
                              alert('Refund processed successfully');
                              fetchGeneralData();
                              fetchFinancialSummary();
                            }
                          }}
                          className="px-3 py-1 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700 transition"
                        >
                          Process Refund
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No active refund requests or disputed orders pending.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
