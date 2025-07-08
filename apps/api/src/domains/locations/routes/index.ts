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

// Rate limiter for wishlist operations
const wishlistLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes
  message: 'Too many wishlist operations. Please try again later.',
});

// Public routes (but with rate limiting)
router.get('/search', searchLimiter, LocationController.search);
router.get('/reverse', searchLimiter, LocationController.reverseGeocode);
router.get('/popular', LocationController.getPopularDestinations);

// Protected routes - Wishlist management
router.use(authenticate); // All routes below require authentication

// Wishlist endpoints
router.post('/save', wishlistLimiter, LocationController.saveLocation);
router.delete('/saved/:locationId', wishlistLimiter, LocationController.removeLocation);
router.get('/saved', LocationController.getSavedLocations);
router.put('/saved/:locationId', wishlistLimiter, LocationController.updateSavedLocation);
router.put('/saved/:locationId/notes', wishlistLimiter, LocationController.updateNotes);
router.put('/saved/:locationId/tags', wishlistLimiter, LocationController.updateTags);
router.get('/saved/map-view', LocationController.getMapViewLocations);
router.post('/batch-save', wishlistLimiter, LocationController.batchSaveLocations);

export default router;