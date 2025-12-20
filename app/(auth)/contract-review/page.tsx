'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Shield, ScrollText, CheckCircle2, AlertTriangle, ChevronDown, Loader2, Check } from 'lucide-react'

interface Contract {
  id: string
  version: string
  content: string
  publishedAt: string
}

export default function ContractReviewPage() {
  const router = useRouter()
  const { data: session, status, update: updateSession } = useSession()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

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

    // Only fetch contract if authenticated
    if (status === 'authenticated') {
      fetchContract()
    }
  }, [status])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const progress = Math.min((scrollTop / (scrollHeight - clientHeight)) * 100, 100)
    setScrollProgress(progress)

    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20

    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
    }
  }, [hasScrolledToBottom])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !contract) return

    container.addEventListener('scroll', handleScroll)
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
          // Session expired or not authenticated - redirect to login
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
      // Redirect to onboarding if not completed, otherwise dashboard
      const session = await fetch('/api/auth/session', { credentials: 'include' }).then((res) => res.json())
      if (!session?.user?.onboardingCompleted) {
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

  // Show loading state while session or contract is loading
  if (status === 'loading' || isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Decorative header */}
        <div className="bg-gradient-to-r from-forest-800 via-forest-700 to-forest-800 p-8 text-white">
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-white/20 rounded" />
              <div className="h-4 w-64 bg-white/10 rounded" />
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-full bg-sand-200 rounded" />
            <div className="h-4 w-5/6 bg-sand-200 rounded" />
            <div className="h-4 w-4/5 bg-sand-200 rounded" />
            <div className="h-32 w-full bg-sand-100 rounded-xl" />
          </div>
          <p className="mt-6 text-center text-forest-600 flex items-center justify-center gap-2 font-body">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading membership agreement...
          </p>
        </div>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-earth-600 to-earth-500 p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">Unable to Load Agreement</h2>
              <p className="text-white/80 mt-1 font-body">There was a problem retrieving the document</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
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
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[85vh]">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 p-6 md:p-8 text-white">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-earth-400/20 rounded-full blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
            <ScrollText className="w-8 h-8 text-earth-300" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Membership Agreement
            </h2>
            <p className="text-sand-200 mt-1 flex items-center gap-2 font-body">
              <Shield className="w-4 h-4" />
              Version {contract?.version} - Please read carefully before accepting
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-sand-300 mb-2 font-body">
            <span>Reading progress</span>
            <span>{Math.round(scrollProgress)}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-earth-400 to-earth-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 md:px-8 py-6 bg-gradient-to-b from-sand-50 to-white"
      >
        <div className="prose prose-stone max-w-none">
          <div className="whitespace-pre-wrap text-forest-700 text-sm leading-relaxed font-body">
            {contract?.content}
          </div>
        </div>

        {/* Scroll Indicator */}
        {!hasScrolledToBottom && (
          <div className="sticky bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none flex items-end justify-center pb-4">
            <div className="pointer-events-auto animate-bounce flex flex-col items-center gap-1 text-forest-500">
              <span className="text-xs font-medium bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-sand-200 font-body">
                Scroll to continue reading
              </span>
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-sand-200 bg-gradient-to-r from-sand-50 to-cream p-6 md:p-8">
        {error && (
          <div className="bg-earth-100 border border-earth-300 text-earth-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 font-body">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Agreement Checkbox - FIXED */}
        <label
          className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 mb-6 ${
            hasScrolledToBottom
              ? isAgreed
                ? 'border-forest-500 bg-forest-50 cursor-pointer'
                : 'border-sand-300 hover:border-forest-300 bg-white cursor-pointer'
              : 'border-sand-200 bg-sand-100 cursor-not-allowed opacity-60'
          }`}
        >
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => hasScrolledToBottom && setIsAgreed(e.target.checked)}
              disabled={!hasScrolledToBottom || isSubmitting}
              className="sr-only peer"
            />
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              isAgreed
                ? 'bg-forest-600 border-forest-600'
                : hasScrolledToBottom
                  ? 'border-forest-400 bg-white hover:border-forest-500'
                  : 'border-sand-300 bg-sand-100'
            }`}>
              {isAgreed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
            </div>
          </div>
          <span className={`text-sm leading-relaxed font-body ${
            !hasScrolledToBottom ? 'text-forest-400' : 'text-forest-800'
          }`}>
            I have read and agree to the <strong className="text-forest-900">Membership Agreement</strong> and understand my rights and
            obligations as a BRITE POOL member. I acknowledge that this constitutes a binding commitment
            to uphold the values and principles of our community.
          </span>
        </label>

        {/* Submit Button */}
        <Button
          onClick={handleAccept}
          disabled={!isAgreed || isSubmitting}
          size="lg"
          className={`w-full text-lg font-semibold transition-all duration-300 ${
            isAgreed
              ? 'bg-forest-600 hover:bg-forest-700 text-white shadow-lg hover:shadow-xl'
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

        {!hasScrolledToBottom && (
          <p className="text-xs text-forest-500 text-center mt-4 flex items-center justify-center gap-2 font-body">
            <span className="w-2 h-2 rounded-full bg-earth-400 animate-pulse" />
            Please scroll to the bottom of the agreement to enable acceptance
          </p>
        )}
      </div>
    </div>
  )
}
