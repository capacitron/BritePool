'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Map, MapPin, Plus, Filter, X, Building, Trees, Landmark, Mountain, Settings } from 'lucide-react'

interface MapLocation {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  type: 'FACILITY' | 'DEVELOPMENT_ZONE' | 'POINT_OF_INTEREST' | 'NATURAL_FEATURE' | 'INFRASTRUCTURE'
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OPERATIONAL'
  createdBy: { id: string; name: string }
  photos: { id: string; thumbnailUrl: string }[]
  createdAt: string
}

const LOCATION_TYPES = [
  { value: 'FACILITY', label: 'Facility', icon: Building },
  { value: 'DEVELOPMENT_ZONE', label: 'Development Zone', icon: Settings },
  { value: 'POINT_OF_INTEREST', label: 'Point of Interest', icon: Landmark },
  { value: 'NATURAL_FEATURE', label: 'Natural Feature', icon: Trees },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure', icon: Mountain },
]

const LOCATION_STATUSES = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OPERATIONAL', label: 'Operational' },
]

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR']

export default function MapPage() {
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchLocations()
    fetchUserRole()
  }, [selectedType, selectedStatus])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const session = await response.json()
        setUserRole(session?.user?.role || '')
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType) params.append('type', selectedType)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/map/locations?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedType(null)
    setSelectedStatus(null)
  }

  const hasActiveFilters = selectedType || selectedStatus
  const isAdmin = ADMIN_ROLES.includes(userRole)

  const getTypeIcon = (type: string) => {
    const typeConfig = LOCATION_TYPES.find(t => t.value === type)
    const Icon = typeConfig?.icon || MapPin
    return <Icon className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'OPERATIONAL': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">Interactive Map</h1>
          <p className="text-earth-brown-light mt-1">Explore sanctuary locations and points of interest</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-earth-brown/10 to-stone-warm aspect-video flex items-center justify-center relative">
          <div className="text-center">
            <Map className="h-16 w-16 mx-auto text-earth-brown-light mb-4" />
            <h3 className="text-lg font-medium text-earth-brown-dark">Interactive Map Area</h3>
            <p className="text-earth-brown-light text-sm mt-1">
              Map integration coming soon. Locations are listed below.
            </p>
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2">
            {locations.slice(0, 5).map((loc, idx) => (
              <div
                key={loc.id}
                className="w-8 h-8 bg-earth-brown text-white rounded-full flex items-center justify-center text-xs font-medium shadow-lg"
                title={loc.name}
                style={{
                  transform: `translateX(${idx * -10}px)`,
                }}
              >
                {idx + 1}
              </div>
            ))}
            {locations.length > 5 && (
              <div className="w-8 h-8 bg-stone text-earth-dark rounded-full flex items-center justify-center text-xs font-medium shadow-lg">
                +{locations.length - 5}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Location Type</h4>
              <div className="flex flex-wrap gap-2">
                {LOCATION_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      variant={selectedType === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedType(selectedType === type.value ? null : type.value)}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {type.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Status</h4>
              <div className="flex flex-wrap gap-2">
                {LOCATION_STATUSES.map((status) => (
                  <Button
                    key={status.value}
                    variant={selectedStatus === status.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(selectedStatus === status.value ? null : status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-earth-brown-light">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
            <h3 className="text-lg font-medium text-earth-brown-dark mb-2">No locations found</h3>
            <p className="text-earth-brown-light mb-4">
              {hasActiveFilters
                ? 'No locations match your filters. Try adjusting your selection.'
                : 'No map locations have been added yet.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location, index) => (
            <Link key={location.id} href={`/dashboard/map/${location.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-earth-brown text-white rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-earth-brown-dark truncate">{location.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-earth-brown-light">
                        {getTypeIcon(location.type)}
                        <span>{location.type.replace(/_/g, ' ')}</span>
                      </div>
                      {location.description && (
                        <p className="text-sm text-earth-brown-light mt-2 line-clamp-2">
                          {location.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(location.status)}`}>
                          {location.status.replace(/_/g, ' ')}
                        </span>
                        {location.photos.length > 0 && (
                          <span className="text-xs text-earth-brown-light">
                            {location.photos.length} photo{location.photos.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-earth-brown-light mt-2">
                        📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddLocationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchLocations()
          }}
        />
      )}
    </div>
  )
}

function AddLocationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    type: 'POINT_OF_INTEREST' as const,
    status: 'PLANNED' as const,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90')
      setSubmitting(false)
      return
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/map/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          latitude: lat,
          longitude: lng,
          type: formData.type,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create location')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Add New Location</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Location Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Main Sanctuary Building"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Brief description of this location..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Latitude *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., 10.1234"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Longitude *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., -84.5678"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                >
                  {LOCATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                >
                  {LOCATION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Creating...' : 'Create Location'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
