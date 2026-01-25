'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Shield, ScrollText, AlertTriangle, Loader2, Check, Clock } from 'lucide-react'

interface Contract {
  id: string
  version: string
  content: string
  publishedAt: string
}

const UNLOCK_SCROLL_THRESHOLD = 75 // Unlock at 75% scroll
const UNLOCK_TIME_SECONDS = 30 // Or unlock after 30 seconds

export default function ContractReviewPage() {
  const router = useRouter()
  const { data: session, status, update: updateSession } = useSession()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canAgree, setCanAgree] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(UNLOCK_TIME_SECONDS)
  const [unlockedByTime, setUnlockedByTime] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch contract
  useEffect(() => {
    async function fetchContract() {
      try {
        const response = await fetch('/api/contract/active')
        if (!response.ok) {
          if (response.status === 404) {
            setError('No active membership agreement found. Please contact support.')
          } else {
            setError('Failed to load membership agreement. Please try again.')
          }
          return
        }
        const data = await response.json()
        setContract(data)
      } catch (err) {
        setError('Failed to load membership agreement. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchContract()
    }
  }, [status])

  // Time-based unlock countdown
  useEffect(() => {
    if (!contract || canAgree) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setUnlockedByTime(true)
          setCanAgree(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [contract, canAgree])

  // Scroll tracking
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const scrollableHeight = scrollHeight - clientHeight
    const progress = scrollableHeight > 0
      ? Math.min((scrollTop / scrollableHeight) * 100, 100)
      : 100
    setScrollProgress(progress)

    // Unlock at threshold (softer requirement)
    if (progress >= UNLOCK_SCROLL_THRESHOLD && !canAgree) {
      setCanAgree(true)
    }
  }, [canAgree])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !contract) return

    container.addEventListener('scroll', handleScroll)
    // Check initial state
    handleScroll()

    return () => container.removeEventListener('scroll', handleScroll)
  }, [contract, handleScroll])

  async function handleAccept() {
    if (!contract || !isAgreed) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/contract/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contractVersionId: contract.id,
          version: contract.version,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 401) {
          setError('Your session has expired. Redirecting to login...')
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
          return
        }
        setError(data.error || 'Failed to accept agreement. Please try again.')
        return
      }

      await updateSession()
      const updatedSession = await fetch('/api/auth/session', { credentials: 'include' }).then((res) => res.json())
      if (!updatedSession?.user?.onboardingCompleted) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (err) {
      setError('Failed to accept agreement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sand-50 to-cream flex flex-col">
        <header className="sticky top-0 z-10 bg-forest-800 text-white px-4 py-6">
          <div className="max-w-prose mx-auto">
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-48 bg-white/20 rounded" />
                <div className="h-4 w-32 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-prose mx-auto px-4 md:px-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-3/4 bg-sand-200 rounded" />
              <div className="h-4 w-full bg-sand-200 rounded" />
              <div className="h-4 w-5/6 bg-sand-200 rounded" />
              <div className="h-4 w-4/5 bg-sand-200 rounded" />
              <div className="h-32 w-full bg-sand-100 rounded-xl mt-8" />
            </div>
            <p className="mt-8 text-center text-forest-600 flex items-center justify-center gap-2 font-body">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading membership agreement...
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error && !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sand-50 to-cream flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-earth-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-forest-800 mb-2">
            Unable to Load Agreement
          </h2>
          <p className="text-forest-600 mb-6 font-body">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-forest-600 hover:bg-forest-700 text-white px-8"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand-50 to-cream flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-sand-200 shadow-sm">
        <div className="max-w-prose mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center">
                <ScrollText className="w-5 h-5 text-forest-600" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-display font-bold text-forest-800">
                  Membership Agreement
                </h1>
                <p className="text-xs text-forest-500 font-body flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Version {contract?.version}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-forest-700">{Math.round(scrollProgress)}%</p>
              <p className="text-xs text-forest-500">read</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-1.5 bg-sand-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forest-500 to-forest-600 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <article className="max-w-prose mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Rendered Markdown Content */}
          <div className="prose prose-lg prose-forest max-w-none
            prose-headings:font-display prose-headings:text-forest-800 prose-headings:font-bold
            prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-0
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-sand-200
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-forest-700 prose-p:leading-relaxed prose-p:mb-4
            prose-li:text-forest-700 prose-li:leading-relaxed
            prose-ul:my-4 prose-ol:my-4
            prose-strong:text-forest-800 prose-strong:font-semibold
            prose-em:text-forest-600
            font-body
          ">
            <ReactMarkdown>{contract?.content || ''}</ReactMarkdown>
          </div>
        </article>
      </main>

      {/* Sticky Footer */}
      <footer className="sticky bottom-0 z-10 bg-white border-t border-sand-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-prose mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Error Message */}
          {error && (
            <div className="bg-earth-50 border border-earth-200 text-earth-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2 font-body">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Unlock Status */}
          {!canAgree && (
            <div className="flex items-center justify-center gap-4 mb-4 text-sm text-forest-500 font-body">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {timeRemaining}s remaining
              </span>
              <span className="text-sand-400">or</span>
              <span>scroll to {UNLOCK_SCROLL_THRESHOLD}%</span>
            </div>
          )}

          {/* Agreement Checkbox */}
          <label
            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 mb-4 ${
              canAgree
                ? isAgreed
                  ? 'border-forest-500 bg-forest-50 cursor-pointer'
                  : 'border-sand-300 hover:border-forest-300 bg-white cursor-pointer'
                : 'border-sand-200 bg-sand-50 cursor-not-allowed'
            }`}
          >
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => canAgree && setIsAgreed(e.target.checked)}
                disabled={!canAgree || isSubmitting}
                className="sr-only peer"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                isAgreed
                  ? 'bg-forest-600 border-forest-600'
                  : canAgree
                    ? 'border-forest-400 bg-white hover:border-forest-500'
                    : 'border-sand-300 bg-sand-100'
              }`}>
                {isAgreed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            </div>
            <span className={`text-sm leading-relaxed font-body ${
              !canAgree ? 'text-forest-400' : 'text-forest-700'
            }`}>
              I have read and agree to the <strong className="text-forest-800">Membership Agreement</strong> and
              understand my rights and obligations as a BRITE POOL member.
            </span>
          </label>

          {/* Submit Button */}
          <Button
            onClick={handleAccept}
            disabled={!isAgreed || isSubmitting}
            size="lg"
            className={`w-full text-base font-semibold transition-all duration-200 ${
              isAgreed
                ? 'bg-forest-600 hover:bg-forest-700 text-white shadow-md hover:shadow-lg'
                : 'bg-sand-200 text-sand-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Accepting Agreement...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Accept & Continue
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
