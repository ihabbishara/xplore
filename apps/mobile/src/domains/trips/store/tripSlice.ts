import {createSlice} from '@reduxjs/toolkit';

interface TripState {
  trips: any[];
  currentTrip: any | null;
  isLoading: boolean;
}

const initialState: TripState = {
  trips: [],
  currentTrip: null,
  isLoading: false,
};

const tripSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {},
});

export default tripSlice.reducer;