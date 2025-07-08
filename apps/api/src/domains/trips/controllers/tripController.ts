import { Request, Response } from 'express'
import { TripService } from '../services/tripService'
import { RouteOptimizationService } from '../services/routeOptimizationService'
import { WeatherService } from '../../weather/services/weatherService'
import { NotificationService } from '../../notifications/services/notificationService'
import { prisma } from '../../../lib/prisma'
import { body, param, query, validationResult } from 'express-validator'

const weatherService = new WeatherService()
const routeOptimizationService = new RouteOptimizationService()
const notificationService = new NotificationService()
const tripService = new TripService(
  prisma,
  weatherService,
  routeOptimizationService,
  notificationService
)

export class TripController {
  static createValidation = [
    body('name').notEmpty().withMessage('Trip name is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('tripType').optional().isIn(['relocation_exploration', 'vacation', 'business', 'adventure']),
    body('visibility').optional().isIn(['private', 'shared', 'public']),
    body('estimatedBudget').optional().isNumeric(),
    body('currency').optional().isLength({ min: 3, max: 3 })
  ]

  static async createTrip(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const trip = await tripService.createTrip(userId, req.body)

      res.status(201).json({
        data: trip,
        message: 'Trip created successfully'
      })
    } catch (error) {
      console.error('Create trip error:', error)
      res.status(500).json({
        error: 'Failed to create trip'
      })
    }
  }

  static updateValidation = [
    param('id').isUUID().withMessage('Valid trip ID is required'),
    body('name').optional().notEmpty(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('status').optional().isIn(['draft', 'planned', 'in_progress', 'completed', 'cancelled']),
    body('visibility').optional().isIn(['private', 'shared', 'public'])
  ]

  static async updateTrip(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const userId = req.user!.userId
      const trip = await tripService.updateTrip(id, userId, req.body)

      res.json({
        data: trip,
        message: 'Trip updated successfully'
      })
    } catch (error: any) {
      console.error('Update trip error:', error)
      if (error.message === 'Trip not found' || error.message.includes('Unauthorized')) {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to update trip'
      })
    }
  }

  static async deleteTrip(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.user!.userId
      await tripService.deleteTrip(id, userId)

      res.json({
        message: 'Trip deleted successfully'
      })
    } catch (error: any) {
      console.error('Delete trip error:', error)
      if (error.message === 'Trip not found' || error.message.includes('owner')) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to delete trip'
      })
    }
  }

  static async getTrip(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.user!.userId
      const trip = await tripService.getTripById(id, userId)

      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' })
      }

      res.json({ data: trip })
    } catch (error) {
      console.error('Get trip error:', error)
      res.status(500).json({
        error: 'Failed to get trip'
      })
    }
  }

  static listValidation = [
    query('status').optional().isIn(['draft', 'planned', 'in_progress', 'completed', 'cancelled']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('search').optional().isString()
  ]

  static async listTrips(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const filters = {
        status: req.query.status as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        search: req.query.search as string
      }

      const trips = await tripService.getUserTrips(userId, filters)

      res.json({
        data: trips,
        meta: {
          total: trips.length
        }
      })
    } catch (error) {
      console.error('List trips error:', error)
      res.status(500).json({
        error: 'Failed to list trips'
      })
    }
  }

  static addDestinationValidation = [
    param('id').isUUID().withMessage('Valid trip ID is required'),
    body('locationId').isUUID().withMessage('Valid location ID is required'),
    body('arrivalDate').isISO8601().withMessage('Valid arrival date is required'),
    body('departureDate').isISO8601().withMessage('Valid departure date is required'),
    body('dayOrder').isInt({ min: 1 }).withMessage('Valid day order is required')
  ]

  static async addDestination(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const userId = req.user!.userId
      const destination = await tripService.addDestination(id, userId, req.body)

      res.status(201).json({
        data: destination,
        message: 'Destination added successfully'
      })
    } catch (error: any) {
      console.error('Add destination error:', error)
      if (error.message === 'Trip not found' || error.message === 'Location not found') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to add destination'
      })
    }
  }

  static updateDestinationValidation = [
    param('destinationId').isUUID().withMessage('Valid destination ID is required'),
    body('arrivalDate').optional().isISO8601(),
    body('departureDate').optional().isISO8601(),
    body('dayOrder').optional().isInt({ min: 1 })
  ]

  static async updateDestination(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { destinationId } = req.params
      const userId = req.user!.userId
      const destination = await tripService.updateDestination(destinationId, userId, req.body)

      res.json({
        data: destination,
        message: 'Destination updated successfully'
      })
    } catch (error: any) {
      console.error('Update destination error:', error)
      if (error.message === 'Destination not found') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to update destination'
      })
    }
  }

  static async removeDestination(req: Request, res: Response) {
    try {
      const { destinationId } = req.params
      const userId = req.user!.userId
      await tripService.removeDestination(destinationId, userId)

      res.json({
        message: 'Destination removed successfully'
      })
    } catch (error: any) {
      console.error('Remove destination error:', error)
      if (error.message === 'Destination not found') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to remove destination'
      })
    }
  }

  static createRouteValidation = [
    param('id').isUUID().withMessage('Valid trip ID is required'),
    body('fromDestinationId').isUUID().withMessage('Valid from destination ID is required'),
    body('toDestinationId').isUUID().withMessage('Valid to destination ID is required'),
    body('transportMode').isIn(['car', 'train', 'flight', 'bus', 'walk', 'bike']).withMessage('Valid transport mode is required')
  ]

  static async createRoute(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const userId = req.user!.userId
      const segment = await tripService.createRouteSegment(id, userId, req.body)

      res.status(201).json({
        data: segment,
        message: 'Route segment created successfully'
      })
    } catch (error: any) {
      console.error('Create route error:', error)
      if (error.message === 'Trip not found') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to create route segment'
      })
    }
  }

  static optimizeRouteValidation = [
    param('id').isUUID().withMessage('Valid trip ID is required'),
    body('optimizeFor').isIn(['distance', 'time', 'cost', 'scenic']).withMessage('Valid optimization type is required'),
    body('avoidHighways').optional().isBoolean(),
    body('avoidTolls').optional().isBoolean(),
    body('maxDrivingHoursPerDay').optional().isInt({ min: 1, max: 24 })
  ]

  static async optimizeRoute(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const userId = req.user!.userId
      const optimizedTrip = await tripService.optimizeRoute(id, userId, req.body)

      res.json({
        data: optimizedTrip,
        message: 'Route optimized successfully'
      })
    } catch (error: any) {
      console.error('Optimize route error:', error)
      if (error.message === 'Trip not found') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to optimize route'
      })
    }
  }

  static addCollaboratorValidation = [
    param('id').isUUID().withMessage('Valid trip ID is required'),
    body('userId').isUUID().withMessage('Valid user ID is required'),
    body('role').isIn(['owner', 'editor', 'viewer']).withMessage('Valid role is required')
  ]

  static async addCollaborator(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const ownerId = req.user!.userId
      await tripService.addCollaborator(id, ownerId, req.body)

      res.status(201).json({
        message: 'Collaborator added successfully'
      })
    } catch (error: any) {
      console.error('Add collaborator error:', error)
      if (error.message === 'Trip not found') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('owner') || error.message.includes('already')) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to add collaborator'
      })
    }
  }
}