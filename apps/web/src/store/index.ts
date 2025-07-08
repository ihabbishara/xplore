import { configureStore } from '@reduxjs/toolkit'
import { authSlice } from '@/domains/auth/store/authSlice'
import { userSlice } from '@/domains/users/store/userSlice'
import locationReducer from '@/domains/locations/store/locationSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
    locations: locationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch