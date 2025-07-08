import { Request, Response } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { PropertyService } from '../services/propertyService'
import { PropertyScraper } from '../services/propertyScraper'
import { PropertyProcessor } from '../services/propertyProcessor'
import { PriceMonitor } from '../services/priceMonitor'
import { prisma } from '../../../lib/prisma'
import { logger } from '../../../shared/utils/logger'

// Initialize services
const scraper = new PropertyScraper()
const processor = new PropertyProcessor()
const priceMonitor = new PriceMonitor(prisma, scraper, processor)
const propertyService = new PropertyService(prisma, scraper, processor, priceMonitor)

export class PropertyController {
  // Import property from URL
  static importValidation = [
    body('url').isURL().withMessage('Valid URL is required'),
    body('autoSave').optional().isBoolean(),
    body('tags').optional().isArray(),
    body('notes').optional().isString()
  ]

  static async importProperty(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const { url, autoSave, tags, notes } = req.body

      const result = await propertyService.importProperty({
        url,
        userId,
        autoSave,
        tags,
        notes
      })

      if (result.success) {
        res.status(201).json({
          data: result.property,
          message: 'Property imported successfully',
          processingTime: result.processingTime
        })
      } else {
        res.status(400).json({
          errors: result.errors,
          message: 'Property import failed',
          processingTime: result.processingTime
        })
      }
    } catch (error) {
      logger.error('Property import error:', error)
      res.status(500).json({
        error: 'Failed to import property'
      })
    }
  }

  // Bulk import properties
  static bulkImportValidation = [
    body('urls').isArray().withMessage('URLs array is required'),
    body('urls.*').isURL().withMessage('All URLs must be valid'),
    body('autoSave').optional().isBoolean(),
    body('tags').optional().isArray(),
    body('notes').optional().isString()
  ]

  static async bulkImportProperties(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const { urls, autoSave, tags, notes } = req.body

      const result = await propertyService.bulkImportProperties({
        urls,
        userId,
        autoSave,
        tags,
        notes
      })

      res.json({
        data: result,
        message: `Bulk import completed: ${result.successful} successful, ${result.failed} failed`
      })
    } catch (error) {
      logger.error('Bulk import error:', error)
      res.status(500).json({
        error: 'Failed to bulk import properties'
      })
    }
  }

  // Get supported platforms
  static async getSupportedPlatforms(req: Request, res: Response) {
    try {
      const platforms = await propertyService.getSupportedPlatforms()
      res.json({
        data: platforms,
        message: 'Supported platforms retrieved successfully'
      })
    } catch (error) {
      logger.error('Get platforms error:', error)
      res.status(500).json({
        error: 'Failed to get supported platforms'
      })
    }
  }

  // Validate property URL
  static validateUrlValidation = [
    body('url').isURL().withMessage('Valid URL is required')
  ]

  static async validateUrl(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { url } = req.body
      const validation = await propertyService.validatePropertyUrl(url)

      res.json({
        data: validation,
        message: validation.isValid ? 'URL is valid' : 'URL validation failed'
      })
    } catch (error) {
      logger.error('URL validation error:', error)
      res.status(500).json({
        error: 'Failed to validate URL'
      })
    }
  }

  // Get property by ID
  static async getProperty(req: Request, res: Response) {
    try {
      const { propertyId } = req.params
      const property = await propertyService.getProperty(propertyId)

      if (!property) {
        return res.status(404).json({
          error: 'Property not found'
        })
      }

      res.json({
        data: property,
        message: 'Property retrieved successfully'
      })
    } catch (error) {
      logger.error('Get property error:', error)
      res.status(500).json({
        error: 'Failed to get property'
      })
    }
  }

  // Search properties
  static searchValidation = [
    query('query').optional().isString(),
    query('city').optional().isString(),
    query('country').optional().isString(),
    query('propertyType').optional().isString(),
    query('transactionType').optional().isIn(['sale', 'rent']),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('minSize').optional().isFloat({ min: 0 }),
    query('maxSize').optional().isFloat({ min: 0 }),
    query('minRooms').optional().isInt({ min: 0 }),
    query('minBedrooms').optional().isInt({ min: 0 }),
    query('features').optional().isString(),
    query('lat').optional().isFloat({ min: -90, max: 90 }),
    query('lng').optional().isFloat({ min: -180, max: 180 }),
    query('radius').optional().isFloat({ min: 0.1, max: 100 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('sortBy').optional().isIn(['price', 'size', 'created_at', 'updated_at']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ]

  static async searchProperties(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const filters = {
        query: req.query.query as string,
        city: req.query.city as string,
        country: req.query.country as string,
        propertyType: req.query.propertyType as string,
        transactionType: req.query.transactionType as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minSize: req.query.minSize ? parseFloat(req.query.minSize as string) : undefined,
        maxSize: req.query.maxSize ? parseFloat(req.query.maxSize as string) : undefined,
        minRooms: req.query.minRooms ? parseInt(req.query.minRooms as string) : undefined,
        minBedrooms: req.query.minBedrooms ? parseInt(req.query.minBedrooms as string) : undefined,
        features: req.query.features ? (req.query.features as string).split(',') : undefined,
        coordinates: req.query.lat && req.query.lng ? {
          lat: parseFloat(req.query.lat as string),
          lng: parseFloat(req.query.lng as string)
        } : undefined,
        radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        sortBy: req.query.sortBy as 'distance' | 'price' | 'size' | 'created_at' | 'updated_at' | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      }

      const result = await propertyService.searchProperties(filters)

      res.json({
        data: result.properties,
        meta: {
          total: result.total,
          hasMore: result.hasMore,
          limit: filters.limit,
          offset: filters.offset
        }
      })
    } catch (error) {
      logger.error('Search properties error:', error)
      res.status(500).json({
        error: 'Failed to search properties'
      })
    }
  }

  // Get nearby properties
  static nearbyValidation = [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    query('radius').optional().isFloat({ min: 0.1, max: 100 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]

  static async searchNearby(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const filters = {
        coordinates: {
          lat: parseFloat(req.query.lat as string),
          lng: parseFloat(req.query.lng as string)
        },
        radius: req.query.radius ? parseFloat(req.query.radius as string) : 10,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      }

      const result = await propertyService.searchProperties(filters)

      res.json({
        data: result.properties,
        meta: {
          center: filters.coordinates,
          radius: filters.radius,
          total: result.total
        }
      })
    } catch (error) {
      logger.error('Search nearby error:', error)
      res.status(500).json({
        error: 'Failed to search nearby properties'
      })
    }
  }

  // Save property for user
  static saveValidation = [
    body('propertyId').isUUID().withMessage('Valid property ID is required'),
    body('personalNotes').optional().isString(),
    body('userRating').optional().isInt({ min: 1, max: 5 }),
    body('visitStatus').optional().isIn(['planned', 'visited', 'interested', 'rejected']),
    body('visitDate').optional().isISO8601(),
    body('customTags').optional().isArray(),
    body('pros').optional().isArray(),
    body('cons').optional().isArray(),
    body('priorityLevel').optional().isInt({ min: 1, max: 5 }),
    body('relatedTripId').optional().isUUID()
  ]

  static async saveProperty(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const { propertyId, ...input } = req.body

      const saved = await propertyService.savePropertyForUser(propertyId, userId, input)

      res.status(201).json({
        data: saved,
        message: 'Property saved successfully'
      })
    } catch (error) {
      logger.error('Save property error:', error)
      res.status(500).json({
        error: 'Failed to save property'
      })
    }
  }

  // Get user's saved properties
  static getSavedValidation = [
    query('visitStatus').optional().isIn(['planned', 'visited', 'interested', 'rejected']),
    query('priorityLevel').optional().isInt({ min: 1, max: 5 }),
    query('tags').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ]

  static async getSavedProperties(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const filters = {
        visitStatus: req.query.visitStatus as string,
        priorityLevel: req.query.priorityLevel ? parseInt(req.query.priorityLevel as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
      }

      const saved = await propertyService.getUserSavedProperties(userId, filters)

      res.json({
        data: saved,
        meta: {
          total: saved.length
        }
      })
    } catch (error) {
      logger.error('Get saved properties error:', error)
      res.status(500).json({
        error: 'Failed to get saved properties'
      })
    }
  }

  // Update saved property
  static updateSavedValidation = [
    param('savedId').isUUID().withMessage('Valid saved property ID is required'),
    body('personalNotes').optional().isString(),
    body('userRating').optional().isInt({ min: 1, max: 5 }),
    body('visitStatus').optional().isIn(['planned', 'visited', 'interested', 'rejected']),
    body('visitDate').optional().isISO8601(),
    body('customTags').optional().isArray(),
    body('pros').optional().isArray(),
    body('cons').optional().isArray(),
    body('priorityLevel').optional().isInt({ min: 1, max: 5 }),
    body('relatedTripId').optional().isUUID()
  ]

  static async updateSavedProperty(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { savedId } = req.params
      const userId = req.user!.userId

      const updated = await propertyService.updateSavedProperty(savedId, userId, req.body)

      res.json({
        data: updated,
        message: 'Saved property updated successfully'
      })
    } catch (error: any) {
      logger.error('Update saved property error:', error)
      if (error.message === 'Saved property not found') {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to update saved property'
      })
    }
  }

  // Delete saved property
  static async deleteSavedProperty(req: Request, res: Response) {
    try {
      const { savedId } = req.params
      const userId = req.user!.userId

      await propertyService.removeSavedProperty(savedId, userId)

      res.json({
        message: 'Saved property deleted successfully'
      })
    } catch (error: any) {
      logger.error('Delete saved property error:', error)
      if (error.message === 'Saved property not found') {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to delete saved property'
      })
    }
  }

  // Compare properties
  static compareValidation = [
    query('ids').isString().withMessage('Property IDs are required'),
    body('priceWeight').optional().isFloat({ min: 0, max: 1 }),
    body('sizeWeight').optional().isFloat({ min: 0, max: 1 }),
    body('locationWeight').optional().isFloat({ min: 0, max: 1 }),
    body('featuresWeight').optional().isFloat({ min: 0, max: 1 }),
    body('conditionWeight').optional().isFloat({ min: 0, max: 1 })
  ]

  static async compareProperties(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const propertyIds = (req.query.ids as string).split(',')
      const criteria = {
        priceWeight: req.body.priceWeight,
        sizeWeight: req.body.sizeWeight,
        locationWeight: req.body.locationWeight,
        featuresWeight: req.body.featuresWeight,
        conditionWeight: req.body.conditionWeight
      }

      const comparison = await propertyService.compareProperties(propertyIds, criteria)

      res.json({
        data: comparison,
        message: 'Properties compared successfully'
      })
    } catch (error: any) {
      logger.error('Compare properties error:', error)
      if (error.message.includes('At least 2 properties')) {
        return res.status(400).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to compare properties'
      })
    }
  }

  // Get property price history
  static async getPropertyPriceHistory(req: Request, res: Response) {
    try {
      const { propertyId } = req.params
      const history = await propertyService.getPropertyPriceHistory(propertyId)

      res.json({
        data: history,
        message: 'Price history retrieved successfully'
      })
    } catch (error) {
      logger.error('Get price history error:', error)
      res.status(500).json({
        error: 'Failed to get price history'
      })
    }
  }

  // Refresh property data
  static async refreshProperty(req: Request, res: Response) {
    try {
      const { propertyId } = req.params
      const property = await propertyService.refreshProperty(propertyId)

      res.json({
        data: property,
        message: 'Property refreshed successfully'
      })
    } catch (error: any) {
      logger.error('Refresh property error:', error)
      if (error.message === 'Property not found') {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to refresh property'
      })
    }
  }

  // Get property analytics
  static analyticsValidation = [
    query('location').optional().isString(),
    query('propertyType').optional().isString(),
    query('country').optional().isString(),
    query('city').optional().isString()
  ]

  static async getPropertyAnalytics(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const filters = {
        location: req.query.location as string,
        propertyType: req.query.propertyType as string,
        country: req.query.country as string,
        city: req.query.city as string
      }

      const analytics = await propertyService.getPropertyAnalytics(filters)

      res.json({
        data: analytics,
        message: 'Analytics retrieved successfully'
      })
    } catch (error) {
      logger.error('Get analytics error:', error)
      res.status(500).json({
        error: 'Failed to get property analytics'
      })
    }
  }

  // Get market trends
  static trendsValidation = [
    query('location').isString().withMessage('Location is required'),
    query('propertyType').optional().isString(),
    query('timeframe').optional().isIn(['week', 'month', 'quarter'])
  ]

  static async getMarketTrends(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const location = req.query.location as string
      const propertyType = req.query.propertyType as string
      const timeframe = (req.query.timeframe as 'week' | 'month' | 'quarter') || 'month'

      const trends = await priceMonitor.analyzeMarketTrends(location, propertyType)
      const priceStats = await priceMonitor.getPriceChangeStats(timeframe)

      res.json({
        data: {
          trends,
          priceStats
        },
        message: 'Market trends retrieved successfully'
      })
    } catch (error) {
      logger.error('Get market trends error:', error)
      res.status(500).json({
        error: 'Failed to get market trends'
      })
    }
  }

  // Set up price alert
  static priceAlertValidation = [
    body('propertyId').isUUID().withMessage('Valid property ID is required'),
    body('alertType').isIn(['price_drop', 'price_increase', 'price_threshold']),
    body('threshold').optional().isFloat({ min: 0 }),
    body('percentage').optional().isFloat({ min: 0, max: 100 }),
    body('enabled').optional().isBoolean()
  ]

  static async setupPriceAlert(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const { propertyId, ...alertConfig } = req.body

      await priceMonitor.setupPriceAlert(propertyId, userId, alertConfig)

      res.json({
        message: 'Price alert set up successfully'
      })
    } catch (error) {
      logger.error('Setup price alert error:', error)
      res.status(500).json({
        error: 'Failed to set up price alert'
      })
    }
  }

  // Manual price check
  static async triggerPriceCheck(req: Request, res: Response) {
    try {
      const { propertyIds } = req.body

      if (!Array.isArray(propertyIds)) {
        return res.status(400).json({
          error: 'Property IDs array is required'
        })
      }

      const notifications = await priceMonitor.checkPriceUpdates(propertyIds)

      res.json({
        data: notifications,
        message: 'Price check completed successfully'
      })
    } catch (error) {
      logger.error('Trigger price check error:', error)
      res.status(500).json({
        error: 'Failed to trigger price check'
      })
    }
  }

  // Export properties
  static exportValidation = [
    query('format').isIn(['pdf', 'csv', 'excel']).withMessage('Valid format is required'),
    body('properties').isArray().withMessage('Properties array is required'),
    body('includePhotos').optional().isBoolean(),
    body('includeNotes').optional().isBoolean(),
    body('includePriceHistory').optional().isBoolean()
  ]

  static async exportProperties(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const format = req.query.format as string
      const options = {
        format,
        properties: req.body.properties,
        includePhotos: req.body.includePhotos,
        includeNotes: req.body.includeNotes,
        includePriceHistory: req.body.includePriceHistory
      }

      // This would implement actual export functionality
      // For now, return a placeholder response
      res.json({
        data: {
          format,
          downloadUrl: '/api/properties/downloads/export.pdf',
          filename: `properties_export_${Date.now()}.${format}`,
          success: true
        },
        message: 'Export completed successfully'
      })
    } catch (error) {
      logger.error('Export properties error:', error)
      res.status(500).json({
        error: 'Failed to export properties'
      })
    }
  }
}