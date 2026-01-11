import { Skeleton } from '@/components/ui/skeleton'

export default function LessonLoading() {
  return (
    <div className="space-y-6">
      {/* Header with back link and lesson counter */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Main lesson card */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden">
        {/* Card header */}
        <div className="p-6 space-y-4 border-b border-sand-100">
          {/* Lesson type and completion status */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24 ml-2" />
          </div>
          {/* Lesson title */}
          <Skeleton className="h-8 w-2/3" />
          {/* Description */}
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Card content - video/content area */}
        <div className="p-6 space-y-4">
          {/* Video placeholder (16:9 aspect ratio) */}
          <Skeleton className="aspect-video w-full rounded-lg" />

          {/* Text content below video */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}
