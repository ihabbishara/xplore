import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AuthResponse } from '@xplore/shared'

interface FirebaseUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  isAuthenticated: boolean
}

interface AuthState {
  isAuthenticated: boolean
  user: AuthResponse['user'] | FirebaseUser | null
  tokens: AuthResponse['tokens'] | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: false,
  error: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.tokens = action.payload.tokens
      state.loading = false
      state.error = null
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false
      state.user = null
      state.tokens = null
      state.loading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.tokens = null
      state.loading = false
      state.error = null
    },
    updateUser: (state, action: PayloadAction<Partial<AuthResponse['user']>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setUser: (state, action: PayloadAction<FirebaseUser>) => {
      state.isAuthenticated = true
      state.user = action.payload
      state.loading = false
      state.error = null
    },
    clearUser: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.tokens = null
      state.loading = false
      state.error = null
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, setUser, clearUser } = authSlice.actions