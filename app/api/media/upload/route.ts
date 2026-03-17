import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { uploadVideo, isStreamConfigured, getEmbedUrl } from '@/lib/bunny'
import type { MediaType, MediaCategory } from '@prisma/client'

/**
 * POST /api/media/upload
 * Upload a video/audio file to Bunny Stream, then create a MediaItem DB record.
 * Requires authentication. Accepts multipart form data.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isStreamConfigured()) {
      return NextResponse.json(
        { error: 'Bunny Stream not configured. Add BUNNY_STREAM_* environment variables.' },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const category = (formData.get('category') as string) || 'COMMUNITY'
    const tags = (formData.get('tags') as string) || ''
    const mediaType = (formData.get('type') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')

    if (!isVideo && !isAudio) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Upload video or audio files.` },
        { status: 400 }
      )
    }

    // 500MB limit
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 500MB.' }, { status: 400 })
    }

    // Upload to Bunny Stream
    const buffer = new Uint8Array(await file.arrayBuffer())
    const videoTitle = title || file.name.replace(/\.[^.]+$/, '')
    const bunnyVideo = await uploadVideo(buffer, videoTitle)

    // Determine media type for DB
    let resolvedType: MediaType = 'VIDEO'
    if (
      mediaType &&
      ['PHOTO', 'VIDEO', 'AUDIO', 'DRONE_FOOTAGE', 'TIMELAPSE'].includes(mediaType)
    ) {
      resolvedType = mediaType as MediaType
    } else if (isAudio) {
      resolvedType = 'AUDIO'
    }

    // Validate category
    const validCategories: MediaCategory[] = [
      'PROJECT_PROGRESS',
      'EVENTS',
      'SANCTUARY_NATURE',
      'CONSTRUCTION',
      'COMMUNITY',
      'AERIAL',
    ]
    const resolvedCategory: MediaCategory = validCategories.includes(category as MediaCategory)
      ? (category as MediaCategory)
      : 'COMMUNITY'

    // Parse tags
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    // Create MediaItem record in DB
    const mediaItem = await prisma.mediaItem.create({
      data: {
        url: bunnyVideo.videoUrl,
        thumbnailUrl: bunnyVideo.thumbnailUrl,
        mediumUrl: getEmbedUrl(bunnyVideo.guid),
        filename: file.name,
        filesize: file.size,
        mimeType: file.type,
        type: resolvedType,
        category: resolvedCategory,
        tags: parsedTags,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        mediaItem,
        bunny: {
          guid: bunnyVideo.guid,
          streamUrl: bunnyVideo.videoUrl,
          thumbnailUrl: bunnyVideo.thumbnailUrl,
          embedUrl: getEmbedUrl(bunnyVideo.guid),
          status: 'processing',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logError(error, { action: 'upload_media_to_bunny' })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
