'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Lock, Users } from 'lucide-react'

interface PoolColorCardProps {
  color: 'PURPLE' | 'ORANGE' | 'GREEN' | 'BLUE'
  total: number
  pledgeCount: number
  goalAmount?: number
  isClickable?: boolean
  isLocked?: boolean
  onClick?: () => void
}

const colorStyles = {
  PURPLE: {
    bg: 'bg-purple-500',
    light: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-700',
    hover: 'hover:bg-purple-50 hover:border-purple-400',
    ring: 'ring-purple-500'
  },
  ORANGE: {
    bg: 'bg-orange-500',
    light: 'bg-orange-100',
    border: 'border-orange-300',
    text: 'text-orange-700',
    hover: 'hover:bg-orange-50 hover:border-orange-400',
    ring: 'ring-orange-500'
  },
  GREEN: {
    bg: 'bg-green-500',
    light: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    hover: 'hover:bg-green-50 hover:border-green-400',
    ring: 'ring-green-500'
  },
  BLUE: {
    bg: 'bg-blue-500',
    light: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-50 hover:border-blue-400',
    ring: 'ring-blue-500'
  }
}

const colorLabels = {
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
  const styles = colorStyles[color]
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
