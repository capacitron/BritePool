import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updatePartnerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  logo: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  email: z.string().email().optional().nullable(),
  category: z.enum(['ADVISORY_BOARD', 'PRACTITIONER', 'SPONSOR', 'VENDOR', 'COLLABORATOR']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional(),
})

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { partnerId } = await params

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    return NextResponse.json(partner)
  } catch (error) {
    console.error('Error fetching partner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partner' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = ADMIN_ROLES.includes(session.user.role)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can update partners' },
        { status: 403 }
      )
    }

    const { partnerId } = await params

    const existingPartner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!existingPartner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updatePartnerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.logo !== undefined) updateData.logo = parsed.data.logo
    if (parsed.data.website !== undefined) updateData.website = parsed.data.website
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status

    const partner = await prisma.partner.update({
      where: { id: partnerId },
      data: updateData
    })

    return NextResponse.json(partner)
  } catch (error) {
    console.error('Error updating partner:', error)
    return NextResponse.json(
      { error: 'Failed to update partner' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = ADMIN_ROLES.includes(session.user.role)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can delete partners' },
        { status: 403 }
      )
    }

    const { partnerId } = await params

    const existingPartner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!existingPartner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    await prisma.partner.delete({
      where: { id: partnerId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting partner:', error)
    return NextResponse.json(
      { error: 'Failed to delete partner' },
      { status: 500 }
    )
  }
}
