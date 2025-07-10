import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import {
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
  searchPOIs,
  createCustomPOI,
  fetchPOICollections,
  fetchRouteAwareSuggestions,
} from '../store/poiSlice';

export const usePoiStore = () => {
  const dispatch = useDispatch<AppDispatch>();
  const poiState = useSelector((state: RootState) => state.poi);

  return {
    // State
    ...poiState,
    
    // Actions
    addPOI: (poi: any) => dispatch(addPOI(poi)),
    updatePOI: (poi: any) => dispatch(updatePOI(poi)),
    removePOI: (id: string) => dispatch(removePOI(id)),
    
    // Filters
    setActiveFilters: (filters: any) => dispatch(setActiveFilters(filters)),
    updateFilter: (filter: any) => dispatch(updateFilter(filter)),
    clearFilters: () => dispatch(clearFilters()),
    
    // Search
    setSearchResults: (results: any) => dispatch(setSearchResults(results)),
    clearSearchResults: () => dispatch(clearSearchResults()),
    searchPOIs: (params: any) => dispatch(searchPOIs(params)),
    
    // Collections
    addCollection: (collection: any) => dispatch(addCollection(collection)),
    updateCollection: (collection: any) => dispatch(updateCollection(collection)),
    removeCollection: (id: string) => dispatch(removeCollection(id)),
    fetchCollections: () => dispatch(fetchPOICollections()),
    
    // Suggestions
    setSuggestions: (suggestions: any) => dispatch(setSuggestions(suggestions)),
    clearSuggestions: () => dispatch(clearSuggestions()),
    fetchRouteAwareSuggestions: (params: any) => dispatch(fetchRouteAwareSuggestions(params)),
    
    // Cache
    setCacheEntry: (entry: any) => dispatch(setCacheEntry(entry)),
    clearCache: () => dispatch(clearCache()),
    
    // Bounds
    setLastSearchBounds: (bounds: any) => dispatch(setLastSearchBounds(bounds)),
    
    // Error handling
    setError: (error: string | null) => dispatch(setError(error)),
    clearError: () => dispatch(clearError()),
    
    // Async actions
    createCustomPOI: (poiData: any) => dispatch(createCustomPOI(poiData)),
  };
};