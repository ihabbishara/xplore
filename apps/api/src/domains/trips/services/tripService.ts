import { PrismaClient, Trip, TripDestination, RouteSegment, Prisma } from '@prisma/client'
import { 
  TripCreateInput, 
  TripUpdateInput, 
  TripDestinationInput,
  RouteSegmentInput,
  TripCollaboratorInput,
  TripAnalytics,
  OptimizationOptions
} from '../types/trip.types'
import { WeatherService } from '../../weather/services/weatherService'
import { RouteOptimizationService } from './routeOptimizationService'
import { NotificationService } from '../../notifications/services/notificationService'
import { redis } from '../../../lib/redis'

export class TripService {
  constructor(
    private prisma: PrismaClient,
    private weatherService: WeatherService,
    private routeOptimizationService: RouteOptimizationService,
    private notificationService: NotificationService
  ) {}

  async createTrip(userId: string, input: TripCreateInput): Promise<Trip> {
    const trip = await this.prisma.trip.create({
      data: {
        ...input,
        creatorId: userId,
        estimatedBudget: input.estimatedBudget ? new Prisma.Decimal(input.estimatedBudget) : undefined,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        analytics: {
          totalDistance: 0,
          countriesCount: 0,
          citiesCount: 0,
          activitiesCount: 0,
          estimatedDrivingTime: 0,
          weatherScore: 0
        }
      },
      include: {
        creator: true,
        destinations: {
          include: {
            location: true
          }
        },
        collaborators: true
      }
    })

    await this.invalidateTripCache(userId)
    
    return trip
  }

  async updateTrip(tripId: string, userId: string, input: TripUpdateInput): Promise<Trip> {
    const trip = await this.getTripById(tripId, userId)
    
    if (!trip) {
      throw new Error('Trip not found')
    }

    if (!this.canEditTrip(trip, userId)) {
      throw new Error('Unauthorized to edit this trip')
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        ...input,
        estimatedBudget: input.estimatedBudget ? new Prisma.Decimal(input.estimatedBudget) : undefined,
        actualBudget: input.actualBudget ? new Prisma.Decimal(input.actualBudget) : undefined,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined
      },
      include: {
        creator: true,
        destinations: {
          include: {
            location: true
          }
        },
        collaborators: true
      }
    })

    await this.invalidateTripCache(userId)
    await this.notifyCollaborators(tripId, userId, 'trip_updated', {
      tripName: updatedTrip.name,
      updatedBy: trip.creatorId === userId ? 'owner' : 'collaborator'
    })

    return updatedTrip
  }

  async deleteTrip(tripId: string, userId: string): Promise<void> {
    const trip = await this.getTripById(tripId, userId)
    
    if (!trip) {
      throw new Error('Trip not found')
    }

    if (trip.creatorId !== userId) {
      throw new Error('Only the trip owner can delete the trip')
    }

    await this.prisma.trip.delete({
      where: { id: tripId }
    })

    await this.invalidateTripCache(userId)
  }

  async getTripById(tripId: string, userId: string): Promise<Trip | null> {
    const cacheKey = `trip:${tripId}:${userId}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { creatorId: userId },
          { collaborators: { some: { userId } } },
          { visibility: 'public' }
        ]
      },
      include: {
        creator: {
          include: {
            profile: true
          }
        },
        destinations: {
          include: {
            location: true
          },
          orderBy: {
            dayOrder: 'asc'
          }
        },
        segments: {
          include: {
            fromDestination: {
              include: {
                location: true
              }
            }
          }
        },
        collaborators: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        weatherSummaries: {
          orderBy: {
            date: 'asc'
          }
        },
        checklists: true,
        journalEntries: {
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (trip) {
      await redis.setEx(cacheKey, 300, JSON.stringify(trip)) // Cache for 5 minutes
    }

    return trip
  }

  async getUserTrips(userId: string, filters?: {
    status?: string
    startDate?: Date
    endDate?: Date
    search?: string
  }): Promise<Trip[]> {
    const where: Prisma.TripWhereInput = {
      OR: [
        { creatorId: userId },
        { collaborators: { some: { userId } } }
      ]
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.startDate || filters?.endDate) {
      where.AND = []
      if (filters.startDate) {
        where.AND.push({ startDate: { gte: filters.startDate } })
      }
      if (filters.endDate) {
        where.AND.push({ endDate: { lte: filters.endDate } })
      }
    }

    if (filters?.search) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const trips = await this.prisma.trip.findMany({
      where,
      include: {
        creator: {
          include: {
            profile: true
          }
        },
        destinations: {
          include: {
            location: true
          }
        },
        _count: {
          select: {
            destinations: true,
            collaborators: true,
            journalEntries: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return trips
  }

  async addDestination(
    tripId: string, 
    userId: string, 
    input: TripDestinationInput
  ): Promise<TripDestination> {
    const trip = await this.getTripById(tripId, userId)
    
    if (!trip) {
      throw new Error('Trip not found')
    }

    if (!this.canEditTrip(trip, userId)) {
      throw new Error('Unauthorized to edit this trip')
    }

    // Verify location exists
    const location = await this.prisma.location.findUnique({
      where: { id: input.locationId }
    })

    if (!location) {
      throw new Error('Location not found')
    }

    // Create destination
    const destination = await this.prisma.tripDestination.create({
      data: {
        ...input,
        tripId,
        arrivalDate: new Date(input.arrivalDate),
        departureDate: new Date(input.departureDate)
      },
      include: {
        location: true
      }
    })

    // Update trip analytics
    await this.updateTripAnalytics(tripId)

    // Fetch weather for the destination
    await this.fetchDestinationWeather(destination.id)

    // Invalidate cache
    await this.invalidateTripCache(userId)

    return destination
  }

  async updateDestination(
    destinationId: string,
    userId: string,
    input: Partial<TripDestinationInput>
  ): Promise<TripDestination> {
    const destination = await this.prisma.tripDestination.findUnique({
      where: { id: destinationId },
      include: { trip: true }
    })

    if (!destination) {
      throw new Error('Destination not found')
    }

    const trip = await this.getTripById(destination.tripId, userId)
    if (!trip || !this.canEditTrip(trip, userId)) {
      throw new Error('Unauthorized to edit this destination')
    }

    const updatedDestination = await this.prisma.tripDestination.update({
      where: { id: destinationId },
      data: {
        ...input,
        arrivalDate: input.arrivalDate ? new Date(input.arrivalDate) : undefined,
        departureDate: input.departureDate ? new Date(input.departureDate) : undefined
      },
      include: {
        location: true
      }
    })

    // Update analytics and weather
    await this.updateTripAnalytics(destination.tripId)
    await this.fetchDestinationWeather(destinationId)
    await this.invalidateTripCache(userId)

    return updatedDestination
  }

  async removeDestination(destinationId: string, userId: string): Promise<void> {
    const destination = await this.prisma.tripDestination.findUnique({
      where: { id: destinationId },
      include: { trip: true }
    })

    if (!destination) {
      throw new Error('Destination not found')
    }

    const trip = await this.getTripById(destination.tripId, userId)
    if (!trip || !this.canEditTrip(trip, userId)) {
      throw new Error('Unauthorized to remove this destination')
    }

    // Delete associated route segments
    await this.prisma.routeSegment.deleteMany({
      where: {
        OR: [
          { fromDestinationId: destinationId },
          { toDestinationId: destinationId }
        ]
      }
    })

    await this.prisma.tripDestination.delete({
      where: { id: destinationId }
    })

    // Reorder remaining destinations
    await this.reorderDestinations(destination.tripId)
    await this.updateTripAnalytics(destination.tripId)
    await this.invalidateTripCache(userId)
  }

  async createRouteSegment(
    tripId: string,
    userId: string,
    input: RouteSegmentInput
  ): Promise<RouteSegment> {
    const trip = await this.getTripById(tripId, userId)
    
    if (!trip) {
      throw new Error('Trip not found')
    }

    if (!this.canEditTrip(trip, userId)) {
      throw new Error('Unauthorized to edit this trip')
    }

    // Calculate route details using optimization service
    const routeDetails = await this.routeOptimizationService.calculateRoute(
      input.fromDestinationId,
      input.toDestinationId,
      input.transportMode
    )

    const segment = await this.prisma.routeSegment.create({
      data: {
        ...input,
        tripId,
        distance: routeDetails.distance ? new Prisma.Decimal(routeDetails.distance) : undefined,
        duration: routeDetails.duration,
        cost: input.cost ? new Prisma.Decimal(input.cost) : undefined,
        polyline: routeDetails.polyline,
        waypoints: routeDetails.waypoints,
        departureTime: input.departureTime ? new Date(input.departureTime) : undefined,
        arrivalTime: input.arrivalTime ? new Date(input.arrivalTime) : undefined
      },
      include: {
        fromDestination: {
          include: {
            location: true
          }
        }
      }
    })

    await this.updateTripAnalytics(tripId)
    await this.invalidateTripCache(userId)

    return segment
  }

  async optimizeRoute(
    tripId: string,
    userId: string,
    options: OptimizationOptions
  ): Promise<Trip> {
    const trip = await this.getTripById(tripId, userId)
    
    if (!trip) {
      throw new Error('Trip not found')
    }

    if (!this.canEditTrip(trip, userId)) {
      throw new Error('Unauthorized to optimize this trip')
    }

    // Get optimized route from optimization service
    const optimizedRoute = await this.routeOptimizationService.optimizeTrip(
      trip,
      options
    )

    // Update destinations order and segments
    await this.prisma.$transaction(async (tx) => {
      // Update destination order
      for (const dest of optimizedRoute.destinations) {
        await tx.tripDestination.update({
          where: { id: dest.id },
          data: { dayOrder: dest.dayOrder }
        })
      }

      // Delete existing segments
      await tx.routeSegment.deleteMany({
        where: { tripId }
      })

      // Create new optimized segments
      for (const segment of optimizedRoute.segments) {
        await tx.routeSegment.create({
          data: {
            ...segment,
            tripId,
            distance: segment.distance ? new Prisma.Decimal(segment.distance) : undefined,
            cost: segment.cost ? new Prisma.Decimal(segment.cost) : undefined
          }
        })
      }
    })

    const optimizedTrip = await this.getTripById(tripId, userId)
    await this.invalidateTripCache(userId)

    return optimizedTrip!
  }

  async addCollaborator(
    tripId: string,
    ownerId: string,
    input: TripCollaboratorInput
  ): Promise<void> {
    const trip = await this.getTripById(tripId, ownerId)
    
    if (!trip) {
      throw new Error('Trip not found')
    }

    if (trip.creatorId !== ownerId) {
      throw new Error('Only the trip owner can add collaborators')
    }

    // Check if user is already a collaborator
    const existing = await this.prisma.tripCollaborator.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId: input.userId
        }
      }
    })

    if (existing) {
      throw new Error('User is already a collaborator')
    }

    await this.prisma.tripCollaborator.create({
      data: {
        tripId,
        userId: input.userId,
        role: input.role,
        permissions: input.permissions || {},
        invitedBy: ownerId,
        invitedAt: new Date()
      }
    })

    // Send notification to invited user
    await this.notificationService.sendNotification(input.userId, {
      type: 'trip_invitation',
      title: 'Trip Invitation',
      message: `You've been invited to collaborate on "${trip.name}"`,
      data: { tripId, role: input.role }
    })
  }

  async updateTripAnalytics(tripId: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        destinations: {
          include: {
            location: true
          }
        },
        segments: true
      }
    })

    if (!trip) return

    const analytics: TripAnalytics = {
      totalDistance: trip.segments.reduce((sum, s) => 
        sum + (s.distance?.toNumber() || 0), 0
      ),
      countriesCount: new Set(trip.destinations.map(d => d.location.country)).size,
      citiesCount: new Set(trip.destinations.map(d => d.location.city)).size,
      activitiesCount: trip.destinations.reduce((sum, d) => 
        sum + ((d.activities as any[])?.length || 0), 0
      ),
      estimatedDrivingTime: trip.segments
        .filter(s => s.transportMode === 'car')
        .reduce((sum, s) => sum + (s.duration || 0), 0),
      weatherScore: 0 // Will be calculated by weather service
    }

    if (trip.estimatedBudget && trip.actualBudget) {
      analytics.budgetUtilization = 
        (trip.actualBudget.toNumber() / trip.estimatedBudget.toNumber()) * 100
    }

    await this.prisma.trip.update({
      where: { id: tripId },
      data: { analytics: analytics as any }
    })
  }

  private async fetchDestinationWeather(destinationId: string): Promise<void> {
    const destination = await this.prisma.tripDestination.findUnique({
      where: { id: destinationId },
      include: { location: true }
    })

    if (!destination) return

    const weather = await this.weatherService.getWeatherForDateRange(
      destination.location.latitude,
      destination.location.longitude,
      destination.arrivalDate,
      destination.departureDate
    )

    await this.prisma.tripDestination.update({
      where: { id: destinationId },
      data: { weather: weather as any }
    })
  }

  private async reorderDestinations(tripId: string): Promise<void> {
    const destinations = await this.prisma.tripDestination.findMany({
      where: { tripId },
      orderBy: { dayOrder: 'asc' }
    })

    await this.prisma.$transaction(
      destinations.map((dest, index) =>
        this.prisma.tripDestination.update({
          where: { id: dest.id },
          data: { dayOrder: index + 1 }
        })
      )
    )
  }

  private canEditTrip(trip: any, userId: string): boolean {
    if (trip.creatorId === userId) return true
    
    const collaborator = trip.collaborators?.find((c: any) => c.userId === userId)
    return collaborator?.role === 'editor' || collaborator?.role === 'owner'
  }

  private async invalidateTripCache(userId: string): Promise<void> {
    const keys = await redis.keys(`trip:*:${userId}`)
    if (keys.length > 0) {
      await redis.del(keys)
    }
  }

  private async notifyCollaborators(
    tripId: string,
    excludeUserId: string,
    type: string,
    data: any
  ): Promise<void> {
    const collaborators = await this.prisma.tripCollaborator.findMany({
      where: {
        tripId,
        userId: { not: excludeUserId }
      }
    })

    for (const collaborator of collaborators) {
      await this.notificationService.sendNotification(collaborator.userId, {
        type,
        title: data.title || 'Trip Update',
        message: data.message || 'The trip has been updated',
        data: { tripId, ...data }
      })
    }
  }
}