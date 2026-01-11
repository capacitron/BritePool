'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function CourseDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundary
      fallbackUrl="/dashboard/courses"
      fallbackLabel="Back to Courses"
    >
      <div />
    </ErrorBoundary>
  )
}
