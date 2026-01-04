import { Skeleton, PageHeaderSkeleton, CourseCardSkeleton } from '@/components/ui/skeleton'

export default function CoursesLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Tabs and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Course Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourseCardSkeleton />
        <CourseCardSkeleton />
        <CourseCardSkeleton />
        <CourseCardSkeleton />
        <CourseCardSkeleton />
        <CourseCardSkeleton />
      </div>
    </div>
  )
}
