import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'

interface RouteParams {
  params: Promise<{ eventId: string }>
}

/**
 * POST /api/events/[eventId]/reject
 *
 * Stub endpoint for event rejection functionality.
 * The Event model does not currently have the required fields:
 * - status
 * - rejectionReason
 * - rejectedById
 * - rejectedAt
 * - committees (plural) relation
 * - createdById
 *
 * The Notification model also does not exist.
 *
 * This endpoint returns 501 Not Implemented until the schema is updated.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Stub response - functionality not yet implemented
    return NextResponse.json(
      {
        error: 'Not Implemented',
        message:
          'Event rejection functionality is not yet available. The Event model requires additional fields (status, rejectionReason, etc.) to support this feature.',
        eventId,
      },
      { status: 501 }
    )
  } catch (error) {
    logError(error, { action: 'reject_event' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
