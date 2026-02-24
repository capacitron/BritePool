'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Plus,
  Filter,
  X,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { cn } from '@/lib/utils'
import {
  WGO_CATEGORY_LABELS,
  WGO_CATEGORY_COLORS,
  WGO_STATUS_LABELS,
  WGO_STATUS_COLORS,
  WGO_CATEGORIES,
  WGO_STATUSES,
} from '@/lib/wgo/categories'

interface WGO {
  id: string
  title: string
  description: string
  category: string
  status: string
  targetAmount: number | null
  currentAmount: number
  startDate: string | null
  endDate: string | null
  creatorId: string
  involvementCount: number
  forumPostCount: number
  isInvolved: boolean
  createdAt: string
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

export default function WGOPage() {
  const [opportunities, setOpportunities] = useState<WGO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [minRiskFilter, setMinRiskFilter] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(true) // default true to avoid flash

  useEffect(() => {
    setDisclaimerDismissed(localStorage.getItem('wgo-disclaimer-ack') === 'true')
  }, [])

  useEffect(() => {
    fetchUserRole()
  }, [])

  useEffect(() => {
    fetchOpportunities()
  }, [categoryFilter, statusFilter, minRiskFilter])

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      setUserRole(data?.user?.role || '')
    } catch {
      // Ignore errors
    }
  }

  const fetchOpportunities = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (categoryFilter) params.set('category', categoryFilter)
      if (statusFilter && statusFilter !== '') params.set('status', statusFilter)

      const res = await fetch(`/api/wgo?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOpportunities(data.data || [])
    } catch (err) {
      setError('Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = ADMIN_ROLES.includes(userRole)

  const clearFilters = () => {
    setCategoryFilter(null)
    setStatusFilter('')
    setMinRiskFilter(null)
  }

  const hasActiveFilters = categoryFilter || statusFilter !== '' || minRiskFilter

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader path="wgo" />

      {isAdmin && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Opportunity
          </Button>
        </div>
      )}

      {/* Risk Disclaimer Banner - inline when not yet acknowledged */}
      {!disclaimerDismissed && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">Investment Risk Disclaimer</p>
              <p className="text-xs text-amber-700 mt-1">
                All opportunities listed are supported by the good faith of the membership. Higher
                trust ratings indicate more organizational credibility, but all investments carry
                risk. Please conduct your own due diligence before participating.
              </p>
            </div>
            <button
              onClick={() => {
                setDisclaimerDismissed(true)
                localStorage.setItem('wgo-disclaimer-ack', 'true')
              }}
              className="flex-shrink-0 text-xs font-medium text-amber-700 hover:text-amber-900 border border-amber-300 rounded-md px-3 py-1.5 hover:bg-amber-100 transition-colors"
            >
              I Understand
            </button>
          </CardContent>
        </Card>
      )}

      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && 'bg-forest-100')}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 bg-forest-600 text-white text-xs rounded-full">
              !
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-sand-200">
          <CardContent className="p-4 space-y-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    categoryFilter === null
                      ? 'bg-forest-600 text-white'
                      : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
                  )}
                >
                  All
                </button>
                {WGO_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      categoryFilter === cat ? 'bg-forest-600 text-white' : WGO_CATEGORY_COLORS[cat]
                    )}
                  >
                    {WGO_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('')}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    statusFilter === ''
                      ? 'bg-forest-600 text-white'
                      : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
                  )}
                >
                  All
                </button>
                {WGO_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      statusFilter === status
                        ? 'bg-forest-600 text-white'
                        : WGO_STATUS_COLORS[status]
                    )}
                  >
                    {WGO_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Tolerance Filter */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Minimum Trust Level
              </label>
              <div className="flex flex-wrap gap-2">
                {[null, 8, 6, 4, 2].map((level) => (
                  <button
                    key={level ?? 'all'}
                    onClick={() => setMinRiskFilter(level)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      minRiskFilter === level
                        ? 'bg-forest-600 text-white'
                        : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
                    )}
                  >
                    {level === null ? 'Any' : `${level}+ Trust`}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-forest-500">Loading opportunities...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : opportunities.length === 0 ? (
        <Card className="border-sand-200">
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-forest-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-forest-700 mb-2">No Opportunities Found</h3>
            <p className="text-forest-500">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more opportunities.'
                : 'Check back soon for new Wealth Generation Opportunities (WGO).'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((wgo) => (
            <Link key={wgo.id} href={`/dashboard/wgo/${wgo.id}`}>
              <Card className="border-sand-200 hover:border-emerald-300 hover:shadow-lg transition-all h-full cursor-pointer">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-forest-800">{wgo.title}</h3>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            WGO_CATEGORY_COLORS[wgo.category] || 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {WGO_CATEGORY_LABELS[wgo.category] || wgo.category}
                        </span>
                      </div>
                    </div>
                    {wgo.isInvolved && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        Joined
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {wgo.description && (
                    <p className="text-sm text-forest-600 line-clamp-2 mb-4">{wgo.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 text-xs text-forest-500">
                    {wgo.targetAmount && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Target: ${wgo.targetAmount.toLocaleString()}
                      </span>
                    )}
                    {wgo.involvementCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {wgo.involvementCount} members
                      </span>
                    )}
                    {wgo.startDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Started {new Date(wgo.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  {wgo.targetAmount && wgo.currentAmount > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-forest-600 mb-1">
                        <span>${wgo.currentAmount.toLocaleString()} raised</span>
                        <span>{Math.round((wgo.currentAmount / wgo.targetAmount) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (wgo.currentAmount / wgo.targetAmount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  {wgo.status !== 'ACTIVE' && (
                    <div className="mt-3">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          WGO_STATUS_COLORS[wgo.status] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {WGO_STATUS_LABELS[wgo.status] || wgo.status}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sand-100 text-xs text-forest-500">
                    <span>{wgo.forumPostCount} discussions</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Add Modal - Simplified inline form */}
      {showAddModal && (
        <AddWGOModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            // Reset to show all statuses - the useEffect will trigger a refetch
            if (statusFilter === '') {
              // If already showing all, manually refetch since state won't change
              fetchOpportunities()
            } else {
              setStatusFilter('')
            }
          }}
        />
      )}

      {/* Persistent bottom disclaimer after acknowledgement */}
      {disclaimerDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-amber-50/95 backdrop-blur-sm border-t border-amber-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              All investments carry risk. Conduct your own due diligence before participating.
            </p>
            <button
              onClick={() => {
                setDisclaimerDismissed(false)
                localStorage.removeItem('wgo-disclaimer-ack')
              }}
              className="flex-shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
              title="Show full disclaimer"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Add WGO Modal Component
function AddWGOModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'INVESTMENT',
    status: 'DRAFT',
    targetAmount: '',
    startDate: '',
    endDate: '',
    credibilityScore: '',
    presentationDays: '',
    shortDescription: '',
    wgoType: '',
    minimumInvestment: '',
  })

  // Compute soft warnings (shown after first submit attempt, never block save)
  const getWarnings = () => {
    const warnings: Record<string, string> = {}
    if (!formData.title.trim())
      warnings.title = 'Recommended — will default to "Untitled Opportunity"'
    if (!formData.description.trim())
      warnings.description = 'Recommended — helps members understand the opportunity'
    if (formData.credibilityScore) {
      const score = parseFloat(formData.credibilityScore)
      if (isNaN(score) || score < 1 || score > 10)
        warnings.credibilityScore = 'Should be between 1 and 10'
    }
    if (formData.targetAmount) {
      const amt = parseFloat(formData.targetAmount)
      if (isNaN(amt) || amt < 0) warnings.targetAmount = 'Should be a positive number'
    }
    if (formData.minimumInvestment) {
      const amt = parseFloat(formData.minimumInvestment)
      if (isNaN(amt) || amt < 0) warnings.minimumInvestment = 'Should be a positive number'
    }
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      warnings.endDate = 'End date is before start date'
    }
    return warnings
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const warnings = getWarnings()
    setFieldWarnings(warnings)
    setLoading(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        title: formData.title.trim() || 'Untitled Opportunity',
        description: formData.description.trim() || '',
        category: formData.category || 'INVESTMENT',
        status: formData.status || 'ACTIVE',
        targetAmount: formData.targetAmount ? parseFloat(formData.targetAmount) : null,
        minimumInvestment: formData.minimumInvestment
          ? parseFloat(formData.minimumInvestment)
          : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      }

      // Only include optional metadata fields if they have values
      if (formData.credibilityScore) {
        payload.credibilityScore = parseFloat(formData.credibilityScore)
      }
      if (formData.presentationDays.trim()) {
        payload.presentationDays = formData.presentationDays.trim()
      }
      if (formData.shortDescription.trim()) {
        payload.shortDescription = formData.shortDescription.trim()
      }
      if (formData.wgoType.trim()) {
        payload.wgoType = formData.wgoType.trim()
      }

      const res = await fetch('/api/wgo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        // Parse field-specific errors from API response
        if (data.details?.fieldErrors) {
          const apiFieldWarnings: Record<string, string> = {}
          for (const [field, messages] of Object.entries(data.details.fieldErrors)) {
            if (Array.isArray(messages) && messages.length > 0) {
              apiFieldWarnings[field] = messages[0] as string
            }
          }
          if (Object.keys(apiFieldWarnings).length > 0) {
            setFieldWarnings((prev) => ({ ...prev, ...apiFieldWarnings }))
          }
        }
        throw new Error(data.error || 'Failed to create')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create opportunity')
    } finally {
      setLoading(false)
    }
  }

  const API_CATEGORIES = ['REAL_ESTATE', 'BUSINESS', 'INVESTMENT', 'EDUCATION', 'COMMUNITY']
  const API_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Add Wealth Generation Opportunity (WGO)</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-sand-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  if (submitted)
                    setFieldWarnings((w) => {
                      const n = { ...w }
                      delete n.title
                      return n
                    })
                }}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  submitted && fieldWarnings.title ? 'border-amber-400' : 'border-sand-300'
                )}
                placeholder="Enter a title for this opportunity"
              />
              {submitted && fieldWarnings.title && (
                <p className="text-xs text-amber-600 mt-1">{fieldWarnings.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  if (submitted)
                    setFieldWarnings((w) => {
                      const n = { ...w }
                      delete n.description
                      return n
                    })
                }}
                rows={3}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  submitted && fieldWarnings.description ? 'border-amber-400' : 'border-sand-300'
                )}
                placeholder="Describe the opportunity"
              />
              {submitted && fieldWarnings.description && (
                <p className="text-xs text-amber-600 mt-1">{fieldWarnings.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Short Description
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                rows={2}
                maxLength={1000}
                placeholder="A brief summary shown at the top of the opportunity"
                className="w-full px-3 py-2 border border-sand-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Type of WGO</label>
              <input
                type="text"
                value={formData.wgoType}
                onChange={(e) => setFormData({ ...formData, wgoType: e.target.value })}
                maxLength={500}
                placeholder="e.g. Crypto trading, Fiat trading, Gold, Nodes"
                className="w-full px-3 py-2 border border-sand-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Credibility Score (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={formData.credibilityScore}
                  onChange={(e) => {
                    setFormData({ ...formData, credibilityScore: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.credibilityScore
                        return n
                      })
                  }}
                  placeholder="e.g. 8.5"
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg',
                    submitted && fieldWarnings.credibilityScore
                      ? 'border-amber-400'
                      : 'border-sand-300'
                  )}
                />
                {submitted && fieldWarnings.credibilityScore && (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.credibilityScore}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Presentation Days
                </label>
                <input
                  type="text"
                  value={formData.presentationDays}
                  onChange={(e) => setFormData({ ...formData, presentationDays: e.target.value })}
                  maxLength={500}
                  placeholder="e.g. Every Thursday 4:00PM"
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                >
                  {API_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                >
                  {API_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, targetAmount: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.targetAmount
                        return n
                      })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg',
                    submitted && fieldWarnings.targetAmount ? 'border-amber-400' : 'border-sand-300'
                  )}
                  placeholder="Optional"
                />
                {submitted && fieldWarnings.targetAmount && (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.targetAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Minimum Investment ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumInvestment}
                  onChange={(e) => {
                    setFormData({ ...formData, minimumInvestment: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.minimumInvestment
                        return n
                      })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg',
                    submitted && fieldWarnings.minimumInvestment
                      ? 'border-amber-400'
                      : 'border-sand-300'
                  )}
                  placeholder="Optional"
                />
                {submitted && fieldWarnings.minimumInvestment && (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.minimumInvestment}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value })
                    if (submitted)
                      setFieldWarnings((w) => {
                        const n = { ...w }
                        delete n.endDate
                        return n
                      })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg',
                    submitted && fieldWarnings.endDate ? 'border-amber-400' : 'border-sand-300'
                  )}
                />
                {submitted && fieldWarnings.endDate && (
                  <p className="text-xs text-amber-600 mt-1">{fieldWarnings.endDate}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading
                  ? 'Creating...'
                  : formData.status === 'DRAFT'
                    ? 'Save as Draft'
                    : 'Create & Publish'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
