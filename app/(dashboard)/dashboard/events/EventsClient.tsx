'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar as CalendarIcon, List, MapPin, Clock, Users, Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/events/Calendar'
import { cn } from '@/lib/utils'

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
  committee: { id: string; name: string } | null
  attendeeCount: number
  isRegistered: boolean
}

interface EventsClientProps {
  events: EventData[]
  upcomingEvents: EventData[]
  userRole: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  COMMITTEE_MEETING: 'Meeting',
  WORKSHOP: 'Workshop',
  SANCTUARY_EVENT: 'Sanctuary Event',
  VIRTUAL_WEBINAR: 'Webinar',
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
    weekday: 'short',
    month: 'short',
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

export function EventsClient({ events, upcomingEvents, userRole }: EventsClientProps) {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState<EventData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const filteredEvents = selectedType
    ? events.filter(e => e.type === selectedType)
    : events

  const handleDayClick = (date: Date, dayEvents: EventData[]) => {
    setSelectedDate(date)
    setSelectedDayEvents(dayEvents as EventData[])
  }

  const handleEventClick = (event: { id: string }) => {
    window.location.href = `/dashboard/events/${event.id}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            Events
          </h1>
          <p className="text-earth-brown-light mt-1">
            View and register for community events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone overflow-hidden">
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'px-3 py-2 flex items-center gap-2 text-sm',
                view === 'calendar' ? 'bg-earth-brown text-white' : 'bg-white text-earth-dark hover:bg-stone-warm'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-2 flex items-center gap-2 text-sm border-l border-stone',
                view === 'list' ? 'bg-earth-brown text-white' : 'bg-white text-earth-dark hover:bg-stone-warm'
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedType === null
              ? 'bg-earth-brown text-white'
              : 'bg-stone-warm text-earth-dark hover:bg-stone'
          )}
        >
          All Events
        </button>
        {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedType === type
                ? 'bg-earth-brown text-white'
                : 'bg-stone-warm text-earth-dark hover:bg-stone'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {view === 'calendar' ? (
            <div className="space-y-4">
              <Calendar
                events={filteredEvents}
                onDayClick={handleDayClick}
                onEventClick={handleEventClick}
              />
              
              {selectedDate && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      Events on {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDayEvents.length === 0 ? (
                      <p className="text-earth-brown-light text-sm">No events on this day</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDayEvents.map(event => (
                          <Link
                            key={event.id}
                            href={`/dashboard/events/${event.id}`}
                            className="block p-3 rounded-lg border border-stone hover:bg-stone-warm transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium text-earth-dark">{event.title}</h4>
                                <div className="flex items-center gap-3 mt-1 text-sm text-earth-brown-light">
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
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                EVENT_TYPE_COLORS[event.type]
                              )}>
                                {EVENT_TYPE_LABELS[event.type]}
                              </span>
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
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredEvents.length === 0 ? (
                  <p className="text-earth-brown-light">No events found</p>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map(event => (
                      <Link
                        key={event.id}
                        href={`/dashboard/events/${event.id}`}
                        className="block p-4 rounded-lg border border-stone hover:bg-stone-warm transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-earth-dark">{event.title}</h3>
                              {event.isRegistered && (
                                <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 font-medium">
                                  Registered
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-earth-brown-light mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-earth-brown-light">
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
                                {event.attendeeCount} {event.capacity ? `/ ${event.capacity}` : ''} attendees
                              </span>
                            </div>
                          </div>
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium whitespace-nowrap',
                            EVENT_TYPE_COLORS[event.type]
                          )}>
                            {EVENT_TYPE_LABELS[event.type]}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-earth-brown-light text-sm">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className="block p-3 rounded-lg border border-stone hover:bg-stone-warm transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-xs font-medium',
                          EVENT_TYPE_COLORS[event.type]
                        )}>
                          {EVENT_TYPE_LABELS[event.type]}
                        </span>
                        {event.isRegistered && (
                          <span className="text-xs text-green-600 font-medium">✓</span>
                        )}
                      </div>
                      <h4 className="font-medium text-earth-dark text-sm">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-earth-brown-light">
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
    </div>
  )
}
