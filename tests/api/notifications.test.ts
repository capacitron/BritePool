import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth - must be before imports
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
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
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

// Import after mocking
import { GET, PATCH } from '@/app/api/notifications/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Cast mocks for type safety
const mockAuth = auth as ReturnType<typeof vi.fn>
const mockNotification = prisma.notification as unknown as {
  findMany: ReturnType<typeof vi.fn>
  count: ReturnType<typeof vi.fn>
  updateMany: ReturnType<typeof vi.fn>
}

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/notifications')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} })

    const request = new NextRequest('http://localhost:3000/api/notifications')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns user notifications with default pagination', async () => {
    const userId = 'user-123'
    const mockNotifications = [
      {
        id: 'notif-1',
        type: 'COMMENT',
        title: 'New Comment',
        message: 'Someone commented on your post',
        link: '/posts/1',
        isRead: false,
        metadata: null,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'notif-2',
        type: 'MENTION',
        title: 'You were mentioned',
        message: 'You were mentioned in a discussion',
        link: '/forum/2',
        isRead: true,
        metadata: null,
        createdAt: new Date('2024-01-02'),
      },
    ]

    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockNotification.findMany.mockResolvedValue(mockNotifications)
    mockNotification.count
      .mockResolvedValueOnce(2) // total count
      .mockResolvedValueOnce(1) // unread count

    const request = new NextRequest('http://localhost:3000/api/notifications')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()

    expect(json.notifications).toHaveLength(2)
    expect(json.unreadCount).toBe(1)
    expect(json.pagination).toEqual({
      page: 1,
      limit: 20,
      totalCount: 2,
      totalPages: 1,
      hasMore: false,
    })

    expect(mockNotification.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        metadata: true,
        createdAt: true,
      },
    })
  })

  it('returns notifications with custom pagination', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockNotification.findMany.mockResolvedValue([])
    mockNotification.count.mockResolvedValueOnce(50).mockResolvedValueOnce(10)

    const request = new NextRequest('http://localhost:3000/api/notifications?page=3&limit=10')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()

    expect(json.pagination).toEqual({
      page: 3,
      limit: 10,
      totalCount: 50,
      totalPages: 5,
      hasMore: true,
    })

    expect(mockNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    )
  })

  it('limits page size to 100', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockNotification.findMany.mockResolvedValue([])
    mockNotification.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0)

    const request = new NextRequest('http://localhost:3000/api/notifications?limit=500')
    await GET(request)

    expect(mockNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    )
  })

  it('filters by read status (unread only)', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockNotification.findMany.mockResolvedValue([])
    mockNotification.count.mockResolvedValueOnce(5).mockResolvedValueOnce(5)

    const request = new NextRequest('http://localhost:3000/api/notifications?isRead=false')
    await GET(request)

    expect(mockNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, isRead: false },
      })
    )
  })

  it('filters by read status (read only)', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockNotification.findMany.mockResolvedValue([])
    mockNotification.count.mockResolvedValueOnce(10).mockResolvedValueOnce(0)

    const request = new NextRequest('http://localhost:3000/api/notifications?isRead=true')
    await GET(request)

    expect(mockNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, isRead: true },
      })
    )
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockNotification.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/notifications')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to fetch notifications')
  })
})

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds: ['1'] }),
    })
    const response = await PATCH(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 400 when neither notificationIds nor markAllRead provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const response = await PATCH(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Either notificationIds array or markAllRead must be provided')
  })

  it('returns 400 when notificationIds is empty array', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds: [] }),
    })
    const response = await PATCH(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Either notificationIds array or markAllRead must be provided')
  })

  it('marks specific notifications as read', async () => {
    const userId = 'user-123'
    const notificationIds = ['notif-1', 'notif-2']
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockNotification.updateMany.mockResolvedValue({ count: 2 })

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds }),
    })
    const response = await PATCH(request)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.updatedCount).toBe(2)

    expect(mockNotification.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: notificationIds },
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
  })

  it('marks all notifications as read when markAllRead is true', async () => {
    const userId = 'user-123'
    mockAuth.mockResolvedValue({ user: { id: userId } })
    mockNotification.updateMany.mockResolvedValue({ count: 15 })

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ markAllRead: true }),
    })
    const response = await PATCH(request)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.updatedCount).toBe(15)

    expect(mockNotification.updateMany).toHaveBeenCalledWith({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockNotification.updateMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ markAllRead: true }),
    })
    const response = await PATCH(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to update notifications')
  })
})
