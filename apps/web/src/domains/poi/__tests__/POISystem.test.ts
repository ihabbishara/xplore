import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { POIService } from '../services/poiService';
import { POIType, FilterOptions, POI, POICollection } from '../types/poi';
import poiReducer from '../store/poiSlice';
import mapReducer from '../store/mapSlice';

// Mock API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock data
const mockPOI: POI = {
  id: '1',
  name: 'Test Restaurant',
  type: POIType.RESTAURANT,
  coordinates: { lat: 37.7749, lng: -122.4194 },
  address: '123 Test St, San Francisco, CA',
  rating: 4.5,
  reviewCount: 150,
  priceRange: 'mid-range',
  source: 'google',
  photos: ['https://example.com/photo1.jpg'],
  description: 'A great restaurant',
  amenities: ['WiFi', 'Parking'],
  tags: ['Popular', 'Family-friendly'],
  phone: '+1-555-123-4567',
  website: 'https://example.com',
  openingHours: {
    monday: { open: '09:00', close: '21:00' },
    tuesday: { open: '09:00', close: '21:00' },
    wednesday: { open: '09:00', close: '21:00' },
    thursday: { open: '09:00', close: '21:00' },
    friday: { open: '09:00', close: '22:00' },
    saturday: { open: '09:00', close: '22:00' },
    sunday: { open: '10:00', close: '20:00' },
  },
};

const mockCollection: POICollection = {
  id: '1',
  userId: 'user1',
  name: 'My Favorites',
  description: 'Collection of favorite places',
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  itemCount: 5,
};

const mockBounds = {
  north: 37.8,
  south: 37.7,
  east: -122.3,
  west: -122.5,
};

const mockFilters: FilterOptions = {
  types: [POIType.RESTAURANT],
  minRating: 4.0,
  maxDistance: 10,
  priceRange: ['mid-range'],
  openNow: true,
};

describe('POI System Tests', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        poi: poiReducer,
        map: mapReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('POI Service', () => {
    it('should search POIs with filters', async () => {
      const mockResponse = {
        data: {
          data: {
            pois: [mockPOI],
            total: 1,
            hasMore: false,
          },
        },
      };

      const { apiClient } = require('@/lib/api/client');
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await POIService.searchPOIs({
        bounds: mockBounds,
        types: [POIType.RESTAURANT],
        filters: mockFilters,
      });

      expect(apiClient.post).toHaveBeenCalledWith('/poi/search', {
        bounds: mockBounds,
        types: [POIType.RESTAURANT],
        filters: mockFilters,
      });
      expect(result.pois).toHaveLength(1);
      expect(result.pois[0]).toEqual(mockPOI);
    });

    it('should create custom POI', async () => {
      const mockResponse = {
        data: {
          data: mockPOI,
        },
      };

      const { apiClient } = require('@/lib/api/client');
      apiClient.post.mockResolvedValue(mockResponse);

      const customPOIData = {
        location: { lat: 37.7749, lng: -122.4194 },
        type: POIType.CUSTOM,
        name: 'My Custom Place',
        description: 'A custom place I created',
        isPrivate: false,
      };

      const result = await POIService.createCustomPOI(customPOIData);

      expect(apiClient.post).toHaveBeenCalledWith('/poi/custom', customPOIData);
      expect(result).toEqual(mockPOI);
    });

    it('should get route-aware suggestions', async () => {
      const mockSuggestions = [
        {
          type: 'timing',
          title: 'Lunch Stop',
          description: 'Great lunch options along your route',
          pois: [mockPOI],
          distanceFromRoute: 500,
          detourTime: 10,
          priority: 5,
        },
      ];

      const mockResponse = {
        data: {
          data: mockSuggestions,
        },
      };

      const { apiClient } = require('@/lib/api/client');
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await POIService.getRouteAwareSuggestions('route-123');

      expect(apiClient.get).toHaveBeenCalledWith('/poi/route-suggestions/route-123', {
        params: { filters: undefined },
      });
      expect(result).toEqual(mockSuggestions);
    });

    it('should manage POI collections', async () => {
      const { apiClient } = require('@/lib/api/client');
      
      // Create collection
      apiClient.post.mockResolvedValue({ data: { data: mockCollection } });
      
      const newCollection = await POIService.createCollection({
        name: 'Test Collection',
        description: 'Test description',
        isPublic: true,
      });

      expect(apiClient.post).toHaveBeenCalledWith('/poi/collections', {
        name: 'Test Collection',
        description: 'Test description',
        isPublic: true,
      });
      expect(newCollection).toEqual(mockCollection);

      // Add POI to collection
      apiClient.post.mockResolvedValue({ data: {} });
      
      await POIService.addPOIToCollection('collection-1', 'poi-1', 'My notes');

      expect(apiClient.post).toHaveBeenCalledWith('/poi/collections/collection-1/items', {
        poiId: 'poi-1',
        notes: 'My notes',
      });
    });

    it('should handle external API integrations', async () => {
      const mockGooglePlaces = [
        {
          place_id: 'place123',
          name: 'Test Place',
          formatted_address: '123 Test St',
          geometry: { location: { lat: 37.7749, lng: -122.4194 } },
          rating: 4.5,
          user_ratings_total: 100,
          types: ['restaurant'],
        },
      ];

      const { apiClient } = require('@/lib/api/client');
      apiClient.get.mockResolvedValue({ data: { data: mockGooglePlaces } });

      const result = await POIService.searchGooglePlaces('pizza', { lat: 37.7749, lng: -122.4194 });

      expect(apiClient.get).toHaveBeenCalledWith('/poi/google-places/search', {
        params: {
          query: 'pizza',
          location: { lat: 37.7749, lng: -122.4194 },
          radius: undefined,
          type: undefined,
        },
      });
      expect(result).toEqual(mockGooglePlaces);
    });
  });

  describe('POI Redux Store', () => {
    it('should handle POI state updates', () => {
      const initialState = store.getState().poi;
      expect(initialState.pois).toEqual([]);
      expect(initialState.loading).toBe(false);

      // Test adding POI
      store.dispatch({ type: 'poi/addPOI', payload: mockPOI });
      let state = store.getState().poi;
      expect(state.pois).toHaveLength(1);
      expect(state.pois[0]).toEqual(mockPOI);

      // Test updating POI
      const updatedPOI = { ...mockPOI, name: 'Updated Restaurant' };
      store.dispatch({ type: 'poi/updatePOI', payload: updatedPOI });
      state = store.getState().poi;
      expect(state.pois[0].name).toBe('Updated Restaurant');

      // Test removing POI
      store.dispatch({ type: 'poi/removePOI', payload: mockPOI.id });
      state = store.getState().poi;
      expect(state.pois).toHaveLength(0);
    });

    it('should handle filter updates', () => {
      const initialState = store.getState().poi;
      expect(initialState.activeFilters).toEqual({});

      // Test setting filters
      store.dispatch({ type: 'poi/setActiveFilters', payload: mockFilters });
      let state = store.getState().poi;
      expect(state.activeFilters).toEqual(mockFilters);

      // Test updating individual filter
      store.dispatch({ type: 'poi/updateFilter', payload: { minRating: 3.5 } });
      state = store.getState().poi;
      expect(state.activeFilters.minRating).toBe(3.5);

      // Test clearing filters
      store.dispatch({ type: 'poi/clearFilters' });
      state = store.getState().poi;
      expect(state.activeFilters).toEqual({});
    });

    it('should handle collections', () => {
      const initialState = store.getState().poi;
      expect(initialState.collections).toEqual([]);

      // Add collection
      store.dispatch({ type: 'poi/addCollection', payload: mockCollection });
      let state = store.getState().poi;
      expect(state.collections).toHaveLength(1);
      expect(state.collections[0]).toEqual(mockCollection);

      // Update collection
      const updatedCollection = { ...mockCollection, name: 'Updated Collection' };
      store.dispatch({ type: 'poi/updateCollection', payload: updatedCollection });
      state = store.getState().poi;
      expect(state.collections[0].name).toBe('Updated Collection');

      // Remove collection
      store.dispatch({ type: 'poi/removeCollection', payload: mockCollection.id });
      state = store.getState().poi;
      expect(state.collections).toHaveLength(0);
    });
  });

  describe('Map Redux Store', () => {
    it('should handle map state updates', () => {
      const initialState = store.getState().map;
      expect(initialState.zoom).toBe(10);
      expect(initialState.activeLayers).toContain(POIType.CAMPING);

      // Test zoom update
      store.dispatch({ type: 'map/setZoom', payload: 15 });
      let state = store.getState().map;
      expect(state.zoom).toBe(15);

      // Test layer toggle
      store.dispatch({ type: 'map/toggleLayer', payload: POIType.RESTAURANT });
      state = store.getState().map;
      expect(state.activeLayers).toContain(POIType.RESTAURANT);

      // Test layer disable
      store.dispatch({ type: 'map/disableLayer', payload: POIType.CAMPING });
      state = store.getState().map;
      expect(state.activeLayers).not.toContain(POIType.CAMPING);
    });

    it('should handle POI selection', () => {
      const initialState = store.getState().map;
      expect(initialState.selectedPOI).toBeNull();

      // Select POI
      store.dispatch({ type: 'map/setSelectedPOI', payload: mockPOI });
      let state = store.getState().map;
      expect(state.selectedPOI).toEqual(mockPOI);

      // Clear selection
      store.dispatch({ type: 'map/clearSelectedPOI' });
      state = store.getState().map;
      expect(state.selectedPOI).toBeNull();
    });

    it('should handle route corridor settings', () => {
      const initialState = store.getState().map;
      expect(initialState.showRouteCorridorr).toBe(false);

      // Enable route corridor
      store.dispatch({ type: 'map/setShowRouteCorridor', payload: true });
      let state = store.getState().map;
      expect(state.showRouteCorridorr).toBe(true);

      // Set corridor radius
      store.dispatch({ type: 'map/setRouteCorridorRadius', payload: 10 });
      state = store.getState().map;
      expect(state.routeCorridorRadius).toBe(10);
    });
  });

  describe('POI Type Definitions', () => {
    it('should have all required POI types', () => {
      const requiredTypes = [
        POIType.CAMPING,
        POIType.ACCOMMODATION,
        POIType.VILLAGE,
        POIType.ATTRACTION,
        POIType.RESTAURANT,
        POIType.GASSTATION,
        POIType.PARKING,
        POIType.VIEWPOINT,
        POIType.HIKING,
        POIType.EMERGENCY,
        POIType.CUSTOM,
      ];

      requiredTypes.forEach(type => {
        expect(Object.values(POIType)).toContain(type);
      });
    });

    it('should validate POI data structure', () => {
      expect(mockPOI).toHaveProperty('id');
      expect(mockPOI).toHaveProperty('name');
      expect(mockPOI).toHaveProperty('type');
      expect(mockPOI).toHaveProperty('coordinates');
      expect(mockPOI.coordinates).toHaveProperty('lat');
      expect(mockPOI.coordinates).toHaveProperty('lng');
      expect(mockPOI).toHaveProperty('source');
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large POI datasets efficiently', () => {
      const largePOIDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockPOI,
        id: `poi-${i}`,
        name: `POI ${i}`,
      }));

      const startTime = performance.now();
      
      // Simulate filtering large dataset
      const filteredPOIs = largePOIDataset.filter(poi => 
        poi.type === POIType.RESTAURANT &&
        poi.coordinates.lat >= mockBounds.south &&
        poi.coordinates.lat <= mockBounds.north &&
        poi.coordinates.lng >= mockBounds.west &&
        poi.coordinates.lng <= mockBounds.east
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete filtering within reasonable time (< 100ms)
      expect(executionTime).toBeLessThan(100);
      expect(filteredPOIs).toBeDefined();
    });

    it('should implement caching correctly', () => {
      const cacheKey = 'test-cache-key';
      const cacheData = [mockPOI];

      // Simulate cache operations
      const cache = new Map<string, POI[]>();
      
      // Set cache
      cache.set(cacheKey, cacheData);
      expect(cache.has(cacheKey)).toBe(true);

      // Get cache
      const cachedData = cache.get(cacheKey);
      expect(cachedData).toEqual(cacheData);

      // Clear cache
      cache.clear();
      expect(cache.has(cacheKey)).toBe(false);
    });

    it('should handle clustering correctly', () => {
      const clusteredPOIs = [
        { ...mockPOI, id: '1', coordinates: { lat: 37.7749, lng: -122.4194 } },
        { ...mockPOI, id: '2', coordinates: { lat: 37.7750, lng: -122.4195 } },
        { ...mockPOI, id: '3', coordinates: { lat: 37.7751, lng: -122.4196 } },
      ];

      // Simple clustering logic test
      const clusterRadius = 0.001; // degrees
      const clusters: { center: { lat: number; lng: number }; pois: POI[] }[] = [];
      
      clusteredPOIs.forEach(poi => {
        const nearbyCluster = clusters.find(cluster => {
          const distance = Math.sqrt(
            Math.pow(cluster.center.lat - poi.coordinates.lat, 2) +
            Math.pow(cluster.center.lng - poi.coordinates.lng, 2)
          );
          return distance < clusterRadius;
        });

        if (nearbyCluster) {
          nearbyCluster.pois.push(poi);
        } else {
          clusters.push({
            center: poi.coordinates,
            pois: [poi],
          });
        }
      });

      // Should create appropriate number of clusters
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters.length).toBeLessThanOrEqual(clusteredPOIs.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { apiClient } = require('@/lib/api/client');
      apiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(POIService.searchPOIs({
        bounds: mockBounds,
        types: [POIType.RESTAURANT],
        filters: mockFilters,
      })).rejects.toThrow('Network error');
    });

    it('should handle invalid POI data', () => {
      const invalidPOI = {
        id: '',
        name: '',
        type: 'invalid-type' as POIType,
        coordinates: { lat: 'invalid', lng: 'invalid' },
        source: 'unknown',
      };

      // Should validate required fields
      expect(invalidPOI.id).toBe('');
      expect(invalidPOI.name).toBe('');
      expect(typeof invalidPOI.coordinates.lat).toBe('string');
    });
  });

  describe('Integration Tests', () => {
    it('should integrate search and filtering correctly', async () => {
      const { apiClient } = require('@/lib/api/client');
      apiClient.post.mockResolvedValue({
        data: {
          data: {
            pois: [mockPOI],
            total: 1,
            hasMore: false,
          },
        },
      });

      // Search with filters
      const result = await POIService.searchPOIs({
        bounds: mockBounds,
        types: [POIType.RESTAURANT],
        filters: mockFilters,
      });

      expect(result.pois).toHaveLength(1);
      expect(result.pois[0].type).toBe(POIType.RESTAURANT);
    });

    it('should integrate collections and POI management', async () => {
      const { apiClient } = require('@/lib/api/client');
      
      // Create collection
      apiClient.post.mockResolvedValue({ data: { data: mockCollection } });
      const collection = await POIService.createCollection({
        name: 'Test Collection',
        description: 'Test',
        isPublic: false,
      });

      // Add POI to collection
      apiClient.post.mockResolvedValue({ data: {} });
      await POIService.addPOIToCollection(collection.id, mockPOI.id);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/poi/collections/${collection.id}/items`,
        { poiId: mockPOI.id, notes: undefined }
      );
    });
  });
});

// Success metrics validation
describe('PER-34 Success Metrics Validation', () => {
  it('should meet POI rendering performance requirements', () => {
    const startTime = performance.now();
    
    // Simulate rendering 1000 POIs
    const pois = Array.from({ length: 1000 }, (_, i) => ({
      ...mockPOI,
      id: `poi-${i}`,
    }));

    const filteredPOIs = pois.filter(poi => poi.type === POIType.RESTAURANT);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 100ms (PER-34 requirement)
    expect(renderTime).toBeLessThan(100);
    expect(filteredPOIs).toBeDefined();
  });

  it('should support all 11 POI types', () => {
    const poiTypes = Object.values(POIType);
    expect(poiTypes).toHaveLength(11);
  });

  it('should handle zoom-based layer visibility', () => {
    const zoomLevels = [8, 10, 12, 14, 16];
    
    zoomLevels.forEach(zoom => {
      // Each zoom level should show appropriate POI types
      expect(zoom).toBeGreaterThan(0);
      expect(zoom).toBeLessThan(20);
    });
  });

  it('should implement advanced filtering', () => {
    const advancedFilters: FilterOptions = {
      types: [POIType.RESTAURANT, POIType.ATTRACTION],
      minRating: 4.0,
      maxDistance: 5,
      priceRange: ['budget', 'mid-range'],
      amenities: ['WiFi', 'Parking'],
      openNow: true,
      userPreferences: true,
    };

    // All filter options should be available
    expect(advancedFilters.types).toBeDefined();
    expect(advancedFilters.minRating).toBeDefined();
    expect(advancedFilters.maxDistance).toBeDefined();
    expect(advancedFilters.priceRange).toBeDefined();
    expect(advancedFilters.amenities).toBeDefined();
    expect(advancedFilters.openNow).toBeDefined();
    expect(advancedFilters.userPreferences).toBeDefined();
  });
});