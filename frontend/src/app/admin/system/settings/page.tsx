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
  Info
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/settings');
      if (res.success && res.settings) {
        const map: Record<string, string> = {};
        res.settings.forEach((s: AdminSettingItem) => {
          map[s.key] = s.value;
        });
        setSettings(map);
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

  const handleSaveSetting = async (key: string, description: string) => {
    try {
      setSavingKey(key);
      setStatusFeedback(null);

      const res = await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          key,
          value: settings[key] || '',
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
        { key: 'DELIVERY_FEE_FLAT', desc: 'Flat room delivery fee' },
        { key: 'FREE_DELIVERY_THRESHOLD', desc: 'Cart threshold for free delivery' },
        { key: 'MAINTENANCE_MODE', desc: 'Emergency campus maintenance toggle' }
      ];

      for (const entry of entries) {
        await apiRequest('/api/admin/settings', {
          method: 'POST',
          body: JSON.stringify({
            key: entry.key,
            value: settings[entry.key] || '',
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
              </div>
            </div>
          </div>

          {/* Group 3: Emergency & Campus Safety Kill-Switch */}
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
