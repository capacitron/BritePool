'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ProfileError({
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
