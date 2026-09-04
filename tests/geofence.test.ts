import { describe, it, expect } from 'vitest';
import {
  isPointInPolygon,
  isCoordinateWithinServiceArea,
  DEFAULT_NIT_DURGAPUR_CAMPUS_POLYGON,
  LatLng
} from '../backend/src/utils/geofence';

describe('NIT Durgapur Campus Geofencing & Service Area Validation', () => {
  it('correctly identifies coordinates inside NIT Durgapur campus', () => {
    // Center of NIT Durgapur (Academic section)
    const academicCenter: LatLng = { lat: 23.5484, lng: 87.2931 };
    const result = isCoordinateWithinServiceArea(academicCenter);
    expect(result.isInside).toBe(true);

    // Hostels section (Hall 11 & Hall 12 area)
    const hostelArea: LatLng = { lat: 23.5510, lng: 87.2900 };
    const hostelResult = isCoordinateWithinServiceArea(hostelArea);
    expect(hostelResult.isInside).toBe(true);
  });

  it('strictly rejects coordinates outside the campus boundary', () => {
    // City Centre Durgapur (~7 km away)
    const cityCenter: LatLng = { lat: 23.5350, lng: 87.3500 };
    const cityResult = isCoordinateWithinServiceArea(cityCenter);
    expect(cityResult.isInside).toBe(false);

    // Kolkata (~160 km away)
    const kolkata: LatLng = { lat: 22.5726, lng: 88.3639 };
    const kolkataResult = isCoordinateWithinServiceArea(kolkata);
    expect(kolkataResult.isInside).toBe(false);
  });

  it('evaluates arbitrary polygon vertices using ray-casting', () => {
    const square: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 10, lng: 10 },
      { lat: 10, lng: 0 }
    ];

    expect(isPointInPolygon({ lat: 5, lng: 5 }, square)).toBe(true);
    expect(isPointInPolygon({ lat: 15, lng: 5 }, square)).toBe(false);
    expect(isPointInPolygon({ lat: -1, lng: -1 }, square)).toBe(false);
  });
});
