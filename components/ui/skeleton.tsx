import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}

interface CardSkeletonProps {
  showImage?: boolean
  showFooter?: boolean
  className?: string
}

function CardSkeleton({ showImage = false, showFooter = false, className }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden',
        className
      )}
    >
      {showImage && <Skeleton className="h-40 w-full rounded-none" />}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      {showFooter && (
        <div className="px-6 pb-6 pt-0">
          <Skeleton className="h-10 w-full" />
        </div>
      )}
    </div>
  )
}

interface TableRowSkeletonProps {
  columns?: number
  className?: string
}

function TableRowSkeleton({ columns = 5, className }: TableRowSkeletonProps) {
  return (
    <div className={cn('flex items-center gap-4 py-3 border-b border-sand-100', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === 0 ? 'w-1/4' : 'flex-1')} />
      ))}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {showHeader && (
        <div className="flex gap-4 border-b border-sand-200 pb-4 mb-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  )
}

function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 py-4 border-b border-sand-100', className)}>
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-2 relative overflow-hidden',
        className
      )}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-sand-200" />
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

function DashboardCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden',
        className
      )}
    >
      <div className="p-6 pb-4">
        <div className="w-14 h-14 rounded-2xl bg-sand-100 mb-4" />
        <Skeleton className="h-6 w-2/3 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="px-6 pb-6">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-sand-200 bg-white shadow-warm p-4', className)}>
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CommitteeCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden',
        className
      )}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-full mt-2" />
      </div>
    </div>
  )
}

function CourseCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden',
        className
      )}
    >
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-6 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

function CalendarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-sand-200 bg-white shadow-warm p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    </div>
  )
}

export {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  ListItemSkeleton,
  StatCardSkeleton,
  PageHeaderSkeleton,
  DashboardCardSkeleton,
  EventCardSkeleton,
  CommitteeCardSkeleton,
  CourseCardSkeleton,
  CalendarSkeleton,
}
