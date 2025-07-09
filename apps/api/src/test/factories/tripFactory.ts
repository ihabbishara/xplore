import { Trip, TripDestination, RouteSegment } from '@prisma/client'

let tripIdCounter = 1
let destinationIdCounter = 1
let segmentIdCounter = 1

export const createMockTrip = (userId: string, overrides?: Partial<Trip>): Trip => ({
  id: `trip-${tripIdCounter++}`,
  userId,
  name: `Test Trip ${tripIdCounter}`,
  description: 'An amazing test trip',
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  status: 'planning',
  visibility: 'private',
  coverImage: null,
  tags: ['test', 'adventure'],
  totalBudget: 5000,
  currency: 'USD',
  collaboratorEmails: [],
  transportationModes: ['car', 'walk'],
  accommodationPreference: 'hotel',
  activityPreferences: ['sightseeing', 'food'],
  pacePreference: 'moderate',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockTripDestination = (
  tripId: string,
  locationId: string,
  overrides?: Partial<TripDestination>
): TripDestination => ({
  id: `destination-${destinationIdCounter++}`,
  tripId,
  locationId,
  order: destinationIdCounter,
  arrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  departureDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
  accommodation: null,
  notes: 'Test destination notes',
  budget: 1000,
  activities: ['explore', 'eat'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockRouteSegment = (
  tripId: string,
  fromDestinationId: string,
  toDestinationId: string,
  overrides?: Partial<RouteSegment>
): RouteSegment => ({
  id: `segment-${segmentIdCounter++}`,
  tripId,
  fromDestinationId,
  toDestinationId,
  transportMode: 'car',
  distance: 100,
  duration: 120,
  cost: 50,
  waypoints: [],
  polyline: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})