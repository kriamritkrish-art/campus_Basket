'use client';

import React from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import {
  User,
  Bike,
  MapPin,
  CreditCard,
  ShieldCheck,
  Phone,
  Mail,
  Award,
  Clock,
  Star,
  CheckCircle2,
  Edit,
} from 'lucide-react';

export default function DeliveryProfilePage() {
  const { isOnline } = useDelivery();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header (Section 19) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#36751F] to-[#4F9D2F] text-white flex items-center justify-center font-black text-3xl shadow-md ring-4 ring-green-50">
            SS
          </div>
          <span
            className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white ${
              isOnline ? 'bg-emerald-500' : 'bg-gray-400'
            }`}
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Sourav Senapati
            </h2>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full self-center sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Campus Runner</span>
            </span>
          </div>

          <div className="text-xs text-gray-500 font-semibold flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-0.5">
            <span>Delivery Partner</span>
            <span>•</span>
            <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-bold">
              DB_BOY_01
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              4.95 Rating (184 reviews)
            </span>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-xs bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-lg">
              Joined: Aug 2026
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-lg">
              Shift: Evening & Night Dispatch
            </span>
          </div>
        </div>
      </div>

      {/* Information Cards Grid (Section 19) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PERSONAL INFORMATION */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#36751F]" />
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                Personal Information
              </h3>
            </div>
            <span className="text-[11px] text-gray-400 font-bold">Official ID</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">Full Name</span>
              <span className="font-bold text-gray-900">Sourav Senapati</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">Mobile Phone</span>
              <span className="font-bold text-gray-900">+91 98765 43210</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">Partner ID</span>
              <span className="font-mono font-bold text-emerald-800">DB_BOY_01</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400 font-semibold">College Roll / Reg</span>
              <span className="font-bold text-gray-900">NITD/STUDENT/2026</span>
            </div>
          </div>
        </div>

        {/* VEHICLE */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bike className="w-5 h-5 text-[#36751F]" />
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                Vehicle & Transit
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">Vehicle Mode</span>
              <span className="font-bold text-gray-900">Bicycle / Campus Cycle</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">Cycle Tag ID</span>
              <span className="font-mono font-bold text-gray-800">#NITD-CY-409</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">Delivery Thermal Bag</span>
              <span className="font-bold text-emerald-700">Issued & Inspected ✓</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400 font-semibold">Speed Tier</span>
              <span className="font-bold text-gray-900">Standard Campus (12-15 km/h)</span>
            </div>
          </div>
        </div>

        {/* CAMPUS & SERVICE AREA */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#36751F]" />
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                Campus & Service Area
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">Campus</span>
              <span className="font-bold text-gray-900">NIT Durgapur Campus</span>
            </div>
            <div className="py-1 border-b border-gray-50 space-y-1.5">
              <span className="text-gray-400 font-semibold block">Service Area Halls</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {['Halls 1–14', 'SNH (Sister Nivedita)', 'MTH (Mother Teresa Hall)'].map((zone) => (
                  <span
                    key={zone}
                    className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded text-[11px]"
                  >
                    {zone}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400 font-semibold">Campus Gate Access</span>
              <span className="font-bold text-emerald-700">Main Gate + Back Gate Pass</span>
            </div>
          </div>
        </div>

        {/* PAYMENT & SETTLEMENT */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#36751F]" />
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                Payment & Payout
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              Auto-Settled
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">UPI ID</span>
              <span className="font-mono font-bold text-gray-900">sourav.runner@okhdfcbank</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">Payout Schedule</span>
              <span className="font-bold text-gray-900">Daily Midnight Auto-Credit</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-semibold">Tax & Deductions</span>
              <span className="font-bold text-emerald-700">0% Platform Fee</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400 font-semibold">Bank Status</span>
              <span className="font-bold text-emerald-700">HDFC Bank Verified ✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
