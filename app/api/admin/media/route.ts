import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, successResponse, internalError, logError } from '@/lib/api-utils'
import {
  listVideos,
  uploadVideo,
  isStreamConfigured,
  isStorageConfigured,
  healthCheck,
  getVideoStatusLabel,
} from '@/lib/bunny'

/**
 * GET /api/admin/media
 * List videos from Bunny Stream. Query params: page, limit, collection.
 * Also supports ?action=health for health check.
 */
export async function GET(request: NextRequest) {
  try {
    const { auth, error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Health check
    if (action === 'health') {
      const health = await healthCheck()
      return successResponse({
        stream: { configured: isStreamConfigured(), ...health.stream },
        storage: { configured: isStorageConfigured(), ...health.storage },
      })
    }

    // List videos
    if (!isStreamConfigured()) {
      return successResponse({
        videos: [],
        totalItems: 0,
        message: 'Bunny Stream not configured. Add BUNNY_STREAM_* env vars.',
      })
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const collection = searchParams.get('collection') || undefined

    const result = await listVideos(page, limit, collection)

    const videos = result.videos.map((v) => ({
      ...v,
      statusLabel: getVideoStatusLabel(v.status),
    }))

    return successResponse(
      { videos, totalItems: result.totalItems },
      {
        page,
        limit,
        total: result.totalItems,
        totalPages: Math.ceil(result.totalItems / limit),
      }
    )
  } catch (err) {
    logError(err, { route: 'GET /api/admin/media' })
    return internalError('Failed to fetch media')
  }
}

/**
 * POST /api/admin/media
 * Upload a video to Bunny Stream.
 * Expects multipart form data with: file (required), title (optional), collection (optional).
 */
export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const collection = (formData.get('collection') as string) || undefined

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/mpeg',
      'audio/mpeg',
      'audio/mp4',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
      'audio/x-m4a',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Unsupported file type: ${file.type}. Allowed: video/audio formats.`,
          },
        },
        { status: 400 }
      )
    }

    // 500MB limit
    const MAX_SIZE = 500 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'File too large. Maximum 500MB.' },
        },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const videoTitle = title || file.name.replace(/\.[^.]+$/, '')

    const video = await uploadVideo(buffer, videoTitle, collection)

    return NextResponse.json(
      {
        success: true,
        data: {
          ...video,
          statusLabel: getVideoStatusLabel(video.status),
        },
      },
      { status: 201 }
    )
  } catch (err) {
    logError(err, { route: 'POST /api/admin/media' })
    return internalError('Failed to upload media')
  }
}
