'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export function CommunityMembers() {
  return (
    <Card className="border-sand-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-forest-800">
          <CreditCard className="h-5 w-5 text-forest-600" />
          Community Members
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-bark/60 font-body py-8 text-center">
          Community membership management coming soon.
        </p>
      </CardContent>
    </Card>
  )
}
