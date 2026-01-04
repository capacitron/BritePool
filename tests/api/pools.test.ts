import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth - must be before imports
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock isAdmin
vi.mock('@/lib/auth/roles', () => ({
  isAdmin: vi.fn(),
}))

// Mock rate limiting - return null to allow requests through
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => null),
  RateLimitConfigs: {
    moderate: { windowMs: 60000, maxRequests: 30 },
  },
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pool: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Import after mocking
import { GET, POST } from '@/app/api/pools/route'
import { GET as GET_POOL, PATCH as PATCH_POOL } from '@/app/api/pools/[poolId]/route'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma'

// Cast mocks for type safety
const mockAuth = auth as ReturnType<typeof vi.fn>
const mockIsAdmin = isAdmin as ReturnType<typeof vi.fn>
const mockPool = prisma.pool as unknown as {
  findMany: ReturnType<typeof vi.fn>
  findUnique: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

describe('GET /api/pools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/pools')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns all pools for authenticated user', async () => {
    const mockPools = [
      {
        id: 'pool-1',
        name: 'Community Fund',
        description: 'Community funding pool',
        targetAmount: 10000,
        currentAmount: 5000,
        status: 'ACTIVE',
        creatorId: 'user-1',
        createdAt: new Date(),
        _count: { cuts: 2 },
      },
      {
        id: 'pool-2',
        name: 'Emergency Fund',
        description: null,
        targetAmount: 5000,
        currentAmount: 1000,
        status: 'DRAFT',
        creatorId: 'user-2',
        createdAt: new Date(),
        _count: { cuts: 0 },
      },
    ]

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockPool.findMany.mockResolvedValue(mockPools)

    const request = new NextRequest('http://localhost:3000/api/pools')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toHaveLength(2)
    expect(json[0].name).toBe('Community Fund')

    expect(mockPool.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        _count: { select: { cuts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('filters pools by status', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockPool.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/pools?status=ACTIVE')
    await GET(request)

    expect(mockPool.findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE' },
      include: {
        _count: { select: { cuts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockPool.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/pools')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to fetch pools')
  })
})

describe('POST /api/pools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/pools', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Pool', targetAmount: 1000 }),
    })
    const response = await POST(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 403 when user is not admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)

    const request = new NextRequest('http://localhost:3000/api/pools', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Pool', targetAmount: 1000 }),
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toBe('Forbidden: Admin access required')
  })

  it('returns 400 for invalid input - missing required fields', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'WEB_STEWARD' } })
    mockIsAdmin.mockReturnValue(true)

    const request = new NextRequest('http://localhost:3000/api/pools', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Pool' }), // Missing targetAmount
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid input')
  })

  it('returns 400 for invalid targetAmount (negative)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'WEB_STEWARD' } })
    mockIsAdmin.mockReturnValue(true)

    const request = new NextRequest('http://localhost:3000/api/pools', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Pool', targetAmount: -100 }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid input')
  })

  it('creates a pool successfully for admin', async () => {
    const userId = 'admin-123'
    const mockPoolResult = {
      id: 'pool-new',
      name: 'New Community Fund',
      description: 'A new fund for community projects',
      targetAmount: 15000,
      currentAmount: 0,
      status: 'DRAFT',
      creatorId: userId,
      createdAt: new Date(),
      startDate: new Date(),
      endDate: null,
      _count: { cuts: 0 },
    }

    mockAuth.mockResolvedValue({ user: { id: userId, role: 'WEB_STEWARD' } })
    mockIsAdmin.mockReturnValue(true)
    mockPool.create.mockResolvedValue(mockPoolResult)

    const request = new NextRequest('http://localhost:3000/api/pools', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Community Fund',
        description: 'A new fund for community projects',
        targetAmount: 15000,
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.name).toBe('New Community Fund')
    expect(json.targetAmount).toBe(15000)

    expect(mockPool.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'New Community Fund',
        description: 'A new fund for community projects',
        targetAmount: 15000,
        currentAmount: 0,
        status: 'DRAFT',
        creatorId: userId,
      }),
      include: {
        _count: { select: { cuts: true } },
      },
    })
  })

  it('creates a pool with custom status', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'BOARD_CHAIR' } })
    mockIsAdmin.mockReturnValue(true)
    mockPool.create.mockResolvedValue({
      id: 'pool-1',
      status: 'ACTIVE',
      _count: { cuts: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/pools', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Active Pool',
        targetAmount: 5000,
        status: 'ACTIVE',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(mockPool.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'ACTIVE',
      }),
      include: expect.any(Object),
    })
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
    mockIsAdmin.mockReturnValue(true)
    mockPool.create.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/pools', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Pool', targetAmount: 1000 }),
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to create pool')
  })
})

describe('GET /api/pools/[poolId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/pools/pool-123')
    const response = await GET_POOL(request, { params: Promise.resolve({ poolId: 'pool-123' }) })

    expect(response.status).toBe(401)
  })

  it('returns 404 when pool is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockPool.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/pools/non-existent')
    const response = await GET_POOL(request, {
      params: Promise.resolve({ poolId: 'non-existent' }),
    })

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toBe('Pool not found')
  })

  it('returns pool details with cuts', async () => {
    const mockPoolResult = {
      id: 'pool-123',
      name: 'Test Pool',
      description: 'Test description',
      targetAmount: 10000,
      currentAmount: 5000,
      status: 'ACTIVE',
      cuts: [
        {
          id: 'cut-1',
          name: 'Phase 1',
          _count: { pledges: 5, invitations: 10 },
        },
      ],
      _count: { cuts: 1 },
    }

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockPool.findUnique.mockResolvedValue(mockPoolResult)

    const request = new NextRequest('http://localhost:3000/api/pools/pool-123')
    const response = await GET_POOL(request, { params: Promise.resolve({ poolId: 'pool-123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.id).toBe('pool-123')
    expect(json.cuts).toHaveLength(1)
    expect(json._count.cuts).toBe(1)
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockPool.findUnique.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/pools/pool-123')
    const response = await GET_POOL(request, { params: Promise.resolve({ poolId: 'pool-123' }) })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to fetch pool')
  })
})

describe('PATCH /api/pools/[poolId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/pools/pool-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Pool' }),
    })
    const response = await PATCH_POOL(request, { params: Promise.resolve({ poolId: 'pool-123' }) })

    expect(response.status).toBe(401)
  })

  it('returns 404 when pool is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockPool.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/pools/non-existent', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Pool' }),
    })
    const response = await PATCH_POOL(request, {
      params: Promise.resolve({ poolId: 'non-existent' }),
    })

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toBe('Pool not found')
  })

  it('returns 403 when user is not creator or admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockPool.findUnique.mockResolvedValue({
      id: 'pool-123',
      creatorId: 'other-user',
    })

    const request = new NextRequest('http://localhost:3000/api/pools/pool-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Pool' }),
    })
    const response = await PATCH_POOL(request, { params: Promise.resolve({ poolId: 'pool-123' }) })

    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toBe('Forbidden: Only pool creator or admin can update')
  })

  it('allows creator to update pool', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockPool.findUnique.mockResolvedValue({
      id: 'pool-123',
      creatorId: userId,
    })
    mockPool.update.mockResolvedValue({
      id: 'pool-123',
      name: 'Updated Pool',
      _count: { cuts: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/pools/pool-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Pool' }),
    })
    const response = await PATCH_POOL(request, { params: Promise.resolve({ poolId: 'pool-123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.name).toBe('Updated Pool')
  })

  it('allows admin to update any pool', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
    mockIsAdmin.mockReturnValue(true)
    mockPool.findUnique.mockResolvedValue({
      id: 'pool-123',
      creatorId: 'other-user',
    })
    mockPool.update.mockResolvedValue({
      id: 'pool-123',
      name: 'Admin Updated Pool',
      status: 'ACTIVE',
      _count: { cuts: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/pools/pool-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Admin Updated Pool', status: 'ACTIVE' }),
    })
    const response = await PATCH_POOL(request, { params: Promise.resolve({ poolId: 'pool-123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.name).toBe('Admin Updated Pool')
  })

  it('returns 400 for invalid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
    mockIsAdmin.mockReturnValue(true)
    mockPool.findUnique.mockResolvedValue({
      id: 'pool-123',
      creatorId: 'admin-123',
    })

    const request = new NextRequest('http://localhost:3000/api/pools/pool-123', {
      method: 'PATCH',
      body: JSON.stringify({ targetAmount: -500 }), // Invalid negative amount
    })
    const response = await PATCH_POOL(request, { params: Promise.resolve({ poolId: 'pool-123' }) })

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid input')
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockPool.findUnique.mockResolvedValue({
      id: 'pool-123',
      creatorId: 'user-123',
    })
    mockPool.update.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/pools/pool-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Pool' }),
    })
    const response = await PATCH_POOL(request, { params: Promise.resolve({ poolId: 'pool-123' }) })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to update pool')
  })
})
