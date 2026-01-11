import { Skeleton } from '@/components/ui/skeleton'

export default function CommitteeDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="flex items-center gap-4 mt-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-sand-200 pb-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-t-lg" />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px] rounded-2xl border border-sand-200 bg-white shadow-warm p-6">
        {/* Chat-like content skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-sand-50 rounded-lg">
              <div className="space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
