import request from 'supertest'
import express from 'express'
import { prisma } from '@/lib/prisma'
import { redisWrapper } from '@/lib/redis-wrapper'
import authRoutes from '@/domains/auth/routes'
import { errorHandler } from '@/shared/middleware/errorHandler'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    emailVerificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/redis-wrapper', () => ({
  redisWrapper: {
    del: jest.fn(),
  },
}))

// Create test app
const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use(errorHandler)

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      firstName: 'New',
      lastName: 'User',
    }

    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: registerData.email,
        passwordHash: await bcrypt.hash(registerData.password, 12),
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockProfile = {
        id: 'profile-123',
        userId: mockUser.id,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          userProfile: {
            create: jest.fn().mockResolvedValue(mockProfile),
          },
        }
        return callback(tx)
      })
      ;(prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile)
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('tokens')
      expect(response.body.user.email).toBe(registerData.email)
      expect(response.body.tokens).toHaveProperty('accessToken')
      expect(response.body.tokens).toHaveProperty('refreshToken')
    })

    it('should return 409 if user already exists', async () => {
      const existingUser = {
        id: 'user-existing',
        email: registerData.email,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(409)

      expect(response.body.error).toBe('User with this email already exists')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
        })
        .expect(400)

      expect(response.body).toHaveProperty('errors')
    })
  })

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'user@example.com',
      password: 'SecurePassword123!',
    }

    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginData.email,
        passwordHash: await bcrypt.hash(loginData.password, 12),
        emailVerified: true,
        profile: {
          id: 'profile-123',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: null,
        },
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('tokens')
      expect(response.body.user.email).toBe(loginData.email)
      expect(response.body.tokens).toHaveProperty('accessToken')
      expect(response.body.tokens).toHaveProperty('refreshToken')
    })

    it('should return 401 for invalid credentials', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.error).toBe('Invalid email or password')
    })

    it('should return 401 for wrong password', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginData.email,
        passwordHash: await bcrypt.hash('differentpassword', 12),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.error).toBe('Invalid email or password')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        emailVerified: true,
      }

      const payload = {
        userId: mockUser.id,
        email: mockUser.email,
        emailVerified: mockUser.emailVerified,
      }

      const validRefreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      )

      const mockStoredToken = {
        id: 'token-123',
        token: validRefreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: mockUser,
      }

      ;(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockStoredToken)
      ;(prisma.refreshToken.delete as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
    })

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.error).toBe('Invalid refresh token')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should successfully logout', async () => {
      const userId = 'user-123'
      const accessToken = jwt.sign(
        { userId, email: 'user@example.com', emailVerified: true },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      )

      ;(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({})
      ;(redisWrapper.del as jest.Mock).mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send()
        .expect(200)

      expect(response.body.message).toBe('Logged out successfully')
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      })
    })

    it('should logout from specific device when refresh token provided', async () => {
      const userId = 'user-123'
      const accessToken = jwt.sign(
        { userId, email: 'user@example.com', emailVerified: true },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      )
      const refreshToken = 'refresh-token-123'

      ;(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({})
      ;(redisWrapper.del as jest.Mock).mockResolvedValue({})

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200)

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId, token: refreshToken },
      })
    })
  })

  describe('POST /api/auth/verify-email', () => {
    it('should successfully verify email', async () => {
      const verificationToken = 'valid-token-123'
      const mockToken = {
        id: 'token-id',
        email: 'user@example.com',
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }

      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(mockToken)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.emailVerificationToken.delete as jest.Mock).mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200)

      expect(response.body.message).toBe('Email verified successfully')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: mockToken.email },
        data: { emailVerified: true },
      })
    })

    it('should return 400 for invalid verification token', async () => {
      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400)

      expect(response.body.error).toBe('Invalid verification token')
    })

    it('should return 400 for expired verification token', async () => {
      const mockToken = {
        id: 'token-id',
        email: 'user@example.com',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      }

      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(mockToken)
      ;(prisma.emailVerificationToken.delete as jest.Mock).mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'expired-token' })
        .expect(400)

      expect(response.body.error).toBe('Verification token expired')
    })
  })
})