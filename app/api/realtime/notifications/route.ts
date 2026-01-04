import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { realtimeEmitter, type RealtimeNotification } from '@/lib/realtime'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { logError } from '@/lib/api-utils'

// Force Node.js runtime for SSE support
export const runtime = 'nodejs'

// Disable response caching
export const dynamic = 'force-dynamic'

// Heartbeat interval in milliseconds (30 seconds)
const HEARTBEAT_INTERVAL = 30000

// Connection timeout (5 minutes of no activity)
const CONNECTION_TIMEOUT = 300000

/**
 * SSE endpoint for real-time notification streaming
 * Authenticates user from session and streams notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 60 requests per minute (lenient for SSE connections)
    const rateLimitResult = rateLimit(request, 'realtime', RateLimitConfigs.realtime)
    if (rateLimitResult) return rateLimitResult

    // Authenticate user
    const session = await auth()

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userId = session.user.id
    const encoder = new TextEncoder()
    let heartbeatInterval: NodeJS.Timeout | null = null
    let timeoutId: NodeJS.Timeout | null = null
    let isConnectionOpen = true

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Helper function to send SSE message
        const sendMessage = (event: string, data: unknown) => {
          if (!isConnectionOpen) return

          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(message))
          } catch (error) {
            logError(error, { action: 'send_sse_message' })
          }
        }

        // Send initial connection message
        sendMessage('connected', {
          userId,
          timestamp: new Date().toISOString(),
          message: 'Connected to notification stream',
        })

        // Set up heartbeat to keep connection alive
        heartbeatInterval = setInterval(() => {
          if (!isConnectionOpen) return
          sendMessage('heartbeat', {
            timestamp: new Date().toISOString(),
          })
        }, HEARTBEAT_INTERVAL)

        // Set up connection timeout
        const resetTimeout = () => {
          if (timeoutId) clearTimeout(timeoutId)
          timeoutId = setTimeout(() => {
            isConnectionOpen = false
            cleanup()
            controller.close()
          }, CONNECTION_TIMEOUT)
        }
        resetTimeout()

        // Handler for user-specific notifications
        const notificationHandler = (notification: RealtimeNotification) => {
          resetTimeout()
          sendMessage('notification', notification)
        }

        // Handler for broadcast updates (all users)
        const broadcastHandler = (data: { channel: string; payload: unknown }) => {
          resetTimeout()
          sendMessage('update', data)
        }

        // Subscribe to user-specific notifications
        realtimeEmitter.on(`notification:${userId}`, notificationHandler)

        // Subscribe to broadcast channel
        realtimeEmitter.on('broadcast', broadcastHandler)

        // Cleanup function
        const cleanup = () => {
          isConnectionOpen = false
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval)
            heartbeatInterval = null
          }
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          realtimeEmitter.off(`notification:${userId}`, notificationHandler)
          realtimeEmitter.off('broadcast', broadcastHandler)
        }

        // Handle client disconnect via abort signal
        request.signal.addEventListener('abort', () => {
          cleanup()
          try {
            controller.close()
          } catch {
            // Controller may already be closed
          }
        })
      },

      cancel() {
        isConnectionOpen = false
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
        }
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      },
    })

    // Return SSE response with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    logError(error, { action: 'sse_connection' })
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
