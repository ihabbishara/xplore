import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import {
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
} from '../store/mapSlice';
import { LatLng, LatLngBounds, POIType, POI } from '../types/poi';

export const useMapStore = () => {
  const dispatch = useDispatch<AppDispatch>();
  const mapState = useSelector((state: RootState) => state.map);

  return {
    // State
    ...mapState,
    
    // Map positioning
    setCenter: (center: LatLng) => dispatch(setCenter(center)),
    setZoom: (zoom: number) => dispatch(setZoom(zoom)),
    setBounds: (bounds: LatLngBounds) => dispatch(setBounds(bounds)),
    setMapView: (view: { center: LatLng; zoom: number; bounds?: LatLngBounds }) => 
      dispatch(setMapView(view)),
    
    // Layer management
    toggleLayer: (type: POIType) => dispatch(toggleLayer(type)),
    enableLayer: (type: POIType) => dispatch(enableLayer(type)),
    disableLayer: (type: POIType) => dispatch(disableLayer(type)),
    setActiveLayers: (types: POIType[]) => dispatch(setActiveLayers(types)),
    
    // Layer configuration
    updateLayerConfig: (type: POIType, config: any) => 
      dispatch(updateLayerConfig({ type, config })),
    resetLayerConfigs: () => dispatch(resetLayerConfigs()),
    
    // POI selection
    setSelectedPOI: (poi: POI | null) => dispatch(setSelectedPOI(poi)),
    clearSelectedPOI: () => dispatch(clearSelectedPOI()),
    setHoveredPOI: (poi: POI | null) => dispatch(setHoveredPOI(poi)),
    clearHoveredPOI: () => dispatch(clearHoveredPOI()),
    
    // Route corridor
    setShowRouteCorridor: (show: boolean) => dispatch(setShowRouteCorridor(show)),
    setRouteCorridorRadius: (radius: number) => dispatch(setRouteCorridorRadius(radius)),
    
    // Utility actions
    fitBounds: (bounds: LatLngBounds) => dispatch(fitBounds(bounds)),
    enableAllLayers: () => dispatch(enableAllLayers()),
    disableAllLayers: () => dispatch(disableAllLayers()),
    resetToDefaults: () => dispatch(resetToDefaults()),
  };
};