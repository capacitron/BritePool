'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, User, Calendar, MapPin, Tag, CheckCircle } from 'lucide-react'

type MaintenanceRequest = {
  id: string
  title: string
  description: string
  location: string
  category: string
  priority: string
  status: string
  submittedAt: string
  assignedAt: string | null
  resolvedAt: string | null
  resolutionNotes: string | null
  submittedBy: { id: string; name: string; role: string }
  assignedTo: { id: string; name: string; role: string } | null
  resolvedBy: { id: string; name: string; role: string } | null
}

type UserInfo = {
  id: string
  name: string
}

const priorityStyles: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  URGENT: 'bg-red-100 text-red-700 border-red-200',
}

const statusStyles: Record<string, string> = {
  SUBMITTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ASSIGNED: 'bg-purple-100 text-purple-700 border-purple-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
}

export default function MaintenanceRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = use(params)
  const router = useRouter()
  const [request, setRequest] = useState<MaintenanceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState<UserInfo[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [showResolveForm, setShowResolveForm] = useState(false)

  useEffect(() => {
    fetchRequest()
    checkAdminStatus()
  }, [requestId])

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/maintenance-requests/${requestId}`)
      if (response.ok) {
        const data = await response.json()
        setRequest(data)
        if (data.assignedTo) {
          setSelectedAssignee(data.assignedTo.id)
        }
      } else if (response.status === 404) {
        router.push('/dashboard/maintenance')
      }
    } catch (error) {
      console.error('Failed to fetch request:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      const role = data?.user?.role
      if (role && ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR', 'SUPPORT_STAFF'].includes(role)) {
        setIsAdmin(true)
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to check admin status:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const tasks = await response.json()
        const usersMap = new Map<string, UserInfo>()
        tasks.forEach((task: { assignedTo?: UserInfo }) => {
          if (task.assignedTo) {
            usersMap.set(task.assignedTo.id, task.assignedTo)
          }
        })
        if (usersMap.size === 0) {
          const allResponse = await fetch('/api/maintenance-requests')
          if (allResponse.ok) {
            const requests = await allResponse.json()
            requests.forEach((req: { submittedBy?: UserInfo; assignedTo?: UserInfo }) => {
              if (req.submittedBy) {
                usersMap.set(req.submittedBy.id, req.submittedBy)
              }
              if (req.assignedTo) {
                usersMap.set(req.assignedTo.id, req.assignedTo)
              }
            })
          }
        }
        setUsers(Array.from(usersMap.values()))
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const updateRequest = async (updates: Record<string, unknown>) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/maintenance-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        const data = await response.json()
        setRequest(data)
        setShowResolveForm(false)
        setResolutionNotes('')
      }
    } catch (error) {
      console.error('Failed to update request:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAssign = () => {
    if (selectedAssignee) {
      updateRequest({ assignedToId: selectedAssignee, status: 'ASSIGNED' })
    }
  }

  const handleStartWork = () => {
    updateRequest({ status: 'IN_PROGRESS' })
  }

  const handleResolve = () => {
    updateRequest({ status: 'RESOLVED', resolutionNotes })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-earth-brown" />
      </div>
    )
  }

  if (!request) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/maintenance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold text-earth-brown-dark">
              {request.title}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                priorityStyles[request.priority]
              }`}
            >
              {request.priority}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                statusStyles[request.status]
              }`}
            >
              {request.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-earth-brown-light mb-1">Description</h4>
                <p className="text-earth-brown-dark whitespace-pre-wrap">{request.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-earth-brown-light" />
                  <div>
                    <p className="text-xs text-earth-brown-light">Location</p>
                    <p className="text-sm text-earth-brown-dark">{request.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-earth-brown-light" />
                  <div>
                    <p className="text-xs text-earth-brown-light">Category</p>
                    <p className="text-sm text-earth-brown-dark">{request.category}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-yellow-700" />
                  </div>
                  <div>
                    <p className="font-medium text-earth-brown-dark">Submitted</p>
                    <p className="text-sm text-earth-brown-light">
                      {formatDate(request.submittedAt)} by {request.submittedBy.name}
                    </p>
                  </div>
                </div>

                {request.assignedAt && request.assignedTo && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-purple-700" />
                    </div>
                    <div>
                      <p className="font-medium text-earth-brown-dark">Assigned</p>
                      <p className="text-sm text-earth-brown-light">
                        {formatDate(request.assignedAt)} - Assigned to {request.assignedTo.name}
                      </p>
                    </div>
                  </div>
                )}

                {request.status === 'IN_PROGRESS' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium text-earth-brown-dark">In Progress</p>
                      <p className="text-sm text-earth-brown-light">Work is currently underway</p>
                    </div>
                  </div>
                )}

                {request.resolvedAt && request.resolvedBy && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium text-earth-brown-dark">Resolved</p>
                      <p className="text-sm text-earth-brown-light">
                        {formatDate(request.resolvedAt)} by {request.resolvedBy.name}
                      </p>
                      {request.resolutionNotes && (
                        <p className="text-sm text-earth-brown-dark mt-2 bg-green-50 p-3 rounded-lg">
                          {request.resolutionNotes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isAdmin && request.status !== 'RESOLVED' && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(request.status === 'SUBMITTED' || request.status === 'ASSIGNED') && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-earth-brown-dark">
                      Assign To
                    </label>
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-earth-brown"
                    >
                      <option value="">Select assignee...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleAssign}
                      disabled={!selectedAssignee || updating}
                      className="w-full"
                      variant="outline"
                    >
                      {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Assign
                    </Button>
                  </div>
                )}

                {request.status === 'ASSIGNED' && (
                  <Button
                    onClick={handleStartWork}
                    disabled={updating}
                    className="w-full"
                    variant="secondary"
                  >
                    {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Start Work
                  </Button>
                )}

                {(request.status === 'ASSIGNED' || request.status === 'IN_PROGRESS') && (
                  <>
                    {!showResolveForm ? (
                      <Button
                        onClick={() => setShowResolveForm(true)}
                        className="w-full"
                      >
                        Resolve
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-earth-brown-dark">
                          Resolution Notes
                        </label>
                        <textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Describe how the issue was resolved..."
                          rows={4}
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-earth-brown"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowResolveForm(false)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleResolve}
                            disabled={updating}
                            size="sm"
                          >
                            {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Mark Resolved
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Request Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-earth-brown-light">Submitted by</p>
                <p className="text-earth-brown-dark font-medium">{request.submittedBy.name}</p>
              </div>
              {request.assignedTo && (
                <div>
                  <p className="text-earth-brown-light">Assigned to</p>
                  <p className="text-earth-brown-dark font-medium">{request.assignedTo.name}</p>
                </div>
              )}
              {request.resolvedBy && (
                <div>
                  <p className="text-earth-brown-light">Resolved by</p>
                  <p className="text-earth-brown-dark font-medium">{request.resolvedBy.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
