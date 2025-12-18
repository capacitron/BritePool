import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR']

const updateLocationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  type: z.enum(['FACILITY', 'DEVELOPMENT_ZONE', 'POINT_OF_INTEREST', 'NATURAL_FEATURE', 'INFRASTRUCTURE']).optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'OPERATIONAL']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { locationId } = await params

    const location = await prisma.mapLocation.findUnique({
      where: { id: locationId },
      include: {
        createdBy: {
          select: { id: true, name: true }
        },
        photos: {
          select: { 
            id: true, 
            url: true, 
            thumbnailUrl: true,
            mediumUrl: true,
            filename: true,
            type: true,
            category: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching map location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch map location' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { locationId } = await params

    const existingLocation = await prisma.mapLocation.findUnique({
      where: { id: locationId }
    })

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    const isOwner = existingLocation.createdById === session.user.id
    const isAdmin = ADMIN_ROLES.includes(session.user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the creator or administrators can update this location' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateLocationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.latitude !== undefined) updateData.latitude = parsed.data.latitude
    if (parsed.data.longitude !== undefined) updateData.longitude = parsed.data.longitude
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status

    const location = await prisma.mapLocation.update({
      where: { id: locationId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true }
        },
        photos: {
          select: { id: true, thumbnailUrl: true, url: true, filename: true }
        }
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error updating map location:', error)
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'A location with this name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update map location' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { locationId } = await params

    const existingLocation = await prisma.mapLocation.findUnique({
      where: { id: locationId }
    })

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    const isOwner = existingLocation.createdById === session.user.id
    const isAdmin = ADMIN_ROLES.includes(session.user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the creator or administrators can delete this location' },
        { status: 403 }
      )
    }

    await prisma.mapLocation.delete({
      where: { id: locationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting map location:', error)
    return NextResponse.json(
      { error: 'Failed to delete map location' },
      { status: 500 }
    )
  }
}
