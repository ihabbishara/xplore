import { apiClient } from '@/lib/api/client';
import {
  POI,
  POIType,
  POILayerSearchRequest,
  POISearchResponse,
  CreateCustomPOIRequest,
  FilterOptions,
  POICollection,
  POICollectionItem,
  RouteAwarePOISuggestion,
  LatLng,
  LatLngBounds,
  GooglePlacesResponse,
  POIHeatmapData,
  POIAnalytics,
} from '../types/poi';

export class POIService {
  
  // Core POI search - exact PER-34 API specification
  static async searchPOIs(request: POILayerSearchRequest): Promise<POISearchResponse> {
    const { data } = await apiClient.post('/poi/search', request);
    return data.data;
  }
  
  // Get POI by ID
  static async getPOIById(id: string): Promise<POI> {
    const { data } = await apiClient.get(`/poi/${id}`);
    return data.data;
  }
  
  // Create custom POI - exact PER-34 API specification
  static async createCustomPOI(poiData: CreateCustomPOIRequest): Promise<POI> {
    const { data } = await apiClient.post('/poi/custom', poiData);
    return data.data;
  }
  
  // Update custom POI
  static async updateCustomPOI(id: string, updates: Partial<CreateCustomPOIRequest>): Promise<POI> {
    const { data } = await apiClient.put(`/poi/custom/${id}`, updates);
    return data.data;
  }
  
  // Delete custom POI
  static async deleteCustomPOI(id: string): Promise<void> {
    await apiClient.delete(`/poi/custom/${id}`);
  }
  
  // Get POIs by type and bounds
  static async getPOIsByType(type: POIType, bounds: LatLngBounds, filters?: FilterOptions): Promise<POI[]> {
    const { data } = await apiClient.get(`/poi/type/${type}`, {
      params: { bounds, filters },
    });
    return data.data;
  }
  
  // Get nearby POIs
  static async getNearbyPOIs(
    location: LatLng,
    radiusKm: number,
    types?: POIType[],
    filters?: FilterOptions
  ): Promise<POI[]> {
    const { data } = await apiClient.get('/poi/nearby', {
      params: { location, radiusKm, types, filters },
    });
    return data.data;
  }
  
  // Route-aware POI suggestions - exact PER-34 API specification
  static async getRouteAwareSuggestions(
    routeId: string,
    filters?: FilterOptions
  ): Promise<RouteAwarePOISuggestion[]> {
    const { data } = await apiClient.get(`/poi/route-suggestions/${routeId}`, {
      params: { filters },
    });
    return data.data;
  }
  
  // POI Collections Management - exact PER-34 API specification
  static async getCollections(): Promise<POICollection[]> {
    const { data } = await apiClient.get('/poi/collections');
    return data.data;
  }
  
  static async createCollection(collection: {
    name: string;
    description?: string;
    isPublic: boolean;
  }): Promise<POICollection> {
    const { data } = await apiClient.post('/poi/collections', collection);
    return data.data;
  }
  
  static async updateCollection(id: string, updates: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<POICollection> {
    const { data } = await apiClient.put(`/poi/collections/${id}`, updates);
    return data.data;
  }
  
  static async deleteCollection(id: string): Promise<void> {
    await apiClient.delete(`/poi/collections/${id}`);
  }
  
  static async getCollectionDetails(id: string): Promise<POICollection> {
    const { data } = await apiClient.get(`/poi/collections/${id}`);
    return data.data;
  }
  
  static async addPOIToCollection(collectionId: string, poiId: string, notes?: string): Promise<void> {
    await apiClient.post(`/poi/collections/${collectionId}/items`, {
      poiId,
      notes,
    });
  }
  
  static async removePOIFromCollection(collectionId: string, poiId: string): Promise<void> {
    await apiClient.delete(`/poi/collections/${collectionId}/items/${poiId}`);
  }
  
  static async updateCollectionItemNotes(
    collectionId: string,
    poiId: string,
    notes: string
  ): Promise<void> {
    await apiClient.put(`/poi/collections/${collectionId}/items/${poiId}/notes`, {
      notes,
    });
  }
  
  // External API Integration - exact PER-34 specification
  static async searchGooglePlaces(
    query: string,
    location?: LatLng,
    radius?: number,
    type?: string
  ): Promise<GooglePlacesResponse[]> {
    const { data } = await apiClient.get('/poi/google-places/search', {
      params: { query, location, radius, type },
    });
    return data.data;
  }
  
  static async getGooglePlaceDetails(placeId: string): Promise<POI> {
    const { data } = await apiClient.get(`/poi/google-places/${placeId}`);
    return data.data;
  }
  
  static async searchOpenStreetMap(
    query: string,
    bounds?: LatLngBounds,
    type?: POIType
  ): Promise<POI[]> {
    const { data } = await apiClient.get('/poi/osm/search', {
      params: { query, bounds, type },
    });
    return data.data;
  }
  
  static async getCampingInfoPOIs(bounds: LatLngBounds): Promise<POI[]> {
    const { data } = await apiClient.get('/poi/camping-info', {
      params: { bounds },
    });
    return data.data;
  }
  
  static async getTourismAPIPOIs(
    bounds: LatLngBounds,
    country?: string,
    type?: POIType
  ): Promise<POI[]> {
    const { data } = await apiClient.get('/poi/tourism-api', {
      params: { bounds, country, type },
    });
    return data.data;
  }
  
  // Advanced Features - exact PER-34 specification
  static async getHeatmapData(
    bounds: LatLngBounds,
    type: POIType,
    intensity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<POIHeatmapData[]> {
    const { data } = await apiClient.get('/poi/heatmap', {
      params: { bounds, type, intensity },
    });
    return data.data;
  }
  
  static async getClusteredPOIs(
    bounds: LatLngBounds,
    zoom: number,
    types: POIType[]
  ): Promise<any[]> {
    const { data } = await apiClient.get('/poi/clustered', {
      params: { bounds, zoom, types },
    });
    return data.data;
  }
  
  // Analytics and Metrics - exact PER-34 specification
  static async getAnalytics(): Promise<POIAnalytics> {
    const { data } = await apiClient.get('/poi/analytics');
    return data.data;
  }
  
  static async trackPOIView(poiId: string, duration: number): Promise<void> {
    await apiClient.post('/poi/analytics/view', {
      poiId,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
  
  static async trackLayerUsage(types: POIType[]): Promise<void> {
    await apiClient.post('/poi/analytics/layer-usage', {
      types,
      timestamp: new Date().toISOString(),
    });
  }
  
  static async trackSearch(query: string, filtersUsed: FilterOptions): Promise<void> {
    await apiClient.post('/poi/analytics/search', {
      query,
      filtersUsed,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Cache Management
  static async validateCache(bounds: LatLngBounds, types: POIType[]): Promise<{
    isValid: boolean;
    lastUpdated: Date;
    shouldRefresh: boolean;
  }> {
    const { data } = await apiClient.get('/poi/cache/validate', {
      params: { bounds, types },
    });
    return data.data;
  }
  
  static async refreshCache(bounds: LatLngBounds, types: POIType[]): Promise<void> {
    await apiClient.post('/poi/cache/refresh', {
      bounds,
      types,
    });
  }
  
  // Batch Operations
  static async batchCreatePOIs(pois: CreateCustomPOIRequest[]): Promise<POI[]> {
    const { data } = await apiClient.post('/poi/batch/create', { pois });
    return data.data;
  }
  
  static async batchUpdatePOIs(updates: Array<{
    id: string;
    updates: Partial<CreateCustomPOIRequest>;
  }>): Promise<POI[]> {
    const { data } = await apiClient.put('/poi/batch/update', { updates });
    return data.data;
  }
  
  static async batchDeletePOIs(ids: string[]): Promise<void> {
    await apiClient.delete('/poi/batch/delete', {
      data: { ids },
    });
  }
  
  // Export/Import
  static async exportPOIs(
    format: 'json' | 'csv' | 'gpx' | 'kml',
    filters?: FilterOptions
  ): Promise<Blob> {
    const response = await apiClient.get('/poi/export', {
      params: { format, filters },
      responseType: 'blob',
    });
    return response.data;
  }
  
  static async importPOIs(file: File, format: 'json' | 'csv' | 'gpx' | 'kml'): Promise<{
    imported: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    
    const { data } = await apiClient.post('/poi/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  }
  
  // User Preferences
  static async getUserPreferences(): Promise<{
    favoriteTypes: POIType[];
    defaultFilters: FilterOptions;
    layerSettings: Record<POIType, { visible: boolean; zoomThreshold: number }>;
  }> {
    const { data } = await apiClient.get('/poi/user/preferences');
    return data.data;
  }
  
  static async updateUserPreferences(preferences: {
    favoriteTypes?: POIType[];
    defaultFilters?: FilterOptions;
    layerSettings?: Record<POIType, { visible: boolean; zoomThreshold: number }>;
  }): Promise<void> {
    await apiClient.put('/poi/user/preferences', preferences);
  }
  
  // Offline Support
  static async getOfflinePOIs(bounds: LatLngBounds): Promise<POI[]> {
    const { data } = await apiClient.get('/poi/offline', {
      params: { bounds },
    });
    return data.data;
  }
  
  static async syncOfflinePOIs(pois: POI[]): Promise<{
    synced: number;
    conflicts: Array<{ localId: string; remoteId: string; conflict: any }>;
  }> {
    const { data } = await apiClient.post('/poi/offline/sync', { pois });
    return data.data;
  }
}