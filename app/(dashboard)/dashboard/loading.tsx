import { Skeleton, StatCardSkeleton, DashboardCardSkeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Hero Welcome Section Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 p-8 md:p-10">
        <div className="relative space-y-4">
          <Skeleton className="h-4 w-24 bg-white/20" />
          <Skeleton className="h-12 w-48 bg-white/20" />
          <Skeleton className="h-5 w-80 bg-white/20" />
          <Skeleton className="h-10 w-32 rounded-full bg-white/20 mt-6" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Feature Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    </div>
  )
}
