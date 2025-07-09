import { LocationService } from '../locationService'
import { prisma } from '@/lib/prisma'
import { redisWrapper } from '@/lib/redis-wrapper'
import axios from 'axios'
import {
  AppError,
  NotFoundError,
  ValidationError,
} from '@/shared/utils/errors'
import { createMockLocation, createMockSavedLocation } from '@/test/factories/locationFactory'
import { LocationType } from '@xplore/shared'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    location: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userSavedLocation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/redis-wrapper', () => ({
  redisWrapper: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
}))

jest.mock('axios')
jest.mock('@/shared/utils/logger')

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up environment variable
    process.env.MAPBOX_ACCESS_TOKEN = 'test-token'
  })

  describe('search', () => {
    const searchParams = {
      query: 'Paris',
      types: ['place'] as ('country' | 'region' | 'place')[],
      limit: 5,
    }

    const mockMapboxResponse = {
      data: {
        features: [
          {
            id: 'place.123',
            text: 'Paris',
            place_name: 'Paris, France',
            center: [2.3522, 48.8566],
            place_type: ['place'],
            context: [
              { id: 'country.456', text: 'France' },
              { id: 'region.789', text: 'Île-de-France' },
            ],
          },
        ],
      },
    }

    it('should return cached results if available', async () => {
      const cachedResults = JSON.stringify([
        {
          id: 'place.123',
          placeId: 'place.123',
          name: 'Paris',
          country: 'France',
          city: undefined,
          region: 'Île-de-France',
          address: 'Paris, France',
          coordinates: { lat: 48.8566, lng: 2.3522 },
          type: 'city',
        },
      ])

      ;(redisWrapper.get as jest.Mock).mockResolvedValue(cachedResults)

      const results = await LocationService.search(searchParams)

      expect(results).toEqual(JSON.parse(cachedResults))
      expect(axios.get).not.toHaveBeenCalled()
    })

    it('should fetch from Mapbox API if not cached', async () => {
      ;(redisWrapper.get as jest.Mock).mockResolvedValue(null)
      ;(axios.get as jest.Mock).mockResolvedValue(mockMapboxResponse)
      ;(redisWrapper.setex as jest.Mock).mockResolvedValue('OK')

      const results = await LocationService.search(searchParams)

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('Paris.json'),
        expect.objectContaining({
          params: expect.objectContaining({
            access_token: 'test-token',
            types: 'place',
            limit: 5,
            language: 'en',
          }),
        })
      )

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        name: 'Paris',
        country: 'France',
        type: 'city',
      })

      expect(redisWrapper.setex).toHaveBeenCalled()
    })

    it('should throw AppError if Mapbox token not configured', async () => {
      delete process.env.MAPBOX_ACCESS_TOKEN

      await expect(LocationService.search(searchParams)).rejects.toThrow(AppError)
      await expect(LocationService.search(searchParams)).rejects.toThrow(
        'Mapbox API token not configured'
      )
    })

    it('should handle Mapbox API errors', async () => {
      ;(redisWrapper.get as jest.Mock).mockResolvedValue(null)
      ;(axios.get as jest.Mock).mockRejectedValue(new Error('API Error'))

      await expect(LocationService.search(searchParams)).rejects.toThrow(AppError)
      await expect(LocationService.search(searchParams)).rejects.toThrow(
        'Failed to search locations'
      )
    })
  })

  describe('reverseGeocode', () => {
    const lat = 48.8566
    const lng = 2.3522

    const mockMapboxResponse = {
      data: {
        features: [
          {
            id: 'place.123',
            text: 'Paris',
            place_name: 'Paris, France',
            place_type: ['place'],
            context: [
              { id: 'country.456', text: 'France' },
              { id: 'region.789', text: 'Île-de-France' },
            ],
          },
        ],
      },
    }

    it('should return cached result if available', async () => {
      const cachedResult = JSON.stringify({
        id: 'place.123',
        placeId: 'place.123',
        name: 'Paris',
        country: 'France',
        city: undefined,
        region: 'Île-de-France',
        address: 'Paris, France',
        coordinates: { lat, lng },
        type: 'city',
      })

      ;(redisWrapper.get as jest.Mock).mockResolvedValue(cachedResult)

      const result = await LocationService.reverseGeocode(lat, lng)

      expect(result).toEqual(JSON.parse(cachedResult))
      expect(axios.get).not.toHaveBeenCalled()
    })

    it('should fetch from Mapbox API if not cached', async () => {
      ;(redisWrapper.get as jest.Mock).mockResolvedValue(null)
      ;(axios.get as jest.Mock).mockResolvedValue(mockMapboxResponse)
      ;(redisWrapper.setex as jest.Mock).mockResolvedValue('OK')

      const result = await LocationService.reverseGeocode(lat, lng)

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`${lng},${lat}.json`),
        expect.objectContaining({
          params: expect.objectContaining({
            access_token: 'test-token',
            types: 'place,locality,region,country',
            limit: 1,
          }),
        })
      )

      expect(result).toMatchObject({
        name: 'Paris',
        country: 'France',
        type: 'city',
      })
    })

    it('should return null if no features found', async () => {
      ;(redisWrapper.get as jest.Mock).mockResolvedValue(null)
      ;(axios.get as jest.Mock).mockResolvedValue({ data: { features: [] } })

      const result = await LocationService.reverseGeocode(lat, lng)

      expect(result).toBeNull()
    })
  })

  describe('saveLocation', () => {
    const userId = 'user-1'
    const saveLocationData = {
      placeId: 'place.123',
      name: 'Paris',
      country: 'France',
      city: 'Paris',
      region: 'Île-de-France',
      address: 'Paris, France',
      latitude: 48.8566,
      longitude: 2.3522,
      placeType: 'city' as LocationType,
      personalNotes: 'Want to visit the Eiffel Tower',
      customTags: ['romantic', 'culture'],
      rating: 5,
    }

    it('should create new location and save it', async () => {
      const mockLocation = createMockLocation({
        placeId: saveLocationData.placeId,
        name: saveLocationData.name,
      })
      const mockSavedLocation = createMockSavedLocation(userId, mockLocation.id)

      ;(prisma.location.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.location.create as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.userSavedLocation.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.userSavedLocation.create as jest.Mock).mockResolvedValue({
        ...mockSavedLocation,
        location: mockLocation,
      })

      const result = await LocationService.saveLocation(userId, saveLocationData)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          placeId: saveLocationData.placeId,
          name: saveLocationData.name,
          country: saveLocationData.country,
        }),
      })

      expect(prisma.userSavedLocation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          locationId: mockLocation.id,
          personalNotes: saveLocationData.personalNotes,
          customTags: saveLocationData.customTags,
          rating: saveLocationData.rating,
        }),
        include: { location: true },
      })

      expect(result).toHaveProperty('location')
      expect(result.location.name).toBe(saveLocationData.name)
    })

    it('should use existing location if already in database', async () => {
      const mockLocation = createMockLocation({
        placeId: saveLocationData.placeId,
        name: saveLocationData.name,
      })
      const mockSavedLocation = createMockSavedLocation(userId, mockLocation.id)

      ;(prisma.location.findUnique as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.userSavedLocation.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.userSavedLocation.create as jest.Mock).mockResolvedValue({
        ...mockSavedLocation,
        location: mockLocation,
      })

      await LocationService.saveLocation(userId, saveLocationData)

      expect(prisma.location.create).not.toHaveBeenCalled()
      expect(prisma.userSavedLocation.create).toHaveBeenCalled()
    })

    it('should throw ValidationError if location already saved', async () => {
      const mockLocation = createMockLocation({
        placeId: saveLocationData.placeId,
      })
      const mockSavedLocation = createMockSavedLocation(userId, mockLocation.id)

      ;(prisma.location.findUnique as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.userSavedLocation.findUnique as jest.Mock).mockResolvedValue(
        mockSavedLocation
      )

      await expect(
        LocationService.saveLocation(userId, saveLocationData)
      ).rejects.toThrow(ValidationError)
      await expect(
        LocationService.saveLocation(userId, saveLocationData)
      ).rejects.toThrow('Location already saved to wishlist')
    })
  })

  describe('removeLocation', () => {
    const userId = 'user-1'
    const locationId = 'location-1'

    it('should successfully remove saved location', async () => {
      ;(prisma.userSavedLocation.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      })

      await LocationService.removeLocation(userId, locationId)

      expect(prisma.userSavedLocation.deleteMany).toHaveBeenCalledWith({
        where: { userId, locationId },
      })
    })

    it('should throw NotFoundError if location not found', async () => {
      ;(prisma.userSavedLocation.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      })

      await expect(
        LocationService.removeLocation(userId, locationId)
      ).rejects.toThrow(NotFoundError)
      await expect(
        LocationService.removeLocation(userId, locationId)
      ).rejects.toThrow('Saved location not found')
    })
  })

  describe('getSavedLocations', () => {
    const userId = 'user-1'
    const query = {
      tags: ['romantic'],
      minRating: 4,
      favorites: true,
      sortBy: 'rating' as const,
      sortOrder: 'desc' as const,
      page: 1,
      limit: 10,
    }

    it('should return filtered and sorted saved locations', async () => {
      const mockLocation = createMockLocation()
      const mockSavedLocations = [
        {
          ...createMockSavedLocation(userId, mockLocation.id),
          location: mockLocation,
        },
      ]

      ;(prisma.userSavedLocation.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.userSavedLocation.findMany as jest.Mock).mockResolvedValue(
        mockSavedLocations
      )

      const result = await LocationService.getSavedLocations(userId, query)

      expect(prisma.userSavedLocation.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          customTags: { hasSome: query.tags },
          rating: { gte: query.minRating },
          isFavorite: query.favorites,
        },
        orderBy: { rating: query.sortOrder },
        skip: 0,
        take: query.limit,
        include: { location: true },
      })

      expect(result.total).toBe(1)
      expect(result.locations).toHaveLength(1)
    })

    it('should handle empty query parameters', async () => {
      ;(prisma.userSavedLocation.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.userSavedLocation.findMany as jest.Mock).mockResolvedValue([])

      const result = await LocationService.getSavedLocations(userId, {})

      expect(prisma.userSavedLocation.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { savedAt: 'desc' },
        skip: 0,
        take: 20,
        include: { location: true },
      })

      expect(result.total).toBe(0)
      expect(result.locations).toHaveLength(0)
    })
  })

  describe('getMapViewLocations', () => {
    const userId = 'user-1'

    it('should return locations formatted for map view', async () => {
      const mockLocation = createMockLocation({
        latitude: 48.8566,
        longitude: 2.3522,
      })
      const mockSavedLocation = {
        ...createMockSavedLocation(userId, mockLocation.id, {
          isFavorite: true,
          rating: 5,
        }),
        location: mockLocation,
      }

      ;(prisma.userSavedLocation.findMany as jest.Mock).mockResolvedValue([
        mockSavedLocation,
      ])

      const result = await LocationService.getMapViewLocations(userId)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: mockLocation.id,
        coordinates: {
          lat: mockLocation.latitude,
          lng: mockLocation.longitude,
        },
        name: mockLocation.name,
        type: mockLocation.placeType,
        isFavorite: true,
        rating: 5,
      })
    })
  })
})