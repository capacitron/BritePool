import { Skeleton } from '@/components/ui/skeleton'

export default function DocumentDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header with back button, title, and actions */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content - document preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview card */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm overflow-hidden">
            <div className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              {/* Document preview area (4:5 aspect ratio like PDF) */}
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
            </div>
          </div>

          {/* Description card */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-4">
            <Skeleton className="h-6 w-28" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>

        {/* Sidebar - document details and version history */}
        <div className="space-y-6">
          {/* Document details card */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="space-y-4">
              {/* File type */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
              {/* File size */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              {/* Uploaded by */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
              {/* Created */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
              {/* Last updated */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
            </div>
          </div>

          {/* Version history card */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-sand-50">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
