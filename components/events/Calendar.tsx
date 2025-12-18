'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EventData {
  id: string
  title: string
  type: string
  startTime: string
  endTime: string
}

interface CalendarProps {
  events: EventData[]
  onDayClick?: (date: Date, dayEvents: EventData[]) => void
  onEventClick?: (event: EventData) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const EVENT_TYPE_COLORS: Record<string, string> = {
  COMMITTEE_MEETING: 'bg-blue-500',
  WORKSHOP: 'bg-green-500',
  SANCTUARY_EVENT: 'bg-purple-500',
  VIRTUAL_WEBINAR: 'bg-orange-500',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function Calendar({ events, onDayClick, onEventClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)
  
  const today = new Date()

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEventsForDay = (day: number): EventData[] => {
    const date = new Date(year, month, day)
    return events.filter(event => {
      const eventDate = new Date(event.startTime)
      return isSameDay(eventDate, date)
    })
  }

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day)
    const dayEvents = getEventsForDay(day)
    onDayClick?.(date, dayEvents)
  }

  const renderCalendarDays = () => {
    const days = []
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100" />
      )
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isToday = isSameDay(date, today)
      const dayEvents = getEventsForDay(day)
      
      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={cn(
            'h-24 p-1 border border-gray-100 cursor-pointer hover:bg-stone-warm transition-colors overflow-hidden',
            isToday && 'bg-earth-brown/5 ring-2 ring-earth-brown ring-inset'
          )}
        >
          <div className={cn(
            'text-sm font-medium mb-1',
            isToday ? 'text-earth-brown' : 'text-earth-dark'
          )}>
            {day}
          </div>
          <div className="space-y-0.5">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick?.(event)
                }}
                className={cn(
                  'text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80',
                  EVENT_TYPE_COLORS[event.type] || 'bg-gray-500'
                )}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-earth-brown-light px-1">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      )
    }
    
    return days
  }

  return (
    <div className="bg-white rounded-lg border border-stone shadow-warm">
      <div className="flex items-center justify-between p-4 border-b border-stone">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-serif font-semibold text-earth-brown-dark">
            {MONTHS[month]} {year}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7">
        {DAYS.map(day => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-earth-brown-light bg-stone-warm border-b border-stone"
          >
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>
      
      <div className="p-4 border-t border-stone">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Meeting</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Workshop</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span>Sanctuary</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>Webinar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
