import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@xplore/shared'

/**
 * Creates a mock Express request object
 */
export const createMockRequest = (overrides?: Partial<Request>): Partial<Request> => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  cookies: {},
  get: jest.fn(),
  ...overrides,
})

/**
 * Creates a mock Express response object
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  }
  return res
}

/**
 * Creates a mock Next function
 */
export const createMockNext = (): NextFunction => jest.fn()

/**
 * Generates a valid JWT token for testing
 */
export const generateTestToken = (
  payload: JWTPayload,
  secret: string = process.env.JWT_SECRET!,
  expiresIn: string = '15m'
): string => {
  return jwt.sign(payload, secret, { expiresIn })
}

/**
 * Creates mock authenticated request with Authorization header
 */
export const createAuthenticatedRequest = (
  userId: string,
  overrides?: Partial<Request>
): Partial<Request> => {
  const token = generateTestToken({
    userId,
    email: 'test@example.com',
    emailVerified: true,
  })

  return createMockRequest({
    headers: {
      authorization: `Bearer ${token}`,
    },
    user: {
      id: userId,
      userId,
      email: 'test@example.com',
      emailVerified: true,
    },
    ...overrides,
  })
}

/**
 * Mocks Prisma transaction for testing
 */
export const mockPrismaTransaction = (implementations: Record<string, any>) => {
  return jest.fn().mockImplementation(async (callback: Function) => {
    const tx = {
      ...implementations,
    }
    return callback(tx)
  })
}

/**
 * Waits for all pending promises to resolve
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve))

/**
 * Creates a mock file for upload testing
 */
export const createMockFile = (
  filename: string = 'test.jpg',
  mimetype: string = 'image/jpeg',
  size: number = 1024 * 1024 // 1MB
): Express.Multer.File => ({
  fieldname: 'file',
  originalname: filename,
  encoding: '7bit',
  mimetype,
  size,
  destination: '/tmp',
  filename: `${Date.now()}-${filename}`,
  path: `/tmp/${Date.now()}-${filename}`,
  buffer: Buffer.alloc(size),
  stream: null as any,
})

/**
 * Generates mock pagination params
 */
export const createPaginationParams = (
  page: number = 1,
  limit: number = 20
): { page: number; limit: number; skip: number } => ({
  page,
  limit,
  skip: (page - 1) * limit,
})

/**
 * Creates a delay for async testing
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock implementation for Redis wrapper
 */
export const createMockRedis = () => ({
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
})

/**
 * Mock implementation for logger
 */
export const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
})

/**
 * Validates error response format
 */
export const expectErrorResponse = (
  res: Partial<Response>,
  statusCode: number,
  errorMessage?: string
) => {
  expect(res.status).toHaveBeenCalledWith(statusCode)
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      error: errorMessage || expect.any(String),
    })
  )
}

/**
 * Validates success response format
 */
export const expectSuccessResponse = (
  res: Partial<Response>,
  statusCode: number = 200,
  data?: any
) => {
  expect(res.status).toHaveBeenCalledWith(statusCode)
  if (data) {
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining(data))
  }
}

/**
 * Cleans up all mocks after tests
 */
export const cleanupMocks = () => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
}