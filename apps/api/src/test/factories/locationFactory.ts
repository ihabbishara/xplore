import { Location, UserSavedLocation } from '@prisma/client'

let locationIdCounter = 1

export const createMockLocation = (overrides?: Partial<Location>): Location => ({
  id: `location-${locationIdCounter++}`,
  name: `Test Location ${locationIdCounter}`,
  description: 'A beautiful test location',
  type: 'city',
  coordinates: [0, 0],
  address: '123 Test Street',
  city: 'Test City',
  state: 'Test State',
  country: 'Test Country',
  postalCode: '12345',
  timezone: 'UTC',
  placeId: `place-${locationIdCounter}`,
  photos: [],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
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
  listType: 'wishlist',
  notes: 'Test notes',
  priority: 1,
  tags: ['test'],
  visitStatus: 'not_visited',
  rating: null,
  recommendToOthers: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})