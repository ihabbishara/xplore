import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WildlifeService } from '../services/wildlifeService';
import {
  WildlifeSpecies,
  WildlifeSighting,
  MigrationPattern,
  ActivityPattern,
  WildlifeHide,
  SightingStatistics,
  WildlifeFilters,
  Coordinates,
  VerificationStatus,
} from '../types/wildlife';

interface WildlifeState {
  // Species data
  species: WildlifeSpecies[];
  selectedSpecies: WildlifeSpecies | null;
  
  // Sightings
  sightings: WildlifeSighting[];
  nearbySightings: WildlifeSighting[];
  mySightings: WildlifeSighting[];
  selectedSighting: WildlifeSighting | null;
  
  // Migration
  migrationPatterns: MigrationPattern[];
  activeMigrations: MigrationPattern[];
  
  // Activity patterns
  activityPatterns: Record<string, ActivityPattern[]>;
  
  // Hides
  wildlifeHides: WildlifeHide[];
  nearbyHides: WildlifeHide[];
  
  // Statistics
  sightingStats: Record<string, SightingStatistics>;
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Filters
  activeFilters: WildlifeFilters;
  
  // Real-time updates
  realtimeSightings: WildlifeSighting[];
  lastUpdate: Date | null;
}

const initialState: WildlifeState = {
  species: [],
  selectedSpecies: null,
  sightings: [],
  nearbySightings: [],
  mySightings: [],
  selectedSighting: null,
  migrationPatterns: [],
  activeMigrations: [],
  activityPatterns: {},
  wildlifeHides: [],
  nearbyHides: [],
  sightingStats: {},
  loading: false,
  error: null,
  activeFilters: {},
  realtimeSightings: [],
  lastUpdate: null,
};

// Async thunks
export const fetchSpecies = createAsyncThunk(
  'wildlife/fetchSpecies',
  async (filters?: WildlifeFilters) => {
    const response = await WildlifeService.getSpecies(filters);
    return response;
  }
);

export const fetchSpeciesById = createAsyncThunk(
  'wildlife/fetchSpeciesById',
  async (speciesId: string) => {
    const response = await WildlifeService.getSpeciesById(speciesId);
    return response;
  }
);

export const fetchSightings = createAsyncThunk(
  'wildlife/fetchSightings',
  async (filters?: WildlifeFilters) => {
    const response = await WildlifeService.getSightings(filters);
    return response;
  }
);

export const fetchNearbySightings = createAsyncThunk(
  'wildlife/fetchNearbySightings',
  async (params: { location: Coordinates; radius: number }) => {
    const response = await WildlifeService.getNearbySightings(params);
    return response;
  }
);

export const createSighting = createAsyncThunk(
  'wildlife/createSighting',
  async (sighting: Omit<WildlifeSighting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await WildlifeService.createSighting(sighting);
    return response;
  }
);

export const verifySighting = createAsyncThunk(
  'wildlife/verifySighting',
  async (params: { sightingId: string; status: VerificationStatus; notes?: string }) => {
    const response = await WildlifeService.verifySighting(params);
    return response;
  }
);

export const fetchMigrationPatterns = createAsyncThunk(
  'wildlife/fetchMigrationPatterns',
  async (speciesId?: string) => {
    const response = await WildlifeService.getMigrationPatterns(speciesId);
    return response;
  }
);

export const fetchActivityPatterns = createAsyncThunk(
  'wildlife/fetchActivityPatterns',
  async (speciesId: string) => {
    const response = await WildlifeService.getActivityPatterns(speciesId);
    return response;
  }
);

export const fetchNearbyHides = createAsyncThunk(
  'wildlife/fetchNearbyHides',
  async (params: { location: Coordinates; radius: number }) => {
    const response = await WildlifeService.getNearbyHides(params);
    return response;
  }
);

export const fetchSightingStatistics = createAsyncThunk(
  'wildlife/fetchSightingStatistics',
  async (params: { speciesId: string; location?: Coordinates; radius?: number }) => {
    const response = await WildlifeService.getSightingStatistics(params);
    return response;
  }
);

const wildlifeSlice = createSlice({
  name: 'wildlife',
  initialState,
  reducers: {
    setSelectedSpecies: (state, action: PayloadAction<WildlifeSpecies | null>) => {
      state.selectedSpecies = action.payload;
    },
    
    setSelectedSighting: (state, action: PayloadAction<WildlifeSighting | null>) => {
      state.selectedSighting = action.payload;
    },
    
    updateSighting: (state, action: PayloadAction<WildlifeSighting>) => {
      const index = state.sightings.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.sightings[index] = action.payload;
      }
    },
    
    addRealtimeSighting: (state, action: PayloadAction<WildlifeSighting>) => {
      state.realtimeSightings.unshift(action.payload);
      // Keep only last 50 realtime sightings
      if (state.realtimeSightings.length > 50) {
        state.realtimeSightings = state.realtimeSightings.slice(0, 50);
      }
      state.lastUpdate = new Date();
    },
    
    setActiveFilters: (state, action: PayloadAction<WildlifeFilters>) => {
      state.activeFilters = action.payload;
    },
    
    updateFilter: (state, action: PayloadAction<Partial<WildlifeFilters>>) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch species
    builder
      .addCase(fetchSpecies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpecies.fulfilled, (state, action) => {
        state.loading = false;
        state.species = action.payload;
      })
      .addCase(fetchSpecies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch species';
      });
    
    // Fetch species by ID
    builder
      .addCase(fetchSpeciesById.fulfilled, (state, action) => {
        state.selectedSpecies = action.payload;
        // Update in list if exists
        const index = state.species.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.species[index] = action.payload;
        }
      });
    
    // Fetch sightings
    builder
      .addCase(fetchSightings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSightings.fulfilled, (state, action) => {
        state.loading = false;
        state.sightings = action.payload;
      })
      .addCase(fetchSightings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sightings';
      });
    
    // Nearby sightings
    builder
      .addCase(fetchNearbySightings.fulfilled, (state, action) => {
        state.nearbySightings = action.payload;
      });
    
    // Create sighting
    builder
      .addCase(createSighting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSighting.fulfilled, (state, action) => {
        state.loading = false;
        state.sightings.unshift(action.payload);
        state.mySightings.unshift(action.payload);
      })
      .addCase(createSighting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create sighting';
      });
    
    // Verify sighting
    builder
      .addCase(verifySighting.fulfilled, (state, action) => {
        const index = state.sightings.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.sightings[index] = action.payload;
        }
      });
    
    // Migration patterns
    builder
      .addCase(fetchMigrationPatterns.fulfilled, (state, action) => {
        state.migrationPatterns = action.payload;
        // Filter active migrations based on current date
        const now = new Date();
        state.activeMigrations = action.payload.filter(pattern => {
          const spring = pattern.timing.springMigration;
          const fall = pattern.timing.fallMigration;
          return (
            (spring && now >= spring.start && now <= spring.end) ||
            (fall && now >= fall.start && now <= fall.end)
          );
        });
      });
    
    // Activity patterns
    builder
      .addCase(fetchActivityPatterns.fulfilled, (state, action) => {
        const speciesId = action.meta.arg;
        state.activityPatterns[speciesId] = action.payload;
      });
    
    // Nearby hides
    builder
      .addCase(fetchNearbyHides.fulfilled, (state, action) => {
        state.nearbyHides = action.payload;
      });
    
    // Sighting statistics
    builder
      .addCase(fetchSightingStatistics.fulfilled, (state, action) => {
        const speciesId = action.meta.arg.speciesId;
        state.sightingStats[speciesId] = action.payload;
      });
  },
});

export const {
  setSelectedSpecies,
  setSelectedSighting,
  updateSighting,
  addRealtimeSighting,
  setActiveFilters,
  updateFilter,
  clearFilters,
  clearError,
} = wildlifeSlice.actions;

export default wildlifeSlice.reducer;