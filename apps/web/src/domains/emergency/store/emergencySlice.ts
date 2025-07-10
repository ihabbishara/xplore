import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { EmergencyService } from '../services/emergencyService';
import {
  EmergencyProtocol,
  EmergencyContact,
  WildlifeHazard,
  PlantHazard,
  WeatherHazard,
  EnvironmentalAlert,
  SOSMessage,
  RiskAssessment,
  EmergencyType,
  HazardLevel,
  EmergencyFilters,
  Coordinates,
} from '../types/emergency';

interface EmergencyState {
  // Protocols and guides
  protocols: EmergencyProtocol[];
  activeProtocol: EmergencyProtocol | null;
  
  // Contacts
  emergencyContacts: EmergencyContact[];
  nearbyContacts: EmergencyContact[];
  
  // Hazards
  wildlifeHazards: WildlifeHazard[];
  plantHazards: PlantHazard[];
  weatherHazards: WeatherHazard[];
  environmentalAlerts: EnvironmentalAlert[];
  
  // SOS
  sosActive: boolean;
  sosMessage: SOSMessage | null;
  sosHistory: SOSMessage[];
  
  // Risk assessment
  currentRiskAssessment: RiskAssessment | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  offlineMode: boolean;
  lastSync: Date | null;
  
  // Filters
  activeFilters: EmergencyFilters;
}

const initialState: EmergencyState = {
  protocols: [],
  activeProtocol: null,
  emergencyContacts: [],
  nearbyContacts: [],
  wildlifeHazards: [],
  plantHazards: [],
  weatherHazards: [],
  environmentalAlerts: [],
  sosActive: false,
  sosMessage: null,
  sosHistory: [],
  currentRiskAssessment: null,
  loading: false,
  error: null,
  offlineMode: false,
  lastSync: null,
  activeFilters: {},
};

// Async thunks
export const fetchEmergencyProtocols = createAsyncThunk(
  'emergency/fetchProtocols',
  async (filters?: EmergencyFilters) => {
    const response = await EmergencyService.getEmergencyProtocols(filters);
    return response;
  }
);

export const fetchNearbyContacts = createAsyncThunk(
  'emergency/fetchNearbyContacts',
  async (location: Coordinates) => {
    const response = await EmergencyService.getNearbyEmergencyContacts(location);
    return response;
  }
);

export const sendSOSMessage = createAsyncThunk(
  'emergency/sendSOS',
  async (data: {
    location: Coordinates;
    message: string;
    type: EmergencyType;
    contacts: string[];
    mediaFiles?: string[];
  }) => {
    const response = await EmergencyService.sendSOSMessage(data);
    return response;
  }
);

export const fetchWildlifeHazards = createAsyncThunk(
  'emergency/fetchWildlifeHazards',
  async (location: Coordinates) => {
    const response = await EmergencyService.getWildlifeHazards(location);
    return response;
  }
);

export const fetchPlantHazards = createAsyncThunk(
  'emergency/fetchPlantHazards',
  async (location: Coordinates) => {
    const response = await EmergencyService.getPlantHazards(location);
    return response;
  }
);

export const fetchWeatherHazards = createAsyncThunk(
  'emergency/fetchWeatherHazards',
  async (location: Coordinates) => {
    const response = await EmergencyService.getWeatherHazards(location);
    return response;
  }
);

export const assessRisk = createAsyncThunk(
  'emergency/assessRisk',
  async (params: { location: Coordinates; radius: number }) => {
    const response = await EmergencyService.performRiskAssessment(params);
    return response;
  }
);

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    setActiveProtocol: (state, action: PayloadAction<EmergencyProtocol | null>) => {
      state.activeProtocol = action.payload;
    },
    
    toggleSOS: (state, action: PayloadAction<boolean>) => {
      state.sosActive = action.payload;
    },
    
    addEmergencyContact: (state, action: PayloadAction<EmergencyContact>) => {
      state.emergencyContacts.push(action.payload);
    },
    
    removeEmergencyContact: (state, action: PayloadAction<string>) => {
      state.emergencyContacts = state.emergencyContacts.filter(
        contact => contact.id !== action.payload
      );
    },
    
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },
    
    setActiveFilters: (state, action: PayloadAction<EmergencyFilters>) => {
      state.activeFilters = action.payload;
    },
    
    addEnvironmentalAlert: (state, action: PayloadAction<EnvironmentalAlert>) => {
      state.environmentalAlerts.push(action.payload);
    },
    
    dismissEnvironmentalAlert: (state, action: PayloadAction<string>) => {
      state.environmentalAlerts = state.environmentalAlerts.filter(
        alert => alert.id !== action.payload
      );
    },
    
    updateRiskAssessment: (state, action: PayloadAction<RiskAssessment>) => {
      state.currentRiskAssessment = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    syncOfflineData: (state, action: PayloadAction<{
      protocols: EmergencyProtocol[];
      contacts: EmergencyContact[];
      timestamp: Date;
    }>) => {
      state.protocols = action.payload.protocols;
      state.emergencyContacts = action.payload.contacts;
      state.lastSync = action.payload.timestamp;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch protocols
    builder
      .addCase(fetchEmergencyProtocols.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmergencyProtocols.fulfilled, (state, action) => {
        state.loading = false;
        state.protocols = action.payload;
      })
      .addCase(fetchEmergencyProtocols.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch protocols';
      });
    
    // Fetch nearby contacts
    builder
      .addCase(fetchNearbyContacts.fulfilled, (state, action) => {
        state.nearbyContacts = action.payload;
      });
    
    // Send SOS
    builder
      .addCase(sendSOSMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendSOSMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.sosMessage = action.payload;
        state.sosHistory.push(action.payload);
      })
      .addCase(sendSOSMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to send SOS';
      });
    
    // Wildlife hazards
    builder
      .addCase(fetchWildlifeHazards.fulfilled, (state, action) => {
        state.wildlifeHazards = action.payload;
      });
    
    // Plant hazards
    builder
      .addCase(fetchPlantHazards.fulfilled, (state, action) => {
        state.plantHazards = action.payload;
      });
    
    // Weather hazards
    builder
      .addCase(fetchWeatherHazards.fulfilled, (state, action) => {
        state.weatherHazards = action.payload;
      });
    
    // Risk assessment
    builder
      .addCase(assessRisk.fulfilled, (state, action) => {
        state.currentRiskAssessment = action.payload;
      });
  },
});

export const {
  setActiveProtocol,
  toggleSOS,
  addEmergencyContact,
  removeEmergencyContact,
  setOfflineMode,
  setActiveFilters,
  addEnvironmentalAlert,
  dismissEnvironmentalAlert,
  updateRiskAssessment,
  clearError,
  syncOfflineData,
} = emergencySlice.actions;

export default emergencySlice.reducer;