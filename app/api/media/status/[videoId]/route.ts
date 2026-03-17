import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getVideoStatus } from '@/lib/bunny'

/**
 * GET /api/media/status/[videoId]
 * Poll a video's encoding status from Bunny Stream.
 * Returns status code, label, and encode progress percentage.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId } = await params

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    const status = await getVideoStatus(videoId)

    if (!status) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
