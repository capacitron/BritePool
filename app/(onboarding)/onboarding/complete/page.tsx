'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const quickStartItems = [
  {
    id: 'dashboard',
    href: '/dashboard',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    ),
    title: 'View Your Dashboard',
    description: 'Check your personalized dashboard for announcements, tasks, and upcoming events.',
  },
  {
    id: 'committees',
    href: '/dashboard/committees',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
    title: 'Join a Committee',
    description: 'Browse available committees and request to join ones that match your interests.',
  },
  {
    id: 'courses',
    href: '/dashboard/courses',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
    title: 'Start Learning',
    description: 'Explore our course library and begin your empowerment journey.',
  },
  {
    id: 'events',
    href: '/dashboard/events',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
    title: 'Check Events',
    description: 'View upcoming community events, workshops, and meetings.',
  },
]

// Confetti particle data type
interface ConfettiData {
  id: number
  delay: number
  left: number
  color: string
  duration: number
}

export default function CompletePage() {
  const router = useRouter()
  const { update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiParticles, setConfettiParticles] = useState<ConfettiData[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [celebrationStep, setCelebrationStep] = useState(0)

  useEffect(() => {
    // Generate confetti only on client side to avoid hydration mismatch
    const colors = ['#ea8f6f', '#324c3a', '#4f7658', '#d0a46d', '#6f9379']
    const particles: ConfettiData[] = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      delay: i * 50,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 2000 + Math.random() * 1000,
    }))
    setConfettiParticles(particles)
    setShowConfetti(true)

    // Celebration animation sequence
    const timer1 = setTimeout(() => setCelebrationStep(1), 300)
    const timer2 = setTimeout(() => setCelebrationStep(2), 600)
    const timer3 = setTimeout(() => setCelebrationStep(3), 900)
    const confettiTimer = setTimeout(() => setShowConfetti(false), 4000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(confettiTimer)
    }
  }, [])

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      // Update session to get fresh data
      await update()

      // Use hard redirect with flag to prevent redirect loop
      const firstSelected = quickStartItems.find((item) => selectedItems.includes(item.id))
      const targetPath = firstSelected?.href || '/dashboard'
      // Add flag to indicate fresh onboarding completion - prevents redirect loop
      const separator = targetPath.includes('?') ? '&' : '?'
      window.location.href = `${targetPath}${separator}onboarding_complete=true`
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 relative overflow-hidden">
      {/* Confetti animation - rendered client-side only */}
      {showConfetti && confettiParticles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {confettiParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                left: `${particle.left}%`,
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}ms`,
                animationDuration: `${particle.duration}ms`,
              }}
            />
          ))}
        </div>
      )}

      <Card className="border-sand-200 shadow-lg text-center overflow-hidden">
        <CardHeader className="pb-4 relative">
          {/* Animated success icon */}
          <div
            className={`mx-auto mb-4 w-24 h-24 bg-gradient-to-br from-forest-400 to-forest-600 rounded-full flex items-center justify-center transition-all duration-500 ${
              celebrationStep >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          >
            <svg
              className={`w-12 h-12 text-white transition-all duration-300 ${
                celebrationStep >= 2 ? 'scale-100' : 'scale-0'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
                className={celebrationStep >= 2 ? 'animate-draw-check' : ''}
              />
            </svg>
          </div>

          <CardTitle
            className={`text-3xl font-display text-forest-800 transition-all duration-500 ${
              celebrationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            You&apos;re All Set!
          </CardTitle>
        </CardHeader>
        <CardContent
          className={`transition-all duration-500 delay-300 ${
            celebrationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-lg text-forest-700 mb-6 font-body">
            Welcome to the BRITE POOL community! Your profile is set up and you&apos;re ready to
            start your journey.
          </p>
          <div className="inline-flex items-center gap-2 bg-earth-100 text-earth-700 px-4 py-2 rounded-full text-sm font-medium animate-pulse font-body">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Onboarding Complete
          </div>
        </CardContent>
      </Card>

      <Card className="border-sand-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display text-forest-800">
              What would you like to explore first?
            </CardTitle>
            {selectedItems.length > 0 && (
              <span className="text-sm text-earth-600 font-medium font-body">
                {selectedItems.length} selected
              </span>
            )}
          </div>
          <p className="text-sm text-forest-500 mt-1 font-body">
            Select the areas you&apos;d like to explore (optional)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {quickStartItems.map((item, index) => {
              const isSelected = selectedItems.includes(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-start gap-4 p-4 rounded-lg text-left transition-all duration-200 border-2 ${
                    isSelected
                      ? 'border-earth-400 bg-earth-50 shadow-md'
                      : 'border-transparent bg-sand-50 hover:bg-sand-100 hover:border-earth-200'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                      isSelected
                        ? 'bg-earth-500 text-white'
                        : 'bg-earth-100 text-earth-600'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-medium font-body ${
                          isSelected ? 'text-forest-800' : 'text-forest-800'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-earth-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-forest-500 mt-1 font-body">{item.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {selectedItems.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setSelectedItems([])}
            className="border-forest-600 border-2 text-forest-700 hover:bg-forest-600 hover:text-white font-semibold"
          >
            Clear selection
          </Button>
        )}
        <Button
          onClick={handleComplete}
          disabled={isLoading}
          size="lg"
          className="bg-forest-600 hover:bg-forest-700 text-white px-12 py-4 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
            </>
          ) : selectedItems.length > 0 ? (
            <>
              Explore{' '}
              {selectedItems.length === 1
                ? quickStartItems.find((i) => i.id === selectedItems[0])?.title
                : `${selectedItems.length} Areas`}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          ) : (
            <>
              Go to Dashboard
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </Button>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        @keyframes draw-check {
          0% {
            stroke-dasharray: 0 100;
          }
          100% {
            stroke-dasharray: 100 0;
          }
        }
        .animate-draw-check {
          stroke-dasharray: 100;
          animation: draw-check 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
