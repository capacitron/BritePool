import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
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
      role: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-earth-light flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader
          userName={user.name}
          userRole={user.role}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
