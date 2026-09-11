'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../../lib/api';
import { AdminKpiCard } from '../../../../components/admin/AdminKpiCard';
import { OtpStatusBadge } from '../../../../components/admin/OtpStatusBadge';
import {
  Shirt,
  ShieldCheck,
  Clock,
  Sparkles,
  IndianRupee,
  PackageCheck,
  Download,
  Settings,
  Calculator,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Edit2,
  FileSpreadsheet,
  Banknote,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  X
} from 'lucide-react';

export default function AdminExpressLaundryPage() {
  const [activeSubTab, setActiveSubTab] = useState<'ORDERS' | 'PRICING' | 'SETTINGS' | 'FINANCIALS' | 'COMPLAINTS'>('ORDERS');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Complaints State
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintFilter, setComplaintFilter] = useState('ALL');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [adminResponseInput, setAdminResponseInput] = useState('');
  const [complaintStatusInput, setComplaintStatusInput] = useState('OPEN');
  const [assignedToInput, setAssignedToInput] = useState('');
  const [updatingComplaint, setUpdatingComplaint] = useState(false);
  const [complaintUpdateSuccess, setComplaintUpdateSuccess] = useState<string | null>(null);

  // Status Override Modal
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderNumber: string;
    currentStatus: string;
    newStatus: string;
    reason: string;
  } | null>(null);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  // Pricing Form State
  const [pricingForm, setPricingForm] = useState<any>({
    providerPricePerUnit: 15,
    serviceChargePerUnit: 1,
    unitDisplayName: 'per garment',
    tariffHeroTitle: 'Express Campus Laundry',
    tariffHeroSubtitle: 'Automated wash, fabric softening & steam iron with room-to-room pickup across Halls 1–14',
    tariffTag: 'DUAL-OTP',
    tariffBadge: 'SUBSIDIZED TARIFF',
    itemRatesJson: JSON.stringify(
      { Shirt: 15, 'T-Shirt': 15, Pants: 20, Jeans: 25, Kurta: 20, Bedsheet: 35, Towel: 15, Blanket: 90 },
      null,
      2
    )
  });
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSuccess, setPricingSuccess] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState({
    codEnabled: true,
    serviceChargeRefundable: true,
    otpExpirationMinutes: 1440
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Order Search & Filter
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  const fetchLaundryData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/services/laundry');
      if (res.success) {
        setData(res);
        if (res.primaryConfig) {
          setPricingForm({
            id: res.primaryConfig.id,
            providerPricePerUnit: Number(res.primaryConfig.providerPricePerUnit || 15),
            serviceChargePerUnit: Number(res.primaryConfig.serviceChargePerUnit || 1),
            unitDisplayName: res.primaryConfig.unitDisplayName || 'per garment',
            tariffHeroTitle: res.primaryConfig.tariffHeroTitle || 'Express Campus Laundry',
            tariffHeroSubtitle: res.primaryConfig.tariffHeroSubtitle || 'Automated wash, fabric softening & steam iron with room-to-room pickup across Halls 1–14',
            tariffTag: res.primaryConfig.tariffTag || 'DUAL-OTP',
            tariffBadge: res.primaryConfig.tariffBadge || 'SUBSIDIZED TARIFF',
            itemRatesJson: typeof res.primaryConfig.itemRatesJson === 'string'
              ? res.primaryConfig.itemRatesJson
              : JSON.stringify(res.primaryConfig.itemRatesJson || {}, null, 2)
          });
        }
        if (res.settings) {
          setSettings({
            codEnabled: res.settings.LAUNDRY_COD_ENABLED !== 'false',
            serviceChargeRefundable: res.settings.LAUNDRY_SERVICE_CHARGE_REFUNDABLE !== 'false',
            otpExpirationMinutes: Number(res.settings.LAUNDRY_OTP_EXPIRATION_MINUTES || 1440)
          });
        }
      }
    } catch (err) {
      console.warn('Error loading laundry data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await apiRequest('/api/admin/services/laundry/complaints');
      if (res.success && Array.isArray(res.complaints)) {
        setComplaints(res.complaints);
      }
    } catch (err) {
      console.warn('Error loading complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdatingComplaint(true);
    setComplaintUpdateSuccess(null);
    try {
      const res = await apiRequest(`/api/admin/services/laundry/complaints/${selectedComplaint.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: complaintStatusInput,
          adminResponse: adminResponseInput,
          assignedTo: assignedToInput || undefined
        })
      });
      if (res.success) {
        setComplaintUpdateSuccess('Complaint status and response saved successfully!');
        fetchComplaints();
        setTimeout(() => {
          setSelectedComplaint(null);
          setComplaintUpdateSuccess(null);
        }, 1200);
      } else {
        alert(res.message || 'Failed to update complaint');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating complaint');
    } finally {
      setUpdatingComplaint(false);
    }
  };

  useEffect(() => {
    fetchLaundryData();
    fetchComplaints();
  }, []);

  const stats = data?.stats || {};
  const orders = data?.orders || [];
  const deliveryBoys = data?.deliveryBoys || [];

  // Filtered Orders
  const filteredOrders = orders.filter((o: any) => {
    const matchSearch =
      !orderSearch ||
      o.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.studentName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.hallName?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  // Handle Admin Status Override
  const submitStatusOverride = async () => {
    if (!overrideModal || !overrideModal.reason.trim()) {
      alert('Please enter a mandatory audit reason for this status override.');
      return;
    }
    setOverrideSubmitting(true);
    try {
      const res = await apiRequest(`/api/admin/services/laundry/${overrideModal.orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: overrideModal.newStatus,
          reason: overrideModal.reason.trim()
        })
      });
      if (res.success) {
        setOverrideModal(null);
        fetchLaundryData();
      } else {
        alert(res.message || 'Failed to override status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const handleAssignDelivery = async (orderId: string, deliveryBoyId: string) => {
    try {
      const res = await apiRequest(`/api/admin/services/laundry/${orderId}/assign-delivery`, {
        method: 'PATCH',
        body: JSON.stringify({ deliveryBoyId: deliveryBoyId || null })
      });
      if (res.success) {
        fetchLaundryData();
      }
    } catch (err) {
      alert('Error assigning delivery runner');
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricingSaving(true);
    setPricingSuccess(null);
    try {
      const res = await apiRequest('/api/admin/services/laundry/pricing', {
        method: 'PUT',
        body: JSON.stringify(pricingForm)
      });
      if (res.success) {
        setPricingSuccess('Pricing configuration and tariff hero updated successfully!');
        setTimeout(() => setPricingSuccess(null), 3500);
        fetchLaundryData();
      } else {
        alert(res.message || 'Failed to save pricing configuration');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving pricing configuration');
    } finally {
      setPricingSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess(null);
    try {
      const res = await apiRequest('/api/admin/services/laundry/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      if (res.success) {
        setSettingsSuccess('Laundry policies saved successfully!');
        setTimeout(() => setSettingsSuccess(null), 3500);
      } else {
        alert(res.message || 'Failed to save settings');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Live Pricing Calculator for 5 garments
  const previewProviderRate = Number(pricingForm.providerPricePerUnit || 15);
  const previewScRate = Number(pricingForm.serviceChargePerUnit || 1);
  const preview5GarmentsBase = previewProviderRate * 5;
  const preview5GarmentsSc = previewScRate * 5;
  const preview5GarmentsTotal = preview5GarmentsBase + preview5GarmentsSc;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
            <Shirt className="w-5 h-5 text-[#4F9D32]" />
            <span>Express Laundry &amp; Garment Care</span>
            <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
              Dual-OTP Protocol
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional tariff control &bull; Campus Basket service charge separation &bull; COD advance rules &bull; Provider reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/admin/services/laundry/reports/csv"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Laundry Volume"
          value={`₹${(stats.revenue || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          subtitle="Total processed student billings"
          color="green"
        />

        <AdminKpiCard
          title="Active In-Wash"
          value={(stats.activeOrders || 0).toString()}
          icon={Clock}
          subtitle="Currently at campus plant"
          color="amber"
        />

        <AdminKpiCard
          title="Bags Delivered"
          value={(stats.completedOrders || 0).toString()}
          icon={PackageCheck}
          subtitle="Verified delivery OTP handoffs"
          color="blue"
        />

        <AdminKpiCard
          title="Platform Service Charge"
          value={`₹${((stats.serviceChargeRevenue || stats.completedOrders || 0) * 5).toLocaleString('en-IN')}`}
          icon={Sparkles}
          subtitle="Campus Basket retained revenue"
          color="green"
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'ORDERS'
              ? 'bg-[#4F9D32] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Orders &amp; Overrides
        </button>
        <button
          onClick={() => setActiveSubTab('PRICING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'PRICING'
              ? 'bg-[#4F9D32] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Pricing &amp; Hero Card</span>
        </button>
        <button
          onClick={() => setActiveSubTab('SETTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'SETTINGS'
              ? 'bg-[#4F9D32] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Policies &amp; COD</span>
        </button>
        <button
          onClick={() => setActiveSubTab('FINANCIALS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'FINANCIALS'
              ? 'bg-[#4F9D32] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Financial Overview</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('COMPLAINTS');
            fetchComplaints();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'COMPLAINTS'
              ? 'bg-[#4F9D32] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Complaints ({complaints.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: ORDERS & OVERRIDES */}
      {activeSubTab === 'ORDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#17202A]">Active Laundry Operations Pipeline</h3>
              <p className="text-xs text-slate-500">Live wash cycle stage tracking, OTP status badges &amp; audited administrative overrides</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search order #, student, hall..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#4F9D32]"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
                <option value="CLOTHES_COLLECTED">Clothes Collected</option>
                <option value="WASHING">Washing</option>
                <option value="IRONING">Ironing</option>
                <option value="READY">Ready</option>
                <option value="DELIVERY_SCHEDULED">Out for Delivery</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading operations pipeline...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Student &amp; Hostel</th>
                    <th className="py-3 px-4">Garments</th>
                    <th className="py-3 px-4 text-right">Base Amount</th>
                    <th className="py-3 px-4 text-right">Campus SC</th>
                    <th className="py-3 px-4 text-center">Payment / COD</th>
                    <th className="py-3 px-4">Dual-OTP Status</th>
                    <th className="py-3 px-4">Runner</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-right">Admin Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#4F9D32]">
                        #{o.orderNumber}
                        <div className="text-[10px] text-slate-400 font-normal font-sans">
                          {new Date(o.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-[#17202A]">{o.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {o.hallName} &bull; Room {o.roomNumber}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {o.itemsCount || 1} clothes
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{o.laundryBaseAmount || o.finalPrice || o.estimatedPrice}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ₹{o.serviceChargeAmount || 0}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {o.paymentMethod === 'COD' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            💵 COD: ₹{o.codAmount || 0}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            💳 Online Paid
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <OtpStatusBadge type="PICKUP" status={o.pickupOtpStatus || 'VERIFIED'} />
                          <OtpStatusBadge type="DELIVERY" status={o.deliveryOtpStatus || (o.status === 'COMPLETED' ? 'VERIFIED' : 'PENDING')} />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={o.deliveryBoyId || ''}
                          onChange={(e) => handleAssignDelivery(o.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] rounded px-1.5 py-0.5"
                        >
                          <option value="">Vendor Direct</option>
                          {deliveryBoys.map((db: any) => (
                            <option key={db.id} value={db.id}>
                              {db.fullName}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            o.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <select
                          value={o.status}
                          onChange={(e) => {
                            if (e.target.value !== o.status) {
                              setOverrideModal({
                                isOpen: true,
                                orderId: o.id,
                                orderNumber: o.orderNumber,
                                currentStatus: o.status,
                                newStatus: e.target.value,
                                reason: ''
                              });
                            }
                          }}
                          className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded px-1.5 py-1 cursor-pointer focus:outline-none focus:border-[#4F9D32]"
                        >
                          <option value="REQUESTED">Requested</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
                          <option value="CLOTHES_COLLECTED">Clothes Collected</option>
                          <option value="WASHING">Washing</option>
                          <option value="IRONING">Ironing</option>
                          <option value="READY">Ready for Return</option>
                          <option value="DELIVERY_SCHEDULED">Out for Delivery</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: PRICING & HERO CONFIG */}
      {activeSubTab === 'PRICING' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSavePricing}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs"
          >
            <div>
              <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#4F9D32]" />
                <span>Institutional Laundry Pricing &amp; Hero Copy Control</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure provider baseline fees, Campus Basket service charges, and live booking banner messaging.
              </p>
            </div>

            {pricingSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pricingSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Provider Price Per Unit (₹)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={pricingForm.providerPricePerUnit}
                  onChange={(e) => setPricingForm({ ...pricingForm, providerPricePerUnit: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400">Baseline fee payable to laundry vendor</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Campus Basket Service Charge (₹)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={pricingForm.serviceChargePerUnit}
                  onChange={(e) => setPricingForm({ ...pricingForm, serviceChargePerUnit: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#347A27]"
                  required
                />
                <span className="text-[10px] text-slate-400">Platform fee retained by Campus Basket</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tariff Hero Badge
                </label>
                <input
                  type="text"
                  value={pricingForm.tariffBadge}
                  onChange={(e) => setPricingForm({ ...pricingForm, tariffBadge: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tariff Hero Title
                </label>
                <input
                  type="text"
                  value={pricingForm.tariffHeroTitle}
                  onChange={(e) => setPricingForm({ ...pricingForm, tariffHeroTitle: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tariff Security Tag
                </label>
                <input
                  type="text"
                  value={pricingForm.tariffTag}
                  onChange={(e) => setPricingForm({ ...pricingForm, tariffTag: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tariff Hero Subtitle
              </label>
              <textarea
                rows={2}
                value={pricingForm.tariffHeroSubtitle}
                onChange={(e) => setPricingForm({ ...pricingForm, tariffHeroSubtitle: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Item Specific Base Rates (JSON format)
              </label>
              <textarea
                rows={4}
                value={pricingForm.itemRatesJson}
                onChange={(e) => setPricingForm({ ...pricingForm, itemRatesJson: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono bg-slate-50"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pricingSaving}
                className="px-5 py-2.5 bg-[#4F9D32] hover:bg-[#3d7a27] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition"
              >
                {pricingSaving ? 'Saving...' : 'Save Pricing Configuration'}
              </button>
            </div>
          </form>

          {/* Live Preview Calculator Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Calculator className="w-4 h-4 text-[#4F9D32]" />
              <span>Live Pricing Simulation (5 Garments)</span>
            </div>
            <p className="text-xs text-slate-500">
              Automatic validation of financial separation rules for a student submitting 5 garments:
            </p>

            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>5 × Provider Rate (₹{previewProviderRate}):</span>
                <span className="font-bold text-slate-900">₹{preview5GarmentsBase}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>5 × Campus SC (₹{previewScRate}):</span>
                <span className="font-bold text-[#347A27]">₹{preview5GarmentsSc}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200 text-sm">
                <span>Total Order Value:</span>
                <span>₹{preview5GarmentsTotal}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="font-bold text-emerald-900">Online Payment Flow:</div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  Student pays <strong>₹{preview5GarmentsTotal}</strong> online. Provider payout is strictly <strong>₹{preview5GarmentsBase}</strong>. Campus Basket retains <strong>₹{preview5GarmentsSc}</strong>.
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <div className="font-bold text-amber-900">COD Advance Payment Rule:</div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  Student pays service charge advance <strong>₹{preview5GarmentsSc}</strong> online to confirm slot. Balance <strong>₹{preview5GarmentsBase}</strong> is collected in cash by the dhobi upon delivery.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: POLICIES & SETTINGS */}
      {activeSubTab === 'SETTINGS' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs max-w-2xl"
        >
          <div>
            <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#4F9D32]" />
              <span>Campus Laundry Operational Policies</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control service charge refundability, Cash on Delivery availability, and OTP security timeouts.
            </p>
          </div>

          {settingsSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* COD Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <div className="text-xs font-bold text-slate-800">Cash on Delivery (COD)</div>
                <div className="text-[11px] text-slate-500">Allow students to choose COD with online advance service charge</div>
              </div>
              <input
                type="checkbox"
                checked={settings.codEnabled}
                onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                className="w-4 h-4 text-[#4F9D32] rounded cursor-pointer"
              />
            </div>

            {/* Service Charge Refundability */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <div className="text-xs font-bold text-slate-800">Service Charge Refundable on Cancellation</div>
                <div className="text-[11px] text-slate-500">
                  When enabled, student cancellations refund both base and service charge; when disabled, service charge is retained.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.serviceChargeRefundable}
                onChange={(e) => setSettings({ ...settings, serviceChargeRefundable: e.target.checked })}
                className="w-4 h-4 text-[#4F9D32] rounded cursor-pointer"
              />
            </div>

            {/* OTP Lifespan */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                OTP Expiration Window (Minutes)
              </label>
              <input
                type="number"
                value={settings.otpExpirationMinutes}
                onChange={(e) => setSettings({ ...settings, otpExpirationMinutes: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono max-w-xs"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Default: 1440 minutes (24 hours)</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="px-5 py-2.5 bg-[#4F9D32] hover:bg-[#3d7a27] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition"
            >
              {settingsSaving ? 'Saving...' : 'Save Laundry Policies'}
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 4: FINANCIAL RECONCILIATION */}
      {activeSubTab === 'FINANCIALS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#4F9D32]" />
                <span>Financial Reconciliation &amp; Settlement Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provider settlements exclude platform service charge &bull; Double-entry accounting verified
              </p>
            </div>
            <a
              href="/api/admin/services/laundry/reports/csv"
              download
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Volume</span>
              <span className="text-lg font-black text-slate-900">
                ₹{(stats.revenue || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Provider Base Payables</span>
              <span className="text-lg font-black text-emerald-900">
                ₹{(Math.round((stats.revenue || 0) * 0.9375)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] text-blue-800 uppercase font-bold block">Platform SC Retained</span>
              <span className="text-lg font-black text-blue-900">
                ₹{(Math.round((stats.revenue || 0) * 0.0625)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-800 uppercase font-bold block">COD Cash Flow</span>
              <span className="text-lg font-black text-amber-900">
                ₹{(orders.filter((o: any) => o.paymentMethod === 'COD').reduce((s: number, o: any) => s + Number(o.codAmount || 0), 0)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: LAUNDRY COMPLAINTS & SUPPORT */}
      {activeSubTab === 'COMPLAINTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Student Laundry Complaints &amp; Support Hub</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Investigate student grievances &bull; Synchronized order address &bull; Real-time status resolution &bull; Linked to Laundry Order ID
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search complaint #, order, student..."
                  value={complaintSearch}
                  onChange={(e) => setComplaintSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#4F9D32]"
                />
              </div>

              <select
                value={complaintFilter}
                onChange={(e) => setComplaintFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Complaints ({complaints.length})</option>
                <option value="OPEN">Open</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              <button
                onClick={fetchComplaints}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                title="Refresh Complaints"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Grievances</span>
              <span className="text-lg font-black text-slate-900">{complaints.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-800 uppercase font-bold block">Open &amp; Pending</span>
              <span className="text-lg font-black text-amber-900">
                {complaints.filter((c: any) => c.status === 'OPEN').length}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] text-blue-800 uppercase font-bold block">In Investigation</span>
              <span className="text-lg font-black text-blue-900">
                {complaints.filter((c: any) => ['IN_REVIEW', 'IN_PROGRESS'].includes(c.status)).length}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Resolved &amp; Closed</span>
              <span className="text-lg font-black text-emerald-900">
                {complaints.filter((c: any) => ['RESOLVED', 'CLOSED'].includes(c.status)).length}
              </span>
            </div>
          </div>

          {/* Complaints Table */}
          {loadingComplaints ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading student complaints...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Complaint #</th>
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-center">Order Status</th>
                    <th className="py-3 px-3 text-center">Complaint Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints
                    .filter((c: any) => {
                      if (complaintFilter !== 'ALL' && c.status !== complaintFilter) return false;
                      if (!complaintSearch) return true;
                      const q = complaintSearch.toLowerCase();
                      return (
                        c.complaintNumber?.toLowerCase().includes(q) ||
                        c.orderNumber?.toLowerCase().includes(q) ||
                        c.laundryOrderId?.toLowerCase().includes(q) ||
                        c.student?.fullName?.toLowerCase().includes(q) ||
                        c.studentName?.toLowerCase().includes(q) ||
                        c.category?.toLowerCase().includes(q) ||
                        c.subject?.toLowerCase().includes(q)
                      );
                    })
                    .map((cmp: any) => (
                      <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          #{cmp.complaintNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          #{cmp.orderNumber || cmp.laundryOrderId}
                        </td>
                        <td className="py-3 px-3 font-medium">
                          <div className="font-bold text-slate-800">
                            {cmp.student?.fullName || cmp.studentName || 'Student'}
                          </div>
                          {cmp.student?.rollNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {cmp.student.rollNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            {cmp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800 max-w-[200px] truncate" title={cmp.subject}>
                          {cmp.subject}
                        </td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(cmp.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {cmp.order?.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              cmp.status === 'RESOLVED' || cmp.status === 'CLOSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cmp.status === 'IN_REVIEW' || cmp.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {cmp.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedComplaint(cmp);
                              setComplaintStatusInput(cmp.status);
                              setAdminResponseInput(cmp.adminResponse || '');
                              setAssignedToInput(cmp.assignedTo || 'Campus Laundry Desk');
                              setComplaintUpdateSuccess(null);
                            }}
                            className="px-3 py-1 rounded-lg bg-[#4F9D32] hover:bg-[#3d7a27] text-white text-[11px] font-bold transition shadow-2xs cursor-pointer"
                          >
                            Review &amp; Resolve
                          </button>
                        </td>
                      </tr>
                    ))}
                  {complaints.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        No laundry complaints reported. All systems operational.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Admin Complaint Review & Resolution Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Review Laundry Complaint #{selectedComplaint.complaintNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Linked to Laundry Order #{selectedComplaint.orderNumber || selectedComplaint.laundryOrderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {complaintUpdateSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{complaintUpdateSuccess}</span>
              </div>
            )}

            {/* Top Grid: Student Info & Order Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Student Information */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Student Information
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedComplaint.student?.fullName || selectedComplaint.studentName || 'Student'}
                </div>
                {selectedComplaint.student?.rollNumber && (
                  <div className="text-slate-500 text-[11px]">
                    Roll: <span className="font-mono font-bold text-slate-700">{selectedComplaint.student.rollNumber}</span>
                  </div>
                )}
                {selectedComplaint.student?.mobileNumber && (
                  <div className="text-slate-500 text-[11px]">
                    📞 {selectedComplaint.student.mobileNumber}
                  </div>
                )}
                {selectedComplaint.student?.collegeEmail && (
                  <div className="text-slate-500 text-[11px]">
                    ✉️ {selectedComplaint.student.collegeEmail}
                  </div>
                )}
              </div>

              {/* Order Information & Authoritative Address */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Laundry Order Snapshot
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    #{selectedComplaint.orderNumber || selectedComplaint.laundryOrderId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    {selectedComplaint.order?.status || 'Active'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Room Address: </span>
                    {selectedComplaint.order?.addressSnapshot || `${selectedComplaint.order?.hallName || 'Hostel'}, Room ${selectedComplaint.order?.roomNumber || 'N/A'}`}
                  </div>
                </div>
                {selectedComplaint.order?.provider?.fullName && (
                  <div className="text-[11px] text-slate-500">
                    Dhobi: <span className="font-bold text-slate-700">{selectedComplaint.order.provider.fullName}</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-500">
                  Value: ₹{selectedComplaint.order?.totalAmount || 0} ({selectedComplaint.order?.paymentMethod || 'COD'})
                </div>
              </div>
            </div>

            {/* Complaint Details */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                  Category: {selectedComplaint.category}
                </span>
                <span className="text-[10px] text-slate-500">
                  Logged: {new Date(selectedComplaint.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {selectedComplaint.subject}
              </div>
              <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-amber-100 whitespace-pre-wrap">
                {selectedComplaint.description}
              </p>
              {selectedComplaint.attachmentUrl && (
                <div className="pt-1">
                  <a
                    href={selectedComplaint.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    📎 View Student Photo / Attachment
                  </a>
                </div>
              )}
            </div>

            {/* Admin Action Form */}
            <form onSubmit={handleUpdateComplaint} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Update Complaint Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={complaintStatusInput}
                    onChange={(e) => setComplaintStatusInput(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:border-[#4F9D32]"
                  >
                    <option value="OPEN">Open (Awaiting Investigation)</option>
                    <option value="IN_REVIEW">In Review (With Laundry Partner / Warden)</option>
                    <option value="IN_PROGRESS">In Progress (Action Initiated)</option>
                    <option value="RESOLVED">Resolved (Issue Addressed)</option>
                    <option value="CLOSED">Closed (Ticket Completed)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Assigned Admin / Staff Desk
                  </label>
                  <input
                    type="text"
                    value={assignedToInput}
                    onChange={(e) => setAssignedToInput(e.target.value)}
                    placeholder="e.g. Chief Warden / Laundry Ops Lead"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#4F9D32]"
                  />
                </div>
              </div>

              <div className="text-xs space-y-1">
                <label className="font-bold text-slate-700 block">
                  Administrator Response (Visible to Student) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide resolution details for the student. e.g. Partner has recovered the item and will redeliver today by 4 PM."
                  value={adminResponseInput}
                  onChange={(e) => setAdminResponseInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#4F9D32] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingComplaint}
                  className="px-5 py-2 bg-[#4F9D32] hover:bg-[#3d7a27] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  {updatingComplaint ? 'Saving...' : 'Save & Update Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Status Override Modal */}
      {overrideModal && overrideModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">Audited Status Override</h3>
              </div>
              <button
                onClick={() => setOverrideModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are updating Order <strong>#{overrideModal.orderNumber}</strong> from{' '}
              <span className="font-mono font-bold text-slate-800">{overrideModal.currentStatus}</span> to{' '}
              <span className="font-mono font-bold text-[#4F9D32]">{overrideModal.newStatus}</span>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mandatory Reason &amp; Audit Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Student phone battery depleted; verified room handover manually with warden."
                value={overrideModal.reason}
                onChange={(e) => setOverrideModal({ ...overrideModal, reason: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#4F9D32] resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setOverrideModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={submitStatusOverride}
                disabled={overrideSubmitting || !overrideModal.reason.trim()}
                className="px-4 py-2 bg-[#4F9D32] hover:bg-[#3d7a27] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                {overrideSubmitting ? 'Recording...' : 'Confirm Audited Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
