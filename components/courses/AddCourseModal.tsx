'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, BookOpen, Loader2 } from 'lucide-react'
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
  { value: 'REVIEW', label: 'Under Review' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
]

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function AddCourseModal({ open, onClose, onSuccess }: AddCourseModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [category, setCategory] = useState('EMPOWERMENT')
  const [status, setStatus] = useState('DRAFT')
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleTitleChange(value: string) {
    setTitle(value)
    setSlug(toKebabCase(value))
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setSlug('')
    setThumbnail('')
    setCategory('EMPOWERMENT')
    setStatus('DRAFT')
    setIsPublished(false)
    setError(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          slug: slug.trim() || toKebabCase(title),
          thumbnail: thumbnail.trim() || null,
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
      onClose()
      onSuccess?.()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-forest-50 border-b border-forest-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-forest-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-body">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter course title"
              disabled={loading}
              required
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
              placeholder="auto-generated-from-title"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">URL-friendly identifier (auto-generated from title)</p>
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
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
              disabled={loading}
            />
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
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="font-body">
                Category
              </Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
                disabled={loading}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="font-body">
                Status
              </Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
                disabled={loading}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-gray-300 rounded"
              disabled={loading}
            />
            <Label htmlFor="isPublished" className="font-body cursor-pointer">
              Publish immediately
            </Label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
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
              className="flex-1 bg-forest-600 hover:bg-forest-700 text-white"
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
