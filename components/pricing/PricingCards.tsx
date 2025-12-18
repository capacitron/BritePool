'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingCardsProps {
  currentTier: string
  onSelectPlan: (tier: string) => Promise<void>
}

const tiers = [
  {
    name: 'FREE',
    price: 0,
    description: 'Get started with basic access',
    features: [
      'Access to public forums',
      'View community events',
      'Basic profile',
      'Limited course access',
    ],
  },
  {
    name: 'BASIC',
    price: 10,
    description: 'Essential membership benefits',
    features: [
      'Everything in Free',
      'Full forum participation',
      'Event registration',
      'Standard course library',
      'Committee access',
      'Monthly newsletter',
    ],
    popular: false,
  },
  {
    name: 'PREMIUM',
    price: 25,
    description: 'Enhanced community experience',
    features: [
      'Everything in Basic',
      'Priority event registration',
      'Premium course library',
      'Exclusive workshops',
      'Mentorship program',
      'Sacred Ledger tracking',
      'Voting rights',
    ],
    popular: true,
  },
  {
    name: 'PLATINUM',
    price: 99,
    description: 'Complete membership package',
    features: [
      'Everything in Premium',
      'Leadership opportunities',
      'All courses & workshops',
      'Private coaching sessions',
      'Equity unit accumulation',
      'Board meeting access',
      'Partner benefits',
      'Sanctuary access priority',
    ],
  },
]

export function PricingCards({ currentTier, onSelectPlan }: PricingCardsProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  const handleSelectPlan = async (tier: string) => {
    if (tier === 'FREE' || tier === currentTier) return
    
    setLoadingTier(tier)
    try {
      await onSelectPlan(tier)
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tiers.map((tier) => {
        const isCurrent = currentTier === tier.name
        const isDowngrade = getTierLevel(tier.name) < getTierLevel(currentTier)
        
        return (
          <Card
            key={tier.name}
            className={cn(
              'relative flex flex-col',
              tier.popular && 'border-earth-brown border-2',
              isCurrent && 'ring-2 ring-sage'
            )}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-earth-brown text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            
            {isCurrent && (
              <div className="absolute -top-3 right-4">
                <span className="bg-sage text-white text-xs font-medium px-3 py-1 rounded-full">
                  Current Plan
                </span>
              </div>
            )}

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-earth-brown-dark">
                  ${tier.price}
                </span>
                <span className="text-earth-brown-light">/month</span>
              </div>

              <ul className="space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-sage flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-earth-dark">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={tier.popular ? 'default' : 'outline'}
                disabled={tier.name === 'FREE' || isCurrent || loadingTier !== null}
                onClick={() => handleSelectPlan(tier.name)}
              >
                {loadingTier === tier.name ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : isCurrent ? (
                  'Current Plan'
                ) : tier.name === 'FREE' ? (
                  'Free Plan'
                ) : isDowngrade ? (
                  'Contact Support'
                ) : (
                  'Select Plan'
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

function getTierLevel(tier: string): number {
  const levels: Record<string, number> = {
    FREE: 0,
    BASIC: 1,
    PREMIUM: 2,
    PLATINUM: 3,
  }
  return levels[tier] ?? 0
}
