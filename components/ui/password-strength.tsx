'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface PasswordRequirement {
  label: string
  met: boolean
}

interface PasswordStrengthProps {
  password: string
  className?: string
}

function getPasswordStrength(password: string): {
  score: number
  label: string
  requirements: PasswordRequirement[]
} {
  const requirements: PasswordRequirement[] = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      label: 'Contains a number',
      met: /[0-9]/.test(password),
    },
  ]

  const metCount = requirements.filter((req) => req.met).length
  const score = metCount / requirements.length

  let label: string
  if (password.length === 0) {
    label = ''
  } else if (score <= 0.25) {
    label = 'Weak'
  } else if (score <= 0.5) {
    label = 'Fair'
  } else if (score <= 0.75) {
    label = 'Good'
  } else {
    label = 'Strong'
  }

  return { score, label, requirements }
}

function getStrengthColor(score: number, password: string): string {
  if (password.length === 0) return 'bg-sand-300'
  if (score <= 0.25) return 'bg-earth-500'
  if (score <= 0.5) return 'bg-amber-500'
  if (score <= 0.75) return 'bg-forest-400'
  return 'bg-forest-600'
}

function getLabelColor(score: number, password: string): string {
  if (password.length === 0) return 'text-forest-500'
  if (score <= 0.25) return 'text-earth-600'
  if (score <= 0.5) return 'text-amber-600'
  if (score <= 0.75) return 'text-forest-500'
  return 'text-forest-700'
}

const PasswordStrength = React.forwardRef<HTMLDivElement, PasswordStrengthProps>(
  ({ password, className }, ref) => {
    const { score, label, requirements } = getPasswordStrength(password)

    return (
      <div ref={ref} className={cn('space-y-3', className)}>
        {/* Strength meter bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-forest-600 font-body">Password strength</span>
            {label && (
              <span
                className={cn(
                  'text-xs font-semibold font-body transition-colors',
                  getLabelColor(score, password)
                )}
              >
                {label}
              </span>
            )}
          </div>
          <div className="h-2 w-full bg-sand-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300 ease-out',
                getStrengthColor(score, password)
              )}
              style={{ width: `${score * 100}%` }}
            />
          </div>
        </div>

        {/* Requirements checklist */}
        <div className="space-y-1.5">
          {requirements.map((requirement) => (
            <div key={requirement.label} className="flex items-center gap-2 text-xs font-body">
              {requirement.met ? (
                <Check className="h-3.5 w-3.5 text-forest-600 flex-shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 text-sand-400 flex-shrink-0" />
              )}
              <span
                className={cn(
                  'transition-colors',
                  requirement.met ? 'text-forest-700' : 'text-forest-400'
                )}
              >
                {requirement.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

PasswordStrength.displayName = 'PasswordStrength'

export { PasswordStrength, getPasswordStrength }
