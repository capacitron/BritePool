import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth/roles'
import { UserRole } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserCheck,
  CreditCard,
  FileCheck,
  Megaphone,
  ArrowRight,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const userRole = session.user.role as UserRole
  if (!isAdmin(userRole)) {
    redirect('/dashboard')
  }

  const [
    totalUsers,
    pendingCovenant,
    activeSubscriptions,
    recentUsers,
    announcementsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { covenantAcceptedAt: null } }),
    prisma.user.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        covenantAcceptedAt: true,
      },
    }),
    prisma.announcement.count(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-forest-800">
          Admin Dashboard
        </h1>
        <p className="text-forest-500 mt-1 font-body">
          Manage users, announcements, and platform settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-sand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-display text-forest-800">Total Users</CardTitle>
            <Users className="h-4 w-4 text-forest-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-forest-900">{totalUsers}</div>
            <p className="text-xs text-forest-500 mt-1 font-body">
              Registered members
            </p>
          </CardContent>
        </Card>

        <Card className="border-sand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-display text-forest-800">Pending Covenant</CardTitle>
            <FileCheck className="h-4 w-4 text-earth-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-forest-900">{pendingCovenant}</div>
            <p className="text-xs text-forest-500 mt-1 font-body">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>

        <Card className="border-sand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-display text-forest-800">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-forest-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-forest-900">{activeSubscriptions}</div>
            <p className="text-xs text-forest-500 mt-1 font-body">
              Paying members
            </p>
          </CardContent>
        </Card>

        <Card className="border-sand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-display text-forest-800">Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-earth-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-forest-900">{announcementsCount}</div>
            <p className="text-xs text-forest-500 mt-1 font-body">
              Total published
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-sand-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-forest-800">
              <Clock className="h-5 w-5 text-forest-600" />
              Recent Registrations
            </CardTitle>
            <CardDescription className="text-forest-500 font-body">
              Newly registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-sand-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-forest-800 font-body">{user.name}</p>
                    <p className="text-sm text-forest-500 font-body">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-forest-400 font-body">
                      {formatDate(user.createdAt)}
                    </p>
                    {user.covenantAcceptedAt ? (
                      <span className="text-xs text-forest-600 font-medium font-body">Covenant Accepted</span>
                    ) : (
                      <span className="text-xs text-earth-500 font-medium font-body">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" className="w-full mt-4 justify-between text-forest-700 hover:bg-forest-50">
              <Link href="/dashboard/admin/users">
                View All Users
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-sand-200">
          <CardHeader>
            <CardTitle className="font-display text-forest-800">Quick Actions</CardTitle>
            <CardDescription className="text-forest-500 font-body">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start border-sand-300 text-forest-700 hover:bg-forest-50 hover:border-forest-300" variant="outline">
              <Link href="/dashboard/admin/users">
                <Users className="h-4 w-4 mr-2 text-forest-600" />
                Manage Users
              </Link>
            </Button>
            <Button asChild className="w-full justify-start border-sand-300 text-forest-700 hover:bg-forest-50 hover:border-forest-300" variant="outline">
              <Link href="/dashboard/admin/announcements">
                <Megaphone className="h-4 w-4 mr-2 text-earth-500" />
                Manage Announcements
              </Link>
            </Button>
            <Button asChild className="w-full justify-start border-sand-300 text-forest-700 hover:bg-forest-50 hover:border-forest-300" variant="outline">
              <Link href="/dashboard/admin/users?covenantStatus=pending">
                <UserCheck className="h-4 w-4 mr-2 text-forest-500" />
                Review Pending Approvals
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
