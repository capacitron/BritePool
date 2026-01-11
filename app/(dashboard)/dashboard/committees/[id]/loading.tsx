import { Skeleton } from '@/components/ui/skeleton'

export default function CommitteeDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          {/* Back link */}
          <Skeleton className="h-5 w-36" />
          {/* Title and type badge */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          {/* Description */}
          <Skeleton className="h-4 w-96" />
          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        {/* Join/Leave button */}
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-sand-200 pb-2">
        <Skeleton className="h-10 w-20 rounded-t-lg" />
        <Skeleton className="h-10 w-28 rounded-t-lg" />
        <Skeleton className="h-10 w-28 rounded-t-lg" />
        <Skeleton className="h-10 w-24 rounded-t-lg" />
      </div>

      {/* Tab content - Members grid */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden">
        <div className="p-6 border-b border-sand-100">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl border border-sand-200 bg-sand-50"
              >
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden">
        <div className="p-6 border-b border-sand-100">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-36" />
          </div>
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-sand-50 rounded-lg"
            >
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
