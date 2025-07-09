import { Router } from 'express';
import { AuthController } from '@/domains/auth/controllers/authController';
import { authenticate } from '@/domains/auth/middleware/authMiddleware';
import { createRateLimiter } from '@/shared/middleware/rateLimiter';
import { AUTH_CONSTANTS } from '@xplore/shared';
import { validate } from '@/middleware/validation';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../validations/auth.validation';

const router: Router = Router();

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

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() });
});

// Public routes
router.post('/register', registerLimiter, validate(registerValidation), AuthController.register);
router.post('/login', loginLimiter, validate(loginValidation), AuthController.login);
router.post('/refresh', validate(refreshTokenValidation), AuthController.refreshToken);
router.post('/verify-email', AuthController.verifyEmail);

// Protected routes
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

export default router;