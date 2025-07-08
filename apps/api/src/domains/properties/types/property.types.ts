export interface PropertyCoordinates {
  lat: number
  lng: number
}

export interface PropertyFeatures {
  balcony?: boolean
  parking?: boolean
  elevator?: boolean
  terrace?: boolean
  garden?: boolean
  pool?: boolean
  garage?: boolean
  furnished?: boolean
  airConditioning?: boolean
  heating?: boolean
  dishwasher?: boolean
  washingMachine?: boolean
  [key: string]: boolean | undefined
}

export interface PropertyPhoto {
  url: string
  thumbnailUrl?: string
  caption?: string
  width?: number
  height?: number
  size?: number
  order?: number
}

export interface ScrapingError {
  error: string
  timestamp: Date
  url: string
  platform: string
  details?: any
}

export interface PropertyCreateInput {
  sourceUrl: string
  sourcePlatform?: string
  externalId?: string
  title?: string
  description?: string
  propertyType?: string
  transactionType?: string
  price?: number
  currency?: string
  pricePerSqm?: number
  monthlyCharges?: number
  sizeSqm?: number
  rooms?: number
  bedrooms?: number
  bathrooms?: number
  floorNumber?: number
  totalFloors?: number
  yearBuilt?: number
  address?: string
  city?: string
  postalCode?: string
  region?: string
  country?: string
  coordinates?: PropertyCoordinates
  features?: PropertyFeatures
  energyRating?: string
  photos?: PropertyPhoto[]
  virtualTourUrl?: string
  floorPlanUrl?: string
  agentName?: string
  agentPhone?: string
  agentEmail?: string
  agencyName?: string
  dataQualityScore?: number
  scrapingErrors?: ScrapingError[]
}

export interface PropertyUpdateInput {
  title?: string
  description?: string
  price?: number
  currency?: string
  pricePerSqm?: number
  monthlyCharges?: number
  sizeSqm?: number
  rooms?: number
  bedrooms?: number
  bathrooms?: number
  floorNumber?: number
  totalFloors?: number
  yearBuilt?: number
  address?: string
  city?: string
  postalCode?: string
  region?: string
  country?: string
  coordinates?: PropertyCoordinates
  features?: PropertyFeatures
  energyRating?: string
  photos?: PropertyPhoto[]
  virtualTourUrl?: string
  floorPlanUrl?: string
  agentName?: string
  agentPhone?: string
  agentEmail?: string
  agencyName?: string
  listingStatus?: string
  lastPriceCheck?: Date
  dataQualityScore?: number
  scrapingErrors?: ScrapingError[]
}

export interface PropertySearchFilters {
  query?: string
  city?: string
  country?: string
  region?: string
  propertyType?: string
  transactionType?: string
  minPrice?: number
  maxPrice?: number
  currency?: string
  minSize?: number
  maxSize?: number
  minRooms?: number
  maxRooms?: number
  minBedrooms?: number
  maxBedrooms?: number
  features?: string[]
  coordinates?: PropertyCoordinates
  radius?: number // in kilometers
  limit?: number
  offset?: number
  sortBy?: 'price' | 'size' | 'created_at' | 'updated_at' | 'distance'
  sortOrder?: 'asc' | 'desc'
}

export interface UserSavedPropertyInput {
  personalNotes?: string
  userRating?: number
  visitStatus?: 'planned' | 'visited' | 'interested' | 'rejected'
  visitDate?: Date
  customTags?: string[]
  pros?: string[]
  cons?: string[]
  priorityLevel?: number
  relatedTripId?: string
  relatedJournalEntries?: string[]
}

export interface UserSavedPropertyUpdateInput {
  personalNotes?: string
  userRating?: number
  visitStatus?: 'planned' | 'visited' | 'interested' | 'rejected'
  visitDate?: Date
  customTags?: string[]
  pros?: string[]
  cons?: string[]
  priorityLevel?: number
  relatedTripId?: string
  relatedJournalEntries?: string[]
}

export interface PropertyImportInput {
  url: string
  userId: string
  autoSave?: boolean
  tags?: string[]
  notes?: string
}

export interface PropertyImportResult {
  success: boolean
  property?: any
  errors?: string[]
  warnings?: string[]
  processingTime?: number
}

export interface PropertyValidationResult {
  isValid: boolean
  platform?: string
  supportedPlatform: boolean
  errors?: string[]
  warnings?: string[]
}

export interface PropertyComparisonCriteria {
  priceWeight?: number
  sizeWeight?: number
  locationWeight?: number
  featuresWeight?: number
  conditionWeight?: number
}

export interface PropertyComparison {
  properties: any[]
  criteria: PropertyComparisonCriteria
  scores: {
    [propertyId: string]: {
      total: number
      price: number
      size: number
      location: number
      features: number
      condition: number
    }
  }
  winner?: string
}

export interface PriceHistoryEntry {
  price: number
  priceChangePercentage?: number
  recordedAt: Date
}

export interface PropertyAnalytics {
  averagePrice: number
  pricePerSqm: number
  totalListings: number
  priceRange: {
    min: number
    max: number
  }
  popularFeatures: {
    [feature: string]: number
  }
  marketTrends: {
    priceChange: number
    period: string
  }
}

export interface ScrapingPlatformConfig {
  platformName: string
  country?: string
  baseDomain?: string
  selectors: {
    title?: string
    description?: string
    price?: string
    currency?: string
    size?: string
    rooms?: string
    bedrooms?: string
    bathrooms?: string
    address?: string
    photos?: string
    features?: string
    agent?: string
    energyRating?: string
    [key: string]: string | undefined
  }
  headers?: {
    [key: string]: string
  }
  rateLimitMs?: number
  isActive?: boolean
}

export interface ScrapingJobStatus {
  id: string
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startTime: Date
  endTime?: Date
  errors?: string[]
  result?: any
}

export interface BulkImportInput {
  urls: string[]
  userId: string
  autoSave?: boolean
  tags?: string[]
  notes?: string
}

export interface BulkImportResult {
  totalUrls: number
  successful: number
  failed: number
  results: PropertyImportResult[]
  errors: string[]
}

export interface PropertyExportOptions {
  format: 'pdf' | 'csv' | 'excel'
  properties: string[]
  includePhotos?: boolean
  includeNotes?: boolean
  includePriceHistory?: boolean
  template?: string
}

export interface PropertyExportResult {
  success: boolean
  downloadUrl?: string
  filename?: string
  error?: string
}