'use client'

import { ReactNode } from 'react'
import { MobileSidebarProvider } from './MobileSidebarContext'
import { MobileSidebar } from './MobileSidebar'

interface DashboardClientWrapperProps {
  children: ReactNode
  userRole?: string
}

export function DashboardClientWrapper({ children, userRole }: DashboardClientWrapperProps) {
  return (
    <MobileSidebarProvider>
      {children}
      <MobileSidebar userRole={userRole} />
    </MobileSidebarProvider>
  )
}
