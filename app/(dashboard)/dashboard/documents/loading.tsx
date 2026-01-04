import { Skeleton, PageHeaderSkeleton, ListItemSkeleton } from '@/components/ui/skeleton'

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Search and Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Documents List */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm">
        <div className="p-6 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
