import { z } from 'zod';

const locationSchema = z.object({
  country: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

const interestsSchema = z.object({
  work: z.array(z.string()).optional(),
  lifestyle: z.array(z.string()).optional(),
  climate: z.array(z.string()).optional(),
});

const privacySettingsSchema = z.object({
  profileVisible: z.boolean(),
  locationVisible: z.boolean(),
});

export const createProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  currentLocation: locationSchema.optional(),
  targetCountries: z.array(z.string().min(1).max(100)).optional(),
  explorationTimeline: z.enum(['1-3 months', '3-6 months', '6-12 months', '1+ years']).optional(),
  userType: z.enum(['relocation_explorer', 'weekend_traveler', 'outdoor_adventurer']).optional(),
  interests: interestsSchema.optional(),
  privacySettings: privacySettingsSchema.optional(),
  bio: z.string().max(500).optional(),
});

export const updateProfileSchema = createProfileSchema.partial();