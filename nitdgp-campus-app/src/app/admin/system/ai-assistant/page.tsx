'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Sparkles,
  Bot,
  Power,
  Sliders,
  ShieldAlert,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Zap,
  BarChart3,
  Cpu,
  Terminal,
  Send,
  MessageSquare
} from 'lucide-react';

interface AiSettingsData {
  status: 'ON' | 'OFF';
  mode: 'HYBRID' | 'UI_ONLY' | 'FULL_AI';
  activeMode: string;
  todayUsage: number;
  dailyLimit: number;
  remainingToday: number;
  monthlyUsage: number;
  monthlyLimit: number;
  usagePercentage: number;
  warningThreshold: number;
  criticalThreshold: number;
  warningStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXHAUSTED';
  autoSwitchedToUiOnly: boolean;
}

export default function AdminAiAssistantPage() {
  const [data, setData] = useState<AiSettingsData>({
    status: 'ON',
    mode: 'HYBRID',
    activeMode: 'HYBRID',
    todayUsage: 127,
    dailyLimit: 500,
    remainingToday: 373,
    monthlyUsage: 3810,
    monthlyLimit: 15000,
    usagePercentage: 25.4,
    warningThreshold: 80,
    criticalThreshold: 90,
    warningStatus: 'NORMAL',
    autoSwitchedToUiOnly: false,
  });

  const [formStatus, setFormStatus] = useState<'ON' | 'OFF'>('ON');
  const [formMode, setFormMode] = useState<'HYBRID' | 'UI_ONLY' | 'FULL_AI'>('HYBRID');
  const [formDailyLimit, setFormDailyLimit] = useState<number>(500);
  const [formMonthlyLimit, setFormMonthlyLimit] = useState<number>(15000);
  const [formWarningThreshold, setFormWarningThreshold] = useState<number>(80);
  const [formCriticalThreshold, setFormCriticalThreshold] = useState<number>(90);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Test Simulator State
  const [simQuery, setSimQuery] = useState('I want momo from ABC');
  const [simLogs, setSimLogs] = useState<Array<{ sender: 'admin' | 'ai'; text: string; mode: string }>>([
    { sender: 'ai', text: 'Hello Sourav 👋 How can I help you today?', mode: 'UI-FIRST' },
    { sender: 'admin', text: 'I want momo from ABC', mode: 'CLIENT' },
    { sender: 'ai', text: 'ABC has Veg Momo for ₹80 and Chicken Momo for ₹100. Which one would you like?', mode: 'UI-FIRST' }
  ]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/ai/admin/settings');
      if (res.success) {
        setData(res as any);
        setFormStatus(res.status);
        setFormMode(res.mode);
        setFormDailyLimit(res.dailyLimit);
        setFormMonthlyLimit(res.monthlyLimit);
        setFormWarningThreshold(res.warningThreshold);
        setFormCriticalThreshold(res.criticalThreshold);
      }
    } catch (err: any) {
      console.warn('Could not load AI admin settings, using defaults', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/api/ai/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          status: formStatus,
          mode: formMode,
          dailyLimit: formDailyLimit,
          monthlyLimit: formMonthlyLimit,
          warningThreshold: formWarningThreshold,
          criticalThreshold: formCriticalThreshold,
        }),
      });

      if (res.success) {
        setFeedback({ type: 'success', text: 'AI Assistant settings updated successfully!' });
        fetchSettings();
      } else {
        throw new Error(res.message || 'Failed to update settings');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error updating settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetQuota = async () => {
    try {
      await apiRequest('/api/ai/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ resetUsage: true }),
      });
      fetchSettings();
      setFeedback({ type: 'success', text: "Today's usage counter has been reset to 0." });
    } catch {}
  };

  const runSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) return;

    const q = simQuery.trim();
    const l = q.toLowerCase();
    let reply = "I found your requested item in Campus Basket. How many plates would you like?";

    if (l.includes('momo') && l.includes('abc')) {
      reply = "ABC has Veg Momo for ₹80 and Chicken Momo for ₹100. Which one would you like?";
    } else if (l.includes('momo')) {
      reply = "I found 2 momo options: Veg Steamed Momo (₹80) and Chicken Steamed Momo (₹100). Which one would you prefer?";
    } else if (l.includes('two') || l.includes('chicken')) {
      reply = "You have 2 Chicken Momo from ABC Provider. Would you like to continue to checkout?";
    } else if (l.includes('checkout')) {
      reply = "Your cart contains 2 Chicken Momo from ABC Provider. Your total is ₹200. Would you like me to place the order?";
    } else if (l.includes('yes')) {
      reply = "Your order #ORD-2026-9041 has been placed successfully via Campus Basket!";
    }

    setSimLogs((prev) => [
      ...prev,
      { sender: 'admin', text: q, mode: formMode },
      { sender: 'ai', text: reply, mode: formMode }
    ]);
    setSimQuery('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>System</span>
            <span>/</span>
            <span className="text-[#4F9D2F]">AI Assistant</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            AI Voice Shopping Assistant
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#4F9D2F]/10 text-[#4F9D2F] border border-[#4F9D2F]/20">
              Governance &amp; Controls
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure the student-facing voice assistant, select operating modes, enforce daily backend request caps, and monitor real-time platform quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4F9D2F]' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-[#4F9D2F] hover:bg-[#438727] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* KPI / Live Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Agent Status */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">AI AGENT STATUS</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                data.status === 'ON'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {data.status === 'ON' ? 'ACTIVATED' : 'OFFLINE'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {data.status === 'ON' ? 'Status: ON' : 'Status: OFF'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {data.status === 'ON' ? 'Visible to verified students' : 'Hidden from student application'}
          </p>
        </div>

        {/* Card 2: Operating Mode */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">OPERATING MODE</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
              {data.activeMode}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 truncate block">
              {data.mode === 'HYBRID'
                ? 'HYBRID / UI-FIRST'
                : data.mode === 'UI_ONLY'
                ? 'UI ONLY'
                : 'FULL AI + BACKEND'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {data.autoSwitchedToUiOnly
              ? 'Auto-switched to UI ONLY (quota cap reached)'
              : 'Optimal client-first performance'}
          </p>
        </div>

        {/* Card 3: Today's Usage vs Daily Limit */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">TODAY'S USAGE</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                data.warningStatus === 'NORMAL'
                  ? 'bg-slate-100 text-slate-700'
                  : data.warningStatus === 'WARNING'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {data.warningStatus}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{data.todayUsage}</span>
            <span className="text-xs font-bold text-slate-400">/ {data.dailyLimit} calls</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                data.usagePercentage > 85 ? 'bg-red-500' : data.usagePercentage > 60 ? 'bg-amber-500' : 'bg-[#4F9D2F]'
              }`}
              style={{ width: `${Math.min(100, data.usagePercentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-semibold">
            <span>Remaining: {data.remainingToday}</span>
            <span>{data.usagePercentage}%</span>
          </div>
        </div>

        {/* Card 4: Monthly Quota */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">MONTHLY BUDGET</span>
            <span className="text-[10px] font-bold text-slate-400">30-Day Cycle</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{data.monthlyUsage}</span>
            <span className="text-xs font-bold text-slate-400">/ {data.monthlyLimit}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#172033]"
              style={{ width: `${Math.min(100, (data.monthlyUsage / data.monthlyLimit) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold">
            Monthly Usage: {((data.monthlyUsage / data.monthlyLimit) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Main Settings Form & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#4F9D2F]" />
              Agent Operation &amp; Architectural Mode
            </h3>

            {/* AI Status Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">AI Assistant Master Switch</div>
                <div className="text-[11px] text-slate-500">
                  When turned OFF, the assistant button and panel are completely hidden from the student experience.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormStatus('ON')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    formStatus === 'ON'
                      ? 'bg-[#4F9D2F] text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  ON
                </button>
                <button
                  type="button"
                  onClick={() => setFormStatus('OFF')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    formStatus === 'OFF'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            {/* Operating Mode Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Select Operating Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Mode 1: HYBRID (Default) */}
                <div
                  onClick={() => setFormMode('HYBRID')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formMode === 'HYBRID'
                      ? 'border-[#4F9D2F] bg-[#EEF7E9]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900">HYBRID / UI-FIRST</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#4F9D2F] text-white">
                      DEFAULT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    UI-first conversational matching. Reuses loaded product/cart data. Calls backend only when genuinely required. Auto-downgrades to UI ONLY if limit is reached.
                  </p>
                </div>

                {/* Mode 2: UI ONLY */}
                <div
                  onClick={() => setFormMode('UI_ONLY')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formMode === 'UI_ONLY'
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900">UI ONLY</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                      OFFLINE-FIRST
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Zero backend AI requests. Operates 100% locally on existing loaded frontend state. Informs student if a server-only action is needed.
                  </p>
                </div>

                {/* Mode 3: FULL AI */}
                <div
                  onClick={() => setFormMode('FULL_AI')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formMode === 'FULL_AI'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900">FULL AI + BACKEND</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white">
                      COMPREHENSIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Allows rich server-side matching alongside frontend data for complex queries, strictly guarded by configured quota caps.
                  </p>
                </div>
              </div>
            </div>

            {/* Quota & Limits Form */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Backend Call Limits &amp; Thresholds
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Daily Backend Request Limit
                  </label>
                  <input
                    type="number"
                    value={formDailyLimit}
                    onChange={(e) => setFormDailyLimit(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-[#4F9D2F]/40 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">
                    Cap before auto-downgrading from HYBRID to UI ONLY
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Monthly Backend Request Limit
                  </label>
                  <input
                    type="number"
                    value={formMonthlyLimit}
                    onChange={(e) => setFormMonthlyLimit(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-[#4F9D2F]/40 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">
                    Max overall platform budget limit per month
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Warning Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={formWarningThreshold}
                    onChange={(e) => setFormWarningThreshold(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-[#4F9D2F]/40 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Triggers yellow warning badge in Admin dashboard</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Critical Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={formCriticalThreshold}
                    onChange={(e) => setFormCriticalThreshold(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-[#4F9D2F]/40 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Triggers critical red alert status in Admin console</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetQuota}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Reset Today's Counter to 0
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#172033] hover:bg-[#243350] text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Apply & Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Admin Simulator Column */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#4F9D2F]" />
                <h3 className="text-xs font-black text-slate-900">Student Interaction Simulator</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Live Engine</span>
            </div>

            {/* Sim Transcript */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2.5 text-xs bg-slate-50 rounded-xl my-3">
              {simLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${log.sender === 'admin' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                      log.sender === 'admin'
                        ? 'bg-[#172033] text-white'
                        : 'bg-white text-slate-800 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {log.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    {log.sender === 'admin' ? 'Student' : 'AI'} • {log.mode}
                  </span>
                </div>
              ))}
            </div>

            {/* Sim Input */}
            <form onSubmit={runSim} className="flex items-center gap-1.5 pt-2">
              <input
                type="text"
                value={simQuery}
                onChange={(e) => setSimQuery(e.target.value)}
                placeholder="Test query (e.g. Find momo)..."
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4F9D2F]/40"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-[#4F9D2F] text-white flex items-center justify-center shrink-0 hover:bg-[#438727] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
