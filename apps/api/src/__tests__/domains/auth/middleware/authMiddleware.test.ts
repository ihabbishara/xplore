import { Request, Response, NextFunction } from 'express'
import { authenticate, requireVerifiedEmail, optionalAuth } from '@/domains/auth/middleware/authMiddleware'
import { AuthService } from '@/domains/auth/services/authService'
import { FirebaseAuthService } from '@/domains/auth/services/firebaseAuthService'
import { AuthenticationError, AuthorizationError } from '@/shared/utils/errors'
import { JWTPayload } from '@xplore/shared'

// Mock dependencies
jest.mock('@/domains/auth/services/authService')
jest.mock('@/domains/auth/services/firebaseAuthService')
jest.mock('@/shared/utils/logger')

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    mockReq = {
      headers: {}
    }
    mockRes = {}
    mockNext = jest.fn()

    // Reset all mocks
    jest.clearAllMocks()
  })

  describe('authenticate', () => {
    it('should fail when no authorization header is provided', async () => {
      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AuthenticationError)
      )
      expect(mockNext.mock.calls[0][0].message).toBe('No authorization header')
    })

    it('should fail when authorization header format is invalid', async () => {
      mockReq.headers = { authorization: 'Invalid format' }

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AuthenticationError)
      )
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid authorization header format')
    })

    it('should authenticate with Firebase token', async () => {
      const mockFirebaseToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.'.repeat(10) // Long token
      const mockPayload: JWTPayload = {
        userId: 'user123',
        email: 'test@example.com',
        emailVerified: true
      }

      mockReq.headers = { authorization: `Bearer ${mockFirebaseToken}` }
      ;(FirebaseAuthService.isFirebaseToken as jest.Mock).mockReturnValue(true)
      ;(FirebaseAuthService.verifyFirebaseToken as jest.Mock).mockResolvedValue(mockPayload)

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(FirebaseAuthService.isFirebaseToken).toHaveBeenCalledWith(mockFirebaseToken)
      expect(FirebaseAuthService.verifyFirebaseToken).toHaveBeenCalledWith(mockFirebaseToken)
      expect(mockReq.user).toEqual(mockPayload)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should authenticate with JWT token', async () => {
      const mockJWTToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.short' // Short token
      const mockPayload: JWTPayload = {
        userId: 'user456',
        email: 'jwt@example.com',
        emailVerified: false
      }

      mockReq.headers = { authorization: `Bearer ${mockJWTToken}` }
      ;(FirebaseAuthService.isFirebaseToken as jest.Mock).mockReturnValue(false)
      ;(AuthService.verifyAccessToken as jest.Mock).mockResolvedValue(mockPayload)

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(FirebaseAuthService.isFirebaseToken).toHaveBeenCalledWith(mockJWTToken)
      expect(AuthService.verifyAccessToken).toHaveBeenCalledWith(mockJWTToken)
      expect(mockReq.user).toEqual(mockPayload)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should handle Firebase token verification errors', async () => {
      const mockFirebaseToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.'.repeat(10)
      const error = new Error('Firebase token expired')

      mockReq.headers = { authorization: `Bearer ${mockFirebaseToken}` }
      ;(FirebaseAuthService.isFirebaseToken as jest.Mock).mockReturnValue(true)
      ;(FirebaseAuthService.verifyFirebaseToken as jest.Mock).mockRejectedValue(error)

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })

    it('should handle JWT token verification errors', async () => {
      const mockJWTToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.short'
      const error = new Error('JWT token invalid')

      mockReq.headers = { authorization: `Bearer ${mockJWTToken}` }
      ;(FirebaseAuthService.isFirebaseToken as jest.Mock).mockReturnValue(false)
      ;(AuthService.verifyAccessToken as jest.Mock).mockRejectedValue(error)

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('requireVerifiedEmail', () => {
    it('should fail when user is not authenticated', () => {
      requireVerifiedEmail(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AuthenticationError)
      )
      expect(mockNext.mock.calls[0][0].message).toBe('Authentication required')
    })

    it('should fail when user email is not verified', () => {
      mockReq.user = {
        userId: 'user123',
        email: 'test@example.com',
        emailVerified: false
      }

      requireVerifiedEmail(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AuthorizationError)
      )
      expect(mockNext.mock.calls[0][0].message).toBe('Email verification required')
    })

    it('should pass when user email is verified', () => {
      mockReq.user = {
        userId: 'user123',
        email: 'test@example.com',
        emailVerified: true
      }

      requireVerifiedEmail(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })
  })

  describe('optionalAuth', () => {
    it('should continue without authentication when no header provided', async () => {
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.user).toBeUndefined()
    })

    it('should authenticate when valid token provided', async () => {
      const mockToken = 'valid-token'
      const mockPayload: JWTPayload = {
        userId: 'user123',
        email: 'test@example.com',
        emailVerified: true
      }

      mockReq.headers = { authorization: `Bearer ${mockToken}` }
      ;(FirebaseAuthService.isFirebaseToken as jest.Mock).mockReturnValue(false)
      ;(AuthService.verifyAccessToken as jest.Mock).mockResolvedValue(mockPayload)

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.user).toEqual(mockPayload)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should continue without failing when authentication fails', async () => {
      const mockToken = 'invalid-token'
      const error = new Error('Token invalid')

      mockReq.headers = { authorization: `Bearer ${mockToken}` }
      ;(FirebaseAuthService.isFirebaseToken as jest.Mock).mockReturnValue(false)
      ;(AuthService.verifyAccessToken as jest.Mock).mockRejectedValue(error)

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.user).toBeUndefined()
    })
  })
})