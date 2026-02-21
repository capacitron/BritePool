import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { logWGOCreated } from '@/lib/audit'
import { z } from 'zod'

const createWGOSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum(['REAL_ESTATE', 'BUSINESS', 'INVESTMENT', 'EDUCATION', 'COMMUNITY']),
  status: z
    .enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('ACTIVE'),
  targetAmount: z.number().positive().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  credibilityScore: z.number().min(1).max(10).optional().nullable(),
  presentationDays: z.string().max(500).optional().nullable(),
  shortDescription: z.string().max(1000).optional().nullable(),
  wgoType: z.string().max(500).optional().nullable(),
})

const querySchema = z.object({
  category: z.enum(['REAL_ESTATE', 'BUSINESS', 'INVESTMENT', 'EDUCATION', 'COMMUNITY']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const parsed = querySchema.safeParse(queryParams)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { category, status, page, limit, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [wgos, total] = await Promise.all([
      prisma.wealthOpportunity.findMany({
        where,
        include: {
          involvements: {
            take: 5,
          },
          _count: {
            select: { involvements: true, forumPosts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.wealthOpportunity.count({ where }),
    ])

    const formattedWGOs = wgos.map((wgo) => ({
      ...wgo,
      involvementCount: wgo._count.involvements,
      forumPostCount: wgo._count.forumPosts,
      isInvolved: wgo.involvements.some((inv) => inv.userId === session.user.id),
      userInvolvement: wgo.involvements.find((inv) => inv.userId === session.user.id) || null,
    }))

    return NextResponse.json({
      data: formattedWGOs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logError(error, { action: 'fetch_wgos' })
    return NextResponse.json({ error: 'Failed to fetch wealth opportunities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createWGOSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      category,
      status,
      targetAmount,
      startDate,
      endDate,
      credibilityScore,
      presentationDays,
      shortDescription,
      wgoType,
    } = parsed.data

    // Create WGO with the creator as a LEADER involvement
    const wgo = await prisma.wealthOpportunity.create({
      data: {
        title,
        description,
        category,
        status,
        targetAmount: targetAmount ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        credibilityScore: credibilityScore ?? null,
        presentationDays: presentationDays ?? null,
        shortDescription: shortDescription ?? null,
        wgoType: wgoType ?? null,
        creatorId: session.user.id,
        involvements: {
          create: {
            userId: session.user.id,
            role: 'LEADER',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        involvements: true,
        _count: {
          select: { involvements: true, forumPosts: true },
        },
      },
    })

    // Audit log WGO creation
    await logWGOCreated(
      session.user.id,
      session.user.role,
      wgo.id,
      wgo.title,
      wgo.category,
      request
    )

    return NextResponse.json(wgo, { status: 201 })
  } catch (error) {
    logError(error, { action: 'create_wgo' })
    return NextResponse.json({ error: 'Failed to create wealth opportunity' }, { status: 500 })
  }
}
