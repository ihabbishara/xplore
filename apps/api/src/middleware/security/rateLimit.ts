import rateLimit from 'express-rate-limit'
import { getSecurityConfig } from '@/config/security'
import { logger } from '@/shared/utils/logger'

export const authRateLimiter = () => {
  const config = getSecurityConfig()
  
  return rateLimit({
    ...config.rateLimit.auth,
    handler: (req, res) => {
      logger.warn({
        message: 'Rate limit exceeded for authentication',
        ip: req.ip,
        path: req.path,
        userId: (req as any).user?.id,
      })
      
      res.status(429).json({
        error: {
          message: config.rateLimit.auth.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: res.getHeader('Retry-After'),
        },
      })
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health'
    },
  })
}

export const apiRateLimiter = () => {
  const config = getSecurityConfig()
  
  return rateLimit({
    ...config.rateLimit.api,
    handler: (req, res) => {
      logger.warn({
        message: 'Rate limit exceeded for API',
        ip: req.ip,
        path: req.path,
        userId: (req as any).user?.id,
      })
      
      res.status(429).json({
        error: {
          message: config.rateLimit.api.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: res.getHeader('Retry-After'),
        },
      })
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health'
    },
  })
}