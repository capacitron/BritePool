'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
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
  User,
  ChevronLeft,
  Save,
  Trash2,
  Clock,
  BookOpen,
  Calendar,
  CheckSquare,
  Users,
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

interface UserData {
  id: string
  email: string
  name: string
  role: string
  subscriptionTier: string
  subscriptionStatus: string
  covenantAcceptedAt: string | null
  covenantVersion: string | null
  covenantIpAddress: string | null
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  profile: UserProfile | null
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

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
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

  useEffect(() => {
    fetchUser()
  }, [userId])

  async function fetchUser() {
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setEditedRole(data.role)
        setEditedTier(data.subscriptionTier)
        setEditedStatus(data.subscriptionStatus)
        setEditedName(data.name)
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
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editedRole,
          subscriptionTier: editedTier,
          subscriptionStatus: editedStatus,
          name: editedName,
        }),
      })
      if (res.ok) {
        fetchUser()
      }
    } catch (error) {
      console.error('Error saving user:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/dashboard/admin/users')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setDeleting(false)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            User Details
          </h1>
          <p className="text-earth-brown-light mt-1">
            {user.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/users">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <Button onClick={handleDelete} variant="destructive" disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete User'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit User
              </CardTitle>
              <CardDescription>
                Update user role, subscription, and basic info
              </CardDescription>
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
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-stone-warm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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
        </div>

        <div className="space-y-6">
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
              <CardTitle>Covenant Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-earth-brown-light">Status</p>
                <p className={`text-sm font-medium ${user.covenantAcceptedAt ? 'text-sage' : 'text-terracotta'}`}>
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
    </div>
  )
}
