'use client'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMobileSidebar } from './MobileSidebarContext'

export function MobileMenuTrigger() {
  const { toggle } = useMobileSidebar()
  return (
    <Button variant="ghost" size="icon" className="md:hidden" onClick={toggle}>
      <Menu className="h-6 w-6" />
      <span className="sr-only">Open menu</span>
    </Button>
  )
}
