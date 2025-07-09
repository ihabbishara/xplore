import { FirebaseAuthService } from '@/domains/auth/services/firebaseAuthService'
import { firebaseAuth } from '@/lib/firebase'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/shared/utils/errors'
import { DecodedIdToken } from 'firebase-admin/auth'

// Mock dependencies
jest.mock('@/lib/firebase')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    userProfile: {
      create: jest.fn(),
      updateMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}))
jest.mock('@/shared/utils/logger')

describe('FirebaseAuthService', () => {
  const mockDecodedToken: DecodedIdToken = {
    uid: 'firebase-uid-123',
    email: 'test@example.com',
    email_verified: true,
    name: 'John Doe',
    picture: 'https://example.com/avatar.jpg',
    iss: 'https://securetoken.google.com/test-project',
    aud: 'test-project',
    auth_time: 1234567890,
    user_id: 'firebase-uid-123',
    sub: 'firebase-uid-123',
    iat: 1234567890,
    exp: 1234571490,
    firebase: {
      identities: {},
      sign_in_provider: 'google.com'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyFirebaseToken', () => {
    it('should verify valid Firebase token and return JWT payload for existing user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      }

      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockResolvedValue(mockDecodedToken)
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await FirebaseAuthService.verifyFirebaseToken('valid-firebase-token')

      expect(firebaseAuth.verifyIdToken).toHaveBeenCalledWith('valid-firebase-token')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { profile: true }
      })
      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        emailVerified: true
      })
    })

    it('should create new user when Firebase token is valid but user does not exist', async () => {
      const mockNewUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        emailVerified: false,
        profile: {
          firstName: 'New',
          lastName: 'User'
        }
      }

      const mockDecodedTokenNewUser = {
        ...mockDecodedToken,
        email: 'newuser@example.com',
        email_verified: false,
        name: 'New User'
      }

      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockResolvedValue(mockDecodedTokenNewUser)
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

      const result = await FirebaseAuthService.verifyFirebaseToken('valid-firebase-token')

      expect(result).toEqual({
        userId: 'new-user-123',
        email: 'newuser@example.com',
        emailVerified: false
      })
    })

    it('should throw error when Firebase is not configured', async () => {
      ;(firebaseAuth as any) = null

      await expect(
        FirebaseAuthService.verifyFirebaseToken('token')
      ).rejects.toThrow(AuthenticationError)
      
      await expect(
        FirebaseAuthService.verifyFirebaseToken('token')
      ).rejects.toThrow('Firebase authentication is not configured')
    })

    it('should handle expired token error', async () => {
      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Firebase ID token has expired'))
      }

      await expect(
        FirebaseAuthService.verifyFirebaseToken('expired-token')
      ).rejects.toThrow(AuthenticationError)
      
      await expect(
        FirebaseAuthService.verifyFirebaseToken('expired-token')
      ).rejects.toThrow('Firebase token expired')
    })

    it('should handle invalid token error', async () => {
      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Decoding Firebase ID token failed'))
      }

      await expect(
        FirebaseAuthService.verifyFirebaseToken('invalid-token')
      ).rejects.toThrow(AuthenticationError)
      
      await expect(
        FirebaseAuthService.verifyFirebaseToken('invalid-token')
      ).rejects.toThrow('Invalid Firebase token')
    })

    it('should handle generic verification errors', async () => {
      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Unknown error'))
      }

      await expect(
        FirebaseAuthService.verifyFirebaseToken('token')
      ).rejects.toThrow(AuthenticationError)
      
      await expect(
        FirebaseAuthService.verifyFirebaseToken('token')
      ).rejects.toThrow('Firebase token verification failed')
    })
  })

  describe('getUserByFirebaseUid', () => {
    it('should find user by Firebase UID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        socialId: 'firebase-uid-123',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      }

      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

      const result = await FirebaseAuthService.getUserByFirebaseUid('firebase-uid-123')

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { socialId: 'firebase-uid-123' },
        include: { profile: true }
      })
      expect(result).toEqual(mockUser)
    })
  })

  describe('updateEmailVerificationStatus', () => {
    it('should update user email verification status', async () => {
      await FirebaseAuthService.updateEmailVerificationStatus('test@example.com', true)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { emailVerified: true }
      })
    })
  })

  describe('syncUserFromFirebase', () => {
    it('should sync user data from Firebase token', async () => {
      ;(firebaseAuth as any) = {
        verifyIdToken: jest.fn().mockResolvedValue(mockDecodedToken)
      }

      await FirebaseAuthService.syncUserFromFirebase('valid-token')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { emailVerified: true }
      })

      expect(prisma.userProfile.updateMany).toHaveBeenCalledWith({
        where: { user: { email: 'test@example.com' } },
        data: {
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg'
        }
      })
    })

    it('should throw error when Firebase is not configured', async () => {
      ;(firebaseAuth as any) = null

      await expect(
        FirebaseAuthService.syncUserFromFirebase('token')
      ).rejects.toThrow('Firebase authentication is not configured')
    })
  })

  describe('isFirebaseToken', () => {
    it('should identify Firebase tokens', () => {
      // Mock Firebase token structure
      const firebaseToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature'
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64')
      const mockFirebaseToken = `${header}.payload.signature`

      expect(FirebaseAuthService.isFirebaseToken(mockFirebaseToken)).toBe(true)
    })

    it('should identify JWT tokens as non-Firebase', () => {
      // Mock JWT token structure
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
      const mockJWTToken = `${header}.payload.signature`

      expect(FirebaseAuthService.isFirebaseToken(mockJWTToken)).toBe(false)
    })

    it('should return false for invalid token format', () => {
      expect(FirebaseAuthService.isFirebaseToken('invalid-token')).toBe(false)
      expect(FirebaseAuthService.isFirebaseToken('part1.part2')).toBe(false)
      expect(FirebaseAuthService.isFirebaseToken('part1.part2.part3.part4')).toBe(false)
    })

    it('should handle malformed base64 in header', () => {
      const malformedToken = 'invalid-base64.payload.signature'
      expect(FirebaseAuthService.isFirebaseToken(malformedToken)).toBe(false)
    })
  })
})