import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

const updatePoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
})

// GET /api/pools/[poolId] - Get pool details with cuts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'pools-detail', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { poolId } = await params

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        cuts: {
          include: {
            _count: {
              select: { pledges: true, invitations: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { cuts: true },
        },
      },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    return NextResponse.json(pool)
  } catch (error) {
    logError(error, { action: 'fetch_pool' })
    return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 })
  }
}

// PATCH /api/pools/[poolId] - Update pool (creator or admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'pools-detail', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { poolId } = await params

    // Check if pool exists and get creator
    const existingPool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: { id: true, creatorId: true },
    })

    if (!existingPool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    // Only creator or admin can update
    const isCreator = existingPool.creatorId === session.user.id
    const userIsAdmin = isAdmin(session.user.role)

    if (!isCreator && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only pool creator or admin can update' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updatePoolSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, targetAmount, currentAmount, status, startDate, endDate } =
      parsed.data

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (targetAmount !== undefined) updateData.targetAmount = targetAmount
    if (currentAmount !== undefined) updateData.currentAmount = currentAmount
    if (status !== undefined) updateData.status = status
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null

    const updatedPool = await prisma.pool.update({
      where: { id: poolId },
      data: updateData,
      include: {
        cuts: {
          include: {
            _count: {
              select: { pledges: true, invitations: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { cuts: true },
        },
      },
    })

    return NextResponse.json(updatedPool)
  } catch (error) {
    logError(error, { action: 'update_pool' })
    return NextResponse.json({ error: 'Failed to update pool' }, { status: 500 })
  }
}

// DELETE /api/pools/[poolId] - Delete pool (creator or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, 'pools-detail', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { poolId } = await params

    const existingPool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        cuts: {
          include: {
            _count: { select: { pledges: true } },
          },
        },
      },
    })

    if (!existingPool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    const isCreator = existingPool.creatorId === session.user.id
    const userIsAdmin = isAdmin(session.user.role)

    if (!isCreator && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only pool creator or admin can delete' },
        { status: 403 }
      )
    }

    // Prevent deletion of pools with active pledges
    const hasActivePledges = existingPool.cuts.some((cut) => cut._count.pledges > 0)
    if (hasActivePledges) {
      return NextResponse.json(
        { error: 'Cannot delete pool with existing pledges' },
        { status: 409 }
      )
    }

    // Cascade will handle deleting related cuts
    await prisma.pool.delete({ where: { id: poolId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error, { action: 'delete_pool' })
    return NextResponse.json({ error: 'Failed to delete pool' }, { status: 500 })
  }
}
