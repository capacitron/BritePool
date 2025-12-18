import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [
      totalMembers,
      membersLastMonth,
      membersTwoMonthsAgo,
      activeUsers,
      participationStats,
      topCommittees,
      subscriptionBreakdown,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
      prisma.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo } },
      }),
      prisma.participationLog.aggregate({
        where: { status: 'APPROVED' },
        _sum: { hours: true },
        _count: true,
      }),
      prisma.committee.findMany({
        include: {
          _count: {
            select: {
              members: true,
              tasks: true,
              events: true,
            },
          },
        },
        orderBy: {
          members: { _count: 'desc' },
        },
        take: 5,
      }),
      prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: true,
      }),
    ])

    const growthRate = membersTwoMonthsAgo > 0
      ? ((membersLastMonth - membersTwoMonthsAgo) / membersTwoMonthsAgo) * 100
      : membersLastMonth > 0 ? 100 : 0

    const formattedTopCommittees = topCommittees.map((committee) => ({
      id: committee.id,
      name: committee.name,
      type: committee.type,
      memberCount: committee._count.members,
      taskCount: committee._count.tasks,
      eventCount: committee._count.events,
      activityScore: committee._count.members + committee._count.tasks * 2 + committee._count.events * 3,
    }))

    const formattedSubscriptionBreakdown = subscriptionBreakdown.map((tier) => ({
      tier: tier.subscriptionTier,
      count: tier._count,
    }))

    return NextResponse.json({
      totalMembers,
      newMembersThisMonth: membersLastMonth,
      growthRate: Math.round(growthRate * 10) / 10,
      activeUsers,
      activeUserPercentage: totalMembers > 0
        ? Math.round((activeUsers / totalMembers) * 100)
        : 0,
      totalParticipationHours: participationStats._sum.hours || 0,
      totalParticipationLogs: participationStats._count,
      topCommittees: formattedTopCommittees,
      subscriptionBreakdown: formattedSubscriptionBreakdown,
    })
  } catch (error) {
    console.error('Error fetching analytics overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}
