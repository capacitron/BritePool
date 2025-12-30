import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

const rejectEventSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000)
})

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
    const body = await request.json()
    const parsed = rejectEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { reason } = parsed.data

    // Get the event with its committees
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        committees: {
          include: {
            committee: true
          }
        },
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

    // Check if user is a leader of any of the event's committees
    const eventCommitteeIds = event.committees.map(ec => ec.committeeId)

    const userLeaderMembership = await prisma.committeeMember.findFirst({
      where: {
        userId: session.user.id,
        committeeId: { in: eventCommitteeIds },
        role: 'LEADER'
      }
    })

    if (!isAdmin && !userLeaderMembership) {
      return NextResponse.json(
        { error: 'Only committee leaders or administrators can reject events' },
        { status: 403 }
      )
    }

    // Update event status to REJECTED
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedById: session.user.id,
        rejectedAt: new Date()
      },
      include: {
        committees: {
          include: {
            committee: {
              select: { id: true, name: true, slug: true, type: true }
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

    // Notify the event creator
    await prisma.notification.create({
      data: {
        userId: event.createdById,
        type: 'EVENT_REJECTED',
        title: 'Event Rejected',
        message: `Your event "${event.title}" has been rejected. Reason: ${reason}`,
        link: `/dashboard/events/${eventId}`,
        eventId
      }
    })

    return NextResponse.json({
      event: updatedEvent,
      message: 'Event has been rejected'
    })
  } catch (error) {
    console.error('Error rejecting event:', error)
    return NextResponse.json(
      { error: 'Failed to reject event' },
      { status: 500 }
    )
  }
}
