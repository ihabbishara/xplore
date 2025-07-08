import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { RateLimitError } from '@/shared/utils/errors';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimiterOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown'),
    handler: (req: Request, res: Response) => {
      throw new RateLimitError(options.message || 'Too many requests');
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}