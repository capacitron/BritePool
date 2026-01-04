import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApprovalsClient } from './ApprovalsClient'
import type { EventType } from '@prisma/client'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

interface FormattedEvent {
  id: string
  title: string
  description: string | null
  type: EventType
  startTime: string
  endTime: string
  location: string | null
  virtualLink: string | null
  capacity: number | null
  committee: {
    id: string
    name: string
    slug: string
    type: string
  } | null
  registrationCount: number
  createdAt: string
}

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
      role: 'LEADER',
    },
    select: { committeeId: true },
  })

  const leaderCommitteeIds = userLeaderMemberships.map(
    (m: { committeeId: string }) => m.committeeId
  )

  // If not admin and not a leader of any committee, redirect
  if (!isAdmin && leaderCommitteeIds.length === 0) {
    redirect('/dashboard/events')
  }

  // Find events for committees user leads (or all if admin)
  // Note: The Event model doesn't have a status field, so we show all events
  // that belong to committees the user leads
  const events = await prisma.event.findMany({
    where: isAdmin
      ? {}
      : {
          committeeId: { in: leaderCommitteeIds },
        },
    include: {
      committee: {
        select: { id: true, name: true, slug: true, type: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Format events for the client component
  const formattedEvents: FormattedEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    location: event.location,
    virtualLink: event.virtualLink,
    capacity: event.capacity,
    committee: event.committee,
    registrationCount: event._count.registrations,
    createdAt: event.createdAt.toISOString(),
  }))

  return <ApprovalsClient events={formattedEvents} userRole={session.user.role} isAdmin={isAdmin} />
}
