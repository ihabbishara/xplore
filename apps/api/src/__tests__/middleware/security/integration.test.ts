import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { setupSecurityMiddleware } from '@/middleware/security'
import { logger } from '@/shared/utils/logger'

jest.mock('@/shared/utils/logger')

describe('Security Middleware Integration', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(cookieParser())
    setupSecurityMiddleware(app)
    app.use(express.json())
    
    // Test routes
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' })
    })
    
    app.get('/api/data', (req, res) => {
      res.json({ data: 'test' })
    })
    
    app.post('/api/data', (req, res) => {
      res.json({ received: req.body })
    })
    
    app.post('/api/auth/login', (req, res) => {
      res.json({ success: true })
    })
    
    app.get('/api/csrf-token', (req, res) => {
      res.json({ csrfToken: req.csrfToken() })
    })

    jest.clearAllMocks()
  })

  describe('All Security Features Combined', () => {
    it('should set all security headers', async () => {
      const response = await request(app).get('/api/data')
      
      // Helmet headers
      expect(response.headers['x-dns-prefetch-control']).toBeDefined()
      expect(response.headers['x-frame-options']).toBeDefined()
      expect(response.headers['x-content-type-options']).toBeDefined()
      expect(response.headers['content-security-policy']).toBeDefined()
      
      // CORS headers
      expect(response.headers['access-control-allow-origin']).toBeDefined()
    })

    it('should sanitize input and require CSRF token for POST', async () => {
      // Get CSRF token first
      const tokenResponse = await request(app).get('/api/csrf-token')
      const csrfToken = tokenResponse.body.csrfToken
      const cookies = tokenResponse.headers['set-cookie']

      // Try POST with malicious input but valid CSRF
      const response = await request(app)
        .post('/api/data')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: '<script>alert("XSS")</script>John',
          sql: "'; DROP TABLE users; --",
        })
      
      expect(response.status).toBe(200)
      expect(response.body.received.name).toBe('John') // Sanitized
      expect(response.body.received.sql).toBe(' DROP TABLE users --') // Sanitized
    })

    it('should enforce rate limiting on auth endpoints', async () => {
      const maxRequests = process.env.NODE_ENV === 'production' ? 5 : 10
      
      // Make maximum allowed requests
      for (let i = 0; i < maxRequests; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' })
      }
      
      // Next request should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
      
      expect(response.status).toBe(429)
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should not apply rate limiting to health endpoint', async () => {
      // Make many requests to health endpoint
      const responses = await Promise.all(
        Array(20).fill(null).map(() => request(app).get('/health'))
      )
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Security Headers in Different Environments', () => {
    it('should have development-friendly CSP in development', async () => {
      process.env.NODE_ENV = 'development'
      const devApp = express()
      setupSecurityMiddleware(devApp)
      devApp.get('/test', (req, res) => res.json({ ok: true }))
      
      const response = await request(devApp).get('/test')
      const csp = response.headers['content-security-policy']
      
      expect(csp).toContain("'unsafe-inline'")
      expect(csp).toContain("'unsafe-eval'")
      expect(csp).toContain('localhost')
    })

    it('should have strict CSP in production', async () => {
      process.env.NODE_ENV = 'production'
      const prodApp = express()
      setupSecurityMiddleware(prodApp)
      prodApp.get('/test', (req, res) => res.json({ ok: true }))
      
      const response = await request(prodApp).get('/test')
      const csp = response.headers['content-security-policy']
      
      expect(csp).not.toContain("'unsafe-inline'")
      expect(csp).not.toContain("'unsafe-eval'")
      expect(csp).not.toContain('localhost')
      
      process.env.NODE_ENV = 'test' // Reset
    })
  })

  describe('Attack Scenarios', () => {
    it('should protect against XSS in multiple input vectors', async () => {
      // Get CSRF token
      const tokenResponse = await request(app).get('/api/csrf-token')
      const csrfToken = tokenResponse.body.csrfToken
      const cookies = tokenResponse.headers['set-cookie']

      const xssPayloads = {
        body: '<img src=x onerror=alert(1)>',
        query: '<script>alert(document.cookie)</script>',
        header: '<svg onload=alert(1)>',
      }

      const response = await request(app)
        .post('/api/data?search=' + xssPayloads.query)
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .set('X-Custom-Header', xssPayloads.header)
        .send({ payload: xssPayloads.body })
      
      expect(response.status).toBe(200)
      expect(response.body.received.payload).toBe('<img src="x">') // Sanitized
    })

    it('should protect against CSRF attacks', async () => {
      // Attacker tries to make request without CSRF token
      const response = await request(app)
        .post('/api/data')
        .send({ malicious: 'data' })
      
      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID')
    })

    it('should protect against brute force attacks', async () => {
      const attempts = []
      const maxAttempts = 15
      
      // Simulate brute force login attempts
      for (let i = 0; i < maxAttempts; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({ email: 'victim@example.com', password: `attempt${i}` })
        )
      }
      
      const responses = await Promise.all(attempts)
      const blockedResponses = responses.filter(r => r.status === 429)
      
      expect(blockedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Performance Impact', () => {
    it('should not significantly impact response time', async () => {
      const start = Date.now()
      
      await request(app).get('/api/data')
      
      const duration = Date.now() - start
      
      // Security middleware should add less than 50ms overhead
      expect(duration).toBeLessThan(50)
    })
  })
})