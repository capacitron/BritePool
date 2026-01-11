import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth/roles'
import { UserRole } from '@prisma/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatCard } from '@/components/analytics/StatCard'
import { ChartPlaceholder } from '@/components/analytics/ChartPlaceholder'
import {
  BookOpen,
  Calendar,
  MessageSquare,
  Award,
} from 'lucide-react'

export default async function AnalyticsDashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const userRole = session.user.role as UserRole
  if (!isAdmin(userRole)) {
    redirect('/dashboard')
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
    courseStats,
    eventStats,
    forumStats,
    topCommittees,
    courseCompletionStats,
    eventAttendanceStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
    prisma.participationLog.aggregate({
      where: { status: 'APPROVED' },
      _sum: { hours: true },
      _count: true,
    }),
    prisma.courseProgress.count(),
    prisma.eventRegistration.count(),
    prisma.forumPost.count(),
    prisma.committee.findMany({
      include: {
        _count: {
          select: { members: true, tasks: true, events: true },
        },
      },
      orderBy: { members: { _count: 'desc' } },
      take: 5,
    }),
    prisma.courseProgress.count({ where: { isCompleted: true } }),
    prisma.eventRegistration.count({ where: { status: 'ATTENDED' } }),
  ])

  const growthRate = membersTwoMonthsAgo > 0
    ? Math.round(((membersLastMonth - membersTwoMonthsAgo) / membersTwoMonthsAgo) * 100)
    : membersLastMonth > 0 ? 100 : 0

  const activeUserPercentage = totalMembers > 0
    ? Math.round((activeUsers / totalMembers) * 100)
    : 0

  const courseCompletionRate = courseStats > 0
    ? Math.round((courseCompletionStats / courseStats) * 100)
    : 0

  const eventAttendanceRate = eventStats > 0
    ? Math.round((eventAttendanceStats / eventStats) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-forest-800">
          Analytics Dashboard
        </h1>
        <p className="text-forest-500 mt-1 font-body">
          Comprehensive platform statistics and insights
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          iconName="Users"
          value={totalMembers}
          label="Total Members"
          change={{
            value: Math.abs(growthRate),
            type: growthRate >= 0 ? 'increase' : 'decrease',
          }}
        />
        <StatCard
          iconName="UserCheck"
          value={`${activeUserPercentage}%`}
          label="Active Users (30d)"
          iconClassName="bg-forest-100"
        />
        <StatCard
          iconName="Clock"
          value={Math.round(participationStats._sum.hours || 0)}
          label="Participation Hours"
          iconClassName="bg-earth-100"
        />
        <StatCard
          iconName="TrendingUp"
          value={membersLastMonth}
          label="New This Month"
          change={{
            value: Math.abs(growthRate),
            type: growthRate >= 0 ? 'increase' : 'decrease',
          }}
          iconClassName="bg-green-100"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
            <CardDescription>
              Monthly member registration trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder
              title=""
              type="line"
              height="h-48"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participation Breakdown</CardTitle>
            <CardDescription>
              Hours logged by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder
              title=""
              type="pie"
              height="h-48"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-sand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium font-display text-forest-800">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-forest-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-forest-500 font-body">Total Enrollments</span>
                <span className="font-semibold text-forest-800">{courseStats}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-forest-500 font-body">Completed</span>
                <span className="font-semibold text-forest-800">{courseCompletionStats}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-forest-500 font-body">Completion Rate</span>
                <span className="font-semibold text-forest-600">{courseCompletionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium font-display text-forest-800">Events</CardTitle>
            <Calendar className="h-4 w-4 text-earth-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-forest-500 font-body">Total Registrations</span>
                <span className="font-semibold text-forest-800">{eventStats}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-forest-500 font-body">Attended</span>
                <span className="font-semibold text-forest-800">{eventAttendanceStats}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-forest-500 font-body">Attendance Rate</span>
                <span className="font-semibold text-forest-600">{eventAttendanceRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium font-display text-forest-800">Forums</CardTitle>
            <MessageSquare className="h-4 w-4 text-forest-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-forest-500 font-body">Total Posts</span>
                <span className="font-semibold text-forest-800">{forumStats}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-forest-500 font-body">Participation Logs</span>
                <span className="font-semibold text-forest-800">{participationStats._count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-forest-500 font-body">Engagement</span>
                <span className="font-semibold text-forest-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-sand-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <Award className="h-5 w-5 text-forest-600" />
            Committee Activity Breakdown
          </CardTitle>
          <CardDescription className="text-forest-500 font-body">
            Top committees ranked by member count, tasks, and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCommittees.length === 0 ? (
              <p className="text-sm text-forest-500 text-center py-8 font-body">
                No committee data available
              </p>
            ) : (
              topCommittees.map((committee, index) => {
                const activityScore =
                  committee._count.members +
                  committee._count.tasks * 2 +
                  committee._count.events * 3
                const maxScore = Math.max(
                  ...topCommittees.map(
                    (c) => c._count.members + c._count.tasks * 2 + c._count.events * 3
                  )
                )
                const percentage = maxScore > 0 ? (activityScore / maxScore) * 100 : 0

                return (
                  <div key={committee.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-forest-400 w-6 font-body">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-forest-800 font-body">
                          {committee.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-forest-500 font-body">
                        <span>{committee._count.members} members</span>
                        <span>{committee._count.tasks} tasks</span>
                        <span>{committee._count.events} events</span>
                      </div>
                    </div>
                    <div className="h-2 bg-sand-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
