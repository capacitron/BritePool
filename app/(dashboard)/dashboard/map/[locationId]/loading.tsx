import { Skeleton } from '@/components/ui/skeleton'

export default function LocationDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header with back link and actions */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Location Details Card */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-2/3" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Coordinates */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          {/* Created by */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Media Gallery Card */}
      <div className="rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden">
        <div className="p-6 border-b border-sand-200">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
