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
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="text-xl font-serif font-bold">BRITE POOL</span>
        </Link>
        <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4">
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
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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

      <div className="p-4 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  )
}
