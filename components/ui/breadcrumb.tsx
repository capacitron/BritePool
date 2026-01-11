'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

// Route segment to display label mapping
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  admin: 'Admin',
  users: 'Users',
  moderation: 'Moderation',
  announcements: 'Announcements',
  audit: 'Audit Logs',
  analytics: 'Analytics',
  events: 'Events',
  tasks: 'Tasks',
  notifications: 'Notifications',
  committees: 'Committees',
  forums: 'Forums',
  wgo: 'WGO',
  stakeholder: 'Stakeholder',
  pools: 'Pools',
  participation: 'Participation',
  subscription: 'Subscription',
  courses: 'Courses',
  lessons: 'Lessons',
  documents: 'Documents',
  transparency: 'Transparency',
  media: 'Media',
  maintenance: 'Maintenance',
  map: 'Map',
  partners: 'Partners',
  profile: 'Profile',
  'communal-seat': 'Communal Seat',
}

interface BreadcrumbsProps {
  customLabels?: Record<string, string>
  className?: string
}

export function Breadcrumbs({ customLabels, className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Don't show breadcrumbs on root dashboard
  if (segments.length <= 1) return null

  // Build breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    // Check for UUID pattern (dynamic route param)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
    const isCuid = /^c[a-z0-9]{24}$/i.test(segment)
    const isDynamicSegment = isUuid || isCuid || segment.length > 20

    const label = customLabels?.[segment] ||
                  routeLabels[segment] ||
                  (isDynamicSegment ? 'Details' : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))

    return { label, href, isLast: index === segments.length - 1 }
  })

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
      <ol className="flex items-center space-x-1 text-sm text-earth-500">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center hover:text-forest-600 transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {breadcrumbs.slice(1).map((item) => (
          <li key={item.href} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-earth-300" />
            {item.isLast ? (
              <span className="font-medium text-forest-800">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-forest-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
