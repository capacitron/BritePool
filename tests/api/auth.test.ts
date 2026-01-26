import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Use vi.hoisted to create mocks that work with hoisted vi.mock calls
const {
  mockUserFindUnique,
  mockUserCreate,
  mockEmailVerificationTokenCreate,
  mockRateLimitFn,
  mockSendVerificationEmail,
} = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserCreate: vi.fn(),
  mockEmailVerificationTokenCreate: vi.fn(),
  mockRateLimitFn: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
}))

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimitFn,
  RateLimitConfigs: {
    register: { windowMs: 3600000, maxRequests: 5 },
    login: { windowMs: 900000, maxRequests: 5 },
  },
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
    emailVerificationToken: {
      create: mockEmailVerificationTokenCreate,
    },
  },
}))

// Mock email sending
vi.mock('@/lib/email', () => ({
  sendVerificationEmail: mockSendVerificationEmail,
}))

// Mock api-utils
vi.mock('@/lib/api-utils', () => ({
  logError: vi.fn(),
}))

// Import after mocking
import { POST } from '@/app/api/auth/register/route'

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mocks
    mockRateLimitFn.mockResolvedValue(null)
    mockEmailVerificationTokenCreate.mockResolvedValue({
      id: 'token-id',
      userId: 'user-id',
      token: 'mock-verification-token',
      expiresAt: new Date(),
    })
    mockSendVerificationEmail.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 400 for invalid input - missing fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }), // Missing name and password
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid input')
  })

  it('returns 400 for invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'invalid-email',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid input')
  })

  it('returns 400 for weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: '123', // Too short
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid input')
  })

  it('returns 409 when email already exists', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(409)
    const json = await response.json()
    expect(json.error).toBe('An account with this email already exists')
  })

  it('creates user successfully with valid input', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    mockUserCreate.mockResolvedValue({
      id: 'new-user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'STEWARD',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.success).toBe(true)
    // userId removed from response for security (prevents user enumeration)
    expect(json.userId).toBeUndefined()

    expect(mockUserCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
        role: 'STEWARD',
        subscriptionTier: 'FREE',
        subscriptionStatus: 'INACTIVE',
      }),
    })
  })

  it('normalizes email to lowercase', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    mockUserCreate.mockResolvedValue({
      id: 'new-user',
      email: 'test@example.com',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePass123!',
      }),
    })
    await POST(request)

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    })
    expect(mockUserCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
      }),
    })
  })

  it('returns rate limit response when rate limited', async () => {
    const rateLimitResponse = new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
    })
    mockRateLimitFn.mockResolvedValue(rateLimitResponse)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(429)
  })

  it('returns 500 on database error', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    mockUserCreate.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('An error occurred during registration')
  })
})
