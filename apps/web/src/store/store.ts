import { configureStore } from '@reduxjs/toolkit'

// Simple counter slice for testing
const counterSlice = {
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state: any) => {
      state.value += 1
    },
    decrement: (state: any) => {
      state.value -= 1
    },
  },
}

// Create a simple reducer
const counterReducer = (state = counterSlice.initialState, action: any) => {
  switch (action.type) {
    case 'counter/increment':
      return { ...state, value: state.value + 1 }
    case 'counter/decrement':
      return { ...state, value: state.value - 1 }
    default:
      return state
  }
}

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch