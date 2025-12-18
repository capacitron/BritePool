'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Image, Video, Upload, Filter, X, Play, Camera, Plane } from 'lucide-react'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl: string
  filename: string
  filesize: number
  mimeType: string
  type: 'PHOTO' | 'VIDEO' | 'DRONE_FOOTAGE' | 'TIMELAPSE'
  category: 'PROJECT_PROGRESS' | 'EVENTS' | 'SANCTUARY_NATURE' | 'CONSTRUCTION' | 'COMMUNITY' | 'AERIAL'
  tags: string[]
  uploadedBy: { id: string; name: string }
  createdAt: string
}

const MEDIA_TYPES = [
  { value: 'PHOTO', label: 'Photos', icon: Image },
  { value: 'VIDEO', label: 'Videos', icon: Video },
  { value: 'DRONE_FOOTAGE', label: 'Drone Footage', icon: Plane },
  { value: 'TIMELAPSE', label: 'Timelapse', icon: Camera },
]

const CATEGORIES = [
  { value: 'PROJECT_PROGRESS', label: 'Project Progress' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'SANCTUARY_NATURE', label: 'Sanctuary Nature' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'AERIAL', label: 'Aerial' },
]

export default function MediaGalleryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    fetchMediaItems()
  }, [selectedType, selectedCategory, selectedTag])

  const fetchMediaItems = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType) params.append('type', selectedType)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedTag) params.append('tag', selectedTag)

      const response = await fetch(`/api/media?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setMediaItems(data)
        const tags = new Set<string>()
        data.forEach((item: MediaItem) => item.tags.forEach((tag: string) => tags.add(tag)))
        setAllTags(Array.from(tags))
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedType(null)
    setSelectedCategory(null)
    setSelectedTag(null)
  }

  const hasActiveFilters = selectedType || selectedCategory || selectedTag

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PHOTO': return <Image className="h-4 w-4" />
      case 'VIDEO': return <Video className="h-4 w-4" />
      case 'DRONE_FOOTAGE': return <Plane className="h-4 w-4" />
      case 'TIMELAPSE': return <Camera className="h-4 w-4" />
      default: return <Image className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">Media Gallery</h1>
          <p className="text-earth-brown-light mt-1">Browse and manage media files</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      </div>

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
              <h4 className="text-sm font-medium mb-2">Media Type</h4>
              <div className="flex flex-wrap gap-2">
                {MEDIA_TYPES.map((type) => {
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
              <h4 className="text-sm font-medium mb-2">Category</h4>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                      #{tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-earth-brown-light">Loading media...</p>
        </div>
      ) : mediaItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
            <h3 className="text-lg font-medium text-earth-brown-dark mb-2">No media found</h3>
            <p className="text-earth-brown-light mb-4">
              {hasActiveFilters
                ? 'No media items match your filters. Try adjusting your selection.'
                : 'Start by uploading your first media item.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item) => (
            <Link key={item.id} href={`/dashboard/media/${item.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="aspect-square relative bg-stone-warm">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                  {(item.type === 'VIDEO' || item.type === 'DRONE_FOOTAGE' || item.type === 'TIMELAPSE') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    {getTypeIcon(item.type)}
                    {item.type.replace('_', ' ')}
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-earth-brown-dark truncate">{item.filename}</p>
                  <p className="text-xs text-earth-brown-light mt-1">
                    {item.category.replace('_', ' ')} • {formatFileSize(item.filesize)}
                  </p>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-stone-warm px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs text-earth-brown-light">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showUploadModal && (
        <UploadMediaModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchMediaItems()
          }}
        />
      )}
    </div>
  )
}

function UploadMediaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    url: '',
    thumbnailUrl: '',
    filename: '',
    filesize: 1024000,
    mimeType: 'image/jpeg',
    type: 'PHOTO' as const,
    category: 'COMMUNITY' as const,
    tags: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload media')
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
            <CardTitle>Upload Media</CardTitle>
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
              <label className="block text-sm font-medium mb-1">Media URL *</label>
              <input
                type="url"
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://example.com/image.jpg"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Thumbnail URL *</label>
              <input
                type="url"
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://example.com/thumbnail.jpg"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Filename *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="my-photo.jpg"
                value={formData.filename}
                onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
              />
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
                  {MEDIA_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as typeof formData.category })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="nature, landscape, sunset"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
