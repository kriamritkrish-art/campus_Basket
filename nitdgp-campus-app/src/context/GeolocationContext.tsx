'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

interface GeolocationContextType {
  coords: Coords | null;
  isInsideCampus: boolean;
  isChecking: boolean;
  errorMessage: string | null;
  requestLocation: () => Promise<void>;
}

const GeolocationContext = createContext<GeolocationContextType>({
  coords: null,
  isInsideCampus: true,
  isChecking: false,
  errorMessage: null,
  requestLocation: async () => {},
});

// NIT Durgapur Campus Center & Max Perimeter Check
const NIT_CAMPUS_CENTER = { lat: 23.5484, lng: 87.2931 };
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
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        localStorage.setItem('nit_student_coords', JSON.stringify(studentCoords));

        const dist = getDistanceKm(
          studentCoords.lat,
          studentCoords.lng,
          NIT_CAMPUS_CENTER.lat,
          NIT_CAMPUS_CENTER.lng
        );

        const inside = dist <= MAX_CAMPUS_RADIUS_KM;
        setIsInsideCampus(inside);
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
  }, []);

  return (
    <GeolocationContext.Provider
      value={{
        coords,
        isInsideCampus,
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
