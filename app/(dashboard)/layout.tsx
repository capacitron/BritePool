import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardClientWrapper } from '@/components/dashboard/DashboardClientWrapper'
import { Breadcrumbs } from '@/components/ui/breadcrumb'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
    },
  })

  if (!user) {
    redirect('/login')
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
