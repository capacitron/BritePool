import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCutPasswordSchema } from '@/lib/validations/pool'
import bcrypt from 'bcryptjs'

// POST /api/pools/cuts/[cutId]/verify - Verify cut password
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
    const validatedData = verifyCutPasswordSchema.parse(body)

    // Get the cut
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      include: {
        pool: true,
        invitations: {
          where: {
            acceptedById: session.user.id
          }
        }
      }
    })

    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    // Check if user is the overseer (overseers don't need password)
    if (cut.overseerId === session.user.id) {
      return NextResponse.json({
        verified: true,
        isOverseer: true,
        cutId: cut.id,
        color: cut.color,
        poolId: cut.poolId
      })
    }

    // Check if user has an accepted invitation
    const userEmail = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    })

    const invitation = await prisma.poolInvitation.findFirst({
      where: {
        cutId,
        invitedEmail: userEmail?.email,
        expiresAt: { gt: new Date() }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'You have not been invited to this pool cut' },
        { status: 403 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(validatedData.password, cut.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Mark invitation as accepted if not already
    if (!invitation.acceptedAt) {
      await prisma.poolInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
          acceptedById: session.user.id
        }
      })
    }

    return NextResponse.json({
      verified: true,
      isOverseer: false,
      cutId: cut.id,
      color: cut.color,
      poolId: cut.poolId
    })
  } catch (error) {
    console.error('Error verifying password:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to verify password' }, { status: 500 })
  }
}
