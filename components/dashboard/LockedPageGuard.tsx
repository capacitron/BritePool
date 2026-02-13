import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ComingSoon } from '@/components/ui/coming-soon'
import { Lock } from 'lucide-react'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

interface LockedPageGuardProps {
  children: React.ReactNode
  feature?: string
}

export async function LockedPageGuard({ children, feature }: LockedPageGuardProps) {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <ComingSoon
        title={feature || 'Coming Soon'}
        description="This feature is not yet available. Please check back later."
        icon={Lock}
      />
    )
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  const isAdmin = dbUser?.role && ADMIN_ROLES.includes(dbUser.role)

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <ComingSoon
      title={feature || 'Coming Soon'}
      description="This feature is currently under development and will be available to members soon."
      icon={Lock}
    />
  )
}
