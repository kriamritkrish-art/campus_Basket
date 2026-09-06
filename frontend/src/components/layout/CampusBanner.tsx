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

  if (isChecking) {
    return (
      <div className="bg-[#eef7e9] border-b border-[#dcedc8] px-4 py-1.5 text-xs text-[#36751F] flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4F9D2F]" />
        <span>Verifying NIT Durgapur Campus GPS Perimeter...</span>
      </div>
    );
  }

  if (!isInsideCampus) {
    return (
      <div className="bg-[#fff8f0] border-b border-[#ffe2c8] px-4 py-1.5 text-xs text-[#b45309] flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto">
          <AlertCircle className="w-4 h-4 text-[#d97706] shrink-0" />
          <span>
            <strong>Campus Notice:</strong> Outside NIT Durgapur GPS boundary. Direct hostel delivery active for verified halls.
          </span>
          <button
            onClick={() => requestLocation()}
            className="underline hover:text-red-700 font-bold ml-2 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Re-check GPS
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Campus Location Bar (Requirements: Below header campus context bar) */}
      <div className="bg-[#F7F8F6] border-b border-[#E5E7EB] px-3 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 sm:gap-3 text-[#172033]">
            <div className="flex items-center gap-1.5 font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#4F9D2F] shrink-0" />
              <span className="text-gray-500 font-medium">Delivering to</span>
              <span className="text-[#172033] font-black">{selectedHall} • {roomNumber}</span>
            </div>
            <span className="text-gray-300 hidden xs:inline">|</span>
            <div className="flex items-center gap-1 text-gray-600">
              <Zap className="w-3 h-3 text-[#4F9D2F] fill-[#4F9D2F] shrink-0" />
              <span className="font-semibold text-[11px] sm:text-xs">10–15 min campus delivery</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="text-[11px] sm:text-xs font-bold text-[#4F9D2F] hover:text-[#36751F] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Change Location</span>
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
