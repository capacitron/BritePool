import { PageHeaderSkeleton, CardSkeleton } from '@/components/admin/TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function ModerationLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Queue items skeleton */}
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
