'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MessageSquare, Plus, Pin, Clock, MessageCircle, X, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/PageHeader'
import { cn } from '@/lib/utils'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { stripHtml } from '@/lib/sanitize'

interface ForumPost {
  id: string
  title: string | null
  content: string
  isPinned: boolean
  status: string
  createdAt: string
  author: { id: string; name: string; role: string }
  category: { id: string; name: string; slug: string } | null
  replyCount: number
  isAuthor: boolean
}

interface ForumCategory {
  id: string
  name: string
  slug: string
  description: string | null
  postCount: number
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getRoleBadge(role: string) {
  const labels: Record<string, string> = {
    WEB_STEWARD: 'Admin',
    BOARD_CHAIR: 'Chair',
    COMMITTEE_LEADER: 'Leader',
    CONTENT_MODERATOR: 'Moderator',
    STEWARD: 'Member',
    PARTNER: 'Partner',
    RESIDENT: 'Resident',
  }
  return labels[role] || role.replace(/_/g, ' ')
}

export default function ForumsPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewPostModal, setShowNewPostModal] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.set('categorySlug', selectedCategory)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/forums?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setPosts(json.data || [])
    } catch {
      setError('Failed to load forum posts')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/forums/categories')
      if (!res.ok) return
      const json = await res.json()
      setCategories(json.data || [])
    } catch {
      // Non-critical
    }
  }

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      setUserRole(data?.user?.role || '')
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchUserRole()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const isAdmin = ADMIN_ROLES.includes(userRole)

  return (
    <div className="space-y-6">
      <PageHeader path="forums" />

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
          />
        </div>
        <Button
          onClick={() => setShowNewPostModal(true)}
          className="bg-forest-600 hover:bg-forest-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Discussion
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedCategory === null
              ? 'bg-forest-600 text-white'
              : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedCategory === cat.slug
                ? 'bg-forest-600 text-white'
                : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
            )}
          >
            {cat.name}
            <span className="ml-1.5 text-xs opacity-70">({cat.postCount})</span>
          </button>
        ))}
      </div>

      {/* Post listing */}
      {loading ? (
        <div className="text-center py-12 text-forest-500">Loading discussions...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : posts.length === 0 ? (
        <Card className="border-sand-200">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-forest-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-forest-700 mb-2">No Discussions Yet</h3>
            <p className="text-forest-500 mb-4">
              {selectedCategory || searchQuery
                ? 'No discussions match your filters. Try adjusting your search.'
                : 'Be the first to start a conversation in the community.'}
            </p>
            <Button
              onClick={() => setShowNewPostModal(true)}
              className="bg-forest-600 hover:bg-forest-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start a Discussion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/dashboard/forums/${post.id}`}>
              <Card className="border-sand-200 hover:border-forest-300 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="hidden sm:flex h-10 w-10 rounded-lg bg-forest-50 items-center justify-center flex-shrink-0 mt-0.5">
                      {post.isPinned ? (
                        <Pin className="h-5 w-5 text-forest-600" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-forest-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {post.isPinned && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">Pinned</Badge>
                        )}
                        <h3 className="font-medium text-forest-800 truncate">
                          {post.title || 'Untitled'}
                        </h3>
                        {post.status === 'PENDING' && post.isAuthor && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            Pending Review
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-forest-600 line-clamp-2 mb-2">
                        {stripHtml(post.content)}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-forest-500 flex-wrap">
                        <span className="font-medium text-forest-700">{post.author.name}</span>
                        {isAdmin && (
                          <span className="text-forest-400">{getRoleBadge(post.author.role)}</span>
                        )}
                        {post.category && (
                          <Badge variant="outline" className="text-xs py-0 px-1.5">
                            {post.category.name}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* New Post Modal */}
      {showNewPostModal && (
        <NewPostModal
          categories={categories}
          onClose={() => setShowNewPostModal(false)}
          onSuccess={() => {
            setShowNewPostModal(false)
            fetchPosts()
          }}
        />
      )}
    </div>
  )
}

function NewPostModal({
  categories,
  onClose,
  onSuccess,
}: {
  categories: ForumCategory[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: categories[0]?.id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to create post')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create discussion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Start a Discussion</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-sand-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                placeholder="What would you like to discuss?"
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Content *</label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Share your thoughts..."
                maxLength={10000}
                variant="full"
              />
            </div>

            <p className="text-xs text-forest-500 bg-sand-50 p-3 rounded-lg">
              Your post will be reviewed by a moderator before it becomes visible to all members.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={loading}
              >
                {loading ? 'Posting...' : 'Post Discussion'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
