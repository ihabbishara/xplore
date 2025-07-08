// Location types
export type LocationType = 'city' | 'region' | 'poi' | 'address' | 'country';

// Coordinate interface
export interface Coordinates {
  lat: number;
  lng: number;
}

// Location search
export interface LocationSearchResult {
  id: string;
  placeId: string;
  name: string;
  country: string;
  city?: string;
  region?: string;
  address?: string;
  coordinates: Coordinates;
  type: LocationType;
  metadata?: Record<string, any>;
}

export interface LocationSearchRequest {
  query: string;
  types?: LocationType[];
  limit?: number;
  proximity?: Coordinates; // Search near these coordinates
}

// Saved locations (wishlist)
export interface SavedLocation {
  id: string;
  location: LocationSearchResult;
  personalNotes?: string;
  customTags: string[];
  rating?: number;
  isFavorite: boolean;
  savedAt: string;
  updatedAt: string;
}

export interface SaveLocationRequest {
  placeId: string;
  name: string;
  country?: string;
  city?: string;
  region?: string;
  address?: string;
  latitude: number;
  longitude: number;
  placeType?: LocationType;
  metadata?: Record<string, any>;
  personalNotes?: string;
  customTags?: string[];
  rating?: number;
}

export interface UpdateSavedLocationRequest {
  personalNotes?: string;
  customTags?: string[];
  rating?: number;
  isFavorite?: boolean;
}

export interface SavedLocationsQuery {
  tags?: string[];
  minRating?: number;
  favorites?: boolean;
  sortBy?: 'savedAt' | 'rating' | 'name' | 'distance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Batch operations
export interface BatchSaveLocationsRequest {
  locations: SaveLocationRequest[];
}

// Map view data
export interface MapViewLocation {
  id: string;
  coordinates: Coordinates;
  name: string;
  type: LocationType;
  isFavorite: boolean;
  rating?: number;
}