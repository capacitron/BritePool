'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface AddCourseModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CATEGORIES = [
  { value: 'EMPOWERMENT', label: 'Empowerment' },
  { value: 'LEADERSHIP', label: 'Leadership' },
  { value: 'WELLNESS', label: 'Wellness' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'STEWARDSHIP', label: 'Stewardship' },
  { value: 'OTHER', label: 'Other' },
]

const STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
]

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function AddCourseModal({ open, onClose, onSuccess }: AddCourseModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [category, setCategory] = useState('OTHER')
  const [status, setStatus] = useState('DRAFT')
  const [isPublished, setIsPublished] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Auto-generate slug from title
  useEffect(() => {
    setSlug(toKebabCase(title))
  }, [title])

  function resetForm() {
    setTitle('')
    setDescription('')
    setSlug('')
    setThumbnail('')
    setCategory('OTHER')
    setStatus('DRAFT')
    setIsPublished(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          slug,
          thumbnail: thumbnail || undefined,
          category,
          status,
          isPublished,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create course')
        return
      }

      toast.success('Course created successfully!')
      resetForm()
      onSuccess?.()
      onClose()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-forest-50 border-b border-forest-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-display font-semibold text-forest-800">
              Add New Course
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-body">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter course title"
              className="focus:ring-2 focus:ring-forest-500"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-body">
              Description
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter course description"
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-50"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="font-body">
              Slug
            </Label>
            <Input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="course-url-slug"
              className="focus:ring-2 focus:ring-forest-500"
              disabled={loading}
            />
            <p className="text-xs text-forest-500 font-body">
              Auto-generated from title. You can customize it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail" className="font-body">
              Thumbnail URL
            </Label>
            <Input
              id="thumbnail"
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="focus:ring-2 focus:ring-forest-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="font-body">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory} disabled={loading}>
                <SelectTrigger className="focus:ring-2 focus:ring-forest-500">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="font-body">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus} disabled={loading}>
                <SelectTrigger className="focus:ring-2 focus:ring-forest-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
              disabled={loading}
            />
            <Label htmlFor="isPublished" className="font-body cursor-pointer">
              Publish course immediately
            </Label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-forest-600 text-white hover:bg-forest-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
