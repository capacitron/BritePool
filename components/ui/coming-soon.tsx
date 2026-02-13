'use client'

import { Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ComingSoonProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center border-sage-200 bg-white/80">
        <CardContent className="pt-10 pb-10 px-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mb-6">
            {Icon ? (
              <Icon className="w-8 h-8 text-sage-600" />
            ) : (
              <Clock className="w-8 h-8 text-sage-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-forest-900 mb-3">{title}</h2>
          <p className="text-stone-600 mb-6">
            {description || 'This feature is currently under development and will be available soon.'}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
