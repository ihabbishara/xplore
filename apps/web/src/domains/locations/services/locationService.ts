import { apiClient } from '@/lib/api/client';
import {
  LocationSearchRequest,
  LocationSearchResult,
  SaveLocationRequest,
  SavedLocation,
  SavedLocationsQuery,
  UpdateSavedLocationRequest,
  BatchSaveLocationsRequest,
  MapViewLocation,
} from '@xplore/shared';

export class LocationService {
  static async search(params: LocationSearchRequest & { filters?: string[] }): Promise<LocationSearchResult[]> {
    // Map UI filters to LocationType
    const mapFiltersToTypes = (filters?: string[]): LocationType[] => {
      if (!filters || filters.length === 0) {
        return ['city', 'region', 'poi']; // Default types
      }
      
      const typeMap: Record<string, LocationType[]> = {
        cities: ['city'],
        nature: ['poi', 'region'],
        beaches: ['poi'],
        mountains: ['poi', 'region'],
        historic: ['poi'],
        culture: ['poi', 'city']
      };
      
      const mappedTypes = filters.flatMap(filter => typeMap[filter] || []);
      return mappedTypes.length > 0 ? [...new Set(mappedTypes)] : ['city', 'region', 'poi'];
    };

    const searchParams = {
      query: params.query,
      types: mapFiltersToTypes(params.filters),
      limit: params.limit,
      proximity: params.proximity
    };

    const { data } = await apiClient.get('/locations/search', { params: searchParams });
    return data.data;
  }

  static async reverseGeocode(lat: number, lng: number): Promise<LocationSearchResult | null> {
    const { data } = await apiClient.get('/locations/reverse', {
      params: { lat, lng },
    });
    return data.data;
  }

  static async getPopularDestinations(): Promise<LocationSearchResult[]> {
    const { data } = await apiClient.get('/locations/popular');
    return data.data;
  }

  // Wishlist management
  static async saveLocation(location: SaveLocationRequest): Promise<SavedLocation> {
    const { data } = await apiClient.post('/locations/save', location);
    return data.data;
  }

  static async removeLocation(locationId: string): Promise<void> {
    await apiClient.delete(`/locations/saved/${locationId}`);
  }

  static async getSavedLocations(
    query?: SavedLocationsQuery
  ): Promise<{ locations: SavedLocation[]; total: number }> {
    const { data } = await apiClient.get('/locations/saved', { params: query });
    return {
      locations: data.data,
      total: data.meta.total,
    };
  }

  static async updateSavedLocation(
    locationId: string,
    updates: UpdateSavedLocationRequest
  ): Promise<SavedLocation> {
    const { data } = await apiClient.put(`/locations/saved/${locationId}`, updates);
    return data.data;
  }

  static async updateNotes(locationId: string, notes: string): Promise<SavedLocation> {
    const { data } = await apiClient.put(`/locations/saved/${locationId}/notes`, { notes });
    return data.data;
  }

  static async updateTags(locationId: string, tags: string[]): Promise<SavedLocation> {
    const { data } = await apiClient.put(`/locations/saved/${locationId}/tags`, { tags });
    return data.data;
  }

  static async getMapViewLocations(): Promise<MapViewLocation[]> {
    const { data } = await apiClient.get('/locations/saved/map-view');
    return data.data;
  }

  static async batchSaveLocations(
    locations: SaveLocationRequest[]
  ): Promise<SavedLocation[]> {
    const { data } = await apiClient.post('/locations/batch-save', { locations });
    return data.data;
  }
}