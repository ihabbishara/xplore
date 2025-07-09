import express from 'express'
import request from 'supertest'
import { authRateLimiter, apiRateLimiter } from '@/middleware/security/rateLimit'
import { logger } from '@/shared/utils/logger'

jest.mock('@/shared/utils/logger')

describe('Rate Limiting Middleware', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    jest.clearAllMocks()
  })

  describe('Auth Rate Limiter', () => {
    beforeEach(() => {
      app.use('/auth', authRateLimiter())
      app.post('/auth/login', (req, res) => {
        res.json({ success: true })
      })
      app.get('/health', (req, res) => {
        res.json({ status: 'ok' })
      })
    })

    it('should allow requests within the limit', async () => {
      const responses = await Promise.all([
        request(app).post('/auth/login'),
        request(app).post('/auth/login'),
        request(app).post('/auth/login'),
      ])

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })
    })

    it('should block requests exceeding the limit', async () => {
      // Make maximum allowed requests first
      const maxRequests = process.env.NODE_ENV === 'production' ? 5 : 10
      
      for (let i = 0; i < maxRequests; i++) {
        await request(app).post('/auth/login')
      }

      // Next request should be blocked
      const response = await request(app).post('/auth/login')
      
      expect(response.status).toBe(429)
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(response.body.error.message).toContain('Too many authentication attempts')
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Rate limit exceeded for authentication',
          path: '/auth/login',
        })
      )
    })

    it('should not rate limit health check endpoint', async () => {
      // Make many requests to health endpoint
      const responses = await Promise.all(
        Array(20).fill(null).map(() => request(app).get('/health'))
      )

      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should include Retry-After header when rate limited', async () => {
      const maxRequests = process.env.NODE_ENV === 'production' ? 5 : 10
      
      for (let i = 0; i < maxRequests; i++) {
        await request(app).post('/auth/login')
      }

      const response = await request(app).post('/auth/login')
      expect(response.headers['retry-after']).toBeDefined()
    })
  })

  describe('API Rate Limiter', () => {
    beforeEach(() => {
      app.use('/api', apiRateLimiter())
      app.get('/api/users', (req, res) => {
        res.json({ users: [] })
      })
    })

    it('should allow requests within the limit', async () => {
      const responses = await Promise.all(
        Array(10).fill(null).map(() => request(app).get('/api/users'))
      )

      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should block requests exceeding the limit', async () => {
      const maxRequests = process.env.NODE_ENV === 'production' ? 50 : 100
      
      // Make maximum allowed requests
      for (let i = 0; i < maxRequests; i++) {
        await request(app).get('/api/users')
      }

      // Next request should be blocked
      const response = await request(app).get('/api/users')
      
      expect(response.status).toBe(429)
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(response.body.error.message).toContain('Too many requests')
    })

    it('should track rate limit by IP address', async () => {
      // Simulate requests from different IPs
      const app2 = express()
      app2.use('/api', apiRateLimiter())
      app2.get('/api/users', (req, res) => res.json({ users: [] }))

      // First IP can make requests
      const response1 = await request(app2)
        .get('/api/users')
        .set('X-Forwarded-For', '1.1.1.1')

      expect(response1.status).toBe(200)

      // Different IP can also make requests
      const response2 = await request(app2)
        .get('/api/users')
        .set('X-Forwarded-For', '2.2.2.2')

      expect(response2.status).toBe(200)
    })
  })
})