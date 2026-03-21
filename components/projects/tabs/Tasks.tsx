'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'

export function Tasks() {
  return (
    <Card className="border-sand-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-forest-800">
          <CheckSquare className="h-5 w-5 text-forest-600" />
          Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-bark/60 font-body py-8 text-center">
          Project task management coming soon.
        </p>
      </CardContent>
    </Card>
  )
}
