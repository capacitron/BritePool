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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-stone h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-stone">
        <Link href="/dashboard" className="block">
          <h1 className="text-xl font-serif font-bold text-earth-brown-dark">
            BRITE POOL
          </h1>
          <p className="text-xs text-earth-brown-light mt-1">
            Ministerium of Empowerment
          </p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-earth-brown text-white'
                  : 'text-earth-dark hover:bg-stone-warm'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-stone">
        <p className="text-xs text-earth-brown-light text-center">
          © 2024 BRITE POOL
        </p>
      </div>
    </aside>
  )
}
