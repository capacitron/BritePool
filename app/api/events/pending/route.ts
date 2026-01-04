import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'

/**
 * GET /api/events/pending
 *
 * Stub endpoint for fetching pending events.
 * The Event model does not currently have a 'status' field,
 * so there is no concept of "pending" events.
 *
 * Returns an empty array until the schema is updated to include
 * approval workflow fields.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return empty array since Event model has no 'status' field
    // and therefore no concept of pending events
    return NextResponse.json({
      events: [],
      count: 0,
      message:
        'Pending events functionality is not yet available. The Event model requires a status field to support approval workflows.',
    })
  } catch (error) {
    logError(error, { action: 'fetch_pending_events' })
    return NextResponse.json({ error: 'Failed to fetch pending events' }, { status: 500 })
  }
}
