import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

const updateWGOSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.enum(['REAL_ESTATE', 'BUSINESS', 'INVESTMENT', 'EDUCATION', 'COMMUNITY']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  targetAmount: z.number().positive().optional().nullable(),
  currentAmount: z.number().min(0).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  affiliateLink: z.string().url().max(2000).optional().nullable(),
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
    const isAdmin = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(session.user.role)

    if (!isCreator && !isLeaderOrCoordinator && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this WGO' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateWGOSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    // Convert date strings to Date objects
    if (parsed.data.startDate !== undefined) {
      updateData.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null
    }
    if (parsed.data.endDate !== undefined) {
      updateData.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null
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
    logError(error, { action: 'update_wgo' })
    return NextResponse.json({ error: 'Failed to update wealth opportunity' }, { status: 500 })
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
    const isAdmin = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(session.user.role)

    if (!isCreator && !isAdmin) {
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
