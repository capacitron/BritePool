'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  DollarSign,
  Briefcase,
  CheckSquare,
  Calendar,
  Users,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserStats {
  unreadNotifications: number
  activePledges: number
  wgoInvolvements: number
  pendingTasks: number
  upcomingEvents: number
  committeeMemberships: number
}

interface DashboardStatsProps {
  userId: string
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/user-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  if (loading) {
    return <DashboardStatsSkeleton />
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600 text-center">
            Failed to load statistics. Please try again later.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const statItems = [
    {
      label: 'Unread Notifications',
      value: stats.unreadNotifications,
      icon: Bell,
      href: '/dashboard/notifications',
      color: 'forest',
      gradient: 'from-forest-500 to-forest-300',
      bgColor: 'bg-forest-100',
      iconColor: 'text-forest-600',
      hoverBg: 'group-hover:bg-forest-200',
      highlight: stats.unreadNotifications > 0,
    },
    {
      label: 'Active Pledges',
      value: stats.activePledges,
      icon: DollarSign,
      href: '/dashboard/pools',
      color: 'earth',
      gradient: 'from-earth-500 to-earth-300',
      bgColor: 'bg-earth-100',
      iconColor: 'text-earth-600',
      hoverBg: 'group-hover:bg-earth-200',
    },
    {
      label: 'WGO Involvements',
      value: stats.wgoInvolvements,
      icon: Briefcase,
      href: '/dashboard/wgo',
      color: 'sand',
      gradient: 'from-sand-500 to-sand-300',
      bgColor: 'bg-sand-200',
      iconColor: 'text-sand-700',
      hoverBg: 'group-hover:bg-sand-300',
    },
    {
      label: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: CheckSquare,
      href: '/dashboard/tasks',
      color: 'forest',
      gradient: 'from-forest-600 to-forest-400',
      bgColor: 'bg-forest-100',
      iconColor: 'text-forest-600',
      hoverBg: 'group-hover:bg-forest-200',
      highlight: stats.pendingTasks > 0,
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      href: '/dashboard/events',
      color: 'earth',
      gradient: 'from-earth-600 to-earth-400',
      bgColor: 'bg-earth-100',
      iconColor: 'text-earth-600',
      hoverBg: 'group-hover:bg-earth-200',
    },
    {
      label: 'Committees',
      value: stats.committeeMemberships,
      icon: Users,
      href: '/dashboard/committees',
      color: 'forest',
      gradient: 'from-forest-700 to-forest-500',
      bgColor: 'bg-forest-100',
      iconColor: 'text-forest-600',
      hoverBg: 'group-hover:bg-forest-200',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Activity Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.label} href={item.href}>
              <Card
                className={cn(
                  'group border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative cursor-pointer',
                  item.highlight && 'ring-2 ring-earth-400/50'
                )}
              >
                <div
                  className={cn('absolute top-0 left-0 w-1 h-full bg-gradient-to-b', item.gradient)}
                />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-forest-600 font-body uppercase tracking-wide">
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'text-3xl font-display font-bold',
                        item.highlight ? 'text-earth-600' : 'text-forest-800'
                      )}
                    >
                      {item.value}
                    </div>
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                        item.bgColor,
                        item.hoverBg
                      )}
                    >
                      <Icon className={cn('h-5 w-5', item.iconColor)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions Bar */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-forest-50 via-white to-earth-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-forest-600" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-forest-800">Quick Actions</h3>
                <p className="text-sm text-forest-600 font-body">Access your most used features</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                variant="default"
                size="sm"
                className="bg-forest-600 hover:bg-forest-700"
              >
                <Link href="/dashboard/notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  View Notifications
                  {stats.unreadNotifications > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-earth-400 text-white text-xs rounded-full">
                      {stats.unreadNotifications}
                    </span>
                  )}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-forest-300 hover:bg-forest-50"
              >
                <Link href="/dashboard/pools">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Browse Pools
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-forest-300 hover:bg-forest-50"
              >
                <Link href="/dashboard/wgo">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Check WGOs
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-forest-300 hover:bg-forest-50"
              >
                <Link href="/dashboard/tasks">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  View Tasks
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardStatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardHeader className="pb-2 pt-4 px-4">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-12" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
