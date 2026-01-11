import { Skeleton, PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Users card */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden">
        {/* Card header */}
        <div className="p-6 border-b border-sand-100">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Card content */}
        <div className="p-6">
          {/* Search and filters */}
          <div className="flex gap-4 flex-wrap mb-6">
            <Skeleton className="h-10 flex-1 min-w-[200px]" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-20" />
          </div>

          {/* Table */}
          <TableSkeleton rows={10} columns={6} />

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-sand-100">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
