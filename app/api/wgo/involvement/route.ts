import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

const joinWGOSchema = z.object({
  wgoId: z.string().min(1),
  role: z.enum(['PARTICIPANT', 'OBSERVER']).optional().default('PARTICIPANT'),
})

const updateInvolvementSchema = z.object({
  involvementId: z.string().min(1),
  role: z.enum(['LEADER', 'COORDINATOR', 'PARTICIPANT', 'OBSERVER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  affiliateLink: z.string().url().max(2000).optional().nullable(),
})

const updateAffiliateLinkSchema = z.object({
  wgoId: z.string().min(1),
  affiliateLink: z.string().max(2000).optional().nullable(),
})

const leaveWGOSchema = z.object({
  wgoId: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-involvement', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const wgoId = searchParams.get('wgoId')

    const where: Record<string, unknown> = {}

    // Only admins can view other users' involvements
    if (userId && userId !== session.user.id) {
      const isAdmin = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(session.user.role)
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      where.userId = userId
    } else if (!wgoId) {
      // Default to current user's involvements
      where.userId = session.user.id
    }

    if (wgoId) {
      where.wgoId = wgoId
    }

    const involvements = await prisma.userWGOInvolvement.findMany({
      where,
      include: {
        wgo: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            status: true,
            targetAmount: true,
            currentAmount: true,
            creatorId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    return NextResponse.json(involvements)
  } catch (error) {
    logError(error, { action: 'fetch_involvements' })
    return NextResponse.json({ error: 'Failed to fetch involvements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-involvement', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = joinWGOSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { wgoId, role } = parsed.data

    // Check if WGO exists and is active
    const wgo = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId },
    })

    if (!wgo) {
      return NextResponse.json({ error: 'Wealth opportunity not found' }, { status: 404 })
    }

    if (wgo.status !== 'ACTIVE' && wgo.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Cannot join a WGO that is not active or in draft status' },
        { status: 400 }
      )
    }

    // Check if user is already involved
    const existingInvolvement = await prisma.userWGOInvolvement.findUnique({
      where: {
        userId_wgoId: {
          userId: session.user.id,
          wgoId,
        },
      },
    })

    if (existingInvolvement) {
      return NextResponse.json({ error: 'You are already involved in this WGO' }, { status: 409 })
    }

    const involvement = await prisma.userWGOInvolvement.create({
      data: {
        userId: session.user.id,
        wgoId,
        role,
        status: 'ACTIVE',
      },
      include: {
        wgo: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json(involvement, { status: 201 })
  } catch (error) {
    logError(error, { action: 'join_wgo' })
    return NextResponse.json({ error: 'Failed to join wealth opportunity' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-involvement', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateInvolvementSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { involvementId, role, status } = parsed.data

    // Get the involvement and check permissions
    const involvement = await prisma.userWGOInvolvement.findUnique({
      where: { id: involvementId },
      include: {
        wgo: {
          include: {
            involvements: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!involvement) {
      return NextResponse.json({ error: 'Involvement not found' }, { status: 404 })
    }

    // Check if user has permission to update involvement
    const userInvolvement = involvement.wgo.involvements[0]
    const isCreator = involvement.wgo.creatorId === session.user.id
    const isLeaderOrCoordinator =
      userInvolvement?.role === 'LEADER' || userInvolvement?.role === 'COORDINATOR'
    const isAdmin = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(session.user.role)
    const isOwnInvolvement = involvement.userId === session.user.id

    // Users can only update their own status to INACTIVE (leaving)
    if (isOwnInvolvement && !isCreator && !isLeaderOrCoordinator && !isAdmin) {
      if (role || (status && status !== 'INACTIVE')) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update your own status to leave' },
          { status: 403 }
        )
      }
    }

    // Only leaders, coordinators, and admins can change roles
    if (role && !isCreator && !isLeaderOrCoordinator && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only leaders and coordinators can change roles' },
        { status: 403 }
      )
    }

    // Cannot demote yourself if you're the only leader
    if (isOwnInvolvement && role && role !== 'LEADER' && userInvolvement?.role === 'LEADER') {
      const leaderCount = await prisma.userWGOInvolvement.count({
        where: {
          wgoId: involvement.wgoId,
          role: 'LEADER',
          status: 'ACTIVE',
        },
      })

      if (leaderCount === 1) {
        return NextResponse.json(
          { error: 'Cannot demote yourself as the only leader. Assign another leader first.' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (role) updateData.role = role
    if (status) updateData.status = status
    if (parsed.data.affiliateLink !== undefined) updateData.affiliateLink = parsed.data.affiliateLink

    const updatedInvolvement = await prisma.userWGOInvolvement.update({
      where: { id: involvementId },
      data: updateData,
      include: {
        wgo: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json(updatedInvolvement)
  } catch (error) {
    logError(error, { action: 'update_involvement' })
    return NextResponse.json({ error: 'Failed to update involvement' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, 'wgo-involvement', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateAffiliateLinkSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { wgoId, affiliateLink } = parsed.data

    const involvement = await prisma.userWGOInvolvement.findUnique({
      where: {
        userId_wgoId: {
          userId: session.user.id,
          wgoId,
        },
      },
    })

    if (!involvement) {
      return NextResponse.json({ error: 'You are not involved in this WGO' }, { status: 404 })
    }

    const updated = await prisma.userWGOInvolvement.update({
      where: { id: involvement.id },
      data: { affiliateLink: affiliateLink || null },
    })

    return NextResponse.json(updated)
  } catch (error) {
    logError(error, { action: 'update_affiliate_link' })
    return NextResponse.json({ error: 'Failed to update affiliate link' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-involvement', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = leaveWGOSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { wgoId } = parsed.data

    // Get user's involvement
    const involvement = await prisma.userWGOInvolvement.findUnique({
      where: {
        userId_wgoId: {
          userId: session.user.id,
          wgoId,
        },
      },
      include: {
        wgo: true,
      },
    })

    if (!involvement) {
      return NextResponse.json({ error: 'You are not involved in this WGO' }, { status: 404 })
    }

    // Cannot leave if you're the only leader
    if (involvement.role === 'LEADER') {
      const leaderCount = await prisma.userWGOInvolvement.count({
        where: {
          wgoId,
          role: 'LEADER',
          status: 'ACTIVE',
        },
      })

      if (leaderCount === 1) {
        return NextResponse.json(
          {
            error:
              'Cannot leave as the only leader. Assign another leader first or delete the WGO.',
          },
          { status: 400 }
        )
      }
    }

    await prisma.userWGOInvolvement.delete({
      where: { id: involvement.id },
    })

    return NextResponse.json({ message: 'Successfully left the wealth opportunity' })
  } catch (error) {
    logError(error, { action: 'leave_wgo' })
    return NextResponse.json({ error: 'Failed to leave wealth opportunity' }, { status: 500 })
  }
}
