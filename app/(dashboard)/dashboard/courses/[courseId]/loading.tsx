import { Skeleton } from '@/components/ui/skeleton'

export default function CourseDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Skeleton className="h-5 w-36" />

      {/* Course Hero */}
      <div className="relative rounded-xl overflow-hidden">
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Course Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About section */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {/* Course content / lessons */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6">
            <Skeleton className="h-6 w-36 mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-sand-100">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment card */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-4">
            <div className="text-center">
              <Skeleton className="h-12 w-12 mx-auto rounded-xl mb-2" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Course info card */}
          <div className="rounded-2xl border border-sand-200 bg-white shadow-warm p-6 space-y-4">
            <Skeleton className="h-5 w-24 mb-2" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
