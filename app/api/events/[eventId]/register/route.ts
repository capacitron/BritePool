import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.startTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot register for past events' },
        { status: 400 }
      )
    }

    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      )
    }

    let status: 'REGISTERED' | 'WAITLISTED' = 'REGISTERED'
    if (event.capacity && event._count.registrations >= event.capacity) {
      status = 'WAITLISTED'
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        userId: session.user.id,
        eventId: eventId,
        status: status
      },
      include: {
        event: {
          select: { id: true, title: true }
        }
      }
    })

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    console.error('Error registering for event:', error)
    return NextResponse.json(
      { error: 'Failed to register for event' },
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

    const { eventId } = await params

    const registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    await prisma.eventRegistration.delete({
      where: { id: registration.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling registration:', error)
    return NextResponse.json(
      { error: 'Failed to cancel registration' },
      { status: 500 }
    )
  }
}
