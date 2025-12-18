'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Trash2, Edit, X, Save, Image, Video, Camera, Plane, Calendar, User, FileType, HardDrive } from 'lucide-react'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl: string
  mediumUrl: string | null
  filename: string
  filesize: number
  mimeType: string
  type: 'PHOTO' | 'VIDEO' | 'DRONE_FOOTAGE' | 'TIMELAPSE'
  category: 'PROJECT_PROGRESS' | 'EVENTS' | 'SANCTUARY_NATURE' | 'CONSTRUCTION' | 'COMMUNITY' | 'AERIAL'
  tags: string[]
  uploadedBy: { id: string; name: string }
  createdAt: string
}

interface MediaDetailClientProps {
  mediaItem: MediaItem
  userId: string
  userRole: string
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR']

const CATEGORIES = [
  { value: 'PROJECT_PROGRESS', label: 'Project Progress' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'SANCTUARY_NATURE', label: 'Sanctuary Nature' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'AERIAL', label: 'Aerial' },
]

export function MediaDetailClient({ mediaItem, userId, userRole }: MediaDetailClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editData, setEditData] = useState({
    filename: mediaItem.filename,
    category: mediaItem.category,
    tags: mediaItem.tags.join(', '),
  })
  const [saving, setSaving] = useState(false)

  const isOwner = mediaItem.uploadedBy.id === userId
  const isAdmin = ADMIN_ROLES.includes(userRole)
  const canModify = isOwner || isAdmin

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PHOTO': return <Image className="h-5 w-5" />
      case 'VIDEO': return <Video className="h-5 w-5" />
      case 'DRONE_FOOTAGE': return <Plane className="h-5 w-5" />
      case 'TIMELAPSE': return <Camera className="h-5 w-5" />
      default: return <Image className="h-5 w-5" />
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/media/${mediaItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: editData.filename,
          category: editData.category,
          tags: editData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      if (response.ok) {
        router.refresh()
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/media/${mediaItem.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/media')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const isVideo = mediaItem.type === 'VIDEO' || mediaItem.type === 'DRONE_FOOTAGE' || mediaItem.type === 'TIMELAPSE'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/media">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Gallery
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="bg-black flex items-center justify-center min-h-[400px]">
              {isVideo ? (
                <video
                  src={mediaItem.url}
                  controls
                  poster={mediaItem.thumbnailUrl}
                  className="max-w-full max-h-[600px]"
                />
              ) : (
                <img
                  src={mediaItem.url}
                  alt={mediaItem.filename}
                  className="max-w-full max-h-[600px] object-contain"
                />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Details</CardTitle>
                {canModify && !isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Filename</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={editData.filename}
                      onChange={(e) => setEditData({ ...editData, filename: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={editData.category}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value as typeof editData.category })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={editData.tags}
                      onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <FileType className="h-5 w-5 text-earth-brown-light mt-0.5" />
                    <div>
                      <p className="text-sm text-earth-brown-light">Filename</p>
                      <p className="font-medium">{mediaItem.filename}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {getTypeIcon(mediaItem.type)}
                    <div>
                      <p className="text-sm text-earth-brown-light">Type</p>
                      <p className="font-medium">{mediaItem.type.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <HardDrive className="h-5 w-5 text-earth-brown-light mt-0.5" />
                    <div>
                      <p className="text-sm text-earth-brown-light">Size</p>
                      <p className="font-medium">{formatFileSize(mediaItem.filesize)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-earth-brown-light mt-0.5" />
                    <div>
                      <p className="text-sm text-earth-brown-light">Uploaded by</p>
                      <p className="font-medium">{mediaItem.uploadedBy.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-earth-brown-light mt-0.5" />
                    <div>
                      <p className="text-sm text-earth-brown-light">Uploaded</p>
                      <p className="font-medium">{formatDate(mediaItem.createdAt)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-earth-brown-light mb-1">Category</p>
                    <span className="inline-block bg-stone-warm px-3 py-1 rounded-full text-sm">
                      {mediaItem.category.replace('_', ' ')}
                    </span>
                  </div>

                  {mediaItem.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-earth-brown-light mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {mediaItem.tags.map((tag) => (
                          <span key={tag} className="bg-earth-brown/10 px-2 py-1 rounded text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href={mediaItem.url} download={mediaItem.filename} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </a>

              {canModify && (
                <>
                  {isDeleting ? (
                    <div className="space-y-2">
                      <p className="text-sm text-center text-red-600">Delete this item?</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsDeleting(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete} className="flex-1">
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="destructive" className="w-full" onClick={() => setIsDeleting(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
