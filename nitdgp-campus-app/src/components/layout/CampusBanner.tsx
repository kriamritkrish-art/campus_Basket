'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useGeolocation } from '../../context/GeolocationContext';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function CampusBanner() {
  const pathname = usePathname();
  const { isInsideCampus, isChecking, requestLocation } = useGeolocation();

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery')
  ) {
    return null;
  }

  return (
    <>
      {/* GPS Checking Notice */}
      {isChecking && (
        <div className="bg-[#eef7e9] border-b border-[#dcedc8] px-3 py-1 text-xs text-[#36751F] flex items-center justify-center gap-2 text-center">
          <RefreshCw className="w-3 h-3 animate-spin text-[#4F9D2F] shrink-0" />
          <span className="text-[11px]">Verifying Campus GPS Service Perimeter...</span>
        </div>
      )}

      {/* Outside GPS Boundary Notice */}
      {!isChecking && !isInsideCampus && (
        <div className="bg-[#fff8f0] border-b border-[#ffe2c8] px-3 sm:px-4 py-1 text-xs text-[#b45309]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <AlertCircle className="w-3.5 h-3.5 text-[#d97706] shrink-0" />
              <span className="text-[11px] leading-tight truncate">
                Hostel room delivery active for verified campus residence halls.
              </span>
            </div>
            <button
              onClick={() => requestLocation()}
              className="underline hover:text-red-700 font-bold shrink-0 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Re-check
            </button>
          </div>
        </div>
      )}

      {/* Top Information Bar */}
      <div className="bg-[#172033] text-white px-3 sm:px-6 lg:px-8 py-1.5 text-center text-xs font-semibold tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2">
          <span className="text-[#4F9D2F]">⚡</span>
          <span>10–15 min campus delivery across campus</span>
        </div>
      </div>
    </>
  );
}
