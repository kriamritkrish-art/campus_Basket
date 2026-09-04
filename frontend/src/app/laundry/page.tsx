'use client';

import React from 'react';
import Link from 'next/link';
import { LaundryBookingDrawer } from '../../components/laundry/LaundryBookingDrawer';
import { Shirt, ShieldCheck, Sparkles, CheckCircle2, QrCode, Clock } from 'lucide-react';

export default function LaundryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-bold border border-[#dcedc8]">
            <Shirt className="w-3.5 h-3.5" /> Doorstep Room Pickup &amp; Return
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
            Automated Campus Laundry <br />
            <span className="text-[#689f38]">Powered by Dual-OTP Protection</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Professional washing, fabric softening, precision steam iron, and room return across all 14 residence halls. Each order gets a unique tracking number, bag QR tagging, and dual OTP validation.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1.5 text-[#2e7d32]">
              <CheckCircle2 className="w-4 h-4 text-[#689f38]" /> 24h Express Available
            </span>
            <span className="flex items-center gap-1.5 text-[#2e7d32]">
              <ShieldCheck className="w-4 h-4 text-[#689f38]" /> Separate Pickup &amp; Delivery OTPs
            </span>
            <span className="flex items-center gap-1.5 text-gray-700">
              <QrCode className="w-4 h-4 text-gray-500" /> Laundry Bag QR Tagging
            </span>
          </div>
        </div>

        <div className="bg-[#f1f8e9] border border-[#dcedc8] rounded-2xl p-6 text-center space-y-2 min-w-[240px]">
          <div className="text-xs font-bold uppercase text-gray-500 tracking-wider">Campus Subsidized</div>
          <div className="text-3xl font-black text-gray-900">₹15 <span className="text-xs font-normal text-gray-500">/ garment</span></div>
          <div className="text-[11px] text-[#33691e] font-medium">Includes wash, steam press &amp; folding</div>
          <a
            href="#booking-form"
            className="block w-full py-2.5 bg-[#689f38] hover:bg-[#5b8c30] text-white font-bold text-xs rounded-lg shadow-sm transition-colors uppercase tracking-wider"
          >
            Book Room Pickup
          </a>
        </div>
      </div>

      {/* Laundry Booking Form */}
      <div id="booking-form" className="max-w-3xl mx-auto">
        <LaundryBookingDrawer />
      </div>
    </div>
  );
}
