import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createInvolvementSchema = z.object({
  wgoId: z.string().min(1, 'WGO ID is required'),
  proofType: z.enum(['LINK', 'IMAGE', 'BOTH']).default('LINK'),
  proofUrl: z.string().url().optional().nullable(),
  proofImageUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  investedAmount: z.number().optional().nullable(),
  joinedDate: z.string().datetime().optional().nullable(),
})

const updateInvolvementSchema = z.object({
  proofType: z.enum(['LINK', 'IMAGE', 'BOTH']).optional(),
  proofUrl: z.string().url().optional().nullable(),
  proofImageUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  investedAmount: z.number().optional().nullable(),
  joinedDate: z.string().datetime().optional().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED', 'EXITED']).optional(),
})

// GET - List user's WGO involvements
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const status = searchParams.get('status')

    // Users can only view their own involvements unless admin
    const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']
    const isAdmin = ADMIN_ROLES.includes(session.user.role)

    if (userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where: Record<string, unknown> = { userId }
    if (status) {
      where.status = status
    }

    const involvements = await prisma.userWGOInvolvement.findMany({
      where,
      include: {
        wgo: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true,
            status: true,
            riskTolerance: true,
            website: true,
            affiliateLink: true,
            forumCategoryId: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(involvements)
  } catch (error) {
    console.error('Error fetching involvements:', error)
    return NextResponse.json({ error: 'Failed to fetch involvements' }, { status: 500 })
  }
}

// POST - Create new involvement
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createInvolvementSchema.parse(body)

    // Check WGO exists
    const wgo = await prisma.wealthOpportunity.findUnique({
      where: { id: validatedData.wgoId }
    })

    if (!wgo) {
      return NextResponse.json({ error: 'WGO not found' }, { status: 404 })
    }

    // Check for existing involvement
    const existing = await prisma.userWGOInvolvement.findUnique({
      where: {
        userId_wgoId: {
          userId: session.user.id,
          wgoId: validatedData.wgoId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Already involved in this WGO' }, { status: 400 })
    }

    const involvement = await prisma.userWGOInvolvement.create({
      data: {
        userId: session.user.id,
        wgoId: validatedData.wgoId,
        proofType: validatedData.proofType,
        proofUrl: validatedData.proofUrl || null,
        proofImageUrl: validatedData.proofImageUrl || null,
        notes: validatedData.notes || null,
        investedAmount: validatedData.investedAmount || null,
        joinedDate: validatedData.joinedDate ? new Date(validatedData.joinedDate) : null,
      },
      include: {
        wgo: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true,
            status: true,
            riskTolerance: true,
          }
        }
      }
    })

    // Increment total members count on WGO
    await prisma.wealthOpportunity.update({
      where: { id: validatedData.wgoId },
      data: { totalMembers: { increment: 1 } }
    })

    return NextResponse.json(involvement, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Error creating involvement:', error)
    return NextResponse.json({ error: 'Failed to create involvement' }, { status: 500 })
  }
}

// PATCH - Update involvement
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const involvementId = searchParams.get('id')

    if (!involvementId) {
      return NextResponse.json({ error: 'Involvement ID required' }, { status: 400 })
    }

    const involvement = await prisma.userWGOInvolvement.findUnique({
      where: { id: involvementId }
    })

    if (!involvement) {
      return NextResponse.json({ error: 'Involvement not found' }, { status: 404 })
    }

    if (involvement.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateInvolvementSchema.parse(body)

    const wasActive = involvement.status === 'ACTIVE'
    const willBeActive = validatedData.status === 'ACTIVE' || (!validatedData.status && wasActive)
    const willBeExited = validatedData.status === 'EXITED'

    const updated = await prisma.userWGOInvolvement.update({
      where: { id: involvementId },
      data: {
        ...validatedData,
        joinedDate: validatedData.joinedDate ? new Date(validatedData.joinedDate) : undefined,
      },
      include: {
        wgo: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true,
            status: true,
            riskTolerance: true,
          }
        }
      }
    })

    // Update member count if status changed
    if (wasActive && willBeExited) {
      await prisma.wealthOpportunity.update({
        where: { id: involvement.wgoId },
        data: { totalMembers: { decrement: 1 } }
      })
    } else if (!wasActive && willBeActive && involvement.status === 'EXITED') {
      await prisma.wealthOpportunity.update({
        where: { id: involvement.wgoId },
        data: { totalMembers: { increment: 1 } }
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Error updating involvement:', error)
    return NextResponse.json({ error: 'Failed to update involvement' }, { status: 500 })
  }
}

// DELETE - Remove involvement
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const involvementId = searchParams.get('id')

    if (!involvementId) {
      return NextResponse.json({ error: 'Involvement ID required' }, { status: 400 })
    }

    const involvement = await prisma.userWGOInvolvement.findUnique({
      where: { id: involvementId }
    })

    if (!involvement) {
      return NextResponse.json({ error: 'Involvement not found' }, { status: 404 })
    }

    if (involvement.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.userWGOInvolvement.delete({
      where: { id: involvementId }
    })

    // Decrement member count if was active
    if (involvement.status === 'ACTIVE') {
      await prisma.wealthOpportunity.update({
        where: { id: involvement.wgoId },
        data: { totalMembers: { decrement: 1 } }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting involvement:', error)
    return NextResponse.json({ error: 'Failed to delete involvement' }, { status: 500 })
  }
}
