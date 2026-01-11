'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getPoolColors, type PoolColorType } from '@/lib/design-system'
import { Lock, Users } from 'lucide-react'

interface PoolColorCardProps {
  color: PoolColorType
  total: number
  pledgeCount: number
  goalAmount?: number
  isClickable?: boolean
  isLocked?: boolean
  onClick?: () => void
}

const colorLabels: Record<PoolColorType, string> = {
  PURPLE: 'Purple',
  ORANGE: 'Orange',
  GREEN: 'Green',
  BLUE: 'Combined Total'
}

export function PoolColorCard({
  color,
  total,
  pledgeCount,
  goalAmount,
  isClickable = false,
  isLocked = true,
  onClick
}: PoolColorCardProps) {
  const styles = getPoolColors(color)
  const progress = goalAmount && goalAmount > 0 ? (total / goalAmount) * 100 : 0

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        styles.border,
        isClickable && styles.hover,
        isClickable && 'cursor-pointer'
      )}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Color bar at top */}
      <div className={cn('h-2 w-full', styles.bg)} />

      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-4 h-4 rounded-full', styles.bg)} />
            <span className={cn('font-display font-semibold', styles.text)}>
              {colorLabels[color]}
            </span>
          </div>
          {color !== 'BLUE' && isLocked && (
            <Lock className="h-4 w-4 text-gray-400" />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-2xl font-bold font-display text-gray-900">
            ${total.toLocaleString()}
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{pledgeCount} {pledgeCount === 1 ? 'pledge' : 'pledges'}</span>
          </div>

          {goalAmount && color === 'BLUE' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.min(progress, 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500', styles.bg)}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
