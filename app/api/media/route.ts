import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createMediaSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  mediumUrl: z.string().url().optional(),
  filename: z.string().min(1).max(255),
  filesize: z.number().int().positive(),
  mimeType: z.string().min(1),
  type: z.enum(['PHOTO', 'VIDEO', 'DRONE_FOOTAGE', 'TIMELAPSE']),
  category: z.enum(['PROJECT_PROGRESS', 'EVENTS', 'SANCTUARY_NATURE', 'CONSTRUCTION', 'COMMUNITY', 'AERIAL']),
  tags: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')

    const where: Record<string, unknown> = {}
    
    if (type) {
      where.type = type
    }
    
    if (category) {
      where.category = category
    }

    if (tag) {
      where.tags = { has: tag }
    }

    const mediaItems = await prisma.mediaItem.findMany({
      where,
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(mediaItems)
  } catch (error) {
    console.error('Error fetching media items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createMediaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { url, thumbnailUrl, mediumUrl, filename, filesize, mimeType, type, category, tags } = parsed.data

    const mediaItem = await prisma.mediaItem.create({
      data: {
        url,
        thumbnailUrl,
        mediumUrl: mediumUrl || null,
        filename,
        filesize,
        mimeType,
        type,
        category,
        tags,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(mediaItem, { status: 201 })
  } catch (error) {
    console.error('Error creating media item:', error)
    return NextResponse.json(
      { error: 'Failed to create media item' },
      { status: 500 }
    )
  }
}
