'use client';

import React from 'react';
import { LaundryBookingDrawer } from '../../../components/laundry/LaundryBookingDrawer';

export default function BookLaundryPage() {
  return (
    <div className="bg-[#f8f8f8] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1f8e9] text-[#2e7d32] text-xs font-bold border border-[#dcedc8]">
            <span>NIT Durgapur Doorstep Laundry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Schedule Doorstep Laundry Pickup
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
            Our verified campus laundry partner will arrive at your residence hall room during your selected slot with Dual-OTP verification and photo anti-loss tracking.
          </p>
        </div>

        <LaundryBookingDrawer />
      </div>
    </div>
  );
}
