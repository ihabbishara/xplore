/**
 * POI (Points of Interest) Type Definitions
 * Based on PER-34 specifications for Enhanced Map Layers & POI Management System
 */

// Core POI Layer interface - exact PER-34 specification
export interface POILayer {
  id: string;
  name: string;
  type: POIType;
  icon: string;
  color: string;
  visible: boolean;
  zoomThreshold?: number; // Show only when zoomed in past this level
  priority: number; // Display order when overlapping
}

// POI Type enum - exact PER-34 specification
export enum POIType {
  CAMPING = 'camping',
  ACCOMMODATION = 'accommodation',
  VILLAGE = 'village',
  ATTRACTION = 'attraction',
  RESTAURANT = 'restaurant',
  GASSTATION = 'gas_station',
  PARKING = 'parking',
  VIEWPOINT = 'viewpoint',
  HIKING = 'hiking_trail',
  EMERGENCY = 'emergency',
  CUSTOM = 'custom'
}

// Geographic coordinates
export interface LatLng {
  lat: number;
  lng: number;
}

// Geographic bounds
export interface LatLngBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Opening hours structure
export interface OpeningHours {
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
  saturday?: { open: string; close: string } | null;
  sunday?: { open: string; close: string } | null;
  isOpen24Hours?: boolean;
  isClosed?: boolean;
}

// Core POI interface
export interface POI {
  id: string;
  name: string;
  type: POIType;
  coordinates: LatLng;
  address?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  photos?: string[];
  website?: string;
  phone?: string;
  priceRange?: 'budget' | 'mid-range' | 'premium';
  openingHours?: OpeningHours;
  amenities?: string[];
  tags?: string[];
  source: 'google' | 'custom' | 'osm' | 'camping_info' | 'tourism_api';
  externalId?: string;
  isUserGenerated?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isPrivate?: boolean;
  notes?: string;
}

// Custom POI creation interface - matches PER-34 API specification
export interface CreateCustomPOIRequest {
  location: LatLng;
  type: POIType;
  name: string;
  description?: string;
  photos?: string[];
  isPrivate: boolean;
  amenities?: string[];
  tags?: string[];
  website?: string;
  phone?: string;
  openingHours?: OpeningHours;
}

// POI search filters - based on PER-34 advanced filtering system
export interface FilterOptions {
  types?: POIType[];
  minRating?: number;
  maxDistance?: number; // in kilometers
  priceRange?: ('budget' | 'mid-range' | 'premium')[];
  amenities?: string[];
  openNow?: boolean;
  openAtTime?: Date;
  userPreferences?: boolean;
}

// POI layer search request - exact PER-34 API specification
export interface POILayerSearchRequest {
  bounds: LatLngBounds;
  types: POIType[];
  filters: FilterOptions;
  routeId?: string;
}

// POI collection interfaces - based on PER-34 database schema
export interface POICollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  items?: POICollectionItem[];
}

export interface POICollectionItem {
  collectionId: string;
  poiId: string;
  poiSource: 'google' | 'custom' | 'osm' | 'camping_info' | 'tourism_api';
  addedAt: Date;
  notes?: string;
  poi?: POI; // Populated when fetching collection details
}

// Route-aware POI suggestions - based on PER-34 smart recommendations
export interface RouteAwarePOISuggestion {
  type: 'timing' | 'interest' | 'practical' | 'accommodation';
  title: string;
  description: string;
  pois: POI[];
  suggestedTime?: Date;
  distanceFromRoute: number; // in meters
  detourTime?: number; // in minutes
  priority: number;
}

// POI search response
export interface POISearchResponse {
  pois: POI[];
  total: number;
  hasMore: boolean;
  nextPageToken?: string;
  suggestions?: RouteAwarePOISuggestion[];
}

// POI layer configuration - for layer management
export type POILayerConfig = {
  [key in POIType]: {
    name: string;
    icon: string;
    color: string;
    defaultVisible: boolean;
    zoomThreshold: number;
    priority: number;
    description: string;
  };
}

// Map state interface for Redux
export interface MapState {
  center: LatLng;
  zoom: number;
  bounds?: LatLngBounds;
  activeLayers: POIType[];
  layerConfigs: POILayerConfig;
  selectedPOI?: POI | null;
  hoveredPOI?: POI | null;
  showRouteCorridorr?: boolean;
  routeCorridorRadius?: number; // in kilometers
}

// POI state interface for Redux
export interface POIState {
  pois: POI[];
  loading: boolean;
  error?: string | null;
  searchResults: POISearchResponse | null;
  collections: POICollection[];
  activeFilters: FilterOptions;
  suggestions: RouteAwarePOISuggestion[];
  lastSearchBounds?: LatLngBounds;
  cache: Record<string, POI[]>; // Cache by bounds key
}

// External API integration types
export interface GooglePlacesResponse {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now: boolean;
    periods: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
  };
  price_level?: number;
  types: string[];
}

// Performance optimization types
export interface POICluster {
  id: string;
  center: LatLng;
  count: number;
  pois: POI[];
  bounds: LatLngBounds;
  zoom: number;
}

// Heatmap data structure
export interface POIHeatmapData {
  coordinates: LatLng;
  intensity: number;
  type: POIType;
}

// Analytics and metrics
export interface POIAnalytics {
  totalPOIsViewed: number;
  layersUsed: POIType[];
  collectionsCreated: number;
  customPOIsCreated: number;
  searchesPerformed: number;
  averageSessionTime: number;
  popularPOITypes: Record<POIType, number>;
}

// Error types
export interface POIError {
  code: string;
  message: string;
  details?: any;
}

// Constants for POI system
export const POI_CONSTANTS = {
  MAX_POIS_PER_VIEWPORT: 1000,
  CLUSTER_RADIUS: 50, // pixels
  DEFAULT_SEARCH_RADIUS: 10, // kilometers
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  DEBOUNCE_DELAY: 300, // milliseconds
  MIN_ZOOM_FOR_POIS: 10,
  MAX_ZOOM_FOR_CLUSTERING: 15,
} as const;

// Default layer configuration
export const DEFAULT_POI_LAYERS: POILayerConfig = {
  [POIType.CAMPING]: {
    name: 'Camping',
    icon: '🏕️',
    color: '#10B981',
    defaultVisible: true,
    zoomThreshold: 10,
    priority: 1,
    description: 'Camping sites and RV parks'
  },
  [POIType.ACCOMMODATION]: {
    name: 'Accommodation',
    icon: '🏨',
    color: '#3B82F6',
    defaultVisible: true,
    zoomThreshold: 10,
    priority: 2,
    description: 'Hotels, hostels, and lodging'
  },
  [POIType.VILLAGE]: {
    name: 'Villages',
    icon: '🏘️',
    color: '#8B5CF6',
    defaultVisible: true,
    zoomThreshold: 8,
    priority: 3,
    description: 'Historic villages and towns'
  },
  [POIType.ATTRACTION]: {
    name: 'Attractions',
    icon: '🎭',
    color: '#F59E0B',
    defaultVisible: true,
    zoomThreshold: 10,
    priority: 4,
    description: 'Tourist attractions and landmarks'
  },
  [POIType.RESTAURANT]: {
    name: 'Restaurants',
    icon: '🍽️',
    color: '#EF4444',
    defaultVisible: false,
    zoomThreshold: 12,
    priority: 5,
    description: 'Restaurants and dining'
  },
  [POIType.GASSTATION]: {
    name: 'Gas Stations',
    icon: '⛽',
    color: '#6B7280',
    defaultVisible: false,
    zoomThreshold: 12,
    priority: 6,
    description: 'Gas stations and fuel stops'
  },
  [POIType.PARKING]: {
    name: 'Parking',
    icon: '🅿️',
    color: '#374151',
    defaultVisible: false,
    zoomThreshold: 14,
    priority: 7,
    description: 'Parking areas and lots'
  },
  [POIType.VIEWPOINT]: {
    name: 'Viewpoints',
    icon: '📸',
    color: '#06B6D4',
    defaultVisible: true,
    zoomThreshold: 10,
    priority: 8,
    description: 'Scenic viewpoints and photo spots'
  },
  [POIType.HIKING]: {
    name: 'Hiking Trails',
    icon: '🥾',
    color: '#059669',
    defaultVisible: false,
    zoomThreshold: 12,
    priority: 9,
    description: 'Hiking trails and outdoor activities'
  },
  [POIType.EMERGENCY]: {
    name: 'Emergency',
    icon: '🚨',
    color: '#DC2626',
    defaultVisible: false,
    zoomThreshold: 12,
    priority: 10,
    description: 'Emergency services and hospitals'
  },
  [POIType.CUSTOM]: {
    name: 'Custom',
    icon: '📍',
    color: '#7C3AED',
    defaultVisible: true,
    zoomThreshold: 8,
    priority: 11,
    description: 'User-created custom POIs'
  }
} as const;