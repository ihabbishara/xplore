import {createSlice} from '@reduxjs/toolkit';

interface PropertyState {
  properties: any[];
  currentProperty: any | null;
  isLoading: boolean;
}

const initialState: PropertyState = {
  properties: [],
  currentProperty: null,
  isLoading: false,
};

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {},
});

export default propertySlice.reducer;