import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPoolSchema } from '@/lib/validations/pool'
import { Pool, PoolCut, Pledge } from '@prisma/client'

type CutWithPledges = PoolCut & {
  overseer: { id: string; name: string; email: string }
  pledges: { amount: number }[]
  _count: { pledges: number; invitations: number }
}

type PoolWithCuts = Pool & {
  cuts: CutWithPledges[]
}

// GET /api/pools - List all pools
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pools = await prisma.pool.findMany({
      include: {
        cuts: {
          include: {
            overseer: {
              select: { id: true, name: true, email: true }
            },
            pledges: {
              where: { status: { not: 'CANCELLED' } },
              select: { amount: true }
            },
            _count: {
              select: { pledges: true, invitations: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate totals for each pool
    const poolsWithTotals = (pools as PoolWithCuts[]).map((pool) => {
      const cutTotals = pool.cuts.map((cut: CutWithPledges) => ({
        color: cut.color,
        total: cut.pledges.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0),
        pledgeCount: cut._count.pledges,
        invitationCount: cut._count.invitations,
        overseer: cut.overseer
      }))

      const blueTotal = cutTotals.reduce((sum: number, cut: { total: number }) => sum + cut.total, 0)

      return {
        ...pool,
        cuts: pool.cuts.map((cut: CutWithPledges) => ({
          id: cut.id,
          color: cut.color,
          overseerId: cut.overseerId,
          overseer: cut.overseer,
          total: cut.pledges.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0),
          pledgeCount: cut._count.pledges,
          invitationCount: cut._count.invitations
        })),
        blueTotal,
        progress: pool.goalAmount > 0 ? (blueTotal / pool.goalAmount) * 100 : 0
      }
    })

    return NextResponse.json(poolsWithTotals)
  } catch (error) {
    console.error('Error fetching pools:', error)
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 })
  }
}

// POST /api/pools - Create a new pool
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is BOARD_CHAIR or WEB_STEWARD
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['BOARD_CHAIR', 'WEB_STEWARD'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only Board Chairs and Web Stewards can create pools' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createPoolSchema.parse(body)

    const pool = await prisma.pool.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        goalAmount: validatedData.goalAmount,
      }
    })

    return NextResponse.json(pool, { status: 201 })
  } catch (error) {
    console.error('Error creating pool:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create pool' }, { status: 500 })
  }
}
