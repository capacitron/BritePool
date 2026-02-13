import { ComingSoon } from '@/components/ui/coming-soon'
import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { CreditCard } from 'lucide-react'

export default function SubscriptionPage() {
  return (
    <LockedPageGuard feature="Memberships">
      <ComingSoon
        title="Memberships"
        description="Membership plans and subscription management are coming soon."
        icon={CreditCard}
      />
    </LockedPageGuard>
  )
}
