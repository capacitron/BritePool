import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updatePoolSchema } from '@/lib/validations/pool'

type CutWithPledges = {
  id: string
  color: string
  overseerId: string
  overseer: { id: string; name: string; email: string }
  pledges: { id: string; amount: number; status: string; memberId: string }[]
  _count: { pledges: number; invitations: number }
}

// GET /api/pools/[poolId] - Get pool details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
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
            overseer: {
              select: { id: true, name: true, email: true }
            },
            pledges: {
              where: { status: { not: 'CANCELLED' } },
              select: { id: true, amount: true, status: true, memberId: true }
            },
            _count: {
              select: { pledges: true, invitations: true }
            }
          }
        }
      }
    })

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    // Calculate totals
    const cutTotals = (pool.cuts as CutWithPledges[]).map((cut) => ({
      ...cut,
      total: cut.pledges.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0),
      pledgeCount: cut._count.pledges,
      invitationCount: cut._count.invitations
    }))

    const blueTotal = cutTotals.reduce((sum: number, cut: { total: number }) => sum + cut.total, 0)

    return NextResponse.json({
      ...pool,
      cuts: cutTotals,
      blueTotal,
      progress: pool.goalAmount > 0 ? (blueTotal / pool.goalAmount) * 100 : 0
    })
  } catch (error) {
    console.error('Error fetching pool:', error)
    return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 })
  }
}

// PATCH /api/pools/[poolId] - Update pool
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
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
        { error: 'Only Board Chairs and Web Stewards can update pools' },
        { status: 403 }
      )
    }

    const { poolId } = await params
    const body = await request.json()
    const validatedData = updatePoolSchema.parse(body)

    const pool = await prisma.pool.update({
      where: { id: poolId },
      data: validatedData
    })

    return NextResponse.json(pool)
  } catch (error) {
    console.error('Error updating pool:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update pool' }, { status: 500 })
  }
}
