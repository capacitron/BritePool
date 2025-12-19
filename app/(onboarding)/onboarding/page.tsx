'use client'

import { useEffect, useState } from 'react'

export default function OnboardingPage() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function checkAndRedirect() {
      try {
        // Check onboarding status from database
        const response = await fetch('/api/onboarding/status')
        if (response.ok) {
          const data = await response.json()

          if (data.onboardingCompleted) {
            // Already completed - go to dashboard
            setStatus('completed')
            window.location.href = '/dashboard'
            return
          }

          // Not completed - go to appropriate step
          const stepRoutes = [
            '/onboarding/welcome',
            '/onboarding/profile',
            '/onboarding/interests',
            '/onboarding/complete',
          ]
          const currentStep = data.onboardingStep || 0
          window.location.href = stepRoutes[Math.min(currentStep, stepRoutes.length - 1)]
        } else {
          // Error or unauthorized - go to welcome
          window.location.href = '/onboarding/welcome'
        }
      } catch (error) {
        console.error('Error checking onboarding:', error)
        window.location.href = '/onboarding/welcome'
      }
    }

    checkAndRedirect()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-earth-gold mb-4"></div>
      <p className="text-earth-brown-light">
        {status === 'completed' ? 'Redirecting to dashboard...' : 'Loading...'}
      </p>
    </div>
  )
}
