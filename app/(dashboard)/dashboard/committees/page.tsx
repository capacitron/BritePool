'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Users,
  Crown,
  ArrowRight,
  Loader2,
  MessageSquare,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react'

interface Committee {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  memberCount: number
  taskCount: number
  leader: { id: string; name: string; role: string } | null
  isMember: boolean
}

const committeeTypeColors: Record<string, string> = {
  GOVERNANCE: 'bg-forest-100 text-forest-800',
  WEALTH: 'bg-earth-100 text-earth-800',
  EDUCATION: 'bg-sand-200 text-sand-800',
  HEALTH: 'bg-earth-100 text-earth-700',
  OPERATIONS: 'bg-sand-100 text-sand-700',
}

const committeeTypeDescriptions: Record<string, string> = {
  GOVERNANCE: 'Community decision-making and policy',
  WEALTH: 'Financial planning and resources',
  EDUCATION: 'Learning and development programs',
  HEALTH: 'Wellness and healthcare initiatives',
  OPERATIONS: 'Day-to-day operations and logistics',
}

export default function CommitteesPage() {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchCommittees()
  }, [])

  async function fetchCommittees() {
    try {
      const res = await fetch('/api/committees')
      if (res.ok) {
        const data = await res.json()
        setCommittees(data)
      }
    } catch (error) {
      console.error('Failed to fetch committees:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(committeeId: string) {
    setActionLoading(committeeId)
    try {
      const res = await fetch(`/api/committees/${committeeId}/members`, {
        method: 'POST',
      })
      if (res.ok) {
        await fetchCommittees()
      }
    } catch (error) {
      console.error('Failed to join committee:', error)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleLeave(committeeId: string) {
    setActionLoading(committeeId)
    try {
      const res = await fetch(`/api/committees/${committeeId}/members`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchCommittees()
      }
    } catch (error) {
      console.error('Failed to leave committee:', error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    )
  }

  const joinedCommittees = committees.filter((c) => c.isMember)
  const availableCommittees = committees.filter((c) => !c.isMember)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-forest-800">
          Committees
        </h1>
        <p className="text-forest-500 mt-1 font-body">
          Join committees to participate in community governance and activities
        </p>
      </div>

      {/* Joined Committees Section */}
      {joinedCommittees.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-forest-600" />
            <h2 className="text-xl font-display font-semibold text-forest-800">
              My Committees ({joinedCommittees.length})
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedCommittees.map((committee) => (
              <Card
                key={committee.id}
                className="border-forest-200 bg-forest-50/50 hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          'inline-block px-2 py-1 text-xs font-medium rounded-full font-body',
                          committeeTypeColors[committee.type] || 'bg-sand-100 text-sand-800'
                        )}>
                          {committee.type}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-forest-100 text-forest-700 rounded-full font-body">
                          <CheckCircle2 className="h-3 w-3" />
                          Joined
                        </span>
                      </div>
                      <CardTitle className="text-xl font-display text-forest-800">
                        {committee.name}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 text-forest-500 font-body">
                    {committee.description || committeeTypeDescriptions[committee.type]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-forest-500 font-body">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{committee.memberCount} members</span>
                    </div>
                    {committee.leader && (
                      <div className="flex items-center gap-1">
                        <Crown className="h-4 w-4 text-earth-500" />
                        <span>{committee.leader.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick access features */}
                  <div className="flex gap-2 text-xs text-forest-500">
                    <span className="flex items-center gap-1 px-2 py-1 bg-white rounded-md">
                      <MessageSquare className="h-3 w-3" />
                      Chat
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-white rounded-md">
                      <FolderOpen className="h-3 w-3" />
                      Docs
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeave(committee.id)}
                      disabled={actionLoading === committee.id}
                      className="border-forest-600 text-forest-700 hover:bg-forest-600 hover:text-white"
                    >
                      {actionLoading === committee.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Leave'
                      )}
                    </Button>
                    <Link href={`/dashboard/committees/${committee.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-forest-600 hover:bg-forest-700 text-white">
                        Enter Committee
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Available Committees Section */}
      <section>
        <h2 className="text-xl font-display font-semibold text-forest-800 mb-4">
          {joinedCommittees.length > 0 ? 'Other Committees' : 'All Committees'}
        </h2>

        {availableCommittees.length === 0 && joinedCommittees.length === 0 ? (
          <Card className="border-sand-200">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-forest-400 mb-4" />
              <p className="text-forest-500 font-body">No committees available yet</p>
            </CardContent>
          </Card>
        ) : availableCommittees.length === 0 ? (
          <Card className="border-sand-200">
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-forest-400 mb-3" />
              <p className="text-forest-500 font-body">
                You've joined all available committees!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCommittees.map((committee) => (
              <Card
                key={committee.id}
                className="border-sand-200 hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={cn(
                        'inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 font-body',
                        committeeTypeColors[committee.type] || 'bg-sand-100 text-sand-800'
                      )}>
                        {committee.type}
                      </span>
                      <CardTitle className="text-xl font-display text-forest-800">
                        {committee.name}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 text-forest-500 font-body">
                    {committee.description || committeeTypeDescriptions[committee.type]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-forest-500 font-body">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{committee.memberCount} members</span>
                    </div>
                    {committee.leader && (
                      <div className="flex items-center gap-1">
                        <Crown className="h-4 w-4 text-earth-500" />
                        <span>{committee.leader.name}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-forest-600 hover:bg-forest-700 text-white"
                    onClick={() => handleJoin(committee.id)}
                    disabled={actionLoading === committee.id}
                  >
                    {actionLoading === committee.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Join Committee'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
