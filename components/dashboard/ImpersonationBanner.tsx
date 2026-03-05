'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, X, Loader2 } from 'lucide-react'

interface ImpersonationBannerProps {
  userName: string
}

export function ImpersonationBanner({ userName }: ImpersonationBannerProps) {
  const router = useRouter()
  const [stopping, setStopping] = useState(false)

  const handleStop = async () => {
    setStopping(true)
    try {
      await fetch('/api/admin/impersonate', { method: 'DELETE' })
      router.push('/dashboard/admin/users')
      router.refresh()
    } catch {
      setStopping(false)
    }
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm font-medium">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>
          Viewing as <strong>{userName}</strong> (Impersonation Mode)
        </span>
      </div>
      <button
        onClick={handleStop}
        disabled={stopping}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-700 hover:bg-amber-800 rounded text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {stopping ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        Stop Impersonating
      </button>
    </div>
  )
}
