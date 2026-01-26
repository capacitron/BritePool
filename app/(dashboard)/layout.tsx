import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardClientWrapper } from '@/components/dashboard/DashboardClientWrapper'
import { Breadcrumbs } from '@/components/ui/breadcrumb'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// TEMPORARY: Set to true to bypass dashboard auth checks
// TODO: Set back to false when done testing
const BYPASS_DASHBOARD_AUTH = false

// Mock user for bypass mode
const BYPASS_USER: { name: string; email: string; role: UserRole } = {
  name: 'Bypass Admin',
  email: 'admin@bypass.local',
  role: 'WEB_STEWARD',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = BYPASS_USER

  if (!BYPASS_DASHBOARD_AUTH) {
    const session = await auth()

    if (!session?.user?.id) {
      redirect('/login')
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        role: true,
        onboardingCompleted: true,
      },
    })

    if (!dbUser) {
      redirect('/login')
    }

    // Redirect to onboarding if not completed (except for admins)
    const isAdmin = dbUser.role === 'WEB_STEWARD' || dbUser.role === 'BOARD_CHAIR'
    if (!dbUser.onboardingCompleted && !isAdmin) {
      redirect('/onboarding/welcome')
    }

    user = dbUser
  }

  return (
    <DashboardClientWrapper userRole={user.role}>
      <div className="min-h-screen bg-cream flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar userRole={user.role} />
        </div>
        <div className="flex-1 flex flex-col">
          <DashboardHeader userName={user.name} userEmail={user.email} userRole={user.role} />
          <main className="flex-1 p-4 sm:p-6 bg-sand-50">
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </DashboardClientWrapper>
  )
}
