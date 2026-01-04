import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'

interface RouteParams {
  params: Promise<{ eventId: string }>
}

/**
 * POST /api/events/[eventId]/approve
 *
 * Stub endpoint for event approval functionality.
 * The Event model does not currently have the required fields:
 * - status
 * - approvals relation
 * - committees (plural) relation
 * - createdById
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
          'Event approval functionality is not yet available. The Event model requires additional fields (status, approvals) to support this feature.',
        eventId,
      },
      { status: 501 }
    )
  } catch (error) {
    logError(error, { action: 'approve_event' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
