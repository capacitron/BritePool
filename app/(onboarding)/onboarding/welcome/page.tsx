'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function WelcomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleNext = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1 }),
      })
      router.push('/onboarding/covenant')
    } catch (error) {
      console.error('Error saving progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Welcome Card - Forest Wealth Design */}
      <Card className="border-0 shadow-2xl overflow-hidden relative bg-gradient-to-br from-sand-100 via-white to-forest-50">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23324c3a' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} />

        <CardHeader className="text-center pb-2 pt-10 relative">
          {/* Animated sun/light symbol with glow */}
          <div className="mx-auto mb-6 relative">
            <div className="absolute inset-0 w-28 h-28 bg-earth-400/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-earth-400 via-earth-500 to-earth-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-white/50">
              <svg
                className="w-12 h-12 text-white drop-shadow-lg"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>

          {/* Welcome text with refined typography */}
          <CardTitle className="text-4xl md:text-5xl font-display text-forest-800 tracking-tight">
            Welcome, <span className="text-earth-500 italic">{session?.user?.name?.split(' ')[0] || 'Friend'}</span>
          </CardTitle>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-earth-400" />
            <CardDescription className="text-base uppercase tracking-[0.3em] text-forest-600 font-medium font-body">
              Ministerium of Empowerment
            </CardDescription>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-earth-400" />
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-10 relative">
          <div className="max-w-xl mx-auto">
            <p className="text-forest-700 text-center text-xl leading-relaxed font-body">
              You&apos;re about to join a community dedicated to{' '}
              <span className="font-medium text-forest-800">empowerment</span>,{' '}
              <span className="font-medium text-forest-800">growth</span>, and{' '}
              <span className="font-medium text-forest-800">collective prosperity</span>.
            </p>
            <p className="text-forest-500 text-center mt-4 text-lg font-body">
              Let us guide you through setting up your membership experience.
            </p>
          </div>

          {/* Decorative bottom flourish */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-earth-400/30 to-transparent" />
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="group relative bg-gradient-to-r from-forest-700 via-forest-600 to-forest-700 hover:from-earth-500 hover:via-earth-400 hover:to-earth-500 text-white px-12 py-6 text-xl font-display font-semibold shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-105 rounded-xl overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {isLoading ? (
            <span className="flex items-center relative">
              <svg
                className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </span>
          ) : (
            <span className="flex items-center relative">
              Get Started
              <svg className="w-6 h-6 ml-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
