import {createSlice} from '@reduxjs/toolkit';

interface ChecklistState {
  checklists: any[];
  currentChecklist: any | null;
  isLoading: boolean;
}

const initialState: ChecklistState = {
  checklists: [],
  currentChecklist: null,
  isLoading: false,
};

const checklistSlice = createSlice({
  name: 'checklists',
  initialState,
  reducers: {},
});

export default checklistSlice.reducer;