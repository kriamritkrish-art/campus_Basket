'use client';

import React, { useState } from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import {
  Settings,
  Bell,
  Volume2,
  Navigation,
  Battery,
  Globe,
  Shield,
  Smartphone,
  CheckCircle2,
  Save,
} from 'lucide-react';

export default function DeliverySettingsPage() {
  const { setSuccessToast } = useDelivery();

  const [soundAlerts, setSoundAlerts] = useState(true);
  const [vibrateOnArrival, setVibrateOnArrival] = useState(true);
  const [batteryOptimization, setBatteryOptimization] = useState(false);
  const [navApp, setNavApp] = useState<'GOOGLE_MAPS' | 'CAMPUS_IN_APP'>('GOOGLE_MAPS');
  const [language, setLanguage] = useState<'EN' | 'BN' | 'HI'>('EN');
  const [autoAcceptSurge, setAutoAcceptSurge] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessToast('Runner preferences saved successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#36751F]" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Runner App Settings
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Customize dispatch notifications, navigation preferences, audio cues, and battery profile.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary text-xs px-5 shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* AUDIO & NOTIFICATIONS */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Volume2 className="w-5 h-5 text-[#36751F]" />
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
              Audio & Alerts
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900">Loud Chime on New Delivery Request</div>
                <div className="text-gray-500 text-[11px]">
                  Play audible ringtone when an order is assigned to your account.
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="w-5 h-5 accent-[#4F9D2F] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div>
                <div className="font-bold text-gray-900">Haptic Vibration upon Reaching Hostel</div>
                <div className="text-gray-500 text-[11px]">
                  Vibrate mobile device when within 50m of delivery waypoint.
                </div>
              </div>
              <input
                type="checkbox"
                checked={vibrateOnArrival}
                onChange={(e) => setVibrateOnArrival(e.target.checked)}
                className="w-5 h-5 accent-[#4F9D2F] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* NAVIGATION & MAPS */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Navigation className="w-5 h-5 text-[#36751F]" />
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
              Campus Navigation Preferences
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                Default Navigation Provider
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setNavApp('GOOGLE_MAPS')}
                  className={`p-3 rounded-xl border text-left transition ${
                    navApp === 'GOOGLE_MAPS'
                      ? 'border-[#4F9D2F] bg-emerald-50/50 ring-2 ring-emerald-200'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-gray-900">Google Maps External</div>
                  <div className="text-[11px] text-gray-500">Live GPS bicycle mode with turn-by-turn</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNavApp('CAMPUS_IN_APP')}
                  className={`p-3 rounded-xl border text-left transition ${
                    navApp === 'CAMPUS_IN_APP'
                      ? 'border-[#4F9D2F] bg-emerald-50/50 ring-2 ring-emerald-200'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-gray-900">In-App Campus Blueprint</div>
                  <div className="text-[11px] text-gray-500">NIT Durgapur hostel corridors & hall gates</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BATTERY & LOCALIZATION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="card p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Battery className="w-5 h-5 text-[#36751F]" />
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                Battery Saver
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">Night Shift Battery Saver</div>
                  <div className="text-gray-500 text-[11px]">
                    Lower screen brightness and throttle background updates.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={batteryOptimization}
                  onChange={(e) => setBatteryOptimization(e.target.checked)}
                  className="w-5 h-5 accent-[#4F9D2F] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="card p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Globe className="w-5 h-5 text-[#36751F]" />
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                Preferred Language
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-gray-900 block">App Interface Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F9D2F]"
              >
                <option value="EN">English (NIT Durgapur Standard)</option>
                <option value="BN">বাংলা (Bengali)</option>
                <option value="HI">हिन्दी (Hindi)</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
