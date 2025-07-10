import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapState, LatLng, LatLngBounds, POIType, POI, DEFAULT_POI_LAYERS } from '../types/poi';

// Initial state
const initialState: MapState = {
  center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
  zoom: 10,
  bounds: undefined,
  activeLayers: [POIType.CAMPING, POIType.ACCOMMODATION, POIType.VILLAGE, POIType.ATTRACTION, POIType.VIEWPOINT, POIType.CUSTOM],
  layerConfigs: DEFAULT_POI_LAYERS,
  selectedPOI: null,
  hoveredPOI: null,
  showRouteCorridorr: false,
  routeCorridorRadius: 5, // 5 kilometers
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    // Map positioning
    setCenter: (state, action: PayloadAction<LatLng>) => {
      state.center = action.payload;
    },
    
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    
    setBounds: (state, action: PayloadAction<LatLngBounds>) => {
      state.bounds = action.payload;
    },
    
    setMapView: (state, action: PayloadAction<{ center: LatLng; zoom: number; bounds?: LatLngBounds }>) => {
      state.center = action.payload.center;
      state.zoom = action.payload.zoom;
      if (action.payload.bounds) {
        state.bounds = action.payload.bounds;
      }
    },
    
    // Layer management
    toggleLayer: (state, action: PayloadAction<POIType>) => {
      const layerType = action.payload;
      if (state.activeLayers.includes(layerType)) {
        state.activeLayers = state.activeLayers.filter(type => type !== layerType);
      } else {
        state.activeLayers.push(layerType);
      }
    },
    
    enableLayer: (state, action: PayloadAction<POIType>) => {
      if (!state.activeLayers.includes(action.payload)) {
        state.activeLayers.push(action.payload);
      }
    },
    
    disableLayer: (state, action: PayloadAction<POIType>) => {
      state.activeLayers = state.activeLayers.filter(type => type !== action.payload);
    },
    
    setActiveLayers: (state, action: PayloadAction<POIType[]>) => {
      state.activeLayers = action.payload;
    },
    
    // Layer configuration
    updateLayerConfig: (state, action: PayloadAction<{ type: POIType; config: Partial<typeof DEFAULT_POI_LAYERS[POIType]> }>) => {
      const { type, config } = action.payload;
      state.layerConfigs[type] = { ...state.layerConfigs[type], ...config };
    },
    
    resetLayerConfigs: (state) => {
      state.layerConfigs = DEFAULT_POI_LAYERS;
    },
    
    // POI selection
    setSelectedPOI: (state, action: PayloadAction<POI | null>) => {
      state.selectedPOI = action.payload;
    },
    
    clearSelectedPOI: (state) => {
      state.selectedPOI = null;
    },
    
    setHoveredPOI: (state, action: PayloadAction<POI | null>) => {
      state.hoveredPOI = action.payload;
    },
    
    clearHoveredPOI: (state) => {
      state.hoveredPOI = null;
    },
    
    // Route corridor
    setShowRouteCorridor: (state, action: PayloadAction<boolean>) => {
      state.showRouteCorridorr = action.payload;
    },
    
    setRouteCorridorRadius: (state, action: PayloadAction<number>) => {
      state.routeCorridorRadius = action.payload;
    },
    
    // Utility actions
    fitBounds: (state, action: PayloadAction<LatLngBounds>) => {
      state.bounds = action.payload;
      // Calculate center from bounds
      const centerLat = (action.payload.north + action.payload.south) / 2;
      const centerLng = (action.payload.east + action.payload.west) / 2;
      state.center = { lat: centerLat, lng: centerLng };
      
      // Calculate appropriate zoom level (simplified)
      const latDiff = action.payload.north - action.payload.south;
      const lngDiff = action.payload.east - action.payload.west;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      // Simple zoom calculation based on bounds size
      let zoom = 10;
      if (maxDiff < 0.01) zoom = 16;
      else if (maxDiff < 0.1) zoom = 14;
      else if (maxDiff < 1) zoom = 12;
      else if (maxDiff < 10) zoom = 10;
      else zoom = 8;
      
      state.zoom = zoom;
    },
    
    // Batch layer operations
    enableAllLayers: (state) => {
      state.activeLayers = Object.keys(DEFAULT_POI_LAYERS) as POIType[];
    },
    
    disableAllLayers: (state) => {
      state.activeLayers = [];
    },
    
    resetToDefaults: (state) => {
      state.activeLayers = [POIType.CAMPING, POIType.ACCOMMODATION, POIType.VILLAGE, POIType.ATTRACTION, POIType.VIEWPOINT, POIType.CUSTOM];
      state.selectedPOI = null;
      state.hoveredPOI = null;
      state.showRouteCorridorr = false;
      state.routeCorridorRadius = 5;
    },
  },
});

export const {
  setCenter,
  setZoom,
  setBounds,
  setMapView,
  toggleLayer,
  enableLayer,
  disableLayer,
  setActiveLayers,
  updateLayerConfig,
  resetLayerConfigs,
  setSelectedPOI,
  clearSelectedPOI,
  setHoveredPOI,
  clearHoveredPOI,
  setShowRouteCorridor,
  setRouteCorridorRadius,
  fitBounds,
  enableAllLayers,
  disableAllLayers,
  resetToDefaults,
} = mapSlice.actions;

export default mapSlice.reducer;