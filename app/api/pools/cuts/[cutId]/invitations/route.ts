import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createInvitationSchema } from '@/lib/validations/pool'

// GET /api/pools/cuts/[cutId]/invitations - List invitations
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

    // Verify user is the overseer
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      select: { overseerId: true }
    })

    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    if (cut.overseerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the overseer can view invitations' },
        { status: 403 }
      )
    }

    const invitations = await prisma.poolInvitation.findMany({
      where: { cutId },
      include: {
        invitedBy: {
          select: { id: true, name: true }
        },
        acceptedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}

// POST /api/pools/cuts/[cutId]/invitations - Send invitation
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
    const validatedData = createInvitationSchema.parse(body)

    // Verify user is the overseer
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      include: { pool: true }
    })

    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    if (cut.overseerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the overseer can send invitations' },
        { status: 403 }
      )
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.poolInvitation.findUnique({
      where: {
        cutId_invitedEmail: {
          cutId,
          invitedEmail: validatedData.email
        }
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validatedData.expiresInDays)

    const invitation = await prisma.poolInvitation.create({
      data: {
        cutId,
        invitedEmail: validatedData.email,
        invitedById: session.user.id,
        expiresAt
      }
    })

    // TODO: Send email notification if SendGrid is configured

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}

// DELETE /api/pools/cuts/[cutId]/invitations - Revoke invitation
export async function DELETE(
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
    const invitationId = searchParams.get('invitationId')

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 })
    }

    // Verify user is the overseer
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
      select: { overseerId: true }
    })

    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    if (cut.overseerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the overseer can revoke invitations' },
        { status: 403 }
      )
    }

    await prisma.poolInvitation.delete({
      where: { id: invitationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking invitation:', error)
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 })
  }
}
