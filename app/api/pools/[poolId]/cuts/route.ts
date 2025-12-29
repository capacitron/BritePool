import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCutSchema } from '@/lib/validations/pool'
import bcrypt from 'bcryptjs'

type CutWithPledges = {
  id: string
  color: string
  overseer: { id: string; name: string; email: string }
  pledges: { amount: number }[]
  _count: { pledges: number; invitations: number }
}

// GET /api/pools/[poolId]/cuts - Get all cuts for a pool
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

    const cuts = await prisma.poolCut.findMany({
      where: { poolId },
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
    })

    const cutsWithTotals = (cuts as CutWithPledges[]).map((cut) => ({
      id: cut.id,
      color: cut.color,
      overseer: cut.overseer,
      total: cut.pledges.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0),
      pledgeCount: cut._count.pledges,
      invitationCount: cut._count.invitations
    }))

    return NextResponse.json(cutsWithTotals)
  } catch (error) {
    console.error('Error fetching cuts:', error)
    return NextResponse.json({ error: 'Failed to fetch cuts' }, { status: 500 })
  }
}

// POST /api/pools/[poolId]/cuts - Create a new cut
export async function POST(
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
        { error: 'Only Board Chairs and Web Stewards can create cuts' },
        { status: 403 }
      )
    }

    const { poolId } = await params
    const body = await request.json()
    const validatedData = createCutSchema.parse(body)

    // Verify pool exists
    const pool = await prisma.pool.findUnique({
      where: { id: poolId }
    })

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    // Verify overseer is a BOARD_CHAIR
    const overseer = await prisma.user.findUnique({
      where: { id: validatedData.overseerId },
      select: { role: true }
    })

    if (!overseer || !['BOARD_CHAIR', 'WEB_STEWARD'].includes(overseer.role)) {
      return NextResponse.json(
        { error: 'Overseer must be a Board Chair or Web Steward' },
        { status: 400 }
      )
    }

    // Check if color already exists for this pool
    const existingCut = await prisma.poolCut.findUnique({
      where: {
        poolId_color: {
          poolId,
          color: validatedData.color
        }
      }
    })

    if (existingCut) {
      return NextResponse.json(
        { error: `A ${validatedData.color.toLowerCase()} cut already exists for this pool` },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    const cut = await prisma.poolCut.create({
      data: {
        poolId,
        color: validatedData.color,
        password: hashedPassword,
        overseerId: validatedData.overseerId
      },
      include: {
        overseer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      id: cut.id,
      color: cut.color,
      overseer: cut.overseer
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating cut:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create cut' }, { status: 500 })
  }
}
