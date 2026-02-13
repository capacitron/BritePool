import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { MapContent } from './MapContent'

export default function MapPage() {
  return (
    <LockedPageGuard feature="Map">
      <MapContent />
    </LockedPageGuard>
  )
}
