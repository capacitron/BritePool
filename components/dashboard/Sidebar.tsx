'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  BookOpen,
  Clock,
  UserCircle,
  MessageSquare,
  Wrench,
  CreditCard,
  Image,
  Map,
  Handshake,
  FileText,
  Eye,
  PieChart,
  Settings,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/stakeholder', label: 'Stakeholder', icon: PieChart },
  { href: '/dashboard/committees', label: 'Committees', icon: Users },
  { href: '/dashboard/forums', label: 'Forums', icon: MessageSquare },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/dashboard/events', label: 'Events', icon: Calendar },
  { href: '/dashboard/courses', label: 'Courses', icon: BookOpen },
  { href: '/dashboard/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard/transparency', label: 'Transparency', icon: Eye },
  { href: '/dashboard/media', label: 'Media', icon: Image },
  { href: '/dashboard/map', label: 'Map', icon: Map },
  { href: '/dashboard/partners', label: 'Partners', icon: Handshake },
  { href: '/dashboard/participation', label: 'Participation', icon: Clock },
  { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
]

const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR']

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = userRole && adminRoles.includes(userRole)

  return (
    <aside className="w-64 bg-forest-900 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-forest-700">
        <Link href="/dashboard" className="block">
          <h1 className="text-xl font-display font-bold text-sand-100">
            BRITE POOL
          </h1>
          <p className="text-xs text-forest-300 mt-1 font-body">
            Ministerium of Empowerment
          </p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isAdmin && (
          <>
            <Link
              href="/dashboard/admin"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/dashboard/admin')
                  ? 'bg-earth-500 text-white'
                  : 'text-earth-300 bg-earth-500/10 hover:bg-earth-500/20'
              )}
            >
              <Settings className="h-5 w-5" />
              Admin Panel
            </Link>
            <Link
              href="/dashboard/analytics"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                pathname === '/dashboard/analytics'
                  ? 'bg-earth-500 text-white'
                  : 'text-earth-300 bg-earth-500/10 hover:bg-earth-500/20'
              )}
            >
              <BarChart3 className="h-5 w-5" />
              Analytics
            </Link>
            <div className="border-b border-forest-700 my-2" />
          </>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors font-body',
                isActive
                  ? 'bg-forest-600 text-sand-100'
                  : 'text-forest-200 hover:bg-forest-800 hover:text-sand-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-forest-700">
        <p className="text-xs text-forest-400 text-center font-body">
          © 2024 BRITE POOL
        </p>
      </div>
    </aside>
  )
}
