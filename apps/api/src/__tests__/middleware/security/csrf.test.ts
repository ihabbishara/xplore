import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { csrfProtection, csrfTokenMiddleware } from '@/middleware/security/csrf'
import { logger } from '@/shared/utils/logger'

jest.mock('@/shared/utils/logger')

describe('CSRF Protection Middleware', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(csrfProtection())
    app.use(csrfTokenMiddleware)
    
    // Test routes
    app.get('/api/csrf-token', (req, res) => {
      res.json({ csrfToken: req.csrfToken() })
    })
    
    app.post('/api/data', (req, res) => {
      res.json({ success: true })
    })
    
    app.get('/api/data', (req, res) => {
      res.json({ data: 'test' })
    })

    jest.clearAllMocks()
  })

  describe('CSRF Token Generation', () => {
    it('should provide CSRF token on GET /api/csrf-token', async () => {
      const response = await request(app).get('/api/csrf-token')
      
      expect(response.status).toBe(200)
      expect(response.body.csrfToken).toBeDefined()
      expect(typeof response.body.csrfToken).toBe('string')
    })

    it('should set CSRF cookie when generating token', async () => {
      const response = await request(app).get('/api/csrf-token')
      
      expect(response.headers['set-cookie']).toBeDefined()
      const cookies = response.headers['set-cookie']
      const csrfCookie = cookies.find((cookie: string) => cookie.includes('_csrf'))
      expect(csrfCookie).toBeDefined()
    })
  })

  describe('CSRF Protection', () => {
    it('should allow GET requests without CSRF token', async () => {
      const response = await request(app).get('/api/data')
      
      expect(response.status).toBe(200)
      expect(response.body.data).toBe('test')
    })

    it('should block POST requests without CSRF token', async () => {
      const response = await request(app)
        .post('/api/data')
        .send({ test: 'data' })
      
      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID')
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'CSRF token validation failed',
          method: 'POST',
          path: '/api/data',
        })
      )
    })

    it('should allow POST requests with valid CSRF token', async () => {
      // First get the CSRF token
      const tokenResponse = await request(app).get('/api/csrf-token')
      const csrfToken = tokenResponse.body.csrfToken
      const cookies = tokenResponse.headers['set-cookie']

      // Then make POST request with token
      const response = await request(app)
        .post('/api/data')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ test: 'data' })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should block POST requests with invalid CSRF token', async () => {
      // Get valid cookie but use invalid token
      const tokenResponse = await request(app).get('/api/csrf-token')
      const cookies = tokenResponse.headers['set-cookie']

      const response = await request(app)
        .post('/api/data')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', 'invalid-token')
        .send({ test: 'data' })
      
      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID')
    })
  })

  describe('Excluded Paths', () => {
    it('should skip CSRF protection for /health endpoint', async () => {
      app.get('/health', (req, res) => res.json({ status: 'ok' }))
      
      const response = await request(app).get('/health')
      expect(response.status).toBe(200)
    })

    it('should skip CSRF protection for auth endpoints', async () => {
      app.post('/api/auth/login', (req, res) => res.json({ success: true }))
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
      
      expect(response.status).toBe(200)
    })
  })

  describe('Production Environment', () => {
    let originalEnv: string | undefined

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
    })

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should set secure cookie in production', async () => {
      const prodApp = express()
      prodApp.use(cookieParser())
      prodApp.use(csrfProtection())
      prodApp.get('/api/csrf-token', (req, res) => {
        res.json({ csrfToken: req.csrfToken() })
      })

      const response = await request(prodApp).get('/api/csrf-token')
      const cookies = response.headers['set-cookie']
      const csrfCookie = cookies.find((cookie: string) => cookie.includes('_csrf'))
      
      expect(csrfCookie).toContain('Secure')
      expect(csrfCookie).toContain('SameSite=Strict')
    })
  })
})