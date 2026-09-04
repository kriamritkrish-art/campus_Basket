import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/environment';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const issues = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    res.status(400).json({
      success: false,
      message: issues[0]?.message || 'Input validation failed',
      errors: issues
    });
    return;
  }

  // Handle known Prisma Errors
  if (err?.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists.`
    });
    return;
  }

  // Log error securely on the server
  console.error(`[UnhandledError] ${req.method} ${req.originalUrl}:`, err);

  // Return production safe error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? 'An unexpected error occurred. Our campus engineering team has been notified.'
        : err.message,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
