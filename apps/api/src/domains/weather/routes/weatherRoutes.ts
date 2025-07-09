import { Router } from 'express'
import { weatherController } from '../controllers/weatherController'
import { authMiddleware } from '../../auth/middleware/authMiddleware'
import { weatherValidation } from '../validation/weatherValidation'
import { validate } from '../../../shared/middleware/validate'

const router = Router()

// Public routes
router.get(
  '/current',
  validate(weatherValidation.getCurrentWeather),
  weatherController.getCurrentWeather
)

router.get(
  '/forecast',
  validate(weatherValidation.getForecast),
  weatherController.getWeatherForecast
)

router.get(
  '/climate',
  validate(weatherValidation.getClimate),
  weatherController.getHistoricalClimate
)

router.post(
  '/compare',
  validate(weatherValidation.compareLocations),
  weatherController.compareLocations
)

router.get(
  '/activities',
  validate(weatherValidation.getActivities),
  weatherController.getWeatherActivities
)

router.get(
  '/alerts',
  validate(weatherValidation.getAlerts),
  weatherController.getWeatherAlerts
)

// Protected routes
router.get(
  '/preferences',
  authMiddleware,
  weatherController.getUserPreferences
)

router.put(
  '/preferences',
  authMiddleware,
  validate(weatherValidation.updatePreferences),
  weatherController.updateUserPreferences
)

// Admin routes
router.get(
  '/cache/metrics',
  authMiddleware,
  weatherController.getCacheMetrics
)

router.post(
  '/cache/invalidate',
  authMiddleware,
  validate(weatherValidation.invalidateCache),
  weatherController.invalidateCache
)

export default router