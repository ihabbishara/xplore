import { prisma } from '../prisma';
import { cache, cacheConfigs } from '../cache/strategy';
import { Prisma } from '@prisma/client';

/**
 * Optimized query patterns for common operations
 */

// Optimized user queries with selective fields
export const userQueries = {
  // Get user with profile - only select needed fields
  async getUserWithProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            currentLocation: true,
            targetCountries: true,
            userType: true,
          },
        },
      },
    });
  },

  // Get user's saved locations with pagination
  async getUserSavedLocations(userId: string, cursor?: string, limit = 20) {
    return prisma.userSavedLocation.findMany({
      where: { userId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { savedAt: 'desc' },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
  },
};

// Optimized location queries with caching
export const locationQueries = {
  // Search locations with full-text search
  async searchLocations(query: string, limit = 10) {
    const cacheKey = cache.generateKey('location:search', { query, limit });
    
    return cache.cacheAside(
      cacheKey,
      async () => {
        return prisma.$queryRaw<any[]>`
          SELECT 
            id, name, city, country, latitude, longitude,
            ts_rank(to_tsvector('english', name || ' ' || COALESCE(city, '') || ' ' || COALESCE(country, '')), 
                   plainto_tsquery('english', ${query})) as rank
          FROM locations
          WHERE to_tsvector('english', name || ' ' || COALESCE(city, '') || ' ' || COALESCE(country, '')) 
                @@ plainto_tsquery('english', ${query})
          ORDER BY rank DESC
          LIMIT ${limit}
        `;
      },
      cacheConfigs.medium
    );
  },

  // Get popular locations with analytics
  async getPopularLocations(limit = 20) {
    return cache.cacheAside(
      'locations:popular',
      async () => {
        return prisma.location.findMany({
          take: limit,
          orderBy: {
            savedByUsers: {
              _count: 'desc',
            },
          },
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            latitude: true,
            longitude: true,
            _count: {
              select: {
                savedByUsers: true,
                journalEntries: true,
              },
            },
          },
        });
      },
      cacheConfigs.long
    );
  },

  // Get locations near coordinates
  async getNearbyLocations(lat: number, lng: number, radiusKm = 50, limit = 20) {
    const cacheKey = cache.generateKey('locations:nearby', { lat, lng, radiusKm });
    
    return cache.cacheAside(
      cacheKey,
      async () => {
        // Using PostGIS for spatial queries
        return prisma.$queryRaw<any[]>`
          SELECT 
            id, name, city, country, latitude, longitude,
            ST_Distance(
              ST_MakePoint(longitude, latitude)::geography,
              ST_MakePoint(${lng}, ${lat})::geography
            ) / 1000 as distance_km
          FROM locations
          WHERE ST_DWithin(
            ST_MakePoint(longitude, latitude)::geography,
            ST_MakePoint(${lng}, ${lat})::geography,
            ${radiusKm * 1000}
          )
          ORDER BY distance_km
          LIMIT ${limit}
        `;
      },
      cacheConfigs.medium
    );
  },
};

// Optimized trip queries with efficient loading
export const tripQueries = {
  // Get user trips with minimal data for listing
  async getUserTrips(userId: string, status?: string[]) {
    return prisma.trip.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            collaborators: {
              some: {
                userId,
                acceptedAt: { not: null },
              },
            },
          },
        ],
        ...(status && { status: { in: status } }),
      },
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        coverImageUrl: true,
        _count: {
          select: {
            destinations: true,
          },
        },
      },
    });
  },

  // Get trip details with related data
  async getTripDetails(tripId: string) {
    return cache.cacheAside(
      `trip:details:${tripId}`,
      async () => {
        return prisma.trip.findUnique({
          where: { id: tripId },
          include: {
            creator: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            destinations: {
              orderBy: { dayOrder: 'asc' },
              include: {
                location: true,
              },
            },
            collaborators: {
              where: { acceptedAt: { not: null } },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      },
      cacheConfigs.trip(tripId)
    );
  },
};

// Optimized journal queries
export const journalQueries = {
  // Get journal entries with pagination and filtering
  async getJournalEntries(filters: {
    userId?: string;
    tripId?: string;
    locationId?: string;
    tags?: string[];
    cursor?: string;
    limit?: number;
  }) {
    const { userId, tripId, locationId, tags, cursor, limit = 20 } = filters;

    return prisma.journalEntry.findMany({
      where: {
        ...(userId && { userId }),
        ...(tripId && { tripId }),
        ...(locationId && { locationId }),
        ...(tags && tags.length > 0 && {
          tags: { hasSome: tags },
        }),
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
        media: {
          select: {
            id: true,
            mediaType: true,
            filePath: true,
            thumbnailPath: true,
            caption: true,
          },
          orderBy: { orderIndex: 'asc' },
          take: 3, // Limit media items for list view
        },
        _count: {
          select: {
            media: true,
          },
        },
      },
    });
  },
};

// Batch loading utilities
export const batchLoaders = {
  // Batch load user profiles
  async loadUserProfiles(userIds: string[]) {
    const profiles = await prisma.userProfile.findMany({
      where: { userId: { in: userIds } },
    });
    
    return new Map(profiles.map(p => [p.userId, p]));
  },

  // Batch load location analytics
  async loadLocationAnalytics(locationIds: string[]) {
    const analytics = await prisma.locationAnalytics.findMany({
      where: { locationId: { in: locationIds } },
    });
    
    return new Map(analytics.map(a => [a.locationId, a]));
  },

  // Batch load weather data
  async loadWeatherData(locationIds: string[], date: Date) {
    const weather = await prisma.weatherData.findMany({
      where: {
        locationId: { in: locationIds },
        forecastTime: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['locationId'],
    });
    
    return new Map(weather.map(w => [w.locationId, w]));
  },
};

// Transaction patterns for complex operations
export const transactionPatterns = {
  // Create trip with destinations
  async createTripWithDestinations(
    tripData: Prisma.TripCreateInput,
    destinations: Array<Omit<Prisma.TripDestinationCreateInput, 'trip'>>
  ) {
    return prisma.$transaction(async (tx) => {
      // Create trip
      const trip = await tx.trip.create({
        data: tripData,
      });

      // Create destinations
      await tx.tripDestination.createMany({
        data: destinations.map(dest => ({
          ...dest,
          tripId: trip.id,
        })),
      });

      // Invalidate related caches
      await cache.invalidateByTags([`user:${tripData.creator.connect?.id}`]);

      return trip;
    });
  },

  // Update property with price history
  async updatePropertyWithHistory(
    propertyId: string,
    updates: Prisma.PropertyUpdateInput,
    newPrice?: number
  ) {
    return prisma.$transaction(async (tx) => {
      // Get current property
      const current = await tx.property.findUnique({
        where: { id: propertyId },
        select: { price: true },
      });

      // Update property
      const updated = await tx.property.update({
        where: { id: propertyId },
        data: updates,
      });

      // Add price history if price changed
      if (newPrice && current?.price && current.price !== newPrice) {
        await tx.propertyPriceHistory.create({
          data: {
            propertyId,
            price: newPrice,
            priceChangePercentage: ((newPrice - Number(current.price)) / Number(current.price)) * 100,
          },
        });
      }

      return updated;
    });
  },
};

// Export optimized query builder
export function buildOptimizedQuery<T extends keyof typeof prisma>(
  model: T,
  options: {
    select?: any;
    include?: any;
    where?: any;
    orderBy?: any;
    take?: number;
    skip?: number;
  }
) {
  // Ensure we're not over-fetching data
  if (options.include && options.select) {
    throw new Error('Cannot use both include and select in the same query');
  }

  // Add default limits to prevent memory issues
  if (!options.take) {
    options.take = 100;
  }

  return (prisma[model] as any).findMany(options);
}