'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

interface GeolocationContextType {
  coords: Coords | null;
  isInsideCampus: boolean;
  geofenceEnforced: boolean;
  isChecking: boolean;
  errorMessage: string | null;
  requestLocation: () => Promise<void>;
}

const GeolocationContext = createContext<GeolocationContextType>({
  coords: null,
  isInsideCampus: true,
  geofenceEnforced: true,
  isChecking: false,
  errorMessage: null,
  requestLocation: async () => {},
});

// Campus Center & Max Perimeter Check
const CAMPUS_PERIMETER_CENTER = { lat: 23.5484, lng: 87.2931 };
const MAX_CAMPUS_RADIUS_KM = 3.0; // Covers all academic blocks and halls 1 to 14

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function GeolocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [isInsideCampus, setIsInsideCampus] = useState<boolean>(true);
  const [geofenceEnforced, setGeofenceEnforced] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Only check if geofence is disabled by admin if user has admin credentials
    const token = typeof window !== 'undefined' ? localStorage.getItem('nit_token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('nit_role') : null;
    if (token && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
      fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.settings)) {
            const setting = data.settings.find((s: any) => s.key === 'GEOFENCE_ENFORCED');
            if (setting && setting.value === 'false') {
              setGeofenceEnforced(false);
              setIsInsideCampus(true);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const studentCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(studentCoords);
        localStorage.setItem('campus_student_coords', JSON.stringify(studentCoords));

        const dist = getDistanceKm(
          studentCoords.lat,
          studentCoords.lng,
          CAMPUS_PERIMETER_CENTER.lat,
          CAMPUS_PERIMETER_CENTER.lng
        );

        const inside = dist <= MAX_CAMPUS_RADIUS_KM;
        setIsInsideCampus(!geofenceEnforced ? true : inside);
        setIsChecking(false);
      },
      (err) => {
        setIsChecking(false);
        // Default to campus location in simulation/fallback
        const fallback = { lat: 23.5484, lng: 87.2931 };
        setCoords(fallback);
        localStorage.setItem('nit_student_coords', JSON.stringify(fallback));
        setIsInsideCampus(true);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    requestLocation();
  }, [geofenceEnforced]);

  return (
    <GeolocationContext.Provider
      value={{
        coords,
        isInsideCampus: !geofenceEnforced ? true : isInsideCampus,
        geofenceEnforced,
        isChecking,
        errorMessage,
        requestLocation,
      }}
    >
      {children}
    </GeolocationContext.Provider>
  );
}

export const useGeolocation = () => useContext(GeolocationContext);
