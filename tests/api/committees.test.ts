import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth - must be before imports
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock api-utils
vi.mock('@/lib/api-utils', () => ({
  logError: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    committee: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    committeeMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

// Import after mocking
import { POST, DELETE } from '@/app/api/committees/[committeeId]/members/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Cast mocks for type safety
const mockAuth = auth as ReturnType<typeof vi.fn>
const mockCommittee = prisma.committee as unknown as {
  findUnique: ReturnType<typeof vi.fn>
  findMany: ReturnType<typeof vi.fn>
}
const mockCommitteeMember = prisma.committeeMember as unknown as {
  findUnique: ReturnType<typeof vi.fn>
  findFirst: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  updateMany: ReturnType<typeof vi.fn>
}

describe('POST /api/committees/[committeeId]/members - Join Committee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/committees/committee-1/members', {
      method: 'POST',
    })
    const response = await POST(request, { params: Promise.resolve({ committeeId: 'committee-1' }) })

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 404 when committee does not exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockCommittee.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/committees/non-existent/members', {
      method: 'POST',
    })
    const response = await POST(request, { params: Promise.resolve({ committeeId: 'non-existent' }) })

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toBe('Committee not found')
  })

  it('returns 409 when user is already a member', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockCommittee.findUnique.mockResolvedValue({ id: 'committee-1', name: 'Test Committee' })
    mockCommitteeMember.findUnique.mockResolvedValue({
      id: 'member-1',
      userId: 'user-123',
      committeeId: 'committee-1',
    })

    const request = new NextRequest('http://localhost:3000/api/committees/committee-1/members', {
      method: 'POST',
    })
    const response = await POST(request, { params: Promise.resolve({ committeeId: 'committee-1' }) })

    expect(response.status).toBe(409)
    const json = await response.json()
    expect(json.error).toBe('Already a member of this committee')
  })

  it('creates membership with PENDING status successfully', async () => {
    const userId = 'user-123'
    const committeeId = 'committee-1'

    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockCommittee.findUnique.mockResolvedValue({ id: committeeId, name: 'Test Committee' })
    mockCommitteeMember.findUnique.mockResolvedValue(null)
    mockCommitteeMember.create.mockResolvedValue({
      id: 'member-new',
      userId,
      committeeId,
      role: 'MEMBER',
      status: 'PENDING',
      user: { id: userId, name: 'Test User', email: 'test@example.com', role: 'STEWARD' },
      committee: { id: committeeId, name: 'Test Committee' },
    })

    const request = new NextRequest('http://localhost:3000/api/committees/committee-1/members', {
      method: 'POST',
    })
    const response = await POST(request, { params: Promise.resolve({ committeeId }) })

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.status).toBe('PENDING')
    expect(json.role).toBe('MEMBER')
    expect(json.message).toBe('Your request to join has been submitted for approval.')

    expect(mockCommitteeMember.create).toHaveBeenCalledWith({
      data: {
        userId,
        committeeId,
        role: 'MEMBER',
        status: 'PENDING',
      },
      include: expect.any(Object),
    })
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockCommittee.findUnique.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/committees/committee-1/members', {
      method: 'POST',
    })
    const response = await POST(request, { params: Promise.resolve({ committeeId: 'committee-1' }) })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to join committee')
  })
})

describe('DELETE /api/committees/[committeeId]/members - Leave Committee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/committees/committee-1/members', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ committeeId: 'committee-1' }) })

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 404 when user is not a member', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockCommitteeMember.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/committees/committee-1/members', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ committeeId: 'committee-1' }) })

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toBe('Not a member of this committee')
  })

  it('deletes membership successfully', async () => {
    const userId = 'user-123'

    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockCommitteeMember.findUnique.mockResolvedValue({
      id: 'member-1',
      userId,
      committeeId: 'committee-1',
    })
    mockCommitteeMember.delete.mockResolvedValue({ id: 'member-1' })

    const request = new NextRequest('http://localhost:3000/api/committees/committee-1/members', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ committeeId: 'committee-1' }) })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)

    expect(mockCommitteeMember.delete).toHaveBeenCalledWith({
      where: { id: 'member-1' },
    })
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockCommitteeMember.findUnique.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/committees/committee-1/members', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ committeeId: 'committee-1' }) })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to leave committee')
  })
})
