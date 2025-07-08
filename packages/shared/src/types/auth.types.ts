export interface JWTPayload {
  userId: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  provider: 'google' | 'facebook';
  idToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
    };
  };
  tokens: AuthTokens;
}