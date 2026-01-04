import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

const createPledgeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  notes: z.string().max(2000).optional(),
})

const updatePledgeSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED']).optional(),
  notes: z.string().max(2000).optional(),
})

// GET /api/pools/cuts/[cutId]/pledges - List pledges for a cut
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = rateLimit(request, 'pools-pledges', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cutId } = await params

    // Verify cut exists
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      select: { id: true, poolId: true },
    })

    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    // Fetch pledges with user info
    const pledges = await prisma.pledge.findMany({
      where: { cutId },
      include: {
        cut: {
          select: {
            id: true,
            name: true,
            minAmount: true,
            maxAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch user info separately to get name and email
    const userIds = pledges.map((p) => p.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    const pledgesWithUser = pledges.map((pledge) => ({
      ...pledge,
      user: userMap.get(pledge.userId) || { id: pledge.userId, name: 'Unknown', email: '' },
    }))

    return NextResponse.json({ pledges: pledgesWithUser })
  } catch (error) {
    logError(error, { action: 'fetch_pledges' })
    return NextResponse.json({ error: 'Failed to fetch pledges' }, { status: 500 })
  }
}

// POST /api/pools/cuts/[cutId]/pledges - Create a pledge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = rateLimit(request, 'pools-pledges', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cutId } = await params

    // Verify cut exists and get constraints
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      include: {
        pool: {
          select: { id: true, status: true },
        },
      },
    })

    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    // Check if pool is active
    if (cut.pool.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot pledge to a pool that is not active' },
        { status: 400 }
      )
    }

    // Check for duplicate pledge (unique constraint on [cutId, userId])
    const existingPledge = await prisma.pledge.findUnique({
      where: {
        cutId_userId: {
          cutId,
          userId: session.user.id,
        },
      },
    })

    if (existingPledge) {
      return NextResponse.json(
        { error: 'You have already made a pledge for this cut' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const parsed = createPledgeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { amount, notes } = parsed.data

    // Validate amount against cut constraints
    if (amount < cut.minAmount) {
      return NextResponse.json(
        { error: `Amount must be at least ${cut.minAmount}` },
        { status: 400 }
      )
    }

    if (cut.maxAmount !== null && amount > cut.maxAmount) {
      return NextResponse.json({ error: `Amount cannot exceed ${cut.maxAmount}` }, { status: 400 })
    }

    const pledge = await prisma.pledge.create({
      data: {
        cutId,
        userId: session.user.id,
        amount,
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        cut: {
          select: {
            id: true,
            name: true,
            minAmount: true,
            maxAmount: true,
          },
        },
      },
    })

    // Fetch user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json({ ...pledge, user }, { status: 201 })
  } catch (error) {
    logError(error, { action: 'create_pledge' })
    return NextResponse.json({ error: 'Failed to create pledge' }, { status: 500 })
  }
}

// PATCH /api/pools/cuts/[cutId]/pledges - Update pledge status/amount
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = rateLimit(request, 'pools-pledges', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cutId } = await params

    const body = await request.json()
    const { pledgeId, ...updateData } = body

    if (!pledgeId) {
      return NextResponse.json({ error: 'pledgeId is required' }, { status: 400 })
    }

    const parsed = updatePledgeSchema.safeParse(updateData)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { amount, status, notes } = parsed.data

    // Fetch the pledge
    const pledge = await prisma.pledge.findUnique({
      where: { id: pledgeId },
      include: {
        cut: {
          include: {
            pool: {
              select: { id: true, creatorId: true },
            },
          },
        },
      },
    })

    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 })
    }

    // Verify pledge belongs to the specified cut
    if (pledge.cutId !== cutId) {
      return NextResponse.json({ error: 'Pledge does not belong to this cut' }, { status: 400 })
    }

    const isOwner = pledge.userId === session.user.id
    const userIsAdmin = isAdmin(session.user.role)
    const isPoolCreator = pledge.cut.pool.creatorId === session.user.id

    // Permission checks
    if (!isOwner && !userIsAdmin && !isPoolCreator) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own pledges' },
        { status: 403 }
      )
    }

    // Owner can only update if status is PENDING
    if (isOwner && !userIsAdmin && !isPoolCreator) {
      if (pledge.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'You can only update pledges with PENDING status' },
          { status: 403 }
        )
      }

      // Owner cannot change status (only amount and notes)
      if (status) {
        return NextResponse.json(
          { error: 'You cannot change the status of your own pledge' },
          { status: 403 }
        )
      }
    }

    // Validate amount if provided
    if (amount !== undefined) {
      if (amount < pledge.cut.minAmount) {
        return NextResponse.json(
          { error: `Amount must be at least ${pledge.cut.minAmount}` },
          { status: 400 }
        )
      }

      if (pledge.cut.maxAmount !== null && amount > pledge.cut.maxAmount) {
        return NextResponse.json(
          { error: `Amount cannot exceed ${pledge.cut.maxAmount}` },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updatePayload: {
      amount?: number
      status?: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED'
      notes?: string | null
      paidAt?: Date | null
    } = {}

    if (amount !== undefined) {
      updatePayload.amount = amount
    }

    if (status !== undefined) {
      updatePayload.status = status
      // Set paidAt when status changes to PAID
      if (status === 'PAID') {
        updatePayload.paidAt = new Date()
      } else if (pledge.status === 'PAID') {
        // Clear paidAt if status changes from PAID to something else
        updatePayload.paidAt = null
      }
    }

    if (notes !== undefined) {
      updatePayload.notes = notes || null
    }

    const updatedPledge = await prisma.pledge.update({
      where: { id: pledgeId },
      data: updatePayload,
      include: {
        cut: {
          select: {
            id: true,
            name: true,
            minAmount: true,
            maxAmount: true,
          },
        },
      },
    })

    // Fetch user info
    const user = await prisma.user.findUnique({
      where: { id: updatedPledge.userId },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json({ ...updatedPledge, user })
  } catch (error) {
    logError(error, { action: 'update_pledge' })
    return NextResponse.json({ error: 'Failed to update pledge' }, { status: 500 })
  }
}
