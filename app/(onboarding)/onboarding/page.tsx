'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    // Fetch user's onboarding step and redirect
    async function checkOnboardingStep() {
      try {
        const response = await fetch('/api/onboarding/status')
        if (response.ok) {
          const data = await response.json()

          if (data.onboardingCompleted) {
            router.push('/dashboard')
            return
          }

          const stepRoutes = [
            '/onboarding/welcome',
            '/onboarding/profile',
            '/onboarding/interests',
            '/onboarding/complete',
          ]

          const currentStep = data.onboardingStep || 0
          router.push(stepRoutes[Math.min(currentStep, stepRoutes.length - 1)])
        } else {
          // Default to welcome if we can't get status
          router.push('/onboarding/welcome')
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        router.push('/onboarding/welcome')
      }
    }

    checkOnboardingStep()
  }, [session, status, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-earth-gold mb-4"></div>
      <p className="text-earth-brown-light">Loading your onboarding experience...</p>
    </div>
  )
}
