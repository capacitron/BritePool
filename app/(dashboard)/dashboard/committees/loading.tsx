import { Skeleton, PageHeaderSkeleton, CommitteeCardSkeleton } from '@/components/ui/skeleton'

export default function CommitteesLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />

      {/* My Committees Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CommitteeCardSkeleton />
          <CommitteeCardSkeleton />
        </div>
      </section>

      {/* Other Committees Section */}
      <section>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CommitteeCardSkeleton />
          <CommitteeCardSkeleton />
          <CommitteeCardSkeleton />
        </div>
      </section>
    </div>
  )
}
