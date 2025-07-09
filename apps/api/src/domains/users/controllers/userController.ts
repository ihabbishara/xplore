import { Request, Response, NextFunction } from 'express';
import { UserService } from '@/domains/users/services/userService';
import { createProfileSchema, updateProfileSchema } from '@xplore/shared';
import { ValidationError } from '@/shared/utils/errors';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        throw new Error('User not found in request');
      }

      const profile = await UserService.getProfile((req as any).user.userId);

      res.json({
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async setupProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        throw new Error('User not found in request');
      }

      // Validate request body
      const validatedData = createProfileSchema.parse(req.body);

      // Setup profile (create or update)
      const profile = await UserService.setupProfile((req as any).user.userId, validatedData);

      res.json({
        data: profile,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        throw new Error('User not found in request');
      }

      // Validate request body
      const validatedData = updateProfileSchema.parse(req.body);

      // Update profile
      const profile = await UserService.updateProfile((req as any).user.userId, validatedData);

      res.json({
        data: profile,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        throw new Error('User not found in request');
      }

      // TODO: Implement file upload with multer and S3/Cloudflare R2
      // For now, just accept a URL
      const { avatarUrl } = req.body;

      if (!avatarUrl || typeof avatarUrl !== 'string') {
        throw new ValidationError('Avatar URL is required');
      }

      const profile = await UserService.uploadAvatar((req as any).user.userId, avatarUrl);

      res.json({
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!(req as any).user) {
        throw new Error('User not found in request');
      }

      // TODO: Add additional verification (password, 2FA, etc.)
      await UserService.deleteProfile((req as any).user.userId);

      res.json({
        data: {
          message: 'Account deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}