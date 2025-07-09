import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Location} from '../types/location.types';

interface LocationState {
  searchResults: Location[];
  favorites: Location[];
  currentLocation: Location | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  searchResults: [],
  favorites: [],
  currentLocation: null,
  isLoading: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    setSearchResults: (state, action: PayloadAction<Location[]>) => {
      state.searchResults = action.payload;
      state.error = null;
    },
    setFavorites: (state, action: PayloadAction<Location[]>) => {
      state.favorites = action.payload;
    },
    setCurrentLocation: (state, action: PayloadAction<Location | null>) => {
      state.currentLocation = action.payload;
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const locationId = action.payload;
      // Toggle in search results
      const searchIndex = state.searchResults.findIndex(l => l.id === locationId);
      if (searchIndex !== -1) {
        state.searchResults[searchIndex].isFavorite = !state.searchResults[searchIndex].isFavorite;
      }
      // Toggle in current location
      if (state.currentLocation?.id === locationId) {
        state.currentLocation.isFavorite = !state.currentLocation.isFavorite;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSearchResults,
  setFavorites,
  setCurrentLocation,
  toggleFavorite,
  setLoading,
  setError,
} = locationSlice.actions;

export default locationSlice.reducer;