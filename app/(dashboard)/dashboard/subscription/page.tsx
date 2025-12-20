'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PricingCards } from '@/components/pricing/PricingCards'
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function SubscriptionPage() {
  const { data: session, update } = useSession()
  const searchParams = useSearchParams()
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    if (success) {
      update()
    }
  }, [success, update])

  const currentTier = session?.user?.subscriptionTier || 'FREE'
  const subscriptionStatus = session?.user?.subscriptionStatus || 'INACTIVE'

  const handleSelectPlan = async (tier: string) => {
    setError(null)
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const handleManageBilling = async () => {
    setIsLoadingPortal(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoadingPortal(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      ACTIVE: { color: 'bg-forest-600 text-white', label: 'Active' },
      INACTIVE: { color: 'bg-sand-200 text-forest-700', label: 'Inactive' },
      PAST_DUE: { color: 'bg-earth-500 text-white', label: 'Past Due' },
      CANCELLED: { color: 'bg-sand-200 text-forest-700', label: 'Cancelled' },
    }
    const config = statusConfig[status] || statusConfig.INACTIVE
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium font-body ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-forest-800">
          Subscription Management
        </h1>
        <p className="text-forest-500 mt-2 font-body">
          Manage your membership plan and billing
        </p>
      </div>

      {success && (
        <div className="bg-forest-50 border border-forest-300 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-forest-600" />
          <p className="text-forest-700 font-body">
            Your subscription has been activated successfully!
          </p>
        </div>
      )}

      {canceled && (
        <div className="bg-earth-50 border border-earth-300 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-earth-600" />
          <p className="text-earth-700 font-body">
            Payment was cancelled. Your subscription has not been changed.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-earth-50 border border-earth-300 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-earth-600" />
          <p className="text-earth-700 font-body">{error}</p>
        </div>
      )}

      <Card className="border-sand-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <CreditCard className="h-5 w-5 text-forest-600" />
            Current Plan
          </CardTitle>
          <CardDescription className="text-forest-500 font-body">
            Your current subscription details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-display text-forest-800">
                  {currentTier}
                </span>
                {getStatusBadge(subscriptionStatus)}
              </div>
              <p className="text-sm text-forest-500 mt-1 font-body">
                {currentTier === 'FREE'
                  ? 'Upgrade to unlock more features'
                  : 'Thank you for being a valued member!'}
              </p>
            </div>

            {currentTier !== 'FREE' && subscriptionStatus === 'ACTIVE' && (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={isLoadingPortal}
                className="border-forest-600 text-forest-700 hover:bg-forest-50"
              >
                {isLoadingPortal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Billing
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-display font-semibold text-forest-800 mb-6">
          Available Plans
        </h2>
        <PricingCards
          currentTier={currentTier}
          onSelectPlan={handleSelectPlan}
        />
      </div>
    </div>
  )
}
