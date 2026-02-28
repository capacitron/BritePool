import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth - must be before imports
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock rate limiting - return null to allow requests through
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
  RateLimitConfigs: {
    moderate: { windowMs: 60000, maxRequests: 30 },
  },
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    wealthOpportunity: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    userWGOInvolvement: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Import after mocking
import { GET, POST } from '@/app/api/wgo/route'
import {
  GET as GET_WGO,
  PATCH as PATCH_WGO,
  DELETE as DELETE_WGO,
} from '@/app/api/wgo/[wgoId]/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Cast mocks for type safety
const mockAuth = auth as ReturnType<typeof vi.fn>
const mockWGO = prisma.wealthOpportunity as unknown as {
  findMany: ReturnType<typeof vi.fn>
  findUnique: ReturnType<typeof vi.fn>
  count: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}
const mockUserInvolvement = (
  prisma as unknown as { userWGOInvolvement: { findMany: ReturnType<typeof vi.fn> } }
).userWGOInvolvement
const mockUser = (prisma as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user

describe('GET /api/wgo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserInvolvement.findMany.mockResolvedValue([])
    mockUser.findUnique.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/wgo')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns WGOs with pagination', async () => {
    const userId = 'user-123'
    const mockWGOs = [
      {
        id: 'wgo-1',
        title: 'Investment Opportunity',
        description: 'A great investment',
        category: 'CRYPTO_AI_TRADING',
        status: 'ACTIVE',
        creatorId: userId,
        involvements: [{ userId, role: 'LEADER' }],
        _count: { involvements: 5, forumPosts: 10 },
      },
      {
        id: 'wgo-2',
        title: 'Real Estate Project',
        description: 'Property development',
        category: 'NODES',
        status: 'DRAFT',
        creatorId: 'other-user',
        involvements: [],
        _count: { involvements: 2, forumPosts: 0 },
      },
    ]

    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockWGO.findMany.mockResolvedValue(mockWGOs)
    mockWGO.count.mockResolvedValue(2)
    mockUserInvolvement.findMany.mockResolvedValue([
      {
        wgoId: 'wgo-1',
        id: 'inv-1',
        role: 'LEADER',
        status: 'ACTIVE',
        affiliateLink: null,
        joinedAt: new Date(),
        userId,
      },
    ])

    const request = new NextRequest('http://localhost:3000/api/wgo')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()

    expect(json.data).toHaveLength(2)
    expect(json.data[0].involvementCount).toBe(5)
    expect(json.data[0].isInvolved).toBe(true)
    expect(json.data[1].isInvolved).toBe(false)
    expect(json.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    })
  })

  it('filters by category', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockWGO.findMany.mockResolvedValue([])
    mockWGO.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost:3000/api/wgo?category=NODES')
    await GET(request)

    expect(mockWGO.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'NODES' }),
      })
    )
  })

  it('filters by status', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockWGO.findMany.mockResolvedValue([])
    mockWGO.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost:3000/api/wgo?status=ACTIVE')
    await GET(request)

    expect(mockWGO.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
      })
    )
  })

  it('searches by title and description', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockWGO.findMany.mockResolvedValue([])
    mockWGO.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost:3000/api/wgo?search=investment')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockWGO.findMany).toHaveBeenCalled()
    // The where clause includes both draft-visibility and search conditions
    const callArgs = mockWGO.findMany.mock.calls[0]![0]
    const whereStr = JSON.stringify(callArgs.where)
    expect(whereStr).toContain('investment')
  })

  it('paginates correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockWGO.findMany.mockResolvedValue([])
    mockWGO.count.mockResolvedValue(100)

    const request = new NextRequest('http://localhost:3000/api/wgo?page=3&limit=10')
    const response = await GET(request)

    expect(mockWGO.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    )

    const json = await response.json()
    expect(json.pagination.page).toBe(3)
    expect(json.pagination.limit).toBe(10)
    expect(json.pagination.totalPages).toBe(10)
  })

  it('returns 400 for invalid query parameters', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })

    const request = new NextRequest('http://localhost:3000/api/wgo?category=INVALID')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid query parameters')
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockWGO.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/wgo')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to fetch wealth opportunities')
  })
})

describe('POST /api/wgo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserInvolvement.findMany.mockResolvedValue([])
    mockUser.findUnique.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/wgo', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test WGO',
        description: 'Test description',
        category: 'CRYPTO_AI_TRADING',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid input - title too long', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })

    const request = new NextRequest('http://localhost:3000/api/wgo', {
      method: 'POST',
      body: JSON.stringify({ title: 'A'.repeat(201) }), // Exceeds 200 char limit
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid input')
  })

  it('returns 400 for invalid category', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })

    const request = new NextRequest('http://localhost:3000/api/wgo', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test WGO',
        description: 'Test description',
        category: 'INVALID_CATEGORY',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('creates a WGO successfully with creator as leader', async () => {
    const userId = 'user-123'
    const mockWGOResult = {
      id: 'wgo-new',
      title: 'New Investment',
      description: 'A great opportunity',
      category: 'CRYPTO_AI_TRADING',
      status: 'ACTIVE',
      creatorId: userId,
      involvements: [{ userId, role: 'LEADER', status: 'ACTIVE' }],
      _count: { involvements: 1, forumPosts: 0 },
    }

    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockWGO.create.mockResolvedValue(mockWGOResult)

    const request = new NextRequest('http://localhost:3000/api/wgo', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Investment',
        description: 'A great opportunity',
        category: 'CRYPTO_AI_TRADING',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.title).toBe('New Investment')
    expect(json.involvements[0].role).toBe('LEADER')

    expect(mockWGO.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'New Investment',
        description: 'A great opportunity',
        category: 'CRYPTO_AI_TRADING',
        status: 'ACTIVE',
        creatorId: userId,
        involvements: {
          create: {
            userId,
            role: 'LEADER',
            status: 'ACTIVE',
          },
        },
      }),
      include: expect.any(Object),
    })
  })

  it('creates a WGO with optional fields', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockWGO.create.mockResolvedValue({
      id: 'wgo-new',
      status: 'ACTIVE',
      targetAmount: 50000,
      _count: { involvements: 1, forumPosts: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/wgo', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Premium Investment',
        description: 'High value opportunity',
        category: 'MEMBERSHIP',
        status: 'ACTIVE',
        targetAmount: 50000,
        startDate: '2024-01-01T00:00:00.000Z',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockWGO.create.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/wgo', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test WGO',
        description: 'Test description',
        category: 'CRYPTO_AI_TRADING',
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toContain('Failed to create wealth opportunity')
  })
})

describe('GET /api/wgo/[wgoId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserInvolvement.findMany.mockResolvedValue([])
    mockUser.findUnique.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123')
    const response = await GET_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(401)
  })

  it('returns 404 when WGO is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockWGO.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/wgo/non-existent')
    const response = await GET_WGO(request, { params: Promise.resolve({ wgoId: 'non-existent' }) })

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toBe('Wealth opportunity not found')
  })

  it('returns WGO details with user involvement info', async () => {
    const userId = 'user-123'
    const mockWGOResult = {
      id: 'wgo-123',
      title: 'Investment Opportunity',
      description: 'Great investment',
      category: 'CRYPTO_AI_TRADING',
      status: 'ACTIVE',
      creatorId: userId,
      involvements: [
        { userId, role: 'LEADER', status: 'ACTIVE' },
        { userId: 'other-user', role: 'MEMBER', status: 'ACTIVE' },
      ],
      forumPosts: [],
      _count: { involvements: 2, forumPosts: 5 },
    }

    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockWGO.findUnique.mockResolvedValue(mockWGOResult)

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123')
    const response = await GET_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()

    expect(json.id).toBe('wgo-123')
    expect(json.isInvolved).toBe(true)
    expect(json.isCreator).toBe(true)
    expect(json.isLeader).toBe(true)
    expect(json.involvementCount).toBe(2)
    expect(json.forumPostCount).toBe(5)
  })

  it('returns correct involvement status for non-involved user', async () => {
    const mockWGOResult = {
      id: 'wgo-123',
      title: 'Investment Opportunity',
      creatorId: 'other-user',
      involvements: [],
      forumPosts: [],
      _count: { involvements: 5, forumPosts: 0 },
    }

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockWGO.findUnique.mockResolvedValue(mockWGOResult)

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123')
    const response = await GET_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    const json = await response.json()
    expect(json.isInvolved).toBe(false)
    expect(json.isCreator).toBe(false)
    expect(json.userInvolvement).toBeNull()
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockWGO.findUnique.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123')
    const response = await GET_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to fetch wealth opportunity')
  })
})

describe('PATCH /api/wgo/[wgoId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserInvolvement.findMany.mockResolvedValue([])
    mockUser.findUnique.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    })
    const response = await PATCH_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(401)
  })

  it('returns 404 when WGO is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/wgo/non-existent', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    })
    const response = await PATCH_WGO(request, {
      params: Promise.resolve({ wgoId: 'non-existent' }),
    })

    expect(response.status).toBe(404)
  })

  it('returns 403 when user has no permission', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: 'other-user',
      involvements: [],
    })

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    })
    const response = await PATCH_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toBe('Forbidden: You do not have permission to update this WGO')
  })

  it('allows creator to update WGO', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: userId,
      involvements: [],
    })
    mockWGO.update.mockResolvedValue({
      id: 'wgo-123',
      title: 'Updated Title',
      _count: { involvements: 1, forumPosts: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    })
    const response = await PATCH_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.title).toBe('Updated Title')
  })

  it('allows leader to update WGO', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: 'other-user',
      involvements: [{ userId, role: 'LEADER' }],
    })
    mockWGO.update.mockResolvedValue({
      id: 'wgo-123',
      status: 'ACTIVE',
      _count: { involvements: 1, forumPosts: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    })
    const response = await PATCH_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(200)
  })

  it('allows coordinator to update WGO', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: 'other-user',
      involvements: [{ userId, role: 'COORDINATOR' }],
    })
    mockWGO.update.mockResolvedValue({
      id: 'wgo-123',
      description: 'Updated description',
      _count: { involvements: 1, forumPosts: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Updated description' }),
    })
    const response = await PATCH_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(200)
  })

  it('allows admin to update any WGO', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: 'other-user',
      involvements: [],
    })
    mockWGO.update.mockResolvedValue({
      id: 'wgo-123',
      title: 'Admin Updated',
      _count: { involvements: 0, forumPosts: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Admin Updated' }),
    })
    const response = await PATCH_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(200)
  })

  it('returns 400 for invalid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: 'user-123',
      involvements: [],
    })

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'PATCH',
      body: JSON.stringify({ category: 'INVALID_CATEGORY' }),
    })
    const response = await PATCH_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/wgo/[wgoId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserInvolvement.findMany.mockResolvedValue([])
    mockUser.findUnique.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'DELETE',
    })
    const response = await DELETE_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(401)
  })

  it('returns 404 when WGO is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/wgo/non-existent', {
      method: 'DELETE',
    })
    const response = await DELETE_WGO(request, {
      params: Promise.resolve({ wgoId: 'non-existent' }),
    })

    expect(response.status).toBe(404)
  })

  it('returns 403 when user is not creator or admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: 'other-user',
    })

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'DELETE',
    })
    const response = await DELETE_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toBe('Forbidden: You do not have permission to delete this WGO')
  })

  it('allows creator to delete WGO', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: userId,
    })
    mockWGO.delete.mockResolvedValue({ id: 'wgo-123' })

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'DELETE',
    })
    const response = await DELETE_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.message).toBe('Wealth opportunity deleted successfully')

    expect(mockWGO.delete).toHaveBeenCalledWith({
      where: { id: 'wgo-123' },
    })
  })

  it('allows admin to delete any WGO', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'BOARD_CHAIR' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: 'other-user',
    })
    mockWGO.delete.mockResolvedValue({ id: 'wgo-123' })

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'DELETE',
    })
    const response = await DELETE_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(200)
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockWGO.findUnique.mockResolvedValue({
      id: 'wgo-123',
      creatorId: 'user-123',
    })
    mockWGO.delete.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/wgo/wgo-123', {
      method: 'DELETE',
    })
    const response = await DELETE_WGO(request, { params: Promise.resolve({ wgoId: 'wgo-123' }) })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to delete wealth opportunity')
  })
})
