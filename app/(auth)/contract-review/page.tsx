'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Shield, ScrollText, CheckCircle2, AlertTriangle, ChevronDown, Loader2 } from 'lucide-react'

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
        <div className="bg-gradient-to-r from-earth-brown-dark via-earth-brown to-earth-brown-dark p-8 text-white">
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
            <div className="h-4 w-full bg-stone-warm rounded" />
            <div className="h-4 w-5/6 bg-stone-warm rounded" />
            <div className="h-4 w-4/5 bg-stone-warm rounded" />
            <div className="h-32 w-full bg-stone-warm/50 rounded-xl" />
          </div>
          <p className="mt-6 text-center text-earth-brown-light flex items-center justify-center gap-2">
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
        <div className="bg-gradient-to-r from-terracotta/90 to-terracotta p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold">Unable to Load Agreement</h2>
              <p className="text-white/80 mt-1">There was a problem retrieving the document</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-earth-brown-light mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-earth-brown-dark hover:bg-earth-brown text-white px-8"
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
      <div className="relative bg-gradient-to-br from-earth-brown-dark via-earth-brown to-earth-brown-dark p-6 md:p-8 text-white">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-earth-gold/20 rounded-full blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
            <ScrollText className="w-8 h-8 text-earth-gold" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold">
              Membership Agreement
            </h2>
            <p className="text-white/70 mt-1 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Version {contract?.version} - Please read carefully before accepting
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Reading progress</span>
            <span>{Math.round(scrollProgress)}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-earth-gold to-earth-gold-dark transition-all duration-300 ease-out rounded-full"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 md:px-8 py-6 bg-gradient-to-b from-stone-warm/30 to-white"
      >
        <div className="prose prose-stone max-w-none">
          <div className="whitespace-pre-wrap text-earth-brown text-sm leading-relaxed font-serif">
            {contract?.content}
          </div>
        </div>

        {/* Scroll Indicator */}
        {!hasScrolledToBottom && (
          <div className="sticky bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none flex items-end justify-center pb-4">
            <div className="pointer-events-auto animate-bounce flex flex-col items-center gap-1 text-earth-brown-light">
              <span className="text-xs font-medium bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-stone">
                Scroll to continue reading
              </span>
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-stone bg-gradient-to-r from-stone-warm/50 to-earth-light/50 p-6 md:p-8">
        {error && (
          <div className="bg-terracotta/10 border border-terracotta/30 text-terracotta px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Agreement Checkbox */}
        <label
          className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer mb-6 ${
            hasScrolledToBottom
              ? isAgreed
                ? 'border-sage bg-sage/10'
                : 'border-earth-brown-light/30 hover:border-earth-brown-light/50 bg-white'
              : 'border-earth-brown-light/20 bg-stone-warm/30 cursor-not-allowed'
          }`}
        >
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              id="agree"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              disabled={!hasScrolledToBottom || isSubmitting}
              className="sr-only"
            />
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              isAgreed
                ? 'bg-sage border-sage'
                : hasScrolledToBottom
                  ? 'border-earth-brown-light/50 bg-white'
                  : 'border-earth-brown-light/30 bg-stone-warm/50'
            }`}>
              {isAgreed && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
          </div>
          <span className={`text-sm leading-relaxed ${
            !hasScrolledToBottom ? 'text-earth-brown-light/60' : 'text-earth-brown-dark'
          }`}>
            I have read and agree to the <strong>Membership Agreement</strong> and understand my rights and
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
              ? 'bg-gradient-to-r from-earth-brown-dark to-earth-brown hover:from-earth-brown hover:to-earth-brown-dark shadow-lg hover:shadow-xl'
              : 'bg-earth-brown-light/30 text-earth-brown-light cursor-not-allowed'
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
          <p className="text-xs text-earth-brown-light text-center mt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-earth-gold animate-pulse" />
            Please scroll to the bottom of the agreement to enable acceptance
          </p>
        )}
      </div>
    </div>
  )
}
