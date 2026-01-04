import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()

    // Fetch all user-specific stats in parallel
    const [
      unreadNotifications,
      activePledges,
      wgoInvolvements,
      pendingTasks,
      upcomingEvents,
      committeeMemberships,
    ] = await Promise.all([
      // Unread notifications count
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),

      // Active pledges (user's pledges that are pending or confirmed)
      prisma.pledge.count({
        where: {
          userId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),

      // WGO involvements (active involvements)
      prisma.userWGOInvolvement.count({
        where: {
          userId,
          status: 'ACTIVE',
        },
      }),

      // Pending tasks assigned to user
      prisma.task.count({
        where: {
          assignedToId: userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
        },
      }),

      // Upcoming events user is registered for
      prisma.eventRegistration.count({
        where: {
          userId,
          status: 'REGISTERED',
          event: {
            startTime: { gte: now },
          },
        },
      }),

      // Committee memberships
      prisma.committeeMember.count({
        where: {
          userId,
        },
      }),
    ])

    return NextResponse.json({
      unreadNotifications,
      activePledges,
      wgoInvolvements,
      pendingTasks,
      upcomingEvents,
      committeeMemberships,
    })
  } catch (error) {
    logError(error, { action: 'fetch_user_stats' })
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 })
  }
}
