import { Router } from 'express';
import { AuthController } from '@/domains/auth/controllers/authController';
import { authenticate } from '@/domains/auth/middleware/authMiddleware';
import { createRateLimiter } from '@/shared/middleware/rateLimiter';
import { AUTH_CONSTANTS } from '@xplore/shared';

const router = Router();

// Rate limiters
const registerLimiter = createRateLimiter({
  windowMs: AUTH_CONSTANTS.RATE_LIMIT.REGISTER.windowMs,
  max: AUTH_CONSTANTS.RATE_LIMIT.REGISTER.max,
  message: 'Too many registration attempts. Please try again later.',
});

const loginLimiter = createRateLimiter({
  windowMs: AUTH_CONSTANTS.RATE_LIMIT.LOGIN.windowMs,
  max: AUTH_CONSTANTS.RATE_LIMIT.LOGIN.max,
  message: 'Too many login attempts. Please try again later.',
});

// Public routes
router.post('/register', registerLimiter, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/verify-email', AuthController.verifyEmail);

// Protected routes
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

export default router;