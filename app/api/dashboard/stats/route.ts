import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    const [
      totalMembers,
      activeCommittees,
      openTasks,
      upcomingEvents,
      recentAnnouncements,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.committee.count(),
      prisma.task.count({
        where: {
          status: { in: ['TODO', 'IN_PROGRESS'] },
        },
      }),
      prisma.event.count({
        where: {
          startTime: { gte: now },
        },
      }),
      prisma.announcement.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: now } },
          ],
        },
        orderBy: [
          { isPinned: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: 5,
        select: {
          id: true,
          title: true,
          content: true,
          priority: true,
          isPinned: true,
          publishedAt: true,
        },
      }),
      Promise.all([
        prisma.participationLog.findMany({
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            hours: true,
            description: true,
            category: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        }),
        prisma.event.findMany({
          where: { startTime: { gte: now } },
          orderBy: { startTime: 'asc' },
          take: 5,
          select: {
            id: true,
            title: true,
            startTime: true,
            type: true,
          },
        }),
        prisma.task.findMany({
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            completedAt: true,
            assignedTo: { select: { name: true } },
          },
        }),
      ]),
    ])

    const [participationLogs, upcomingEventsList, completedTasks] = recentActivity

    const activityFeed = [
      ...participationLogs.map((log) => ({
        id: log.id,
        type: 'participation' as const,
        title: `${log.user.name} logged ${log.hours} hours`,
        description: log.description,
        category: log.category,
        timestamp: log.createdAt,
      })),
      ...upcomingEventsList.map((event) => ({
        id: event.id,
        type: 'event' as const,
        title: event.title,
        description: `Upcoming ${event.type.toLowerCase().replace(/_/g, ' ')}`,
        timestamp: event.startTime,
      })),
      ...completedTasks.map((task) => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        description: task.assignedTo ? `Completed by ${task.assignedTo.name}` : 'Task completed',
        timestamp: task.completedAt,
      })),
    ].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return timeB - timeA
    }).slice(0, 10)

    return NextResponse.json({
      metrics: {
        totalMembers,
        activeCommittees,
        openTasks,
        upcomingEvents,
      },
      announcements: recentAnnouncements,
      activityFeed,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
