'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Notification type matching the server-side RealtimeNotification
 */
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  metadata?: Record<string, unknown>
  createdAt: string
  isRead?: boolean
}

/**
 * Broadcast update type
 */
export interface BroadcastUpdate {
  channel: string
  payload: unknown
  timestamp: string
}

/**
 * Connection states for the SSE connection
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Options for the useRealtimeNotifications hook
 */
export interface UseRealtimeNotificationsOptions {
  /** Enable/disable the connection (default: true) */
  enabled?: boolean
  /** Maximum number of notifications to keep in memory (default: 50) */
  maxNotifications?: number
  /** Auto-reconnect delay in ms (default: 3000) */
  reconnectDelay?: number
  /** Maximum reconnect attempts (default: 10) */
  maxReconnectAttempts?: number
  /** Callback for new notifications */
  onNotification?: (notification: Notification) => void
  /** Callback for broadcast updates */
  onUpdate?: (update: BroadcastUpdate) => void
  /** Callback for connection state changes */
  onConnectionChange?: (state: ConnectionState) => void
}

/**
 * Return type for the useRealtimeNotifications hook
 */
export interface UseRealtimeNotificationsReturn {
  /** Array of received notifications */
  notifications: Notification[]
  /** Count of unread notifications */
  unreadCount: number
  /** Current connection state */
  connectionState: ConnectionState
  /** Mark a notification as read */
  markAsRead: (notificationId: string) => void
  /** Mark all notifications as read */
  markAllAsRead: () => void
  /** Clear all notifications from local state */
  clearNotifications: () => void
  /** Manually reconnect */
  reconnect: () => void
  /** Manually disconnect */
  disconnect: () => void
}

/**
 * React hook for subscribing to Server-Sent Events (SSE) notifications
 * Provides real-time notification updates with auto-reconnect capability
 *
 * @param options - Configuration options for the hook
 * @returns Object containing notifications, unread count, and control functions
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, connectionState } = useRealtimeNotifications({
 *   onNotification: (notification) => {
 *     toast.info(notification.title)
 *   }
 * })
 * ```
 */
export function useRealtimeNotifications(
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn {
  const {
    enabled = true,
    maxNotifications = 50,
    reconnectDelay = 3000,
    maxReconnectAttempts = 10,
    onNotification,
    onUpdate,
    onConnectionChange,
  } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isManualDisconnectRef = useRef(false)

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Update connection state and notify
  const updateConnectionState = useCallback(
    (state: ConnectionState) => {
      setConnectionState(state)
      onConnectionChange?.(state)
    },
    [onConnectionChange]
  )

  // Mark a single notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  // Disconnect function
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true
    cleanup()
    updateConnectionState('disconnected')
  }, [cleanup, updateConnectionState])

  // Connect function
  const connect = useCallback(() => {
    // Don't connect if disabled or already connected
    if (!enabled || eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    // Cleanup any existing connection
    cleanup()
    isManualDisconnectRef.current = false
    updateConnectionState('connecting')

    try {
      const eventSource = new EventSource('/api/realtime/notifications')
      eventSourceRef.current = eventSource

      // Handle connection open
      eventSource.addEventListener('connected', (event) => {
        reconnectAttemptsRef.current = 0
        updateConnectionState('connected')

        try {
          const data = JSON.parse(event.data)
          console.log('SSE connected:', data.message)
        } catch {
          // Ignore parse errors for connection message
        }
      })

      // Handle heartbeat (keep-alive)
      eventSource.addEventListener('heartbeat', () => {
        // Connection is alive, reset reconnect attempts
        reconnectAttemptsRef.current = 0
      })

      // Handle notifications
      eventSource.addEventListener('notification', (event) => {
        try {
          const notification: Notification = JSON.parse(event.data)
          notification.isRead = false

          setNotifications((prev) => {
            // Add to beginning and limit total count
            const updated = [notification, ...prev].slice(0, maxNotifications)
            return updated
          })

          onNotification?.(notification)
        } catch (error) {
          console.error('Error parsing notification:', error)
        }
      })

      // Handle broadcast updates
      eventSource.addEventListener('update', (event) => {
        try {
          const update: BroadcastUpdate = JSON.parse(event.data)
          onUpdate?.(update)
        } catch (error) {
          console.error('Error parsing update:', error)
        }
      })

      // Handle errors
      eventSource.onerror = () => {
        // Only attempt reconnect if not manually disconnected
        if (isManualDisconnectRef.current) {
          return
        }

        cleanup()
        updateConnectionState('error')

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current)
          reconnectAttemptsRef.current++

          console.log(
            `SSE reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          console.error('SSE max reconnection attempts reached')
          updateConnectionState('disconnected')
        }
      }
    } catch (error) {
      console.error('Error creating EventSource:', error)
      updateConnectionState('error')
    }
  }, [
    enabled,
    cleanup,
    updateConnectionState,
    maxNotifications,
    maxReconnectAttempts,
    reconnectDelay,
    onNotification,
    onUpdate,
  ])

  // Reconnect function (public API)
  const reconnect = useCallback(() => {
    isManualDisconnectRef.current = false
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  // Set up connection on mount and cleanup on unmount
  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      cleanup()
    }
  }, [enabled, connect, cleanup])

  // Handle visibility change (reconnect when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && !isManualDisconnectRef.current) {
        // Check if connection is closed and reconnect
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          reconnect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, reconnect])

  return {
    notifications,
    unreadCount,
    connectionState,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    reconnect,
    disconnect,
  }
}

export default useRealtimeNotifications
