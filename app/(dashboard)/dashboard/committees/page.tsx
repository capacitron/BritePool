'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Crown, ArrowRight, Loader2 } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-forest-800">
          Committees
        </h1>
        <p className="text-forest-500 mt-1 font-body">
          Join committees to participate in community governance and activities
        </p>
      </div>

      {committees.length === 0 ? (
        <Card className="border-sand-200">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-forest-400 mb-4" />
            <p className="text-forest-500 font-body">No committees available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees.map((committee) => (
            <Card key={committee.id} className="border-sand-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 font-body ${committeeTypeColors[committee.type] || 'bg-sand-100 text-sand-800'}`}>
                      {committee.type}
                    </span>
                    <CardTitle className="text-xl font-display text-forest-800">{committee.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="line-clamp-2 text-forest-500 font-body">
                  {committee.description || 'No description provided'}
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

                <div className="flex items-center gap-2">
                  {committee.isMember ? (
                    <>
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
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </>
                  ) : (
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
