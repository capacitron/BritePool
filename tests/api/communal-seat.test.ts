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
  rateLimit: vi.fn().mockResolvedValue(null),
  RateLimitConfigs: {
    submissions: { windowMs: 60000, maxRequests: 10 },
  },
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    communalSeatSubmission: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

// Import after mocking
import { GET, POST } from '@/app/api/communal-seat/route'
import {
  GET as GET_SUBMISSION,
  PATCH as PATCH_SUBMISSION,
  DELETE as DELETE_SUBMISSION,
} from '@/app/api/communal-seat/[submissionId]/route'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma'

// Cast mocks for type safety
const mockAuth = auth as ReturnType<typeof vi.fn>
const mockIsAdmin = isAdmin as ReturnType<typeof vi.fn>
const mockSubmission = prisma.communalSeatSubmission as unknown as {
  findMany: ReturnType<typeof vi.fn>
  findUnique: ReturnType<typeof vi.fn>
  findFirst: ReturnType<typeof vi.fn>
  count: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}
const mockUser = prisma.user as unknown as {
  findMany: ReturnType<typeof vi.fn>
  findUnique: ReturnType<typeof vi.fn>
}

describe('GET /api/communal-seat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/communal-seat')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns only own submissions for regular user', async () => {
    const userId = 'user-123'
    const mockSubmissions = [
      {
        id: 'sub-1',
        userId,
        category: 'GOVERNANCE',
        status: 'PENDING',
        applicationData: { name: 'John' },
        submittedAt: new Date(),
      },
    ]

    mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockSubmission.count.mockResolvedValue(1)
    mockSubmission.findMany.mockResolvedValue(mockSubmissions)

    const request = new NextRequest('http://localhost:3000/api/communal-seat')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()

    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)

    expect(mockSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId }),
      })
    )
  })

  it('returns all submissions with user info for admin', async () => {
    const mockSubmissions = [
      {
        id: 'sub-1',
        userId: 'user-1',
        category: 'GOVERNANCE',
        status: 'PENDING',
        applicationData: {},
        submittedAt: new Date(),
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        category: 'WEALTH',
        status: 'UNDER_REVIEW',
        applicationData: {},
        submittedAt: new Date(),
      },
    ]
    const mockUsers = [
      { id: 'user-1', name: 'User One', email: 'user1@test.com' },
      { id: 'user-2', name: 'User Two', email: 'user2@test.com' },
    ]

    mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
    mockIsAdmin.mockReturnValue(true)
    mockSubmission.count.mockResolvedValue(2)
    mockSubmission.findMany.mockResolvedValue(mockSubmissions)
    mockUser.findMany.mockResolvedValue(mockUsers)

    const request = new NextRequest('http://localhost:3000/api/communal-seat')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()

    expect(json.data).toHaveLength(2)
    expect(json.data[0].user).toBeDefined()
    expect(json.data[0].user.name).toBe('User One')
  })

  it('filters by status', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockSubmission.count.mockResolvedValue(0)
    mockSubmission.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/communal-seat?status=PENDING')
    await GET(request)

    expect(mockSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING' }),
      })
    )
  })

  it('filters by category', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockSubmission.count.mockResolvedValue(0)
    mockSubmission.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/communal-seat?category=GOVERNANCE')
    await GET(request)

    expect(mockSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'GOVERNANCE' }),
      })
    )
  })

  it('paginates correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockSubmission.count.mockResolvedValue(50)
    mockSubmission.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/communal-seat?page=3&limit=10')
    const response = await GET(request)

    expect(mockSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    )

    const json = await response.json()
    expect(json.meta.page).toBe(3)
    expect(json.meta.totalPages).toBe(5)
  })

  it('returns 400 for invalid query parameters', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })

    const request = new NextRequest('http://localhost:3000/api/communal-seat?status=INVALID')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid query parameters')
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockSubmission.count.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/communal-seat')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to fetch submissions')
  })
})

describe('POST /api/communal-seat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/communal-seat', {
      method: 'POST',
      body: JSON.stringify({
        category: 'GOVERNANCE',
        applicationData: { name: 'Test' },
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid input - missing category', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })

    const request = new NextRequest('http://localhost:3000/api/communal-seat', {
      method: 'POST',
      body: JSON.stringify({
        applicationData: { name: 'Test' },
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid input')
  })

  it('returns 400 for invalid input - empty applicationData', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })

    const request = new NextRequest('http://localhost:3000/api/communal-seat', {
      method: 'POST',
      body: JSON.stringify({
        category: 'GOVERNANCE',
        applicationData: {},
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid input')
  })

  it('returns 400 for invalid category', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })

    const request = new NextRequest('http://localhost:3000/api/communal-seat', {
      method: 'POST',
      body: JSON.stringify({
        category: 'INVALID_CATEGORY',
        applicationData: { name: 'Test' },
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 409 when user has pending submission for same category', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockSubmission.findFirst.mockResolvedValue({
      id: 'existing-sub',
      status: 'PENDING',
    })

    const request = new NextRequest('http://localhost:3000/api/communal-seat', {
      method: 'POST',
      body: JSON.stringify({
        category: 'GOVERNANCE',
        applicationData: { name: 'Test' },
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(409)
    const json = await response.json()
    expect(json.error).toContain('already have a pending submission')
  })

  it('creates a submission successfully', async () => {
    const userId = 'user-123'
    const mockSubmissionResult = {
      id: 'sub-new',
      userId,
      category: 'GOVERNANCE',
      status: 'PENDING',
      applicationData: { name: 'John Doe', experience: '5 years' },
      submittedAt: new Date(),
    }

    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockSubmission.findFirst.mockResolvedValue(null)
    mockSubmission.create.mockResolvedValue(mockSubmissionResult)

    const request = new NextRequest('http://localhost:3000/api/communal-seat', {
      method: 'POST',
      body: JSON.stringify({
        category: 'GOVERNANCE',
        applicationData: { name: 'John Doe', experience: '5 years' },
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.id).toBe('sub-new')
    expect(json.status).toBe('PENDING')

    expect(mockSubmission.create).toHaveBeenCalledWith({
      data: {
        userId,
        category: 'GOVERNANCE',
        applicationData: { name: 'John Doe', experience: '5 years' },
        status: 'PENDING',
      },
    })
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockSubmission.findFirst.mockResolvedValue(null)
    mockSubmission.create.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/communal-seat', {
      method: 'POST',
      body: JSON.stringify({
        category: 'GOVERNANCE',
        applicationData: { name: 'Test' },
      }),
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to create submission')
  })
})

describe('GET /api/communal-seat/[submissionId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123')
    const response = await GET_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(401)
  })

  it('returns 404 when submission is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockSubmission.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/communal-seat/non-existent')
    const response = await GET_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'non-existent' }),
    })

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toBe('Submission not found')
  })

  it('returns 403 when non-admin tries to view other user submission', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockSubmission.findUnique.mockResolvedValue({
      id: 'sub-123',
      userId: 'other-user',
    })

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123')
    const response = await GET_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toBe('Forbidden')
  })

  it('returns submission for owner', async () => {
    const userId = 'user-123'
    const mockSubmissionResult = {
      id: 'sub-123',
      userId,
      category: 'GOVERNANCE',
      status: 'PENDING',
      applicationData: { name: 'Test' },
    }

    mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockSubmission.findUnique.mockResolvedValue(mockSubmissionResult)

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123')
    const response = await GET_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.id).toBe('sub-123')
  })

  it('returns submission with user details for admin', async () => {
    const mockSubmissionResult = {
      id: 'sub-123',
      userId: 'other-user',
      reviewerId: 'reviewer-id',
      category: 'GOVERNANCE',
      status: 'UNDER_REVIEW',
    }
    const mockUserResult = { id: 'other-user', name: 'Other User', email: 'other@test.com' }
    const mockReviewer = { id: 'reviewer-id', name: 'Reviewer' }

    mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
    mockIsAdmin.mockReturnValue(true)
    mockSubmission.findUnique.mockResolvedValue(mockSubmissionResult)
    mockUser.findUnique.mockResolvedValueOnce(mockUserResult).mockResolvedValueOnce(mockReviewer)

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123')
    const response = await GET_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.user.name).toBe('Other User')
    expect(json.reviewer.name).toBe('Reviewer')
  })
})

describe('PATCH /api/communal-seat/[submissionId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'WITHDRAWN' }),
    })
    const response = await PATCH_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(401)
  })

  it('returns 404 when submission is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockSubmission.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/communal-seat/non-existent', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'WITHDRAWN' }),
    })
    const response = await PATCH_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'non-existent' }),
    })

    expect(response.status).toBe(404)
  })

  it('returns 403 when non-owner, non-admin tries to update', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockSubmission.findUnique.mockResolvedValue({
      id: 'sub-123',
      userId: 'other-user',
      status: 'PENDING',
    })

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'WITHDRAWN' }),
    })
    const response = await PATCH_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(403)
  })

  describe('Owner withdrawal', () => {
    it('allows owner to withdraw pending submission', async () => {
      const userId = 'user-123'
      mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
      mockIsAdmin.mockReturnValue(false)
      mockSubmission.findUnique.mockResolvedValue({
        id: 'sub-123',
        userId,
        status: 'PENDING',
      })
      mockSubmission.update.mockResolvedValue({
        id: 'sub-123',
        userId,
        status: 'WITHDRAWN',
      })

      const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'WITHDRAWN' }),
      })
      const response = await PATCH_SUBMISSION(request, {
        params: Promise.resolve({ submissionId: 'sub-123' }),
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.status).toBe('WITHDRAWN')
    })

    it('returns 400 when owner tries to withdraw approved submission', async () => {
      const userId = 'user-123'
      mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
      mockIsAdmin.mockReturnValue(false)
      mockSubmission.findUnique.mockResolvedValue({
        id: 'sub-123',
        userId,
        status: 'APPROVED',
      })

      const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'WITHDRAWN' }),
      })
      const response = await PATCH_SUBMISSION(request, {
        params: Promise.resolve({ submissionId: 'sub-123' }),
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('Cannot withdraw')
    })

    it('returns 400 when owner tries to set status other than WITHDRAWN', async () => {
      const userId = 'user-123'
      mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
      mockIsAdmin.mockReturnValue(false)
      mockSubmission.findUnique.mockResolvedValue({
        id: 'sub-123',
        userId,
        status: 'PENDING',
      })

      const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      const response = await PATCH_SUBMISSION(request, {
        params: Promise.resolve({ submissionId: 'sub-123' }),
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('Owners can only withdraw')
    })

    it('returns 400 when submission is already withdrawn', async () => {
      const userId = 'user-123'
      mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
      mockIsAdmin.mockReturnValue(false)
      mockSubmission.findUnique.mockResolvedValue({
        id: 'sub-123',
        userId,
        status: 'WITHDRAWN',
      })

      const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'WITHDRAWN' }),
      })
      const response = await PATCH_SUBMISSION(request, {
        params: Promise.resolve({ submissionId: 'sub-123' }),
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('already withdrawn')
    })
  })

  describe('Admin review', () => {
    it('allows admin to approve submission', async () => {
      const mockUserResult = { id: 'other-user', name: 'User', email: 'user@test.com' }

      mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
      mockIsAdmin.mockReturnValue(true)
      mockSubmission.findUnique.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        status: 'PENDING',
      })
      mockSubmission.update.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        status: 'APPROVED',
        reviewerId: 'admin-123',
        reviewedAt: new Date(),
      })
      mockUser.findUnique.mockResolvedValue(mockUserResult)

      const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      const response = await PATCH_SUBMISSION(request, {
        params: Promise.resolve({ submissionId: 'sub-123' }),
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.status).toBe('APPROVED')
      expect(json.user.name).toBe('User')
    })

    it('allows admin to reject with notes', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'BOARD_CHAIR' } })
      mockIsAdmin.mockReturnValue(true)
      mockSubmission.findUnique.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        status: 'UNDER_REVIEW',
      })
      mockSubmission.update.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        status: 'REJECTED',
        reviewNotes: 'Does not meet requirements',
      })
      mockUser.findUnique.mockResolvedValue({ id: 'other-user', name: 'User', email: 'u@t.com' })

      const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'REJECTED',
          reviewNotes: 'Does not meet requirements',
        }),
      })
      const response = await PATCH_SUBMISSION(request, {
        params: Promise.resolve({ submissionId: 'sub-123' }),
      })

      expect(response.status).toBe(200)

      expect(mockSubmission.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: expect.objectContaining({
          status: 'REJECTED',
          reviewNotes: 'Does not meet requirements',
          reviewerId: 'admin-123',
          reviewedAt: expect.any(Date),
        }),
      })
    })

    it('allows admin to set status to under review', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
      mockIsAdmin.mockReturnValue(true)
      mockSubmission.findUnique.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        status: 'PENDING',
      })
      mockSubmission.update.mockResolvedValue({
        id: 'sub-123',
        status: 'UNDER_REVIEW',
      })
      mockUser.findUnique.mockResolvedValue({ id: 'other-user', name: 'User', email: 'u@t.com' })

      const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'UNDER_REVIEW' }),
      })
      const response = await PATCH_SUBMISSION(request, {
        params: Promise.resolve({ submissionId: 'sub-123' }),
      })

      expect(response.status).toBe(200)
    })

    it('returns 400 when admin tries to update withdrawn submission', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
      mockIsAdmin.mockReturnValue(true)
      mockSubmission.findUnique.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        status: 'WITHDRAWN',
      })

      const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      const response = await PATCH_SUBMISSION(request, {
        params: Promise.resolve({ submissionId: 'sub-123' }),
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('Cannot update a withdrawn submission')
    })

    it('returns 400 for invalid admin status', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'admin-123', role: 'WEB_STEWARD' } })
      mockIsAdmin.mockReturnValue(true)
      mockSubmission.findUnique.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        status: 'PENDING',
      })

      const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PENDING' }), // Admin can't set to PENDING
      })
      const response = await PATCH_SUBMISSION(request, {
        params: Promise.resolve({ submissionId: 'sub-123' }),
      })

      expect(response.status).toBe(400)
    })
  })

  it('returns 500 on database error', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'RESIDENT' } })
    mockIsAdmin.mockReturnValue(false)
    mockSubmission.findUnique.mockResolvedValue({
      id: 'sub-123',
      userId,
      status: 'PENDING',
    })
    mockSubmission.update.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'WITHDRAWN' }),
    })
    const response = await PATCH_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to update submission')
  })
})

describe('DELETE /api/communal-seat/[submissionId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
      method: 'DELETE',
    })
    const response = await DELETE_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(401)
  })

  it('returns 404 when submission is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockSubmission.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/communal-seat/non-existent', {
      method: 'DELETE',
    })
    const response = await DELETE_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'non-existent' }),
    })

    expect(response.status).toBe(404)
  })

  it('returns 403 when non-owner tries to delete', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockSubmission.findUnique.mockResolvedValue({
      id: 'sub-123',
      userId: 'other-user',
      status: 'PENDING',
    })

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
      method: 'DELETE',
    })
    const response = await DELETE_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toContain('Only the submission owner can delete')
  })

  it('returns 400 when trying to delete non-pending submission', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockSubmission.findUnique.mockResolvedValue({
      id: 'sub-123',
      userId,
      status: 'UNDER_REVIEW',
    })

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
      method: 'DELETE',
    })
    const response = await DELETE_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('Can only delete submissions with PENDING status')
  })

  it('allows owner to delete pending submission', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockSubmission.findUnique.mockResolvedValue({
      id: 'sub-123',
      userId,
      status: 'PENDING',
    })
    mockSubmission.delete.mockResolvedValue({ id: 'sub-123' })

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
      method: 'DELETE',
    })
    const response = await DELETE_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.message).toBe('Submission deleted successfully')

    expect(mockSubmission.delete).toHaveBeenCalledWith({
      where: { id: 'sub-123' },
    })
  })

  it('returns 500 on database error', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockSubmission.findUnique.mockResolvedValue({
      id: 'sub-123',
      userId,
      status: 'PENDING',
    })
    mockSubmission.delete.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/communal-seat/sub-123', {
      method: 'DELETE',
    })
    const response = await DELETE_SUBMISSION(request, {
      params: Promise.resolve({ submissionId: 'sub-123' }),
    })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to delete submission')
  })
})
