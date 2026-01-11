'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMobileSidebar } from './MobileSidebarContext'

export function MobileMenuTrigger() {
  const { toggle } = useMobileSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden text-forest-700 hover:bg-forest-50"
      onClick={toggle}
      aria-label="Toggle menu"
    >
      <Menu className="h-6 w-6" />
    </Button>
  )
}
