import express from 'express'
import request from 'supertest'
import { httpsEnforcementMiddleware } from '@/middleware/security/httpsEnforcement'
import { logger } from '@/shared/utils/logger'

jest.mock('@/shared/utils/logger')

describe('HTTPS Enforcement Middleware', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(httpsEnforcementMiddleware)
    app.get('/test', (req, res) => {
      res.json({ success: true })
    })
    jest.clearAllMocks()
  })

  describe('Development Environment', () => {
    it('should not redirect in development', async () => {
      process.env.NODE_ENV = 'development'
      
      const response = await request(app).get('/test')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.headers.location).toBeUndefined()
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

    it('should allow HTTPS requests', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-Proto', 'https')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should redirect HTTP to HTTPS', async () => {
      const response = await request(app)
        .get('/test')
        .set('Host', 'example.com')
      
      expect(response.status).toBe(301)
      expect(response.headers.location).toBe('https://example.com/test')
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insecure HTTP request redirected to HTTPS',
          path: '/test',
          method: 'GET',
        })
      )
    })

    it('should preserve query parameters in redirect', async () => {
      const response = await request(app)
        .get('/test?param1=value1&param2=value2')
        .set('Host', 'example.com')
      
      expect(response.status).toBe(301)
      expect(response.headers.location).toBe('https://example.com/test?param1=value1&param2=value2')
    })

    it('should handle requests with port numbers', async () => {
      const response = await request(app)
        .get('/test')
        .set('Host', 'example.com:3000')
      
      expect(response.status).toBe(301)
      expect(response.headers.location).toBe('https://example.com:3000/test')
    })

    it('should detect HTTPS from req.secure', async () => {
      // Simulate a secure request
      const secureApp = express()
      secureApp.use((req, res, next) => {
        req.secure = true
        next()
      })
      secureApp.use(httpsEnforcementMiddleware)
      secureApp.get('/test', (req, res) => {
        res.json({ success: true })
      })

      const response = await request(secureApp).get('/test')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should log user agent in redirect', async () => {
      const userAgent = 'Mozilla/5.0 (Test Browser)'
      
      await request(app)
        .get('/test')
        .set('Host', 'example.com')
        .set('User-Agent', userAgent)
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: userAgent,
        })
      )
    })
  })

  describe('Different HTTP Methods', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
      
      app.post('/test', (req, res) => res.json({ method: 'POST' }))
      app.put('/test', (req, res) => res.json({ method: 'PUT' }))
      app.delete('/test', (req, res) => res.json({ method: 'DELETE' }))
    })

    afterEach(() => {
      process.env.NODE_ENV = 'test'
    })

    it('should redirect POST requests', async () => {
      const response = await request(app)
        .post('/test')
        .set('Host', 'example.com')
      
      expect(response.status).toBe(301)
      expect(response.headers.location).toBe('https://example.com/test')
    })

    it('should redirect PUT requests', async () => {
      const response = await request(app)
        .put('/test')
        .set('Host', 'example.com')
      
      expect(response.status).toBe(301)
      expect(response.headers.location).toBe('https://example.com/test')
    })

    it('should redirect DELETE requests', async () => {
      const response = await request(app)
        .delete('/test')
        .set('Host', 'example.com')
      
      expect(response.status).toBe(301)
      expect(response.headers.location).toBe('https://example.com/test')
    })
  })
})