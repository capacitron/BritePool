'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User,
  ChevronLeft,
  Save,
  Trash2,
  Clock,
  BookOpen,
  Calendar,
  CheckSquare,
  Users,
  Pencil,
  X,
  Search,
  Eye,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  bio: string | null
  phone: string | null
  location: string | null
  timezone: string
  language: string
  totalEquityUnits: number
  totalHoursLogged: number
}

interface CommitteeMembership {
  id: string
  role: string
  committee: {
    id: string
    name: string
    type: string
  }
}

interface ParticipationLog {
  id: string
  hours: number
  description: string
  category: string
  status: string
  createdAt: string
}

interface TaskItem {
  id: string
  title: string
  status: string
  priority: string
  createdAt: string
}

interface EventRegistrationItem {
  id: string
  event: {
    id: string
    title: string
    startTime: string
    type: string
  }
}

interface CourseProgressItem {
  id: string
  progress: number
  isCompleted: boolean
  course: {
    id: string
    title: string
    category: string
  }
}

interface FinancialScreeningData {
  totalScore: number
  tier: string
  flagLevel: string | null
  suggestedEntryCap: number | null
  adminOverride: boolean
  adminNotes: string | null
  internalReviewRequired: boolean
  financialRhythm: string
  opportunityApproach: string
  timelineAlignment: string
  responseToDelays: string
  primaryIntentions: string[]
  guidancePreference: string
  createdAt: string
}

interface ReferralUser {
  id: string
  name: string
  email: string
  createdAt?: string
}

interface UserData {
  id: string
  email: string
  name: string
  role: string
  status: string
  subscriptionTier: string
  subscriptionStatus: string
  covenantAcceptedAt: string | null
  covenantVersion: string | null
  covenantIpAddress: string | null
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  profile: UserProfile | null
  financialScreening: FinancialScreeningData | null
  referredBy: ReferralUser | null
  referrals: ReferralUser[]
  committees: CommitteeMembership[]
  participationLogs: ParticipationLog[]
  tasks: TaskItem[]
  eventRegistrations: EventRegistrationItem[]
  courseProgress: CourseProgressItem[]
}

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

const subscriptionTiers = ['FREE', 'BASIC', 'PREMIUM', 'PLATINUM']
const subscriptionStatuses = ['ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED']
const accountStatuses = ['ACTIVE', 'SUSPENDED', 'LOCKED']

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editedRole, setEditedRole] = useState('')
  const [editedTier, setEditedTier] = useState('')
  const [editedStatus, setEditedStatus] = useState('')
  const [editedName, setEditedName] = useState('')
  const [editedAccountStatus, setEditedAccountStatus] = useState('')
  const [editedReferredById, setEditedReferredById] = useState<string | null>(null)
  const [editingReferrer, setEditingReferrer] = useState(false)
  const [referrerSearch, setReferrerSearch] = useState('')
  const [referrerResults, setReferrerResults] = useState<
    { id: string; name: string; email: string }[]
  >([])
  const [searchingReferrer, setSearchingReferrer] = useState(false)
  const [selectedReferrer, setSelectedReferrer] = useState<{
    id: string
    name: string
    email: string
  } | null>(null)
  const [impersonating, setImpersonating] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  async function handleImpersonate() {
    if (!user) return
    setImpersonating(true)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setFeedback({ type: 'error', message: data.error || 'Failed to impersonate user' })
        setImpersonating(false)
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error. Please try again.' })
      setImpersonating(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [userId])

  async function fetchUser() {
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        const userData = data.user || data
        setUser(userData)
        setEditedRole(userData.role)
        setEditedTier(userData.subscriptionTier)
        setEditedStatus(userData.subscriptionStatus)
        setEditedName(userData.name)
        setEditedAccountStatus(userData.status || 'ACTIVE')
        setEditedReferredById(userData.referredBy?.id ?? null)
        setSelectedReferrer(userData.referredBy ?? null)
        setEditingReferrer(false)
      } else if (res.status === 404) {
        router.push('/dashboard/admin/users')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editedRole,
          subscriptionTier: editedTier,
          subscriptionStatus: editedStatus,
          status: editedAccountStatus,
          name: editedName,
          referredById: editedReferredById,
        }),
      })
      if (res.ok) {
        setFeedback({ type: 'success', message: 'User updated successfully.' })
        fetchUser()
      } else {
        const data = await res.json().catch(() => ({}))
        setFeedback({
          type: 'error',
          message: data.error || `Failed to update user (${res.status})`,
        })
      }
    } catch (error) {
      console.error('Error saving user:', error)
      setFeedback({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (
      !confirm('Are you sure you want to suspend this user? They will no longer be able to log in.')
    ) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/dashboard/admin/users')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  async function searchReferrer(query: string) {
    if (query.length < 2) {
      setReferrerResults([])
      return
    }
    setSearchingReferrer(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setReferrerResults(
          (data.users || [])
            .filter((u: { id: string }) => u.id !== userId)
            .map((u: { id: string; name: string; email: string }) => ({
              id: u.id,
              name: u.name,
              email: u.email,
            }))
        )
      }
    } catch {
      // silently fail search
    } finally {
      setSearchingReferrer(false)
    }
  }

  function handleSelectReferrer(referrer: { id: string; name: string; email: string }) {
    setSelectedReferrer(referrer)
    setEditedReferredById(referrer.id)
    setEditingReferrer(false)
    setReferrerSearch('')
    setReferrerResults([])
  }

  function handleRemoveReferrer() {
    setSelectedReferrer(null)
    setEditedReferredById(null)
    setEditingReferrer(false)
    setReferrerSearch('')
    setReferrerResults([])
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-earth-brown-light">Loading user details...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-earth-brown-light">User not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-brown-dark">
            User Details
          </h1>
          <p className="text-earth-brown-light mt-1 text-sm sm:text-base truncate">{user.email}</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin/users">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          {user.role !== 'WEB_STEWARD' && (
            <Button
              onClick={handleImpersonate}
              variant="outline"
              size="sm"
              disabled={impersonating}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {impersonating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-1" />
              )}
              Impersonate
            </Button>
          )}
          <Button onClick={handleDelete} variant="destructive" size="sm" disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-1" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit User
            </CardTitle>
            <CardDescription>Update user role, subscription, and basic info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled className="bg-stone-warm" />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={editedRole}
                  onChange={(e) => setEditedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-stone rounded-lg"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="accountStatus">Account Status</Label>
                <select
                  id="accountStatus"
                  value={editedAccountStatus}
                  onChange={(e) => setEditedAccountStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-stone rounded-lg"
                >
                  {accountStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="tier">Subscription Tier</Label>
                <select
                  id="tier"
                  value={editedTier}
                  onChange={(e) => setEditedTier(e.target.value)}
                  className="w-full px-3 py-2 border border-stone rounded-lg"
                >
                  {subscriptionTiers.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Subscription Status</Label>
                <select
                  id="status"
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-stone rounded-lg"
                >
                  {subscriptionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {feedback && (
              <div
                className={`px-4 py-3 rounded-lg text-sm font-medium ${
                  feedback.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Recent Tasks
                </h4>
                {user.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {user.tasks.map((task) => (
                      <div key={task.id} className="p-2 bg-stone-warm rounded text-sm">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-earth-brown-light">
                          {task.status} • {task.priority} • {formatDate(task.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-earth-brown-light">No tasks assigned</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Registrations
                </h4>
                {user.eventRegistrations.length > 0 ? (
                  <div className="space-y-2">
                    {user.eventRegistrations.map((reg) => (
                      <div key={reg.id} className="p-2 bg-stone-warm rounded text-sm">
                        <p className="font-medium">{reg.event.title}</p>
                        <p className="text-xs text-earth-brown-light">
                          {reg.event.type} • {formatDate(reg.event.startTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-earth-brown-light">No event registrations</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Course Progress
                </h4>
                {user.courseProgress.length > 0 ? (
                  <div className="space-y-2">
                    {user.courseProgress.map((cp) => (
                      <div key={cp.id} className="p-2 bg-stone-warm rounded text-sm">
                        <p className="font-medium">{cp.course.title}</p>
                        <p className="text-xs text-earth-brown-light">
                          {cp.progress}% complete • {cp.isCompleted ? 'Completed' : 'In Progress'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-earth-brown-light">No course progress</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-earth-brown-light">Created</p>
              <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-earth-brown-light">Last Login</p>
              <p className="text-sm font-medium">{formatDate(user.lastLoginAt)}</p>
            </div>
            <div>
              <p className="text-xs text-earth-brown-light">Last Updated</p>
              <p className="text-sm font-medium">{formatDate(user.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agreement Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-earth-brown-light">Status</p>
              <p
                className={`text-sm font-medium ${user.covenantAcceptedAt ? 'text-sage' : 'text-terracotta'}`}
              >
                {user.covenantAcceptedAt ? 'Accepted' : 'Pending'}
              </p>
            </div>
            {user.covenantAcceptedAt && (
              <>
                <div>
                  <p className="text-xs text-earth-brown-light">Accepted At</p>
                  <p className="text-sm font-medium">{formatDate(user.covenantAcceptedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-earth-brown-light">Version</p>
                  <p className="text-sm font-medium">{user.covenantVersion || 'N/A'}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {user.financialScreening && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Financial Screening
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-earth-brown-light">Assigned Tier</p>
                  <p className="text-sm font-bold">
                    {user.financialScreening.tier.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-earth-brown-light">Score</p>
                  <p className="text-sm font-bold">{user.financialScreening.totalScore}/24</p>
                </div>
              </div>
              {user.financialScreening.flagLevel && (
                <div>
                  <p className="text-xs text-earth-brown-light">Flag Level</p>
                  <p
                    className={`text-sm font-medium ${
                      user.financialScreening.flagLevel === 'HARD_STOP'
                        ? 'text-red-600'
                        : user.financialScreening.flagLevel === 'MODERATE'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                    }`}
                  >
                    {user.financialScreening.flagLevel.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              {user.financialScreening.internalReviewRequired && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-yellow-800">Review Required</p>
                </div>
              )}
              <div>
                <p className="text-xs text-earth-brown-light">Completed</p>
                <p className="text-sm">
                  {new Date(user.financialScreening.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-earth-brown-light uppercase tracking-wide mb-3">
                  Screening Responses
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-earth-brown-light">Financial Readiness</p>
                    <p className="text-sm">
                      {(
                        {
                          stable_discretionary: 'Stable with discretionary funds available',
                          stable_conservative: 'Stable but prefers conservative participation',
                          building_start_small: 'Building toward stability, starting small',
                          reorganizing_low_commitment:
                            'Reorganizing finances, needs low-commitment',
                        } as Record<string, string>
                      )[user.financialScreening.financialRhythm] ||
                        user.financialScreening.financialRhythm?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-earth-brown-light">Decision Style</p>
                    <p className="text-sm">
                      {(
                        {
                          move_quickly: 'Moves quickly when something resonates',
                          research_thoroughly: 'Researches thoroughly before committing',
                          phased_incremental: 'Prefers phased or incremental entry',
                          seek_counsel: 'Seeks counsel before making decisions',
                        } as Record<string, string>
                      )[user.financialScreening.opportunityApproach] ||
                        user.financialScreening.opportunityApproach?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-earth-brown-light">Timeline Alignment</p>
                    <p className="text-sm">
                      {(
                        {
                          short_term_liquidity: 'Short-term liquidity or quicker cycles',
                          mid_range_6_18: 'Mid-range timelines (6\u201318 months)',
                          long_term_2_plus: 'Long-term positioning (2+ years)',
                          steady_strategic_growth: 'Steady, strategic growth over speed',
                        } as Record<string, string>
                      )[user.financialScreening.timelineAlignment] ||
                        user.financialScreening.timelineAlignment?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-earth-brown-light">Resilience & Flexibility</p>
                    <p className="text-sm">
                      {(
                        {
                          no_significant_impact: 'Would not significantly impact them',
                          wants_updates: 'Wants regular communication and updates',
                          some_stress_but_steady: 'Some stress, but can stay steady',
                          needs_exit_path: 'Needs structured flexibility or exit path',
                        } as Record<string, string>
                      )[user.financialScreening.responseToDelays] ||
                        user.financialScreening.responseToDelays?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-earth-brown-light">Primary Intentions</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.financialScreening.primaryIntentions.map((intent: string) => (
                        <span
                          key={intent}
                          className="text-xs bg-sand-100 text-forest-700 px-2 py-1 rounded-full"
                        >
                          {(
                            {
                              wealth_building: 'Wealth building',
                              diversification: 'Diversification',
                              community_alignment: 'Community alignment',
                              learning_exposure: 'Learning and exposure',
                              healing_ventures: 'Healing ventures',
                              other: 'Other',
                            } as Record<string, string>
                          )[intent] || intent.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-earth-brown-light">Guidance Preference</p>
                    <p className="text-sm">
                      {(
                        {
                          yes_guidance: 'Yes, wants guidance',
                          possibly: 'Possibly',
                          no_guidance_needed: 'No, already knows comfort range',
                        } as Record<string, string>
                      )[user.financialScreening.guidancePreference] ||
                        user.financialScreening.guidancePreference?.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referral Network
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-earth-brown-light mb-1">Introduced By</p>
              {!editingReferrer ? (
                <div className="flex items-center justify-between">
                  {selectedReferrer ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-xs">
                        {selectedReferrer.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{selectedReferrer.name}</p>
                        <p className="text-xs text-earth-brown-light">{selectedReferrer.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-earth-brown-light italic">No referrer assigned</p>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingReferrer(true)}
                      className="p-1.5 rounded-md hover:bg-stone-warm text-earth-brown-light hover:text-earth-brown-dark transition-colors"
                      title="Change referrer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {selectedReferrer && (
                      <button
                        onClick={handleRemoveReferrer}
                        className="p-1.5 rounded-md hover:bg-red-50 text-earth-brown-light hover:text-red-600 transition-colors"
                        title="Remove referrer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-earth-brown-light" />
                    <Input
                      placeholder="Search by name or email..."
                      value={referrerSearch}
                      onChange={(e) => {
                        setReferrerSearch(e.target.value)
                        searchReferrer(e.target.value)
                      }}
                      className="pl-8 h-9 text-sm"
                      autoFocus
                    />
                  </div>
                  {searchingReferrer && (
                    <p className="text-xs text-earth-brown-light">Searching...</p>
                  )}
                  {referrerResults.length > 0 && (
                    <div className="border border-stone rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                      {referrerResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectReferrer(result)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-stone-warm text-left transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-xs shrink-0">
                            {result.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{result.name}</p>
                            <p className="text-xs text-earth-brown-light truncate">
                              {result.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setEditingReferrer(false)
                      setReferrerSearch('')
                      setReferrerResults([])
                    }}
                    className="text-xs text-earth-brown-light hover:text-earth-brown-dark"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {user.referrals.length > 0 && (
              <div>
                <p className="text-xs text-earth-brown-light">
                  People They Introduced ({user.referrals.length})
                </p>
                <div className="space-y-2 mt-2">
                  {user.referrals.map((ref: ReferralUser) => (
                    <div key={ref.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-earth-100 flex items-center justify-center text-earth-600 font-bold text-xs">
                        {ref.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm">{ref.name}</p>
                        <p className="text-xs text-earth-brown-light">{ref.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participation Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-earth-brown-light">Total Hours Logged</p>
              <p className="text-2xl font-bold">
                {user.profile?.totalHoursLogged?.toFixed(1) || '0'} hrs
              </p>
            </div>
            <div>
              <p className="text-xs text-earth-brown-light">Equity Units</p>
              <p className="text-2xl font-bold text-sage">
                {user.profile?.totalEquityUnits?.toFixed(2) || '0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-earth-brown-light">Committees</p>
              {user.committees.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {user.committees.map((cm) => (
                    <p key={cm.id} className="text-sm">
                      {cm.committee.name} ({cm.role})
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-earth-brown-light">No committees</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
