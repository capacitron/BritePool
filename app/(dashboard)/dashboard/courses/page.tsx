import { ComingSoon } from '@/components/ui/coming-soon'
import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { BookOpen } from 'lucide-react'

export default function CoursesPage() {
  return (
    <LockedPageGuard feature="Learning Center">
      <ComingSoon
        title="Learning Center"
        description="Courses, modules, and educational resources are coming soon."
        icon={BookOpen}
      />
    </LockedPageGuard>
  )
}
