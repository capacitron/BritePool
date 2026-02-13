import { ComingSoon } from '@/components/ui/coming-soon'
import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { Handshake } from 'lucide-react'

export default function PartnersPage() {
  return (
    <LockedPageGuard feature="Partner Gallery">
      <ComingSoon
        title="Partner Gallery"
        description="Our partner network and collaboration opportunities are coming soon."
        icon={Handshake}
      />
    </LockedPageGuard>
  )
}
