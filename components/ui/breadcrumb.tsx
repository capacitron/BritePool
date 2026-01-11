'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  admin: 'Admin',
  users: 'Users',
  moderation: 'Moderation',
  audit: 'Audit Log',
  announcements: 'Announcements',
  committees: 'Committees',
  courses: 'Courses',
  lessons: 'Lessons',
  events: 'Events',
  approvals: 'Approvals',
  documents: 'Documents',
  forums: 'Forums',
  media: 'Media Gallery',
  map: 'Community Map',
  partners: 'Partners',
  pools: 'Pools',
  stakeholder: 'Stakeholder',
  tasks: 'Tasks',
  wgo: 'WGO',
  profile: 'Profile',
  settings: 'Settings',
  transparency: 'Transparency',
  analytics: 'Analytics',
}

function isDynamicSegment(segment: string): boolean {
  // Check for CUID (starts with 'c' followed by alphanumeric)
  if (segment.startsWith('c') && segment.length > 20) {
    return true
  }
  // Check for UUID pattern
  if (/^[a-f0-9-]{36}$/i.test(segment)) {
    return true
  }
  // Check for long alphanumeric strings (likely IDs)
  if (/^[a-z0-9]{20,}$/i.test(segment)) {
    return true
  }
  return false
}

function getLabel(segment: string): string {
  if (isDynamicSegment(segment)) {
    return 'Details'
  }
  return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Return null if only 1 segment (root dashboard)
  if (segments.length <= 1) {
    return null
  }

  return (
    <nav className={cn('flex items-center gap-2 text-sm text-earth-500', className)}>
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1
        const label = getLabel(segment)

        return (
          <div key={href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-earth-300" />}
            {isLast ? (
              <span className="font-medium text-forest-700">{label}</span>
            ) : (
              <Link
                href={href}
                className="flex items-center gap-1 hover:text-forest-600 transition-colors"
              >
                {index === 0 && <Home className="h-4 w-4" />}
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
