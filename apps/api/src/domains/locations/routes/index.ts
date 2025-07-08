import { Router } from 'express';
import { LocationController } from '@/domains/locations/controllers/locationController';
import { authenticate } from '@/domains/auth/middleware/authMiddleware';
import { createRateLimiter } from '@/shared/middleware/rateLimiter';

const router = Router();

// Rate limiter for location searches
const searchLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many location searches. Please try again later.',
});

// Public routes (but with rate limiting)
router.get('/search', searchLimiter, LocationController.search);
router.get('/reverse', searchLimiter, LocationController.reverseGeocode);
router.get('/popular', LocationController.getPopularDestinations);

// Protected routes (none for now, but ready for future features)
// router.get('/saved', authenticate, LocationController.getSavedLocations);

export default router;