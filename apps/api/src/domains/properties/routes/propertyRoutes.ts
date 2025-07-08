import { Router } from 'express'
import { PropertyController } from '../controllers/propertyController'
import { authenticate } from '../../auth/middleware/authMiddleware'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Property import and validation
router.post('/import', PropertyController.importValidation, PropertyController.importProperty)
router.post('/bulk-import', PropertyController.bulkImportValidation, PropertyController.bulkImportProperties)
router.get('/supported-platforms', PropertyController.getSupportedPlatforms)
router.post('/validate-url', PropertyController.validateUrlValidation, PropertyController.validateUrl)

// Property CRUD operations
router.get('/search', PropertyController.searchValidation, PropertyController.searchProperties)
router.get('/nearby', PropertyController.nearbyValidation, PropertyController.searchNearby)
router.get('/:propertyId', PropertyController.getProperty)
router.post('/:propertyId/refresh', PropertyController.refreshProperty)
router.get('/:propertyId/price-history', PropertyController.getPropertyPriceHistory)

// User saved properties management
router.get('/saved', PropertyController.getSavedValidation, PropertyController.getSavedProperties)
router.post('/save', PropertyController.saveValidation, PropertyController.saveProperty)
router.put('/saved/:savedId', PropertyController.updateSavedValidation, PropertyController.updateSavedProperty)
router.delete('/saved/:savedId', PropertyController.deleteSavedProperty)

// Property comparison and analytics
router.get('/compare', PropertyController.compareValidation, PropertyController.compareProperties)
router.get('/analytics/trends', PropertyController.trendsValidation, PropertyController.getMarketTrends)
router.get('/analytics/stats', PropertyController.analyticsValidation, PropertyController.getPropertyAnalytics)

// Price monitoring
router.post('/price-alerts', PropertyController.priceAlertValidation, PropertyController.setupPriceAlert)
router.post('/price-check', PropertyController.triggerPriceCheck)

// Export functionality
router.post('/export', PropertyController.exportValidation, PropertyController.exportProperties)

export default router