import { Skeleton, PageHeaderSkeleton, CardSkeleton } from '@/components/ui/skeleton'

export default function PartnersLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Partners Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} showImage showFooter />
        ))}
      </div>
    </div>
  )
}
