import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { UserRole } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30'
    const daysAgo = parseInt(period, 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    const [
      totalHours,
      hoursByCategory,
      hoursByStatus,
      topContributors,
      recentLogs,
    ] = await Promise.all([
      prisma.participationLog.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'APPROVED',
        },
        _sum: { hours: true },
        _count: true,
      }),
      prisma.participationLog.groupBy({
        by: ['category'],
        where: {
          createdAt: { gte: startDate },
          status: 'APPROVED',
        },
        _sum: { hours: true },
        _count: true,
      }),
      prisma.participationLog.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      prisma.participationLog.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: startDate },
          status: 'APPROVED',
        },
        _sum: { hours: true },
        orderBy: { _sum: { hours: 'desc' } },
        take: 10,
      }),
      prisma.participationLog.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          hours: true,
          description: true,
          category: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      }),
    ])

    const userIds = topContributors.map((c) => c.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    })

    const userMap = new Map(users.map((u) => [u.id, u.name]))

    const formattedTopContributors = topContributors.map((contributor) => ({
      userId: contributor.userId,
      name: userMap.get(contributor.userId) || 'Unknown',
      totalHours: contributor._sum.hours || 0,
    }))

    const formattedHoursByCategory = hoursByCategory.map((cat) => ({
      category: cat.category,
      hours: cat._sum.hours || 0,
      count: cat._count,
    }))

    const formattedHoursByStatus = hoursByStatus.map((status) => ({
      status: status.status,
      count: status._count,
    }))

    return NextResponse.json({
      period: daysAgo,
      totalHours: totalHours._sum.hours || 0,
      totalLogs: totalHours._count,
      hoursByCategory: formattedHoursByCategory,
      hoursByStatus: formattedHoursByStatus,
      topContributors: formattedTopContributors,
      recentLogs,
    })
  } catch (error) {
    console.error('Error fetching participation analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch participation analytics' },
      { status: 500 }
    )
  }
}
