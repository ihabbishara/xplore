import { apiClient } from '@/lib/api/client'
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  VerifyEmailRequest,
} from '@xplore/shared'

export class AuthService {
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/register', data)
    return response.data.data
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/login', data)
    return response.data.data
  }

  static async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse['tokens']> {
    const response = await apiClient.post<{ data: { tokens: AuthResponse['tokens'] } }>(
      '/auth/refresh',
      data
    )
    return response.data.data.tokens
  }

  static async verifyEmail(data: VerifyEmailRequest): Promise<void> {
    await apiClient.post('/auth/verify-email', data)
  }

  static async logout(refreshToken?: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken })
  }

  static async getMe(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<{ data: AuthResponse['user'] }>('/auth/me')
    return response.data.data
  }

  // Store tokens in localStorage
  static storeTokens(tokens: AuthResponse['tokens']): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)
    }
  }

  // Get tokens from localStorage
  static getStoredTokens(): AuthResponse['tokens'] | null {
    if (typeof window === 'undefined') return null

    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (!accessToken || !refreshToken) return null

    return { accessToken, refreshToken }
  }

  // Clear tokens from localStorage
  static clearStoredTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }
}