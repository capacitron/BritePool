'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center p-6 bg-sand-50">
      <div className="text-center max-w-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-earth-500/10 flex items-center justify-center">
          <div className="relative">
            <Shield className="h-10 w-10 text-earth-500" />
            <AlertTriangle className="absolute -bottom-1 -right-1 h-5 w-5 text-earth-600" />
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-display font-semibold text-forest-900">
          Admin Panel Error
        </h2>
        <p className="mt-3 text-forest-600">
          An error occurred while loading the admin panel. Please try again or return to the
          dashboard.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 overflow-auto rounded-lg bg-forest-50 border border-forest-100 p-4 text-left text-xs text-forest-800 max-h-32">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Button
            onClick={reset}
            variant="outline"
            className="border-forest-200 text-forest-700 hover:bg-forest-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild className="bg-forest-600 hover:bg-forest-700 text-white">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
