'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { navGroups, adminNavItems, adminRoles, isRouteInGroup, STORAGE_KEY } from '@/lib/navigation'

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = userRole && adminRoles.includes(userRole)

  // Initialize expanded sections - merge saved preferences with active route
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = { Admin: true }
    navGroups.forEach((group) => {
      initial[group.title] = isRouteInGroup(pathname, group.items)
    })
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      if (saved) {
        const parsed = JSON.parse(saved)
        const merged = { ...parsed }
        navGroups.forEach((group) => {
          if (isRouteInGroup(pathname, group.items)) {
            merged[group.title] = true
          }
        })
        if (isAdmin && isRouteInGroup(pathname, adminNavItems)) {
          merged.Admin = true
        }
        return merged
      }
    } catch {}
    return initial
  })

  // Save preferences when changed
  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = { ...prev, [title]: !prev[title] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  return (
    <aside
      className="w-64 bg-forest-900 h-screen sticky top-0 flex flex-col"
      role="complementary"
      aria-label="Main navigation sidebar"
    >
      <div className="p-6 border-b border-forest-700">
        <Link href="/dashboard" className="block" aria-label="Go to dashboard home">
          <h1 className="text-xl font-display font-bold text-sand-100">BRITE POOL</h1>
          <p className="text-xs text-forest-300 mt-1 font-body">Ministerium of Empowerment</p>
        </Link>
      </div>

      <nav
        className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-none"
        role="navigation"
        aria-label="Main navigation"
      >
        {isAdmin && (
          <>
            <button
              onClick={() => toggleSection('Admin')}
              className="w-full flex items-center justify-between px-3 py-2 group"
              aria-expanded={expandedSections.Admin}
              aria-controls="admin-nav-section"
            >
              <h3 className="text-xs font-semibold text-sand-300 uppercase tracking-wider">
                Admin
              </h3>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-sand-300 transition-transform duration-200',
                  expandedSections.Admin ? 'rotate-0' : '-rotate-90'
                )}
                aria-hidden="true"
              />
            </button>
            <div
              id="admin-nav-section"
              className={cn(
                'overflow-hidden transition-all duration-200',
                expandedSections.Admin ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              )}
              role="group"
              aria-label="Admin navigation items"
            >
              {adminNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard/admin' && pathname.startsWith(item.href + '/'))
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
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
            </div>
            <div className="border-b border-forest-700 my-3" />
          </>
        )}

        {navGroups.map((group) => {
          const isExpanded = expandedSections[group.title]
          const hasActiveItem = isRouteInGroup(pathname, group.items)

          return (
            <div key={group.title} className="mb-1">
              <button
                onClick={() => toggleSection(group.title)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                  hasActiveItem && !isExpanded && 'bg-forest-800'
                )}
              >
                <h3
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wider transition-colors',
                    hasActiveItem ? 'text-sand-100' : 'text-sand-300'
                  )}
                >
                  {group.title}
                </h3>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-sand-300 transition-transform duration-200',
                    isExpanded ? 'rotate-0' : '-rotate-90'
                  )}
                />
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                  const Icon = item.icon
                  const isLocked = item.locked && !isAdmin

                  if (isLocked) {
                    return (
                      <span
                        key={item.href}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium font-body opacity-40 cursor-not-allowed text-sand-200"
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                        <span className="ml-auto text-[10px] uppercase tracking-wider text-sand-400">
                          Soon
                        </span>
                      </span>
                    )
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors font-body',
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
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-forest-700">
        <p className="text-xs text-forest-400 text-center font-body">© 2024 BRITE POOL</p>
      </div>
    </aside>
  )
}
