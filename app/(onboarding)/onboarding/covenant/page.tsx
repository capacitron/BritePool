'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Loader2, ScrollText, Shield, Crown } from 'lucide-react'

interface Contract {
  id: string
  version: string
  content: string
  publishedAt: string
}

export default function CovenantPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContract() {
      try {
        const response = await fetch('/api/contract/active')
        if (!response.ok) {
          if (response.status === 404) {
            setError('No active covenant found.')
          } else {
            setError('Failed to load covenant.')
          }
          return
        }
        const data = await response.json()
        setContract(data)
      } catch (err) {
        setError('Failed to load covenant.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchContract()
  }, [])

  async function handleAccept() {
    if (!contract) return

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
        setError(data.error || 'Failed to accept covenant.')
        return
      }

      // Update session and proceed to profile
      await updateSession()

      // Save onboarding progress
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 2 }),
      })

      router.push('/onboarding/profile')
    } catch (err) {
      setError('Failed to accept covenant. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-earth-500 mx-auto mb-4" />
          <p className="text-forest-600 font-body">Loading Sacred Covenant...</p>
        </div>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-earth-600" />
          </div>
          <h2 className="text-xl font-display font-bold text-forest-800 mb-2">Unable to Load</h2>
          <p className="text-forest-600 font-body mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Royal Decree Header */}
      <div className="relative">
        {/* Ornate border frame */}
        <div className="absolute inset-0 border-4 border-double border-earth-300 rounded-2xl pointer-events-none" />
        <div className="absolute inset-2 border border-earth-200 rounded-xl pointer-events-none" />

        {/* Main document */}
        <div className="relative bg-gradient-to-b from-cream via-white to-sand-50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative top flourish */}
          <div className="h-2 bg-gradient-to-r from-earth-300 via-earth-500 to-earth-300" />

          {/* Header with crown */}
          <div className="pt-10 pb-6 px-6 md:px-12 text-center border-b border-earth-200">
            {/* Crown icon */}
            <div className="mx-auto mb-6 relative">
              <div className="absolute inset-0 w-20 h-20 bg-earth-400/20 rounded-full blur-xl mx-auto" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-earth-400 via-earth-500 to-earth-600 rounded-full flex items-center justify-center mx-auto shadow-xl ring-4 ring-earth-200">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title with flourishes */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-earth-400 to-earth-300" />
              <ScrollText className="w-6 h-6 text-earth-500" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent via-earth-400 to-earth-300" />
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-forest-800 tracking-wide">
              THE SACRED COVENANT
            </h1>
            <p className="text-sm uppercase tracking-[0.3em] text-earth-600 mt-2 font-body">
              of BRITE POOL
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-earth-300" />
              <div className="w-2 h-2 rounded-full bg-earth-400" />
              <div className="w-3 h-3 rounded-full bg-earth-500" />
              <div className="w-2 h-2 rounded-full bg-earth-400" />
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-earth-300" />
            </div>

            {/* Version badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 bg-forest-50 border border-forest-200 rounded-full">
              <Shield className="w-4 h-4 text-forest-600" />
              <span className="text-xs font-medium text-forest-700 font-body">
                Version {contract?.version} • Established with Honor
              </span>
            </div>
          </div>

          {/* Covenant Content */}
          <div className="px-6 md:px-12 py-10">
            {/* Opening proclamation */}
            <div className="text-center mb-8 pb-8 border-b border-dashed border-earth-200">
              <p className="text-lg text-forest-700 font-body italic leading-relaxed">
                &ldquo;Let it be known to all who enter these sacred halls of fellowship, that by
                reading and acknowledging this covenant, you join a community bound by honor, mutual
                respect, and collective prosperity.&rdquo;
              </p>
            </div>

            {/* Main document content */}
            <div
              className="prose prose-lg prose-forest max-w-none
              prose-headings:font-display prose-headings:text-forest-800 prose-headings:font-bold
              prose-h1:text-2xl prose-h1:text-center prose-h1:mb-6
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-earth-200
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-earth-700
              prose-p:text-forest-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base
              prose-li:text-forest-700 prose-li:leading-relaxed
              prose-ul:my-4 prose-ol:my-4
              prose-strong:text-forest-800 prose-strong:font-semibold
              prose-em:text-earth-600
              font-body
            "
            >
              <ReactMarkdown>{contract?.content || ''}</ReactMarkdown>
            </div>

            {/* Closing seal section */}
            <div className="mt-12 pt-8 border-t border-earth-200 text-center">
              <div className="inline-flex flex-col items-center">
                {/* Decorative seal */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-earth-100 to-earth-200 flex items-center justify-center border-4 border-earth-300 shadow-inner">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-earth-400 to-earth-600 flex items-center justify-center shadow-lg">
                      <span className="text-white font-display font-bold text-xl">BP</span>
                    </div>
                  </div>
                  {/* Ribbon effect */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-earth-500 rounded-b-lg shadow-md" />
                </div>

                <p className="text-sm text-forest-500 font-body mt-4">
                  Witnessed and sealed by the BRITE POOL Assembly
                </p>
              </div>
            </div>
          </div>

          {/* Footer with acknowledge button */}
          <div className="px-6 md:px-12 pb-10">
            {error && (
              <div className="bg-earth-50 border border-earth-200 text-earth-700 px-4 py-3 rounded-lg text-sm mb-6 font-body">
                {error}
              </div>
            )}

            {/* Large acknowledge button */}
            <Button
              onClick={handleAccept}
              disabled={isSubmitting}
              className="w-full group relative bg-gradient-to-r from-forest-700 via-forest-600 to-forest-700 hover:from-earth-500 hover:via-earth-400 hover:to-earth-500 text-white px-12 py-8 text-xl font-display font-bold shadow-2xl transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(139,90,43,0.5)] hover:scale-[1.02] rounded-xl overflow-hidden border-2 border-forest-500 hover:border-earth-400"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {isSubmitting ? (
                <span className="flex items-center justify-center relative">
                  <Loader2 className="w-7 h-7 mr-3 animate-spin" />
                  Sealing Your Pledge...
                </span>
              ) : (
                <span className="flex items-center justify-center relative">
                  <Shield className="w-7 h-7 mr-3" />I ACKNOWLEDGE THIS SACRED COVENANT
                </span>
              )}
            </Button>

            <p className="text-center text-sm text-forest-500 mt-4 font-body">
              By acknowledging, you accept the terms and join our fellowship
            </p>
          </div>

          {/* Decorative bottom flourish */}
          <div className="h-2 bg-gradient-to-r from-earth-300 via-earth-500 to-earth-300" />
        </div>
      </div>
    </div>
  )
}
