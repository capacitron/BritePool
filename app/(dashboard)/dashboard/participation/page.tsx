import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { ParticipationContent } from './ParticipationContent'

export default function ParticipationPage() {
  return (
    <LockedPageGuard feature="Sacred Ledger">
      <ParticipationContent />
    </LockedPageGuard>
  )
}
