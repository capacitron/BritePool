'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Megaphone,
  Plus,
  ChevronLeft,
  Edit,
  Trash2,
  Pin,
  X,
} from 'lucide-react'
import Link from 'next/link'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'URGENT' | 'IMPORTANT' | 'INFO'
  targetRoles: string[]
  isPinned: boolean
  publishedAt: string
  expiresAt: string | null
  createdAt: string
}

const priorities = ['URGENT', 'IMPORTANT', 'INFO'] as const
const roles = [
  'WEB_STEWARD',
  'BOARD_CHAIR',
  'COMMITTEE_LEADER',
  'CONTENT_MODERATOR',
  'SUPPORT_STAFF',
  'STEWARD',
  'PARTNER',
  'RESIDENT',
]

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formPriority, setFormPriority] = useState<typeof priorities[number]>('INFO')
  const [formTargetRoles, setFormTargetRoles] = useState<string[]>([])
  const [formIsPinned, setFormIsPinned] = useState(false)
  const [formExpiresAt, setFormExpiresAt] = useState('')

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/announcements?includeExpired=true')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data.announcements)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormTitle('')
    setFormContent('')
    setFormPriority('INFO')
    setFormTargetRoles([])
    setFormIsPinned(false)
    setFormExpiresAt('')
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(announcement: Announcement) {
    setFormTitle(announcement.title)
    setFormContent(announcement.content)
    setFormPriority(announcement.priority)
    setFormTargetRoles(announcement.targetRoles)
    setFormIsPinned(announcement.isPinned)
    setFormExpiresAt(announcement.expiresAt ? announcement.expiresAt.slice(0, 16) : '')
    setEditingId(announcement.id)
    setShowForm(true)
  }

  function toggleTargetRole(role: string) {
    setFormTargetRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const data = {
      title: formTitle,
      content: formContent,
      priority: formPriority,
      targetRoles: formTargetRoles,
      isPinned: formIsPinned,
      expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/announcements/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          fetchAnnouncements()
          resetForm()
        }
      } else {
        const res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          fetchAnnouncements()
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return
    }
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchAnnouncements()
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
    }
  }

  async function togglePin(announcement: Announcement) {
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !announcement.isPinned }),
      })
      if (res.ok) {
        fetchAnnouncements()
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString()
  }

  function getPriorityBadgeClass(priority: string) {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'IMPORTANT':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            Announcements
          </h1>
          <p className="text-earth-brown-light mt-1">
            Create and manage platform announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/admin">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Announcement' : 'Create Announcement'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update the announcement details' : 'Create a new announcement for the platform'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 border border-stone rounded-lg min-h-[120px]"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as typeof priorities[number])}
                    className="w-full px-3 py-2 border border-stone rounded-lg"
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="expiresAt">Expires At (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">Pin to top</span>
                  </label>
                </div>
              </div>

              <div>
                <Label>Target Audience (leave empty for all users)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleTargetRole(role)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        formTargetRoles.includes(role)
                          ? 'bg-earth-brown text-white'
                          : 'bg-stone-warm text-earth-dark hover:bg-stone'
                      }`}
                    >
                      {role.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update Announcement' : 'Create Announcement'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            All Announcements
          </CardTitle>
          <CardDescription>
            {announcements.length} total announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-earth-brown-light">Loading...</p>
          ) : announcements.length === 0 ? (
            <p className="text-center py-8 text-earth-brown-light">No announcements yet</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border ${
                    announcement.isPinned ? 'border-earth-brown bg-amber-50' : 'border-stone bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {announcement.isPinned && (
                          <Pin className="h-4 w-4 text-earth-brown" />
                        )}
                        <h3 className="font-medium text-earth-dark">{announcement.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeClass(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                      </div>
                      <p className="text-sm text-earth-brown-light mb-2 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-earth-brown-light">
                        <span>Published: {formatDate(announcement.publishedAt)}</span>
                        {announcement.expiresAt && (
                          <span>Expires: {formatDate(announcement.expiresAt)}</span>
                        )}
                        {announcement.targetRoles.length > 0 && (
                          <span>Target: {announcement.targetRoles.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePin(announcement)}
                        title={announcement.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className={`h-4 w-4 ${announcement.isPinned ? 'text-earth-brown' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
