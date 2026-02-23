import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { logWGOCreated } from '@/lib/audit'
import { z } from 'zod'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

const createWGOSchema = z.object({
  title: z.string().max(200).optional().default('Untitled Opportunity'),
  description: z.string().max(5000).optional().default(''),
  category: z
    .enum(['REAL_ESTATE', 'BUSINESS', 'INVESTMENT', 'EDUCATION', 'COMMUNITY'])
    .optional()
    .default('INVESTMENT'),
  status: z
    .enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('ACTIVE'),
  targetAmount: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  credibilityScore: z.number().optional().nullable(),
  presentationDays: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  wgoType: z.string().optional().nullable(),
  minimumInvestment: z.number().optional().nullable(),
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

    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is fine - all fields have defaults
    }
    const parsed = createWGOSchema.safeParse(body)

    if (!parsed.success) {
      console.error('WGO validation error:', JSON.stringify(parsed.error.flatten()))
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
      minimumInvestment,
    } = parsed.data

    // Create WGO with the creator as a LEADER involvement
    // Only include metadata fields when they have values
    const metadataFields: Record<string, unknown> = {}
    if (credibilityScore) metadataFields.credibilityScore = credibilityScore
    if (presentationDays) metadataFields.presentationDays = presentationDays
    if (shortDescription) metadataFields.shortDescription = shortDescription
    if (wgoType) metadataFields.wgoType = wgoType
    if (minimumInvestment !== undefined && minimumInvestment !== null)
      metadataFields.minimumInvestment = minimumInvestment

    // Parse dates safely - accept any string format
    let parsedStartDate: Date | null = null
    let parsedEndDate: Date | null = null
    if (startDate) {
      const d = new Date(startDate)
      if (!isNaN(d.getTime())) parsedStartDate = d
    }
    if (endDate) {
      const d = new Date(endDate)
      if (!isNaN(d.getTime())) parsedEndDate = d
    }

    const wgo = await prisma.wealthOpportunity.create({
      data: {
        title: title || 'Untitled Opportunity',
        description: description || '',
        category: category || 'INVESTMENT',
        status: status || 'ACTIVE',
        targetAmount: targetAmount ?? null,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        ...metadataFields,
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

    // Audit log WGO creation (fire and forget - don't block response)
    logWGOCreated(
      session.user.id,
      session.user.role,
      wgo.id,
      wgo.title,
      wgo.category,
      request
    ).catch(() => {})

    return NextResponse.json(wgo, { status: 201 })
  } catch (error) {
    console.error('WGO CREATE ERROR:', error)
    logError(error, { action: 'create_wgo' })
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create wealth opportunity: ${message}` },
      { status: 500 }
    )
  }
}
