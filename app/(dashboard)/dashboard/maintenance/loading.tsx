import { Skeleton, PageHeaderSkeleton, CardSkeleton } from '@/components/ui/skeleton'

export default function MaintenanceLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-sand-200 bg-white shadow-warm p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Requests Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} showFooter />
        ))}
      </div>
    </div>
  )
}
