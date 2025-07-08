import { prisma } from '@/lib/prisma';

// Mock Redis for tests
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

// Clean up database before each test
beforeEach(async () => {
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

// Disconnect from database after all tests
afterAll(async () => {
  await prisma.$disconnect();
});