export const securityConfig = {
  development: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
        },
      },
      crossOriginEmbedderPolicy: false,
    },
    rateLimit: {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // More lenient in development
        message: 'Too many authentication attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
      },
      api: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 100, // More lenient in development
        message: 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
      },
    },
    csrf: {
      cookie: {
        secure: false, // Not secure in development
        sameSite: 'lax' as const,
        httpOnly: true,
      },
    },
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
      ],
      credentials: true,
    },
  },
  production: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // May need to be stricter
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    },
    rateLimit: {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 requests per windowMs
        message: 'Too many authentication attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
      },
      api: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50, // Limit each IP to 50 requests per windowMs
        message: 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
      },
    },
    csrf: {
      cookie: {
        secure: true,
        sameSite: 'strict' as const,
        httpOnly: true,
      },
    },
    cors: {
      origin: process.env.FRONTEND_URL || 'https://xplore.app',
      credentials: true,
    },
  },
}

export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  return securityConfig[env as keyof typeof securityConfig]
}