'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar as CalendarIcon,
  List,
  MapPin,
  Clock,
  Users,
  Video,
  Plus,
  Pencil,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { Calendar } from '@/components/events/Calendar'
import { CreateEventModal } from '@/components/events/CreateEventModal'
import { cn } from '@/lib/utils'

interface CommitteeInfo {
  id: string
  name: string
  slug?: string
  type?: string
}

interface EventCommittee {
  id: string
  committeeId: string
  committee: CommitteeInfo
}

interface EventData {
  id: string
  title: string
  description: string | null
  type: string
  category?: string | null
  status?: string
  startTime: string
  endTime: string
  location: string | null
  virtualLink: string | null
  capacity: number | null
  committee: CommitteeInfo | null
  committees?: EventCommittee[]
  attendeeCount: number
  isRegistered: boolean
  createdBy?: { id: string; name: string }
  [key: string]: unknown
}

interface UserCommittee {
  id: string
  name: string
  type: string
  role: string
}

interface EventsClientProps {
  events: EventData[]
  upcomingEvents: EventData[]
  userRole: string
  userCommittees: UserCommittee[]
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

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })
}

export function EventsClient({
  events,
  upcomingEvents,
  userRole,
  userCommittees,
}: EventsClientProps) {
  const router = useRouter()
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState<EventData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null)

  // Check if user can create events (is a member of at least one committee or is admin)
  const canCreateEvents =
    userCommittees.length > 0 || ['WEB_STEWARD', 'BOARD_CHAIR'].includes(userRole)
  const canManageEvents = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER'].includes(userRole)

  const filteredEvents = events.filter((e) => {
    if (selectedType && e.type !== selectedType) return false
    return true
  })

  const handleDayClick = (date: Date, dayEvents: EventData[]) => {
    setSelectedDate(date)
    setSelectedDayEvents(dayEvents as EventData[])
  }

  const handleEventClick = (event: { id: string }) => {
    window.location.href = `/dashboard/events/${event.id}`
  }

  const handleEventCreated = () => {
    setShowCreateModal(false)
    // Refresh the page to show new event
    window.location.reload()
  }

  const getEventCommittees = (event: EventData): CommitteeInfo[] => {
    if (event.committees && event.committees.length > 0) {
      return event.committees.map((ec) => ec.committee)
    }
    if (event.committee) {
      return [event.committee]
    }
    return []
  }

  return (
    <div className="space-y-6">
      <PageHeader path="events" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          {canCreateEvents && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-forest-600 hover:bg-forest-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
          <div className="flex rounded-lg border border-sand-300 overflow-hidden">
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'px-3 py-2 flex items-center gap-2 text-sm font-body',
                view === 'calendar'
                  ? 'bg-forest-600 text-white'
                  : 'bg-white text-forest-700 hover:bg-sand-100'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-2 flex items-center gap-2 text-sm border-l border-sand-300 font-body',
                view === 'list'
                  ? 'bg-forest-600 text-white'
                  : 'bg-white text-forest-700 hover:bg-sand-100'
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors font-body',
            selectedType === null
              ? 'bg-forest-600 text-white'
              : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
          )}
        >
          All Events
        </button>
        {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors font-body',
              selectedType === type
                ? 'bg-forest-600 text-white'
                : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div>
          {view === 'calendar' ? (
            <div className="space-y-4">
              <Calendar
                events={filteredEvents}
                onDayClick={handleDayClick}
                onEventClick={handleEventClick}
              />

              {selectedDate && (
                <Card className="border-sand-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display text-forest-800">
                      Events on{' '}
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDayEvents.length === 0 ? (
                      <p className="text-forest-500 text-sm font-body">No events on this day</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDayEvents.map((event) => (
                          <Link
                            key={event.id}
                            href={`/dashboard/events/${event.id}`}
                            className="block p-3 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium text-forest-800 font-body">
                                  {event.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 text-sm text-forest-500 font-body">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatTime(event.startTime)}
                                  </span>
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {event.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded text-xs font-medium font-body',
                                    EVENT_TYPE_COLORS[event.type]
                                  )}
                                >
                                  {EVENT_TYPE_LABELS[event.type]}
                                </span>
                                {canManageEvents && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setEditingEvent(event)
                                    }}
                                    className="p-1 rounded text-forest-500 hover:bg-forest-100 transition-colors"
                                    title="Edit event"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-sand-200">
              <CardHeader>
                <CardTitle className="font-display text-forest-800">All Events</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredEvents.length === 0 ? (
                  <p className="text-forest-500 font-body">No events found</p>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((event) => {
                      const committees = getEventCommittees(event)
                      return (
                        <Link
                          key={event.id}
                          href={`/dashboard/events/${event.id}`}
                          className="block p-4 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium text-forest-800 font-body">
                                  {event.title}
                                </h3>
                                {event.isRegistered && (
                                  <span className="px-2 py-0.5 rounded text-xs bg-forest-100 text-forest-700 font-medium font-body">
                                    Registered
                                  </span>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-forest-500 mt-1 line-clamp-2 font-body">
                                  {event.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-forest-500 font-body">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
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
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {event.attendeeCount}{' '}
                                  {event.capacity ? `/ ${event.capacity}` : ''} attendees
                                </span>
                              </div>
                              {/* Committee badges */}
                              {committees.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {committees.map((c) => (
                                    <span
                                      key={c.id}
                                      className="px-2 py-0.5 rounded text-xs bg-sand-100 text-forest-700 font-body"
                                    >
                                      {c.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={cn(
                                  'px-2 py-1 rounded text-xs font-medium whitespace-nowrap font-body',
                                  EVENT_TYPE_COLORS[event.type]
                                )}
                              >
                                {EVENT_TYPE_LABELS[event.type]}
                              </span>
                              {canManageEvents && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setEditingEvent(event)
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-forest-600 hover:bg-forest-100 transition-colors font-body"
                                  title="Edit event"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-sand-200">
            <CardHeader>
              <CardTitle className="text-lg font-display text-forest-800">
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-forest-500 text-sm font-body">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className="block p-3 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-xs font-medium font-body',
                            EVENT_TYPE_COLORS[event.type]
                          )}
                        >
                          {EVENT_TYPE_LABELS[event.type]}
                        </span>
                        {event.isRegistered && (
                          <span className="text-xs text-forest-600 font-medium font-body">✓</span>
                        )}
                      </div>
                      <h4 className="font-medium text-forest-800 text-sm font-body">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-forest-500 font-body">
                        <span>{formatDate(event.startTime)}</span>
                        <span>•</span>
                        <span>{formatTime(event.startTime)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleEventCreated}
          userCommittees={userCommittees}
          userRole={userRole}
        />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <CreateEventModal
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={() => {
            setEditingEvent(null)
            router.refresh()
            window.location.reload()
          }}
          userCommittees={userCommittees}
          userRole={userRole}
          editEventId={editingEvent.id}
          initialData={{
            title: editingEvent.title,
            description: editingEvent.description || undefined,
            type: editingEvent.type,
            startTime: editingEvent.startTime,
            endTime: editingEvent.endTime,
            location: editingEvent.location || undefined,
            virtualLink: editingEvent.virtualLink || undefined,
            capacity: editingEvent.capacity,
            committeeId: editingEvent.committee?.id,
          }}
        />
      )}
    </div>
  )
}
