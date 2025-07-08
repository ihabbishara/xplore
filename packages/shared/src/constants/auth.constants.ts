export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  EMAIL_VERIFICATION_EXPIRY: '24h',
  PASSWORD_RESET_EXPIRY: '1h',
  RATE_LIMIT: {
    REGISTER: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 registration attempts per hour
    },
    LOGIN: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 login attempts per 15 minutes
    },
  },
} as const;