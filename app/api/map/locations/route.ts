import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR']

const createLocationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  type: z.enum(['FACILITY', 'DEVELOPMENT_ZONE', 'POINT_OF_INTEREST', 'NATURAL_FEATURE', 'INFRASTRUCTURE']),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'OPERATIONAL']).default('PLANNED'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }

    const locations = await prisma.mapLocation.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true }
        },
        photos: {
          select: { id: true, thumbnailUrl: true, url: true, filename: true },
          take: 4
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching map locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch map locations' },
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

    const isAdmin = ADMIN_ROLES.includes(session.user.role)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can create map locations' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createLocationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, latitude, longitude, type, status } = parsed.data

    const location = await prisma.mapLocation.create({
      data: {
        name,
        description: description || null,
        latitude,
        longitude,
        type,
        status,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Error creating map location:', error)
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'A location with this name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create map location' },
      { status: 500 }
    )
  }
}
