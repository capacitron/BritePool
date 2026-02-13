import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { PoolsContent } from './PoolsContent'

export default function PoolsPage() {
  return (
    <LockedPageGuard feature="Investment Pools">
      <PoolsContent />
    </LockedPageGuard>
  )
}
