import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

const updateWGOSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  category: z.enum(['REAL_ESTATE', 'BUSINESS', 'INVESTMENT', 'EDUCATION', 'COMMUNITY']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  targetAmount: z.number().optional().nullable(),
  currentAmount: z.number().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  affiliateLink: z.string().optional().nullable(),
  credibilityScore: z.number().optional().nullable(),
  presentationDays: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  wgoType: z.string().optional().nullable(),
  minimumInvestment: z.number().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-detail', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wgoId } = await params

    const wgo = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId },
      include: {
        involvements: {
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
        forumPosts: {
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: 10,
        },
        _count: {
          select: { involvements: true, forumPosts: true },
        },
      },
    })

    if (!wgo) {
      return NextResponse.json({ error: 'Wealth opportunity not found' }, { status: 404 })
    }

    const userInvolvement = wgo.involvements.find((inv) => inv.userId === session.user.id)

    // Look up the current user's referrer's affiliate link for this WGO
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referredById: true },
    })

    let referrerAffiliateLink: string | null = null
    let referrerName: string | null = null

    if (currentUser?.referredById) {
      const referrerInvolvement = wgo.involvements.find(
        (inv) => inv.userId === currentUser.referredById && inv.affiliateLink
      )
      if (referrerInvolvement) {
        const referrer = await prisma.user.findUnique({
          where: { id: currentUser.referredById },
          select: { name: true },
        })
        referrerAffiliateLink = referrerInvolvement.affiliateLink
        referrerName = referrer?.name || null
      }
    }

    return NextResponse.json({
      ...wgo,
      involvementCount: wgo._count.involvements,
      forumPostCount: wgo._count.forumPosts,
      isInvolved: !!userInvolvement,
      userInvolvement: userInvolvement || null,
      isCreator: wgo.creatorId === session.user.id,
      isLeader: userInvolvement?.role === 'LEADER',
      isCoordinator: userInvolvement?.role === 'COORDINATOR',
      referrerAffiliateLink,
      referrerName,
    })
  } catch (error) {
    logError(error, { action: 'fetch_wgo' })
    return NextResponse.json({ error: 'Failed to fetch wealth opportunity' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-detail', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wgoId } = await params

    // Check if user has permission to update (creator, leader, or coordinator)
    const existingWGO = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId },
      include: {
        involvements: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!existingWGO) {
      return NextResponse.json({ error: 'Wealth opportunity not found' }, { status: 404 })
    }

    const userInvolvement = existingWGO.involvements[0]
    const isCreator = existingWGO.creatorId === session.user.id
    const isLeaderOrCoordinator =
      userInvolvement?.role === 'LEADER' || userInvolvement?.role === 'COORDINATOR'
    const userIsAdmin = isAdmin(session.user.role)

    if (!isCreator && !isLeaderOrCoordinator && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this WGO' },
        { status: 403 }
      )
    }

    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const parsed = updateWGOSchema.safeParse(body)

    if (!parsed.success) {
      console.error('WGO update validation error:', JSON.stringify(parsed.error.flatten()))
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    // Remove undefined metadata fields to keep existing values
    const metadataFields = [
      'credibilityScore',
      'presentationDays',
      'shortDescription',
      'wgoType',
      'minimumInvestment',
    ]
    for (const field of metadataFields) {
      if (updateData[field] === undefined) {
        delete updateData[field]
      }
    }

    // Convert date strings to Date objects safely
    if (parsed.data.startDate !== undefined) {
      if (parsed.data.startDate) {
        const d = new Date(parsed.data.startDate)
        updateData.startDate = isNaN(d.getTime()) ? null : d
      } else {
        updateData.startDate = null
      }
    }
    if (parsed.data.endDate !== undefined) {
      if (parsed.data.endDate) {
        const d = new Date(parsed.data.endDate)
        updateData.endDate = isNaN(d.getTime()) ? null : d
      } else {
        updateData.endDate = null
      }
    }

    // Handle affiliateLink - allow any string or null
    if (updateData.affiliateLink === '') {
      updateData.affiliateLink = null
    }

    const wgo = await prisma.wealthOpportunity.update({
      where: { id: wgoId },
      data: updateData,
      include: {
        involvements: true,
        _count: {
          select: { involvements: true, forumPosts: true },
        },
      },
    })

    return NextResponse.json(wgo)
  } catch (error) {
    console.error('WGO UPDATE ERROR:', error)
    logError(error, { action: 'update_wgo' })
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to update wealth opportunity: ${message}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-detail', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wgoId } = await params

    // Check if user has permission to delete (creator or admin)
    const existingWGO = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId },
    })

    if (!existingWGO) {
      return NextResponse.json({ error: 'Wealth opportunity not found' }, { status: 404 })
    }

    const isCreator = existingWGO.creatorId === session.user.id
    const userIsAdmin = isAdmin(session.user.role)

    if (!isCreator && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this WGO' },
        { status: 403 }
      )
    }

    await prisma.wealthOpportunity.delete({
      where: { id: wgoId },
    })

    return NextResponse.json({ message: 'Wealth opportunity deleted successfully' })
  } catch (error) {
    logError(error, { action: 'delete_wgo' })
    return NextResponse.json({ error: 'Failed to delete wealth opportunity' }, { status: 500 })
  }
}
