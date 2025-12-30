import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { ALL_CATEGORIES, isValidCategoryForCommittee } from '@/lib/events/categories'
import { CommitteeType } from '@prisma/client'

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(['COMMITTEE_MEETING', 'WORKSHOP', 'SANCTUARY_EVENT', 'VIRTUAL_WEBINAR']),
  category: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().max(500).optional(),
  virtualLink: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  committeeIds: z.array(z.string()).min(1), // Required: at least one committee
})

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const upcoming = searchParams.get('upcoming')
    const includeUserPending = searchParams.get('includeUserPending') === 'true'
    const pendingApproval = searchParams.get('pendingApproval') === 'true'

    const where: Record<string, unknown> = {}

    // By default, only show approved events
    // Unless user is viewing their own pending events or leader is viewing pending approvals
    if (pendingApproval) {
      where.status = 'PENDING'
    } else if (includeUserPending) {
      where.OR = [
        { status: 'APPROVED' },
        { status: 'PENDING', createdById: session.user.id }
      ]
    } else {
      where.status = 'APPROVED'
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
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
          select: { id: true, name: true, slug: true, type: true }
        },
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
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true }
            }
          }
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

    const body = await request.json()
    const parsed = createEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, type, category, startTime, endTime, location, virtualLink, capacity, committeeIds } = parsed.data

    // Validate all committees exist and get their types
    const committees = await prisma.committee.findMany({
      where: { id: { in: committeeIds } },
      select: { id: true, type: true, name: true }
    })

    if (committees.length !== committeeIds.length) {
      return NextResponse.json(
        { error: 'One or more committees not found' },
        { status: 404 }
      )
    }

    // Validate category if provided
    if (category) {
      if (!ALL_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
      }

      // Check if category is valid for at least one of the selected committees
      const isValidForAny = committees.some(c =>
        isValidCategoryForCommittee(category, c.type as CommitteeType)
      )
      if (!isValidForAny) {
        return NextResponse.json(
          { error: 'Category is not valid for the selected committees' },
          { status: 400 }
        )
      }
    }

    const isAdmin = ADMIN_ROLES.includes(session.user.role)

    // Check user's committee memberships
    const userMemberships = await prisma.committeeMember.findMany({
      where: {
        userId: session.user.id,
        committeeId: { in: committeeIds }
      },
      select: { committeeId: true, role: true }
    })

    // If not admin, user must be a member of at least one selected committee
    if (!isAdmin && userMemberships.length === 0) {
      return NextResponse.json(
        { error: 'You must be a member of at least one selected committee to create an event' },
        { status: 403 }
      )
    }

    // Determine if event should be auto-approved
    // Auto-approve if: admin OR user is a LEADER in ALL selected committees
    let shouldAutoApprove = false

    if (isAdmin) {
      shouldAutoApprove = true
    } else {
      // Check if user is a leader in ALL selected committees
      const leaderCommitteeIds = userMemberships
        .filter(m => m.role === 'LEADER')
        .map(m => m.committeeId)

      shouldAutoApprove = committeeIds.every(id => leaderCommitteeIds.includes(id))
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        type,
        category: category || null,
        status: shouldAutoApprove ? 'APPROVED' : 'PENDING',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        virtualLink: virtualLink || null,
        capacity: capacity || null,
        createdById: session.user.id,
        // Create committee associations
        committees: {
          create: committeeIds.map(id => ({ committeeId: id }))
        },
        // If auto-approved, create approval records for each committee
        ...(shouldAutoApprove ? {
          approvals: {
            create: committeeIds.map(id => ({
              committeeId: id,
              approverId: session.user.id
            }))
          }
        } : {})
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
        approvals: true,
        _count: {
          select: { registrations: true }
        }
      }
    })

    // If pending, notify committee leaders
    if (!shouldAutoApprove) {
      // Get leaders of all selected committees
      const leaders = await prisma.committeeMember.findMany({
        where: {
          committeeId: { in: committeeIds },
          role: 'LEADER'
        },
        select: { userId: true, committeeId: true }
      })

      // Create notifications for all leaders
      const uniqueLeaderIds = [...new Set(leaders.map(l => l.userId))]

      await prisma.notification.createMany({
        data: uniqueLeaderIds.map(userId => ({
          userId,
          type: 'EVENT_PENDING_APPROVAL',
          title: 'Event Pending Approval',
          message: `A new event "${title}" has been requested and needs your approval.`,
          link: `/dashboard/events/${event.id}`,
          eventId: event.id
        }))
      })
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
