'use client'

import { UserRole } from '@prisma/client'
import { getRoleBadgeStyles, getRoleDisplayName } from '@/lib/auth/roles'
import { getGreeting, cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { MobileMenuTrigger } from './MobileMenuTrigger'
import { UserAvatarDropdown } from './UserAvatarDropdown'
import { signOutAction } from './SignOutAction'

interface DashboardHeaderClientProps {
  userName: string
  userRole: UserRole
  userImage?: string | null
}

export function DashboardHeaderClient({ userName, userRole, userImage }: DashboardHeaderClientProps) {
  const greeting = getGreeting()
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = () => {
    signOutAction()
  }

  return (
    <header className="bg-white border-b border-sand-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu trigger - only visible on mobile */}
          <MobileMenuTrigger />

          {/* Avatar visible on desktop only */}
          <Avatar className="h-12 w-12 border-2 border-forest-200 hidden md:flex">
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
          <UserAvatarDropdown
            userName={userName}
            userRole={userRole}
            userImage={userImage}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </header>
  )
}
