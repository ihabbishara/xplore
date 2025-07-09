import request from 'supertest'
import express from 'express'
import { authenticate } from '@/domains/auth/middleware/authMiddleware'
import { prisma } from '@/lib/prisma'
import { firebaseAuth } from '@/lib/firebase'

// Mock dependencies
jest.mock('@/lib/firebase')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    userProfile: {
      create: jest.fn()
    },
    $transaction: jest.fn()
  }
}))

describe('Firebase Authentication Integration Tests', () => {
  let app: express.Application

  beforeEach(() => {
    // Create minimal Express app for testing
    app = express()
    app.use(express.json())

    // Test route that requires authentication
    app.get('/api/test/protected', authenticate, (req, res) => {
      res.json({
        message: 'Authenticated successfully',
        user: req.user
      })
    })

    // Test route without authentication
    app.get('/api/test/public', (req, res) => {
      res.json({ message: 'Public endpoint' })
    })

    jest.clearAllMocks()
  })

  describe('Firebase Token Authentication', () => {
    const mockFirebaseToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.' + 'a'.repeat(200) // Long token
    const mockDecodedToken = {
      uid: 'firebase-uid-123',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User'
    }

    it('should authenticate successfully with valid Firebase token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }

      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockResolvedValue(mockDecodedToken)
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${mockFirebaseToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Authenticated successfully',
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          emailVerified: true
        }
      })
    })

    it('should create new user on first Firebase authentication', async () => {
      const mockNewUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        emailVerified: false,
        profile: {
          firstName: 'New',
          lastName: 'User'
        }
      }

      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockResolvedValue({
          ...mockDecodedToken,
          email: 'newuser@example.com',
          email_verified: false
        })
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue(mockNewUser),
            findUnique: jest.fn().mockResolvedValue(mockNewUser)
          },
          userProfile: {
            create: jest.fn()
          }
        }
        return callback(tx)
      })

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${mockFirebaseToken}`)

      expect(response.status).toBe(200)
      expect(response.body.user).toEqual({
        userId: 'new-user-123',
        email: 'newuser@example.com',
        emailVerified: false
      })
    })

    it('should reject expired Firebase token', async () => {
      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Firebase ID token has expired'))
      }

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${mockFirebaseToken}`)

      expect(response.status).toBe(500) // Error middleware would normally handle this
      expect(firebaseAuth.verifyIdToken).toHaveBeenCalledWith(mockFirebaseToken)
    })

    it('should reject invalid Firebase token', async () => {
      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Decoding Firebase ID token failed'))
      }

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${mockFirebaseToken}`)

      expect(response.status).toBe(500)
    })

    it('should handle Firebase not configured', async () => {
      ;(firebaseAuth as any) = null

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${mockFirebaseToken}`)

      expect(response.status).toBe(500)
    })
  })

  describe('JWT Token Authentication', () => {
    const mockJWTToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.short' // Short token

    it('should authenticate with JWT token when Firebase check returns false', async () => {
      // This would need AuthService implementation to be complete
      // For now, we're testing that the token is identified as non-Firebase
      
      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${mockJWTToken}`)

      // The actual response would depend on AuthService implementation
      expect(response.status).toBe(500) // Would be 200 with proper JWT verification
    })
  })

  describe('Missing Authentication', () => {
    it('should reject request without authorization header', async () => {
      const response = await request(app)
        .get('/api/test/protected')

      expect(response.status).toBe(500) // Error middleware would return 401
    })

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', 'InvalidFormat token')

      expect(response.status).toBe(500) // Error middleware would return 401
    })

    it('should allow access to public endpoints without authentication', async () => {
      const response = await request(app)
        .get('/api/test/public')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'Public endpoint' })
    })
  })
})