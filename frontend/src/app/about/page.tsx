import React from 'react';
import { ShieldCheck, MapPin, Sparkles, Award } from 'lucide-react';

export const metadata = {
  title: 'About Campus Marketplace — NIT Durgapur',
  description: 'Learn about the student-focused campus service platform designed for NIT Durgapur.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">About the Platform</span>
        <h1 className="text-3xl font-extrabold text-white">NIT Durgapur Campus Services</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          An institutional-grade digital marketplace engineered exclusively for the National Institute of Technology Durgapur student fraternity.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 text-sm text-slate-300 leading-relaxed">
        <p>
          Established to overcome campus delivery limitations, <strong>NIT Durgapur Campus Services</strong> brings cafeteria meals, farm fresh fruits, express room-pickup laundry, and engineering stationery straight to student hostel doors across Halls 1 through 14, Mother Teresa Hall, Sister Nivedita Hall, and Gargi Hall.
        </p>

        <h3 className="text-lg font-bold text-white pt-2">Our Core Principles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" /> College Email Verification
            </div>
            <div className="text-xs text-slate-400">
              Only authenticated @nitdgp.ac.in emails can register, protecting student identity and hostel security.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" /> Dual-OTP Laundry Accountability
            </div>
            <div className="text-xs text-slate-400">
              Different cryptographically secured 6-digit codes for garment collection and delivery handover.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
