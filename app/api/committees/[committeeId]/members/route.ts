import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['LEADER', 'MEMBER']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params

    const committee = await prisma.committee.findUnique({
      where: { id: committeeId }
    })

    if (!committee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 })
    }

    const existingMembership = await prisma.committeeMember.findUnique({
      where: {
        userId_committeeId: {
          userId: session.user.id,
          committeeId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already a member of this committee' },
        { status: 409 }
      )
    }

    const membership = await prisma.committeeMember.create({
      data: {
        userId: session.user.id,
        committeeId,
        role: 'MEMBER'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        committee: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(membership, { status: 201 })
  } catch (error) {
    console.error('Error joining committee:', error)
    return NextResponse.json(
      { error: 'Failed to join committee' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params

    const membership = await prisma.committeeMember.findUnique({
      where: {
        userId_committeeId: {
          userId: session.user.id,
          committeeId
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this committee' },
        { status: 404 }
      )
    }

    await prisma.committeeMember.delete({
      where: { id: membership.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving committee:', error)
    return NextResponse.json(
      { error: 'Failed to leave committee' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params

    const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateRoleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { userId, role } = parsed.data

    const membership = await prisma.committeeMember.findUnique({
      where: {
        userId_committeeId: { userId, committeeId }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Member not found in this committee' },
        { status: 404 }
      )
    }

    if (role === 'LEADER') {
      await prisma.committeeMember.updateMany({
        where: { committeeId, role: 'LEADER' },
        data: { role: 'MEMBER' }
      })
    }

    const updated = await prisma.committeeMember.update({
      where: { id: membership.id },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    )
  }
}
