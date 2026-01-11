import { Skeleton } from '@/components/ui/skeleton'

export default function DocumentDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-2/3" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content - Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document details */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Version history */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center gap-3 p-3 bg-sand-50 rounded-lg">
              <Skeleton className="h-2 w-2 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
