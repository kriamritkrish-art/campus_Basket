import React from 'react';
import { ShieldCheck, MapPin, Sparkles, Award } from 'lucide-react';

export const metadata = {
  title: 'About Campus Marketplace — Campus Basket',
  description: 'Learn about the student-focused campus commerce and services platform.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">About the Platform</span>
        <h1 className="text-3xl font-extrabold text-white">Campus Basket Platform Services</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          An institutional-grade digital marketplace engineered exclusively for campus student communities.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 text-sm text-slate-300 leading-relaxed">
        <p>
          Established to overcome campus delivery limitations, <strong>Campus Basket Platform</strong> brings cafeteria meals, farm fresh fruits, express room-pickup laundry, and essential academic stationery straight to student hostel doors across campus residence halls with reliable 10–15 minute delivery.
        </p>

        <h3 className="text-lg font-bold text-white pt-2">Our Core Principles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" /> Verified Institutional Community
            </div>
            <div className="text-xs text-slate-400">
              Only verified campus emails and authenticated credentials can register, protecting student privacy and hostel security.
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
