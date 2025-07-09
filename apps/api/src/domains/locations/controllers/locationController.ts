import { Request, Response, NextFunction } from 'express';
import { LocationService } from '@/domains/locations/services/locationService';
import { ValidationError } from '@/shared/utils/errors';
import {
  saveLocationSchema,
  updateSavedLocationSchema,
  savedLocationsQuerySchema,
  batchSaveLocationsSchema,
  LocationType,
} from '@xplore/shared';

export class LocationController {
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, types, limit } = req.query;

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
        types: typesArray as LocationType[] | undefined,
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

  // Wishlist endpoints

  static async saveLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const validatedData = saveLocationSchema.parse(req.body);

      const savedLocation = await LocationService.saveLocation(userId, validatedData);

      res.status(201).json({
        data: savedLocation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { locationId } = req.params;

      await LocationService.removeLocation(userId, locationId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async getSavedLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Handle case where user is not authenticated (for development)
      if (!(req as any).user) {
        res.json({
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit: 20,
          },
        });
        return;
      }

      const userId = (req as any).user.userId;
      const query = savedLocationsQuerySchema.parse(req.query);

      const result = await LocationService.getSavedLocations(userId, query);

      res.json({
        data: result.locations,
        meta: {
          total: result.total,
          page: query.page || 1,
          limit: query.limit || 20,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSavedLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { locationId } = req.params;
      const validatedData = updateSavedLocationSchema.parse(req.body);

      const updatedLocation = await LocationService.updateSavedLocation(
        userId,
        locationId,
        validatedData
      );

      res.json({
        data: updatedLocation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { locationId } = req.params;
      const { notes } = req.body;

      if (typeof notes !== 'string') {
        throw new ValidationError('Notes must be a string');
      }

      const updatedLocation = await LocationService.updateSavedLocation(userId, locationId, {
        personalNotes: notes,
      });

      res.json({
        data: updatedLocation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { locationId } = req.params;
      const { tags } = req.body;

      if (!Array.isArray(tags)) {
        throw new ValidationError('Tags must be an array');
      }

      const updatedLocation = await LocationService.updateSavedLocation(userId, locationId, {
        customTags: tags,
      });

      res.json({
        data: updatedLocation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMapViewLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Handle case where user is not authenticated (for development)
      if (!(req as any).user) {
        res.json({
          data: [],
        });
        return;
      }

      const userId = (req as any).user.userId;
      const locations = await LocationService.getMapViewLocations(userId);

      res.json({
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  }

  static async batchSaveLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const validatedData = batchSaveLocationsSchema.parse(req.body);

      const savedLocations = await LocationService.batchSaveLocations(userId, validatedData);

      res.status(201).json({
        data: savedLocations,
        meta: {
          total: savedLocations.length,
          succeeded: savedLocations.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}