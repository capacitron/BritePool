import { NextRequest, NextResponse } from 'next/server'
import {
  requireAdmin,
  successResponse,
  notFoundError,
  internalError,
  logError,
} from '@/lib/api-utils'
import { getVideo, deleteVideo, getVideoStatusLabel, isStreamConfigured } from '@/lib/bunny'

/**
 * GET /api/admin/media/[id]
 * Get details for a single video.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth, error } = await requireAdmin()
    if (error) return error

    if (!isStreamConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_CONFIGURED', message: 'Bunny Stream not configured' },
        },
        { status: 503 }
      )
    }

    const { id } = await params
    const video = await getVideo(id)

    if (!video) {
      return notFoundError('Video')
    }

    return successResponse({
      ...video,
      statusLabel: getVideoStatusLabel(video.status),
    })
  } catch (err) {
    logError(err, { route: 'GET /api/admin/media/[id]' })
    return internalError('Failed to fetch video')
  }
}

/**
 * DELETE /api/admin/media/[id]
 * Delete a video from Bunny Stream.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, error } = await requireAdmin()
    if (error) return error

    if (!isStreamConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_CONFIGURED', message: 'Bunny Stream not configured' },
        },
        { status: 503 }
      )
    }

    const { id } = await params
    const deleted = await deleteVideo(id)

    if (!deleted) {
      return notFoundError('Video')
    }

    return successResponse({ deleted: true, videoId: id })
  } catch (err) {
    logError(err, { route: 'DELETE /api/admin/media/[id]' })
    return internalError('Failed to delete video')
  }
}
