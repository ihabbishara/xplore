import { Request, Response, NextFunction } from 'express';
import { LocationService } from '@/domains/locations/services/locationService';
import { ValidationError } from '@/shared/utils/errors';

export class LocationController {
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query, types, limit } = req.query;

      if (!query || typeof query !== 'string') {
        throw new ValidationError('Search query is required');
      }

      const typesArray = types 
        ? (typeof types === 'string' ? types.split(',') : types as string[])
        : undefined;

      const limitNumber = limit 
        ? parseInt(limit as string, 10) 
        : undefined;

      const results = await LocationService.search({
        query,
        types: typesArray,
        limit: limitNumber,
      });

      res.json({
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reverseGeocode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        throw new ValidationError('Latitude and longitude are required');
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new ValidationError('Invalid latitude or longitude');
      }

      if (latitude < -90 || latitude > 90) {
        throw new ValidationError('Latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        throw new ValidationError('Longitude must be between -180 and 180');
      }

      const result = await LocationService.reverseGeocode(latitude, longitude);

      res.json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPopularDestinations(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const destinations = await LocationService.getPopularDestinations();

      res.json({
        data: destinations,
      });
    } catch (error) {
      next(error);
    }
  }
}