import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { POI, POIState, FilterOptions, POISearchResponse, POICollection, RouteAwarePOISuggestion, LatLngBounds, POIType, CreateCustomPOIRequest, POILayerSearchRequest } from '../types/poi';
import { POIService } from '../services/poiService';

// Initial state
const initialState: POIState = {
  pois: [],
  loading: false,
  error: null,
  searchResults: null,
  collections: [],
  activeFilters: {},
  suggestions: [],
  lastSearchBounds: undefined,
  cache: {},
};

// Async thunks for API calls
export const searchPOIs = createAsyncThunk(
  'poi/searchPOIs',
  async (params: POILayerSearchRequest) => {
    return await POIService.searchPOIs(params);
  }
);

export const createCustomPOI = createAsyncThunk(
  'poi/createCustomPOI',
  async (poiData: CreateCustomPOIRequest) => {
    return await POIService.createCustomPOI(poiData);
  }
);

export const fetchPOICollections = createAsyncThunk(
  'poi/fetchCollections',
  async () => {
    return await POIService.getCollections();
  }
);

export const fetchRouteAwareSuggestions = createAsyncThunk(
  'poi/fetchRouteAwareSuggestions',
  async (params: { routeId: string; filters?: FilterOptions }) => {
    return await POIService.getRouteAwareSuggestions(params.routeId, params.filters);
  }
);

const poiSlice = createSlice({
  name: 'poi',
  initialState,
  reducers: {
    // POI management
    addPOI: (state, action: PayloadAction<POI>) => {
      state.pois.push(action.payload);
    },
    
    updatePOI: (state, action: PayloadAction<POI>) => {
      const index = state.pois.findIndex(poi => poi.id === action.payload.id);
      if (index !== -1) {
        state.pois[index] = action.payload;
      }
    },
    
    removePOI: (state, action: PayloadAction<string>) => {
      state.pois = state.pois.filter(poi => poi.id !== action.payload);
    },
    
    // Filter management
    setActiveFilters: (state, action: PayloadAction<FilterOptions>) => {
      state.activeFilters = action.payload;
    },
    
    updateFilter: (state, action: PayloadAction<Partial<FilterOptions>>) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    
    // Search results
    setSearchResults: (state, action: PayloadAction<POISearchResponse | null>) => {
      state.searchResults = action.payload;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = null;
    },
    
    // Collections
    addCollection: (state, action: PayloadAction<POICollection>) => {
      state.collections.push(action.payload);
    },
    
    updateCollection: (state, action: PayloadAction<POICollection>) => {
      const index = state.collections.findIndex(col => col.id === action.payload.id);
      if (index !== -1) {
        state.collections[index] = action.payload;
      }
    },
    
    removeCollection: (state, action: PayloadAction<string>) => {
      state.collections = state.collections.filter(col => col.id !== action.payload);
    },
    
    // Suggestions
    setSuggestions: (state, action: PayloadAction<RouteAwarePOISuggestion[]>) => {
      state.suggestions = action.payload;
    },
    
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
    
    // Cache management
    setCacheEntry: (state, action: PayloadAction<{ key: string; pois: POI[] }>) => {
      state.cache[action.payload.key] = action.payload.pois;
    },
    
    clearCache: (state) => {
      state.cache = {};
    },
    
    // Bounds tracking
    setLastSearchBounds: (state, action: PayloadAction<LatLngBounds>) => {
      state.lastSearchBounds = action.payload;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Search POIs
    builder.addCase(searchPOIs.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(searchPOIs.fulfilled, (state, action) => {
      state.loading = false;
      state.searchResults = action.payload;
    });
    builder.addCase(searchPOIs.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to search POIs';
    });
    
    // Create custom POI
    builder.addCase(createCustomPOI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createCustomPOI.fulfilled, (state, action) => {
      state.loading = false;
      state.pois.push(action.payload);
    });
    builder.addCase(createCustomPOI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to create custom POI';
    });
    
    // Fetch collections
    builder.addCase(fetchPOICollections.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPOICollections.fulfilled, (state, action) => {
      state.loading = false;
      state.collections = action.payload;
    });
    builder.addCase(fetchPOICollections.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch collections';
    });
    
    // Fetch route-aware suggestions
    builder.addCase(fetchRouteAwareSuggestions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRouteAwareSuggestions.fulfilled, (state, action) => {
      state.loading = false;
      state.suggestions = action.payload;
    });
    builder.addCase(fetchRouteAwareSuggestions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch route suggestions';
    });
  },
});

export const {
  addPOI,
  updatePOI,
  removePOI,
  setActiveFilters,
  updateFilter,
  clearFilters,
  setSearchResults,
  clearSearchResults,
  addCollection,
  updateCollection,
  removeCollection,
  setSuggestions,
  clearSuggestions,
  setCacheEntry,
  clearCache,
  setLastSearchBounds,
  setError,
  clearError,
} = poiSlice.actions;

export default poiSlice.reducer;