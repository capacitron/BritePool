import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/pools/cuts/[cutId] - Get cut details
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

    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      include: {
        pool: true,
        overseer: {
          select: { id: true, name: true, email: true }
        },
        pledges: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            member: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        invitations: {
          select: {
            id: true,
            invitedEmail: true,
            acceptedAt: true,
            expiresAt: true,
            createdAt: true
          }
        },
        _count: {
          select: { pledges: true, invitations: true }
        }
      }
    })

    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    // Check if user is the overseer
    const isOverseer = cut.overseerId === session.user.id

    // Calculate total
    const total = cut.pledges.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)

    return NextResponse.json({
      id: cut.id,
      color: cut.color,
      pool: cut.pool,
      overseer: cut.overseer,
      total,
      pledgeCount: cut._count.pledges,
      invitationCount: cut._count.invitations,
      isOverseer,
      // Only include detailed info if user is overseer
      pledges: isOverseer ? cut.pledges : undefined,
      invitations: isOverseer ? cut.invitations : undefined
    })
  } catch (error) {
    console.error('Error fetching cut:', error)
    return NextResponse.json({ error: 'Failed to fetch cut' }, { status: 500 })
  }
}
