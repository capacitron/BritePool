import { Skeleton, PageHeaderSkeleton, ListItemSkeleton } from '@/components/ui/skeleton'

export default function EventDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Skeleton className="h-5 w-32" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-6">
            {/* Event type badge and title */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-8 w-80" />
              </div>
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>

            {/* Date/time/location grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Organized by */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        {/* Sidebar - right column */}
        <div className="space-y-6">
          {/* Registration card */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-4">
            <Skeleton className="h-6 w-28" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Attendees card */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="space-y-2">
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
