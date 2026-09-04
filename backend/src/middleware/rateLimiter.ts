import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Clean up memory store every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now - entry.firstRequest > 3600 * 1000) {
      memoryStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyGenerator 
      ? options.keyGenerator(req) 
      : `${req.ip}_${req.baseUrl}${req.path}`;

    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry) {
      memoryStore.set(key, { count: 1, firstRequest: now });
      next();
      return;
    }

    if (now - entry.firstRequest > options.windowMs) {
      // Window expired, reset
      memoryStore.set(key, { count: 1, firstRequest: now });
      next();
      return;
    }

    if (entry.count >= options.max) {
      res.status(429).json({
        success: false,
        message: options.message
      });
      return;
    }

    entry.count++;
    next();
  };
}

export const otpRequestLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many OTP requests for this email address. Please wait an hour before requesting again.',
  keyGenerator: (req) => `otp_${req.body?.email || req.ip}`
});

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => `login_${req.body?.email || req.ip}`
});
