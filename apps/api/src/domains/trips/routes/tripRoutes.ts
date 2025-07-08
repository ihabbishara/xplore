import { Router } from 'express'
import { TripController } from '../controllers/tripController'
import { authenticate } from '../../auth/middleware/authMiddleware'

const router = Router()

// All trip routes require authentication
router.use(authenticate)

// Trip CRUD operations
router.post(
  '/',
  TripController.createValidation,
  TripController.createTrip
)

router.get(
  '/',
  TripController.listValidation,
  TripController.listTrips
)

router.get(
  '/:id',
  TripController.getTrip
)

router.put(
  '/:id',
  TripController.updateValidation,
  TripController.updateTrip
)

router.delete(
  '/:id',
  TripController.deleteTrip
)

// Destination management
router.post(
  '/:id/destinations',
  TripController.addDestinationValidation,
  TripController.addDestination
)

router.put(
  '/destinations/:destinationId',
  TripController.updateDestinationValidation,
  TripController.updateDestination
)

router.delete(
  '/destinations/:destinationId',
  TripController.removeDestination
)

// Route management
router.post(
  '/:id/routes',
  TripController.createRouteValidation,
  TripController.createRoute
)

router.post(
  '/:id/optimize',
  TripController.optimizeRouteValidation,
  TripController.optimizeRoute
)

// Collaboration
router.post(
  '/:id/collaborators',
  TripController.addCollaboratorValidation,
  TripController.addCollaborator
)

export default router