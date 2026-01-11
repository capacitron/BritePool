'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundary
      fallbackUrl="/dashboard"
      fallbackLabel="Back to Dashboard"
    >
      <div />
    </ErrorBoundary>
  )
}
