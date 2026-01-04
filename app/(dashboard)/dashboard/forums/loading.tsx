import { Skeleton, PageHeaderSkeleton, CardSkeleton } from '@/components/ui/skeleton'

export default function ForumsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} showFooter />
        ))}
      </div>
    </div>
  )
}
