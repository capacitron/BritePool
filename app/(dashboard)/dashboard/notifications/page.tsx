'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Loader2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

function getNotificationTypeColor(type: string): string {
  switch (type) {
    case 'EVENT_REMINDER':
      return 'bg-forest-100 text-forest-700 border-forest-200'
    case 'TASK_ASSIGNED':
      return 'bg-earth-100 text-earth-600 border-earth-200'
    case 'CONTENT_APPROVED':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'CONTENT_REJECTED':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'COMMITTEE_INVITE':
      return 'bg-sand-200 text-sand-700 border-sand-300'
    case 'SYSTEM_ANNOUNCEMENT':
      return 'bg-forest-100 text-forest-600 border-forest-200'
    case 'POOL_UPDATE':
      return 'bg-earth-100 text-earth-700 border-earth-200'
    case 'WGO_UPDATE':
      return 'bg-sand-200 text-forest-700 border-sand-300'
    default:
      return 'bg-sand-100 text-forest-600 border-sand-200'
  }
}

function getNotificationTypeLabel(type: string): string {
  switch (type) {
    case 'EVENT_REMINDER':
      return 'Event'
    case 'TASK_ASSIGNED':
      return 'Task'
    case 'CONTENT_APPROVED':
      return 'Approved'
    case 'CONTENT_REJECTED':
      return 'Rejected'
    case 'COMMITTEE_INVITE':
      return 'Invite'
    case 'SYSTEM_ANNOUNCEMENT':
      return 'System'
    case 'POOL_UPDATE':
      return 'Pool'
    case 'WGO_UPDATE':
      return 'WGO'
    default:
      return 'Notification'
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export default function NotificationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>(
    (searchParams.get('filter') as 'all' | 'unread' | 'read') || 'all'
  )

  const fetchNotifications = useCallback(
    async (page = 1) => {
      setIsLoading(true)
      try {
        let url = `/api/notifications?page=${page}&limit=20`
        if (filter === 'unread') {
          url += '&isRead=false'
        } else if (filter === 'read') {
          url += '&isRead=true'
        }

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch notifications')
        }

        const data: NotificationsResponse = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
        setPagination(data.pagination)
      } catch {
        // Failed to fetch notifications
      } finally {
        setIsLoading(false)
      }
    },
    [filter]
  )

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleFilterChange = (newFilter: 'all' | 'unread' | 'read') => {
    setFilter(newFilter)
    setSelectedNotifications(new Set())
    // Update URL without navigation
    const url = new URL(window.location.href)
    if (newFilter === 'all') {
      url.searchParams.delete('filter')
    } else {
      url.searchParams.set('filter', newFilter)
    }
    window.history.replaceState({}, '', url.toString())
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: [notification.id] }),
        })
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // Failed to mark notification as read
      }
    }

    // Navigate to link if provided
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return

    setIsMarkingAllRead(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch {
      // Failed to mark all as read
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleMarkSelectedRead = async () => {
    if (selectedNotifications.size === 0) return

    const notificationIds = Array.from(selectedNotifications)

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (selectedNotifications.has(n.id) ? { ...n, isRead: true } : n))
        )
        const unreadSelected = notifications.filter(
          (n) => selectedNotifications.has(n.id) && !n.isRead
        ).length
        setUnreadCount((prev) => Math.max(0, prev - unreadSelected))
        setSelectedNotifications(new Set())
      }
    } catch {
      // Failed to mark selected as read
    }
  }

  const toggleSelectNotification = (id: string) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(notifications.map((n) => n.id)))
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchNotifications(newPage)
      setSelectedNotifications(new Set())
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-forest-900">Notifications</h1>
          <p className="text-forest-600 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'You are all caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <Select
            value={filter}
            onValueChange={(v) => handleFilterChange(v as 'all' | 'unread' | 'read')}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2 text-forest-500" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
              className="text-forest-600 border-forest-200 hover:bg-forest-50"
            >
              {isMarkingAllRead ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <Card className="border-forest-200 bg-forest-50">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm text-forest-700">
              {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkSelectedRead}
                className="text-forest-600 hover:text-forest-800"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNotifications(new Set())}
                className="text-forest-500 hover:text-forest-700"
              >
                Clear selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card className="border-sand-200">
        <CardHeader className="border-b border-sand-200 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display">
              {filter === 'all'
                ? 'All Notifications'
                : filter === 'unread'
                  ? 'Unread Notifications'
                  : 'Read Notifications'}
            </CardTitle>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="text-forest-600 hover:text-forest-800"
              >
                {selectedNotifications.size === notifications.length
                  ? 'Deselect all'
                  : 'Select all'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-sand-200">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-forest-400" />
              </div>
              <h3 className="text-lg font-display font-semibold text-forest-800">
                No notifications
              </h3>
              <p className="text-sm text-forest-500 mt-1 max-w-xs">
                {filter === 'unread'
                  ? "You don't have any unread notifications. Great job staying on top of things!"
                  : filter === 'read'
                    ? "You haven't read any notifications yet."
                    : "You don't have any notifications yet. We'll notify you when something important happens."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-sand-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-4 p-4 transition-colors hover:bg-forest-50/50',
                    !notification.isRead && 'bg-forest-50/30',
                    selectedNotifications.has(notification.id) && 'bg-forest-100/50'
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelectNotification(notification.id)}
                    className={cn(
                      'shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-1',
                      selectedNotifications.has(notification.id)
                        ? 'bg-forest-600 border-forest-600 text-white'
                        : 'border-sand-300 hover:border-forest-400'
                    )}
                    aria-label={`Select notification: ${notification.title}`}
                  >
                    {selectedNotifications.has(notification.id) && <Check className="h-3 w-3" />}
                  </button>

                  {/* Type Badge */}
                  <div
                    className={cn(
                      'shrink-0 px-2.5 py-1 rounded-md text-xs font-medium border',
                      getNotificationTypeColor(notification.type)
                    )}
                  >
                    {getNotificationTypeLabel(notification.type)}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          'text-sm',
                          notification.isRead ? 'text-forest-700' : 'text-forest-900 font-semibold'
                        )}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="shrink-0 w-2.5 h-2.5 mt-1 rounded-full bg-earth-500" />
                      )}
                    </div>
                    <p className="text-sm text-forest-600 mt-1">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-forest-400">
                        {formatDate(notification.createdAt)}
                      </span>
                      {notification.link && (
                        <span className="flex items-center gap-1 text-xs text-forest-500 hover:text-forest-700">
                          <ExternalLink className="h-3 w-3" />
                          View details
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-sand-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-forest-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="text-forest-600 border-sand-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-forest-600 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasMore}
                className="text-forest-600 border-sand-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
