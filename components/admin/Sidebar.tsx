'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, CheckCircle, ClipboardList, ArrowLeft } from 'lucide-react'
import type { UserRole } from '@prisma/client'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/admin',
    icon: LayoutDashboard,
    roles: ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR', 'SUPPORT_STAFF'],
  },
  {
    label: 'Users',
    href: '/dashboard/admin/users',
    icon: Users,
    roles: ['WEB_STEWARD', 'BOARD_CHAIR', 'SUPPORT_STAFF'],
  },
  {
    label: 'Content Moderation',
    href: '/dashboard/admin/moderation',
    icon: CheckCircle,
    roles: ['WEB_STEWARD', 'BOARD_CHAIR', 'CONTENT_MODERATOR'],
  },
  {
    label: 'Audit Logs',
    href: '/dashboard/admin/audit',
    icon: ClipboardList,
    roles: ['WEB_STEWARD', 'BOARD_CHAIR'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role as UserRole | undefined

  const visibleItems = navItems.filter((item) => userRole && item.roles.includes(userRole))

  return (
    <aside className="w-64 bg-forest-900 text-white min-h-screen flex flex-col" role="complementary" aria-label="Admin navigation sidebar">
      <div className="p-6 border-b border-forest-700">
        <Link href="/dashboard" className="flex items-center space-x-2" aria-label="Go to main dashboard">
          <span className="text-xl font-display font-bold text-sand-100">BRITE POOL</span>
        </Link>
        <p className="text-xs text-forest-300 mt-1 font-body">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4" role="navigation" aria-label="Admin navigation">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard/admin' && pathname.startsWith(item.href + '/'))
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-body',
                    isActive
                      ? 'bg-earth-500 text-white'
                      : 'text-sand-200 hover:bg-forest-700 hover:text-sand-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-forest-700">
        <Link
          href="/dashboard"
          className="flex items-center space-x-3 px-4 py-3 text-sand-200 hover:bg-forest-700 hover:text-sand-50 rounded-lg transition-colors font-body"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  )
}
