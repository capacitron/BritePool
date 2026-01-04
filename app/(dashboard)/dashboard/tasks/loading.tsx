import { Skeleton, PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Task Table */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6">
        <TableSkeleton rows={8} columns={5} />
      </div>
    </div>
  )
}
