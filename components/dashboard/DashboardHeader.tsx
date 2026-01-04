import { UserRole } from '@prisma/client'
import { getRoleBadgeStyles, getRoleDisplayName } from '@/lib/auth/roles'
import { getGreeting, cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface DashboardHeaderProps {
  userName: string
  userRole: UserRole
  userImage?: string | null
}

export function DashboardHeader({ userName, userRole, userImage }: DashboardHeaderProps) {
  const greeting = getGreeting()
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-white border-b border-sand-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-forest-200">
            {userImage && <AvatarImage src={userImage} alt={userName} />}
            <AvatarFallback className="bg-forest-100 text-forest-700 font-display font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-display font-semibold text-forest-900">
              {greeting}, {userName.split(' ')[0]}
            </h2>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1',
                getRoleBadgeStyles(userRole)
              )}
            >
              {getRoleDisplayName(userRole)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-forest-600 hover:text-forest-800 hover:bg-forest-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
