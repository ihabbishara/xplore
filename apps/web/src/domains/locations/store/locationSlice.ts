import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  LocationSearchResult,
  SavedLocation,
  SavedLocationsQuery,
  SaveLocationRequest,
  UpdateSavedLocationRequest,
  MapViewLocation,
} from '@xplore/shared';
import { LocationService } from '../services/locationService';

interface LocationState {
  // Search state
  searchResults: LocationSearchResult[];
  searchQuery: string;
  searchLoading: boolean;
  searchError: string | null;

  // Saved locations state
  savedLocations: SavedLocation[];
  savedLocationsTotal: number;
  savedLocationsLoading: boolean;
  savedLocationsError: string | null;

  // Map view
  mapViewLocations: MapViewLocation[];
  mapViewLoading: boolean;

  // Popular destinations
  popularDestinations: LocationSearchResult[];
  popularLoading: boolean;

  // UI state
  selectedLocation: SavedLocation | null;
  filters: SavedLocationsQuery;
}

const initialState: LocationState = {
  searchResults: [],
  searchQuery: '',
  searchLoading: false,
  searchError: null,

  savedLocations: [],
  savedLocationsTotal: 0,
  savedLocationsLoading: false,
  savedLocationsError: null,

  mapViewLocations: [],
  mapViewLoading: false,

  popularDestinations: [],
  popularLoading: false,

  selectedLocation: null,
  filters: {},
};

// Async thunks
export const searchLocations = createAsyncThunk(
  'locations/search',
  async (query: string) => {
    return await LocationService.search({ query });
  }
);

export const fetchPopularDestinations = createAsyncThunk(
  'locations/fetchPopular',
  async () => {
    return await LocationService.getPopularDestinations();
  }
);

export const saveLocation = createAsyncThunk(
  'locations/save',
  async (location: SaveLocationRequest) => {
    return await LocationService.saveLocation(location);
  }
);

export const removeLocation = createAsyncThunk(
  'locations/remove',
  async (locationId: string) => {
    await LocationService.removeLocation(locationId);
    return locationId;
  }
);

export const fetchSavedLocations = createAsyncThunk(
  'locations/fetchSaved',
  async (query?: SavedLocationsQuery) => {
    return await LocationService.getSavedLocations(query);
  }
);

export const updateSavedLocation = createAsyncThunk(
  'locations/update',
  async ({ locationId, updates }: { locationId: string; updates: UpdateSavedLocationRequest }) => {
    return await LocationService.updateSavedLocation(locationId, updates);
  }
);

export const fetchMapViewLocations = createAsyncThunk(
  'locations/fetchMapView',
  async () => {
    return await LocationService.getMapViewLocations();
  }
);

// Slice
export const locationSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
      state.searchError = null;
    },
    setSelectedLocation: (state, action: PayloadAction<SavedLocation | null>) => {
      state.selectedLocation = action.payload;
    },
    setFilters: (state, action: PayloadAction<SavedLocationsQuery>) => {
      state.filters = action.payload;
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const location = state.savedLocations.find((l) => l.id === action.payload);
      if (location) {
        location.isFavorite = !location.isFavorite;
      }
    },
  },
  extraReducers: (builder) => {
    // Search locations
    builder
      .addCase(searchLocations.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchLocations.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchLocations.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.error.message || 'Failed to search locations';
      });

    // Popular destinations
    builder
      .addCase(fetchPopularDestinations.pending, (state) => {
        state.popularLoading = true;
      })
      .addCase(fetchPopularDestinations.fulfilled, (state, action) => {
        state.popularLoading = false;
        state.popularDestinations = action.payload;
      })
      .addCase(fetchPopularDestinations.rejected, (state) => {
        state.popularLoading = false;
      });

    // Save location
    builder
      .addCase(saveLocation.fulfilled, (state, action) => {
        state.savedLocations.unshift(action.payload);
        state.savedLocationsTotal += 1;
      });

    // Remove location
    builder
      .addCase(removeLocation.fulfilled, (state, action) => {
        state.savedLocations = state.savedLocations.filter((l) => l.location.id !== action.payload);
        state.savedLocationsTotal -= 1;
      });

    // Fetch saved locations
    builder
      .addCase(fetchSavedLocations.pending, (state) => {
        state.savedLocationsLoading = true;
        state.savedLocationsError = null;
      })
      .addCase(fetchSavedLocations.fulfilled, (state, action) => {
        state.savedLocationsLoading = false;
        state.savedLocations = action.payload.locations;
        state.savedLocationsTotal = action.payload.total;
      })
      .addCase(fetchSavedLocations.rejected, (state, action) => {
        state.savedLocationsLoading = false;
        state.savedLocationsError = action.error.message || 'Failed to fetch saved locations';
      });

    // Update saved location
    builder
      .addCase(updateSavedLocation.fulfilled, (state, action) => {
        const index = state.savedLocations.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.savedLocations[index] = action.payload;
        }
      });

    // Map view locations
    builder
      .addCase(fetchMapViewLocations.pending, (state) => {
        state.mapViewLoading = true;
      })
      .addCase(fetchMapViewLocations.fulfilled, (state, action) => {
        state.mapViewLoading = false;
        state.mapViewLocations = action.payload;
      })
      .addCase(fetchMapViewLocations.rejected, (state) => {
        state.mapViewLoading = false;
      });
  },
});

export const {
  setSearchQuery,
  clearSearchResults,
  setSelectedLocation,
  setFilters,
  toggleFavorite,
} = locationSlice.actions;

export default locationSlice.reducer;