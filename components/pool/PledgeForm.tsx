'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DollarSign, Loader2, Check, AlertCircle } from 'lucide-react'

interface PledgeFormProps {
  cutId: string
  color: 'PURPLE' | 'ORANGE' | 'GREEN'
  existingPledge?: number
  onPledgeSuccess: () => void
}

const colorStyles = {
  PURPLE: {
    bg: 'bg-purple-500',
    light: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300'
  },
  ORANGE: {
    bg: 'bg-orange-500',
    light: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300'
  },
  GREEN: {
    bg: 'bg-green-500',
    light: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300'
  }
}

const colorLabels = {
  PURPLE: 'Purple',
  ORANGE: 'Orange',
  GREEN: 'Green'
}

export function PledgeForm({ cutId, color, existingPledge, onPledgeSuccess }: PledgeFormProps) {
  const [amount, setAmount] = useState(existingPledge?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const styles = colorStyles[color]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const pledgeAmount = parseFloat(amount)
    if (isNaN(pledgeAmount) || pledgeAmount <= 0) {
      setError('Please enter a valid pledge amount')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/pools/cuts/${cutId}/pledges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pledgeAmount })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit pledge')
        return
      }

      setSuccess(true)
      onPledgeSuccess()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={cn('border-2', styles.border)}>
      <CardHeader className={styles.light}>
        <div className="flex items-center gap-2">
          <div className={cn('w-4 h-4 rounded-full', styles.bg)} />
          <CardTitle className={cn('font-display', styles.text)}>
            {colorLabels[color]} Cut Pledge
          </CardTitle>
        </div>
        <CardDescription className="font-body">
          {existingPledge
            ? 'Update your pledge amount below'
            : 'Enter your pledge amount. No funds will be transferred until the goal is reached.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-body">Pledge Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-gray-500 font-body">
              Your pledge is a commitment. Payment will be collected when the pool goal is reached.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <Check className="h-4 w-4 flex-shrink-0" />
              Your pledge has been {existingPledge ? 'updated' : 'submitted'} successfully!
            </div>
          )}

          <Button
            type="submit"
            className={cn('w-full', styles.bg, 'text-white hover:opacity-90')}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : existingPledge ? (
              'Update Pledge'
            ) : (
              'Submit Pledge'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
