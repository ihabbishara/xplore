import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/domains/auth/services/authService';
import { AuthenticationError, AuthorizationError } from '@/shared/utils/errors';
import { JWTPayload } from '@xplore/shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No authorization header');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new AuthenticationError('Invalid authorization header format');
    }

    const payload = await AuthService.verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
}

export function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(new AuthenticationError('Authentication required'));
    return;
  }

  if (!req.user.emailVerified) {
    next(new AuthorizationError('Email verification required'));
    return;
  }

  next();
}

export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  authenticate(req, res, next);
}