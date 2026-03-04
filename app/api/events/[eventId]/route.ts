import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canManageCommittees } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { z } from 'zod'

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  type: z.enum(['COMMITTEE_MEETING', 'WORKSHOP', 'SANCTUARY_EVENT', 'VIRTUAL_WEBINAR']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().max(500).optional(),
  virtualLink: z.string().url().optional().nullable().or(z.literal('')),
  capacity: z.number().int().positive().optional(),
  committeeId: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        committee: {
          select: { id: true, name: true, slug: true },
        },
        registrations: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const isRegistered = event.registrations.some((r) => r.userId === session.user.id)

    return NextResponse.json({
      ...event,
      isRegistered,
      attendeeCount: event._count.registrations,
    })
  } catch (error) {
    logError(error, { action: 'fetch_event' })
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Allow system admins OR leaders of the event's committee
    const isSystemAdmin = canManageCommittees(session.user.role)
    let isCommitteeLeader = false
    if (existingEvent.committeeId) {
      const membership = await prisma.committeeMember.findFirst({
        where: {
          userId: session.user.id,
          committeeId: existingEvent.committeeId,
          role: 'LEADER',
        },
      })
      isCommitteeLeader = !!membership
    }

    if (!isSystemAdmin && !isCommitteeLeader) {
      return NextResponse.json(
        { error: 'You do not have permission to update this event' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (parsed.data.title) updateData.title = parsed.data.title
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.type) updateData.type = parsed.data.type
    if (parsed.data.startTime) updateData.startTime = new Date(parsed.data.startTime)
    if (parsed.data.endTime) updateData.endTime = new Date(parsed.data.endTime)
    if (parsed.data.location !== undefined) updateData.location = parsed.data.location || null
    if (parsed.data.virtualLink !== undefined)
      updateData.virtualLink = parsed.data.virtualLink || null
    if (parsed.data.capacity !== undefined) updateData.capacity = parsed.data.capacity
    if (parsed.data.committeeId !== undefined) updateData.committeeId = parsed.data.committeeId

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        committee: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    logError(error, { action: 'update_event' })
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canManageCommittees(session.user.role)) {
      return NextResponse.json({ error: 'Only administrators can delete events' }, { status: 403 })
    }

    const { eventId } = await params

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Clean up related records without cascade
    await prisma.eventApproval.deleteMany({
      where: { eventId },
    })

    await prisma.event.delete({
      where: { id: eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error, { action: 'delete_event' })
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
