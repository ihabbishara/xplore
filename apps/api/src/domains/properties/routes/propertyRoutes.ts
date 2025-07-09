import { Router } from 'express'
import { PropertyController } from '../controllers/propertyController'
import { authenticate } from '../../auth/middleware/authMiddleware'
import { validate } from '../../../middleware/validation'
import { createRateLimiter } from '../../../shared/middleware/rateLimiter'
import {
  importPropertyValidation,
  savePropertyValidation,
  propertyIdValidation,
  propertyQueryValidation,
  updatePropertyNotesValidation
} from '../validations/property.validation'

const router = Router()

// Rate limiter for property operations
const propertyLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per 5 minutes
  message: 'Too many property operations. Please try again later.',
})

// Rate limiter for import operations
const importLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 imports per 15 minutes
  message: 'Too many import attempts. Please try again later.',
})

// All routes require authentication
router.use(authenticate)

// Property import and validation
router.post('/import', importLimiter, validate(importPropertyValidation), PropertyController.importProperty)
router.post('/bulk-import', importLimiter, PropertyController.bulkImportProperties)
router.get('/supported-platforms', PropertyController.getSupportedPlatforms)
router.post('/validate-url', validate(importPropertyValidation), PropertyController.validateUrl)

// Property CRUD operations
router.get('/search', validate(propertyQueryValidation), PropertyController.searchProperties)
router.get('/nearby', validate(propertyQueryValidation), PropertyController.searchNearby)
router.get('/:propertyId', validate(propertyIdValidation), PropertyController.getProperty)
router.post('/:propertyId/refresh', propertyLimiter, validate(propertyIdValidation), PropertyController.refreshProperty)
router.get('/:propertyId/price-history', validate(propertyIdValidation), PropertyController.getPropertyPriceHistory)

// User saved properties management
router.get('/saved', PropertyController.getSavedProperties)
router.post('/save', propertyLimiter, validate(savePropertyValidation), PropertyController.saveProperty)
router.put('/saved/:savedId', propertyLimiter, PropertyController.updateSavedProperty)
router.delete('/saved/:savedId', propertyLimiter, PropertyController.deleteSavedProperty)

// Property comparison and analytics
router.get('/compare', PropertyController.compareProperties)
router.get('/analytics/trends', PropertyController.getMarketTrends)
router.get('/analytics/stats', PropertyController.getPropertyAnalytics)

// Price monitoring
router.post('/price-alerts', propertyLimiter, PropertyController.setupPriceAlert)
router.post('/price-check', propertyLimiter, PropertyController.triggerPriceCheck)

// Export functionality
router.post('/export', PropertyController.exportProperties)

export default router