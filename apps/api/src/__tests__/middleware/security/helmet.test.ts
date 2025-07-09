import express from 'express'
import request from 'supertest'
import { helmetMiddleware } from '@/middleware/security/helmet'

describe('Helmet Middleware', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(helmetMiddleware())
    app.get('/test', (req, res) => {
      res.json({ success: true })
    })
  })

  describe('Security Headers', () => {
    it('should set X-DNS-Prefetch-Control header', async () => {
      const response = await request(app).get('/test')
      expect(response.headers['x-dns-prefetch-control']).toBe('off')
    })

    it('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/test')
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    })

    it('should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/test')
      expect(response.headers['x-content-type-options']).toBe('nosniff')
    })

    it('should set X-Download-Options header', async () => {
      const response = await request(app).get('/test')
      expect(response.headers['x-download-options']).toBe('noopen')
    })

    it('should set X-XSS-Protection header', async () => {
      const response = await request(app).get('/test')
      expect(response.headers['x-xss-protection']).toBe('0')
    })

    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/test')
      expect(response.headers['content-security-policy']).toBeDefined()
      expect(response.headers['content-security-policy']).toContain("default-src 'self'")
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

    it('should set Strict-Transport-Security header in production', async () => {
      const prodApp = express()
      prodApp.use(helmetMiddleware())
      prodApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(prodApp).get('/test')
      expect(response.headers['strict-transport-security']).toBeDefined()
    })

    it('should have stricter CSP in production', async () => {
      const prodApp = express()
      prodApp.use(helmetMiddleware())
      prodApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(prodApp).get('/test')
      const csp = response.headers['content-security-policy']
      expect(csp).not.toContain("'unsafe-inline'")
      expect(csp).not.toContain("'unsafe-eval'")
    })
  })
})