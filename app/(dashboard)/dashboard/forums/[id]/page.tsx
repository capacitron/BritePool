'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pin, Clock, MessageCircle, Send, Pencil, Trash2, X, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { ForumContent } from '@/components/forums/ForumContent'
import { isHtmlEmpty } from '@/lib/sanitize'

interface Reply {
  id: string
  content: string
  status: string
  createdAt: string
  updatedAt: string
  author: { id: string; name: string; role: string }
  isAuthor: boolean
}

interface PostDetail {
  id: string
  title: string | null
  content: string
  isPinned: boolean
  status: string
  createdAt: string
  updatedAt: string
  author: { id: string; name: string; role: string }
  category: { id: string; name: string; slug: string } | null
  isAuthor: boolean
  replies: Reply[]
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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
  const colors: Record<string, string> = {
    WEB_STEWARD: 'bg-purple-100 text-purple-800',
    BOARD_CHAIR: 'bg-blue-100 text-blue-800',
    COMMITTEE_LEADER: 'bg-green-100 text-green-800',
    CONTENT_MODERATOR: 'bg-yellow-100 text-yellow-800',
  }
  return {
    label: labels[role] || role.replace(/_/g, ' '),
    color: colors[role] || 'bg-sand-100 text-forest-700',
  }
}

export default function ForumPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState('')

  // Reply state
  const [replyContent, setReplyContent] = useState('')
  const [replyKey, setReplyKey] = useState(0)
  const [submittingReply, setSubmittingReply] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')

  const fetchPost = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forums/${postId}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Post not found')
          return
        }
        throw new Error('Failed to fetch')
      }
      const json = await res.json()
      setPost(json.data)
    } catch {
      setError('Failed to load discussion')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchPost()
    const fetchRole = async () => {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        setUserRole(data?.user?.role || '')
      } catch {
        // Ignore
      }
    }
    fetchRole()
  }, [fetchPost])

  const isAdmin = ADMIN_ROLES.includes(userRole)

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isHtmlEmpty(replyContent)) return

    setSubmittingReply(true)
    try {
      const res = await fetch(`/api/forums/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to post reply')
      }

      setReplyContent('')
      setReplyKey((k) => k + 1)
      fetchPost()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleEdit = async (id: string, isTopLevel: boolean) => {
    try {
      const body: Record<string, string> = { content: editContent }
      if (isTopLevel && editTitle) body.title = editTitle

      const res = await fetch(`/api/forums/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to edit')
      }

      setEditingId(null)
      fetchPost()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to edit')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return

    try {
      const res = await fetch(`/api/forums/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to delete')
      }

      // If deleting the main post, go back to forums
      if (id === postId) {
        router.push('/dashboard/forums')
      } else {
        fetchPost()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const startEdit = (id: string, content: string, title?: string | null) => {
    setEditingId(id)
    setEditContent(content)
    setEditTitle(title || '')
  }

  if (loading) {
    return <div className="text-center py-12 text-forest-500">Loading discussion...</div>
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/forums"
          className="inline-flex items-center text-sm text-forest-600 hover:text-forest-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Forums
        </Link>
        <div className="text-center py-12 text-red-500">{error || 'Post not found'}</div>
      </div>
    )
  }

  const postRoleBadge = getRoleBadge(post.author.role)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/dashboard/forums"
        className="inline-flex items-center text-sm text-forest-600 hover:text-forest-800"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Forums
      </Link>

      {/* Main post */}
      <Card className="border-sand-200">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {post.isPinned && (
                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                {post.category && (
                  <Badge variant="outline" className="text-xs">
                    {post.category.name}
                  </Badge>
                )}
                {post.status === 'PENDING' && post.isAuthor && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending Review</Badge>
                )}
              </div>

              {editingId === post.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xl font-bold text-forest-900 px-3 py-2 border border-sand-300 rounded-lg mb-2"
                />
              ) : (
                <h1 className="text-xl font-bold text-forest-900">{post.title || 'Untitled'}</h1>
              )}
            </div>

            {/* Actions */}
            {(post.isAuthor || isAdmin) && editingId !== post.id && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(post.id, post.content, post.title)}
                  className="p-1.5 text-forest-400 hover:text-forest-600 hover:bg-sand-100 rounded"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Author + date */}
          <div className="flex items-center gap-3 mb-4 text-sm">
            <div className="h-8 w-8 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-medium text-sm">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-medium text-forest-800">{post.author.name}</span>
              <Badge className={cn('ml-2 text-xs', postRoleBadge.color)}>
                {postRoleBadge.label}
              </Badge>
            </div>
            <span className="flex items-center gap-1 text-forest-500 text-xs">
              <Clock className="h-3 w-3" />
              {formatDate(post.createdAt)}
            </span>
          </div>

          {/* Content */}
          {editingId === post.id ? (
            <div className="space-y-3">
              <RichTextEditor
                content={editContent}
                onChange={(html) => setEditContent(html)}
                variant="full"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-forest-600 hover:bg-forest-700 text-white"
                  onClick={() => handleEdit(post.id, true)}
                >
                  <Check className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <ForumContent content={post.content} className="text-forest-700 leading-relaxed" />
          )}
        </CardContent>
      </Card>

      {/* Replies section */}
      <div>
        <h2 className="text-sm font-medium text-forest-700 mb-4 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {post.replies.length} {post.replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        <div className="space-y-3">
          {post.replies.map((reply) => {
            const replyRoleBadge = getRoleBadge(reply.author.role)

            return (
              <Card key={reply.id} className="border-sand-100">
                <CardContent className="p-4">
                  {/* Reply header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-7 w-7 rounded-full bg-forest-50 flex items-center justify-center text-forest-600 font-medium text-xs">
                        {reply.author.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-forest-800">{reply.author.name}</span>
                      <Badge className={cn('text-xs', replyRoleBadge.color)}>
                        {replyRoleBadge.label}
                      </Badge>
                      <span className="text-xs text-forest-500">{formatDate(reply.createdAt)}</span>
                      {reply.status === 'PENDING' && reply.isAuthor && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>
                      )}
                    </div>

                    {(reply.isAuthor || isAdmin) && editingId !== reply.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(reply.id, reply.content)}
                          className="p-1 text-forest-400 hover:text-forest-600 hover:bg-sand-100 rounded"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(reply.id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reply content */}
                  {editingId === reply.id ? (
                    <div className="space-y-2">
                      <RichTextEditor
                        content={editContent}
                        onChange={(html) => setEditContent(html)}
                        variant="compact"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          <X className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-forest-600 hover:bg-forest-700 text-white"
                          onClick={() => handleEdit(reply.id, false)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ForumContent content={reply.content} className="text-sm text-forest-700" />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Reply form */}
      <Card className="border-sand-200">
        <CardContent className="p-4">
          <form onSubmit={handleReply} className="space-y-3">
            <label className="block text-sm font-medium text-forest-700">Write a Reply</label>
            <RichTextEditor
              key={replyKey}
              content=""
              onChange={(html) => setReplyContent(html)}
              placeholder="Share your thoughts..."
              maxLength={10000}
              variant="compact"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-forest-400">
                Replies are reviewed by a moderator before becoming visible.
              </p>
              <Button
                type="submit"
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={submittingReply || isHtmlEmpty(replyContent)}
              >
                <Send className="h-4 w-4 mr-2" />
                {submittingReply ? 'Posting...' : 'Reply'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
