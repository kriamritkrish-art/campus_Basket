'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Utensils, 
  Apple, 
  Shirt, 
  BookOpen, 
  Save, 
  RefreshCw, 
  Power,
  ShieldCheck,
  Calendar,
  BellRing
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface ServiceHoursConfig {
  open: string;
  close: string;
  days: string[];
  isOpen: boolean;
  notice: string;
}

interface AllHours {
  food: ServiceHoursConfig;
  fruits: ServiceHoursConfig;
  laundry: ServiceHoursConfig;
  essentials: ServiceHoursConfig;
}

const DAYS_OF_WEEK = [
  { id: 'MON', label: 'Mon' },
  { id: 'TUE', label: 'Tue' },
  { id: 'WED', label: 'Wed' },
  { id: 'THU', label: 'Thu' },
  { id: 'FRI', label: 'Fri' },
  { id: 'SAT', label: 'Sat' },
  { id: 'SUN', label: 'Sun' }
];

const SERVICE_META = {
  food: {
    title: 'Food & Meals',
    icon: Utensils,
    color: 'amber',
    bgBadge: 'bg-amber-50 text-amber-600 border-amber-200',
    description: 'Mess, Night Canteen & Hall Deliveries'
  },
  fruits: {
    title: 'Fresh Fruits',
    icon: Apple,
    color: 'emerald',
    bgBadge: 'bg-emerald-50 text-[#347A27] border-emerald-200',
    description: 'Morning & Evening Hostel Nutrition Drop'
  },
  laundry: {
    title: 'Express Laundry',
    icon: Shirt,
    color: 'sky',
    bgBadge: 'bg-sky-50 text-sky-600 border-sky-200',
    description: 'Hostel Pickup & Delivery with Dual-OTP Security'
  },
  essentials: {
    title: 'Stationery & Essentials',
    icon: BookOpen,
    color: 'purple',
    bgBadge: 'bg-purple-50 text-purple-600 border-purple-200',
    description: 'Notebooks, Printouts & Daily Hostel Supplies'
  }
};

export default function CampusBusinessHoursPage() {
  const [hours, setHours] = useState<AllHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingService, setSavingService] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Clock in IST
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadHours = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/campus/hours');
      if (res.success && res.hours) {
        setHours(res.hours);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load campus hours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHours();
  }, []);

  const handleUpdate = (serviceKey: keyof AllHours, field: keyof ServiceHoursConfig, value: any) => {
    if (!hours) return;
    setHours({
      ...hours,
      [serviceKey]: {
        ...hours[serviceKey],
        [field]: value
      }
    });
  };

  const toggleDay = (serviceKey: keyof AllHours, dayId: string) => {
    if (!hours) return;
    const currentDays = hours[serviceKey].days || [];
    const updated = currentDays.includes(dayId)
      ? currentDays.filter((d) => d !== dayId)
      : [...currentDays, dayId];
    handleUpdate(serviceKey, 'days', updated);
  };

  const handleSave = async (serviceKey: keyof AllHours) => {
    if (!hours) return;
    try {
      setSavingService(serviceKey);
      setSaveSuccess(null);
      setErrorMessage(null);

      const res = await apiRequest('/api/admin/campus/hours', {
        method: 'POST',
        body: JSON.stringify({
          service: serviceKey,
          config: hours[serviceKey]
        })
      });

      if (res.success) {
        setSaveSuccess(serviceKey);
        setTimeout(() => setSaveSuccess(null), 3500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save operating hours');
    } finally {
      setSavingService(null);
    }
  };

  const getComputedStatus = (config: ServiceHoursConfig) => {
    if (!config.isOpen) {
      return { status: 'CLOSED_MANUAL', label: 'Emergency Closed (Manual Override)', color: 'red' };
    }

    const now = new Date();
    const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = dayMap[now.getDay()];

    if (!config.days.includes(currentDay)) {
      return { status: 'CLOSED_DAY', label: `Closed Today (${currentDay})`, color: 'amber' };
    }

    const [openH, openM] = config.open.split(':').map(Number);
    const [closeH, closeM] = config.close.split(':').map(Number);

    const nowTotalMin = now.getHours() * 60 + now.getMinutes();
    const openTotalMin = openH * 60 + (openM || 0);
    const closeTotalMin = closeH * 60 + (closeM || 0);

    if (nowTotalMin >= openTotalMin && nowTotalMin <= closeTotalMin) {
      return { status: 'OPEN', label: 'Currently In-Service', color: 'emerald' };
    } else {
      return { status: 'CLOSED_HOURS', label: 'Closed (Off-Hours)', color: 'slate' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[#4F9D32]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#17202A] tracking-tight">Campus Business Hours &amp; Service Schedule</h1>
              <p className="text-xs text-slate-500">
                Configure live operating hours, day shifts, and instant emergency shutdown notices across NIT Durgapur services
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4F9D32] animate-pulse" />
            <span>Campus Time (IST):</span>
            <span className="font-mono font-bold text-[#17202A]">{currentTimeStr || '10:30:00 AM'}</span>
          </div>
          <button
            onClick={loadHours}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
            title="Refresh Schedules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#4F9D32]' : ''}`} />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading && !hours ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4F9D32] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading service operating schedules...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {(['food', 'fruits', 'laundry', 'essentials'] as Array<keyof AllHours>).map((key) => {
            const meta = SERVICE_META[key];
            const config = hours ? hours[key] : null;
            if (!config) return null;

            const computed = getComputedStatus(config);
            const isSaving = savingService === key;
            const isSuccess = saveSuccess === key;

            return (
              <div
                key={key}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-sm transition"
              >
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-3 rounded-xl border ${meta.bgBadge}`}>
                        <meta.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#17202A] text-base">{meta.title}</h3>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              computed.color === 'emerald'
                                ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                                : computed.color === 'red'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : computed.color === 'amber'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {computed.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
                      </div>
                    </div>

                    {/* Master On/Off Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate(key, 'isOpen', !config.isOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          config.isOpen
                            ? 'bg-emerald-50 text-[#347A27] border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title={config.isOpen ? 'Click to force shutdown' : 'Click to enable service'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {config.isOpen ? 'Operational' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* Timing Inputs */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Opening Time
                      </label>
                      <input
                        type="time"
                        value={config.open}
                        onChange={(e) => handleUpdate(key, 'open', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Closing Time
                      </label>
                      <input
                        type="time"
                        value={config.close}
                        onChange={(e) => handleUpdate(key, 'close', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Days of Week */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Active Operating Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = config.days?.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleDay(key, day.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#4F9D32] text-white border-[#4F9D32] shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notice Banner */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-amber-500" />
                      Student Notice / Service Status Headline
                    </label>
                    <input
                      type="text"
                      value={config.notice || ''}
                      onChange={(e) => handleUpdate(key, 'notice', e.target.value)}
                      placeholder="e.g. Normal operation / Closed due to convocation"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] focus:bg-white transition placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Footer Save Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configured for NIT Durgapur Campus</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSave(key)}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSuccess
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-[#4F9D32] hover:bg-[#347A27] text-white shadow-sm active:scale-95'
                    }`}
                  >
                    {isSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Saved!
                      </>
                    ) : isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Operating Hours
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Geofence & Campus Advisory Notice */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-[#4F9D32] border border-emerald-100 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#17202A]">Automated Delivery Cutoff Rule</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Hostel orders placed outside active business hours are automatically queued for the next operating slot or held until delivery window opens. Emergency shutdown notices appear instantly on student carts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
