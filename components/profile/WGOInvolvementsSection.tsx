'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { WGO_CATEGORY_LABELS, WGO_CATEGORY_COLORS } from '@/lib/wgo/categories'
import { RiskBadge } from '@/components/wgo/RiskToleranceIndicator'
import {
  TrendingUp,
  Plus,
  ExternalLink,
  Image,
  Link as LinkIcon,
  Link2,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Edit2,
  Trash2,
  Save,
} from 'lucide-react'

interface WGOInvolvement {
  id: string
  wgoId: string
  role: string
  status: string
  affiliateLink: string | null
  joinedAt: string
  proofType?: string
  proofUrl?: string | null
  proofImageUrl?: string | null
  notes?: string | null
  investedAmount?: number | null
  joinedDate?: string | null
  createdAt?: string
  wgo: {
    id: string
    title: string
    name?: string
    logo?: string | null
    category: string
    status: string
    riskTolerance?: number
    website?: string | null
    affiliateLink?: string | null
    forumCategoryId?: string | null
    description?: string
    targetAmount?: number | null
    currentAmount?: number
    creatorId?: string
    createdAt?: string
  }
}

interface WGO {
  id: string
  name: string
  logo: string | null
  category: string
  riskTolerance: number
}

export function WGOInvolvementsSection() {
  const [involvements, setInvolvements] = useState<WGOInvolvement[]>([])
  const [availableWGOs, setAvailableWGOs] = useState<WGO[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [affiliateLinks, setAffiliateLinks] = useState<Record<string, string>>({})
  const [affiliateSaving, setAffiliateSaving] = useState<Record<string, boolean>>({})

  const [newInvolvement, setNewInvolvement] = useState({
    wgoId: '',
    proofType: 'LINK' as 'LINK' | 'IMAGE' | 'BOTH',
    proofUrl: '',
    proofImageUrl: '',
    notes: '',
    investedAmount: '',
    joinedDate: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [invRes, wgoRes] = await Promise.all([
        fetch('/api/wgo/involvement'),
        fetch('/api/wgo?status=ACTIVE'),
      ])

      if (invRes.ok) {
        const data = await invRes.json()
        setInvolvements(data)
        const links: Record<string, string> = {}
        for (const inv of (Array.isArray(data) ? data : [])) {
          links[inv.wgoId] = inv.affiliateLink || ''
        }
        setAffiliateLinks(links)
      }

      if (wgoRes.ok) {
        const data = await wgoRes.json()
        setAvailableWGOs(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddInvolvement(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setMessage(null)

    try {
      const response = await fetch('/api/wgo/involvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wgoId: newInvolvement.wgoId,
          proofType: newInvolvement.proofType,
          proofUrl: newInvolvement.proofUrl || null,
          proofImageUrl: newInvolvement.proofImageUrl || null,
          notes: newInvolvement.notes || null,
          investedAmount: newInvolvement.investedAmount ? parseFloat(newInvolvement.investedAmount) : null,
          joinedDate: newInvolvement.joinedDate || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add involvement')
      }

      setMessage({ type: 'success', text: 'WGO involvement added successfully!' })
      setShowAddModal(false)
      setNewInvolvement({
        wgoId: '',
        proofType: 'LINK',
        proofUrl: '',
        proofImageUrl: '',
        notes: '',
        investedAmount: '',
        joinedDate: '',
      })
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveInvolvement(involvementId: string) {
    if (!confirm('Are you sure you want to remove this WGO involvement?')) return

    try {
      const response = await fetch(`/api/wgo/involvement?id=${involvementId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove involvement')
      }

      fetchData()
    } catch (error) {
      console.error('Error removing involvement:', error)
    }
  }

  async function handleSaveAffiliateLink(wgoId: string) {
    setAffiliateSaving(prev => ({ ...prev, [wgoId]: true }))
    try {
      const response = await fetch('/api/wgo/involvement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wgoId,
          affiliateLink: affiliateLinks[wgoId]?.trim() || null,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Affiliate link saved!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save affiliate link' })
      }
    } catch (error) {
      console.error('Error saving affiliate link:', error)
      setMessage({ type: 'error', text: 'Failed to save affiliate link' })
    } finally {
      setAffiliateSaving(prev => ({ ...prev, [wgoId]: false }))
    }
  }

  // Ensure we have arrays before calling array methods
  const safeInvolvements = Array.isArray(involvements) ? involvements : []
  const safeAvailableWGOs = Array.isArray(availableWGOs) ? availableWGOs : []

  // Filter out already-involved WGOs
  const involvedWgoIds = safeInvolvements.map(i => i.wgoId)
  const availableToAdd = safeAvailableWGOs.filter(w => !involvedWgoIds.includes(w.id))

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-display text-forest-800">
                <TrendingUp className="h-5 w-5 text-gold-500" />
                Wealth Generation Opportunities (WGO)
              </CardTitle>
              <CardDescription className="text-forest-500 font-body">
                Track your wealth generation opportunities
              </CardDescription>
            </div>
            {availableToAdd.length > 0 && (
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="bg-gold-500 hover:bg-gold-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
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
              {availableToAdd.length > 0 && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gold-500 hover:bg-gold-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Involvement
                </Button>
              )}
              <p className="text-sm text-forest-400 mt-4">
                <Link href="/dashboard/wgo" className="text-gold-600 hover:underline">
                  Browse available opportunities
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeInvolvements.map((involvement) => {
                const wgoName = involvement.wgo.name || involvement.wgo.title
                const wgoStatus = involvement.wgo.status || 'ACTIVE'
                return (
                  <div
                    key={involvement.id}
                    className="p-4 bg-gradient-to-r from-forest-50 to-transparent rounded-lg border border-forest-100"
                  >
                    <div className="flex items-start gap-4">
                      {involvement.wgo.logo ? (
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                          <NextImage
                            src={involvement.wgo.logo}
                            alt={wgoName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gold-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-6 w-6 text-gold-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link href={`/dashboard/wgo/${involvement.wgoId}`} className="hover:underline">
                              <h4 className="font-semibold text-forest-800">{wgoName}</h4>
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                WGO_CATEGORY_COLORS[involvement.wgo.category]
                              )}>
                                {WGO_CATEGORY_LABELS[involvement.wgo.category]}
                              </span>
                              {involvement.wgo.riskTolerance !== undefined && (
                                <RiskBadge value={involvement.wgo.riskTolerance} />
                              )}
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                wgoStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                wgoStatus === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                                wgoStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              )}>
                                {wgoStatus}
                              </span>
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                involvement.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              )}>
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

                        {/* Proof indicators */}
                        <div className="flex items-center gap-3 mt-3 text-sm">
                          {involvement.proofUrl && (
                            <a
                              href={involvement.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-gold-600 hover:text-gold-700"
                            >
                              <LinkIcon className="h-4 w-4" />
                              View Proof
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {involvement.proofImageUrl && (
                            <a
                              href={involvement.proofImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-gold-600 hover:text-gold-700"
                            >
                              <Image className="h-4 w-4" />
                              View Image
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {involvement.wgo.forumCategoryId && (
                            <Link
                              href={`/dashboard/forum?category=${involvement.wgo.forumCategoryId}`}
                              className="flex items-center gap-1 text-forest-600 hover:text-forest-700"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Discussion Forum
                            </Link>
                          )}
                        </div>

                        {involvement.notes && (
                          <p className="text-sm text-forest-500 mt-2 italic">&ldquo;{involvement.notes}&rdquo;</p>
                        )}
                      </div>
                    </div>

                    {/* Affiliate Link */}
                    <div className="mt-3 pt-3 border-t border-forest-100">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-forest-600 mb-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        My Affiliate Link
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={affiliateLinks[involvement.wgoId] || ''}
                          onChange={(e) => setAffiliateLinks(prev => ({
                            ...prev,
                            [involvement.wgoId]: e.target.value,
                          }))}
                          placeholder="https://your-affiliate-link.com/ref/..."
                          className="flex-1 px-3 py-1.5 text-sm border border-sand-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveAffiliateLink(involvement.wgoId)}
                          disabled={affiliateSaving[involvement.wgoId]}
                          className="bg-gold-500 hover:bg-gold-600 text-white"
                        >
                          {affiliateSaving[involvement.wgoId] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        {affiliateLinks[involvement.wgoId] && (
                          <a
                            href={affiliateLinks[involvement.wgoId]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gold-600 hover:text-gold-700"
                            title="Open affiliate link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-forest-900">Add WGO Involvement</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddInvolvement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1">
                    Select Opportunity *
                  </label>
                  <select
                    required
                    value={newInvolvement.wgoId}
                    onChange={(e) => setNewInvolvement(prev => ({ ...prev, wgoId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  >
                    <option value="">Choose a WGO...</option>
                    {availableToAdd.map((wgo) => (
                      <option key={wgo.id} value={wgo.id}>
                        {wgo.name} - {WGO_CATEGORY_LABELS[wgo.category]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1">
                    Proof Type
                  </label>
                  <select
                    value={newInvolvement.proofType}
                    onChange={(e) => setNewInvolvement(prev => ({ ...prev, proofType: e.target.value as 'LINK' | 'IMAGE' | 'BOTH' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  >
                    <option value="LINK">Link/URL</option>
                    <option value="IMAGE">Image</option>
                    <option value="BOTH">Both Link and Image</option>
                  </select>
                </div>

                {(newInvolvement.proofType === 'LINK' || newInvolvement.proofType === 'BOTH') && (
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1">
                      Proof URL
                    </label>
                    <input
                      type="url"
                      value={newInvolvement.proofUrl}
                      onChange={(e) => setNewInvolvement(prev => ({ ...prev, proofUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    />
                  </div>
                )}

                {(newInvolvement.proofType === 'IMAGE' || newInvolvement.proofType === 'BOTH') && (
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1">
                      Proof Image URL
                    </label>
                    <input
                      type="url"
                      value={newInvolvement.proofImageUrl}
                      onChange={(e) => setNewInvolvement(prev => ({ ...prev, proofImageUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1">
                    Personal Notes
                  </label>
                  <textarea
                    value={newInvolvement.notes}
                    onChange={(e) => setNewInvolvement(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes about your involvement..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1">
                      Invested Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newInvolvement.investedAmount}
                      onChange={(e) => setNewInvolvement(prev => ({ ...prev, investedAmount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1">
                      Join Date
                    </label>
                    <input
                      type="date"
                      value={newInvolvement.joinedDate}
                      onChange={(e) => setNewInvolvement(prev => ({ ...prev, joinedDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={adding || !newInvolvement.wgoId}
                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-white"
                  >
                    {adding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Involvement'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
