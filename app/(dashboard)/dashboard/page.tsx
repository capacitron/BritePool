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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding_complete?: string }>
}) {
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
      onboardingCompleted: true,
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

  // Check if onboarding is completed - redirect if not
  // Skip check if user just completed onboarding (prevents redirect loop)
  const params = await searchParams
  const justCompletedOnboarding = params?.onboarding_complete === 'true'

  if (!user.onboardingCompleted && !justCompletedOnboarding) {
    redirect('/onboarding')
  }

  const greeting = getGreeting()

  return (
    <div className="space-y-8">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 p-8 md:p-10 text-white">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20z' fill='%23fff' fill-opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px'
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-earth-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-forest-400/10 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-earth-400 to-transparent" />
            <span className="text-earth-300 text-sm font-medium uppercase tracking-wider font-body">
              {greeting}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
            {user.name.split(' ')[0]}
          </h1>
          <p className="text-sand-200 text-lg max-w-md font-body">
            Welcome back to your BRITE POOL dashboard. Your journey of empowerment continues.
          </p>

          {/* Role Badge */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="w-2 h-2 rounded-full bg-earth-400" />
            <span className="text-sm font-medium font-body">{getRoleDisplayName(user.role)}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-forest-500 to-forest-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-forest-600 font-body">Covenant Status</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center group-hover:bg-forest-200 transition-colors">
              <FileCheck className="h-5 w-5 text-forest-600" />
            </div>
          </CardHeader>
          <CardContent>
            {user.covenantAcceptedAt ? (
              <>
                <div className="text-3xl font-display font-bold text-forest-700">Accepted</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-forest-500 font-body">
                  <span className="px-2 py-0.5 bg-forest-100 rounded-full">v{user.covenantVersion || '1.0'}</span>
                  <span>{formatDate(user.covenantAcceptedAt)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-display font-bold text-earth-600">Pending</div>
                <p className="text-xs text-forest-500 mt-2 font-body">Please review and accept</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sand-500 to-sand-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-forest-600 font-body">Subscription</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center group-hover:bg-sand-200 transition-colors">
              <CreditCard className="h-5 w-5 text-sand-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold capitalize text-forest-800">
              {user.subscriptionTier.toLowerCase()}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium font-body",
                user.subscriptionStatus === 'ACTIVE' ? 'bg-forest-100 text-forest-700' : 'bg-earth-100 text-earth-700'
              )}>
                {user.subscriptionStatus.toLowerCase()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-earth-500 to-earth-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-forest-600 font-body">Participation</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-earth-100 flex items-center justify-center group-hover:bg-earth-200 transition-colors">
              <Clock className="h-5 w-5 text-earth-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-forest-800">
              {user.profile?.totalHoursLogged?.toFixed(1) || '0'} <span className="text-lg font-normal text-forest-500">hrs</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-body">
              <span className="text-forest-500">Equity Units:</span>
              <span className="font-bold text-earth-600">
                {user.profile?.totalEquityUnits?.toFixed(2) || '0'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative bg-gradient-to-br from-white to-sand-50">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-forest-600 to-forest-400" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-forest-600 font-body">Quick Actions</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center group-hover:bg-forest-200 transition-colors">
              <Zap className="h-5 w-5 text-forest-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild size="sm" className="w-full justify-start" variant="secondary">
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

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group border border-sand-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-forest-500 via-forest-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-4">
            <div className="w-14 h-14 rounded-2xl bg-forest-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7 text-forest-600" />
            </div>
            <CardTitle className="text-xl">Committees</CardTitle>
            <CardDescription>
              Join and participate in community committees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-forest-50 transition-colors">
              <Link href="/dashboard/committees">
                Explore Committees
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group border border-sand-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-earth-500 via-earth-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-4">
            <div className="w-14 h-14 rounded-2xl bg-earth-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="h-7 w-7 text-earth-600" />
            </div>
            <CardTitle className="text-xl">Upcoming Events</CardTitle>
            <CardDescription>
              Workshops, meetings, and community gatherings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-earth-50 transition-colors">
              <Link href="/dashboard/events">
                View Calendar
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group border border-sand-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sand-500 via-sand-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-4">
            <div className="w-14 h-14 rounded-2xl bg-sand-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7 text-sand-700" />
            </div>
            <CardTitle className="text-xl">Learning Center</CardTitle>
            <CardDescription>
              Courses and educational resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-sand-100 transition-colors">
              <Link href="/dashboard/courses">
                Browse Courses
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
