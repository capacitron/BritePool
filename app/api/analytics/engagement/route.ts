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

    const [
      forumStats,
      forumPostsThisMonth,
      courseStats,
      courseEnrollmentsThisMonth,
      eventStats,
      eventRegistrationsThisMonth,
      completedCourses,
      attendedEvents,
    ] = await Promise.all([
      prisma.forumPost.count(),
      prisma.forumPost.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.courseProgress.count(),
      prisma.courseProgress.count({
        where: { startedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.eventRegistration.count(),
      prisma.eventRegistration.count({
        where: { registeredAt: { gte: thirtyDaysAgo } },
      }),
      prisma.courseProgress.count({
        where: { isCompleted: true },
      }),
      prisma.eventRegistration.count({
        where: { status: 'ATTENDED' },
      }),
    ])

    const [
      coursesByCategory,
      eventsByType,
      topForumCategories,
      recentForumActivity,
    ] = await Promise.all([
      prisma.course.groupBy({
        by: ['category'],
        where: { isPublished: true },
        _count: true,
      }),
      prisma.event.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.forumPost.groupBy({
        by: ['categoryId'],
        _count: true,
        orderBy: { _count: { categoryId: 'desc' } },
        take: 5,
      }),
      prisma.forumPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),
    ])

    const categoryIds = topForumCategories
      .map((c) => c.categoryId)
      .filter((id): id is string => id !== null)

    const categories = await prisma.forumCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    })

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

    const formattedTopForumCategories = topForumCategories.map((cat) => ({
      categoryId: cat.categoryId,
      name: cat.categoryId ? categoryMap.get(cat.categoryId) || 'Uncategorized' : 'Uncategorized',
      postCount: cat._count,
    }))

    return NextResponse.json({
      forum: {
        totalPosts: forumStats,
        postsThisMonth: forumPostsThisMonth,
        topCategories: formattedTopForumCategories,
        recentActivity: recentForumActivity,
      },
      courses: {
        totalEnrollments: courseStats,
        enrollmentsThisMonth: courseEnrollmentsThisMonth,
        completedCourses,
        completionRate: courseStats > 0
          ? Math.round((completedCourses / courseStats) * 100)
          : 0,
        byCategory: coursesByCategory.map((c) => ({
          category: c.category,
          count: c._count,
        })),
      },
      events: {
        totalRegistrations: eventStats,
        registrationsThisMonth: eventRegistrationsThisMonth,
        attendedEvents,
        attendanceRate: eventStats > 0
          ? Math.round((attendedEvents / eventStats) * 100)
          : 0,
        byType: eventsByType.map((e) => ({
          type: e.type,
          count: e._count,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching engagement analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagement analytics' },
      { status: 500 }
    )
  }
}
