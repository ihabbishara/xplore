import {createSlice} from '@reduxjs/toolkit';

interface AnalyticsState {
  insights: any[];
  dashboardData: any | null;
  isLoading: boolean;
}

const initialState: AnalyticsState = {
  insights: [],
  dashboardData: null,
  isLoading: false,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
});

export default analyticsSlice.reducer;