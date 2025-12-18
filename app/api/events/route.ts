import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(['COMMITTEE_MEETING', 'WORKSHOP', 'SANCTUARY_EVENT', 'VIRTUAL_WEBINAR']),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().max(500).optional(),
  virtualLink: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  committeeId: z.string().optional(),
})

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const upcoming = searchParams.get('upcoming')

    const where: Record<string, unknown> = {}
    
    if (type) {
      where.type = type
    }
    
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (upcoming === 'true') {
      where.startTime = {
        gte: new Date(),
      }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        committee: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can create events' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, type, startTime, endTime, location, virtualLink, capacity, committeeId } = parsed.data

    if (committeeId) {
      const committee = await prisma.committee.findUnique({
        where: { id: committeeId }
      })
      if (!committee) {
        return NextResponse.json(
          { error: 'Committee not found' },
          { status: 404 }
        )
      }
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        type,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        virtualLink: virtualLink || null,
        capacity: capacity || null,
        committeeId: committeeId || null,
      },
      include: {
        committee: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
