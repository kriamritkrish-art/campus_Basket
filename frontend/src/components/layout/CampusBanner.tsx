'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useGeolocation } from '../../context/GeolocationContext';
import { useAuth } from '../../context/AuthContext';
import { CampusLocationModal } from './CampusLocationModal';
import { MapPin, AlertCircle, RefreshCw, Zap, Sparkles } from 'lucide-react';

export function CampusBanner() {
  const pathname = usePathname();
  const { isInsideCampus, isChecking, requestLocation } = useGeolocation();
  const { user } = useAuth();
  const [selectedHall, setSelectedHall] = useState('Hall 11');
  const [roomNumber, setRoomNumber] = useState('Room 123');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (typeof window !== 'undefined') {
        const h = localStorage.getItem('cb_selected_hall') || user?.student?.hall?.name || 'Hall 11';
        const r = localStorage.getItem('cb_room_number') || user?.student?.roomNumber || 'Room 123';
        setSelectedHall(h);
        setRoomNumber(r);
      }
    };
    sync();
    window.addEventListener('cb_location_updated', sync);
    return () => window.removeEventListener('cb_location_updated', sync);
  }, [user]);

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
        <div className="bg-[#eef7e9] border-b border-[#dcedc8] px-3 py-1.5 text-xs text-[#36751F] flex items-center justify-center gap-2 text-center">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4F9D2F] shrink-0" />
          <span className="text-[11px] sm:text-xs">Verifying NIT Durgapur Campus GPS Perimeter...</span>
        </div>
      )}

      {/* Outside GPS Boundary Notice */}
      {!isChecking && !isInsideCampus && (
        <div className="bg-[#fff8f0] border-b border-[#ffe2c8] px-3 sm:px-4 py-1.5 text-xs text-[#b45309]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <AlertCircle className="w-3.5 h-3.5 text-[#d97706] shrink-0" />
              <span className="text-[11px] sm:text-xs leading-tight truncate">
                Hostel room delivery active for verified NIT Durgapur halls.
              </span>
            </div>
            <button
              onClick={() => requestLocation()}
              className="underline hover:text-red-700 font-bold shrink-0 text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Re-check
            </button>
          </div>
        </div>
      )}

      {/* Campus Location Bar */}
      <div className="bg-[#F7F8F6] border-b border-[#E5E7EB] px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 sm:gap-3 text-[#172033] min-w-0">
            <div className="flex items-center gap-1 font-bold min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#4F9D2F] shrink-0" />
              <span className="text-gray-500 font-medium hidden sm:inline">Delivering to</span>
              <span className="text-[#172033] font-black truncate max-w-[160px] sm:max-w-none">{selectedHall} • {roomNumber}</span>
            </div>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1 text-gray-600 shrink-0">
              <Zap className="w-3 h-3 text-[#4F9D2F] fill-[#4F9D2F] shrink-0" />
              <span className="font-semibold text-[11px] sm:text-xs">10–15 min campus delivery</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="text-[11px] sm:text-xs font-bold text-[#4F9D2F] hover:text-[#36751F] hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
          >
            <span>Change</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      <CampusLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationChange={(h, r) => {
          setSelectedHall(h);
          setRoomNumber(r);
        }}
      />
    </>
  );
}
