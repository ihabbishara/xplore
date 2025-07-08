import { configureStore } from '@reduxjs/toolkit'
import { authSlice } from '@/domains/auth/store/authSlice'
import { userSlice } from '@/domains/users/store/userSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch