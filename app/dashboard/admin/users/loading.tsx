import { PageHeaderSkeleton, TableSkeleton } from '@/components/admin/TableSkeleton';

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} columns={6} />
    </div>
  );
}
