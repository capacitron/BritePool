import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { MaintenanceContent } from './MaintenanceContent'

export default function MaintenancePage() {
  return (
    <LockedPageGuard feature="Maintenance">
      <MaintenanceContent />
    </LockedPageGuard>
  )
}
