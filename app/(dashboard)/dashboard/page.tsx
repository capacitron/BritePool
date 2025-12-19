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
  if (!user.onboardingCompleted) {
    redirect('/onboarding')
  }

  const greeting = getGreeting()

  return (
    <div className="space-y-8">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-earth-brown-dark via-earth-brown to-earth-brown-dark p-8 md:p-10 text-white">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20z' fill='%23fff' fill-opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px'
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-earth-gold/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sage/10 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-earth-gold to-transparent" />
            <span className="text-earth-gold text-sm font-medium uppercase tracking-wider">
              {greeting}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">
            {user.name.split(' ')[0]}
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Welcome back to your BRITE POOL dashboard. Your journey of empowerment continues.
          </p>

          {/* Role Badge */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <span className={cn("w-2 h-2 rounded-full", getRoleBadgeStyles(user.role).split(' ')[0])} />
            <span className="text-sm font-medium">{getRoleDisplayName(user.role)}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Distinctive Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sage to-sage/50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-earth-brown-light">Covenant Status</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center group-hover:bg-sage/20 transition-colors">
              <FileCheck className="h-5 w-5 text-sage" />
            </div>
          </CardHeader>
          <CardContent>
            {user.covenantAcceptedAt ? (
              <>
                <div className="text-3xl font-serif font-bold text-sage">Accepted</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-earth-brown-light">
                  <span className="px-2 py-0.5 bg-sage/10 rounded-full">v{user.covenantVersion || '1.0'}</span>
                  <span>{formatDate(user.covenantAcceptedAt)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-serif font-bold text-terracotta">Pending</div>
                <p className="text-xs text-earth-brown-light mt-2">Please review and accept</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-soft to-sky-soft/50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-earth-brown-light">Subscription</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-sky-soft/10 flex items-center justify-center group-hover:bg-sky-soft/20 transition-colors">
              <CreditCard className="h-5 w-5 text-sky-soft" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold capitalize text-earth-brown-dark">
              {user.subscriptionTier.toLowerCase()}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                user.subscriptionStatus === 'ACTIVE' ? 'bg-sage/10 text-sage' : 'bg-terracotta/10 text-terracotta'
              )}>
                {user.subscriptionStatus.toLowerCase()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-earth-gold to-earth-gold/50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-earth-brown-light">Participation</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-earth-gold/10 flex items-center justify-center group-hover:bg-earth-gold/20 transition-colors">
              <Clock className="h-5 w-5 text-earth-gold-dark" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-earth-brown-dark">
              {user.profile?.totalHoursLogged?.toFixed(1) || '0'} <span className="text-lg font-normal text-earth-brown-light">hrs</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-earth-brown-light">Equity Units:</span>
              <span className="font-bold text-earth-gold-dark">
                {user.profile?.totalEquityUnits?.toFixed(2) || '0'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative bg-gradient-to-br from-white to-stone-warm/30">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-terracotta to-terracotta/50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-earth-brown-light">Quick Actions</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center group-hover:bg-terracotta/20 transition-colors">
              <Zap className="h-5 w-5 text-terracotta" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild size="sm" className="w-full justify-start bg-earth-brown-dark/5 hover:bg-earth-brown-dark hover:text-white border-0" variant="outline">
              <Link href="/dashboard/participation">
                <Clock className="h-4 w-4 mr-2" />
                Log Hours
              </Link>
            </Button>
            <Button asChild size="sm" className="w-full justify-start bg-earth-gold/10 hover:bg-earth-gold hover:text-white border-0" variant="outline">
              <Link href="/dashboard/events">
                <Calendar className="h-4 w-4 mr-2" />
                View Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards - Premium Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sage via-sage/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sage/20 to-sage/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7 text-sage" />
            </div>
            <CardTitle className="text-xl font-serif">Committees</CardTitle>
            <CardDescription className="text-earth-brown-light">
              Join and participate in community committees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-sage/10 transition-colors">
              <Link href="/dashboard/committees">
                Explore Committees
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-soft via-sky-soft/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-soft/20 to-sky-soft/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="h-7 w-7 text-sky-soft" />
            </div>
            <CardTitle className="text-xl font-serif">Upcoming Events</CardTitle>
            <CardDescription className="text-earth-brown-light">
              Workshops, meetings, and community gatherings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-sky-soft/10 transition-colors">
              <Link href="/dashboard/events">
                View Calendar
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-earth-gold via-earth-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-earth-gold/20 to-earth-gold/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7 text-earth-gold-dark" />
            </div>
            <CardTitle className="text-xl font-serif">Learning Center</CardTitle>
            <CardDescription className="text-earth-brown-light">
              Courses and educational resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-earth-gold/10 transition-colors">
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
