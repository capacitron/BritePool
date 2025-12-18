'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime, formatDateTime } from '@/lib/utils'
import {
  Users,
  Building2,
  CheckSquare,
  Calendar,
  ArrowRight,
  Megaphone,
  Clock,
  BookOpen,
  FileText,
  MessageSquare,
  Wrench,
  Loader2,
  AlertTriangle,
  Info,
  AlertCircle,
} from 'lucide-react'

interface DashboardStats {
  metrics: {
    totalMembers: number
    activeCommittees: number
    openTasks: number
    upcomingEvents: number
  }
  announcements: {
    id: string
    title: string
    content: string
    priority: 'URGENT' | 'IMPORTANT' | 'INFO'
    isPinned: boolean
    publishedAt: string
  }[]
  activityFeed: {
    id: string
    type: 'participation' | 'event' | 'task'
    title: string
    description: string
    timestamp: string | null
  }[]
}

const quickLinks = [
  { href: '/dashboard/committees', label: 'Committees', icon: Users, color: 'text-sage' },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, color: 'text-sky-soft' },
  { href: '/dashboard/events', label: 'Events', icon: Calendar, color: 'text-terracotta' },
  { href: '/dashboard/courses', label: 'Courses', icon: BookOpen, color: 'text-earth-brown' },
  { href: '/dashboard/documents', label: 'Documents', icon: FileText, color: 'text-purple-500' },
  { href: '/dashboard/forums', label: 'Forums', icon: MessageSquare, color: 'text-teal-500' },
  { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, color: 'text-orange-500' },
]

export default function StakeholderDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch dashboard stats')
      }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  function getPriorityIcon(priority: string) {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'IMPORTANT':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  function getPriorityStyles(priority: string) {
    switch (priority) {
      case 'URGENT':
        return 'border-l-red-500 bg-red-50'
      case 'IMPORTANT':
        return 'border-l-amber-500 bg-amber-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'participation':
        return <Clock className="h-4 w-4 text-sage" />
      case 'event':
        return <Calendar className="h-4 w-4 text-sky-soft" />
      case 'task':
        return <CheckSquare className="h-4 w-4 text-terracotta" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-earth-brown" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-earth-brown-light">{error}</p>
        <Button onClick={fetchStats} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">Stakeholder Dashboard</h1>
        <p className="text-earth-brown-light mt-1">Community overview and key metrics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.metrics.totalMembers || 0}</div>
            <p className="text-xs text-earth-brown-light mt-1">Active community members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Committees</CardTitle>
            <Building2 className="h-4 w-4 text-sky-soft" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.metrics.activeCommittees || 0}</div>
            <p className="text-xs text-earth-brown-light mt-1">Working groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-terracotta" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.metrics.openTasks || 0}</div>
            <p className="text-xs text-earth-brown-light mt-1">Pending completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-earth-brown" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.metrics.upcomingEvents || 0}</div>
            <p className="text-xs text-earth-brown-light mt-1">Scheduled activities</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-terracotta" />
              Announcements
            </CardTitle>
            <CardDescription>Latest community updates and notices</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.announcements && stats.announcements.length > 0 ? (
              <div className="space-y-3">
                {stats.announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={cn(
                      'p-4 rounded-lg border-l-4',
                      getPriorityStyles(announcement.priority)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(announcement.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-earth-dark">{announcement.title}</h4>
                          {announcement.isPinned && (
                            <span className="px-2 py-0.5 bg-earth-brown text-white text-xs rounded-full">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-earth-brown-light mt-1 line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-earth-brown-light mt-2">
                          {formatRelativeTime(announcement.publishedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-earth-brown-light py-8">No announcements at this time</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-sage" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest community activities</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.activityFeed && stats.activityFeed.length > 0 ? (
              <div className="space-y-4">
                {stats.activityFeed.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-earth-dark line-clamp-1">
                        {activity.title}
                      </p>
                      <p className="text-xs text-earth-brown-light line-clamp-1">
                        {activity.description}
                      </p>
                      {activity.timestamp && (
                        <p className="text-xs text-earth-brown-light mt-1">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-earth-brown-light py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Navigate to major sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Button
                  key={link.href}
                  asChild
                  variant="outline"
                  className="h-auto py-4 justify-start"
                >
                  <Link href={link.href}>
                    <Icon className={cn('h-5 w-5 mr-3', link.color)} />
                    <span className="font-medium">{link.label}</span>
                    <ArrowRight className="h-4 w-4 ml-auto text-earth-brown-light" />
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
