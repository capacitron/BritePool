'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, Crown, ArrowLeft, Loader2, Calendar, 
  CheckSquare, User, Clock
} from 'lucide-react'

interface Member {
  id: string
  userId: string
  role: string
  joinedAt: string
  user: { id: string; name: string; email: string; role: string }
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assignedTo: { id: string; name: string } | null
}

interface Event {
  id: string
  title: string
  startTime: string
  endTime: string
  location: string | null
}

interface Committee {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  memberCount: number
  taskCount: number
  isMember: boolean
  members: Member[]
  tasks: Task[]
  events: Event[]
}

const roleLabels: Record<string, string> = {
  LEADER: 'Chair',
  MEMBER: 'Member',
}

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-blue-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
}

export default function CommitteeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const committeeId = params.committeeId as string

  const [committee, setCommittee] = useState<Committee | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchCommittee()
  }, [committeeId])

  async function fetchCommittee() {
    try {
      const res = await fetch(`/api/committees/${committeeId}`)
      if (res.ok) {
        const data = await res.json()
        setCommittee(data)
      } else if (res.status === 404) {
        router.push('/dashboard/committees')
      }
    } catch (error) {
      console.error('Failed to fetch committee:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/committees/${committeeId}/members`, {
        method: 'POST',
      })
      if (res.ok) {
        await fetchCommittee()
      }
    } catch (error) {
      console.error('Failed to join committee:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleLeave() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/committees/${committeeId}/members`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchCommittee()
      }
    } catch (error) {
      console.error('Failed to leave committee:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-earth-brown" />
      </div>
    )
  }

  if (!committee) {
    return (
      <div className="text-center py-12">
        <p className="text-earth-brown-light">Committee not found</p>
        <Link href="/dashboard/committees">
          <Button className="mt-4">Back to Committees</Button>
        </Link>
      </div>
    )
  }

  const leader = committee.members.find(m => m.role === 'LEADER')
  const members = committee.members.filter(m => m.role === 'MEMBER')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/committees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{committee.name}</CardTitle>
              <CardDescription className="mt-2">
                {committee.description || 'No description provided'}
              </CardDescription>
            </div>
            {committee.isMember ? (
              <Button
                variant="outline"
                onClick={handleLeave}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Leave Committee'
                )}
              </Button>
            ) : (
              <Button onClick={handleJoin} disabled={actionLoading}>
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Join Committee'
                )}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-earth-brown-light">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{committee.memberCount} members</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              <span>{committee.taskCount} tasks</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {committee.members.length === 0 ? (
              <p className="text-earth-brown-light text-sm">No members yet</p>
            ) : (
              <div className="space-y-3">
                {leader && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center">
                        <Crown className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="font-medium">{leader.user.name}</p>
                        <p className="text-xs text-earth-brown-light">{leader.user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                      Chair
                    </span>
                  </div>
                )}
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-stone-warm rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-earth-brown-light/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-earth-brown" />
                      </div>
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-xs text-earth-brown-light">{member.user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-earth-brown-light">
                      {roleLabels[member.role] || member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {committee.tasks.length === 0 ? (
              <p className="text-earth-brown-light text-sm">No tasks assigned to this committee</p>
            ) : (
              <div className="space-y-3">
                {committee.tasks.slice(0, 5).map((task) => (
                  <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                    <div className="p-3 bg-stone-warm rounded-lg hover:bg-stone transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          {task.assignedTo && (
                            <p className="text-xs text-earth-brown-light mt-1">
                              Assigned to: {task.assignedTo.name}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[task.status] || 'bg-gray-100'}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${priorityColors[task.priority]}`}>
                          <Clock className="h-3 w-3" />
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                {committee.tasks.length > 5 && (
                  <p className="text-xs text-earth-brown-light text-center pt-2">
                    + {committee.tasks.length - 5} more tasks
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {committee.events.length === 0 ? (
            <p className="text-earth-brown-light text-sm">No upcoming meetings scheduled</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {committee.events.map((event) => (
                <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                  <div className="p-4 bg-stone-warm rounded-lg hover:bg-stone transition-colors">
                    <p className="font-medium">{event.title}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-earth-brown-light">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(event.startTime).toLocaleDateString()} at{' '}
                        {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {event.location && (
                      <p className="text-xs text-earth-brown-light mt-1">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
