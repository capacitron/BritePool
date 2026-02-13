import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { MediaContent } from './MediaContent'

export default function MediaPage() {
  return (
    <LockedPageGuard feature="Media Gallery">
      <MediaContent />
    </LockedPageGuard>
  )
}
