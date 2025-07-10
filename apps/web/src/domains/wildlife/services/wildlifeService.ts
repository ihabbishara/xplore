import { apiClient } from '@/lib/api/client';
import { offlineStorage } from '@/lib/offline/storage';
import {
  WildlifeSpecies,
  WildlifeSighting,
  MigrationPattern,
  ActivityPattern,
  WildlifeHide,
  SightingStatistics,
  SightingComment,
  SightingVerification,
  WildlifeFilters,
  Coordinates,
  VerificationStatus,
  DateTimeRange,
} from '../types/wildlife';

export class WildlifeService {
  // Cache keys
  private static readonly CACHE_KEYS = {
    SPECIES: 'wildlife_species',
    SIGHTINGS: 'wildlife_sightings',
    MIGRATIONS: 'wildlife_migrations',
    HIDES: 'wildlife_hides',
    MY_SIGHTINGS: 'my_wildlife_sightings',
  };

  // Species management
  static async getSpecies(filters?: WildlifeFilters): Promise<WildlifeSpecies[]> {
    try {
      const response = await apiClient.get('/wildlife/species', { params: filters });
      const species = response.data.data;
      
      // Cache for offline use
      await offlineStorage.setItem(this.CACHE_KEYS.SPECIES, species);
      
      return species;
    } catch (error) {
      // Fallback to offline data
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.SPECIES);
      if (cached) {
        return this.filterSpeciesOffline(cached, filters);
      }
      throw error;
    }
  }

  static async getSpeciesById(id: string): Promise<WildlifeSpecies> {
    try {
      const response = await apiClient.get(`/wildlife/species/${id}`);
      return response.data.data;
    } catch (error) {
      // Check cache
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.SPECIES);
      if (cached) {
        const species = cached.find((s: WildlifeSpecies) => s.id === id);
        if (species) return species;
      }
      throw error;
    }
  }

  static async searchSpecies(query: string): Promise<WildlifeSpecies[]> {
    const response = await apiClient.get('/wildlife/species/search', {
      params: { q: query },
    });
    return response.data.data;
  }

  // Sighting management
  static async getSightings(filters?: WildlifeFilters): Promise<WildlifeSighting[]> {
    try {
      const response = await apiClient.get('/wildlife/sightings', { params: filters });
      const sightings = response.data.data;
      
      // Cache recent sightings
      await offlineStorage.setItem(this.CACHE_KEYS.SIGHTINGS, sightings);
      
      return sightings;
    } catch (error) {
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.SIGHTINGS);
      if (cached) {
        return this.filterSightingsOffline(cached, filters);
      }
      throw error;
    }
  }

  static async getNearbySightings(params: {
    location: Coordinates;
    radius: number;
  }): Promise<WildlifeSighting[]> {
    const response = await apiClient.get('/wildlife/sightings/nearby', {
      params: {
        lat: params.location.lat,
        lng: params.location.lng,
        radius: params.radius,
      },
    });
    return response.data.data;
  }

  static async getSightingById(id: string): Promise<WildlifeSighting> {
    const response = await apiClient.get(`/wildlife/sightings/${id}`);
    return response.data.data;
  }

  static async createSighting(
    sighting: Omit<WildlifeSighting, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WildlifeSighting> {
    const response = await apiClient.post('/wildlife/sightings', sighting);
    const newSighting = response.data.data;
    
    // Update cached sightings
    const cached = await offlineStorage.getItem(this.CACHE_KEYS.MY_SIGHTINGS) || [];
    cached.unshift(newSighting);
    await offlineStorage.setItem(this.CACHE_KEYS.MY_SIGHTINGS, cached);
    
    return newSighting;
  }

  static async updateSighting(
    id: string,
    updates: Partial<WildlifeSighting>
  ): Promise<WildlifeSighting> {
    const response = await apiClient.put(`/wildlife/sightings/${id}`, updates);
    return response.data.data;
  }

  static async deleteSighting(id: string): Promise<void> {
    await apiClient.delete(`/wildlife/sightings/${id}`);
  }

  // Verification
  static async verifySighting(params: {
    sightingId: string;
    status: VerificationStatus;
    notes?: string;
  }): Promise<WildlifeSighting> {
    const response = await apiClient.post(`/wildlife/sightings/${params.sightingId}/verify`, {
      status: params.status,
      notes: params.notes,
    });
    return response.data.data;
  }

  static async getSightingVerifications(sightingId: string): Promise<SightingVerification[]> {
    const response = await apiClient.get(`/wildlife/sightings/${sightingId}/verifications`);
    return response.data.data;
  }

  // Comments
  static async getSightingComments(sightingId: string): Promise<SightingComment[]> {
    const response = await apiClient.get(`/wildlife/sightings/${sightingId}/comments`);
    return response.data.data;
  }

  static async addComment(params: {
    sightingId: string;
    text: string;
  }): Promise<SightingComment> {
    const response = await apiClient.post(
      `/wildlife/sightings/${params.sightingId}/comments`,
      { text: params.text }
    );
    return response.data.data;
  }

  static async deleteComment(sightingId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/wildlife/sightings/${sightingId}/comments/${commentId}`);
  }

  // Likes
  static async likeSighting(sightingId: string): Promise<void> {
    await apiClient.post(`/wildlife/sightings/${sightingId}/like`);
  }

  static async unlikeSighting(sightingId: string): Promise<void> {
    await apiClient.delete(`/wildlife/sightings/${sightingId}/like`);
  }

  // Following
  static async followSpecies(speciesId: string): Promise<void> {
    await apiClient.post(`/wildlife/species/${speciesId}/follow`);
  }

  static async unfollowSpecies(speciesId: string): Promise<void> {
    await apiClient.delete(`/wildlife/species/${speciesId}/follow`);
  }

  static async getFollowedSpecies(): Promise<string[]> {
    const response = await apiClient.get('/wildlife/species/followed');
    return response.data.data;
  }

  // Migration patterns
  static async getMigrationPatterns(speciesId?: string): Promise<MigrationPattern[]> {
    try {
      const response = await apiClient.get('/wildlife/migrations', {
        params: speciesId ? { speciesId } : undefined,
      });
      const patterns = response.data.data;
      
      // Cache for offline
      await offlineStorage.setItem(this.CACHE_KEYS.MIGRATIONS, patterns);
      
      return patterns;
    } catch (error) {
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.MIGRATIONS);
      if (cached) {
        return speciesId
          ? cached.filter((p: MigrationPattern) => p.speciesId === speciesId)
          : cached;
      }
      throw error;
    }
  }

  static async getActiveMigrations(): Promise<MigrationPattern[]> {
    const response = await apiClient.get('/wildlife/migrations/active');
    return response.data.data;
  }

  // Activity patterns
  static async getActivityPatterns(speciesId: string): Promise<ActivityPattern[]> {
    const response = await apiClient.get(`/wildlife/species/${speciesId}/activity`);
    return response.data.data;
  }

  static async predictActivity(params: {
    speciesId: string;
    location: Coordinates;
    datetime: Date;
  }): Promise<{
    probability: number;
    bestTimes: DateTimeRange[];
    factors: { factor: string; impact: number }[];
  }> {
    const response = await apiClient.post('/wildlife/activity/predict', params);
    return response.data.data;
  }

  // Wildlife hides
  static async getNearbyHides(params: {
    location: Coordinates;
    radius: number;
  }): Promise<WildlifeHide[]> {
    try {
      const response = await apiClient.get('/wildlife/hides/nearby', {
        params: {
          lat: params.location.lat,
          lng: params.location.lng,
          radius: params.radius,
        },
      });
      const hides = response.data.data;
      
      // Cache for offline
      await offlineStorage.setItem(this.CACHE_KEYS.HIDES, hides);
      
      return hides;
    } catch (error) {
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.HIDES);
      if (cached) {
        return this.filterHidesByDistance(cached, params.location, params.radius);
      }
      throw error;
    }
  }

  static async getHideById(id: string): Promise<WildlifeHide> {
    const response = await apiClient.get(`/wildlife/hides/${id}`);
    return response.data.data;
  }

  // Statistics
  static async getSightingStatistics(params: {
    speciesId: string;
    location?: Coordinates;
    radius?: number;
  }): Promise<SightingStatistics> {
    const response = await apiClient.get('/wildlife/statistics/sightings', { params });
    return response.data.data;
  }

  static async getHotspots(params: {
    location: Coordinates;
    radius: number;
    speciesId?: string;
  }): Promise<{
    location: Coordinates;
    sightingCount: number;
    topSpecies: string[];
    bestTimes: ActivityPeriod[];
  }[]> {
    const response = await apiClient.get('/wildlife/hotspots', { params });
    return response.data.data;
  }

  // Community features
  static async getExpertUsers(): Promise<any[]> {
    const response = await apiClient.get('/wildlife/experts');
    return response.data.data;
  }

  static async getUserNotifications(): Promise<any[]> {
    const response = await apiClient.get('/wildlife/notifications');
    return response.data.data;
  }

  static async markNotificationRead(notificationId: string): Promise<void> {
    await apiClient.put(`/wildlife/notifications/${notificationId}/read`);
  }

  // Equipment recommendations
  static async getEquipmentRecommendations(speciesTypes: string[]): Promise<any[]> {
    const response = await apiClient.get('/wildlife/equipment/recommendations', {
      params: { species: speciesTypes },
    });
    return response.data.data;
  }

  // Helper methods for offline filtering
  private static filterSpeciesOffline(
    species: WildlifeSpecies[],
    filters?: WildlifeFilters
  ): WildlifeSpecies[] {
    if (!filters) return species;
    
    return species.filter(s => {
      if (filters.species && !filters.species.includes(s.id)) return false;
      if (filters.conservationStatus && !filters.conservationStatus.includes(s.conservationStatus)) return false;
      if (filters.habitats && !filters.habitats.some(h => s.preferredHabitats.includes(h))) return false;
      return true;
    });
  }

  private static filterSightingsOffline(
    sightings: WildlifeSighting[],
    filters?: WildlifeFilters
  ): WildlifeSighting[] {
    if (!filters) return sightings;
    
    return sightings.filter(s => {
      if (filters.species && !filters.species.includes(s.speciesId)) return false;
      if (filters.verificationStatus && !filters.verificationStatus.includes(s.verificationStatus)) return false;
      if (filters.hasPhotos && (!s.photos || s.photos.length === 0)) return false;
      if (filters.dateRange) {
        const sightingDate = new Date(s.timestamp);
        if (sightingDate < filters.dateRange.start || sightingDate > filters.dateRange.end) return false;
      }
      return true;
    });
  }

  private static filterHidesByDistance(
    hides: WildlifeHide[],
    location: Coordinates,
    maxRadius: number
  ): WildlifeHide[] {
    return hides.filter(hide => {
      const distance = this.calculateDistance(location, hide.location);
      return distance <= maxRadius;
    });
  }

  private static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}