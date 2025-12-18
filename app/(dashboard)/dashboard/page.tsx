import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGreeting, formatDate, cn } from '@/lib/utils'
import { getRoleBadgeStyles, getRoleDisplayName } from '@/lib/auth/roles'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileCheck,
  CreditCard,
  Clock,
  Zap,
  Users,
  Calendar,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true,
      covenantAcceptedAt: true,
      covenantVersion: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      profile: {
        select: {
          totalEquityUnits: true,
          totalHoursLogged: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  const greeting = getGreeting()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
          {greeting}, {user.name.split(' ')[0]}!
        </h1>
        <p className="text-earth-brown-light mt-1">
          Welcome back to your BRITE POOL dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Covenant Status</CardTitle>
            <FileCheck className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            {user.covenantAcceptedAt ? (
              <>
                <div className="text-2xl font-bold text-sage">Accepted</div>
                <p className="text-xs text-earth-brown-light mt-1">
                  Version {user.covenantVersion || '1.0'}
                </p>
                <p className="text-xs text-earth-brown-light">
                  {formatDate(user.covenantAcceptedAt)}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-terracotta">Pending</div>
                <p className="text-xs text-earth-brown-light mt-1">
                  Please review and accept
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <CreditCard className="h-4 w-4 text-sky-soft" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {user.subscriptionTier.toLowerCase()}
            </div>
            <p className="text-xs text-earth-brown-light mt-1">
              Status:{' '}
              <span
                className={cn(
                  'font-medium',
                  user.subscriptionStatus === 'ACTIVE'
                    ? 'text-sage'
                    : 'text-terracotta'
                )}
              >
                {user.subscriptionStatus.toLowerCase()}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation</CardTitle>
            <Clock className="h-4 w-4 text-earth-brown" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.profile?.totalHoursLogged?.toFixed(1) || '0'} hrs
            </div>
            <p className="text-xs text-earth-brown-light mt-1">
              Equity Units:{' '}
              <span className="font-medium text-sage">
                {user.profile?.totalEquityUnits?.toFixed(2) || '0'}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Zap className="h-4 w-4 text-terracotta" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild size="sm" className="w-full justify-start" variant="outline">
              <Link href="/dashboard/participation">
                <Clock className="h-4 w-4 mr-2" />
                Log Hours
              </Link>
            </Button>
            <Button asChild size="sm" className="w-full justify-start" variant="outline">
              <Link href="/dashboard/events">
                <Calendar className="h-4 w-4 mr-2" />
                View Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-sage" />
              Committees
            </CardTitle>
            <CardDescription>
              Join and participate in community committees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between">
              <Link href="/dashboard/committees">
                Explore Committees
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-soft" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Workshops, meetings, and community gatherings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between">
              <Link href="/dashboard/events">
                View Calendar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-earth-brown" />
              Learning Center
            </CardTitle>
            <CardDescription>
              Courses and educational resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between">
              <Link href="/dashboard/courses">
                Browse Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
