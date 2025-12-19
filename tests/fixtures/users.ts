import { hash } from 'bcryptjs'

export interface TestUser {
  id: string
  email: string
  firstName: string
  lastName: string
  password: string
  hashedPassword?: string
  role: string
  subscriptionTier: string
  covenantAcceptedAt: Date | null
  onboardingCompleted: boolean
}

// Generate a test user with common defaults
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: `user_${Math.random().toString(36).substring(2, 9)}`,
    email: `test_${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    password: 'TestPassword123!',
    role: 'RESIDENT',
    subscriptionTier: 'FREE',
    covenantAcceptedAt: null,
    onboardingCompleted: false,
    ...overrides,
  }
}

// Pre-defined test users for different scenarios
export const testUsers = {
  admin: createTestUser({
    id: 'admin_001',
    email: 'admin@britepool.test',
    firstName: 'Admin',
    lastName: 'User',
    role: 'WEB_STEWARD',
    subscriptionTier: 'PLATINUM',
    covenantAcceptedAt: new Date(),
    onboardingCompleted: true,
  }),

  steward: createTestUser({
    id: 'steward_001',
    email: 'steward@britepool.test',
    firstName: 'Steward',
    lastName: 'Member',
    role: 'STEWARD',
    subscriptionTier: 'PREMIUM',
    covenantAcceptedAt: new Date(),
    onboardingCompleted: true,
  }),

  newUser: createTestUser({
    id: 'new_001',
    email: 'new@britepool.test',
    firstName: 'New',
    lastName: 'Member',
    role: 'RESIDENT',
    subscriptionTier: 'FREE',
    covenantAcceptedAt: null,
    onboardingCompleted: false,
  }),

  partialOnboarding: createTestUser({
    id: 'partial_001',
    email: 'partial@britepool.test',
    firstName: 'Partial',
    lastName: 'Member',
    role: 'RESIDENT',
    subscriptionTier: 'BASIC',
    covenantAcceptedAt: new Date(),
    onboardingCompleted: false,
  }),
}

// Helper to hash passwords for test users
export async function hashUserPasswords(users: TestUser[]): Promise<TestUser[]> {
  return Promise.all(
    users.map(async (user) => ({
      ...user,
      hashedPassword: await hash(user.password, 12),
    }))
  )
}

// Session mock factory
export function createMockSession(user: Partial<TestUser> = testUsers.steward) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      covenantAcceptedAt: user.covenantAcceptedAt,
      onboardingCompleted: user.onboardingCompleted,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

// API Response helpers
export const mockResponses = {
  unauthorized: {
    status: 401,
    body: { error: 'Unauthorized' },
  },
  forbidden: {
    status: 403,
    body: { error: 'Forbidden' },
  },
  notFound: {
    status: 404,
    body: { error: 'Not found' },
  },
  rateLimited: {
    status: 429,
    body: { error: 'Too many requests' },
  },
  serverError: {
    status: 500,
    body: { error: 'Internal server error' },
  },
}
