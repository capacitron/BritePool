'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { WGO_CATEGORY_LABELS, WGO_CATEGORY_COLORS } from '@/lib/wgo/categories'
import {
  TrendingUp,
  ExternalLink,
  Link2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react'

interface WGOInvolvement {
  id: string
  wgoId: string
  role: string
  status: string
  affiliateLink: string | null
  joinedAt: string
  wgo: {
    id: string
    title: string
    category: string
    status: string
    description?: string
    targetAmount?: number | null
    currentAmount?: number
    creatorId?: string
    createdAt?: string
  }
}

export function WGOInvolvementsSection() {
  const [involvements, setInvolvements] = useState<WGOInvolvement[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [affiliateLinks, setAffiliateLinks] = useState<Record<string, string>>({})
  const [affiliateSaving, setAffiliateSaving] = useState<Record<string, boolean>>({})
  const [affiliateSaved, setAffiliateSaved] = useState<Record<string, boolean>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const invRes = await fetch('/api/wgo/involvement')

      if (invRes.ok) {
        const data = await invRes.json()
        setInvolvements(data)
        const links: Record<string, string> = {}
        for (const inv of Array.isArray(data) ? data : []) {
          links[inv.wgoId] = inv.affiliateLink || ''
        }
        setAffiliateLinks(links)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveInvolvement(involvementId: string) {
    if (!confirm('Are you sure you want to remove this WGO involvement?')) return

    try {
      const response = await fetch(`/api/wgo/involvement?id=${involvementId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        setMessage({ type: 'error', text: 'Failed to remove involvement' })
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error removing involvement:', error)
      setMessage({ type: 'error', text: 'Failed to remove involvement' })
    }
  }

  const handleSaveAffiliateLink = useCallback(async (wgoId: string, link: string) => {
    setAffiliateSaving((prev) => ({ ...prev, [wgoId]: true }))
    setAffiliateSaved((prev) => ({ ...prev, [wgoId]: false }))
    try {
      const response = await fetch('/api/wgo/involvement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wgoId,
          affiliateLink: link.trim() || null,
        }),
      })

      if (response.ok) {
        setAffiliateSaved((prev) => ({ ...prev, [wgoId]: true }))
        setTimeout(() => setAffiliateSaved((prev) => ({ ...prev, [wgoId]: false })), 3000)
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save affiliate link' })
      }
    } catch (error) {
      console.error('Error saving affiliate link:', error)
      setMessage({ type: 'error', text: 'Failed to save affiliate link' })
    } finally {
      setAffiliateSaving((prev) => ({ ...prev, [wgoId]: false }))
    }
  }, [])

  function handleAffiliateLinkChange(wgoId: string, value: string) {
    setAffiliateLinks((prev) => ({ ...prev, [wgoId]: value }))
    setAffiliateSaved((prev) => ({ ...prev, [wgoId]: false }))

    // Clear existing debounce timer
    if (debounceTimers.current[wgoId]) {
      clearTimeout(debounceTimers.current[wgoId])
    }

    // Auto-save after 1.5 seconds of inactivity
    debounceTimers.current[wgoId] = setTimeout(() => {
      handleSaveAffiliateLink(wgoId, value)
    }, 1500)
  }

  const safeInvolvements = Array.isArray(involvements) ? involvements : []

  if (loading) {
    return (
      <Card className="border-sand-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <TrendingUp className="h-5 w-5 text-gold-500" />
            Wealth Generation Opportunities (WGO)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-forest-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-sand-200">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2 font-display text-forest-800">
              <TrendingUp className="h-5 w-5 text-gold-500" />
              Wealth Generation Opportunities (WGO)
            </CardTitle>
            <CardDescription className="text-forest-500 font-body">
              WGOs appear here when you activate your membership through an affiliate link
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <div
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg text-sm font-body mb-4',
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message.text}
            </div>
          )}

          {safeInvolvements.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-forest-600 mb-4 font-body">No WGO involvements yet</p>
              <p className="text-sm text-forest-400 mt-4">
                <Link href="/dashboard/wgo" className="text-gold-600 hover:underline">
                  Browse available opportunities
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeInvolvements.map((involvement) => (
                <div
                  key={involvement.id}
                  className="p-4 bg-gradient-to-r from-forest-50 to-transparent rounded-lg border border-forest-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gold-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-gold-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/dashboard/wgo/${involvement.wgoId}`}
                            className="hover:underline"
                          >
                            <h4 className="font-semibold text-forest-800">
                              {involvement.wgo.title}
                            </h4>
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                WGO_CATEGORY_COLORS[involvement.wgo.category] ||
                                  'bg-gray-100 text-gray-800'
                              )}
                            >
                              {WGO_CATEGORY_LABELS[involvement.wgo.category]}
                            </span>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                involvement.wgo.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : involvement.wgo.status === 'PAUSED'
                                    ? 'bg-amber-100 text-amber-700'
                                    : involvement.wgo.status === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700'
                              )}
                            >
                              {involvement.wgo.status}
                            </span>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                involvement.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              )}
                            >
                              {involvement.role || involvement.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveInvolvement(involvement.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Remove involvement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-xs text-forest-400 mt-2">
                        Joined{' '}
                        {new Date(involvement.joinedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Affiliate Link */}
                  <div className="mt-3 pt-3 border-t border-forest-100">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-forest-600 mb-1">
                      <Link2 className="h-3.5 w-3.5" />
                      My Affiliate Link
                    </label>
                    <p className="text-xs text-forest-500 mb-1.5">
                      Add your personal affiliate or referral link for this opportunity. This link
                      will be shared with members you invite.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={affiliateLinks[involvement.wgoId] || ''}
                        onChange={(e) =>
                          handleAffiliateLinkChange(involvement.wgoId, e.target.value)
                        }
                        onBlur={() => {
                          // Save immediately on blur if there are unsaved changes
                          if (debounceTimers.current[involvement.wgoId]) {
                            clearTimeout(debounceTimers.current[involvement.wgoId])
                            delete debounceTimers.current[involvement.wgoId]
                            handleSaveAffiliateLink(
                              involvement.wgoId,
                              affiliateLinks[involvement.wgoId] || ''
                            )
                          }
                        }}
                        placeholder="https://example.com/ref/your-id"
                        className={cn(
                          'flex-1 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500',
                          affiliateSaved[involvement.wgoId]
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-sand-300'
                        )}
                      />
                      {affiliateSaving[involvement.wgoId] && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-500 shrink-0" />
                      )}
                      {affiliateSaved[involvement.wgoId] && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 shrink-0">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Saved
                        </span>
                      )}
                      {affiliateLinks[involvement.wgoId] && (
                        <a
                          href={affiliateLinks[involvement.wgoId]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gold-600 hover:text-gold-700 shrink-0"
                          title="Open affiliate link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-forest-400 mt-1">Auto-saves as you type</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
