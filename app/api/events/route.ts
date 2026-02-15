import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { z } from 'zod'

const recurrenceSchema = z.object({
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  until: z.string(), // YYYY-MM-DD
})

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
  recurrence: recurrenceSchema.optional(),
})

function generateRecurrenceDates(
  startTime: Date,
  endTime: Date,
  frequency: string,
  until: string
): Array<{ startTime: Date; endTime: Date }> {
  const dates: Array<{ startTime: Date; endTime: Date }> = []
  const untilDate = new Date(until + 'T23:59:59')
  const durationMs = endTime.getTime() - startTime.getTime()
  const maxOccurrences = 52

  let current = new Date(startTime)

  // Skip the first occurrence (it's the original event)
  for (let i = 0; i < maxOccurrences; i++) {
    // Advance to next occurrence
    if (frequency === 'WEEKLY') {
      current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else if (frequency === 'BIWEEKLY') {
      current = new Date(current.getTime() + 14 * 24 * 60 * 60 * 1000)
    } else if (frequency === 'MONTHLY') {
      const next = new Date(current)
      next.setMonth(next.getMonth() + 1)
      current = next
    }

    if (current > untilDate) break

    dates.push({
      startTime: new Date(current),
      endTime: new Date(current.getTime() + durationMs),
    })
  }

  return dates
}

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
    const committeeId = searchParams.get('committeeId')

    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
    }

    if (committeeId) {
      where.committeeId = committeeId
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
          select: { id: true, name: true, slug: true, type: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json(events)
  } catch (error) {
    logError(error, { action: 'fetch_events' })
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      type,
      startTime,
      endTime,
      location,
      virtualLink,
      capacity,
      committeeId,
      recurrence,
    } = parsed.data

    // Validate committee exists if provided
    if (committeeId) {
      const committee = await prisma.committee.findUnique({
        where: { id: committeeId },
        select: { id: true },
      })

      if (!committee) {
        return NextResponse.json({ error: 'Committee not found' }, { status: 404 })
      }
    }

    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    const baseEventData = {
      title,
      description: description || null,
      type,
      location: location || null,
      virtualLink: virtualLink || null,
      capacity: capacity || null,
      committeeId: committeeId || null,
    }

    // If recurring, create all events in a transaction
    if (recurrence) {
      const additionalDates = generateRecurrenceDates(
        startDate,
        endDate,
        recurrence.frequency,
        recurrence.until
      )

      const events = await prisma.$transaction(
        [
          // First event (the original)
          prisma.event.create({
            data: {
              ...baseEventData,
              startTime: startDate,
              endTime: endDate,
            },
          }),
          // All recurring instances
          ...additionalDates.map((dates) =>
            prisma.event.create({
              data: {
                ...baseEventData,
                startTime: dates.startTime,
                endTime: dates.endTime,
              },
            })
          ),
        ]
      )

      return NextResponse.json(
        { events, count: events.length },
        { status: 201 }
      )
    }

    // Single event creation
    const event = await prisma.event.create({
      data: {
        ...baseEventData,
        startTime: startDate,
        endTime: endDate,
      },
      include: {
        committee: {
          select: { id: true, name: true, slug: true, type: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    logError(error, { action: 'create_event' })
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
