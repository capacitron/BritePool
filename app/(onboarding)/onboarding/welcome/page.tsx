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
      <Card className="border-earth-brown-light/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-earth-gold to-earth-gold-dark rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-serif text-earth-brown-dark">
            Welcome to BRITE POOL, {session?.user?.name?.split(' ')[0] || 'Friend'}!
          </CardTitle>
          <CardDescription className="text-lg text-earth-brown-light mt-2">
            Ministerium of Empowerment
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-earth max-w-none">
            <p className="text-earth-brown text-center text-lg leading-relaxed">
              You&apos;re about to join a community dedicated to empowerment, growth, and collective
              prosperity. Let us guide you through setting up your membership experience.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className={`border-earth-brown-light/20 cursor-pointer transition-all duration-300 ${
              expandedFeature === feature.id
                ? 'ring-2 ring-earth-gold shadow-xl scale-[1.02]'
                : 'hover:shadow-lg hover:border-earth-gold/50'
            }`}
            onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
                    expandedFeature === feature.id
                      ? 'bg-earth-gold text-white'
                      : 'bg-earth-gold/10 text-earth-gold-dark'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="font-semibold text-earth-brown-dark mb-2">{feature.title}</h3>
                <p
                  className={`text-sm text-earth-brown-light transition-all duration-300 ${
                    expandedFeature === feature.id ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  {feature.description}
                </p>
                {expandedFeature === feature.id && (
                  <div className="mt-3 text-xs text-earth-gold-dark font-medium animate-fade-in">
                    Click to collapse
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Community Commitments - Interactive Checklist */}
      <Card className="border-earth-brown-light/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif text-earth-brown-dark">
                Community Values
              </CardTitle>
              <CardDescription className="text-earth-brown-light">
                Review our core values (optional - you can proceed at any time)
              </CardDescription>
            </div>
            <button
              onClick={acceptAllCommitments}
              className="text-sm font-medium text-earth-gold-dark hover:text-earth-gold transition-colors underline"
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
                    ? 'border-earth-gold bg-earth-gold/5'
                    : 'border-earth-brown-light/20 hover:border-earth-gold/50 hover:bg-earth-gold/5'
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
                        ? 'bg-earth-gold border-earth-gold'
                        : 'border-earth-brown-light bg-white'
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
                      ? 'bg-earth-gold/20 text-earth-gold-dark'
                      : 'bg-earth-brown-light/10 text-earth-brown-light'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {commitment.icon}
                  </svg>
                </div>
                <span
                  className={`ml-3 font-medium ${
                    isAccepted ? 'text-earth-brown-dark' : 'text-earth-brown'
                  }`}
                >
                  {commitment.label}
                </span>
              </label>
            )
          })}

          {/* Progress indicator */}
          <div className="pt-4 border-t border-earth-brown-light/20">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-earth-brown-light">Commitments accepted</span>
              <span className="font-semibold text-earth-brown-dark">
                {acceptedCommitments.length} of {commitments.length}
              </span>
            </div>
            <div className="h-2 bg-earth-brown-light/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-earth-gold to-earth-gold-dark transition-all duration-300 rounded-full"
                style={{
                  width: `${(acceptedCommitments.length / commitments.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-earth-brown-dark hover:bg-earth-brown text-white px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-300"
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
              Saving...
            </>
          ) : (
            <>
              Let&apos;s Get Started
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
    </div>
  )
}
