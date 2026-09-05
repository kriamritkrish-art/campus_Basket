'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useGeolocation } from '../../context/GeolocationContext';
import { MapPin, AlertCircle, CheckCircle2, RefreshCw, Zap } from 'lucide-react';

export function CampusBanner() {
  const pathname = usePathname();
  const { isInsideCampus, isChecking, errorMessage, requestLocation } = useGeolocation();

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery')
  ) {
    return null;
  }

  if (isChecking) {
    return (
      <div className="bg-[#f1f8e9] border-b border-[#dcedc8] px-4 py-1 text-xs text-[#33691e] flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#689f38]" />
        <span>Verifying NIT Durgapur Campus Perimeter...</span>
      </div>
    );
  }

  if (!isInsideCampus) {
    return (
      <div className="bg-[#fff3e0] border-b border-[#ffe0b2] px-4 py-1.5 text-xs text-[#e65100] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 mx-auto">
          <AlertCircle className="w-4 h-4 text-[#ef6c00] flex-shrink-0" />
          <span>
            <strong>Service Notice:</strong> Outside NIT Durgapur campus perimeter. Hostel room delivery available for verified campus halls.
          </span>
          <button
            onClick={() => requestLocation()}
            className="underline hover:text-[#b71c1c] flex items-center gap-1 font-semibold ml-2"
          >
            <RefreshCw className="w-3 h-3" /> Re-check GPS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f1f8e9] border-b border-[#dcedc8] px-4 py-1 text-[11px] text-[#33691e] flex items-center justify-center gap-2 font-medium">
      <Zap className="w-3 h-3 text-[#689f38] fill-[#689f38]" />
      <span>
        Express 10–15 Min Hostel Delivery Active across Halls 1 to 14, MTH, SNH & Gargi Hall &bull;
        <strong className="text-[#1b5e20] ml-1 font-bold">NIT Durgapur Verified Campus</strong>
      </span>
    </div>
  );
}
