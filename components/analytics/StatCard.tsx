'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
  className?: string
  iconClassName?: string
}

export function StatCard({
  icon: Icon,
  value,
  label,
  change,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-earth-brown-light">{label}</p>
            <p className="text-3xl font-bold text-earth-dark mt-1">{value}</p>
            {change && (
              <div className="flex items-center mt-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    change.type === 'increase' && 'text-green-600',
                    change.type === 'decrease' && 'text-red-600',
                    change.type === 'neutral' && 'text-gray-500'
                  )}
                >
                  {change.type === 'increase' && '+'}
                  {change.type === 'decrease' && '-'}
                  {Math.abs(change.value)}%
                </span>
                <span className="text-xs text-earth-brown-light ml-1">vs last month</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'p-3 rounded-lg bg-sage/10',
              iconClassName
            )}
          >
            <Icon className="h-6 w-6 text-sage" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
