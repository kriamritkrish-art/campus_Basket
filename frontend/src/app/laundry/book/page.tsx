'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LaundryBookingDrawer } from '../../../components/laundry/LaundryBookingDrawer';

export default function BookLaundryPage() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col text-gray-900">
      {/* Minimal Campus Basket Header */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#4F9D2F] flex items-center justify-center text-white font-extrabold text-xs shadow-xs group-hover:bg-[#36751F] transition-colors">
              cb
            </div>
            <div>
              <div className="font-extrabold text-[#172033] text-base tracking-tight leading-none">
                campus<span className="text-[#4F9D2F]">basket</span>
              </div>
              <div className="text-[9px] sm:text-[9.5px] font-semibold tracking-wider text-[#667085] uppercase mt-0.5">
                CAMPUS MARKETPLACE &amp; SERVICES
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition py-1.5 px-3 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Back to Campus Services</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 w-full">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-bold border border-[#dcedc8]">
            <span>Campus Basket Doorstep Laundry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Schedule Doorstep Laundry Pickup
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
            Our verified campus laundry partner will arrive at your residence hall room during your selected slot with Dual-OTP verification and photo anti-loss tracking.
          </p>
        </div>

        <LaundryBookingDrawer />
      </main>
    </div>
  );
}
