'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Edit, Trash2, X, Building, Trees, Landmark, Mountain, Settings, Image as ImageIcon } from 'lucide-react'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl: string
  mediumUrl: string | null
  filename: string
  type: string
  category: string
}

interface MapLocation {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  type: 'FACILITY' | 'DEVELOPMENT_ZONE' | 'POINT_OF_INTEREST' | 'NATURAL_FEATURE' | 'INFRASTRUCTURE'
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OPERATIONAL'
  createdBy: { id: string; name: string }
  photos: MediaItem[]
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

export default function LocationDetailPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = use(params)
  const router = useRouter()
  const [location, setLocation] = useState<MapLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)

  useEffect(() => {
    fetchLocation()
    fetchUserRole()
  }, [locationId])

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

  const fetchLocation = async () => {
    try {
      const response = await fetch(`/api/map/locations/${locationId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Location not found')
        } else {
          throw new Error('Failed to fetch location')
        }
        return
      }
      const data = await response.json()
      setLocation(data)
    } catch (err) {
      setError('Failed to load location')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/map/locations/${locationId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        router.push('/dashboard/map')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete location')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const isAdmin = ADMIN_ROLES.includes(userRole)

  const getTypeIcon = (type: string) => {
    const typeConfig = LOCATION_TYPES.find(t => t.value === type)
    const Icon = typeConfig?.icon || MapPin
    return <Icon className="h-5 w-5" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-earth-brown-light">Loading location...</p>
      </div>
    )
  }

  if (error || !location) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/map" className="inline-flex items-center text-earth-brown hover:text-earth-brown-dark">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
            <h3 className="text-lg font-medium text-earth-brown-dark mb-2">{error || 'Location not found'}</h3>
            <Link href="/dashboard/map">
              <Button variant="outline">Return to Map</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/map" className="inline-flex items-center text-earth-brown hover:text-earth-brown-dark">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map
        </Link>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-earth-brown text-white rounded-full flex items-center justify-center flex-shrink-0">
              {getTypeIcon(location.type)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{location.name}</CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-earth-brown-light flex items-center gap-1">
                  {getTypeIcon(location.type)}
                  {location.type.replace(/_/g, ' ')}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(location.status)}`}>
                  {location.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {location.description && (
            <div>
              <h3 className="text-sm font-medium text-earth-brown-dark mb-2">Description</h3>
              <p className="text-earth-brown-light">{location.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-earth-brown-dark mb-2">Coordinates</h3>
            <div className="flex items-center gap-2 text-earth-brown-light">
              <MapPin className="h-4 w-4" />
              <span>
                Latitude: <strong>{location.latitude.toFixed(6)}</strong>
              </span>
              <span className="mx-2">|</span>
              <span>
                Longitude: <strong>{location.longitude.toFixed(6)}</strong>
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-earth-brown-dark mb-2">Created By</h3>
            <p className="text-earth-brown-light">
              {location.createdBy.name} on {new Date(location.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Media Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          {location.photos.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
              <p className="text-earth-brown-light">No photos associated with this location</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {location.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square relative rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedImage(photo)}
                >
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showEditModal && (
        <EditLocationModal
          location={location}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchLocation()
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-earth-brown-light mb-6">
                Are you sure you want to delete &quot;{location.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={selectedImage.mediumUrl || selectedImage.url}
            alt={selectedImage.filename}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function EditLocationModal({ location, onClose, onSuccess }: { location: MapLocation; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: location.name,
    description: location.description || '',
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    type: location.type,
    status: location.status,
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
      const response = await fetch(`/api/map/locations/${location.id}`, {
        method: 'PATCH',
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
        throw new Error(data.error || 'Failed to update location')
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
            <CardTitle>Edit Location</CardTitle>
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
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
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
