import { z } from 'zod';

// Coordinate validation
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// Location type validation
export const locationTypeSchema = z.enum(['city', 'region', 'poi', 'address', 'country']);

// Search request validation
export const locationSearchSchema = z.object({
  query: z.string().min(2).max(200),
  types: z.array(locationTypeSchema).optional(),
  limit: z.number().min(1).max(50).default(10),
  proximity: coordinatesSchema.optional(),
});

// Save location validation
export const saveLocationSchema = z.object({
  placeId: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeType: locationTypeSchema.optional(),
  metadata: z.record(z.any()).optional(),
  personalNotes: z.string().max(5000).optional(),
  customTags: z.array(z.string().max(50)).max(20).optional(),
  rating: z.number().min(1).max(5).optional(),
});

// Update saved location validation
export const updateSavedLocationSchema = z.object({
  personalNotes: z.string().max(5000).optional(),
  customTags: z.array(z.string().max(50)).max(20).optional(),
  rating: z.number().min(1).max(5).optional(),
  isFavorite: z.boolean().optional(),
});

// Query validation
export const savedLocationsQuerySchema = z.object({
  tags: z.array(z.string()).optional(),
  minRating: z.number().min(1).max(5).optional(),
  favorites: z.boolean().optional(),
  sortBy: z.enum(['savedAt', 'rating', 'name', 'distance']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Batch save validation
export const batchSaveLocationsSchema = z.object({
  locations: z.array(saveLocationSchema).min(1).max(100),
});