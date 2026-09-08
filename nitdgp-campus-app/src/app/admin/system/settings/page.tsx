'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  Mail,
  Phone,
  Banknote,
  Truck,
  Power,
  ShieldAlert,
  Info,
  KeyRound,
  Store,
  RotateCcw,
  Lock,
  Sliders,
  Package,
  Clock,
  Sparkles,
  Search,
  Check,
  ShieldCheck,
  Utensils,
  BookOpen,
  Apple,
  FileDown
} from 'lucide-react';
import { apiRequest, getApiBase } from '@/lib/api';

interface AdminSettingItem {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Entities for Granular Governance
  const [providersList, setProvidersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [governanceTab, setGovernanceTab] = useState<'GLOBAL' | 'PROVIDERS' | 'ITEMS'>('GLOBAL');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, providersRes, productsRes] = await Promise.allSettled([
        apiRequest('/api/admin/settings'),
        apiRequest('/api/admin/providers'),
        apiRequest('/api/admin/products?limit=50')
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.success && settingsRes.value?.settings) {
        const map: Record<string, string> = {};
        settingsRes.value.settings.forEach((s: AdminSettingItem) => {
          map[s.key] = s.value;
        });
        setSettings(map);
      }

      if (providersRes.status === 'fulfilled' && providersRes.value?.success && providersRes.value?.providers) {
        setProvidersList(providersRes.value.providers);
      }

      if (productsRes.status === 'fulfilled' && productsRes.value?.success && productsRes.value?.products) {
        setProductsList(productsRes.value.products);
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', text: err.message || 'Failed to load system settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSetting = async (key: string, description: string, explicitValue?: string) => {
    try {
      setSavingKey(key);
      setStatusFeedback(null);

      const val = explicitValue !== undefined
        ? explicitValue
        : (settings[key] !== undefined && settings[key] !== null ? String(settings[key]) : '');

      const res = await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          key,
          value: val,
          description
        })
      });

      if (res.success) {
        setSaveSuccess(key);
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', text: err.message || `Failed to update ${key}` });
    } finally {
      setSavingKey(null);
    }
  };

  const getProviderPolicy = (providerId: string) => {
    try {
      const raw = settings['PROVIDER_ORDER_POLICIES'] || '{}';
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return parsed[providerId] || {};
    } catch {
      return {};
    }
  };

  const updateProviderPolicy = async (providerId: string, patch: any) => {
    try {
      const raw = settings['PROVIDER_ORDER_POLICIES'] || '{}';
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      parsed[providerId] = { ...(parsed[providerId] || {}), ...patch };
      const serialized = JSON.stringify(parsed);
      handleChange('PROVIDER_ORDER_POLICIES', serialized);

      await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          key: 'PROVIDER_ORDER_POLICIES',
          value: serialized,
          description: 'Granular per-provider order & COD policies'
        })
      });
      setSaveSuccess('PROVIDER_ORDER_POLICIES');
      setTimeout(() => setSaveSuccess(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const getProductPolicy = (productId: string) => {
    try {
      const raw = settings['PRODUCT_ORDER_POLICIES'] || '{}';
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const prod = productsList.find((p) => p.id === productId);
      const normName = prod?.name ? prod.name.toLowerCase().trim() : '';
      return (
        parsed[productId] ||
        (normName ? parsed[normName] : null) ||
        (prod?.slug ? parsed[prod.slug] : null) ||
        {}
      );
    } catch {
      return {};
    }
  };

  const updateProductPolicy = async (productId: string, patch: any) => {
    try {
      const raw = settings['PRODUCT_ORDER_POLICIES'] || '{}';
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const prod = productsList.find((p) => p.id === productId);
      const policyData = {
        ...(parsed[productId] || {}),
        id: productId,
        name: prod?.name || parsed[productId]?.name,
        slug: prod?.slug || parsed[productId]?.slug,
        ...patch
      };
      parsed[productId] = policyData;
      if (prod?.name) {
        parsed[prod.name.toLowerCase().trim()] = policyData;
      }
      if (prod?.slug) {
        parsed[prod.slug] = policyData;
      }
      const serialized = JSON.stringify(parsed);
      handleChange('PRODUCT_ORDER_POLICIES', serialized);

      await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          key: 'PRODUCT_ORDER_POLICIES',
          value: serialized,
          description: 'Granular per-product order & return policies'
        })
      });
      setSaveSuccess('PRODUCT_ORDER_POLICIES');
      setTimeout(() => setSaveSuccess(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadGovernancePdf = async () => {
    try {
      setDownloadingPdf(true);
      setStatusFeedback(null);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('nit_token') || localStorage.getItem('token')) : null;
      const base = getApiBase();
      const res = await fetch(`${base}/api/admin/settings/governance-pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to generate governance PDF (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CampusBasket_Governance_Policy_Matrix_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setStatusFeedback({ type: 'success', text: 'Official Order Governance & Policy Matrix PDF downloaded successfully!' });
    } catch (err: any) {
      setStatusFeedback({ type: 'error', text: err.message || 'Failed to download governance PDF' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSavingKey('ALL');
      setStatusFeedback(null);

      const entries = [
        { key: 'APP_NAME', desc: 'Institutional portal title' },
        { key: 'SUPPORT_EMAIL', desc: 'Support email address' },
        { key: 'SUPPORT_PHONE', desc: 'Direct campus helpline' },
        { key: 'ENABLE_CASH_ON_DELIVERY', desc: 'Allow COD for hostel room drop' },
        { key: 'MAX_COD_AMOUNT', desc: 'Maximum INR ceiling for Cash on Delivery' },
        { key: 'COD_MIN_ADVANCE_AMOUNT', desc: 'Partial online advance fee required to confirm COD orders' },
        { key: 'CANCELLATION_CUTOFF_STAGE', desc: 'Stage beyond which order modification & cancellation are locked' },
        { key: 'RETURN_POLICY_FOOD', desc: 'Return policy configuration for kitchen meals' },
        { key: 'RETURN_POLICY_PRODUCE', desc: 'Return policy configuration for fresh fruits & produce' },
        { key: 'RETURN_POLICY_STATIONERY', desc: 'Return policy configuration for bookstore & stationery' },
        { key: 'PROVIDER_ORDER_POLICIES', desc: 'Granular per-provider order & COD policies' },
        { key: 'PRODUCT_ORDER_POLICIES', desc: 'Granular per-product order & return policies' },
        { key: 'DELIVERY_FEE_FLAT', desc: 'Flat room delivery fee' },
        { key: 'FREE_DELIVERY_THRESHOLD', desc: 'Cart threshold for free delivery' },
        { key: 'GEOFENCE_ENFORCED', desc: 'Global GPS perimeter geofence enforcement toggle' },
        { key: 'MAINTENANCE_MODE', desc: 'Emergency campus maintenance toggle' }
      ];

      for (const entry of entries) {
        const val = settings[entry.key] !== undefined && settings[entry.key] !== null ? String(settings[entry.key]) : '';
        await apiRequest('/api/admin/settings', {
          method: 'POST',
          body: JSON.stringify({
            key: entry.key,
            value: val,
            description: entry.desc
          })
        });
      }

      setStatusFeedback({ type: 'success', text: 'All system settings saved and active in MySQL database' });
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch (err: any) {
      setStatusFeedback({ type: 'error', text: err.message || 'Failed to save all settings' });
    } finally {
      setSavingKey(null);
    }
  };

  const isMaintenanceMode = settings['MAINTENANCE_MODE'] === 'true';
  const isCodEnabled = settings['ENABLE_CASH_ON_DELIVERY'] === 'true';
  const isGeofenceEnforced = settings['GEOFENCE_ENFORCED'] !== 'false';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[#4F9D32]">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#17202A] tracking-tight">System &amp; Platform Settings</h1>
            <p className="text-xs text-slate-500">
              Configure institutional metadata, delivery fees, payment limits, and emergency kill switches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="Refresh Settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#4F9D32]' : ''}`} />
          </button>
          <button
            onClick={handleSaveAll}
            disabled={savingKey === 'ALL' || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {savingKey === 'ALL' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save All Configuration
          </button>
        </div>
      </div>

      {statusFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 text-[#347A27] border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusFeedback.text}</span>
        </div>
      )}

      {/* Emergency Maintenance Mode Notice Banner */}
      {isMaintenanceMode && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">Campus Maintenance Mode is ACTIVE</h4>
              <p className="text-[11px] text-rose-700">
                Non-administrative students and providers will see a maintenance notice upon opening the application.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleChange('MAINTENANCE_MODE', 'false');
              handleSaveSetting('MAINTENANCE_MODE', 'Emergency campus maintenance toggle');
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shrink-0 cursor-pointer"
          >
            Disable Maintenance
          </button>
        </div>
      )}

      {loading && Object.keys(settings).length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4F9D32] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading institutional configurations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Group 1: Institutional & Helpdesk */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#4F9D32]">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17202A]">Institutional Identity &amp; Support</h3>
                <p className="text-xs text-slate-500">Campus branding and student grievance contacts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Application Title
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings['APP_NAME'] || ''}
                    onChange={(e) => handleChange('APP_NAME', e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                  />
                  <button
                    onClick={() => handleSaveSetting('APP_NAME', 'Institutional portal title')}
                    disabled={savingKey === 'APP_NAME'}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#347A27] border border-slate-200 transition cursor-pointer"
                  >
                    {saveSuccess === 'APP_NAME' ? <CheckCircle2 className="w-4 h-4 text-[#4F9D32]" /> : 'Save'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Official Support Email
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={settings['SUPPORT_EMAIL'] || ''}
                      onChange={(e) => handleChange('SUPPORT_EMAIL', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveSetting('SUPPORT_EMAIL', 'Support email address')}
                    disabled={savingKey === 'SUPPORT_EMAIL'}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#347A27] border border-slate-200 transition cursor-pointer"
                  >
                    {saveSuccess === 'SUPPORT_EMAIL' ? <CheckCircle2 className="w-4 h-4 text-[#4F9D32]" /> : 'Save'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Helpline / Emergency Phone
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={settings['SUPPORT_PHONE'] || ''}
                      onChange={(e) => handleChange('SUPPORT_PHONE', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] focus:bg-white transition font-mono"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveSetting('SUPPORT_PHONE', 'Direct campus helpline')}
                    disabled={savingKey === 'SUPPORT_PHONE'}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#347A27] border border-slate-200 transition cursor-pointer"
                  >
                    {saveSuccess === 'SUPPORT_PHONE' ? <CheckCircle2 className="w-4 h-4 text-[#4F9D32]" /> : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Group 2: Order & Delivery Economics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#4F9D32]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17202A]">Order &amp; Delivery Parameters</h3>
                <p className="text-xs text-slate-500">Hostel room delivery charges &amp; thresholds</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Flat Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={settings['DELIVERY_FEE_FLAT'] || ''}
                    onChange={(e) => handleChange('DELIVERY_FEE_FLAT', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={settings['FREE_DELIVERY_THRESHOLD'] || ''}
                    onChange={(e) => handleChange('FREE_DELIVERY_THRESHOLD', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Cash on Delivery (COD) Configuration */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#347A27]" />
                    <span className="text-xs font-bold text-[#17202A]">Enable Cash on Delivery (COD)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = isCodEnabled ? 'false' : 'true';
                      handleChange('ENABLE_CASH_ON_DELIVERY', next);
                      handleSaveSetting('ENABLE_CASH_ON_DELIVERY', 'Allow COD for hostel room drop');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      isCodEnabled
                        ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isCodEnabled ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Maximum COD Order Ceiling (₹)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={settings['MAX_COD_AMOUNT'] || ''}
                      onChange={(e) => handleChange('MAX_COD_AMOUNT', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32] transition"
                    />
                    <button
                      onClick={() => handleSaveSetting('MAX_COD_AMOUNT', 'Maximum INR ceiling for Cash on Delivery')}
                      disabled={savingKey === 'MAX_COD_AMOUNT'}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#347A27] border border-slate-200 transition cursor-pointer"
                    >
                      {saveSuccess === 'MAX_COD_AMOUNT' ? <CheckCircle2 className="w-4 h-4 text-[#4F9D32]" /> : 'Save'}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Mandatory COD Online Partial Advance (₹)
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                      Online Advance • Rest Cash at Door
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="e.g. 0 (Set 0 for pure zero-advance COD)"
                      value={settings['COD_MIN_ADVANCE_AMOUNT'] !== undefined ? String(settings['COD_MIN_ADVANCE_AMOUNT']) : '0'}
                      onChange={(e) => handleChange('COD_MIN_ADVANCE_AMOUNT', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32] transition"
                    />
                    <button
                      onClick={() => handleSaveSetting('COD_MIN_ADVANCE_AMOUNT', 'Partial online advance fee required to confirm COD orders')}
                      disabled={savingKey === 'COD_MIN_ADVANCE_AMOUNT'}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#347A27] border border-slate-200 transition cursor-pointer"
                    >
                      {saveSuccess === 'COD_MIN_ADVANCE_AMOUNT' ? <CheckCircle2 className="w-4 h-4 text-[#4F9D32]" /> : 'Save'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Example: On a ₹100 order, student pays ₹{settings['COD_MIN_ADVANCE_AMOUNT'] ?? '0'} advance online via Razorpay before order confirmation; remaining ₹{Math.max(0, 100 - Number(settings['COD_MIN_ADVANCE_AMOUNT'] ?? 0))} is collected in cash at delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Group 2.5: Order Governance, Cancellation Lock & Return Policies (Provider & Product-Wise) */}
          <div className="lg:col-span-2 bg-white border-2 border-slate-300 rounded-2xl p-6 shadow-sm space-y-6 ring-1 ring-slate-900/5">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-4 border-b-2 border-slate-200 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#17202A] flex items-center gap-2">
                    Order Governance, Cancellation Lock &amp; Return Policies
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-full font-bold">
                      Adaptive Core
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control COD eligibility, partial advance fee, order immutability stage, and returns across Food, Fruits &amp; Stationery
                  </p>
                </div>
              </div>

              {/* Action Buttons & Sub-Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Official PDF Report Button */}
                <button
                  type="button"
                  onClick={handleDownloadGovernancePdf}
                  disabled={downloadingPdf}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-2 border-indigo-500 text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Generate publication-grade PDF matrix of governance rules"
                >
                  <FileDown className={`w-4 h-4 ${downloadingPdf ? 'animate-bounce text-indigo-600' : 'text-indigo-700'}`} />
                  <span>{downloadingPdf ? 'Compiling PDF...' : 'Export Governance PDF'}</span>
                </button>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border-2 border-slate-200 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setGovernanceTab('GLOBAL')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                      governanceTab === 'GLOBAL'
                        ? 'bg-white text-indigo-700 border-indigo-400 font-extrabold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    Category Rules &amp; Cutoff
                  </button>
                  <button
                    type="button"
                    onClick={() => setGovernanceTab('PROVIDERS')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 border ${
                      governanceTab === 'PROVIDERS'
                        ? 'bg-white text-indigo-700 border-indigo-400 font-extrabold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <span>Provider Overrides</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono font-bold">
                      {providersList.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGovernanceTab('ITEMS')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 border ${
                      governanceTab === 'ITEMS'
                        ? 'bg-white text-indigo-700 border-indigo-400 font-extrabold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <span>Food / Item Overrides</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-mono font-bold border border-indigo-300">
                      {productsList.length}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* TAB 1: Global Category Policies & Cutoff */}
            {governanceTab === 'GLOBAL' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl bg-amber-50/80 border-2 border-amber-300 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Campus Order Immutability Rule:</span>
                    <span>
                      In all 3 categories (Food, Fresh Fruits/Produce, Stationery), once the provider accepts the order (or the selected cutoff is reached), students can no longer modify delivery details or cancel their order. Prior to provider acceptance, orders remain modifiable and cancellable.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cancellation Cutoff Stage */}
                  <div className="p-4 rounded-xl bg-white border-2 border-slate-300 shadow-xs hover:border-slate-400 transition space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-800">Order Cancellation Lock Stage</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-bold">
                        Current: {settings['CANCELLATION_CUTOFF_STAGE'] || 'ACCEPTED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Defines the order status at which students can no longer cancel or edit room details.
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={settings['CANCELLATION_CUTOFF_STAGE'] || 'ACCEPTED'}
                        onChange={(e) => handleChange('CANCELLATION_CUTOFF_STAGE', e.target.value)}
                        className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                      >
                        <option value="ACCEPTED">ACCEPTED — Provider accepts order (Strict &amp; Locked early)</option>
                        <option value="PREPARING">PREPARING — Cooking / Packing has commenced</option>
                        <option value="READY">READY — Order is packed and waiting for runner</option>
                        <option value="DISPATCHED">DISPATCHED — Order is out for delivery</option>
                      </select>
                      <button
                        onClick={() => handleSaveSetting('CANCELLATION_CUTOFF_STAGE', 'Stage beyond which order modification & cancellation are locked')}
                        disabled={savingKey === 'CANCELLATION_CUTOFF_STAGE'}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-indigo-700 border-2 border-slate-300 transition cursor-pointer"
                      >
                        {saveSuccess === 'CANCELLATION_CUTOFF_STAGE' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Fresh Fruits & Produce Return Policy */}
                  <div className="p-4 rounded-xl bg-white border-2 border-slate-300 shadow-xs hover:border-slate-400 transition space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Apple className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800">Fresh Produce &amp; Fruit Mandi Return Policy</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                        {settings['RETURN_POLICY_PRODUCE'] || 'FRESHNESS_VERIFIED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Perishable quality policy for mandi produce, seasonal fruits, and whole veggies.
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={settings['RETURN_POLICY_PRODUCE'] || 'FRESHNESS_VERIFIED'}
                        onChange={(e) => handleChange('RETURN_POLICY_PRODUCE', e.target.value)}
                        className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                      >
                        <option value="FRESHNESS_VERIFIED">FRESHNESS_VERIFIED — 2-Hour Window for defect/bruising</option>
                        <option value="DISABLED">DISABLED — No returns on fresh produce</option>
                        <option value="ALLOWED_UNCONDITIONAL">ALLOWED_UNCONDITIONAL — 24-Hour inspection window</option>
                      </select>
                      <button
                        onClick={() => handleSaveSetting('RETURN_POLICY_PRODUCE', 'Return policy configuration for fresh fruits & produce')}
                        disabled={savingKey === 'RETURN_POLICY_PRODUCE'}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-emerald-700 border-2 border-slate-300 transition cursor-pointer"
                      >
                        {saveSuccess === 'RETURN_POLICY_PRODUCE' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Stationery & Bookstore Return Policy */}
                  <div className="p-4 rounded-xl bg-white border-2 border-slate-300 shadow-xs hover:border-slate-400 transition space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">Stationery &amp; Bookstore Return Policy</span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded font-bold">
                        {settings['RETURN_POLICY_STATIONERY'] || 'ALLOWED_24HR'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Return eligibility for textbooks, notebooks, instruments, and packaged campus supplies.
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={settings['RETURN_POLICY_STATIONERY'] || 'ALLOWED_24HR'}
                        onChange={(e) => handleChange('RETURN_POLICY_STATIONERY', e.target.value)}
                        className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="ALLOWED_24HR">ALLOWED_24HR — 24-Hour Window for unused/intact stationery</option>
                        <option value="ALLOWED_48HR">ALLOWED_48HR — 48-Hour Window for academic materials</option>
                        <option value="DISABLED">DISABLED — Stationery items are final sale</option>
                      </select>
                      <button
                        onClick={() => handleSaveSetting('RETURN_POLICY_STATIONERY', 'Return policy configuration for bookstore & stationery')}
                        disabled={savingKey === 'RETURN_POLICY_STATIONERY'}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-blue-700 border-2 border-slate-300 transition cursor-pointer"
                      >
                        {saveSuccess === 'RETURN_POLICY_STATIONERY' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Food & Kitchen Return Policy */}
                  <div className="p-4 rounded-xl bg-white border-2 border-slate-300 shadow-xs hover:border-slate-400 transition space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-bold text-slate-800">Kitchen Prepared Meals Return Policy</span>
                      </div>
                      <span className="text-[10px] font-mono text-orange-800 bg-orange-100 border border-orange-300 px-2 py-0.5 rounded font-bold">
                        {settings['RETURN_POLICY_FOOD'] || 'RESTRICTED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Policy for prepared foods, canteen bowls, parathas, and beverages.
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={settings['RETURN_POLICY_FOOD'] || 'RESTRICTED'}
                        onChange={(e) => handleChange('RETURN_POLICY_FOOD', e.target.value)}
                        className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-orange-500"
                      >
                        <option value="RESTRICTED">RESTRICTED — 30-Min Inspection Window for damaged/incorrect prep</option>
                        <option value="DISABLED">DISABLED — Cooked foods strictly non-returnable</option>
                        <option value="ALLOWED_UNCONDITIONAL">ALLOWED_UNCONDITIONAL — 60-Min window for any food issue</option>
                      </select>
                      <button
                        onClick={() => handleSaveSetting('RETURN_POLICY_FOOD', 'Return policy configuration for kitchen meals')}
                        disabled={savingKey === 'RETURN_POLICY_FOOD'}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-orange-700 border-2 border-slate-300 transition cursor-pointer"
                      >
                        {saveSuccess === 'RETURN_POLICY_FOOD' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Provider-Wise Governance Overrides (Screenshot focus) */}
            {governanceTab === 'PROVIDERS' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
                  <p className="text-xs text-slate-600 font-medium">
                    Configure individual merchant terms: permit or disable Cash on Delivery, set provider-specific online advance fees, customize cancellation cutoff, and enable returns.
                    <span className="block text-[11px] text-amber-700 font-bold mt-0.5">
                      ⚠️ Note: Product-level overrides in &quot;Food / Item Overrides&quot; strictly take precedence over these provider rules.
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSaveSetting('PROVIDER_ORDER_POLICIES', 'Granular per-provider order & COD policies')}
                    disabled={savingKey === 'PROVIDER_ORDER_POLICIES'}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm border-2 border-indigo-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saveSuccess === 'PROVIDER_ORDER_POLICIES' ? 'Policies Saved!' : 'Save All Provider Rules'}</span>
                  </button>
                </div>

                {providersList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border-2 border-slate-300 font-medium">
                    No active service providers loaded. Check database connection.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providersList.map((p) => {
                      const policy = getProviderPolicy(p.id);
                      const isProviderCodAllowed = policy.allowCod !== false;
                      const customAdvance = policy.codAdvance ?? '';
                      const customCutoff = policy.cancellationCutoff || 'DEFAULT';
                      const isReturnAllowed = policy.allowReturn !== false;

                      return (
                        <div key={p.id} className="p-4 rounded-xl bg-white border-2 border-slate-300 hover:border-indigo-400 transition shadow-xs space-y-3.5 text-xs ring-1 ring-slate-900/5">
                          <div className="flex items-start justify-between pb-2.5 border-b-2 border-slate-200">
                            <div>
                              <h4 className="font-black text-slate-900 text-sm tracking-tight">{p.businessName || p.fullName}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Category: <span className="font-bold text-slate-800 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">{p.serviceCategory || 'GENERAL'}</span>
                              </p>
                            </div>
                            <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-mono font-bold border border-slate-300">
                              ID: {p.id.slice(0, 8)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* COD Toggle with Clear Border */}
                            <div>
                              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                                Cash on Delivery
                              </label>
                              <button
                                type="button"
                                onClick={() => updateProviderPolicy(p.id, { allowCod: !isProviderCodAllowed })}
                                className={`w-full py-2 px-2.5 rounded-lg text-xs font-black border-2 transition shadow-xs cursor-pointer ${
                                  isProviderCodAllowed
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-500 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-900 border-rose-500 hover:bg-rose-100'
                                }`}
                              >
                                {isProviderCodAllowed ? '✓ COD ALLOWED' : '✕ COD BLOCKED'}
                              </button>
                            </div>

                            {/* Custom Advance with Clear Border */}
                            <div>
                              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                                Custom Advance (₹)
                              </label>
                              <input
                                type="number"
                                placeholder="Global Default"
                                value={customAdvance}
                                onChange={(e) => updateProviderPolicy(p.id, { codAdvance: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full bg-slate-50 border-2 border-slate-300 focus:bg-white focus:border-indigo-600 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden transition"
                              />
                            </div>

                            {/* Cutoff Override with Clear Border */}
                            <div>
                              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                                Cancellation Lock
                              </label>
                              <select
                                value={customCutoff}
                                onChange={(e) => updateProviderPolicy(p.id, { cancellationCutoff: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-300 focus:bg-white focus:border-indigo-600 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-900 focus:outline-hidden transition"
                              >
                                <option value="DEFAULT">Global Default</option>
                                <option value="ACCEPTED">Lock on ACCEPTED</option>
                                <option value="PREPARING">Lock on PREPARING</option>
                                <option value="READY">Lock on READY</option>
                              </select>
                            </div>

                            {/* Return Toggle with Clear Border */}
                            <div>
                              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                                Return Requests
                              </label>
                              <button
                                type="button"
                                onClick={() => updateProviderPolicy(p.id, { allowReturn: !isReturnAllowed })}
                                className={`w-full py-2 px-2.5 rounded-lg text-xs font-black border-2 transition shadow-xs cursor-pointer ${
                                  isReturnAllowed
                                    ? 'bg-blue-50 text-blue-900 border-blue-500 hover:bg-blue-100'
                                    : 'bg-slate-100 text-slate-700 border-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {isReturnAllowed ? '✓ RETURNS ON' : '✕ RETURNS OFF'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Food / Product-Wise Governance Overrides (Strict High-Priority) */}
            {governanceTab === 'ITEMS' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Priority Rule Clarification Banner */}
                <div className="p-3.5 rounded-xl bg-indigo-50/80 border-2 border-indigo-300 text-xs text-indigo-950 flex items-start gap-2.5 shadow-xs">
                  <Sparkles className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-indigo-900">
                      ⚡ Product Override Takes Absolute Priority Over Provider Rules
                    </span>
                    <span className="text-slate-600">
                      Even if a merchant enables Cash on Delivery for their entire catalog, turning off COD for a specific product below will immediately block COD in the checkout cart whenever a student adds that item.
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-slate-200">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search food item, fruit, or stationery..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveSetting('PRODUCT_ORDER_POLICIES', 'Granular per-product order & return policies')}
                    disabled={savingKey === 'PRODUCT_ORDER_POLICIES'}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm border-2 border-indigo-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saveSuccess === 'PRODUCT_ORDER_POLICIES' ? 'Item Rules Saved!' : 'Save Item Overrides'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto border-2 border-slate-300 rounded-xl shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-300">
                        <th className="p-3 font-black">Item Name &amp; Category</th>
                        <th className="p-3 font-black">Merchant / Provider</th>
                        <th className="p-3 font-black">Price (₹)</th>
                        <th className="p-3 font-black">COD Policy (Priority 1)</th>
                        <th className="p-3 font-black">Return Eligibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {productsList
                        .filter((p) =>
                          !productSearch ||
                          p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.category?.name?.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .slice(0, 30)
                        .map((p) => {
                          const policy = getProductPolicy(p.id);
                          const isItemCodAllowed = policy.allowCod !== false;
                          const isItemReturnAllowed = policy.allowReturn !== false;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-bold text-slate-900">
                                <div>{p.name}</div>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {p.category?.name || 'Item'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-700 font-medium">
                                {p.provider?.fullName || p.provider?.businessName || 'Campus Store'}
                              </td>
                              <td className="p-3 font-mono font-extrabold text-slate-900">
                                ₹{p.price}
                              </td>
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => updateProductPolicy(p.id, { allowCod: !isItemCodAllowed })}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black border-2 transition cursor-pointer shadow-2xs ${
                                    isItemCodAllowed
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-500 hover:bg-emerald-100'
                                      : 'bg-rose-50 text-rose-900 border-rose-500 hover:bg-rose-100'
                                  }`}
                                >
                                  {isItemCodAllowed ? '✓ COD Allowed' : '✕ No COD (Override)'}
                                </button>
                              </td>
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => updateProductPolicy(p.id, { allowReturn: !isItemReturnAllowed })}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black border-2 transition cursor-pointer shadow-2xs ${
                                    isItemReturnAllowed
                                      ? 'bg-blue-50 text-blue-900 border-blue-500 hover:bg-blue-100'
                                      : 'bg-slate-100 text-slate-700 border-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  {isItemReturnAllowed ? '✓ Returnable' : '✕ Final Sale'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Group 3: Role Authentication & OTP Controls (Section 4) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17202A]">Role Authentication &amp; Multi-Factor OTP Controls</h3>
                <p className="text-xs text-slate-500">
                  Enforce or bypass 6-digit Gmail OTP verification on portal login for campus roles
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Provider OTP Setting */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#17202A]">Service Provider Login OTP Verification</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sends 6-digit OTP to vendor registered Gmail on sign in
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = settings['PROVIDER_OTP_ENABLED'] === 'true' ? 'false' : 'true';
                      handleChange('PROVIDER_OTP_ENABLED', next);
                      handleSaveSetting('PROVIDER_OTP_ENABLED', 'Service Provider login OTP verification');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer shrink-0 ${
                      settings['PROVIDER_OTP_ENABLED'] === 'true'
                        ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    {settings['PROVIDER_OTP_ENABLED'] === 'true' ? 'OTP ON' : 'OTP OFF'}
                  </button>
                </div>
                <div className="text-[10px] text-slate-400">
                  Status: <strong>{settings['PROVIDER_OTP_ENABLED'] === 'true' ? 'Mandatory 6-Digit Email Verification' : 'Direct Password Login Allowed'}</strong>
                </div>
              </div>

              {/* Delivery Boy OTP Setting */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#17202A]">Delivery Boy Login OTP Verification</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sends 6-digit OTP to runner registered Gmail on sign in
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = settings['DELIVERY_BOY_OTP_ENABLED'] === 'true' ? 'false' : 'true';
                      handleChange('DELIVERY_BOY_OTP_ENABLED', next);
                      handleSaveSetting('DELIVERY_BOY_OTP_ENABLED', 'Delivery Boy login OTP verification');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer shrink-0 ${
                      settings['DELIVERY_BOY_OTP_ENABLED'] === 'true'
                        ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    {settings['DELIVERY_BOY_OTP_ENABLED'] === 'true' ? 'OTP ON' : 'OTP OFF'}
                  </button>
                </div>
                <div className="text-[10px] text-slate-400">
                  Status: <strong>{settings['DELIVERY_BOY_OTP_ENABLED'] === 'true' ? 'Mandatory 6-Digit Email Verification' : 'Direct Password Login Allowed'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Group 3.5: Master GPS Campus Geofence Switch */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17202A]">Master Geofence &amp; Perimeter Bypass</h3>
                <p className="text-xs text-slate-500">
                  Enable or disable GPS location enforcement. When turned OFF, students anywhere can browse, add to cart, and place orders.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#17202A]">GPS Geofence Status</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isGeofenceEnforced
                        ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {isGeofenceEnforced ? 'GEOFENCE ENFORCED (Campus Perimeter)' : 'GEOFENCE BYPASSED (Universal Access Allowed)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {isGeofenceEnforced
                    ? 'Students must be physically located inside verified campus boundaries to place orders.'
                    : 'Geofence is OFF. Students, testers, and alumni from any location or network can place orders.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = isGeofenceEnforced ? 'false' : 'true';
                  handleChange('GEOFENCE_ENFORCED', next);
                  handleSaveSetting('GEOFENCE_ENFORCED', 'Global GPS perimeter geofence enforcement toggle');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                  isGeofenceEnforced
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-xs'
                    : 'bg-[#4F9D32] hover:bg-[#347A27] text-white shadow-xs'
                }`}
              >
                {isGeofenceEnforced ? 'Turn OFF Geofence (Allow Anywhere)' : 'Turn ON Geofence (Enforce Campus GPS)'}
              </button>
            </div>
          </div>

          {/* Group 4: Emergency & Campus Safety Kill-Switch */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17202A]">Emergency Campus Maintenance Toggle</h3>
                <p className="text-xs text-slate-500">
                  Instantly restrict student shopping operations during server maintenance, campus internet cuts, or convocations
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#17202A]">System Operational Status</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isMaintenanceMode
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-[#347A27] border-emerald-200'
                    }`}
                  >
                    {isMaintenanceMode ? 'MAINTENANCE MODE' : 'LIVE & SERVING'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  When enabled, student checkout is paused and an institutional maintenance alert is displayed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = isMaintenanceMode ? 'false' : 'true';
                  handleChange('MAINTENANCE_MODE', next);
                  handleSaveSetting('MAINTENANCE_MODE', 'Emergency campus maintenance toggle');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isMaintenanceMode
                    ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                {isMaintenanceMode ? 'Deactivate Maintenance' : 'Activate Maintenance Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
