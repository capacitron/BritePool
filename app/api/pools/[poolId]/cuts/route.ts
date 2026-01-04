import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

const createCutSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  minAmount: z.number().min(0),
  maxAmount: z.number().positive().optional(),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
})

// GET /api/pools/[poolId]/cuts - Get all cuts for a pool
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = rateLimit(request, 'pools-cuts', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { poolId } = await params

    // Verify pool exists
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: { id: true },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    const cuts = await prisma.poolCut.findMany({
      where: { poolId },
      include: {
        _count: {
          select: { pledges: true, invitations: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(cuts)
  } catch (error) {
    logError(error, { action: 'fetch_cuts' })
    return NextResponse.json({ error: 'Failed to fetch cuts' }, { status: 500 })
  }
}

// POST /api/pools/[poolId]/cuts - Create a new cut (pool creator or admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = rateLimit(request, 'pools-cuts', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { poolId } = await params

    // Check if pool exists and get creator
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: { id: true, creatorId: true, status: true },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    // Only pool creator or admin can create cuts
    const isCreator = pool.creatorId === session.user.id
    const userIsAdmin = isAdmin(session.user.role)

    if (!isCreator && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only pool creator or admin can create cuts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createCutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, minAmount, maxAmount, colorCode } = parsed.data

    // Validate maxAmount >= minAmount if both provided
    if (maxAmount !== undefined && maxAmount < minAmount) {
      return NextResponse.json(
        { error: 'maxAmount must be greater than or equal to minAmount' },
        { status: 400 }
      )
    }

    const cut = await prisma.poolCut.create({
      data: {
        poolId,
        name,
        description: description || null,
        minAmount,
        maxAmount: maxAmount || null,
        colorCode: colorCode || null,
      },
      include: {
        _count: {
          select: { pledges: true, invitations: true },
        },
      },
    })

    return NextResponse.json(cut, { status: 201 })
  } catch (error) {
    logError(error, { action: 'create_cut' })
    return NextResponse.json({ error: 'Failed to create cut' }, { status: 500 })
  }
}
