import { User, UserProfile } from '@prisma/client'
import bcrypt from 'bcryptjs'

let userIdCounter = 1

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: `user-${userIdCounter++}`,
  email: `test${userIdCounter}@example.com`,
  password: bcrypt.hashSync('password123', 10),
  name: `Test User ${userIdCounter}`,
  emailVerified: new Date(),
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockUserProfile = (userId: string, overrides?: Partial<UserProfile>): UserProfile => ({
  id: `profile-${userId}`,
  userId,
  bio: 'Test bio',
  currentCity: 'Test City',
  country: 'Test Country',
  languages: ['English'],
  interests: ['Travel', 'Food'],
  preferredClimate: 'temperate',
  accommodationPreference: 'apartment',
  monthlyBudgetMin: 1000,
  monthlyBudgetMax: 3000,
  dietaryRestrictions: [],
  mobilityRequirements: [],
  hasChildren: false,
  hasPets: false,
  workStyle: 'remote',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})