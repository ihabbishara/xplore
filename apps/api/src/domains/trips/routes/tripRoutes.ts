import { Router } from 'express'
import { TripController } from '../controllers/tripController'
import { authenticate } from '../../auth/middleware/authMiddleware'
import { validate } from '../../../middleware/validation'
import { createRateLimiter } from '../../../shared/middleware/rateLimiter'
import {
  createTripValidation,
  updateTripValidation,
  tripIdValidation,
  tripQueryValidation,
  addDestinationValidation,
  addCollaboratorValidation
} from '../validations/trip.validation'

const router = Router()

// Rate limiter for trip operations
const tripLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per 5 minutes
  message: 'Too many trip operations. Please try again later.',
})

// All trip routes require authentication
router.use(authenticate)

// Trip CRUD operations
router.post(
  '/',
  tripLimiter,
  validate(createTripValidation),
  TripController.createTrip
)

router.get(
  '/',
  validate(tripQueryValidation),
  TripController.listTrips
)

router.get(
  '/:id',
  validate(tripIdValidation),
  TripController.getTrip
)

router.put(
  '/:id',
  tripLimiter,
  validate(tripIdValidation),
  validate(updateTripValidation),
  TripController.updateTrip
)

router.delete(
  '/:id',
  tripLimiter,
  validate(tripIdValidation),
  TripController.deleteTrip
)

// Destination management
router.post(
  '/:id/destinations',
  tripLimiter,
  validate(tripIdValidation),
  validate(addDestinationValidation),
  TripController.addDestination
)

router.put(
  '/destinations/:destinationId',
  tripLimiter,
  TripController.updateDestination
)

router.delete(
  '/destinations/:destinationId',
  tripLimiter,
  TripController.removeDestination
)

// Route management
router.post(
  '/:id/routes',
  tripLimiter,
  validate(tripIdValidation),
  TripController.createRoute
)

router.post(
  '/:id/optimize',
  tripLimiter,
  validate(tripIdValidation),
  TripController.optimizeRoute
)

// Collaboration
router.post(
  '/:id/collaborators',
  tripLimiter,
  validate(tripIdValidation),
  validate(addCollaboratorValidation),
  TripController.addCollaborator
)

export default router