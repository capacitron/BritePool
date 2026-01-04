'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
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

const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  EVENT_REMINDER: 'calendar',
  TASK_ASSIGNED: 'clipboard',
  CONTENT_APPROVED: 'check-circle',
  CONTENT_REJECTED: 'x-circle',
  COMMITTEE_INVITE: 'users',
  SYSTEM_ANNOUNCEMENT: 'megaphone',
  POOL_UPDATE: 'trending-up',
  WGO_UPDATE: 'building',
}

function getNotificationTypeColor(type: string): string {
  switch (type) {
    case 'EVENT_REMINDER':
      return 'bg-forest-100 text-forest-700'
    case 'TASK_ASSIGNED':
      return 'bg-earth-100 text-earth-600'
    case 'CONTENT_APPROVED':
      return 'bg-green-100 text-green-700'
    case 'CONTENT_REJECTED':
      return 'bg-red-100 text-red-700'
    case 'COMMITTEE_INVITE':
      return 'bg-sand-200 text-sand-700'
    case 'SYSTEM_ANNOUNCEMENT':
      return 'bg-forest-100 text-forest-600'
    case 'POOL_UPDATE':
      return 'bg-earth-100 text-earth-700'
    case 'WGO_UPDATE':
      return 'bg-sand-200 text-forest-700'
    default:
      return 'bg-sand-100 text-forest-600'
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=10')
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const data: NotificationsResponse = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Refresh when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: [notification.id] }),
        })
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate to link if provided
    if (notification.link) {
      setIsOpen(false)
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
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleViewAll = () => {
    setIsOpen(false)
    router.push('/dashboard/notifications')
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-forest-600 hover:text-forest-800 hover:bg-forest-50"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center bg-earth-500 text-white border-0 text-xs font-semibold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between py-3">
          <span className="text-forest-900 font-display font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-forest-600 hover:text-forest-800"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
            >
              {isMarkingAllRead ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-sand-100 flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-forest-400" />
              </div>
              <p className="text-sm font-medium text-forest-700">No notifications yet</p>
              <p className="text-xs text-forest-500 mt-1">
                We&apos;ll notify you when something important happens
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-3 cursor-pointer focus:bg-forest-50',
                    !notification.isRead && 'bg-forest-50/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={cn(
                      'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                      getNotificationTypeColor(notification.type)
                    )}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm line-clamp-1',
                          notification.isRead ? 'text-forest-700' : 'text-forest-900 font-medium'
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-earth-500" />
                      )}
                    </div>
                    <p className="text-xs text-forest-500 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-forest-400">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.link && <ExternalLink className="h-3 w-3 text-forest-400" />}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm text-forest-600 hover:text-forest-800 hover:bg-forest-50"
            onClick={handleViewAll}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
