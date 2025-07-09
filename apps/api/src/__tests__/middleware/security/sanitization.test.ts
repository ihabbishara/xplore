import express from 'express'
import request from 'supertest'
import { sanitizationMiddleware, sanitizeInput } from '@/middleware/security/sanitization'
import { logger } from '@/shared/utils/logger'

jest.mock('@/shared/utils/logger')

describe('Sanitization Middleware', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use(sanitizationMiddleware)
    
    // Test routes
    app.post('/api/test', (req, res) => {
      res.json({ received: req.body })
    })
    
    app.get('/api/search', (req, res) => {
      res.json({ query: req.query })
    })
    
    app.get('/api/user/:id', (req, res) => {
      res.json({ params: req.params })
    })

    jest.clearAllMocks()
  })

  describe('sanitizeInput function', () => {
    it('should remove script tags from strings', () => {
      const input = 'Hello <script>alert("XSS")</script> World'
      const sanitized = sanitizeInput(input)
      expect(sanitized).toBe('Hello  World')
    })

    it('should remove SQL injection attempts', () => {
      const input = "'; DROP TABLE users; --"
      const sanitized = sanitizeInput(input)
      expect(sanitized).toBe(' DROP TABLE users --')
    })

    it('should allow safe HTML tags', () => {
      const input = 'Hello <b>World</b> and <i>Universe</i>'
      const sanitized = sanitizeInput(input)
      expect(sanitized).toBe('Hello <b>World</b> and <i>Universe</i>')
    })

    it('should sanitize nested objects', () => {
      const input = {
        name: '<script>alert("XSS")</script>John',
        bio: 'Hello <b>World</b>',
        metadata: {
          description: "'; DROP TABLE --",
        },
      }
      const sanitized = sanitizeInput(input)
      
      expect(sanitized.name).toBe('John')
      expect(sanitized.bio).toBe('Hello <b>World</b>')
      expect(sanitized.metadata.description).toBe(' DROP TABLE --')
    })

    it('should sanitize arrays', () => {
      const input = ['<script>alert(1)</script>', 'Normal text', "'; DELETE FROM users;"]
      const sanitized = sanitizeInput(input)
      
      expect(sanitized[0]).toBe('')
      expect(sanitized[1]).toBe('Normal text')
      expect(sanitized[2]).toBe(' DELETE FROM users')
    })

    it('should handle non-string values', () => {
      expect(sanitizeInput(123)).toBe(123)
      expect(sanitizeInput(true)).toBe(true)
      expect(sanitizeInput(null)).toBe(null)
      expect(sanitizeInput(undefined)).toBe(undefined)
    })
  })

  describe('Request Body Sanitization', () => {
    it('should sanitize request body', async () => {
      const maliciousBody = {
        name: 'John<script>alert("XSS")</script>',
        comment: 'Hello <b>World</b>',
        injection: "'; DROP TABLE users; --",
      }

      const response = await request(app)
        .post('/api/test')
        .send(maliciousBody)

      expect(response.status).toBe(200)
      expect(response.body.received.name).toBe('John')
      expect(response.body.received.comment).toBe('Hello <b>World</b>')
      expect(response.body.received.injection).toBe(' DROP TABLE users --')
    })

    it('should log when sanitization modifies input', async () => {
      const maliciousBody = {
        xss: '<script>alert("XSS")</script>',
      }

      await request(app)
        .post('/api/test')
        .send(maliciousBody)

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Input sanitization modified request',
          path: '/api/test',
          method: 'POST',
        })
      )
    })

    it('should not log when input is already clean', async () => {
      const cleanBody = {
        name: 'John Doe',
        comment: 'Hello World',
      }

      await request(app)
        .post('/api/test')
        .send(cleanBody)

      expect(logger.warn).not.toHaveBeenCalled()
    })
  })

  describe('Query Parameter Sanitization', () => {
    it('should sanitize query parameters', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({
          q: '<script>alert("XSS")</script>search',
          filter: "'; DROP TABLE --",
        })

      expect(response.status).toBe(200)
      expect(response.body.query.q).toBe('search')
      expect(response.body.query.filter).toBe(' DROP TABLE --')
    })
  })

  describe('URL Parameter Sanitization', () => {
    it('should sanitize URL parameters', async () => {
      const response = await request(app)
        .get('/api/user/<script>alert("XSS")</script>123')

      expect(response.status).toBe(200)
      expect(response.body.params.id).toBe('123')
    })
  })

  describe('Error Handling', () => {
    it('should handle sanitization errors gracefully', async () => {
      // Override sanitizeInput to throw an error
      jest.spyOn(global.JSON, 'stringify').mockImplementationOnce(() => {
        throw new Error('Circular reference')
      })

      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_INPUT')
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error in sanitization middleware',
          error: 'Circular reference',
        })
      )
    })
  })

  describe('Complex Data Structures', () => {
    it('should handle deeply nested objects', async () => {
      const complexData = {
        level1: {
          level2: {
            level3: {
              xss: '<img src=x onerror=alert("XSS")>',
              safe: 'This is safe text',
            },
          },
          array: ['<script>bad</script>', 'good'],
        },
      }

      const response = await request(app)
        .post('/api/test')
        .send(complexData)

      expect(response.body.received.level1.level2.level3.xss).toBe('<img src="x">')
      expect(response.body.received.level1.level2.level3.safe).toBe('This is safe text')
      expect(response.body.received.level1.array[0]).toBe('')
      expect(response.body.received.level1.array[1]).toBe('good')
    })
  })
})