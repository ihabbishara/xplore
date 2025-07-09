import csrf from 'csurf'
import { Request, Response, NextFunction } from 'express'
import { getSecurityConfig } from '@/config/security'
import { logger } from '@/shared/utils/logger'

export const csrfProtection = () => {
  const config = getSecurityConfig()
  
  const csrfMiddleware = csrf({
    cookie: config.csrf.cookie,
  })

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for certain paths
    const skipPaths = [
      '/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/auth/firebase',
    ]

    if (skipPaths.includes(req.path) || req.method === 'GET') {
      return next()
    }

    csrfMiddleware(req, res, (err) => {
      if (err) {
        logger.warn({
          message: 'CSRF token validation failed',
          ip: req.ip,
          path: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        })

        res.status(403).json({
          error: {
            message: 'Invalid CSRF token',
            code: 'CSRF_TOKEN_INVALID',
          },
        })
        return
      }
      next()
    })
  }
}

// Middleware to send CSRF token to client
export const csrfTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' && req.path === '/api/csrf-token') {
    res.json({ csrfToken: req.csrfToken ? req.csrfToken() : null })
    return
  }
  next()
}