'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Users, Loader2, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Pledge {
  id: string
  amount: number
  status: 'PENDING' | 'COMMITTED' | 'PAID' | 'CANCELLED'
  createdAt: string
  member: {
    id: string
    name: string
    email: string
  }
}

interface MemberPledgeListProps {
  cutId: string
  color: 'PURPLE' | 'ORANGE' | 'GREEN'
}

const colorStyles = {
  PURPLE: {
    bg: 'bg-purple-500',
    light: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300'
  },
  ORANGE: {
    bg: 'bg-orange-500',
    light: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300'
  },
  GREEN: {
    bg: 'bg-green-500',
    light: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300'
  }
}

const statusStyles = {
  PENDING: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: Clock
  },
  COMMITTED: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: CheckCircle
  },
  PAID: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: CheckCircle
  },
  CANCELLED: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: XCircle
  }
}

export function MemberPledgeList({ cutId, color }: MemberPledgeListProps) {
  const [pledges, setPledges] = useState<Pledge[]>([])
  const [loading, setLoading] = useState(true)

  const styles = colorStyles[color]

  useEffect(() => {
    fetchPledges()
  }, [cutId])

  async function fetchPledges() {
    try {
      const res = await fetch(`/api/pools/cuts/${cutId}/pledges`)
      if (res.ok) {
        const data = await res.json()
        setPledges(data)
      }
    } catch (err) {
      console.error('Error fetching pledges:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalPledged = pledges
    .filter(p => p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <Card className={cn('border', styles.border)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className={cn('h-5 w-5', styles.text)} />
            <CardTitle className="font-display text-forest-800">Member Pledges</CardTitle>
          </div>
          <div className={cn('px-3 py-1 rounded-full text-sm font-medium', styles.light, styles.text)}>
            ${totalPledged.toLocaleString()} total
          </div>
        </div>
        <CardDescription className="font-body">
          View all pledges made to this color cut
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : pledges.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8 font-body">
            No pledges yet
          </p>
        ) : (
          <div className="space-y-3">
            {pledges.map((pledge) => {
              const StatusIcon = statusStyles[pledge.status].icon
              return (
                <div
                  key={pledge.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 font-body">
                      {pledge.member.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate font-body">
                      {pledge.member.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-body">
                      Pledged {formatRelativeTime(pledge.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                        <DollarSign className="h-4 w-4" />
                        {pledge.amount.toLocaleString()}
                      </div>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      statusStyles[pledge.status].bg,
                      statusStyles[pledge.status].text
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      {pledge.status}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
