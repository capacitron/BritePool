'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, MessageSquare, Pin, User, Calendar } from 'lucide-react'

interface Author {
  id: string
  name: string
  role: string
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

interface Post {
  id: string
  title: string | null
  content: string
  author: Author
  category: Category | null
  isPinned: boolean
  replyCount: number
  createdAt: string
  updatedAt: string
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categorySlug = params.category as string

  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCategoryAndPosts()
  }, [categorySlug])

  async function fetchCategoryAndPosts() {
    try {
      const catRes = await fetch('/api/forums/categories')
      const categories = await catRes.json()
      const foundCategory = categories.find((c: Category) => c.slug === categorySlug)
      
      if (!foundCategory) {
        router.push('/dashboard/forums')
        return
      }
      
      setCategory(foundCategory)

      const postsRes = await fetch(`/api/forums/posts?categoryId=${foundCategory.id}&parentId=null`)
      const postsData = await postsRes.json()
      setPosts(postsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim() || !category) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/forums/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          categoryId: category.id
        })
      })

      if (res.ok) {
        setNewTitle('')
        setNewContent('')
        setShowNewTopic(false)
        fetchCategoryAndPosts()
      }
    } catch (error) {
      console.error('Error creating topic:', error)
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-stone-warm rounded animate-pulse w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="h-6 bg-stone-warm rounded animate-pulse w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/forums">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            {category?.name}
          </h1>
          {category?.description && (
            <p className="text-earth-brown-light mt-1">{category.description}</p>
          )}
        </div>
        <Button onClick={() => setShowNewTopic(!showNewTopic)}>
          <Plus className="h-4 w-4 mr-2" />
          New Topic
        </Button>
      </div>

      {showNewTopic && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <Input
                  placeholder="Topic title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <textarea
                  className="w-full min-h-[150px] p-3 rounded-lg border border-stone bg-white text-earth-dark focus:outline-none focus:ring-2 focus:ring-earth-brown"
                  placeholder="Write your post content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowNewTopic(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Topic'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <Link key={post.id} href={`/dashboard/forums/posts/${post.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {post.isPinned && (
                        <Pin className="h-4 w-4 text-terracotta" />
                      )}
                      <h3 className="text-lg font-medium text-earth-brown-dark hover:text-earth-brown">
                        {post.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-earth-brown-light">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {posts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
              <h3 className="text-lg font-medium text-earth-brown-dark">No topics yet</h3>
              <p className="text-earth-brown-light mt-1">
                Be the first to start a discussion in this category!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
