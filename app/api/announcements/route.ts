import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { UserRole, AnnouncementPriority } from '@prisma/client'
import { z } from 'zod'

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: z.nativeEnum(AnnouncementPriority).default('INFO'),
  targetRoles: z.array(z.nativeEnum(UserRole)).default([]),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().datetime().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeExpired = searchParams.get('includeExpired') === 'true'

    const skip = (page - 1) * limit
    const userRole = session.user.role as UserRole

    const where: Record<string, unknown> = {}

    if (!includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ]
    }

    if (!isAdmin(userRole)) {
      where.AND = [
        {
          OR: [
            { targetRoles: { isEmpty: true } },
            { targetRoles: { has: userRole } },
          ],
        },
      ]
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { priority: 'asc' },
          { publishedAt: 'desc' },
        ],
      }),
      prisma.announcement.count({ where }),
    ])

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createAnnouncementSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, content, priority, targetRoles, isPinned, expiresAt } = parsed.data

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        targetRoles,
        isPinned,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}
