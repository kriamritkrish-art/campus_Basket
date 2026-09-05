import { Request, Response, NextFunction } from 'express';

export function rbacGuard(allowedRoles: Array<'STUDENT' | 'ADMIN' | 'SERVICE_PROVIDER' | 'DELIVERY_BOY'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Admins have superuser access across all endpoints
    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Forbidden: Access restricted. You do not have permission to access this resource.`
    });
  };
}
