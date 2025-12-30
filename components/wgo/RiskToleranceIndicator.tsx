'use client'

import { cn } from '@/lib/utils'
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'

interface RiskToleranceIndicatorProps {
  value: number // 1-10
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showDescription?: boolean
}

// Risk levels with descriptions
const RISK_LEVELS = {
  10: { label: 'Highest Trust', description: 'Organization fully endorses - lowest perceived risk', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: ShieldCheck },
  9: { label: 'Very High Trust', description: 'Extensively vetted and verified', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: ShieldCheck },
  8: { label: 'High Trust', description: 'Well established with strong track record', color: 'text-green-600', bg: 'bg-green-100', icon: ShieldCheck },
  7: { label: 'Good Trust', description: 'Verified opportunity with good history', color: 'text-green-500', bg: 'bg-green-50', icon: Shield },
  6: { label: 'Moderate-High', description: 'Generally trusted with some verification', color: 'text-lime-600', bg: 'bg-lime-100', icon: Shield },
  5: { label: 'Moderate', description: 'Standard vetting - proceed with awareness', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Shield },
  4: { label: 'Moderate-Low', description: 'Limited verification - increased caution advised', color: 'text-amber-600', bg: 'bg-amber-100', icon: ShieldQuestion },
  3: { label: 'Low Trust', description: 'Newer or less verified - higher risk', color: 'text-orange-600', bg: 'bg-orange-100', icon: ShieldQuestion },
  2: { label: 'Very Low Trust', description: 'Experimental - significant risk', color: 'text-red-500', bg: 'bg-red-50', icon: ShieldAlert },
  1: { label: 'Experimental', description: 'Unverified - highest risk category', color: 'text-red-600', bg: 'bg-red-100', icon: ShieldAlert },
}

export function RiskToleranceIndicator({ value, size = 'md', showLabel = true, showDescription = false }: RiskToleranceIndicatorProps) {
  const level = RISK_LEVELS[value as keyof typeof RISK_LEVELS] || RISK_LEVELS[5]
  const Icon = level.icon

  const sizeClasses = {
    sm: { container: 'gap-1', icon: 'h-4 w-4', text: 'text-xs', badge: 'px-1.5 py-0.5' },
    md: { container: 'gap-2', icon: 'h-5 w-5', text: 'text-sm', badge: 'px-2 py-1' },
    lg: { container: 'gap-3', icon: 'h-6 w-6', text: 'text-base', badge: 'px-3 py-1.5' },
  }

  const classes = sizeClasses[size]

  return (
    <div className={cn('flex items-center', classes.container)}>
      <div className={cn('flex items-center gap-1 rounded-full font-medium', level.bg, level.color, classes.badge)}>
        <Icon className={classes.icon} />
        <span className={classes.text}>{value}/10</span>
      </div>
      {showLabel && (
        <span className={cn('font-medium', level.color, classes.text)}>
          {level.label}
        </span>
      )}
      {showDescription && (
        <span className={cn('text-forest-500', classes.text)}>
          - {level.description}
        </span>
      )}
    </div>
  )
}

// Visual bar indicator
export function RiskToleranceBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const heightClasses = { sm: 'h-2', md: 'h-3', lg: 'h-4' }
  const height = heightClasses[size]

  return (
    <div className="w-full">
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', height)}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            value >= 8 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
            value >= 6 ? 'bg-gradient-to-r from-green-400 to-green-600' :
            value >= 4 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
            value >= 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
            'bg-gradient-to-r from-red-400 to-red-600'
          )}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-forest-400">
        <span>Higher Risk</span>
        <span>Lower Risk</span>
      </div>
    </div>
  )
}

// Compact badge version
export function RiskBadge({ value }: { value: number }) {
  const level = RISK_LEVELS[value as keyof typeof RISK_LEVELS] || RISK_LEVELS[5]

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
      level.bg,
      level.color
    )}>
      {value}
    </span>
  )
}
