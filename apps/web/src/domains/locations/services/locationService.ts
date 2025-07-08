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
  static async search(params: LocationSearchRequest): Promise<LocationSearchResult[]> {
    const { data } = await apiClient.get('/locations/search', { params });
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