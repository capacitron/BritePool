import { Skeleton, PageHeaderSkeleton } from '@/components/ui/skeleton'

export default function MediaLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Media Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden"
          >
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
