import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // If not admin and not a leader of any committee, return empty
    if (!isAdmin && leaderCommitteeIds.length === 0) {
      return NextResponse.json({ events: [], count: 0 })
    }

    // Find pending events for committees user leads (or all if admin)
    const pendingEvents = await prisma.event.findMany({
      where: {
        status: 'PENDING',
        ...(isAdmin ? {} : {
          committees: {
            some: {
              committeeId: { in: leaderCommitteeIds }
            }
          }
        })
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
      orderBy: { createdAt: 'desc' }
    })

    // Filter to only include events where user hasn't already approved for their committees
    const eventsNeedingApproval = pendingEvents.filter(event => {
      const approvedCommitteeIds = event.approvals.map(a => a.committeeId)
      const eventCommitteeIds = event.committees.map(ec => ec.committeeId)

      if (isAdmin) {
        // Admin can approve any unapproved committee
        return eventCommitteeIds.some(id => !approvedCommitteeIds.includes(id))
      }

      // For leaders, check if any of their committees still need approval
      return leaderCommitteeIds.some(id =>
        eventCommitteeIds.includes(id) && !approvedCommitteeIds.includes(id)
      )
    })

    // Enhance each event with info about which committees need user's approval
    const enhancedEvents = eventsNeedingApproval.map(event => {
      const approvedCommitteeIds = event.approvals.map(a => a.committeeId)
      const eventCommitteeIds = event.committees.map(ec => ec.committeeId)

      const committeesNeedingYourApproval = isAdmin
        ? eventCommitteeIds.filter(id => !approvedCommitteeIds.includes(id))
        : leaderCommitteeIds.filter(id =>
            eventCommitteeIds.includes(id) && !approvedCommitteeIds.includes(id)
          )

      return {
        ...event,
        committeesNeedingYourApproval,
        totalCommittees: eventCommitteeIds.length,
        approvedCommittees: approvedCommitteeIds.length
      }
    })

    return NextResponse.json({
      events: enhancedEvents,
      count: enhancedEvents.length
    })
  } catch (error) {
    console.error('Error fetching pending events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending events' },
      { status: 500 }
    )
  }
}
