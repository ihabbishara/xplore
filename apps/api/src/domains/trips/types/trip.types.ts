import { Decimal } from '@prisma/client/runtime/library'

export interface TripCreateInput {
  name: string
  description?: string
  startDate: Date
  endDate: Date
  tripType?: string
  coverImageUrl?: string
  estimatedBudget?: number
  currency?: string
  visibility?: 'private' | 'shared' | 'public'
  settings?: {
    notificationsEnabled?: boolean
    autoWeatherUpdates?: boolean
    [key: string]: any
  }
}

export interface TripUpdateInput {
  name?: string
  description?: string
  startDate?: Date
  endDate?: Date
  status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
  tripType?: string
  coverImageUrl?: string
  estimatedBudget?: number
  actualBudget?: number
  currency?: string
  visibility?: 'private' | 'shared' | 'public'
  settings?: {
    notificationsEnabled?: boolean
    autoWeatherUpdates?: boolean
    [key: string]: any
  }
}

export interface TripDestinationInput {
  locationId: string
  arrivalDate: Date
  departureDate: Date
  dayOrder: number
  accommodationType?: string
  accommodationName?: string
  accommodationAddress?: string
  activities?: Array<{
    name: string
    time?: string
    duration?: number
    category?: string
    notes?: string
  }>
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
  departureTime?: Date
  arrivalTime?: Date
  bookingReference?: string
  notes?: string
}

export interface TripCollaboratorInput {
  userId: string
  role: 'owner' | 'editor' | 'viewer'
  permissions?: {
    canEditRoute?: boolean
    canAddDestinations?: boolean
    canManageBudget?: boolean
    canInviteOthers?: boolean
    [key: string]: any
  }
}

export interface TripWeatherFilter {
  minTemp?: number
  maxTemp?: number
  excludeRain?: boolean
  excludeSnow?: boolean
  minUvIndex?: number
  maxUvIndex?: number
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

export interface OptimizationOptions {
  optimizeFor: 'distance' | 'time' | 'cost' | 'scenic'
  avoidHighways?: boolean
  avoidTolls?: boolean
  preferredTransportModes?: string[]
  maxDrivingHoursPerDay?: number
  includeRestStops?: boolean
  includeReturn?: boolean
}

export interface WeatherPreferences {
  idealTempMin: number
  idealTempMax: number
  avoidRain: boolean
  avoidSnow: boolean
  preferSunny: boolean
  windSpeedMax?: number
  humidityMax?: number
}

export interface TripExportOptions {
  format: 'pdf' | 'excel' | 'json' | 'ical'
  includeWeather?: boolean
  includeRoutes?: boolean
  includeAccommodations?: boolean
  includeActivities?: boolean
  includeBudget?: boolean
  includeChecklists?: boolean
}