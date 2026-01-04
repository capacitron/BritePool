import {
  Skeleton,
  PageHeaderSkeleton,
  EventCardSkeleton,
  CalendarSkeleton,
} from '@/components/ui/skeleton'

export default function EventsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <CalendarSkeleton />
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="space-y-3">
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
