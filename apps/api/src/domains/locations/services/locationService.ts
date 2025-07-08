import axios from 'axios';
import { redis } from '@/lib/redis';
import { LocationSearchResult, LocationSearchRequest } from '@xplore/shared';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/shared/utils/errors';

export class LocationService {
  private static MAPBOX_API_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  private static MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  private static CACHE_TTL = 3600; // 1 hour in seconds

  static async search(params: LocationSearchRequest): Promise<LocationSearchResult[]> {
    const { query, types = ['country', 'region', 'place'], limit = 10 } = params;

    if (!this.MAPBOX_TOKEN) {
      throw new AppError('Mapbox API token not configured', 500);
    }

    // Check cache first
    const cacheKey = `location:search:${query}:${types.join(',')}:${limit}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      logger.debug(`Location search cache hit for: ${query}`);
      return JSON.parse(cached);
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
          name: feature.text,
          country: context.country || feature.text,
          city: context.place || context.locality,
          state: context.region,
          coordinates: { lat, lng },
          type: this.mapPlaceType(feature.place_type[0]),
          fullAddress: feature.place_name,
        };
      });

      // Cache results
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(results));
      
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

    const cacheKey = `location:reverse:${lat}:${lng}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      logger.debug(`Reverse geocode cache hit for: ${lat},${lng}`);
      return JSON.parse(cached);
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
        name: feature.text,
        country: context.country || feature.text,
        city: context.place || context.locality,
        state: context.region,
        coordinates: { lat, lng },
        type: this.mapPlaceType(feature.place_type[0]),
        fullAddress: feature.place_name,
      };

      // Cache result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      
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

  private static mapPlaceType(mapboxType: string): 'country' | 'city' | 'place' {
    switch (mapboxType) {
      case 'country':
        return 'country';
      case 'place':
      case 'locality':
        return 'city';
      default:
        return 'place';
    }
  }

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
}