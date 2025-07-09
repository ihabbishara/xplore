import { Application } from 'express'
import cors from 'cors'
import { helmetMiddleware } from './helmet'
import { authRateLimiter, apiRateLimiter } from './rateLimit'
import { csrfProtection, csrfTokenMiddleware } from './csrf'
import { sanitizationMiddleware } from './sanitization'
import { httpsEnforcementMiddleware } from './httpsEnforcement'
import { getSecurityConfig } from '@/config/security'
import { logger } from '@/shared/utils/logger'

export const setupSecurityMiddleware = (app: Application) => {
  const config = getSecurityConfig()
  
  logger.info('Setting up security middleware')

  // 1. HTTPS enforcement (should be first)
  app.use(httpsEnforcementMiddleware)

  // 2. Helmet for security headers
  app.use(helmetMiddleware())

  // 3. CORS configuration
  app.use(cors(config.cors))

  // 4. Input sanitization (before any parsing)
  app.use(sanitizationMiddleware)

  // 5. Rate limiting for auth routes
  app.use('/api/auth', authRateLimiter())

  // 6. General API rate limiting
  app.use('/api', apiRateLimiter())

  // 7. CSRF protection for state-changing routes
  app.use(csrfProtection())

  // 8. CSRF token endpoint
  app.use(csrfTokenMiddleware)

  logger.info('Security middleware setup complete')
}

// Export individual middleware for testing
export {
  helmetMiddleware,
  authRateLimiter,
  apiRateLimiter,
  csrfProtection,
  csrfTokenMiddleware,
  sanitizationMiddleware,
  httpsEnforcementMiddleware,
}