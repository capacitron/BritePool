import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApprovalsClient } from './ApprovalsClient'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

export default async function EventApprovalsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
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

  // If not admin and not a leader of any committee, redirect
  if (!isAdmin && leaderCommitteeIds.length === 0) {
    redirect('/dashboard/events')
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
      return eventCommitteeIds.some(id => !approvedCommitteeIds.includes(id))
    }

    return leaderCommitteeIds.some(id =>
      eventCommitteeIds.includes(id) && !approvedCommitteeIds.includes(id)
    )
  })

  // Format events with approval info
  const formattedEvents = eventsNeedingApproval.map(event => {
    const approvedCommitteeIds = event.approvals.map(a => a.committeeId)
    const eventCommitteeIds = event.committees.map(ec => ec.committeeId)

    const committeesNeedingYourApproval = isAdmin
      ? eventCommitteeIds.filter(id => !approvedCommitteeIds.includes(id))
      : leaderCommitteeIds.filter(id =>
          eventCommitteeIds.includes(id) && !approvedCommitteeIds.includes(id)
        )

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      category: event.category,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      location: event.location,
      virtualLink: event.virtualLink,
      capacity: event.capacity,
      committees: event.committees.map(ec => ec.committee),
      createdBy: event.createdBy,
      approvals: event.approvals.map(a => ({
        ...a,
        approvedAt: a.approvedAt.toISOString()
      })),
      committeesNeedingYourApproval,
      totalCommittees: eventCommitteeIds.length,
      approvedCommittees: approvedCommitteeIds.length,
      createdAt: event.createdAt.toISOString()
    }
  })

  return (
    <ApprovalsClient
      events={formattedEvents}
      userRole={session.user.role}
      isAdmin={isAdmin}
    />
  )
}
