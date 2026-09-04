import { Request, Response, NextFunction } from 'express';
import { isCoordinateWithinServiceArea } from '../utils/geofence';
import { prisma } from '../config/database';

export async function geofenceGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const latHeader = req.headers['x-student-lat'];
    const lngHeader = req.headers['x-student-lng'];

    let lat = latHeader ? parseFloat(latHeader as string) : undefined;
    let lng = lngHeader ? parseFloat(lngHeader as string) : undefined;

    // Check body if header not supplied
    if (lat === undefined && req.body && req.body.location) {
      lat = req.body.location.lat;
      lng = req.body.location.lng;
    }

    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      res.status(403).json({
        success: false,
        code: 'LOCATION_REQUIRED',
        message: 'Campus location verification required. Please enable browser location permissions to confirm you are within the NIT Durgapur service perimeter.'
      });
      return;
    }

    // Fetch active service zones from DB if available
    let zonePolygons: Array<Array<{ lat: number; lng: number }>> = [];
    try {
      const activeZones = await prisma.serviceZone.findMany({
        where: { isActive: true }
      });
      zonePolygons = activeZones
        .map((z) => {
          try {
            return JSON.parse(z.polygonCoordinates);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch {
      // Fallback to default campus polygon
    }

    const { isInside } = isCoordinateWithinServiceArea({ lat, lng }, zonePolygons);

    if (!isInside) {
      res.status(403).json({
        success: false,
        code: 'OUTSIDE_SERVICE_AREA',
        message: 'Services are currently available only within the NIT Durgapur campus service area.'
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
