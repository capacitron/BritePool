'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Calendar, Pin, MessageSquare } from 'lucide-react'

interface Author {
  id: string
  name: string
  role: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Reply {
  id: string
  content: string
  author: Author
  createdAt: string
  updatedAt: string
}

interface Post {
  id: string
  title: string | null
  content: string
  author: Author
  category: Category | null
  isPinned: boolean
  replies: Reply[]
  createdAt: string
  updatedAt: string
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [postId])

  async function fetchPost() {
    try {
      const res = await fetch(`/api/forums/posts?postId=${postId}`)
      if (!res.ok) {
        router.push('/dashboard/forums')
        return
      }
      const data = await res.json()
      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/forums/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentId: postId
        })
      })

      if (res.ok) {
        setReplyContent('')
        fetchPost()
      }
    } catch (error) {
      console.error('Error creating reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'WEB_STEWARD':
        return 'bg-terracotta text-white'
      case 'BOARD_CHAIR':
        return 'bg-sage text-white'
      case 'COMMITTEE_LEADER':
        return 'bg-sky-soft text-white'
      default:
        return 'bg-stone-warm text-earth-dark'
    }
  }

  function formatRole(role: string) {
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-stone-warm rounded animate-pulse w-48" />
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="h-8 bg-stone-warm rounded animate-pulse w-3/4" />
              <div className="h-24 bg-stone-warm rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={post.category ? `/dashboard/forums/${post.category.slug}` : '/dashboard/forums'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          {post.category && (
            <Link 
              href={`/dashboard/forums/${post.category.slug}`}
              className="text-sm text-earth-brown hover:underline"
            >
              {post.category.name}
            </Link>
          )}
          <h1 className="text-2xl font-serif font-bold text-earth-brown-dark flex items-center gap-2">
            {post.isPinned && <Pin className="h-5 w-5 text-terracotta" />}
            {post.title}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-stone">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-earth-light flex items-center justify-center">
                <User className="h-5 w-5 text-earth-brown" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-earth-brown-dark">
                    {post.author.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(post.author.role)}`}>
                    {formatRole(post.author.role)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-earth-brown-light">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-earth max-w-none">
            <p className="whitespace-pre-wrap text-earth-dark">{post.content}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-earth-brown-dark flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Replies ({post.replies.length})
        </h2>

        {post.replies.map((reply) => (
          <Card key={reply.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-earth-light flex items-center justify-center">
                  <User className="h-4 w-4 text-earth-brown" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-earth-brown-dark text-sm">
                      {reply.author.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(reply.author.role)}`}>
                      {formatRole(reply.author.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-earth-brown-light">
                    <Calendar className="h-3 w-3" />
                    {formatDate(reply.createdAt)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-earth-dark">{reply.content}</p>
            </CardContent>
          </Card>
        ))}

        {post.replies.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-earth-brown-light">
                No replies yet. Be the first to respond!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-medium text-earth-brown-dark">Write a Reply</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReply} className="space-y-4">
            <textarea
              className="w-full min-h-[120px] p-3 rounded-lg border border-stone bg-white text-earth-dark focus:outline-none focus:ring-2 focus:ring-earth-brown"
              placeholder="Write your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Reply'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
