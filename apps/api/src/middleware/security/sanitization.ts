import { Request, Response, NextFunction } from 'express'
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import { logger } from '@/shared/utils/logger'

// Create a DOMPurify instance with jsdom
const window = new JSDOM('').window
const purify = DOMPurify(window as any)

// Configure DOMPurify
const sanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target'],
  ALLOW_DATA_ATTR: false,
}

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove any script tags and dangerous content
    const cleaned = purify.sanitize(input, sanitizeConfig)
    // Also remove any potential SQL injection attempts
    return cleaned
      .replace(/[';\\]/g, '') // Remove common SQL injection characters
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key])
      }
    }
    return sanitized
  }
  
  return input
}

export const sanitizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize request body
    if (req.body) {
      const originalBody = JSON.stringify(req.body)
      req.body = sanitizeInput(req.body)
      
      if (JSON.stringify(req.body) !== originalBody) {
        logger.warn({
          message: 'Input sanitization modified request',
          ip: req.ip,
          path: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        })
      }
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeInput(req.query)
    }

    // Sanitize params
    if (req.params) {
      req.params = sanitizeInput(req.params)
    }

    next()
  } catch (error) {
    logger.error({
      message: 'Error in sanitization middleware',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path,
    })
    
    res.status(400).json({
      error: {
        message: 'Invalid input data',
        code: 'INVALID_INPUT',
      },
    })
  }
}