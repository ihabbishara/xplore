import axios, { AxiosError } from 'axios'
import { auth } from '@/lib/firebase/config'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get Firebase ID token if user is authenticated
    if (typeof window !== 'undefined' && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.warn('Failed to get Firebase ID token:', error)
        // Continue without token if Firebase token retrieval fails
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        try {
          const { store } = require('@/store')
          const { logout } = require('@/domains/auth/store/authSlice')
          store.dispatch(logout())
          
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/auth')) {
            window.location.href = '/auth/login'
          }
        } catch (storeError) {
          // Store not available, just redirect
          window.location.href = '/auth/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}