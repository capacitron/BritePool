'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Contract {
  id: string
  version: string
  content: string
  publishedAt: string
}

export default function ContractReviewPage() {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    fetchContract()
  }, [])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
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
        body: JSON.stringify({
          contractVersionId: contract.id,
          version: contract.version,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to accept agreement. Please try again.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Failed to accept agreement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-warm-md p-8 text-center">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-8 w-48 bg-stone rounded"></div>
          <div className="h-4 w-64 bg-stone rounded"></div>
          <div className="h-64 w-full bg-stone-warm rounded"></div>
        </div>
        <p className="mt-4 text-earth-brown-light">Loading membership agreement...</p>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="bg-white rounded-2xl shadow-warm-md p-8 text-center">
        <div className="text-terracotta mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-serif font-semibold text-earth-dark mb-2">Unable to Load Agreement</h2>
        <p className="text-earth-brown-light mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-warm-md flex flex-col max-h-[80vh] overflow-hidden">
      <div className="px-6 py-4 border-b border-stone bg-stone-warm/30">
        <h2 className="text-xl font-serif font-semibold text-earth-brown-dark">
          Membership Agreement
        </h2>
        <p className="text-sm text-earth-brown-light mt-1">
          Please read the entire agreement before accepting
        </p>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 bg-earth-light/30"
      >
        <div className="prose prose-stone max-w-none">
          <div className="whitespace-pre-wrap text-earth-dark text-sm leading-relaxed">
            {contract?.content}
          </div>
        </div>
        
        {!hasScrolledToBottom && (
          <div className="sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-earth-light/80 to-transparent pointer-events-none flex items-end justify-center pb-2">
            <span className="text-xs text-earth-brown-light bg-white/80 px-3 py-1 rounded-full shadow-sm">
              ↓ Scroll to continue
            </span>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-stone bg-stone-warm/30">
        {error && (
          <div className="bg-terracotta/10 border border-terracotta text-terracotta px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        
        <div className="flex items-start space-x-3 mb-4">
          <input
            type="checkbox"
            id="agree"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
            disabled={!hasScrolledToBottom || isSubmitting}
            className="mt-1 h-4 w-4 rounded border-earth-brown text-earth-brown focus:ring-earth-brown focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label 
            htmlFor="agree" 
            className={`text-sm ${!hasScrolledToBottom ? 'text-earth-brown-light' : 'text-earth-dark'}`}
          >
            I have read and agree to the Membership Agreement and understand my rights and obligations as a BRITE POOL member.
          </label>
        </div>

        <Button
          onClick={handleAccept}
          disabled={!isAgreed || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Accepting...' : 'Accept Contract'}
        </Button>

        {!hasScrolledToBottom && (
          <p className="text-xs text-earth-brown-light text-center mt-3">
            Please scroll to the bottom of the agreement to enable the checkbox
          </p>
        )}
      </div>
    </div>
  )
}
