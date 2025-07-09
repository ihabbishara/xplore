import { Location, UserSavedLocation } from '@prisma/client'

let locationIdCounter = 1

export const createMockLocation = (overrides?: Partial<Location>): Location => ({
  id: `location-${locationIdCounter++}`,
  name: `Test Location ${locationIdCounter}`,
  placeType: 'city',
  latitude: 0,
  longitude: 0,
  address: '123 Test Street',
  city: 'Test City',
  region: 'Test State',
  country: 'Test Country',
  placeId: `place-${locationIdCounter}`,
  metadata: {},
  createdAt: new Date(),
  ...overrides,
})

export const createMockSavedLocation = (
  userId: string,
  locationId: string,
  overrides?: Partial<UserSavedLocation>
): UserSavedLocation => ({
  id: `saved-${userId}-${locationId}`,
  userId,
  locationId,
  personalNotes: 'Test notes',
  customTags: ['test'],
  rating: null,
  isFavorite: false,
  savedAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})