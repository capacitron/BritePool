'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Video, Users, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { EVENT_CATEGORIES_BY_COMMITTEE, CATEGORY_LABELS } from '@/lib/events/categories'
import { CommitteeType } from '@prisma/client'

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

export function CreateEventModal({ isOpen, onClose, onSuccess, userCommittees, userRole }: CreateEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('COMMITTEE_MEETING')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [virtualLink, setVirtualLink] = useState('')
  const [capacity, setCapacity] = useState('')
  const [selectedCommitteeIds, setSelectedCommitteeIds] = useState<string[]>([])

  const isAdmin = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(userRole)

  // Get available categories based on selected committees
  const availableCategories = selectedCommitteeIds.length > 0
    ? [...new Set(
        selectedCommitteeIds
          .map(id => userCommittees.find(c => c.id === id))
          .filter(Boolean)
          .flatMap(c => EVENT_CATEGORIES_BY_COMMITTEE[c!.type as CommitteeType] || [])
      )]
    : []

  // Reset category when committees change
  useEffect(() => {
    if (category && !availableCategories.includes(category)) {
      setCategory('')
    }
  }, [selectedCommitteeIds, category, availableCategories])

  // Check if user is a leader in all selected committees
  const isLeaderInAllSelected = selectedCommitteeIds.every(id => {
    const committee = userCommittees.find(c => c.id === id)
    return committee?.role === 'LEADER'
  })

  const willAutoApprove = isAdmin || isLeaderInAllSelected

  const handleCommitteeToggle = (committeeId: string) => {
    setSelectedCommitteeIds(prev =>
      prev.includes(committeeId)
        ? prev.filter(id => id !== committeeId)
        : [...prev, committeeId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate required fields
      if (!title.trim()) throw new Error('Title is required')
      if (!startDate || !startTime) throw new Error('Start date and time are required')
      if (!endDate || !endTime) throw new Error('End date and time are required')
      if (selectedCommitteeIds.length === 0) throw new Error('At least one committee must be selected')

      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = new Date(`${endDate}T${endTime}`)

      if (endDateTime <= startDateTime) {
        throw new Error('End time must be after start time')
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          category: category || undefined,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: location.trim() || undefined,
          virtualLink: virtualLink.trim() || undefined,
          capacity: capacity ? parseInt(capacity, 10) : undefined,
          committeeIds: selectedCommitteeIds,
        }),
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

            {/* Committees */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Select Committee(s) *
              </label>
              <div className="flex flex-wrap gap-2">
                {userCommittees.map(committee => (
                  <button
                    key={committee.id}
                    type="button"
                    onClick={() => handleCommitteeToggle(committee.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                      selectedCommitteeIds.includes(committee.id)
                        ? 'bg-forest-600 text-white border-forest-600'
                        : 'bg-white text-forest-700 border-sand-300 hover:bg-sand-50'
                    )}
                  >
                    {committee.name}
                    {committee.role === 'LEADER' && (
                      <span className="ml-1 text-xs opacity-75">(Leader)</span>
                    )}
                  </button>
                ))}
              </div>
              {selectedCommitteeIds.length === 0 && (
                <p className="text-sm text-forest-500 mt-1">Select at least one committee</p>
              )}
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

            {/* Category */}
            {availableCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                >
                  <option value="">Select a category (optional)</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                  ))}
                </select>
              </div>
            )}

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

            {/* Approval Notice */}
            <div className={cn(
              'p-3 rounded-lg text-sm',
              willAutoApprove ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            )}>
              {willAutoApprove ? (
                <>
                  <strong>Auto-approved:</strong> This event will be immediately visible on the calendar.
                </>
              ) : (
                <>
                  <strong>Pending approval:</strong> This event will be submitted for approval by committee leader(s).
                  You will be notified when it is approved or rejected.
                  {selectedCommitteeIds.length > 1 && (
                    <> All committee leaders must approve for multi-committee events.</>
                  )}
                </>
              )}
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
                disabled={loading || selectedCommitteeIds.length === 0}
              >
                {loading ? 'Creating...' : willAutoApprove ? 'Create Event' : 'Submit for Approval'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
