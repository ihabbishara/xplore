import { User, UserProfile } from '@prisma/client'
import bcrypt from 'bcryptjs'

let userIdCounter = 1

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: `user-${userIdCounter++}`,
  email: `test${userIdCounter}@example.com`,
  passwordHash: bcrypt.hashSync('password123', 10),
  socialProvider: null,
  socialId: null,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockUserProfile = (userId: string, overrides?: Partial<UserProfile>): UserProfile => ({
  id: `profile-${userId}`,
  userId,
  firstName: 'Test',
  lastName: 'User',
  currentLocation: { country: 'Test Country', city: 'Test City', coordinates: [0, 0] },
  targetCountries: ['France', 'Spain'],
  explorationTimeline: '3-6 months',
  userType: 'relocation_explorer',
  interests: { work: ['remote'], lifestyle: ['travel'], climate: ['temperate'] },
  privacySettings: { profile_visible: true, location_visible: false },
  bio: 'Test bio',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})