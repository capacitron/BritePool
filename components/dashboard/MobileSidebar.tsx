'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useMobileSidebar } from './MobileSidebarContext'
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
  Bell,
  Wallet,
  Globe,
  Shield,
  Megaphone,
  ClipboardList,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/events', label: 'Events', icon: Calendar },
      { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Community',
    items: [
      { href: '/dashboard/committees', label: 'Committees', icon: Users },
      { href: '/dashboard/forums', label: 'Forums', icon: MessageSquare },
      { href: '/dashboard/wgo', label: 'WGO', icon: Globe },
      { href: '/dashboard/stakeholder', label: 'Stakeholder', icon: PieChart },
    ],
  },
  {
    title: 'Finance',
    items: [
      { href: '/dashboard/pools', label: 'Pools', icon: Wallet },
      { href: '/dashboard/participation', label: 'Participation', icon: Clock },
      { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
    ],
  },
  {
    title: 'Resources',
    items: [
      { href: '/dashboard/courses', label: 'Courses', icon: BookOpen },
      { href: '/dashboard/documents', label: 'Documents', icon: FileText },
      { href: '/dashboard/transparency', label: 'Transparency', icon: Eye },
      { href: '/dashboard/media', label: 'Media', icon: Image },
    ],
  },
  {
    title: 'Other',
    items: [
      { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench },
      { href: '/dashboard/map', label: 'Map', icon: Map },
      { href: '/dashboard/partners', label: 'Partners', icon: Handshake },
      { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
    ],
  },
]

const adminNavItems: NavItem[] = [
  { href: '/dashboard/admin', label: 'Admin Panel', icon: Settings },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/moderation', label: 'Moderation', icon: Shield },
  { href: '/dashboard/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/dashboard/admin/audit', label: 'Audit Log', icon: ClipboardList },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR']

interface MobileSidebarProps {
  userRole?: string
}

export function MobileSidebar({ userRole }: MobileSidebarProps) {
  const pathname = usePathname()
  const { isOpen, close } = useMobileSidebar()
  const isAdmin = userRole && adminRoles.includes(userRole)

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={close}
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-forest-900 md:hidden flex flex-col">
        <div className="p-6 border-b border-forest-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-sand-100">BRITE POOL</h1>
            <p className="text-xs text-forest-300 mt-1">Ministerium of Empowerment</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="text-forest-300 hover:text-sand-100 hover:bg-forest-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {isAdmin && (
            <>
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-earth-400 uppercase tracking-wider">
                  Admin
                </h3>
              </div>
              {adminNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard/admin' && pathname.startsWith(item.href + '/'))
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-earth-500 text-white'
                        : 'text-sand-200 bg-earth-500/10 hover:bg-earth-500/20 hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
              <div className="border-b border-forest-700 my-3" />
            </>
          )}

          {navGroups.map((group) => (
            <div key={group.title} className="mb-4">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-sand-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              </div>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-forest-600 text-sand-50'
                        : 'text-sand-200 hover:bg-forest-700 hover:text-sand-50'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-forest-700">
          <p className="text-xs text-forest-400 text-center">© 2024 BRITE POOL</p>
        </div>
      </aside>
    </>
  )
}
