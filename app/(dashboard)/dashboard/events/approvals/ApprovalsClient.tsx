'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Committee {
  id: string
  name: string
  slug: string
  type: string
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
  committee: Committee | null
  registrationCount: number
  createdAt: string
}

interface ApprovalsClientProps {
  events: EventData[]
  userRole: string
  isAdmin: boolean
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  COMMITTEE_MEETING: 'Meeting',
  WORKSHOP: 'Workshop',
  SANCTUARY_EVENT: 'Sanctuary Event',
  VIRTUAL_WEBINAR: 'Webinar',
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  COMMITTEE_MEETING: 'bg-forest-100 text-forest-800',
  WORKSHOP: 'bg-forest-100 text-forest-700',
  SANCTUARY_EVENT: 'bg-earth-100 text-earth-800',
  VIRTUAL_WEBINAR: 'bg-sand-200 text-sand-800',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })
}

export function ApprovalsClient({ events, userRole, isAdmin }: ApprovalsClientProps) {
  const [processingEvents, setProcessingEvents] = useState<Set<string>>(new Set())
  const [eventList, setEventList] = useState<EventData[]>(events)
  const [rejectingEventId, setRejectingEventId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async (eventId: string): Promise<void> => {
    setProcessingEvents((prev) => new Set([...prev, eventId]))
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve event')
      }

      // Remove from list after approval
      setEventList((prev) => prev.filter((e) => e.id !== eventId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve event')
    } finally {
      setProcessingEvents((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  const handleReject = async (eventId: string): Promise<void> => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    setProcessingEvents((prev) => new Set([...prev, eventId]))
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reject event')
      }

      // Remove from list
      setEventList((prev) => prev.filter((e) => e.id !== eventId))
      setRejectingEventId(null)
      setRejectReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject event')
    } finally {
      setProcessingEvents((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/events"
          className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-forest-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-forest-800">Event Management</h1>
          <p className="text-forest-500 mt-1 font-body">
            Review and manage events for your committees
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {eventList.length === 0 ? (
        <Card className="border-sand-200">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-forest-100 mb-4">
              <Check className="h-6 w-6 text-forest-600" />
            </div>
            <h3 className="text-lg font-medium text-forest-800 mb-1">No events</h3>
            <p className="text-forest-500">There are no events to manage at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {eventList.map((event: EventData) => (
            <Card key={event.id} className="border-sand-200">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Event Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-medium text-forest-800">{event.title}</h3>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              EVENT_TYPE_COLORS[event.type] || 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {EVENT_TYPE_LABELS[event.type] || event.type}
                          </span>
                        </div>
                        {event.committee && (
                          <p className="text-sm text-forest-500 mt-1">
                            Committee: <span className="font-medium">{event.committee.name}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-forest-600 text-sm mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-forest-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      )}
                      {event.virtualLink && (
                        <span className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          Virtual
                        </span>
                      )}
                      {event.capacity && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Capacity: {event.capacity}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event.registrationCount} registered
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:min-w-[200px]">
                    {rejectingEventId === event.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection..."
                          className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectingEventId(null)
                              setRejectReason('')
                            }}
                            disabled={processingEvents.has(event.id)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleReject(event.id)}
                            disabled={processingEvents.has(event.id) || !rejectReason.trim()}
                          >
                            {processingEvents.has(event.id) ? 'Rejecting...' : 'Confirm Reject'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button
                          className="bg-forest-600 hover:bg-forest-700 text-white w-full"
                          onClick={() => handleApprove(event.id)}
                          disabled={processingEvents.has(event.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {processingEvents.has(event.id) ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50 w-full"
                          onClick={() => setRejectingEventId(event.id)}
                          disabled={processingEvents.has(event.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Link
                          href={`/dashboard/events/${event.id}`}
                          className="text-center text-sm text-forest-600 hover:text-forest-700 underline"
                        >
                          View Details
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
