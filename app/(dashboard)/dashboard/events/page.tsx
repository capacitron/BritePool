import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EventsClient } from './EventsClient'

export default async function EventsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const now = new Date()

  const [allEvents, upcomingEvents, userRegistrations, userCommitteeMemberships] = await Promise.all([
    // Get approved events + user's own pending events
    prisma.event.findMany({
      where: {
        startTime: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lte: new Date(now.getFullYear(), now.getMonth() + 2, 0)
        },
        OR: [
          { status: 'APPROVED' },
          { status: 'PENDING', createdById: session.user.id }
        ]
      },
      include: {
        committee: {
          select: { id: true, name: true, type: true }
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
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: { startTime: 'asc' }
    }),
    // Upcoming approved events only
    prisma.event.findMany({
      where: {
        startTime: { gte: now },
        status: 'APPROVED'
      },
      include: {
        committee: {
          select: { id: true, name: true, type: true }
        },
        committees: {
          include: {
            committee: {
              select: { id: true, name: true, slug: true, type: true }
            }
          }
        },
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: { startTime: 'asc' },
      take: 5
    }),
    prisma.eventRegistration.findMany({
      where: {
        userId: session.user.id
      },
      select: { eventId: true }
    }),
    // Get user's committee memberships
    prisma.committeeMember.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        committee: {
          select: { id: true, name: true, type: true }
        }
      }
    })
  ])

  const registeredEventIds = new Set(userRegistrations.map(r => r.eventId))

  const formattedEvents = allEvents.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type,
    category: event.category,
    status: event.status,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    location: event.location,
    virtualLink: event.virtualLink,
    capacity: event.capacity,
    committee: event.committee,
    committees: event.committees,
    createdBy: event.createdBy,
    attendeeCount: event._count.registrations,
    isRegistered: registeredEventIds.has(event.id)
  }))

  const formattedUpcoming = upcomingEvents.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type,
    category: event.category,
    status: event.status,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    location: event.location,
    virtualLink: event.virtualLink,
    capacity: event.capacity,
    committee: event.committee,
    committees: event.committees,
    attendeeCount: event._count.registrations,
    isRegistered: registeredEventIds.has(event.id)
  }))

  // Format user committees
  const userCommittees = userCommitteeMemberships.map(m => ({
    id: m.committee.id,
    name: m.committee.name,
    type: m.committee.type,
    role: m.role
  }))

  return (
    <EventsClient
      events={formattedEvents}
      upcomingEvents={formattedUpcoming}
      userRole={session.user.role}
      userId={session.user.id}
      userCommittees={userCommittees}
    />
  )
}
