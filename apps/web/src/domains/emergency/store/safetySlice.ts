import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { EmergencyService } from '../services/emergencyService';
import {
  SafetyScore,
  EmergencyKit,
  MedicationReminder,
  HealthCondition,
  WaterSource,
  TravelAdvisory,
  Coordinates,
  SafetyFilters,
} from '../types/emergency';

interface SafetyState {
  // Safety scores and advisories
  safetyScore: SafetyScore | null;
  travelAdvisories: TravelAdvisory[];
  
  // Emergency kits
  emergencyKits: EmergencyKit[];
  activeKit: EmergencyKit | null;
  
  // Health and medication
  medications: MedicationReminder[];
  healthConditions: HealthCondition[];
  nextMedicationReminder: MedicationReminder | null;
  
  // Water safety
  waterSources: WaterSource[];
  nearbyWaterSources: WaterSource[];
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Filters
  activeFilters: SafetyFilters;
  
  // Offline data
  offlineKits: EmergencyKit[];
  offlineWaterTreatmentGuides: any[];
}

const initialState: SafetyState = {
  safetyScore: null,
  travelAdvisories: [],
  emergencyKits: [],
  activeKit: null,
  medications: [],
  healthConditions: [],
  nextMedicationReminder: null,
  waterSources: [],
  nearbyWaterSources: [],
  loading: false,
  error: null,
  activeFilters: {},
  offlineKits: [],
  offlineWaterTreatmentGuides: [],
};

// Async thunks
export const fetchSafetyScore = createAsyncThunk(
  'safety/fetchScore',
  async (location: Coordinates) => {
    const response = await EmergencyService.getSafetyScore(location);
    return response;
  }
);

export const fetchTravelAdvisories = createAsyncThunk(
  'safety/fetchAdvisories',
  async (country: string) => {
    const response = await EmergencyService.getTravelAdvisories(country);
    return response;
  }
);

export const createEmergencyKit = createAsyncThunk(
  'safety/createKit',
  async (kit: Omit<EmergencyKit, 'id'>) => {
    const response = await EmergencyService.createEmergencyKit(kit);
    return response;
  }
);

export const addMedicationReminder = createAsyncThunk(
  'safety/addMedication',
  async (medication: Omit<MedicationReminder, 'id'>) => {
    const response = await EmergencyService.addMedicationReminder(medication);
    return response;
  }
);

export const addHealthCondition = createAsyncThunk(
  'safety/addHealthCondition',
  async (condition: Omit<HealthCondition, 'id'>) => {
    const response = await EmergencyService.addHealthCondition(condition);
    return response;
  }
);

export const fetchNearbyWaterSources = createAsyncThunk(
  'safety/fetchWaterSources',
  async (params: { location: Coordinates; radius: number }) => {
    const response = await EmergencyService.getNearbyWaterSources(params);
    return response;
  }
);

export const testWaterQuality = createAsyncThunk(
  'safety/testWater',
  async (params: { sourceId: string; testKit?: string }) => {
    const response = await EmergencyService.testWaterQuality(params);
    return response;
  }
);

const safetySlice = createSlice({
  name: 'safety',
  initialState,
  reducers: {
    setActiveKit: (state, action: PayloadAction<EmergencyKit | null>) => {
      state.activeKit = action.payload;
    },
    
    updateMedicationReminder: (state, action: PayloadAction<MedicationReminder>) => {
      const index = state.medications.findIndex(med => med.id === action.payload.id);
      if (index !== -1) {
        state.medications[index] = action.payload;
      }
    },
    
    removeMedicationReminder: (state, action: PayloadAction<string>) => {
      state.medications = state.medications.filter(med => med.id !== action.payload);
    },
    
    updateHealthCondition: (state, action: PayloadAction<HealthCondition>) => {
      const index = state.healthConditions.findIndex(condition => condition.id === action.payload.id);
      if (index !== -1) {
        state.healthConditions[index] = action.payload;
      }
    },
    
    removeHealthCondition: (state, action: PayloadAction<string>) => {
      state.healthConditions = state.healthConditions.filter(
        condition => condition.id !== action.payload
      );
    },
    
    setNextMedicationReminder: (state, action: PayloadAction<MedicationReminder | null>) => {
      state.nextMedicationReminder = action.payload;
    },
    
    updateWaterSource: (state, action: PayloadAction<WaterSource>) => {
      const index = state.waterSources.findIndex(source => source.id === action.payload.id);
      if (index !== -1) {
        state.waterSources[index] = action.payload;
      }
    },
    
    setSafetyFilters: (state, action: PayloadAction<SafetyFilters>) => {
      state.activeFilters = action.payload;
    },
    
    addOfflineKit: (state, action: PayloadAction<EmergencyKit>) => {
      state.offlineKits.push(action.payload);
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Safety score
    builder
      .addCase(fetchSafetyScore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSafetyScore.fulfilled, (state, action) => {
        state.loading = false;
        state.safetyScore = action.payload;
      })
      .addCase(fetchSafetyScore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch safety score';
      });
    
    // Travel advisories
    builder
      .addCase(fetchTravelAdvisories.fulfilled, (state, action) => {
        state.travelAdvisories = action.payload;
      });
    
    // Emergency kits
    builder
      .addCase(createEmergencyKit.fulfilled, (state, action) => {
        state.emergencyKits.push(action.payload);
      });
    
    // Medications
    builder
      .addCase(addMedicationReminder.fulfilled, (state, action) => {
        state.medications.push(action.payload);
      });
    
    // Health conditions
    builder
      .addCase(addHealthCondition.fulfilled, (state, action) => {
        state.healthConditions.push(action.payload);
      });
    
    // Water sources
    builder
      .addCase(fetchNearbyWaterSources.fulfilled, (state, action) => {
        state.nearbyWaterSources = action.payload;
      });
    
    // Water quality test
    builder
      .addCase(testWaterQuality.fulfilled, (state, action) => {
        const index = state.waterSources.findIndex(
          source => source.id === action.payload.id
        );
        if (index !== -1) {
          state.waterSources[index] = action.payload;
        }
      });
  },
});

export const {
  setActiveKit,
  updateMedicationReminder,
  removeMedicationReminder,
  updateHealthCondition,
  removeHealthCondition,
  setNextMedicationReminder,
  updateWaterSource,
  setSafetyFilters,
  addOfflineKit,
  clearError,
} = safetySlice.actions;

export default safetySlice.reducer;