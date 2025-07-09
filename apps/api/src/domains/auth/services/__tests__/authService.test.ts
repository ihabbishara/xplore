import { AuthService } from '../authService'
import { prisma } from '@/lib/prisma'
import { redisWrapper } from '@/lib/redis-wrapper'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '@/shared/utils/errors'
import { createMockUser, createMockUserProfile } from '@/test/factories/userFactory'

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

jest.mock('@/shared/utils/logger')

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    }

    it('should successfully register a new user', async () => {
      const mockUser = createMockUser({ email: registerData.email })
      const mockProfile = createMockUserProfile(mockUser.id, {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
      })

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

      const result = await AuthService.register(registerData)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('tokens')
      expect(result.user.email).toBe(registerData.email)
      expect(result.tokens).toHaveProperty('accessToken')
      expect(result.tokens).toHaveProperty('refreshToken')
    })

    it('should throw ConflictError if user already exists', async () => {
      const existingUser = createMockUser({ email: registerData.email })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

      await expect(AuthService.register(registerData)).rejects.toThrow(ConflictError)
      await expect(AuthService.register(registerData)).rejects.toThrow(
        'User with this email already exists'
      )
    })

    it('should hash the password before storing', async () => {
      const hashSpy = jest.spyOn(bcrypt, 'hash')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue(createMockUser()),
          },
          userProfile: {
            create: jest.fn().mockResolvedValue(createMockUserProfile('user-1')),
          },
        }
        return callback(tx)
      })
      ;(prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(
        createMockUserProfile('user-1')
      )
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})

      await AuthService.register(registerData)

      expect(hashSpy).toHaveBeenCalledWith(registerData.password, 12)
    })
  })

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password123!',
    }

    it('should successfully login with valid credentials', async () => {
      const mockUser = createMockUser({
        email: loginData.email,
        passwordHash: await bcrypt.hash(loginData.password, 12),
      })
      const mockProfile = createMockUserProfile(mockUser.id)

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        profile: mockProfile,
      })
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      const result = await AuthService.login(loginData)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('tokens')
      expect(result.user.email).toBe(loginData.email)
      expect(result.tokens).toHaveProperty('accessToken')
      expect(result.tokens).toHaveProperty('refreshToken')
    })

    it('should throw AuthenticationError if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(AuthService.login(loginData)).rejects.toThrow(AuthenticationError)
      await expect(AuthService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      )
    })

    it('should throw AuthenticationError if password is invalid', async () => {
      const mockUser = createMockUser({
        email: loginData.email,
        passwordHash: await bcrypt.hash('wrongpassword', 12),
      })

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await expect(AuthService.login(loginData)).rejects.toThrow(AuthenticationError)
      await expect(AuthService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      )
    })
  })

  describe('refreshTokens', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const mockUser = createMockUser()
      const mockPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        emailVerified: mockUser.emailVerified,
      }
      const validRefreshToken = jwt.sign(
        mockPayload,
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      )

      const mockStoredToken = {
        id: 'token-1',
        token: validRefreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: mockUser,
      }

      ;(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockStoredToken)
      ;(prisma.refreshToken.delete as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      const result = await AuthService.refreshTokens(validRefreshToken)

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: mockStoredToken.id },
      })
    })

    it('should throw AuthenticationError if refresh token is invalid', async () => {
      const invalidToken = 'invalid-token'

      await expect(AuthService.refreshTokens(invalidToken)).rejects.toThrow(
        AuthenticationError
      )
      await expect(AuthService.refreshTokens(invalidToken)).rejects.toThrow(
        'Invalid refresh token'
      )
    })

    it('should throw AuthenticationError if refresh token not found in database', async () => {
      const mockPayload = {
        userId: 'user-1',
        email: 'test@example.com',
        emailVerified: true,
      }
      const validRefreshToken = jwt.sign(
        mockPayload,
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      )

      ;(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(AuthService.refreshTokens(validRefreshToken)).rejects.toThrow(
        AuthenticationError
      )
      await expect(AuthService.refreshTokens(validRefreshToken)).rejects.toThrow(
        'Invalid refresh token'
      )
    })

    it('should throw AuthenticationError if refresh token is expired', async () => {
      const mockUser = createMockUser()
      const mockPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        emailVerified: mockUser.emailVerified,
      }
      const validRefreshToken = jwt.sign(
        mockPayload,
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      )

      const mockStoredToken = {
        id: 'token-1',
        token: validRefreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        user: mockUser,
      }

      ;(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockStoredToken)
      ;(prisma.refreshToken.delete as jest.Mock).mockResolvedValue({})

      await expect(AuthService.refreshTokens(validRefreshToken)).rejects.toThrow(
        AuthenticationError
      )
      await expect(AuthService.refreshTokens(validRefreshToken)).rejects.toThrow(
        'Refresh token expired'
      )
    })
  })

  describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      const mockToken = {
        id: 'token-1',
        email: 'test@example.com',
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }

      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken
      )
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.emailVerificationToken.delete as jest.Mock).mockResolvedValue({})

      await AuthService.verifyEmail(mockToken.token)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: mockToken.email },
        data: { emailVerified: true },
      })
      expect(prisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { id: mockToken.id },
      })
    })

    it('should throw ValidationError if token not found', async () => {
      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(AuthService.verifyEmail('invalid-token')).rejects.toThrow(
        ValidationError
      )
      await expect(AuthService.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid verification token'
      )
    })

    it('should throw ValidationError if token is expired', async () => {
      const mockToken = {
        id: 'token-1',
        email: 'test@example.com',
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      }

      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken
      )
      ;(prisma.emailVerificationToken.delete as jest.Mock).mockResolvedValue({})

      await expect(AuthService.verifyEmail(mockToken.token)).rejects.toThrow(
        ValidationError
      )
      await expect(AuthService.verifyEmail(mockToken.token)).rejects.toThrow(
        'Verification token expired'
      )
    })
  })

  describe('logout', () => {
    const userId = 'user-1'
    const refreshToken = 'refresh-token'

    it('should delete specific refresh token when provided', async () => {
      ;(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({})
      ;(redisWrapper.del as jest.Mock).mockResolvedValue({})

      await AuthService.logout(userId, refreshToken)

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId, token: refreshToken },
      })
      expect(redisWrapper.del).toHaveBeenCalledWith(`session:${userId}`)
    })

    it('should delete all refresh tokens when no token provided', async () => {
      ;(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({})
      ;(redisWrapper.del as jest.Mock).mockResolvedValue({})

      await AuthService.logout(userId)

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      })
      expect(redisWrapper.del).toHaveBeenCalledWith(`session:${userId}`)
    })
  })

  describe('verifyAccessToken', () => {
    it('should successfully verify valid access token', async () => {
      const mockPayload = {
        userId: 'user-1',
        email: 'test@example.com',
        emailVerified: true,
      }
      const validToken = jwt.sign(mockPayload, process.env.JWT_SECRET!, {
        expiresIn: '15m',
      })

      const result = await AuthService.verifyAccessToken(validToken)

      expect(result).toMatchObject(mockPayload)
    })

    it('should throw AuthenticationError if token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-1', email: 'test@example.com', emailVerified: true },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Expired 1 hour ago
      )

      await expect(AuthService.verifyAccessToken(expiredToken)).rejects.toThrow(
        AuthenticationError
      )
      await expect(AuthService.verifyAccessToken(expiredToken)).rejects.toThrow(
        'Access token expired'
      )
    })

    it('should throw AuthenticationError if token is invalid', async () => {
      const invalidToken = 'invalid-token'

      await expect(AuthService.verifyAccessToken(invalidToken)).rejects.toThrow(
        AuthenticationError
      )
      await expect(AuthService.verifyAccessToken(invalidToken)).rejects.toThrow(
        'Invalid access token'
      )
    })
  })
})