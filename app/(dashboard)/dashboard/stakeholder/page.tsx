import { ComingSoon } from '@/components/ui/coming-soon'
import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { PieChart } from 'lucide-react'

export default function StakeholderPage() {
  return (
    <LockedPageGuard feature="Stakeholder Dashboard">
      <ComingSoon
        title="Stakeholder Dashboard"
        description="The stakeholder dashboard with metrics, reports, and community insights is coming soon."
        icon={PieChart}
      />
    </LockedPageGuard>
  )
}
