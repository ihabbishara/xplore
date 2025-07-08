export interface Trip {
  id: string
  name: string
  description?: string
  creatorId: string
  startDate: string
  endDate: string
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
  visibility: 'private' | 'shared' | 'public'
  tripType?: string
  coverImageUrl?: string
  estimatedBudget?: number
  actualBudget?: number
  currency: string
  settings?: TripSettings
  analytics?: TripAnalytics
  createdAt: string
  updatedAt: string
  
  // Relations
  creator?: User
  destinations?: TripDestination[]
  segments?: RouteSegment[]
  collaborators?: TripCollaborator[]
  weatherSummaries?: TripWeatherSummary[]
  _count?: {
    destinations: number
    collaborators: number
    journalEntries: number
  }
}

export interface TripSettings {
  notificationsEnabled?: boolean
  autoWeatherUpdates?: boolean
  [key: string]: any
}

export interface TripAnalytics {
  totalDistance: number
  countriesCount: number
  citiesCount: number
  activitiesCount: number
  estimatedDrivingTime: number
  weatherScore: number
  budgetUtilization?: number
}

export interface TripDestination {
  id: string
  tripId: string
  locationId: string
  arrivalDate: string
  departureDate: string
  dayOrder: number
  accommodationType?: string
  accommodationName?: string
  accommodationAddress?: string
  activities?: Activity[]
  notes?: string
  weather?: any
  createdAt: string
  updatedAt: string
  
  // Relations
  location?: Location
  segments?: RouteSegment[]
}

export interface Activity {
  name: string
  time?: string
  duration?: number
  category?: string
  notes?: string
}

export interface RouteSegment {
  id: string
  tripId: string
  fromDestinationId: string
  toDestinationId: string
  transportMode: 'car' | 'train' | 'flight' | 'bus' | 'walk' | 'bike'
  distance?: number
  duration?: number
  cost?: number
  currency?: string
  polyline?: string
  waypoints?: any[]
  departureTime?: string
  arrivalTime?: string
  bookingReference?: string
  notes?: string
  createdAt: string
  updatedAt: string
  
  // Relations
  fromDestination?: TripDestination
}

export interface TripCollaborator {
  id: string
  tripId: string
  userId: string
  role: 'owner' | 'editor' | 'viewer'
  permissions?: CollaboratorPermissions
  invitedBy?: string
  invitedAt: string
  acceptedAt?: string
  createdAt: string
  
  // Relations
  user?: User
}

export interface CollaboratorPermissions {
  canEditRoute?: boolean
  canAddDestinations?: boolean
  canManageBudget?: boolean
  canInviteOthers?: boolean
  [key: string]: any
}

export interface TripWeatherSummary {
  id: string
  tripId: string
  destinationId?: string
  date: string
  weatherProvider: string
  temperature: {
    min: number
    max: number
    avg: number
    feelsLike: number
  }
  conditions: string
  precipitation?: number
  windSpeed?: number
  humidity?: number
  uvIndex?: number
  sunrise?: string
  sunset?: string
  alerts?: any[]
  createdAt: string
}

export interface Location {
  id: string
  placeId: string
  name: string
  address?: string
  country?: string
  region?: string
  city?: string
  latitude: number
  longitude: number
  placeType?: string
  metadata?: any
  createdAt: string
}

export interface User {
  id: string
  email: string
  profile?: {
    firstName?: string
    lastName?: string
    avatarUrl?: string
  }
}

// Form inputs
export interface TripCreateInput {
  name: string
  description?: string
  startDate: string
  endDate: string
  tripType?: string
  coverImageUrl?: string
  estimatedBudget?: number
  currency?: string
  visibility?: 'private' | 'shared' | 'public'
  settings?: TripSettings
}

export interface TripUpdateInput extends Partial<TripCreateInput> {
  status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
  actualBudget?: number
}

export interface TripDestinationInput {
  locationId: string
  arrivalDate: string
  departureDate: string
  dayOrder: number
  accommodationType?: string
  accommodationName?: string
  accommodationAddress?: string
  activities?: Activity[]
  notes?: string
}

export interface RouteSegmentInput {
  fromDestinationId: string
  toDestinationId: string
  transportMode: 'car' | 'train' | 'flight' | 'bus' | 'walk' | 'bike'
  distance?: number
  duration?: number
  cost?: number
  currency?: string
  departureTime?: string
  arrivalTime?: string
  bookingReference?: string
  notes?: string
}

export interface OptimizationOptions {
  optimizeFor: 'distance' | 'time' | 'cost' | 'scenic'
  avoidHighways?: boolean
  avoidTolls?: boolean
  preferredTransportModes?: string[]
  maxDrivingHoursPerDay?: number
  includeRestStops?: boolean
  includeReturn?: boolean
}

export interface TripFilters {
  status?: string
  startDate?: string
  endDate?: string
  search?: string
}