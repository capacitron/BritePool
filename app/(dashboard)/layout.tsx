import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardClientWrapper } from '@/components/dashboard/DashboardClientWrapper'
import { Breadcrumbs } from '@/components/ui/breadcrumb'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { getImpersonatingUserId } from '@/lib/impersonation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  const isAdminUser = isAdmin(dbUser.role as UserRole)
  if (!dbUser.onboardingCompleted && !isAdminUser) {
    redirect('/onboarding/welcome')
  }

  // Check for impersonation (single cookie read)
  const impersonatingId = isAdminUser ? await getImpersonatingUserId() : null
  const isImpersonating = impersonatingId !== null && impersonatingId !== session.user.id

  let user = dbUser
  let impersonatedUserName: string | undefined

  if (isImpersonating) {
    const impersonatedUser = await prisma.user.findUnique({
      where: { id: impersonatingId },
      select: {
        name: true,
        email: true,
        role: true,
        onboardingCompleted: true,
      },
    })
    if (impersonatedUser) {
      user = impersonatedUser
      impersonatedUserName = impersonatedUser.name || impersonatedUser.email
    }
  }

  return (
    <DashboardClientWrapper userRole={user.role}>
      <div className="min-h-screen bg-cream flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar userRole={user.role} />
        </div>
        <div className="flex-1 flex flex-col">
          <DashboardHeader
            userName={user.name}
            userEmail={user.email}
            userRole={user.role}
            isImpersonating={isImpersonating}
            impersonatedUserName={impersonatedUserName}
          />
          <main className="flex-1 p-4 sm:p-6 bg-sand-50">
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </DashboardClientWrapper>
  )
}
