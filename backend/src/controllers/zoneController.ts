import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditService } from '../services/audit/AuditService';

export class ZoneController {
  /**
   * List all service zones
   */
  public static async getZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zones = await prisma.serviceZone.findMany({
        include: { halls: true }
      });

      res.status(200).json({
        success: true,
        zones: zones.map((z) => ({
          ...z,
          polygonCoordinates: JSON.parse(z.polygonCoordinates || '[]')
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create or update service zone polygon
   */
  public static async saveZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, name, polygonCoordinates, isActive = true, availableServices = 'ALL' } = req.body;

      const coordinatesJson =
        typeof polygonCoordinates === 'string'
          ? polygonCoordinates
          : JSON.stringify(polygonCoordinates);

      let zone;
      if (id) {
        zone = await prisma.serviceZone.update({
          where: { id },
          data: {
            name,
            polygonCoordinates: coordinatesJson,
            isActive: isActive === true || isActive === 'true',
            availableServices
          }
        });
      } else {
        zone = await prisma.serviceZone.create({
          data: {
            name,
            polygonCoordinates: coordinatesJson,
            isActive: isActive === true || isActive === 'true',
            availableServices
          }
        });
      }

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: id ? 'ZONE_UPDATED' : 'ZONE_CREATED',
        entity: 'ServiceZone',
        entityId: zone.id,
        newValue: { name, isActive }
      });

      res.status(200).json({
        success: true,
        message: 'Service zone polygon saved successfully',
        zone
      });
    } catch (err) {
      next(err);
    }
  }
}
