'use client'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMobileSidebar } from './MobileSidebarContext'

export function MobileMenuTrigger() {
  const { toggle } = useMobileSidebar()
  return (
    <Button variant="ghost" size="sm" className="md:hidden" onClick={toggle}>
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  )
}
