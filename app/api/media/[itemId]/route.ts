import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateMediaSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  category: z.enum(['PROJECT_PROGRESS', 'EVENTS', 'SANCTUARY_NATURE', 'CONSTRUCTION', 'COMMUNITY', 'AERIAL']).optional(),
  tags: z.array(z.string()).optional(),
})

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params

    const mediaItem = await prisma.mediaItem.findUnique({
      where: { id: itemId },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    })

    if (!mediaItem) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 })
    }

    return NextResponse.json(mediaItem)
  } catch (error) {
    console.error('Error fetching media item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media item' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params

    const existingItem = await prisma.mediaItem.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 })
    }

    const isOwner = existingItem.uploadedById === session.user.id
    const isAdmin = ADMIN_ROLES.includes(session.user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the owner or administrators can update this item' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateMediaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    
    if (parsed.data.filename) updateData.filename = parsed.data.filename
    if (parsed.data.category) updateData.category = parsed.data.category
    if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags

    const mediaItem = await prisma.mediaItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(mediaItem)
  } catch (error) {
    console.error('Error updating media item:', error)
    return NextResponse.json(
      { error: 'Failed to update media item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params

    const existingItem = await prisma.mediaItem.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 })
    }

    const isOwner = existingItem.uploadedById === session.user.id
    const isAdmin = ADMIN_ROLES.includes(session.user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the owner or administrators can delete this item' },
        { status: 403 }
      )
    }

    await prisma.mediaItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting media item:', error)
    return NextResponse.json(
      { error: 'Failed to delete media item' },
      { status: 500 }
    )
  }
}
