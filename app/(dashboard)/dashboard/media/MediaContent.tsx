'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { Image, Video, Upload, Filter, X, Play, Camera, Plane, Music } from 'lucide-react'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl: string
  filename: string
  filesize: number
  mimeType: string
  type: 'PHOTO' | 'VIDEO' | 'AUDIO' | 'DRONE_FOOTAGE' | 'TIMELAPSE'
  category:
    | 'PROJECT_PROGRESS'
    | 'EVENTS'
    | 'SANCTUARY_NATURE'
    | 'CONSTRUCTION'
    | 'COMMUNITY'
    | 'AERIAL'
  tags: string[]
  uploadedBy: { id: string; name: string }
  createdAt: string
}

const MEDIA_TYPES = [
  { value: 'PHOTO', label: 'Photos', icon: Image },
  { value: 'VIDEO', label: 'Videos', icon: Video },
  { value: 'AUDIO', label: 'Audio', icon: Music },
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

export function MediaContent() {
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
      case 'PHOTO':
        return <Image className="h-4 w-4" />
      case 'VIDEO':
        return <Video className="h-4 w-4" />
      case 'DRONE_FOOTAGE':
        return <Plane className="h-4 w-4" />
      case 'AUDIO':
        return <Music className="h-4 w-4" />
      case 'TIMELAPSE':
        return <Camera className="h-4 w-4" />
      default:
        return <Image className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      <PageHeader path="media" />

      <div className="flex justify-end">
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-forest-600 hover:bg-forest-700 text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      </div>

      <Card className="border-sand-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display text-forest-800">
              <Filter className="h-5 w-5 text-forest-600" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-forest-600 hover:text-forest-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 font-body text-forest-700">Media Type</h4>
              <div className="flex flex-wrap gap-2">
                {MEDIA_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      variant={selectedType === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setSelectedType(selectedType === type.value ? null : type.value)
                      }
                      className={
                        selectedType === type.value
                          ? 'bg-forest-600 hover:bg-forest-700 text-white'
                          : 'border-forest-600 text-forest-700 hover:bg-forest-50'
                      }
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {type.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 font-body text-forest-700">Category</h4>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat.value ? null : cat.value)
                    }
                    className={
                      selectedCategory === cat.value
                        ? 'bg-forest-600 hover:bg-forest-700 text-white'
                        : 'border-forest-600 text-forest-700 hover:bg-forest-50'
                    }
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 font-body text-forest-700">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={
                        selectedTag === tag
                          ? 'bg-earth-500 hover:bg-earth-600 text-white'
                          : 'border-earth-400 text-earth-600 hover:bg-earth-50'
                      }
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
          <p className="text-forest-500 font-body">Loading media...</p>
        </div>
      ) : mediaItems.length === 0 ? (
        <Card className="border-sand-200">
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 mx-auto text-forest-400 mb-4" />
            <h3 className="text-lg font-medium font-display text-forest-800 mb-2">
              No media found
            </h3>
            <p className="text-forest-500 mb-4 font-body">
              {hasActiveFilters
                ? 'No media items match your filters. Try adjusting your selection.'
                : 'Start by uploading your first media item.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-forest-600 text-forest-700 hover:bg-forest-50"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item) => (
            <Link key={item.id} href={`/dashboard/media/${item.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group border-sand-200">
                <div className="aspect-square relative bg-sand-100">
                  {item.type === 'AUDIO' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-forest-700 to-forest-900">
                      <Music className="h-16 w-16 text-white/80 mb-2" />
                      <p className="text-white/70 text-xs font-body px-4 text-center truncate max-w-full">
                        {item.filename}
                      </p>
                    </div>
                  ) : (
                    <>
                      <NextImage
                        src={item.thumbnailUrl}
                        alt={item.filename}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                      {(item.type === 'VIDEO' ||
                        item.type === 'DRONE_FOOTAGE' ||
                        item.type === 'TIMELAPSE') && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                          <Play className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </>
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1 font-body">
                    {getTypeIcon(item.type)}
                    {item.type.replace('_', ' ')}
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium font-display text-forest-800 truncate">
                    {item.filename}
                  </p>
                  <p className="text-xs text-forest-500 mt-1 font-body">
                    {item.category.replace('_', ' ')} • {formatFileSize(item.filesize)}
                  </p>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-sand-100 px-2 py-0.5 rounded text-forest-600 font-body"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs text-forest-500 font-body">
                          +{item.tags.length - 3}
                        </span>
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

// TUS upload threshold: files over 50MB use TUS resumable upload
const TUS_THRESHOLD = 50 * 1024 * 1024

function UploadMediaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('COMMUNITY')
  const [tags, setTags] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState('')
  const [uploadPercent, setUploadPercent] = useState(0)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ''))
    if (selected.type.startsWith('audio/')) {
      setMediaType('AUDIO')
    } else if (selected.type.startsWith('video/')) {
      setMediaType('VIDEO')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const uploadViaTus = async (file: File, title: string): Promise<string> => {
    // Step 1: Get TUS credentials from our server
    setProgress('Preparing upload...')
    const sigRes = await fetch('/api/media/tus-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })

    if (!sigRes.ok) {
      const data = await sigRes.json()
      throw new Error(data.error || 'Failed to get upload credentials')
    }

    const { videoId, tusEndpoint, authSignature, authExpire, libraryId } = await sigRes.json()

    // Step 2: Upload via TUS with chunking and resume
    const { Upload } = await import('tus-js-client')

    return new Promise<string>((resolve, reject) => {
      const upload = new Upload(file, {
        endpoint: tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: authSignature,
          AuthorizationExpire: String(authExpire),
          VideoId: videoId,
          LibraryId: libraryId,
        },
        metadata: {
          filetype: file.type,
          title: title,
        },
        onError: (err) => {
          reject(new Error(`Upload failed: ${err.message}`))
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = Math.round((bytesUploaded / bytesTotal) * 100)
          setUploadPercent(pct)
          setProgress(`Uploading... ${pct}%`)
        },
        onSuccess: () => {
          setUploadPercent(100)
          setProgress('Upload complete! Encoding...')
          resolve(videoId)
        },
      })

      upload.start()
    })
  }

  const uploadViaPut = async (file: File): Promise<void> => {
    setProgress('Uploading to CDN...')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('category', category)
    formData.append('tags', tags)
    if (mediaType) formData.append('type', mediaType)

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Upload failed')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setSubmitting(true)
    setError('')
    setUploadPercent(0)

    try {
      if (file.size > TUS_THRESHOLD) {
        // Large file: TUS resumable upload (client → Bunny direct)
        const videoId = await uploadViaTus(file, title || file.name.replace(/\.[^.]+$/, ''))

        // Create DB record via our server
        setProgress('Saving metadata...')
        const formData = new FormData()
        formData.append('file', new Blob(), file.name) // empty blob, video already uploaded
        formData.append('title', title)
        formData.append('category', category)
        formData.append('tags', tags)
        formData.append('videoId', videoId)
        if (mediaType) formData.append('type', mediaType)

        const saveRes = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        })

        if (!saveRes.ok) {
          const data = await saveRes.json()
          throw new Error(data.error || 'Failed to save upload record')
        }
      } else {
        // Small file: server-side PUT (simpler, file goes through our server)
        await uploadViaPut(file)
      }

      setProgress('Upload complete!')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setProgress('')
      setUploadPercent(0)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto border-sand-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-forest-800">Upload Media</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-forest-600 hover:text-forest-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-body">{error}</div>
            )}

            {progress && (
              <div className="bg-forest-50 text-forest-700 p-3 rounded text-sm font-body">
                <p>{progress}</p>
                {uploadPercent > 0 && uploadPercent < 100 && (
                  <div className="mt-2 w-full bg-sand-200 rounded-full h-2">
                    <div
                      className="bg-forest-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 font-body text-forest-700">
                File *
              </label>
              <input
                type="file"
                required
                accept="video/*,audio/*"
                onChange={handleFileChange}
                disabled={submitting}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-forest-500 font-body file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-forest-100 file:text-forest-700 file:font-body file:text-sm"
              />
              {file && (
                <p className="text-xs text-forest-500 mt-1 font-body">
                  {file.type} &middot; {formatFileSize(file.size)}
                </p>
              )}
              <p className="text-xs text-forest-400 mt-1 font-body">
                Video and audio files up to 500MB. Uploaded to Bunny CDN for streaming.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 font-body text-forest-700">
                Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-forest-500 font-body"
                placeholder="Video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-body text-forest-700">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-forest-500 font-body"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Auto-detect</option>
                  {MEDIA_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body text-forest-700">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-forest-500 font-body"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 font-body text-forest-700">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-forest-500 font-body"
                placeholder="nature, landscape, sunset"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 border-forest-600 text-forest-700 hover:bg-forest-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !file}
                className="flex-1 bg-forest-600 hover:bg-forest-700 text-white"
              >
                {submitting ? 'Uploading...' : 'Upload to CDN'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
