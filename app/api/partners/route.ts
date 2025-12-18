import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createPartnerSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  category: z.enum(['ADVISORY_BOARD', 'PRACTITIONER', 'SPONSOR', 'VENDOR', 'COLLABORATOR']),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional(),
})

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR']

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    
    if (category) {
      where.category = category
    }
    
    if (status) {
      where.status = status
    } else {
      where.status = 'ACTIVE'
    }

    const partners = await prisma.partner.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(partners)
  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
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
        { error: 'Only administrators can create partners' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createPartnerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const partner = await prisma.partner.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        logo: parsed.data.logo || null,
        website: parsed.data.website || null,
        email: parsed.data.email || null,
        category: parsed.data.category,
        status: parsed.data.status || 'PENDING',
      }
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    console.error('Error creating partner:', error)
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    )
  }
}
