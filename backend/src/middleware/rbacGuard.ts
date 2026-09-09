import { Request, Response, NextFunction } from 'express';

export function rbacGuard(allowedRoles: Array<'STUDENT' | 'ADMIN' | 'SERVICE_PROVIDER' | 'DELIVERY_BOY' | 'DELIVERY'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const userRole = String(req.user.role || '').toUpperCase();
    const isDelivery = userRole === 'DELIVERY' || userRole === 'DELIVERY_BOY';
    const allowsDelivery = allowedRoles.some(r => r === 'DELIVERY' || r === 'DELIVERY_BOY');

    // Admins have superuser access across all endpoints
    if (userRole === 'ADMIN' || allowedRoles.includes(userRole as any) || (isDelivery && allowsDelivery)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Forbidden: Access restricted. You do not have permission to access this resource.`
    });
  };
}
