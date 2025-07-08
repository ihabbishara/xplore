import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserProfile } from '@xplore/shared'

interface UserState {
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchProfileStart: (state) => {
      state.loading = true
      state.error = null
    },
    fetchProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload
      state.loading = false
      state.error = null
    },
    fetchProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload }
      }
    },
    clearProfile: (state) => {
      state.profile = null
      state.loading = false
      state.error = null
    },
  },
})

export const {
  fetchProfileStart,
  fetchProfileSuccess,
  fetchProfileFailure,
  updateProfile,
  clearProfile,
} = userSlice.actions