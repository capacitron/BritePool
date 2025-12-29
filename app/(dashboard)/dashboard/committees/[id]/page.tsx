'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CommitteeChat, CommitteeDocuments, CommitteeSummary } from '@/components/committee'
import { cn, formatDate } from '@/lib/utils'
import {
  Users,
  Crown,
  ArrowLeft,
  Loader2,
  MessageSquare,
  FolderOpen,
  Sparkles,
  Calendar,
  CheckSquare,
  UserPlus,
  UserMinus,
} from 'lucide-react'

interface CommitteeMember {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface CommitteeTask {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assignedTo: { id: string; name: string } | null
}

interface CommitteeEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  type: string
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
  userMembership: CommitteeMember | null
  members: CommitteeMember[]
  tasks: CommitteeTask[]
  events: CommitteeEvent[]
}

type TabType = 'chat' | 'documents' | 'summary' | 'members'

const committeeTypeColors: Record<string, string> = {
  GOVERNANCE: 'bg-forest-100 text-forest-800',
  WEALTH: 'bg-earth-100 text-earth-800',
  EDUCATION: 'bg-sand-200 text-sand-800',
  HEALTH: 'bg-earth-100 text-earth-700',
  OPERATIONS: 'bg-sand-100 text-sand-700',
}

export default function CommitteeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const committeeId = params.id as string

  const [committee, setCommittee] = useState<Committee | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('chat')

  useEffect(() => {
    fetchCommittee()
    fetchCurrentUser()
  }, [committeeId])

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setCurrentUserId(data.id)
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

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
    if (!confirm('Are you sure you want to leave this committee?')) return

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

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function getRoleBadgeStyles(role: string): string {
    const styles: Record<string, string> = {
      WEB_STEWARD: 'bg-earth-100 text-earth-700 border-earth-300',
      BOARD_CHAIR: 'bg-sand-200 text-sand-800 border-sand-400',
      COMMITTEE_LEADER: 'bg-forest-100 text-forest-700 border-forest-300',
      CONTENT_MODERATOR: 'bg-forest-50 text-forest-600 border-forest-200',
      STEWARD: 'bg-forest-100 text-forest-800 border-forest-300',
      PARTNER: 'bg-earth-50 text-earth-600 border-earth-200',
      RESIDENT: 'bg-sand-50 text-sand-600 border-sand-200',
    }
    return styles[role] || 'bg-sand-100 text-sand-700'
  }

  const isLeader = committee?.userMembership?.role === 'LEADER'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    )
  }

  if (!committee) {
    return (
      <div className="text-center py-12">
        <p className="text-forest-500 font-body">Committee not found</p>
        <Link href="/dashboard/committees">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Committees
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/committees"
            className="flex items-center text-sm text-forest-500 hover:text-forest-700 mb-2 font-body"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Committees
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-forest-800">
              {committee.name}
            </h1>
            <span className={cn(
              'px-3 py-1 text-sm rounded-full font-body',
              committeeTypeColors[committee.type]
            )}>
              {committee.type}
            </span>
          </div>
          {committee.description && (
            <p className="text-forest-500 mt-2 font-body max-w-2xl">
              {committee.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-forest-500 font-body">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {committee.memberCount} members
            </span>
            <span className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              {committee.taskCount} tasks
            </span>
          </div>
        </div>

        <div>
          {committee.isMember ? (
            <Button
              variant="outline"
              onClick={handleLeave}
              disabled={actionLoading}
              className="border-earth-500 text-earth-600 hover:bg-earth-50"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserMinus className="h-4 w-4 mr-2" />
              )}
              Leave Committee
            </Button>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={actionLoading}
              className="bg-forest-600 hover:bg-forest-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Join Committee
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      {committee.isMember && (
        <div className="flex gap-2 border-b border-sand-200 pb-2">
          {[
            { id: 'chat' as TabType, label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
            { id: 'documents' as TabType, label: 'Documents', icon: <FolderOpen className="h-4 w-4" /> },
            { id: 'summary' as TabType, label: 'AI Summary', icon: <Sparkles className="h-4 w-4" /> },
            { id: 'members' as TabType, label: 'Members', icon: <Users className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg font-body transition-colors',
                activeTab === tab.id
                  ? 'bg-forest-600 text-white'
                  : 'text-forest-600 hover:bg-sand-100'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {committee.isMember ? (
        <div className="min-h-[500px]">
          {activeTab === 'chat' && (
            <CommitteeChat
              committeeId={committeeId}
              currentUserId={currentUserId}
            />
          )}

          {activeTab === 'documents' && (
            <CommitteeDocuments
              committeeId={committeeId}
              currentUserId={currentUserId}
              isLeader={isLeader}
            />
          )}

          {activeTab === 'summary' && (
            <CommitteeSummary
              committeeId={committeeId}
              isLeader={isLeader}
            />
          )}

          {activeTab === 'members' && (
            <Card className="border-sand-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-forest-800">
                  <Users className="h-5 w-5 text-forest-500" />
                  Committee Members ({committee.memberCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {committee.members.map((member) => (
                    <div
                      key={member.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border',
                        member.role === 'LEADER'
                          ? 'bg-earth-50 border-earth-200'
                          : 'bg-sand-50 border-sand-200'
                      )}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-forest-600 text-white">
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-forest-800 truncate font-body">
                            {member.user.name}
                          </p>
                          {member.role === 'LEADER' && (
                            <Crown className="h-4 w-4 text-earth-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-forest-500 font-body">
                          {member.user.role.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-forest-400 font-body">
                          Joined {formatDate(member.joinedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Non-member view */
        <Card className="border-sand-200">
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto text-forest-300 mb-4" />
            <h3 className="text-xl font-display font-bold text-forest-800 mb-2">
              Join to Access Committee Features
            </h3>
            <p className="text-forest-500 font-body max-w-md mx-auto">
              Join this committee to access chat groups, shared documents, and AI-powered weekly summaries.
            </p>
            <Button
              onClick={handleJoin}
              disabled={actionLoading}
              className="mt-6 bg-forest-600 hover:bg-forest-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Join Committee
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {committee.events.length > 0 && (
        <Card className="border-sand-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-forest-800">
              <Calendar className="h-5 w-5 text-forest-500" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {committee.events.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-sand-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-forest-800 font-body">{event.title}</p>
                    <p className="text-sm text-forest-500 font-body">
                      {formatDate(event.startTime)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-forest-100 text-forest-700 rounded-full font-body">
                    {event.type.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
