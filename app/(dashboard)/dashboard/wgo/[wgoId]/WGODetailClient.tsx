'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Pencil,
  Trash2,
  MessageSquare,
  UserPlus,
  UserMinus,
  Pin,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Link2,
  ExternalLink,
  Save,
  Video,
  Copy,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// WGO Category and Status labels
const WGO_CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE: 'Real Estate',
  BUSINESS: 'Business',
  INVESTMENT: 'Investment',
  EDUCATION: 'Education',
  COMMUNITY: 'Community',
}

const WGO_CATEGORY_COLORS: Record<string, string> = {
  REAL_ESTATE: 'bg-blue-100 text-blue-800',
  BUSINESS: 'bg-purple-100 text-purple-800',
  INVESTMENT: 'bg-green-100 text-green-800',
  EDUCATION: 'bg-yellow-100 text-yellow-800',
  COMMUNITY: 'bg-pink-100 text-pink-800',
}

const WGO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const WGO_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PAUSED: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const WGO_ROLE_LABELS: Record<string, string> = {
  LEADER: 'Leader',
  COORDINATOR: 'Coordinator',
  PARTICIPANT: 'Participant',
  OBSERVER: 'Observer',
}

const WGO_ROLE_COLORS: Record<string, string> = {
  LEADER: 'bg-purple-100 text-purple-800',
  COORDINATOR: 'bg-blue-100 text-blue-800',
  PARTICIPANT: 'bg-green-100 text-green-800',
  OBSERVER: 'bg-gray-100 text-gray-800',
}

interface Involvement {
  id: string
  userId: string
  role: string
  status: string
  affiliateLink: string | null
  joinedAt: string
}

interface ForumPost {
  id: string
  content: string
  isPinned: boolean
  authorId: string
  createdAt: string
  author?: {
    id: string
    name: string
    role: string
  } | null
  isAuthor?: boolean
}

interface WGO {
  id: string
  title: string
  description: string
  category: string
  status: string
  targetAmount: number | null
  currentAmount: number
  startDate: string | null
  endDate: string | null
  affiliateLink: string | null
  credibilityScore: number | null
  presentationDays: string | null
  shortDescription: string | null
  wgoType: string | null
  minimumInvestment: number | null
  creatorId: string
  createdAt: string
  updatedAt: string
  involvements: Involvement[]
  forumPosts: ForumPost[]
  involvementCount: number
  forumPostCount: number
  isInvolved: boolean
  userInvolvement: Involvement | null
  isCreator: boolean
  isLeader: boolean
  isCoordinator: boolean
  referrerAffiliateLink: string | null
  referrerName: string | null
}

interface RelatedEvent {
  id: string
  title: string
  type: string
  startTime: string
  endTime: string
  location: string | null
  virtualLink: string | null
}

interface WGODetailClientProps {
  wgoId: string
  userId: string
  userRole: string
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

export function WGODetailClient({ wgoId, userId, userRole }: WGODetailClientProps) {
  const router = useRouter()
  const [wgo, setWgo] = useState<WGO | null>(null)
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [postingLoading, setPostingLoading] = useState(false)
  const [affiliateLink, setAffiliateLink] = useState('')
  const [affiliateSaving, setAffiliateSaving] = useState(false)
  const [affiliateSaved, setAffiliateSaved] = useState(false)
  const [relatedEvents, setRelatedEvents] = useState<RelatedEvent[]>([])
  const [duplicating, setDuplicating] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [eventsPage, setEventsPage] = useState(1)

  const isAdmin = ADMIN_ROLES.includes(userRole)

  const fetchWGO = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/wgo/${wgoId}`)

      if (!res.ok) {
        if (res.status === 404) {
          setError('Wealth Generation Opportunity (WGO) not found')
        } else if (res.status === 401) {
          setError('You must be logged in to view this page')
        } else {
          const data = await res.json()
          setError(data.error || 'Failed to load WGO details')
        }
        return
      }

      const data = await res.json()
      setWgo(data)
      setForumPosts(data.forumPosts || [])
      if (data.userInvolvement?.affiliateLink) {
        setAffiliateLink(data.userInvolvement.affiliateLink)
      }
    } catch (err) {
      console.error('Error fetching WGO:', err)
      setError('Failed to load WGO details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [wgoId])

  const fetchForumPosts = useCallback(async () => {
    if (!wgo?.isInvolved && !isAdmin) return

    try {
      const res = await fetch(`/api/wgo/${wgoId}/forum`)
      if (res.ok) {
        const data = await res.json()
        setForumPosts(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching forum posts:', err)
    }
  }, [wgoId, wgo?.isInvolved, isAdmin])

  useEffect(() => {
    fetchWGO()
  }, [fetchWGO])

  useEffect(() => {
    if (wgo?.isInvolved || isAdmin) {
      fetchForumPosts()
    }
  }, [wgo?.isInvolved, isAdmin, fetchForumPosts])

  // Fetch upcoming events that match this WGO's title
  useEffect(() => {
    if (!wgo?.title) return

    async function fetchRelatedEvents() {
      try {
        const res = await fetch('/api/events?upcoming=true')
        if (res.ok) {
          const data = await res.json()
          const events = Array.isArray(data) ? data : data.data || []
          const titleWords = wgo!.title
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 2)
          const matched = events.filter((evt: RelatedEvent) => {
            const evtTitle = evt.title.toLowerCase()
            return titleWords.some((word) => evtTitle.includes(word))
          })
          setRelatedEvents(matched)
        }
      } catch (err) {
        console.error('Error fetching related events:', err)
      }
    }

    fetchRelatedEvents()
  }, [wgo?.title])

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/wgo/involvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wgoId, role: 'PARTICIPANT' }),
      })

      if (res.ok) {
        await fetchWGO()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to join')
      }
    } catch (err) {
      console.error('Error joining WGO:', err)
      alert('Failed to join. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this WGO?')) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/wgo/involvement', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wgoId }),
      })

      if (res.ok) {
        await fetchWGO()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to leave')
      }
    } catch (err) {
      console.error('Error leaving WGO:', err)
      alert('Failed to leave. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/wgo/${wgoId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/wgo')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete')
      }
    } catch (err) {
      console.error('Error deleting WGO:', err)
      alert('Failed to delete. Please try again.')
    } finally {
      setActionLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSaveAffiliateLink = async () => {
    setAffiliateSaving(true)
    setAffiliateSaved(false)
    try {
      const res = await fetch('/api/wgo/involvement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wgoId,
          affiliateLink: affiliateLink.trim() || null,
        }),
      })

      if (res.ok) {
        setAffiliateSaved(true)
        setTimeout(() => setAffiliateSaved(false), 3000)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save affiliate link')
      }
    } catch (err) {
      console.error('Error saving affiliate link:', err)
      alert('Failed to save affiliate link')
    } finally {
      setAffiliateSaving(false)
    }
  }

  const handleDuplicate = async () => {
    if (!wgo) return
    setDuplicating(true)
    try {
      const payload: Record<string, unknown> = {
        title: `${wgo.title} (Copy)`,
        description: wgo.description,
        category: wgo.category,
        status: 'DRAFT',
        targetAmount: wgo.targetAmount,
        minimumInvestment: wgo.minimumInvestment,
        startDate: wgo.startDate,
        endDate: wgo.endDate,
      }
      if (wgo.credibilityScore) payload.credibilityScore = wgo.credibilityScore
      if (wgo.presentationDays) payload.presentationDays = wgo.presentationDays
      if (wgo.shortDescription) payload.shortDescription = wgo.shortDescription
      if (wgo.wgoType) payload.wgoType = wgo.wgoType

      const res = await fetch('/api/wgo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const newWgo = await res.json()
        router.push(`/dashboard/wgo/${newWgo.id}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to duplicate')
      }
    } catch (err) {
      console.error('Error duplicating WGO:', err)
      alert('Failed to duplicate. Please try again.')
    } finally {
      setDuplicating(false)
    }
  }

  const handleTogglePublish = async (targetStatus?: string) => {
    if (!wgo) return
    const newStatus = targetStatus || (wgo.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE')
    setPublishLoading(true)
    try {
      const res = await fetch(`/api/wgo/${wgoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        await fetchWGO()
      } else {
        const data = await res.json()
        alert(data.error || `Failed to ${newStatus === 'ACTIVE' ? 'publish' : 'unpublish'}`)
      }
    } catch (err) {
      console.error('Error toggling publish:', err)
      alert('Failed to update status. Please try again.')
    } finally {
      setPublishLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostContent.trim()) return

    setPostingLoading(true)
    try {
      const res = await fetch(`/api/wgo/${wgoId}/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent }),
      })

      if (res.ok) {
        setNewPostContent('')
        await fetchForumPosts()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create post')
      }
    } catch (err) {
      console.error('Error creating post:', err)
      alert('Failed to create post. Please try again.')
    } finally {
      setPostingLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-forest-600">Loading WGO details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-800 mb-4">Error</h1>
            <p className="text-red-700 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button onClick={fetchWGO}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not found state
  if (!wgo) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-yellow-800 mb-4">WGO Not Found</h1>
            <p className="text-yellow-700 mb-6">
              The Wealth Generation Opportunity (WGO) could not be found.
            </p>
            <Link
              href="/dashboard/wgo"
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Return to WGO List
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const canEdit = wgo.isCreator || wgo.isLeader || wgo.isCoordinator || isAdmin
  const canDelete = wgo.isCreator || isAdmin
  const canPost = wgo.isInvolved && wgo.userInvolvement?.role !== 'OBSERVER'
  const progressPercentage = wgo.targetAmount
    ? Math.min(100, (wgo.currentAmount / wgo.targetAmount) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Draft Banner */}
      {wgo.status === 'DRAFT' && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-gray-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">This opportunity is a draft</p>
            <p className="text-xs text-gray-500">
              Only you and admins can see it. Publish when ready to make it visible to all members.
            </p>
          </div>
          {canEdit && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleTogglePublish('ACTIVE')}
              disabled={publishLoading}
            >
              {publishLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/wgo"
          className="p-2 hover:bg-sand-100 rounded-lg transition-colors mt-1"
        >
          <ArrowLeft className="h-5 w-5 text-forest-600" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-800">
              {wgo.title}
            </h1>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                WGO_CATEGORY_COLORS[wgo.category] || 'bg-gray-100 text-gray-800'
              )}
            >
              {WGO_CATEGORY_LABELS[wgo.category] || wgo.category}
            </span>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                WGO_STATUS_COLORS[wgo.status] || 'bg-gray-100 text-gray-800'
              )}
            >
              {WGO_STATUS_LABELS[wgo.status] || wgo.status}
            </span>
          </div>
          <p className="text-forest-500">
            Created on {new Date(wgo.createdAt).toLocaleDateString()}
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canEdit && wgo.status !== 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
              onClick={() => handleTogglePublish('DRAFT')}
              disabled={publishLoading}
            >
              {publishLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Unpublish
            </Button>
          )}
          {canEdit && wgo.status !== 'ACTIVE' && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleTogglePublish('ACTIVE')}
              disabled={publishLoading}
            >
              {publishLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {(canEdit || isAdmin) && (
            <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={duplicating}>
              {duplicating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Duplicate
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="border-sand-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                About This Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {wgo.shortDescription && (
                <p className="text-forest-800 font-medium text-lg">{wgo.shortDescription}</p>
              )}

              {(wgo.credibilityScore || wgo.wgoType || wgo.presentationDays) && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 p-4 bg-sand-50 rounded-lg">
                  {wgo.credibilityScore && (
                    <div>
                      <p className="text-xs text-forest-500 mb-1">Credibility Score</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-emerald-700">
                          {wgo.credibilityScore.toFixed(1)}
                        </span>
                        <span className="text-sm text-forest-500">/10</span>
                      </div>
                    </div>
                  )}
                  {wgo.wgoType && (
                    <div>
                      <p className="text-xs text-forest-500 mb-1">Type of WGO</p>
                      <p className="text-sm font-medium text-forest-800">{wgo.wgoType}</p>
                    </div>
                  )}
                  {wgo.presentationDays && (
                    <div>
                      <p className="text-xs text-forest-500 mb-1">Presentations</p>
                      <div className="flex items-start gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-forest-700">{wgo.presentationDays}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-forest-700 whitespace-pre-wrap">{wgo.description}</p>
              {wgo.referrerAffiliateLink && (
                <div className="mt-2">
                  <p className="text-xs text-forest-500 mb-2 font-body">
                    {wgo.referrerName
                      ? `Shared by your upline, ${wgo.referrerName}`
                      : 'Shared by your upline'}
                  </p>
                  <a
                    href={wgo.referrerAffiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Sign Up with {wgo.title}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduled Meetings & Presentations */}
          {relatedEvents.length > 0 &&
            (() => {
              const WEEKS_PER_PAGE = 4
              const MS_PER_PAGE = WEEKS_PER_PAGE * 7 * 24 * 60 * 60 * 1000
              const sorted = [...relatedEvents].sort(
                (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
              )
              const earliest = new Date(sorted[0].startTime).getTime()
              const cutoff = earliest + eventsPage * MS_PER_PAGE
              const visible = sorted.filter((evt) => new Date(evt.startTime).getTime() < cutoff)
              const hasMore = visible.length < sorted.length

              return (
                <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                      Scheduled Meetings & Presentations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {visible.map((evt) => {
                      const evtDate = new Date(evt.startTime)
                      const endDate = new Date(evt.endTime)
                      const isPast = evtDate < new Date()
                      return (
                        <Link
                          key={evt.id}
                          href={`/dashboard/events/${evt.id}`}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                            isPast
                              ? 'border-sand-200 bg-sand-50 opacity-60'
                              : 'border-emerald-200 bg-white hover:bg-emerald-50'
                          )}
                        >
                          <div className="flex-shrink-0 text-center bg-emerald-100 rounded-lg px-3 py-1.5">
                            <div className="text-xs font-medium text-emerald-700">
                              {evtDate.toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                            <div className="text-lg font-bold text-emerald-800">
                              {evtDate.getDate()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-forest-800 truncate">{evt.title}</p>
                            <p className="text-xs text-forest-500">
                              {evtDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                              {' - '}
                              {endDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                              {evt.location && ` · ${evt.location}`}
                            </p>
                          </div>
                          {evt.virtualLink && (
                            <Video className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          )}
                        </Link>
                      )
                    })}
                    {hasMore && (
                      <Button
                        variant="outline"
                        className="w-full text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => setEventsPage((p) => p + 1)}
                      >
                        Show next {WEEKS_PER_PAGE} weeks
                      </Button>
                    )}
                    <Link
                      href="/dashboard/events"
                      className="block text-center text-sm text-emerald-600 hover:text-emerald-700 pt-1"
                    >
                      View all events
                    </Link>
                  </CardContent>
                </Card>
              )
            })()}

          {/* Financial Details */}
          <Card className="border-sand-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {wgo.targetAmount !== null && (
                  <div className="p-4 bg-sand-50 rounded-lg">
                    <div className="text-forest-500 text-sm mb-1">Target Amount</div>
                    <p className="text-xl font-bold text-forest-800">
                      ${wgo.targetAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="text-emerald-600 text-sm mb-1">Current Amount</div>
                  <p className="text-xl font-bold text-emerald-700">
                    ${wgo.currentAmount.toLocaleString()}
                  </p>
                </div>
                {wgo.minimumInvestment !== null && wgo.minimumInvestment !== undefined && (
                  <div className="p-4 bg-amber-50 rounded-lg col-span-2">
                    <div className="text-amber-700 text-sm mb-1">Minimum Investment</div>
                    <p className="text-xl font-bold text-amber-800">
                      ${wgo.minimumInvestment.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {wgo.targetAmount !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-forest-500">Progress</span>
                    <span className="font-medium text-forest-700">
                      {progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-sand-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sand-200">
                {wgo.startDate && (
                  <div className="flex items-center gap-2 text-forest-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Starts: {new Date(wgo.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {wgo.endDate && (
                  <div className="flex items-center gap-2 text-forest-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Ends: {new Date(wgo.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Forum Posts - Only visible to involved users */}
          {(wgo.isInvolved || isAdmin) && (
            <Card className="border-sand-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  Forum Posts ({wgo.forumPostCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* New Post Form */}
                {(canPost || isAdmin) && (
                  <form onSubmit={handleCreatePost} className="space-y-3">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Write a new post..."
                      rows={3}
                      className="w-full px-3 py-2 border border-sand-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={postingLoading || !newPostContent.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {postingLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <MessageSquare className="h-4 w-4 mr-2" />
                        )}
                        Post
                      </Button>
                    </div>
                  </form>
                )}

                {/* Posts List */}
                {forumPosts.length === 0 ? (
                  <p className="text-center text-forest-500 py-8">
                    No forum posts yet. Be the first to start a discussion!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {forumPosts.map((post) => (
                      <div
                        key={post.id}
                        className={cn(
                          'p-4 rounded-lg border',
                          post.isPinned
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-white border-sand-200'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-forest-800">
                              {post.author?.name || 'Unknown User'}
                            </span>
                            {post.isPinned && <Pin className="h-4 w-4 text-amber-600" />}
                          </div>
                          <span className="text-xs text-forest-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-forest-700 whitespace-pre-wrap">{post.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Join/Leave Card */}
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50 to-white">
            <CardContent className="p-6 space-y-4">
              {wgo.isInvolved ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700">
                      You are a {WGO_ROLE_LABELS[wgo.userInvolvement?.role || 'PARTICIPANT']}
                    </span>
                  </div>
                  <p className="text-sm text-forest-600">
                    Joined on{' '}
                    {wgo.userInvolvement?.joinedAt
                      ? new Date(wgo.userInvolvement.joinedAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                  {!wgo.isCreator && !wgo.isLeader && (
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-300 hover:bg-red-50"
                      onClick={handleLeave}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserMinus className="h-4 w-4 mr-2" />
                      )}
                      Leave WGO
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <h3 className="font-medium text-forest-800">Join the Discussion</h3>
                  <p className="text-sm text-forest-600">
                    Join this WGO group to access the forum and collaborate with other members.
                  </p>
                  {(wgo.status === 'ACTIVE' || wgo.status === 'DRAFT') && (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleJoin}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Join Discussion Group
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Affiliate Link - Only visible when involved */}
          {wgo.isInvolved && (
            <Card className="border-sand-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  My Affiliate Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-forest-500">
                  Add your personal affiliate or referral link for this opportunity. This link will
                  be shared with members you invite.
                </p>
                <input
                  type="url"
                  value={affiliateLink}
                  onChange={(e) => {
                    setAffiliateLink(e.target.value)
                    setAffiliateSaved(false)
                  }}
                  placeholder="https://example.com/ref/your-id"
                  className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleSaveAffiliateLink}
                    disabled={affiliateSaving}
                  >
                    {affiliateSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                  {affiliateLink && (
                    <a
                      href={affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </a>
                  )}
                  {affiliateSaved && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card className="border-sand-200">
            <CardHeader>
              <CardTitle className="text-sm">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-forest-500">Category</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    WGO_CATEGORY_COLORS[wgo.category] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {WGO_CATEGORY_LABELS[wgo.category] || wgo.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Status</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    WGO_STATUS_COLORS[wgo.status] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {WGO_STATUS_LABELS[wgo.status] || wgo.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Discussion Members</span>
                <span className="font-bold text-forest-800 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {wgo.involvementCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Discussion Posts</span>
                <span className="font-bold text-forest-800 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {wgo.forumPostCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Created</span>
                <span className="text-forest-700">
                  {new Date(wgo.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Last Updated</span>
                <span className="text-forest-700">
                  {new Date(wgo.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Members Preview */}
          {wgo.involvements.length > 0 && (
            <Card className="border-sand-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {wgo.involvements.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-forest-700">
                      {inv.userId === userId ? 'You' : `Member ${inv.id.slice(0, 6)}`}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        WGO_ROLE_COLORS[inv.role] || 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {WGO_ROLE_LABELS[inv.role] || inv.role}
                    </span>
                  </div>
                ))}
                {wgo.involvements.length > 5 && (
                  <p className="text-xs text-forest-500 pt-2 border-t">
                    +{wgo.involvements.length - 5} more members
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-forest-800 mb-2">Delete Opportunity?</h3>
              <p className="text-forest-600 mb-4">
                This action cannot be undone. All forum posts and member involvements will also be
                deleted.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditWGOModal
          wgo={wgo}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchWGO()
          }}
        />
      )}
    </div>
  )
}

// Edit Modal Component
function EditWGOModal({
  wgo,
  onClose,
  onSuccess,
}: {
  wgo: WGO
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    title: wgo.title,
    description: wgo.description,
    category: wgo.category,
    status: wgo.status,
    targetAmount: wgo.targetAmount?.toString() || '',
    minimumInvestment: wgo.minimumInvestment?.toString() || '',
    currentAmount: wgo.currentAmount.toString(),
    startDate: wgo.startDate ? wgo.startDate.slice(0, 10) : '',
    endDate: wgo.endDate ? wgo.endDate.slice(0, 10) : '',
    affiliateLink: wgo.userInvolvement?.affiliateLink || '',
    credibilityScore: wgo.credibilityScore?.toString() || '',
    presentationDays: wgo.presentationDays || '',
    shortDescription: wgo.shortDescription || '',
    wgoType: wgo.wgoType || '',
  })

  const getWarnings = () => {
    const warnings: Record<string, string> = {}
    if (!formData.title.trim())
      warnings.title = 'Recommended — will default to "Untitled Opportunity"'
    if (!formData.description.trim())
      warnings.description = 'Recommended — helps members understand the opportunity'
    if (formData.credibilityScore) {
      const score = parseFloat(formData.credibilityScore)
      if (isNaN(score) || score < 1 || score > 10)
        warnings.credibilityScore = 'Should be between 1 and 10'
    }
    if (formData.targetAmount) {
      const amt = parseFloat(formData.targetAmount)
      if (isNaN(amt) || amt < 0) warnings.targetAmount = 'Should be a positive number'
    }
    if (formData.minimumInvestment) {
      const amt = parseFloat(formData.minimumInvestment)
      if (isNaN(amt) || amt < 0) warnings.minimumInvestment = 'Should be a positive number'
    }
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      warnings.endDate = 'End date is before start date'
    }
    return warnings
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const warnings = getWarnings()
    setFieldWarnings(warnings)
    setLoading(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        title: formData.title || 'Untitled Opportunity',
        description: formData.description || '',
        category: formData.category || 'INVESTMENT',
        status: formData.status || 'ACTIVE',
        currentAmount: parseFloat(formData.currentAmount) || 0,
      }

      // Include metadata fields - send null to clear, value to set
      const credScore = formData.credibilityScore ? parseFloat(formData.credibilityScore) : null
      const presDays = formData.presentationDays.trim() || null
      const shortDesc = formData.shortDescription.trim() || null
      const type = formData.wgoType.trim() || null
      if (credScore !== null) payload.credibilityScore = credScore
      if (presDays !== null) payload.presentationDays = presDays
      if (shortDesc !== null) payload.shortDescription = shortDesc
      if (type !== null) payload.wgoType = type

      payload.targetAmount = formData.targetAmount ? parseFloat(formData.targetAmount) : null
      payload.minimumInvestment = formData.minimumInvestment
        ? parseFloat(formData.minimumInvestment)
        : null
      payload.startDate = formData.startDate || null
      payload.endDate = formData.endDate || null

      const res = await fetch(`/api/wgo/${wgo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.details?.fieldErrors) {
          const apiFieldWarnings: Record<string, string> = {}
          for (const [field, messages] of Object.entries(data.details.fieldErrors)) {
            if (Array.isArray(messages) && messages.length > 0) {
              apiFieldWarnings[field] = messages[0] as string
            }
          }
          if (Object.keys(apiFieldWarnings).length > 0) {
            setFieldWarnings((prev) => ({ ...prev, ...apiFieldWarnings }))
          }
        }
        throw new Error(data.error || 'Failed to update')
      }

      // Save affiliate link to the user's involvement record (same as sidebar and profile)
      if (wgo.isInvolved) {
        const affiliateRes = await fetch('/api/wgo/involvement', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wgoId: wgo.id,
            affiliateLink: formData.affiliateLink.trim() || null,
          }),
        })

        if (!affiliateRes.ok) {
          const data = await affiliateRes.json()
          throw new Error(data.error || 'Failed to save affiliate link')
        }
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Edit Opportunity</CardTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.title
                        return n
                      })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500',
                    submitted && fieldWarnings.title ? 'border-amber-400' : 'border-sand-300'
                  )}
                />
                {submitted && fieldWarnings.title && (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.title}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Brief Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.description
                        return n
                      })
                  }}
                  rows={4}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500',
                    submitted && fieldWarnings.description ? 'border-amber-400' : 'border-sand-300'
                  )}
                />
                {submitted && fieldWarnings.description && (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.description}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Short Description
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  rows={2}
                  maxLength={1000}
                  placeholder="A brief summary shown at the top of the opportunity"
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Type of WGO
                </label>
                <input
                  type="text"
                  value={formData.wgoType}
                  onChange={(e) => setFormData({ ...formData, wgoType: e.target.value })}
                  maxLength={500}
                  placeholder="e.g. Crypto trading, Fiat trading, Gold, Nodes"
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Credibility Score (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={formData.credibilityScore}
                  onChange={(e) => {
                    setFormData({ ...formData, credibilityScore: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.credibilityScore
                        return n
                      })
                  }}
                  placeholder="e.g. 8.5"
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500',
                    submitted && fieldWarnings.credibilityScore
                      ? 'border-amber-400'
                      : 'border-sand-300'
                  )}
                />
                {submitted && fieldWarnings.credibilityScore ? (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.credibilityScore}</p>
                ) : (
                  <p className="text-xs text-forest-500 mt-1">
                    Risk mitigation & sustainability (10 = best)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Presentation Days
                </label>
                <input
                  type="text"
                  value={formData.presentationDays}
                  onChange={(e) => setFormData({ ...formData, presentationDays: e.target.value })}
                  maxLength={500}
                  placeholder="e.g. Every Thursday 4:00PM"
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {wgo.isInvolved && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-forest-700 mb-1">
                    My Affiliate Link
                  </label>
                  <p className="text-xs text-forest-500 mb-1.5">
                    Add your personal affiliate or referral link for this opportunity. This link
                    will be shared with members you invite.
                  </p>
                  <input
                    type="url"
                    value={formData.affiliateLink}
                    onChange={(e) => setFormData({ ...formData, affiliateLink: e.target.value })}
                    placeholder="https://example.com/ref/your-id"
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(WGO_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(WGO_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, targetAmount: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.targetAmount
                        return n
                      })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500',
                    submitted && fieldWarnings.targetAmount ? 'border-amber-400' : 'border-sand-300'
                  )}
                  placeholder="Optional"
                />
                {submitted && fieldWarnings.targetAmount && (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.targetAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Minimum Investment ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumInvestment}
                  onChange={(e) => {
                    setFormData({ ...formData, minimumInvestment: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.minimumInvestment
                        return n
                      })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500',
                    submitted && fieldWarnings.minimumInvestment
                      ? 'border-amber-400'
                      : 'border-sand-300'
                  )}
                  placeholder="Optional"
                />
                {submitted && fieldWarnings.minimumInvestment && (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.minimumInvestment}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Current Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.endDate
                        return n
                      })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500',
                    submitted && fieldWarnings.endDate ? 'border-amber-400' : 'border-sand-300'
                  )}
                />
                {submitted && fieldWarnings.endDate && (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.endDate}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
