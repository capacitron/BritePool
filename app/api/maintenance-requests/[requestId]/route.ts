import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { isAdmin } from '@/lib/auth/roles'

const updateMaintenanceRequestSchema = z.object({
  status: z.enum(['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional().nullable(),
  resolutionNotes: z.string().max(5000).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await params

    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        submittedBy: {
          select: { id: true, name: true, role: true }
        },
        assignedTo: {
          select: { id: true, name: true, role: true }
        },
        resolvedBy: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 })
    }

    return NextResponse.json(maintenanceRequest)
  } catch (error) {
    console.error('Error fetching maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance request' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { requestId } = await params

    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateMaintenanceRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { status, priority, assignedToId, resolutionNotes } = parsed.data

    const updateData: Record<string, unknown> = {}
    
    if (priority !== undefined) {
      updateData.priority = priority
    }

    if (assignedToId !== undefined) {
      if (assignedToId) {
        const assignee = await prisma.user.findUnique({
          where: { id: assignedToId }
        })
        if (!assignee) {
          return NextResponse.json(
            { error: 'Assigned user not found' },
            { status: 404 }
          )
        }
        updateData.assignedToId = assignedToId
        updateData.assignedAt = new Date()
        if (!status) {
          updateData.status = 'ASSIGNED'
        }
      } else {
        updateData.assignedToId = null
        updateData.assignedAt = null
      }
    }

    if (status !== undefined) {
      updateData.status = status
      
      if (status === 'RESOLVED') {
        updateData.resolvedById = session.user.id
        updateData.resolvedAt = new Date()
        if (resolutionNotes) {
          updateData.resolutionNotes = resolutionNotes
        }
      } else if (existingRequest.status === 'RESOLVED') {
        updateData.resolvedById = null
        updateData.resolvedAt = null
        updateData.resolutionNotes = null
      }
    }

    if (resolutionNotes !== undefined && status === 'RESOLVED') {
      updateData.resolutionNotes = resolutionNotes
    }

    const maintenanceRequest = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        submittedBy: {
          select: { id: true, name: true, role: true }
        },
        assignedTo: {
          select: { id: true, name: true, role: true }
        },
        resolvedBy: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    return NextResponse.json(maintenanceRequest)
  } catch (error) {
    console.error('Error updating maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance request' },
      { status: 500 }
    )
  }
}
