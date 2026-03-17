import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { uploadVideo, getVideo, isStreamConfigured, getEmbedUrl } from '@/lib/bunny'
import type { MediaType, MediaCategory } from '@prisma/client'

/**
 * POST /api/media/upload
 * Upload a video/audio file to Bunny Stream, then create a MediaItem DB record.
 * Supports two flows:
 *   1. Server-side PUT: file sent via FormData, uploaded to Bunny here
 *   2. TUS post-upload: videoId sent after client uploaded directly to Bunny via TUS
 * Requires authentication.
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
    const tusVideoId = (formData.get('videoId') as string) || ''

    // --- TUS post-upload flow: video already on Bunny, just create DB record ---
    if (tusVideoId) {
      const bunnyVideo = await getVideo(tusVideoId)
      if (!bunnyVideo) {
        return NextResponse.json({ error: 'Video not found on Bunny Stream' }, { status: 404 })
      }

      const resolvedType = resolveMediaType(mediaType, bunnyVideo.videoUrl)
      const resolvedCategory = resolveCategory(category)
      const parsedTags = parseTags(tags)

      const mediaItem = await prisma.mediaItem.create({
        data: {
          url: bunnyVideo.videoUrl,
          thumbnailUrl: bunnyVideo.thumbnailUrl,
          mediumUrl: getEmbedUrl(tusVideoId),
          filename: title || bunnyVideo.title || 'Untitled',
          filesize: bunnyVideo.storageSize,
          mimeType: file?.type || 'video/mp4',
          type: resolvedType,
          category: resolvedCategory,
          tags: parsedTags,
          uploadedById: session.user.id,
        },
        include: { uploadedBy: { select: { id: true, name: true } } },
      })

      return NextResponse.json(
        {
          success: true,
          mediaItem,
          bunny: {
            guid: tusVideoId,
            streamUrl: bunnyVideo.videoUrl,
            thumbnailUrl: bunnyVideo.thumbnailUrl,
            embedUrl: getEmbedUrl(tusVideoId),
            status: 'processing',
          },
        },
        { status: 201 }
      )
    }

    // --- Server-side PUT flow: upload file through our server ---
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')

    if (!isVideo && !isAudio) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Upload video or audio files.` },
        { status: 400 }
      )
    }

    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 500MB.' }, { status: 400 })
    }

    const buffer = new Uint8Array(await file.arrayBuffer())
    const videoTitle = title || file.name.replace(/\.[^.]+$/, '')
    const bunnyVideo = await uploadVideo(buffer, videoTitle)

    const resolvedType = resolveMediaType(mediaType, file.type, isAudio)
    const resolvedCategory = resolveCategory(category)
    const parsedTags = parseTags(tags)

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
      include: { uploadedBy: { select: { id: true, name: true } } },
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

// --- Helpers ---

function resolveMediaType(explicit: string, mimeOrUrl?: string, isAudio?: boolean): MediaType {
  const valid = ['PHOTO', 'VIDEO', 'AUDIO', 'DRONE_FOOTAGE', 'TIMELAPSE']
  if (explicit && valid.includes(explicit)) return explicit as MediaType
  if (isAudio) return 'AUDIO' as MediaType
  return 'VIDEO' as MediaType
}

function resolveCategory(category: string): MediaCategory {
  const valid = [
    'PROJECT_PROGRESS',
    'EVENTS',
    'SANCTUARY_NATURE',
    'CONSTRUCTION',
    'COMMUNITY',
    'AERIAL',
  ]
  return valid.includes(category) ? (category as MediaCategory) : ('COMMUNITY' as MediaCategory)
}

function parseTags(tags: string): string[] {
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}
