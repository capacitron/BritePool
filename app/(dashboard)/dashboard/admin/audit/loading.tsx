import { PageHeaderSkeleton, TableSkeleton } from '@/components/admin/TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuditLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Filters skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>

      <TableSkeleton rows={15} columns={5} />
    </div>
  );
}
