import axios from 'axios';
import { redisWrapper } from '@/lib/redis-wrapper';
import { prisma, cache, cacheConfigs, Cacheable, InvalidateCache } from '@/lib/prisma';
// import { locationQueries, batchLoaders } from '@/lib/database/optimizations';
import { Prisma } from '@prisma/client';
import { 
  LocationSearchResult, 
  LocationSearchRequest,
  SaveLocationRequest,
  UpdateSavedLocationRequest,
  SavedLocationsQuery,
  SavedLocation,
  LocationType,
  BatchSaveLocationsRequest,
  MapViewLocation
} from '@xplore/shared';
import { logger } from '@/shared/utils/logger';
import { AppError, NotFoundError, ValidationError } from '@/shared/utils/errors';

export class LocationService {
  private static MAPBOX_API_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  private static MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  private static CACHE_TTL = 3600; // 1 hour in seconds

  static async search(params: LocationSearchRequest): Promise<LocationSearchResult[]> {
    const { query, types = ['country', 'region', 'place'], limit = 10 } = params;

    if (!this.MAPBOX_TOKEN) {
      throw new AppError('Mapbox API token not configured', 500);
    }

    // First, try database search with full-text search
    // const dbResults = await locationQueries.searchLocations(query, limit);
    // if (dbResults.length >= limit) {
    //   return dbResults.map((loc: any) => ({
    //     id: loc.id,
    //     placeId: loc.id,
    //     name: loc.name,
    //     country: loc.country || '',
    //     city: loc.city,
    //     region: '',
    //     address: `${loc.city || ''}, ${loc.country || ''}`,
    //     coordinates: { lat: loc.latitude, lng: loc.longitude },
    //     type: 'city' as LocationType,
    //   }));
    // }

    // Use optimized cache
    const cacheKey = cache.generateKey('location:search', { query, types, limit });
    const cached = await cache.get<LocationSearchResult[]>(cacheKey);
    
    if (cached) {
      logger.debug(`Location search cache hit for: ${query}`);
      return cached;
    }

    try {
      // Make request to Mapbox
      const response = await axios.get(`${this.MAPBOX_API_URL}/${encodeURIComponent(query)}.json`, {
        params: {
          access_token: this.MAPBOX_TOKEN,
          types: types.join(','),
          limit,
          language: 'en',
        },
      });

      // Transform Mapbox response to our format
      const results: LocationSearchResult[] = response.data.features.map((feature: any) => {
        const [lng, lat] = feature.center;
        const context = this.parseContext(feature.context || []);
        
        return {
          id: feature.id,
          placeId: feature.id,
          name: feature.text,
          country: context.country || feature.text,
          city: context.place || context.locality,
          region: context.region,
          address: feature.place_name,
          coordinates: { lat, lng },
          type: this.mapPlaceType(feature.place_type[0]),
        };
      });

      // Cache results with optimized strategy
      await cache.set(cacheKey, results, cacheConfigs.medium);
      
      logger.info(`Location search completed for: ${query}, found ${results.length} results`);
      return results;
    } catch (error) {
      logger.error('Mapbox API error:', error);
      throw new AppError('Failed to search locations', 500);
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<LocationSearchResult | null> {
    if (!this.MAPBOX_TOKEN) {
      throw new AppError('Mapbox API token not configured', 500);
    }

    // Try finding nearby location in database first
    // const nearbyLocations = await locationQueries.getNearbyLocations(lat, lng, 1, 1);
    // if (nearbyLocations.length > 0 && nearbyLocations[0].distance_km < 0.1) {
    //   const loc = nearbyLocations[0];
    //   return {
    //     id: loc.id,
    //     placeId: loc.id,
    //     name: loc.name,
    //     country: loc.country || '',
    //     city: loc.city,
    //     region: '',
    //     address: `${loc.city || ''}, ${loc.country || ''}`,
    //     coordinates: { lat: loc.latitude, lng: loc.longitude },
    //     type: 'city' as LocationType,
    //   };
    // }

    const cacheKey = cache.generateKey('location:reverse', { lat, lng });
    const cached = await cache.get<LocationSearchResult>(cacheKey);
    
    if (cached) {
      logger.debug(`Reverse geocode cache hit for: ${lat},${lng}`);
      return cached;
    }

    try {
      const response = await axios.get(`${this.MAPBOX_API_URL}/${lng},${lat}.json`, {
        params: {
          access_token: this.MAPBOX_TOKEN,
          types: 'place,locality,region,country',
          limit: 1,
        },
      });

      if (response.data.features.length === 0) {
        return null;
      }

      const feature = response.data.features[0];
      const context = this.parseContext(feature.context || []);
      
      const result: LocationSearchResult = {
        id: feature.id,
        placeId: feature.id,
        name: feature.text,
        country: context.country || feature.text,
        city: context.place || context.locality,
        region: context.region,
        address: feature.place_name,
        coordinates: { lat, lng },
        type: this.mapPlaceType(feature.place_type[0]),
      };

      // Cache result with optimized strategy
      await cache.set(cacheKey, result, cacheConfigs.medium);
      
      return result;
    } catch (error) {
      logger.error('Mapbox reverse geocode error:', error);
      throw new AppError('Failed to reverse geocode location', 500);
    }
  }

  private static parseContext(context: any[]): Record<string, string> {
    const result: Record<string, string> = {};
    
    context.forEach((item) => {
      if (item.id.startsWith('country')) {
        result.country = item.text;
      } else if (item.id.startsWith('region')) {
        result.region = item.text;
      } else if (item.id.startsWith('place')) {
        result.place = item.text;
      } else if (item.id.startsWith('locality')) {
        result.locality = item.text;
      }
    });
    
    return result;
  }

  private static mapPlaceType(mapboxType: string): LocationType {
    switch (mapboxType) {
      case 'country':
        return 'country';
      case 'place':
      case 'locality':
        return 'city';
      case 'region':
        return 'region';
      case 'poi':
        return 'poi';
      case 'address':
        return 'address';
      default:
        return 'poi';
    }
  }

  // @Cacheable(cacheConfigs.long)
  static async getPopularDestinations(): Promise<LocationSearchResult[]> {
    // Predefined popular destinations for exploration
    const destinations = [
      { query: 'Paris, France', lat: 48.8566, lng: 2.3522 },
      { query: 'Barcelona, Spain', lat: 41.3851, lng: 2.1734 },
      { query: 'Lisbon, Portugal', lat: 38.7223, lng: -9.1393 },
      { query: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 },
      { query: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041 },
      { query: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
      { query: 'Bali, Indonesia', lat: -8.3405, lng: 115.0920 },
      { query: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
    ];

    const results: LocationSearchResult[] = [];
    
    for (const dest of destinations) {
      const result = await this.reverseGeocode(dest.lat, dest.lng);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  // Wishlist Management Methods

  // @InvalidateCache(['locations:popular'])
  static async saveLocation(userId: string, data: SaveLocationRequest): Promise<SavedLocation> {
    try {
      // First, find or create the location
      let location = await prisma.location.findUnique({
        where: { placeId: data.placeId },
      });

      if (!location) {
        location = await prisma.location.create({
          data: {
            placeId: data.placeId,
            name: data.name,
            country: data.country,
            city: data.city,
            region: data.region,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            placeType: data.placeType,
            metadata: data.metadata || Prisma.JsonNull,
          },
        });
      }

      // Check if already saved
      const existingSave = await prisma.userSavedLocation.findUnique({
        where: {
          userId_locationId: {
            userId,
            locationId: location.id,
          },
        },
      });

      if (existingSave) {
        throw new ValidationError('Location already saved to wishlist');
      }

      // Create saved location
      const savedLocation = await prisma.userSavedLocation.create({
        data: {
          userId,
          locationId: location.id,
          personalNotes: data.personalNotes,
          customTags: data.customTags || [],
          rating: data.rating,
        },
        include: {
          location: true,
        },
      });

      // Invalidate user-specific cache
      await cache.invalidateByTags([`user:${userId}`]);

      return this.formatSavedLocation(savedLocation);
    } catch (error) {
      logger.error('Error saving location:', error);
      throw error;
    }
  }

  static async removeLocation(userId: string, locationId: string): Promise<void> {
    const deleted = await prisma.userSavedLocation.deleteMany({
      where: {
        userId,
        locationId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundError('Saved location not found');
    }

    // Invalidate user-specific cache
    await cache.invalidateByTags([`user:${userId}`]);
  }

  static async updateSavedLocation(
    userId: string,
    locationId: string,
    data: UpdateSavedLocationRequest
  ): Promise<SavedLocation> {
    const savedLocation = await prisma.userSavedLocation.update({
      where: {
        userId_locationId: {
          userId,
          locationId,
        },
      },
      data: {
        personalNotes: data.personalNotes,
        customTags: data.customTags,
        rating: data.rating,
        isFavorite: data.isFavorite,
      },
      include: {
        location: true,
      },
    });

    // Invalidate user-specific cache
    await cache.invalidateByTags([`user:${userId}`, `location:${locationId}`]);

    return this.formatSavedLocation(savedLocation);
  }

  static async getSavedLocations(
    userId: string,
    query: SavedLocationsQuery
  ): Promise<{ locations: SavedLocation[]; total: number }> {
    const {
      tags,
      minRating,
      favorites,
      sortBy = 'savedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    // Generate cache key for this specific query
    const cacheKey = cache.generateKey(
      `user:${userId}:saved-locations`,
      { tags, minRating, favorites, sortBy, sortOrder, page, limit }
    );

    return cache.cacheAside(
      cacheKey,
      async () => {
        // Build where clause
        const where: any = { userId };

        if (tags && tags.length > 0) {
          where.customTags = { hasSome: tags };
        }

        if (minRating) {
          where.rating = { gte: minRating };
        }

        if (favorites !== undefined) {
          where.isFavorite = favorites;
        }

        // Get total count
        const total = await prisma.userSavedLocation.count({ where });

        // Build order by
        const orderBy: any = {};
        switch (sortBy) {
          case 'savedAt':
            orderBy.savedAt = sortOrder;
            break;
          case 'rating':
            orderBy.rating = sortOrder;
            break;
          case 'name':
            orderBy.location = { name: sortOrder };
            break;
          default:
            orderBy.savedAt = sortOrder;
        }

        // Get saved locations with optimized query
        const savedLocations = await prisma.userSavedLocation.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            personalNotes: true,
            customTags: true,
            rating: true,
            isFavorite: true,
            savedAt: true,
            updatedAt: true,
            location: {
              select: {
                id: true,
                placeId: true,
                name: true,
                country: true,
                city: true,
                region: true,
                address: true,
                latitude: true,
                longitude: true,
                placeType: true,
                metadata: true,
              },
            },
          },
        });

        return {
          locations: savedLocations.map(this.formatSavedLocation),
          total,
        };
      },
      cacheConfigs.user(userId)
    );
  }

  // @Cacheable(cacheConfigs.user(userId))
  static async getMapViewLocations(userId: string): Promise<MapViewLocation[]> {
    const savedLocations = await prisma.userSavedLocation.findMany({
      where: { userId },
      include: {
        location: true,
      },
    });

    return savedLocations.map((saved: any) => ({
      id: saved.locationId,
      coordinates: {
        lat: saved.location.latitude,
        lng: saved.location.longitude,
      },
      name: saved.location.name,
      type: (saved.location.placeType as LocationType) || 'poi',
      isFavorite: saved.isFavorite,
      rating: saved.rating || undefined,
    }));
  }

  static async batchSaveLocations(
    userId: string,
    data: BatchSaveLocationsRequest
  ): Promise<SavedLocation[]> {
    // Use transaction for batch operations
    return prisma.$transaction(async (tx) => {
      const results: SavedLocation[] = [];

      // First, create all locations that don't exist
      const locationPromises = data.locations.map(async (locationData) => {
        let location = await tx.location.findUnique({
          where: { placeId: locationData.placeId },
        });

        if (!location) {
          location = await tx.location.create({
            data: {
              placeId: locationData.placeId,
              name: locationData.name,
              country: locationData.country,
              city: locationData.city,
              region: locationData.region,
              address: locationData.address,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              placeType: locationData.placeType,
              metadata: locationData.metadata || Prisma.JsonNull,
            },
          });
        }

        return { locationData, location };
      });

      const locations = await Promise.all(locationPromises);

      // Then, create saved locations
      for (const { locationData, location } of locations) {
        try {
          const existingSave = await tx.userSavedLocation.findUnique({
            where: {
              userId_locationId: {
                userId,
                locationId: location.id,
              },
            },
          });

          if (!existingSave) {
            const savedLocation = await tx.userSavedLocation.create({
              data: {
                userId,
                locationId: location.id,
                personalNotes: locationData.personalNotes,
                customTags: locationData.customTags || [],
                rating: locationData.rating,
              },
              include: {
                location: true,
              },
            });

            results.push(this.formatSavedLocation(savedLocation));
          }
        } catch (error) {
          logger.error(`Failed to save location ${locationData.name}:`, error);
          // Continue with other locations
        }
      }

      // Invalidate caches
      await cache.invalidateByTags([`user:${userId}`, 'locations:popular']);

      return results;
    });
  }

  private static formatSavedLocation(saved: any): SavedLocation {
    return {
      id: saved.id,
      location: {
        id: saved.location.id,
        placeId: saved.location.placeId,
        name: saved.location.name,
        country: saved.location.country || '',
        city: saved.location.city,
        region: saved.location.region,
        address: saved.location.address,
        coordinates: {
          lat: saved.location.latitude,
          lng: saved.location.longitude,
        },
        type: (saved.location.placeType as LocationType) || 'poi',
        metadata: saved.location.metadata,
      },
      personalNotes: saved.personalNotes,
      customTags: saved.customTags,
      rating: saved.rating,
      isFavorite: saved.isFavorite,
      savedAt: saved.savedAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}