import { Trip, TripDestination, RouteSegment, Prisma } from '@prisma/client'

let tripIdCounter = 1
let destinationIdCounter = 1
let segmentIdCounter = 1

export const createMockTrip = (creatorId: string, overrides?: Partial<Trip>): Trip => ({
  id: `trip-${tripIdCounter++}`,
  creatorId,
  name: `Test Trip ${tripIdCounter}`,
  description: 'An amazing test trip',
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  status: 'draft',
  visibility: 'private',
  tripType: 'vacation',
  coverImageUrl: null,
  estimatedBudget: new Prisma.Decimal(5000),
  actualBudget: null,
  currency: 'USD',
  settings: {},
  analytics: {},
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
  dayOrder: destinationIdCounter,
  arrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  departureDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
  accommodationType: 'hotel',
  accommodationName: null,
  accommodationAddress: null,
  notes: 'Test destination notes',
  activities: ['explore', 'eat'],
  weather: null,
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
  distance: new Prisma.Decimal(100),
  duration: 120,
  cost: new Prisma.Decimal(50),
  currency: 'USD',
  waypoints: [],
  polyline: null,
  departureTime: null,
  arrivalTime: null,
  bookingReference: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})