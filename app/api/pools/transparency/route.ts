import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface CutWithPledges {
  color: string
  pledges: { amount: number; status: string }[]
  _count: { pledges: number }
}

interface ColorTotal {
  total: number
  pledgeCount: number
}

// GET /api/pools/transparency - Get aggregated pool data for transparency page
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the active pool (most recent OPEN or GOAL_REACHED pool)
    const pool = await prisma.pool.findFirst({
      where: {
        status: { in: ['OPEN', 'GOAL_REACHED'] }
      },
      include: {
        cuts: {
          include: {
            pledges: {
              where: { status: { not: 'CANCELLED' } },
              select: { amount: true, status: true }
            },
            _count: {
              select: { pledges: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!pool) {
      return NextResponse.json({
        hasPool: false,
        message: 'No active pool found'
      })
    }

    // Calculate color totals
    const colorTotals: Record<string, ColorTotal> = {
      PURPLE: { total: 0, pledgeCount: 0 },
      ORANGE: { total: 0, pledgeCount: 0 },
      GREEN: { total: 0, pledgeCount: 0 }
    }

    const cuts = pool.cuts as CutWithPledges[]
    cuts.forEach((cut) => {
      const cutTotal = cut.pledges.reduce((sum: number, p) => sum + p.amount, 0)
      if (cut.color in colorTotals) {
        colorTotals[cut.color] = {
          total: cutTotal,
          pledgeCount: cut._count.pledges
        }
      }
    })

    // Calculate blue total (sum of all colors)
    const blueTotal = colorTotals.PURPLE.total + colorTotals.ORANGE.total + colorTotals.GREEN.total
    const totalPledgeCount = colorTotals.PURPLE.pledgeCount + colorTotals.ORANGE.pledgeCount + colorTotals.GREEN.pledgeCount

    // Calculate progress percentage
    const progress = pool.goalAmount > 0 ? (blueTotal / pool.goalAmount) * 100 : 0

    return NextResponse.json({
      hasPool: true,
      pool: {
        id: pool.id,
        name: pool.name,
        description: pool.description,
        goalAmount: pool.goalAmount,
        status: pool.status
      },
      colorTotals: {
        purple: colorTotals.PURPLE,
        orange: colorTotals.ORANGE,
        green: colorTotals.GREEN,
        blue: { total: blueTotal, pledgeCount: totalPledgeCount }
      },
      totalPledged: blueTotal,
      goalAmount: pool.goalAmount,
      progress: Math.min(progress, 100),
      isGoalReached: pool.status === 'GOAL_REACHED'
    })
  } catch (error) {
    console.error('Error fetching transparency data:', error)
    return NextResponse.json({ error: 'Failed to fetch transparency data' }, { status: 500 })
  }
}
