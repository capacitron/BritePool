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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [allEvents, upcomingEvents, userRegistrations] = await Promise.all([
    prisma.event.findMany({
      where: {
        startTime: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lte: new Date(now.getFullYear(), now.getMonth() + 2, 0)
        }
      },
      include: {
        committee: {
          select: { id: true, name: true }
        },
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: { startTime: 'asc' }
    }),
    prisma.event.findMany({
      where: {
        startTime: {
          gte: now
        }
      },
      include: {
        committee: {
          select: { id: true, name: true }
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
    })
  ])

  const registeredEventIds = new Set(userRegistrations.map(r => r.eventId))

  const formattedEvents = allEvents.map(event => ({
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
    attendeeCount: event._count.registrations,
    isRegistered: registeredEventIds.has(event.id)
  }))

  const formattedUpcoming = upcomingEvents.map(event => ({
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
    attendeeCount: event._count.registrations,
    isRegistered: registeredEventIds.has(event.id)
  }))

  return (
    <EventsClient
      events={formattedEvents}
      upcomingEvents={formattedUpcoming}
      userRole={session.user.role}
    />
  )
}
