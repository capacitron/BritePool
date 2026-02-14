'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Attendee {
  id: string
  name: string
  status: string
  registeredAt: string
}

interface EventData {
  id: string
  title: string
  description: string | null
  type: string
  startTime: string
  endTime: string
  location: string | null
  virtualLink: string | null
  capacity: number | null
  committee: { id: string; name: string; slug: string } | null
  attendeeCount: number
  attendees: Attendee[]
  isRegistered: boolean
  registrationStatus: string | null
}

interface EventDetailClientProps {
  event: EventData
  userId: string
  userRole: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  COMMITTEE_MEETING: 'Committee Meeting',
  WORKSHOP: 'Workshop',
  SANCTUARY_EVENT: 'Sanctuary Event',
  VIRTUAL_WEBINAR: 'Virtual Webinar',
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  COMMITTEE_MEETING: 'bg-blue-100 text-blue-800',
  WORKSHOP: 'bg-green-100 text-green-800',
  SANCTUARY_EVENT: 'bg-purple-100 text-purple-800',
  VIRTUAL_WEBINAR: 'bg-orange-100 text-orange-800',
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function EventDetailClient({ event, userId, userRole }: EventDetailClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(event.isRegistered)
  const [attendeeCount, setAttendeeCount] = useState(event.attendeeCount)

  const isPastEvent = new Date(event.startTime) < new Date()
  const isAtCapacity = event.capacity ? attendeeCount >= event.capacity : false

  const handleRegister = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
      })

      if (response.ok) {
        setIsRegistered(true)
        setAttendeeCount(prev => prev + 1)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to register')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Failed to register for event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelRegistration = async () => {
    if (!confirm('Are you sure you want to cancel your registration?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIsRegistered(false)
        setAttendeeCount(prev => prev - 1)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel registration')
      }
    } catch (error) {
      console.error('Cancel registration error:', error)
      alert('Failed to cancel registration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-2 text-forest-500 hover:text-forest-700 transition-colors font-body"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <div className="flex flex-col gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={cn(
                    'inline-block px-3 py-1 rounded-full text-sm font-medium mb-3',
                    EVENT_TYPE_COLORS[event.type]
                  )}>
                    {EVENT_TYPE_LABELS[event.type]}
                  </span>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                </div>
                {isRegistered && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Registered
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-sand-100">
                  <Calendar className="h-5 w-5 text-forest-500" />
                  <div>
                    <p className="text-xs text-forest-500 font-body">Date</p>
                    <p className="font-medium text-forest-800 font-body">{formatDate(event.startTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-sand-100">
                  <Clock className="h-5 w-5 text-forest-500" />
                  <div>
                    <p className="text-xs text-forest-500 font-body">Time</p>
                    <p className="font-medium text-forest-800 font-body">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-sand-100">
                    <MapPin className="h-5 w-5 text-forest-500" />
                    <div>
                      <p className="text-xs text-forest-500 font-body">Location</p>
                      <p className="font-medium text-forest-800 font-body">{event.location}</p>
                    </div>
                  </div>
                )}
                {event.virtualLink && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-sand-100">
                    <Video className="h-5 w-5 text-forest-500" />
                    <div>
                      <p className="text-xs text-forest-500 font-body">Virtual</p>
                      <a
                        href={event.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline font-body"
                      >
                        Join Online
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <div>
                  <h3 className="font-semibold text-forest-800 mb-2 font-body">Description</h3>
                  <p className="text-forest-600 whitespace-pre-wrap font-body">{event.description}</p>
                </div>
              )}

              {event.committee && (
                <div>
                  <h3 className="font-semibold text-forest-800 mb-2 font-body">Organized by</h3>
                  <p className="text-forest-600 font-body">{event.committee.name} Committee</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-forest-500" />
                <div>
                  <p className="font-medium text-forest-800 font-body">
                    {attendeeCount} {event.capacity ? `/ ${event.capacity}` : ''} Attendees
                  </p>
                  {event.capacity && (
                    <p className="text-xs text-forest-500 font-body">
                      {event.capacity - attendeeCount} spots remaining
                    </p>
                  )}
                </div>
              </div>

              {isPastEvent ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-sand-100 text-forest-500">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-body">This event has already passed</span>
                </div>
              ) : isRegistered ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-body">You are registered for this event</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancelRegistration}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cancelling...' : 'Cancel Registration'}
                  </Button>
                </div>
              ) : isAtCapacity ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-body">This event is at capacity</span>
                </div>
              ) : (
                <Button
                  className="w-full bg-forest-600 hover:bg-forest-700 text-white"
                  onClick={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? 'Registering...' : 'Register for Event'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              {event.attendees.length === 0 ? (
                <p className="text-forest-500 text-sm font-body">No attendees yet</p>
              ) : (
                <div className="space-y-2">
                  {event.attendees.slice(0, 10).map(attendee => (
                    <div
                      key={attendee.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-sand-100"
                    >
                      <div className="h-8 w-8 rounded-full bg-forest-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-forest-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-forest-800 truncate font-body">
                          {attendee.name}
                        </p>
                        {attendee.status === 'WAITLISTED' && (
                          <span className="text-xs text-yellow-600 font-body">Waitlisted</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {event.attendees.length > 10 && (
                    <p className="text-sm text-forest-500 text-center pt-2 font-body">
                      +{event.attendees.length - 10} more attendees
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
