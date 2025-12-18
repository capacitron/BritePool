import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  type: z.enum(['COMMITTEE_MEETING', 'WORKSHOP', 'SANCTUARY_EVENT', 'VIRTUAL_WEBINAR']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().max(500).optional(),
  virtualLink: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  committeeId: z.string().optional().nullable(),
})

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

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
          select: { id: true, name: true, slug: true }
        },
        registrations: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const isRegistered = event.registrations.some(r => r.userId === session.user.id)

    return NextResponse.json({
      ...event,
      isRegistered,
      attendeeCount: event._count.registrations
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
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

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can update events' },
        { status: 403 }
      )
    }

    const { eventId } = await params

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
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
    if (parsed.data.location !== undefined) updateData.location = parsed.data.location
    if (parsed.data.virtualLink !== undefined) updateData.virtualLink = parsed.data.virtualLink
    if (parsed.data.capacity !== undefined) updateData.capacity = parsed.data.capacity
    if (parsed.data.committeeId !== undefined) updateData.committeeId = parsed.data.committeeId

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        committee: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
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

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can delete events' },
        { status: 403 }
      )
    }

    const { eventId } = await params

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await prisma.event.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
