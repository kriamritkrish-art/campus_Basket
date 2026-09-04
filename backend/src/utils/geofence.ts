/**
 * Campus Geofencing Utilities for NIT Durgapur
 * Center: ~23.5484° N, 87.2931° E (Mahatma Gandhi Avenue, Durgapur)
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Standard Ray-Casting algorithm for Point-In-Polygon determination.
 * Returns true if the coordinate is inside the given polygon vertex array.
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
export function calculateHaversineDistanceKm(p1: LatLng, p2: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Default boundary polygon covering the entire NIT Durgapur Campus
 */
export const DEFAULT_NIT_DURGAPUR_CAMPUS_POLYGON: LatLng[] = [
  { lat: 23.5535, lng: 87.2870 }, // North-West boundary (Near Hall 11 / B-Zone)
  { lat: 23.5540, lng: 87.2975 }, // North-East boundary (Near Main Gate / BCP Area)
  { lat: 23.5480, lng: 87.3005 }, // South-East boundary (Near Academic Complex / Oval ground)
  { lat: 23.5425, lng: 87.2940 }, // South-West boundary (Near Hall 7 / Sports Complex)
  { lat: 23.5450, lng: 87.2860 }  // West boundary (Faculty quarters / Outer perimeter)
];

/**
 * Checks if a given coordinate lies within any of the provided active zone polygons,
 * or within the campus boundary.
 */
export function isCoordinateWithinServiceArea(
  coord: LatLng,
  zonePolygons?: LatLng[][]
): { isInside: boolean; matchedZoneIndex?: number } {
  if (zonePolygons && zonePolygons.length > 0) {
    for (let i = 0; i < zonePolygons.length; i++) {
      if (isPointInPolygon(coord, zonePolygons[i])) {
        return { isInside: true, matchedZoneIndex: i };
      }
    }
  }

  // Fallback to primary NIT Durgapur Campus Polygon
  const isInsideCampus = isPointInPolygon(coord, DEFAULT_NIT_DURGAPUR_CAMPUS_POLYGON);
  if (isInsideCampus) {
    return { isInside: true };
  }

  // Fallback distance check to center within 2.5km (covers all peripheral hostels)
  const center: LatLng = { lat: 23.5484, lng: 87.2931 };
  const dist = calculateHaversineDistanceKm(coord, center);
  if (dist <= 2.5) {
    return { isInside: true };
  }

  return { isInside: false };
}
