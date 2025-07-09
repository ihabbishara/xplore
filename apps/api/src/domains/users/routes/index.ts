import { Router } from 'express';
import { UserController } from '@/domains/users/controllers/userController';
import { authenticate, requireVerifiedEmail } from '@/domains/auth/middleware/authMiddleware';
import { validate } from '@/middleware/validation';
import { createRateLimiter } from '@/shared/middleware/rateLimiter';
import {
  updateProfileValidation,
  updatePreferencesValidation,
  changePasswordValidation,
  updateEmailValidation,
  deleteAccountValidation
} from '../validations/user.validation';

const router: Router = Router();

// Rate limiter for user operations
const userLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per 5 minutes
  message: 'Too many user operations. Please try again later.',
});

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', UserController.getProfile);
router.post('/profile/setup', userLimiter, validate(updateProfileValidation), UserController.setupProfile);
router.put('/profile', requireVerifiedEmail, userLimiter, validate(updateProfileValidation), UserController.updateProfile);
router.post('/profile/avatar', requireVerifiedEmail, userLimiter, UserController.uploadAvatar);

// Preferences
router.put('/preferences', userLimiter, validate(updatePreferencesValidation), UserController.updateProfile);

// Account management
router.put('/change-password', requireVerifiedEmail, userLimiter, validate(changePasswordValidation), UserController.updateProfile);
router.put('/change-email', requireVerifiedEmail, userLimiter, validate(updateEmailValidation), UserController.updateProfile);
router.delete('/account', requireVerifiedEmail, userLimiter, validate(deleteAccountValidation), UserController.deleteAccount);

export default router;