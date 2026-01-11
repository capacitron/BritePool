import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'

// GET: Fetch user's notifications with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'notifications', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const isReadFilter = searchParams.get('isRead')

    const skip = (page - 1) * limit

    // Build where clause
    const where: { userId: string; isRead?: boolean } = {
      userId: session.user.id,
    }

    // Filter by read status if provided
    if (isReadFilter === 'true') {
      where.isRead = true
    } else if (isReadFilter === 'false') {
      where.isRead = false
    }

    // Fetch notifications and counts in single transaction for better performance
    const [notifications, totalCount, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + notifications.length < totalCount,
      },
    })
  } catch (error) {
    logError(error, { action: 'fetch_notifications' })
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// PATCH: Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'notifications', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllRead } = body as {
      notificationIds?: string[]
      markAllRead?: boolean
    }

    // Validate input
    if (
      !markAllRead &&
      (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0)
    ) {
      return NextResponse.json(
        { error: 'Either notificationIds array or markAllRead must be provided' },
        { status: 400 }
      )
    }

    let updatedCount: number

    if (markAllRead) {
      // Mark all unread notifications as read for this user
      const result = await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })
      updatedCount = result.count
    } else {
      // Mark specific notifications as read (only if they belong to the user)
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })
      updatedCount = result.count
    }

    return NextResponse.json({
      success: true,
      updatedCount,
    })
  } catch (error) {
    logError(error, { action: 'update_notifications' })
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
