import { configureStore } from '@reduxjs/toolkit'
import { authSlice } from '@/domains/auth/store/authSlice'
import { userSlice } from '@/domains/users/store/userSlice'
import locationReducer from '@/domains/locations/store/locationSlice'
import poiReducer from '@/domains/poi/store/poiSlice'
import mapReducer from '@/domains/poi/store/mapSlice'
import emergencyReducer from '@/domains/emergency/store/emergencySlice'
import safetyReducer from '@/domains/emergency/store/safetySlice'
import wildlifeReducer from '@/domains/wildlife/store/wildlifeSlice'
import communityReducer from '@/domains/wildlife/store/communitySlice'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
    locations: locationReducer,
    poi: poiReducer,
    map: mapReducer,
    emergency: emergencyReducer,
    safety: safetyReducer,
    wildlife: wildlifeReducer,
    community: communityReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export hooks
export * from './hooks'