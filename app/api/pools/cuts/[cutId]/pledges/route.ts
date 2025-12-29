import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPledgeSchema, updatePledgeSchema } from '@/lib/validations/pool'

type CutWithPledges = {
  pledges: { amount: number }[]
}

// GET /api/pools/cuts/[cutId]/pledges - List pledges
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cutId } = await params

    // Verify cut exists and user is overseer
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      select: { overseerId: true }
    })

    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    // Only overseer can see all pledges
    if (cut.overseerId !== session.user.id) {
      // Return only user's own pledge
      const userPledge = await prisma.pledge.findUnique({
        where: {
          cutId_memberId: {
            cutId,
            memberId: session.user.id
          }
        }
      })

      return NextResponse.json(userPledge ? [userPledge] : [])
    }

    const pledges = await prisma.pledge.findMany({
      where: { cutId },
      include: {
        member: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(pledges)
  } catch (error) {
    console.error('Error fetching pledges:', error)
    return NextResponse.json({ error: 'Failed to fetch pledges' }, { status: 500 })
  }
}

// POST /api/pools/cuts/[cutId]/pledges - Create pledge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cutId } = await params
    const body = await request.json()

    // Validate amount from body
    const amount = body.amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Pledge amount must be a positive number' }, { status: 400 })
    }

    // Verify cut exists
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      include: { pool: true }
    })

    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    if (cut.pool.status === 'CLOSED') {
      return NextResponse.json({ error: 'This pool is closed' }, { status: 400 })
    }

    // Check if user has accepted invitation or is overseer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    })

    const isOverseer = cut.overseerId === session.user.id

    if (!isOverseer) {
      const invitation = await prisma.poolInvitation.findFirst({
        where: {
          cutId,
          invitedEmail: user?.email,
          acceptedAt: { not: null }
        }
      })

      if (!invitation) {
        return NextResponse.json(
          { error: 'You must verify your password before pledging' },
          { status: 403 }
        )
      }
    }

    // Check if user already has a pledge
    const existingPledge = await prisma.pledge.findUnique({
      where: {
        cutId_memberId: {
          cutId,
          memberId: session.user.id
        }
      }
    })

    if (existingPledge) {
      // Update existing pledge
      const updatedPledge = await prisma.pledge.update({
        where: { id: existingPledge.id },
        data: { amount }
      })

      // Check if goal is reached
      await checkAndUpdatePoolStatus(cut.poolId)

      return NextResponse.json(updatedPledge)
    }

    // Create new pledge
    const pledge = await prisma.pledge.create({
      data: {
        cutId,
        memberId: session.user.id,
        amount
      }
    })

    // Check if goal is reached
    await checkAndUpdatePoolStatus(cut.poolId)

    return NextResponse.json(pledge, { status: 201 })
  } catch (error) {
    console.error('Error creating pledge:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create pledge' }, { status: 500 })
  }
}

// PATCH /api/pools/cuts/[cutId]/pledges - Update pledge status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cutId } = await params
    const { searchParams } = new URL(request.url)
    const pledgeId = searchParams.get('pledgeId')

    if (!pledgeId) {
      return NextResponse.json({ error: 'Pledge ID required' }, { status: 400 })
    }

    // Verify user is overseer
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      select: { overseerId: true }
    })

    if (!cut || cut.overseerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the overseer can update pledge status' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updatePledgeSchema.parse(body)

    const pledge = await prisma.pledge.update({
      where: { id: pledgeId },
      data: {
        status: validatedData.status,
        paymentRef: validatedData.paymentRef,
        paidAt: validatedData.status === 'PAID' ? new Date() : undefined
      }
    })

    return NextResponse.json(pledge)
  } catch (error) {
    console.error('Error updating pledge:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update pledge' }, { status: 500 })
  }
}

// Helper function to check and update pool status
async function checkAndUpdatePoolStatus(poolId: string) {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      cuts: {
        include: {
          pledges: {
            where: { status: { not: 'CANCELLED' } }
          }
        }
      }
    }
  })

  if (!pool || pool.status !== 'OPEN') return

  const totalPledged = (pool.cuts as CutWithPledges[]).reduce((sum: number, cut) =>
    sum + cut.pledges.reduce((s: number, p: { amount: number }) => s + p.amount, 0), 0
  )

  if (totalPledged >= pool.goalAmount) {
    await prisma.pool.update({
      where: { id: poolId },
      data: { status: 'GOAL_REACHED' }
    })

    // TODO: Send notifications to all pledgers
    console.log(`Pool ${poolId} has reached its goal!`)
  }
}
