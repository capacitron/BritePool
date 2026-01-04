import { EventEmitter } from 'events'

/**
 * Notification type for real-time events
 */
export interface RealtimeNotification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

/**
 * Update payload for broadcast events
 */
export interface BroadcastUpdate {
  channel: string
  payload: unknown
  timestamp: string
}

/**
 * Singleton EventEmitter for broadcasting real-time updates
 * This is used server-side to coordinate between the notification
 * creation logic and the SSE connections
 */
class RealtimeEventEmitter extends EventEmitter {
  private static instance: RealtimeEventEmitter

  private constructor() {
    super()
    // Increase max listeners to handle multiple concurrent SSE connections
    this.setMaxListeners(1000)
  }

  static getInstance(): RealtimeEventEmitter {
    if (!RealtimeEventEmitter.instance) {
      RealtimeEventEmitter.instance = new RealtimeEventEmitter()
    }
    return RealtimeEventEmitter.instance
  }
}

// Export singleton instance
export const realtimeEmitter = RealtimeEventEmitter.getInstance()

/**
 * Broadcast a notification to a specific user
 * This function should be called whenever a new notification is created
 *
 * @param userId - The ID of the user to send the notification to
 * @param notification - The notification data to send
 */
export function broadcastNotification(userId: string, notification: RealtimeNotification): void {
  if (!userId || !notification) {
    console.warn('broadcastNotification called with invalid parameters')
    return
  }

  // Emit to the user-specific channel
  realtimeEmitter.emit(`notification:${userId}`, notification)
}

/**
 * Broadcast an update to all connected clients on a specific channel
 * Useful for system-wide updates, announcements, or shared resource changes
 *
 * @param channel - The channel name for categorizing the update
 * @param data - The data payload to broadcast
 */
export function broadcastUpdate(channel: string, data: unknown): void {
  if (!channel) {
    console.warn('broadcastUpdate called without channel')
    return
  }

  const update: BroadcastUpdate = {
    channel,
    payload: data,
    timestamp: new Date().toISOString(),
  }

  realtimeEmitter.emit('broadcast', update)
}

/**
 * Broadcast a notification to multiple users
 *
 * @param userIds - Array of user IDs to notify
 * @param notification - The notification data to send
 */
export function broadcastNotificationToMany(
  userIds: string[],
  notification: Omit<RealtimeNotification, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): void {
  if (!userIds || userIds.length === 0) {
    console.warn('broadcastNotificationToMany called without userIds')
    return
  }

  const fullNotification: RealtimeNotification = {
    id: notification.id || crypto.randomUUID(),
    createdAt: notification.createdAt || new Date().toISOString(),
    ...notification,
  }

  userIds.forEach((userId) => {
    broadcastNotification(userId, fullNotification)
  })
}

/**
 * Get the current number of listeners for a specific user's notification channel
 * Useful for debugging and monitoring
 *
 * @param userId - The user ID to check
 * @returns Number of active listeners
 */
export function getActiveListenerCount(userId: string): number {
  return realtimeEmitter.listenerCount(`notification:${userId}`)
}

/**
 * Get total number of broadcast listeners
 *
 * @returns Number of active broadcast listeners
 */
export function getTotalBroadcastListeners(): number {
  return realtimeEmitter.listenerCount('broadcast')
}
