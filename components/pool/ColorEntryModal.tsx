'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { X, Lock, Loader2 } from 'lucide-react'

interface ColorEntryModalProps {
  color: 'PURPLE' | 'ORANGE' | 'GREEN'
  cutId: string
  onVerify: (verified: boolean) => void
  onClose: () => void
}

const colorStyles = {
  PURPLE: {
    bg: 'bg-purple-500',
    light: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-500',
    focus: 'focus:ring-purple-500'
  },
  ORANGE: {
    bg: 'bg-orange-500',
    light: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-500',
    focus: 'focus:ring-orange-500'
  },
  GREEN: {
    bg: 'bg-green-500',
    light: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-500',
    focus: 'focus:ring-green-500'
  }
}

const colorLabels = {
  PURPLE: 'Purple',
  ORANGE: 'Orange',
  GREEN: 'Green'
}

export function ColorEntryModal({ color, cutId, onVerify, onClose }: ColorEntryModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const styles = colorStyles[color]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/pools/cuts/${cutId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        return
      }

      onVerify(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header with color */}
        <div className={cn('p-4 flex items-center justify-between', styles.light)}>
          <div className="flex items-center gap-3">
            <div className={cn('w-6 h-6 rounded-full', styles.bg)} />
            <h2 className={cn('text-lg font-display font-semibold', styles.text)}>
              Enter {colorLabels[color]} Cut
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <Lock className="h-5 w-5" />
            <p className="text-sm font-body">
              Enter the password provided by your overseer to access this pool cut.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-body">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter cut password"
              className={cn('focus:ring-2', styles.focus)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn('flex-1', styles.bg, 'text-white hover:opacity-90')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Enter Cut'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
