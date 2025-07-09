import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/domains/auth/services/authService';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
} from '@xplore/shared';
import { ValidationError } from '@/shared/utils/errors';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      // Register user
      const result = await AuthService.register(validatedData);

      res.status(201).json({
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      // Login user
      const result = await AuthService.login(validatedData);

      res.json({
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = refreshTokenSchema.parse(req.body);

      // Refresh tokens
      const tokens = await AuthService.refreshTokens(validatedData.refreshToken);

      res.json({
        data: { tokens },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = verifyEmailSchema.parse(req.body);

      // Verify email
      await AuthService.verifyEmail(validatedData.token);

      res.json({
        data: {
          message: 'Email verified successfully',
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userFromReq = (req as any).user;
      if (!userFromReq) {
        throw new Error('User not found in request');
      }

      // Get user with profile
      const user = await prisma.user.findUnique({
        where: { id: userFromReq.userId },
        include: { profile: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      res.json({
        data: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          profile: user.profile ? {
            firstName: user.profile.firstName || undefined,
            lastName: user.profile.lastName || undefined,
            avatarUrl: user.profile.avatarUrl || undefined,
            userType: user.profile.userType || undefined,
            currentLocation: user.profile.currentLocation || undefined,
          } : undefined,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userFromReq = (req as any).user;
      if (!userFromReq) {
        throw new Error('User not found in request');
      }

      const refreshToken = req.body.refreshToken;

      await AuthService.logout(userFromReq.userId, refreshToken);

      res.json({
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

import { prisma } from '@/lib/prisma';