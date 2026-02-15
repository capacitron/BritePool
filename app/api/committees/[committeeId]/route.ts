import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { z } from 'zod'

const updateCommitteeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params

    const committee = await prisma.committee.findUnique({
      where: { id: committeeId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true },
            },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        },
        events: {
          where: {
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
        _count: {
          select: { members: true, tasks: true },
        },
      },
    })

    if (!committee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...committee,
      memberCount: committee._count.members,
      taskCount: committee._count.tasks,
      isMember: committee.members.some((m) => m.userId === session.user.id),
      userMembership: committee.members.find((m) => m.userId === session.user.id) || null,
    })
  } catch (error) {
    logError(error, { action: 'fetch_committee' })
    return NextResponse.json({ error: 'Failed to fetch committee' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateCommitteeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const committee = await prisma.committee.update({
      where: { id: committeeId },
      data: parsed.data,
      include: {
        _count: {
          select: { members: true, tasks: true },
        },
      },
    })

    return NextResponse.json(committee)
  } catch (error) {
    logError(error, { action: 'update_committee' })
    return NextResponse.json({ error: 'Failed to update committee' }, { status: 500 })
  }
}

// DELETE /api/committees/[committeeId] - Delete committee (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { committeeId } = await params

    const committee = await prisma.committee.findUnique({
      where: { id: committeeId },
      include: {
        _count: { select: { members: true } },
      },
    })

    if (!committee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 })
    }

    if (committee._count.members > 0) {
      return NextResponse.json(
        { error: 'Cannot delete committee with active members' },
        { status: 409 }
      )
    }

    await prisma.committee.delete({ where: { id: committeeId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error, { action: 'delete_committee' })
    return NextResponse.json({ error: 'Failed to delete committee' }, { status: 500 })
  }
}
