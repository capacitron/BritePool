import { UserRole } from '@prisma/client'
import { getRoleBadgeStyles, getRoleDisplayName } from '@/lib/auth/roles'
import { getGreeting, cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { UserAvatarDropdown } from './UserAvatarDropdown'
import { MobileMenuTrigger } from './MobileMenuTrigger'

interface DashboardHeaderProps {
  userName: string
  userEmail: string
  userRole: UserRole
  userImage?: string | null
}

export function DashboardHeader({ userName, userEmail, userRole, userImage }: DashboardHeaderProps) {
  const greeting = getGreeting()
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-white border-b border-sand-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4" role="banner" aria-label="Dashboard header">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile menu trigger - only visible on mobile */}
          <MobileMenuTrigger />

          {/* User greeting section - hidden on mobile, visible on md+ */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Compact greeting for mobile */}
          <div className="flex md:hidden items-center">
            <h2 className="text-lg font-display font-semibold text-forest-900">
              {greeting}!
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserAvatarDropdown
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            initials={initials}
          />
        </div>
      </div>
    </header>
  )
}
