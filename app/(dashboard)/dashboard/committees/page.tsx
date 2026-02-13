import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { CommitteesContent } from './CommitteesContent'

export default function CommitteesPage() {
  return (
    <LockedPageGuard feature="Committees">
      <CommitteesContent />
    </LockedPageGuard>
  )
}
