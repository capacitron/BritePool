import { ComingSoon } from '@/components/ui/coming-soon'
import { LockedPageGuard } from '@/components/dashboard/LockedPageGuard'
import { FileText } from 'lucide-react'

export default function DocumentsPage() {
  return (
    <LockedPageGuard feature="Document Library">
      <ComingSoon
        title="Document Library"
        description="The document library with resources and files will be available soon."
        icon={FileText}
      />
    </LockedPageGuard>
  )
}
