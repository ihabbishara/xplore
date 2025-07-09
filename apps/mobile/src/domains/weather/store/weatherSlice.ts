import {createSlice} from '@reduxjs/toolkit';

interface WeatherState {
  currentWeather: any | null;
  forecast: any[];
  isLoading: boolean;
}

const initialState: WeatherState = {
  currentWeather: null,
  forecast: [],
  isLoading: false,
};

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {},
});

export default weatherSlice.reducer;