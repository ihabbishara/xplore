import {createSlice} from '@reduxjs/toolkit';

interface JournalState {
  entries: any[];
  currentEntry: any | null;
  isLoading: boolean;
}

const initialState: JournalState = {
  entries: [],
  currentEntry: null,
  isLoading: false,
};

const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {},
});

export default journalSlice.reducer;