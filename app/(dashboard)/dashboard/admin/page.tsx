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
        <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
          Admin Dashboard
        </h1>
        <p className="text-earth-brown-light mt-1">
          Manage users, announcements, and platform settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-earth-brown-light mt-1">
              Registered members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Covenant</CardTitle>
            <FileCheck className="h-4 w-4 text-terracotta" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCovenant}</div>
            <p className="text-xs text-earth-brown-light mt-1">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-sky-soft" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-earth-brown-light mt-1">
              Paying members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-earth-brown" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcementsCount}</div>
            <p className="text-xs text-earth-brown-light mt-1">
              Total published
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-sage" />
              Recent Registrations
            </CardTitle>
            <CardDescription>
              Newly registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-stone-warm rounded-lg"
                >
                  <div>
                    <p className="font-medium text-earth-dark">{user.name}</p>
                    <p className="text-sm text-earth-brown-light">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-earth-brown-light">
                      {formatDate(user.createdAt)}
                    </p>
                    {user.covenantAcceptedAt ? (
                      <span className="text-xs text-sage font-medium">Covenant Accepted</span>
                    ) : (
                      <span className="text-xs text-terracotta font-medium">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" className="w-full mt-4 justify-between">
              <Link href="/dashboard/admin/users">
                View All Users
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/admin/announcements">
                <Megaphone className="h-4 w-4 mr-2" />
                Manage Announcements
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/admin/users?covenantStatus=pending">
                <UserCheck className="h-4 w-4 mr-2" />
                Review Pending Approvals
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
