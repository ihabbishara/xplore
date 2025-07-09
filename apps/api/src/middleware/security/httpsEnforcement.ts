import { Request, Response, NextFunction } from 'express'
import { logger } from '@/shared/utils/logger'

export const httpsEnforcementMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip HTTPS enforcement in development
  if (process.env.NODE_ENV === 'development') {
    return next()
  }

  // Check if request is already HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next()
  }

  // Log the HTTP request attempt
  logger.warn({
    message: 'Insecure HTTP request redirected to HTTPS',
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
  })

  // Redirect to HTTPS
  const httpsUrl = `https://${req.headers.host}${req.url}`
  res.redirect(301, httpsUrl)
}