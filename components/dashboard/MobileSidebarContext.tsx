'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'

interface MobileSidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
  close: () => void
}

const MobileSidebarContext = createContext<MobileSidebarContextType | null>(null)

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <MobileSidebarContext.Provider value={{ isOpen, setIsOpen, toggle: () => setIsOpen(p => !p), close: () => setIsOpen(false) }}>
      {children}
    </MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar() {
  const ctx = useContext(MobileSidebarContext)
  if (!ctx) throw new Error('useMobileSidebar must be used within MobileSidebarProvider')
  return ctx
}
