import { configureStore } from '@reduxjs/toolkit'

const simpleSlice = {
  name: 'simple',
  initialState: { value: 0 },
  reducers: {
    increment: (state: any) => {
      state.value += 1
    },
  },
}

export const simpleStore = configureStore({
  reducer: {
    simple: (state = simpleSlice.initialState, action: any) => {
      switch (action.type) {
        case 'simple/increment':
          return { ...state, value: state.value + 1 }
        default:
          return state
      }
    },
  },
})

export type SimpleRootState = ReturnType<typeof simpleStore.getState>
export type SimpleAppDispatch = typeof simpleStore.dispatch