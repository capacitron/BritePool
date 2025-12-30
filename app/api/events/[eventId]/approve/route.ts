import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Get the event with its committees
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        committees: {
          include: {
            committee: true
          }
        },
        approvals: true,
        createdBy: {
          select: { id: true, name: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Event is not pending approval' },
        { status: 400 }
      )
    }

    const isAdmin = ADMIN_ROLES.includes(session.user.role)

    // Get committees where user is a leader
    const userLeaderMemberships = await prisma.committeeMember.findMany({
      where: {
        userId: session.user.id,
        role: 'LEADER'
      },
      select: { committeeId: true }
    })

    const leaderCommitteeIds = userLeaderMemberships.map(m => m.committeeId)

    // Get event committee IDs
    const eventCommitteeIds = event.committees.map(ec => ec.committeeId)

    // Find committees user can approve for (that haven't been approved yet)
    const alreadyApprovedCommitteeIds = event.approvals.map(a => a.committeeId)
    const committeesToApprove = eventCommitteeIds.filter(id =>
      !alreadyApprovedCommitteeIds.includes(id) &&
      (isAdmin || leaderCommitteeIds.includes(id))
    )

    if (committeesToApprove.length === 0) {
      return NextResponse.json(
        { error: 'You are not authorized to approve this event or it has already been approved for your committees' },
        { status: 403 }
      )
    }

    // Create approval records for all committees user can approve
    await prisma.eventApproval.createMany({
      data: committeesToApprove.map(committeeId => ({
        eventId,
        committeeId,
        approverId: session.user.id
      }))
    })

    // Check if all committees have now been approved
    const totalApprovals = alreadyApprovedCommitteeIds.length + committeesToApprove.length
    const allApproved = totalApprovals >= eventCommitteeIds.length

    if (allApproved) {
      // Update event status to APPROVED
      await prisma.event.update({
        where: { id: eventId },
        data: { status: 'APPROVED' }
      })

      // Notify the event creator
      await prisma.notification.create({
        data: {
          userId: event.createdById,
          type: 'EVENT_APPROVED',
          title: 'Event Approved',
          message: `Your event "${event.title}" has been approved and is now visible on the calendar.`,
          link: `/dashboard/events/${eventId}`,
          eventId
        }
      })
    }

    // Get updated event
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        committees: {
          include: {
            committee: {
              select: { id: true, name: true, slug: true, type: true }
            }
          }
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    return NextResponse.json({
      event: updatedEvent,
      fullyApproved: allApproved,
      message: allApproved
        ? 'Event has been fully approved and is now visible'
        : `Approved for ${committeesToApprove.length} committee(s). Awaiting approval from remaining committees.`
    })
  } catch (error) {
    console.error('Error approving event:', error)
    return NextResponse.json(
      { error: 'Failed to approve event' },
      { status: 500 }
    )
  }
}
