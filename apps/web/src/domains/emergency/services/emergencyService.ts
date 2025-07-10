import { apiClient } from '@/lib/api/client';
import { offlineStorage } from '@/lib/offline/storage';
import {
  EmergencyProtocol,
  EmergencyContact,
  WildlifeHazard,
  PlantHazard,
  WeatherHazard,
  EnvironmentalAlert,
  SOSMessage,
  RiskAssessment,
  SafetyScore,
  EmergencyKit,
  MedicationReminder,
  HealthCondition,
  WaterSource,
  TravelAdvisory,
  EmergencyType,
  Coordinates,
  EmergencyFilters,
  SafetyFilters,
} from '../types/emergency';

export class EmergencyService {
  // Cache keys for offline storage
  private static readonly CACHE_KEYS = {
    PROTOCOLS: 'emergency_protocols',
    CONTACTS: 'emergency_contacts',
    WILDLIFE: 'wildlife_hazards',
    PLANTS: 'plant_hazards',
    KITS: 'emergency_kits',
    WATER_GUIDES: 'water_treatment_guides',
    MEDICAL_PHRASES: 'medical_phrases',
  };

  // Emergency protocols
  static async getEmergencyProtocols(filters?: EmergencyFilters): Promise<EmergencyProtocol[]> {
    try {
      const response = await apiClient.get('/emergency/protocols', { params: filters });
      const protocols = response.data.data;
      
      // Cache for offline use
      if (filters?.offlineOnly !== false) {
        await offlineStorage.setItem(this.CACHE_KEYS.PROTOCOLS, protocols);
      }
      
      return protocols;
    } catch (error) {
      // Fallback to offline data
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.PROTOCOLS);
      if (cached) {
        return this.filterProtocolsOffline(cached, filters);
      }
      throw error;
    }
  }

  static async getProtocolById(id: string): Promise<EmergencyProtocol> {
    try {
      const response = await apiClient.get(`/emergency/protocols/${id}`);
      return response.data.data;
    } catch (error) {
      // Check offline cache
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.PROTOCOLS);
      if (cached) {
        const protocol = cached.find((p: EmergencyProtocol) => p.id === id);
        if (protocol) return protocol;
      }
      throw error;
    }
  }

  // Emergency contacts
  static async getNearbyEmergencyContacts(location: Coordinates): Promise<EmergencyContact[]> {
    try {
      const response = await apiClient.get('/emergency/contacts/nearby', {
        params: { lat: location.lat, lng: location.lng },
      });
      const contacts = response.data.data;
      
      // Cache for offline
      await offlineStorage.setItem(this.CACHE_KEYS.CONTACTS, contacts);
      
      return contacts;
    } catch (error) {
      // Fallback to cached contacts
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.CONTACTS);
      if (cached) {
        return this.sortContactsByDistance(cached, location);
      }
      throw error;
    }
  }

  static async addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    const response = await apiClient.post('/emergency/contacts', contact);
    return response.data.data;
  }

  // SOS functionality
  static async sendSOSMessage(data: {
    location: Coordinates;
    message: string;
    type: EmergencyType;
    contacts: string[];
    mediaFiles?: string[];
  }): Promise<SOSMessage> {
    try {
      const response = await apiClient.post('/emergency/sos', data);
      return response.data.data;
    } catch (error) {
      // Store for retry when online
      const sosMessage: SOSMessage = {
        id: `sos_${Date.now()}`,
        userId: 'offline_user',
        timestamp: new Date(),
        location: data.location,
        accuracy: 10,
        message: data.message,
        emergencyType: data.type,
        contacts: data.contacts,
        status: 'failed',
        photos: data.mediaFiles,
      };
      
      await offlineStorage.setItem(`sos_queue_${sosMessage.id}`, sosMessage);
      throw error;
    }
  }

  static async cancelSOS(sosId: string): Promise<void> {
    await apiClient.post(`/emergency/sos/${sosId}/cancel`);
  }

  // Wildlife hazards
  static async getWildlifeHazards(location: Coordinates): Promise<WildlifeHazard[]> {
    try {
      const response = await apiClient.get('/emergency/wildlife/hazards', {
        params: { lat: location.lat, lng: location.lng, radius: 50 },
      });
      const hazards = response.data.data;
      
      // Cache for offline
      await offlineStorage.setItem(this.CACHE_KEYS.WILDLIFE, hazards);
      
      return hazards;
    } catch (error) {
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.WILDLIFE);
      if (cached) return cached;
      throw error;
    }
  }

  static async identifyWildlife(imageData: string): Promise<WildlifeHazard | null> {
    const response = await apiClient.post('/emergency/wildlife/identify', {
      image: imageData,
    });
    return response.data.data;
  }

  // Plant hazards
  static async getPlantHazards(location: Coordinates): Promise<PlantHazard[]> {
    try {
      const response = await apiClient.get('/emergency/plants/hazards', {
        params: { lat: location.lat, lng: location.lng, radius: 50 },
      });
      const hazards = response.data.data;
      
      // Cache for offline
      await offlineStorage.setItem(this.CACHE_KEYS.PLANTS, hazards);
      
      return hazards;
    } catch (error) {
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.PLANTS);
      if (cached) return cached;
      throw error;
    }
  }

  static async identifyPlant(imageData: string): Promise<PlantHazard | null> {
    const response = await apiClient.post('/emergency/plants/identify', {
      image: imageData,
    });
    return response.data.data;
  }

  // Weather hazards
  static async getWeatherHazards(location: Coordinates): Promise<WeatherHazard[]> {
    const response = await apiClient.get('/emergency/weather/hazards', {
      params: { lat: location.lat, lng: location.lng },
    });
    return response.data.data;
  }

  // Environmental alerts
  static async getEnvironmentalAlerts(location: Coordinates): Promise<EnvironmentalAlert[]> {
    const response = await apiClient.get('/emergency/environmental/alerts', {
      params: { lat: location.lat, lng: location.lng, radius: 100 },
    });
    return response.data.data;
  }

  // Risk assessment
  static async performRiskAssessment(params: {
    location: Coordinates;
    radius: number;
  }): Promise<RiskAssessment> {
    const response = await apiClient.post('/emergency/risk/assess', params);
    return response.data.data;
  }

  // Safety score
  static async getSafetyScore(location: Coordinates): Promise<SafetyScore> {
    const response = await apiClient.get('/emergency/safety/score', {
      params: { lat: location.lat, lng: location.lng },
    });
    return response.data.data;
  }

  // Travel advisories
  static async getTravelAdvisories(country: string): Promise<TravelAdvisory[]> {
    const response = await apiClient.get('/emergency/travel/advisories', {
      params: { country },
    });
    return response.data.data;
  }

  // Emergency kits
  static async getEmergencyKits(): Promise<EmergencyKit[]> {
    try {
      const response = await apiClient.get('/emergency/kits');
      const kits = response.data.data;
      
      // Cache for offline
      await offlineStorage.setItem(this.CACHE_KEYS.KITS, kits);
      
      return kits;
    } catch (error) {
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.KITS);
      if (cached) return cached;
      throw error;
    }
  }

  static async createEmergencyKit(kit: Omit<EmergencyKit, 'id'>): Promise<EmergencyKit> {
    const response = await apiClient.post('/emergency/kits', kit);
    return response.data.data;
  }

  static async updateEmergencyKit(id: string, updates: Partial<EmergencyKit>): Promise<EmergencyKit> {
    const response = await apiClient.put(`/emergency/kits/${id}`, updates);
    return response.data.data;
  }

  // Medication reminders
  static async getMedicationReminders(): Promise<MedicationReminder[]> {
    const response = await apiClient.get('/emergency/medications');
    return response.data.data;
  }

  static async addMedicationReminder(medication: Omit<MedicationReminder, 'id'>): Promise<MedicationReminder> {
    const response = await apiClient.post('/emergency/medications', medication);
    return response.data.data;
  }

  static async updateMedicationReminder(id: string, updates: Partial<MedicationReminder>): Promise<MedicationReminder> {
    const response = await apiClient.put(`/emergency/medications/${id}`, updates);
    return response.data.data;
  }

  static async deleteMedicationReminder(id: string): Promise<void> {
    await apiClient.delete(`/emergency/medications/${id}`);
  }

  // Health conditions
  static async getHealthConditions(): Promise<HealthCondition[]> {
    const response = await apiClient.get('/emergency/health-conditions');
    return response.data.data;
  }

  static async addHealthCondition(condition: Omit<HealthCondition, 'id'>): Promise<HealthCondition> {
    const response = await apiClient.post('/emergency/health-conditions', condition);
    return response.data.data;
  }

  static async updateHealthCondition(id: string, updates: Partial<HealthCondition>): Promise<HealthCondition> {
    const response = await apiClient.put(`/emergency/health-conditions/${id}`, updates);
    return response.data.data;
  }

  static async deleteHealthCondition(id: string): Promise<void> {
    await apiClient.delete(`/emergency/health-conditions/${id}`);
  }

  // Water safety
  static async getNearbyWaterSources(params: {
    location: Coordinates;
    radius: number;
  }): Promise<WaterSource[]> {
    const response = await apiClient.get('/emergency/water/sources', {
      params: {
        lat: params.location.lat,
        lng: params.location.lng,
        radius: params.radius,
      },
    });
    return response.data.data;
  }

  static async testWaterQuality(params: {
    sourceId: string;
    testKit?: string;
  }): Promise<WaterSource> {
    const response = await apiClient.post('/emergency/water/test', params);
    return response.data.data;
  }

  static async getWaterTreatmentGuides(): Promise<any[]> {
    try {
      const response = await apiClient.get('/emergency/water/treatment-guides');
      const guides = response.data.data;
      
      // Cache for offline
      await offlineStorage.setItem(this.CACHE_KEYS.WATER_GUIDES, guides);
      
      return guides;
    } catch (error) {
      const cached = await offlineStorage.getItem(this.CACHE_KEYS.WATER_GUIDES);
      if (cached) return cached;
      throw error;
    }
  }

  // Offline sync
  static async syncOfflineData(): Promise<void> {
    // Sync any queued SOS messages
    const keys = await offlineStorage.getAllKeys();
    const sosQueueKeys = keys.filter(key => key.startsWith('sos_queue_'));
    
    for (const key of sosQueueKeys) {
      const sosMessage = await offlineStorage.getItem(key);
      if (sosMessage) {
        try {
          await this.sendSOSMessage({
            location: sosMessage.location,
            message: sosMessage.message,
            type: sosMessage.emergencyType,
            contacts: sosMessage.contacts,
            mediaFiles: sosMessage.photos,
          });
          await offlineStorage.removeItem(key);
        } catch (error) {
          console.error('Failed to sync SOS message:', error);
        }
      }
    }
  }

  // Helper methods
  private static filterProtocolsOffline(
    protocols: EmergencyProtocol[],
    filters?: EmergencyFilters
  ): EmergencyProtocol[] {
    if (!filters) return protocols;
    
    return protocols.filter(protocol => {
      if (filters.types && !filters.types.includes(protocol.type)) {
        return false;
      }
      if (filters.severity && !filters.severity.includes(protocol.severity)) {
        return false;
      }
      if (filters.language && !protocol.translations[filters.language]) {
        return false;
      }
      return true;
    });
  }

  private static sortContactsByDistance(
    contacts: EmergencyContact[],
    location: Coordinates
  ): EmergencyContact[] {
    return contacts
      .map(contact => {
        if (contact.coordinates) {
          const distance = this.calculateDistance(location, contact.coordinates);
          return { ...contact, distance };
        }
        return contact;
      })
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
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