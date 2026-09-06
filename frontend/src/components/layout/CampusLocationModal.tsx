'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, X, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NIT_HALLS = [
  'Hall 1',
  'Hall 2',
  'Hall 3',
  'Hall 4',
  'Hall 5',
  'Hall 6',
  'Hall 7',
  'Hall 8',
  'Hall 9',
  'Hall 10',
  'Hall 11',
  'Hall 12',
  'Hall 13',
  'Hall 14',
  'Mother Teresa Hall',
  'Sister Nivedita Hall (SNH)',
  'Gargi Hall'
];

interface CampusLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationChange?: (hall: string, room: string) => void;
}

export function CampusLocationModal({ isOpen, onClose, onLocationChange }: CampusLocationModalProps) {
  const { user } = useAuth();
  const [selectedHall, setSelectedHall] = useState<string>('Hall 11');
  const [roomNumber, setRoomNumber] = useState<string>('Room 123');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHall = localStorage.getItem('cb_selected_hall') || user?.student?.hall?.name || 'Hall 11';
      const savedRoom = localStorage.getItem('cb_room_number') || user?.student?.roomNumber || 'Room 123';
      setSelectedHall(savedHall);
      setRoomNumber(savedRoom);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoom = roomNumber.trim() ? (roomNumber.toLowerCase().startsWith('room') ? roomNumber : `Room ${roomNumber}`) : 'Room 123';
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('cb_selected_hall', selectedHall);
      localStorage.setItem('cb_room_number', finalRoom);
      window.dispatchEvent(new CustomEvent('cb_location_updated', {
        detail: { hall: selectedHall, room: finalRoom }
      }));
    }

    if (onLocationChange) {
      onLocationChange(selectedHall, finalRoom);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fcfdfa]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#eef7e9] text-[#4F9D2F] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#172033]">Delivering to</h3>
              <p className="text-xs text-gray-500">10–15 min hostel doorstep delivery at NIT Durgapur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Room Number Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Room / Wing Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Room 123, B-304, Ground Floor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#4F9D2F] focus:bg-white transition-colors"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">Doorstep</span>
            </div>
          </div>

          {/* Residence Hall Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Select Residence Hall
              </label>
              <span className="text-[11px] text-[#4F9D2F] font-bold">14 Halls + MTH &amp; SNH</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {NIT_HALLS.map((hall) => {
                const isSelected = selectedHall === hall;
                return (
                  <button
                    key={hall}
                    type="button"
                    onClick={() => setSelectedHall(hall)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#eef7e9] border-[#4F9D2F] text-[#36751F] ring-1 ring-[#4F9D2F] shadow-xs'
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="truncate">{hall}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#4F9D2F] shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campus Guarantee Notice */}
          <div className="p-3 rounded-xl bg-[#f7f8f6] border border-gray-200/80 flex items-start gap-2.5 text-xs text-gray-600">
            <Sparkles className="w-4 h-4 text-[#4F9D2F] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900">Direct Hostel Room Delivery:</span> Verified campus runners bring orders directly to your hall common room or security gate without any extra charges.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#4F9D2F] hover:bg-[#36751F] text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
            >
              Save &amp; Deliver Here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
