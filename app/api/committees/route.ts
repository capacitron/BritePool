import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createCommitteeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  type: z.enum(['GOVERNANCE', 'WEALTH', 'EDUCATION', 'HEALTH', 'OPERATIONS']),
})

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const committees = await prisma.committee.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        _count: {
          select: { members: true, tasks: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    const formattedCommittees = committees.map(committee => ({
      ...committee,
      memberCount: committee._count.members,
      taskCount: committee._count.tasks,
      leader: committee.members.find(m => m.role === 'LEADER')?.user || null,
      isMember: committee.members.some(m => m.userId === session.user.id),
    }))

    return NextResponse.json(formattedCommittees)
  } catch (error) {
    console.error('Error fetching committees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch committees' },
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

    const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR']
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createCommitteeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, slug, description, type } = parsed.data

    const existing = await prisma.committee.findFirst({
      where: { OR: [{ name }, { slug }] }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Committee with this name or slug already exists' },
        { status: 409 }
      )
    }

    const committee = await prisma.committee.create({
      data: { name, slug, description, type },
      include: {
        _count: {
          select: { members: true, tasks: true }
        }
      }
    })

    return NextResponse.json(committee, { status: 201 })
  } catch (error) {
    console.error('Error creating committee:', error)
    return NextResponse.json(
      { error: 'Failed to create committee' },
      { status: 500 }
    )
  }
}
