import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

const createPoolSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  targetAmount: z.number().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED']).optional(),
})

// GET /api/pools - List all pools
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = rateLimit(request, 'pools', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    const pools = await prisma.pool.findMany({
      where,
      include: {
        _count: {
          select: { cuts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(pools)
  } catch (error) {
    logError(error, { action: 'fetch_pools' })
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 })
  }
}

// POST /api/pools - Create a new pool (admin only)
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = rateLimit(request, 'pools', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create pools
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createPoolSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, targetAmount, startDate, endDate, status } = parsed.data

    const pool = await prisma.pool.create({
      data: {
        name,
        description: description || null,
        targetAmount,
        currentAmount: 0,
        status: status || 'DRAFT',
        creatorId: session.user.id,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        _count: {
          select: { cuts: true },
        },
      },
    })

    return NextResponse.json(pool, { status: 201 })
  } catch (error) {
    logError(error, { action: 'create_pool' })
    return NextResponse.json({ error: 'Failed to create pool' }, { status: 500 })
  }
}
