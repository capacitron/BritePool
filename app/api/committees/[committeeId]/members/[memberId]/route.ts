import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canManageCommittees } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { z } from 'zod'

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

// Approve or reject a committee membership request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; memberId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only committee leaders, board chairs, and web stewards can approve
    if (!canManageCommittees(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { committeeId, memberId } = await params

    const body = await request.json()
    const parsed = approvalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { action } = parsed.data

    // Verify the membership exists and is pending
    const membership = await prisma.committeeMember.findFirst({
      where: {
        id: memberId,
        committeeId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        committee: { select: { name: true } },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    if (membership.status !== 'PENDING') {
      return NextResponse.json({ error: 'Membership is not pending approval' }, { status: 400 })
    }

    // If committee leader, verify they lead this specific committee
    if (session.user.role === 'COMMITTEE_LEADER') {
      const isLeader = await prisma.committeeMember.findFirst({
        where: {
          userId: session.user.id,
          committeeId,
          role: 'LEADER',
          status: 'APPROVED',
        },
      })

      if (!isLeader) {
        return NextResponse.json(
          { error: 'You can only approve members for committees you lead' },
          { status: 403 }
        )
      }
    }

    const updated = await prisma.committeeMember.update({
      where: { id: memberId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedAt: action === 'approve' ? new Date() : null,
        approvedBy: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        committee: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      ...updated,
      message:
        action === 'approve'
          ? `${updated.user.name} has been approved to join ${updated.committee.name}`
          : `${updated.user.name}'s request to join ${updated.committee.name} has been rejected`,
    })
  } catch (error) {
    logError(error, { action: 'approve_committee_member' })
    return NextResponse.json({ error: 'Failed to process membership request' }, { status: 500 })
  }
}

// Remove a member from committee (by admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; memberId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canManageCommittees(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { committeeId, memberId } = await params

    const membership = await prisma.committeeMember.findFirst({
      where: {
        id: memberId,
        committeeId,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    await prisma.committeeMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true, message: 'Member removed from committee' })
  } catch (error) {
    logError(error, { action: 'remove_committee_member' })
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
