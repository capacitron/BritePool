'use client'

import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  Clock,
  UserCircle,
  MessageSquare,
  Wrench,
  Eye,
  PieChart,
  Settings,
  Bell,
  Wallet,
  Globe,
  Handshake,
  Heart,
  BarChart3,
  Sprout,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  locked?: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
      { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Community',
    items: [
      { href: '/dashboard/gratitude', label: 'Gratitude', icon: Heart },
      { href: '/dashboard/committees', label: 'Committees', icon: Users, locked: true },
      { href: '/dashboard/forums', label: 'Forums', icon: MessageSquare },
      { href: '/dashboard/wgo', label: 'WGO', icon: Globe },
      { href: '/dashboard/events', label: 'Events', icon: Calendar },
      { href: '/dashboard/courses', label: 'Courses', icon: BookOpen, locked: true },
    ],
  },
  {
    title: 'Private Finance',
    items: [
      { href: '/dashboard/pools', label: 'Pools', icon: Wallet, locked: true },
      { href: '/dashboard/participation', label: 'Participation', icon: Clock, locked: true },
      { href: '/dashboard/transparency', label: 'Transparency', icon: Eye, locked: true },
      { href: '/dashboard/stakeholder', label: 'Stakeholder', icon: PieChart, locked: true },
    ],
  },
  {
    title: 'Steward Projects',
    items: [
      { href: '/dashboard/projects/aliento-de-vida', label: 'Aliento De Vida', icon: Sprout },
    ],
  },
  {
    title: 'Other',
    items: [
      { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, locked: true },
      { href: '/dashboard/partners', label: 'Partners', icon: Handshake, locked: true },
    ],
  },
]

export const adminNavItems: NavItem[] = [
  { href: '/dashboard/admin', label: 'Admin Panel', icon: Settings },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

export const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR']

export function isRouteInGroup(pathname: string, items: NavItem[]): boolean {
  return items.some(
    (item) =>
      pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
  )
}

export const STORAGE_KEY = 'sidebar-collapsed-sections'
