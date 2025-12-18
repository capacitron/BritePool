import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createMaintenanceRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  location: z.string().min(1).max(500),
  category: z.enum(['PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'GROUNDS', 'HVAC', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const myRequests = searchParams.get('myRequests') === 'true'

    const where: Record<string, unknown> = {}
    
    if (myRequests) {
      where.submittedById = session.user.id
    }
    
    if (status) {
      where.status = status
    }
    
    if (priority) {
      where.priority = priority
    }
    
    if (category) {
      where.category = category
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        submittedBy: {
          select: { id: true, name: true }
        },
        assignedTo: {
          select: { id: true, name: true }
        },
        resolvedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching maintenance requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance requests' },
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
    const parsed = createMaintenanceRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, location, category, priority } = parsed.data

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        title,
        description,
        location,
        category,
        priority: priority || 'MEDIUM',
        submittedById: session.user.id,
        submittedAt: new Date(),
      },
      include: {
        submittedBy: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(maintenanceRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance request' },
      { status: 500 }
    )
  }
}
