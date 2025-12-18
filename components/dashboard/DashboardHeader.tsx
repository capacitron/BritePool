import { UserRole } from '@prisma/client'
import { getRoleBadgeStyles, getRoleDisplayName } from '@/lib/auth/roles'
import { getGreeting, cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth'

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
    <header className="bg-white border-b border-stone px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            {userImage && <AvatarImage src={userImage} alt={userName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-serif font-semibold text-earth-brown-dark">
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

        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  )
}
