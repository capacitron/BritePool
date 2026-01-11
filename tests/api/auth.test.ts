import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}))

// Mock rate limiting - return null to allow requests through (async)
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
  RateLimitConfigs: {
    register: { windowMs: 3600000, maxRequests: 5 },
    login: { windowMs: 900000, maxRequests: 5 },
  },
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock api-utils
vi.mock('@/lib/api-utils', () => ({
  logError: vi.fn(),
}))

// Import after mocking
import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

// Cast mocks for type safety
const mockUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
}
const mockRateLimit = rateLimit as ReturnType<typeof vi.fn>

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockResolvedValue(null)
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
    mockUser.findUnique.mockResolvedValue({
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
    mockUser.findUnique.mockResolvedValue(null)
    mockUser.create.mockResolvedValue({
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

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.message).toBe('Account created successfully. Please log in.')
    expect(json.userId).toBe('new-user-123')

    expect(mockUser.create).toHaveBeenCalledWith({
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
    mockUser.findUnique.mockResolvedValue(null)
    mockUser.create.mockResolvedValue({
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

    expect(mockUser.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    })
    expect(mockUser.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
      }),
    })
  })

  it('returns rate limit response when rate limited', async () => {
    const rateLimitResponse = new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
    })
    mockRateLimit.mockResolvedValue(rateLimitResponse)

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
    mockUser.findUnique.mockResolvedValue(null)
    mockUser.create.mockRejectedValue(new Error('Database error'))

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
