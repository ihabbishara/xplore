import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/domains/auth/services/authService';
import { FirebaseAuthService } from '@/domains/auth/services/firebaseAuthService';
import { AuthenticationError, AuthorizationError } from '@/shared/utils/errors';
import { JWTPayload } from '@xplore/shared';
import { logger } from '@/shared/utils/logger';

// Express Request type is already extended in src/types/express.d.ts

export const authMiddleware = authenticate;

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

    let payload: JWTPayload;

    // Check if it's a Firebase token or JWT token
    if (FirebaseAuthService.isFirebaseToken(token)) {
      logger.info('Authenticating with Firebase token');
      payload = await FirebaseAuthService.verifyFirebaseToken(token);
    } else {
      logger.info('Authenticating with JWT token');
      payload = await AuthService.verifyAccessToken(token);
    }

    (req as any).user = { ...payload, id: payload.userId };
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
}

export function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(req as any).user) {
    next(new AuthenticationError('Authentication required'));
    return;
  }

  if (!(req as any).user.emailVerified) {
    next(new AuthorizationError('Email verification required'));
    return;
  }

  next();
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  try {
    await authenticate(req, res, next);
  } catch (error) {
    // For optional auth, don't fail if authentication fails
    logger.warn('Optional authentication failed:', error);
    next();
  }
}