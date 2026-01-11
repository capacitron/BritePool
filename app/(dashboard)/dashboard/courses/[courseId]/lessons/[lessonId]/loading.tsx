import { Skeleton } from '@/components/ui/skeleton'

export default function LessonLoading() {
  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Lesson content card */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Lesson type and title */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Video/Content area skeleton */}
        <div className="px-6 pb-6">
          <Skeleton className="aspect-video w-full rounded-lg" />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}
