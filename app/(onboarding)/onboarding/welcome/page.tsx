'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const commitments = [
  {
    id: 'respect',
    label: 'Treat all members with respect and dignity',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    ),
  },
  {
    id: 'participate',
    label: 'Actively participate in community initiatives',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
  },
  {
    id: 'grow',
    label: 'Commit to personal and collective growth',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    ),
  },
  {
    id: 'contribute',
    label: 'Contribute skills and knowledge to empower others',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
  },
]

const features = [
  {
    id: 'committees',
    title: 'Join Committees',
    description: 'Participate in governance, wealth building, education, health, and operations.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
  },
  {
    id: 'learn',
    title: 'Learn & Grow',
    description: 'Access courses, workshops, and resources for your empowerment journey.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
  },
  {
    id: 'equity',
    title: 'Build Equity',
    description: 'Track contributions and earn equity through the Sacred Ledger system.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    ),
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedCommitments, setAcceptedCommitments] = useState<string[]>([])
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null)

  const allCommitmentsAccepted = acceptedCommitments.length === commitments.length

  const toggleCommitment = (id: string) => {
    setAcceptedCommitments((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const acceptAllCommitments = () => {
    if (allCommitmentsAccepted) {
      setAcceptedCommitments([])
    } else {
      setAcceptedCommitments(commitments.map((c) => c.id))
    }
  }

  const handleNext = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1 }),
      })
      router.push('/onboarding/profile')
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

      {/* Interactive Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card
            key={feature.id}
            className={`group border-0 cursor-pointer transition-all duration-500 overflow-hidden relative ${
              expandedFeature === feature.id
                ? 'shadow-2xl scale-[1.03] bg-gradient-to-br from-earth-100/50 to-white'
                : 'shadow-lg hover:shadow-xl hover:-translate-y-1 bg-white'
            }`}
            onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Accent bar at top */}
            <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
              expandedFeature === feature.id
                ? 'bg-gradient-to-r from-earth-400 via-earth-500 to-earth-400'
                : 'bg-gradient-to-r from-transparent via-earth-300/30 to-transparent group-hover:via-earth-400/60'
            }`} />

            <CardContent className="pt-8 pb-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 ${
                    expandedFeature === feature.id
                      ? 'bg-gradient-to-br from-earth-400 to-earth-500 text-white shadow-lg rotate-3'
                      : 'bg-forest-100 text-forest-600 group-hover:bg-earth-100 group-hover:text-earth-600'
                  }`}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="font-display text-xl font-semibold text-forest-800 mb-3">{feature.title}</h3>
                <p
                  className={`text-sm leading-relaxed font-body transition-all duration-300 ${
                    expandedFeature === feature.id ? 'text-forest-700' : 'text-forest-500'
                  }`}
                >
                  {feature.description}
                </p>
                {expandedFeature === feature.id && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-earth-600 font-medium font-body">
                    <span className="w-4 h-px bg-earth-400" />
                    Tap to collapse
                    <span className="w-4 h-px bg-earth-400" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Community Commitments - Interactive Checklist */}
      <Card className="border-sand-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-display text-forest-800">
                Community Values
              </CardTitle>
              <CardDescription className="text-forest-500 font-body">
                Review our core values (optional - you can proceed at any time)
              </CardDescription>
            </div>
            <button
              onClick={acceptAllCommitments}
              className="text-sm font-medium text-earth-600 hover:text-earth-500 transition-colors underline font-body"
            >
              {allCommitmentsAccepted ? 'Clear all' : 'Accept all'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {commitments.map((commitment) => {
            const isAccepted = acceptedCommitments.includes(commitment.id)
            return (
              <label
                key={commitment.id}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isAccepted
                    ? 'border-earth-400 bg-earth-50'
                    : 'border-sand-200 hover:border-earth-300 hover:bg-earth-50/50'
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isAccepted}
                    onChange={() => toggleCommitment(commitment.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isAccepted
                        ? 'bg-earth-500 border-earth-500'
                        : 'border-forest-300 bg-white'
                    }`}
                  >
                    {isAccepted && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div
                  className={`ml-4 w-10 h-10 rounded-lg flex items-center justify-center ${
                    isAccepted
                      ? 'bg-earth-100 text-earth-600'
                      : 'bg-forest-100 text-forest-500'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {commitment.icon}
                  </svg>
                </div>
                <span
                  className={`ml-3 font-medium font-body ${
                    isAccepted ? 'text-forest-800' : 'text-forest-700'
                  }`}
                >
                  {commitment.label}
                </span>
              </label>
            )
          })}

          {/* Progress indicator */}
          <div className="pt-4 border-t border-sand-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-forest-500 font-body">Commitments accepted</span>
              <span className="font-semibold text-forest-800 font-body">
                {acceptedCommitments.length} of {commitments.length}
              </span>
            </div>
            <div className="h-2 bg-sand-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-earth-400 to-earth-500 transition-all duration-300 rounded-full"
                style={{
                  width: `${(acceptedCommitments.length / commitments.length) * 100}%`,
                }}
              />
            </div>
          </div>
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
              Preparing Your Journey...
            </span>
          ) : (
            <span className="flex items-center relative">
              Begin Your Journey
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
