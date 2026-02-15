'use client'

import { useState } from 'react'
import { X, Calendar, Clock, MapPin, Video, Users, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UserCommittee {
  id: string
  name: string
  type: string
  role: string
}

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userCommittees: UserCommittee[]
  userRole: string
}

const EVENT_TYPES = [
  { value: 'COMMITTEE_MEETING', label: 'Committee Meeting' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'SANCTUARY_EVENT', label: 'Sanctuary Event' },
  { value: 'VIRTUAL_WEBINAR', label: 'Virtual Webinar' },
]

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Does not repeat' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
]

export function CreateEventModal({ isOpen, onClose, onSuccess, userCommittees, userRole }: CreateEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('COMMITTEE_MEETING')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [virtualLink, setVirtualLink] = useState('')
  const [capacity, setCapacity] = useState('')
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('')
  const [recurrence, setRecurrence] = useState('')
  const [recurrenceUntil, setRecurrenceUntil] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate required fields
      if (!title.trim()) throw new Error('Title is required')
      if (!startDate || !startTime) throw new Error('Start date and time are required')
      if (!endDate || !endTime) throw new Error('End date and time are required')

      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = new Date(`${endDate}T${endTime}`)

      if (endDateTime <= startDateTime) {
        throw new Error('End time must be after start time')
      }

      if (recurrence && !recurrenceUntil) {
        throw new Error('Please select an end date for recurring events')
      }

      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: location.trim() || undefined,
        virtualLink: virtualLink.trim() || undefined,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        committeeId: selectedCommitteeId || undefined,
      }

      if (recurrence && recurrenceUntil) {
        payload.recurrence = {
          frequency: recurrence,
          until: recurrenceUntil,
        }
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create event')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <CardHeader className="flex flex-row items-center justify-between border-b border-sand-200">
          <CardTitle className="font-display text-forest-800">Create Event</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-sand-100 rounded">
            <X className="h-5 w-5 text-forest-500" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                placeholder="Describe the event..."
              />
            </div>

            {/* Committee & Event Type row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Committee */}
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  <Users className="inline h-4 w-4 mr-1" />
                  Committee
                </label>
                <select
                  value={selectedCommitteeId}
                  onChange={(e) => setSelectedCommitteeId(e.target.value)}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                >
                  <option value="">No committee</option>
                  {userCommittees.map(committee => (
                    <option key={committee.id} value={committee.id}>
                      {committee.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Event Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    if (!endDate) setEndDate(e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  required
                />
              </div>
            </div>

            {/* Recurrence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  <Repeat className="inline h-4 w-4 mr-1" />
                  Repeat
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                >
                  {RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {recurrence && (
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1">
                    Repeat Until *
                  </label>
                  <input
                    type="date"
                    value={recurrenceUntil}
                    onChange={(e) => setRecurrenceUntil(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                    required
                  />
                </div>
              )}
            </div>

            {recurrence && recurrenceUntil && startDate && (
              <p className="text-sm text-forest-600 bg-forest-50 rounded-lg px-3 py-2">
                <Repeat className="inline h-3.5 w-3.5 mr-1" />
                This will create multiple events repeating{' '}
                {recurrence === 'WEEKLY' ? 'every week' : recurrence === 'BIWEEKLY' ? 'every 2 weeks' : 'every month'}{' '}
                until {new Date(recurrenceUntil + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                placeholder="Physical location (optional)"
              />
            </div>

            {/* Virtual Link */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                <Video className="inline h-4 w-4 mr-1" />
                Virtual Meeting Link
              </label>
              <input
                type="url"
                value={virtualLink}
                onChange={(e) => setVirtualLink(e.target.value)}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                placeholder="https://zoom.us/... (optional)"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                <Users className="inline h-4 w-4 mr-1" />
                Capacity
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                placeholder="Maximum attendees (optional)"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-sand-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={loading}
              >
                {loading ? 'Creating...' : recurrence ? 'Create Recurring Events' : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
