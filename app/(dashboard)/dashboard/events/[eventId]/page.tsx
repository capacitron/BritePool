import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EventDetailClient } from './EventDetailClient'

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
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
        },
        orderBy: { registeredAt: 'desc' }
      },
      _count: {
        select: { registrations: true }
      }
    }
  })

  if (!event) {
    notFound()
  }

  const userRegistration = event.registrations.find(r => r.userId === session.user.id)

  const formattedEvent = {
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
    attendees: event.registrations.map(r => ({
      id: r.user.id,
      name: r.user.name,
      status: r.status,
      registeredAt: r.registeredAt.toISOString()
    })),
    isRegistered: !!userRegistration,
    registrationStatus: userRegistration?.status || null
  }

  return (
    <EventDetailClient
      event={formattedEvent}
      userId={session.user.id}
      userRole={session.user.role}
    />
  )
}
