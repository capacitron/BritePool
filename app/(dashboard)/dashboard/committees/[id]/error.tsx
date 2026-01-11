'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function CommitteeDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundary
      fallbackUrl="/dashboard/committees"
      fallbackLabel="Back to Committees"
    >
      <div />
    </ErrorBoundary>
  )
}
