import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export class HallController {
  /**
   * Get all active NIT Durgapur Halls
   */
  public static async getHalls(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const halls = await prisma.hall.findMany({
        where: { isActive: true },
        include: { serviceZone: true },
        orderBy: { name: 'asc' }
      });

      res.status(200).json({
        success: true,
        halls
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Add or update Hall
   */
  public static async saveHall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, name, hallNumber, isActive = true, isServiceable = true, serviceZoneId, deliveryInstructions } = req.body;

      let hall;
      if (id) {
        hall = await prisma.hall.update({
          where: { id },
          data: {
            name,
            hallNumber,
            isActive,
            isServiceable,
            serviceZoneId: serviceZoneId || null,
            deliveryInstructions
          }
        });
      } else {
        hall = await prisma.hall.create({
          data: {
            name,
            hallNumber,
            isActive,
            isServiceable,
            serviceZoneId: serviceZoneId || null,
            deliveryInstructions
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Hall saved successfully',
        hall
      });
    } catch (err) {
      next(err);
    }
  }
}
