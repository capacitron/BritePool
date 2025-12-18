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
  GOVERNANCE: 'bg-purple-100 text-purple-800',
  WEALTH: 'bg-green-100 text-green-800',
  EDUCATION: 'bg-blue-100 text-blue-800',
  HEALTH: 'bg-rose-100 text-rose-800',
  OPERATIONS: 'bg-amber-100 text-amber-800',
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
        <Loader2 className="h-8 w-8 animate-spin text-earth-brown" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
          Committees
        </h1>
        <p className="text-earth-brown-light mt-1">
          Join committees to participate in community governance and activities
        </p>
      </div>

      {committees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
            <p className="text-earth-brown-light">No committees available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees.map((committee) => (
            <Card key={committee.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${committeeTypeColors[committee.type] || 'bg-gray-100 text-gray-800'}`}>
                      {committee.type}
                    </span>
                    <CardTitle className="text-xl">{committee.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {committee.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-earth-brown-light">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{committee.memberCount} members</span>
                  </div>
                  {committee.leader && (
                    <div className="flex items-center gap-1">
                      <Crown className="h-4 w-4 text-amber-500" />
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
                      >
                        {actionLoading === committee.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Leave'
                        )}
                      </Button>
                      <Link href={`/dashboard/committees/${committee.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
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
