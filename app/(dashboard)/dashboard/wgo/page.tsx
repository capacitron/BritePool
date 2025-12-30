'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Plus, Filter, X, Globe, Mail, ExternalLink, DollarSign, Users, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { cn } from '@/lib/utils'
import { RiskToleranceIndicator, RiskBadge } from '@/components/wgo/RiskToleranceIndicator'
import { WGO_CATEGORY_LABELS, WGO_CATEGORY_COLORS, WGO_STATUS_LABELS, WGO_STATUS_COLORS, WGO_CATEGORIES, WGO_STATUSES } from '@/lib/wgo/categories'

interface WGO {
  id: string
  name: string
  description: string | null
  logo: string | null
  website: string | null
  affiliateLink: string | null
  email: string | null
  category: string
  status: string
  riskTolerance: number
  minimumInvestment: number | null
  potentialReturns: string | null
  compoundingType: string | null
  memberBenefits: string | null
  yearsOperating: number | null
  verifiedBy: string | null
  totalMembers: number
  communityRating: number | null
  disclaimer: string | null
  createdBy: { id: string; name: string }
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
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE')
  const [minRiskFilter, setMinRiskFilter] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchOpportunities()
    fetchUserRole()
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
    try {
      const params = new URLSearchParams()
      if (categoryFilter) params.set('category', categoryFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (minRiskFilter) params.set('minRisk', minRiskFilter.toString())

      const res = await fetch(`/api/wgo?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOpportunities(data)
    } catch (err) {
      setError('Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = ADMIN_ROLES.includes(userRole)

  const clearFilters = () => {
    setCategoryFilter(null)
    setStatusFilter('ACTIVE')
    setMinRiskFilter(null)
  }

  const hasActiveFilters = categoryFilter || statusFilter !== 'ACTIVE' || minRiskFilter

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

      {/* Risk Disclaimer Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Investment Risk Disclaimer</p>
            <p className="text-xs text-amber-700 mt-1">
              All opportunities listed are supported by the good faith of the membership. Higher trust ratings indicate more organizational credibility, but all investments carry risk. Please conduct your own due diligence before participating.
            </p>
          </div>
        </CardContent>
      </Card>

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
            <span className="ml-2 px-1.5 py-0.5 bg-forest-600 text-white text-xs rounded-full">!</span>
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
                {WGO_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      categoryFilter === cat
                        ? 'bg-forest-600 text-white'
                        : WGO_CATEGORY_COLORS[cat]
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
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    statusFilter === 'all'
                      ? 'bg-forest-600 text-white'
                      : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
                  )}
                >
                  All
                </button>
                {WGO_STATUSES.map(status => (
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
              <label className="block text-sm font-medium text-forest-700 mb-2">Minimum Trust Level</label>
              <div className="flex flex-wrap gap-2">
                {[null, 8, 6, 4, 2].map(level => (
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
                : 'Check back soon for new wealth generation opportunities.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map(wgo => (
            <Link key={wgo.id} href={`/dashboard/wgo/${wgo.id}`}>
              <Card className="border-sand-200 hover:border-emerald-300 hover:shadow-lg transition-all h-full cursor-pointer">
                <CardContent className="p-6">
                  {/* Header with Logo and Risk */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {wgo.logo ? (
                        <img
                          src={wgo.logo}
                          alt={wgo.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-forest-800">{wgo.name}</h3>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', WGO_CATEGORY_COLORS[wgo.category])}>
                          {WGO_CATEGORY_LABELS[wgo.category]}
                        </span>
                      </div>
                    </div>
                    <RiskBadge value={wgo.riskTolerance} />
                  </div>

                  {/* Description */}
                  {wgo.description && (
                    <p className="text-sm text-forest-600 line-clamp-2 mb-4">
                      {wgo.description}
                    </p>
                  )}

                  {/* Trust Indicator */}
                  <div className="mb-4">
                    <RiskToleranceIndicator value={wgo.riskTolerance} size="sm" showLabel />
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-3 text-xs text-forest-500">
                    {wgo.minimumInvestment && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Min: ${wgo.minimumInvestment.toLocaleString()}
                      </span>
                    )}
                    {wgo.totalMembers > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {wgo.totalMembers} members
                      </span>
                    )}
                    {wgo.yearsOperating && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {wgo.yearsOperating} years
                      </span>
                    )}
                  </div>

                  {/* Potential Returns */}
                  {wgo.potentialReturns && (
                    <div className="mt-3 p-2 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-emerald-700">
                        <span className="font-medium">Potential Returns:</span> {wgo.potentialReturns}
                      </p>
                    </div>
                  )}

                  {/* Status Badge */}
                  {wgo.status !== 'ACTIVE' && (
                    <div className="mt-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', WGO_STATUS_COLORS[wgo.status])}>
                        {WGO_STATUS_LABELS[wgo.status]}
                      </span>
                    </div>
                  )}

                  {/* Quick Links */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sand-100">
                    {wgo.website && (
                      <Globe className="h-4 w-4 text-forest-400" />
                    )}
                    {wgo.affiliateLink && (
                      <ExternalLink className="h-4 w-4 text-emerald-500" />
                    )}
                    {wgo.email && (
                      <Mail className="h-4 w-4 text-forest-400" />
                    )}
                    {wgo.verifiedBy && (
                      <span className="text-xs text-forest-500 ml-auto">
                        Verified by {wgo.verifiedBy}
                      </span>
                    )}
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
            fetchOpportunities()
          }}
        />
      )}
    </div>
  )
}

// Add WGO Modal Component
function AddWGOModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    affiliateLink: '',
    email: '',
    category: 'PASSIVE_INCOME',
    status: 'PENDING',
    riskTolerance: 5,
    minimumInvestment: '',
    potentialReturns: '',
    compoundingType: '',
    memberBenefits: '',
    yearsOperating: '',
    verifiedBy: '',
    disclaimer: '',
    termsUrl: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/wgo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minimumInvestment: formData.minimumInvestment ? parseFloat(formData.minimumInvestment) : undefined,
          yearsOperating: formData.yearsOperating ? parseInt(formData.yearsOperating) : undefined,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create opportunity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Add Wealth Generation Opportunity</CardTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                >
                  {WGO_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{WGO_CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Trust Rating (1-10) *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.riskTolerance}
                  onChange={(e) => setFormData({ ...formData, riskTolerance: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
                <p className="text-xs text-forest-500 mt-1">Higher = More trusted, lower risk</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Affiliate Link</label>
                <input
                  type="url"
                  value={formData.affiliateLink}
                  onChange={(e) => setFormData({ ...formData, affiliateLink: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Minimum Investment ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumInvestment}
                  onChange={(e) => setFormData({ ...formData, minimumInvestment: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Years Operating</label>
                <input
                  type="number"
                  min="0"
                  value={formData.yearsOperating}
                  onChange={(e) => setFormData({ ...formData, yearsOperating: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Potential Returns</label>
                <input
                  type="text"
                  value={formData.potentialReturns}
                  onChange={(e) => setFormData({ ...formData, potentialReturns: e.target.value })}
                  placeholder="e.g., 5-15% monthly"
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Compounding Type</label>
                <input
                  type="text"
                  value={formData.compoundingType}
                  onChange={(e) => setFormData({ ...formData, compoundingType: e.target.value })}
                  placeholder="e.g., Daily compounding, weekly dividends"
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Member Benefits</label>
                <textarea
                  value={formData.memberBenefits}
                  onChange={(e) => setFormData({ ...formData, memberBenefits: e.target.value })}
                  rows={2}
                  placeholder="Special benefits for community members"
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Verified By</label>
                <input
                  type="text"
                  value={formData.verifiedBy}
                  onChange={(e) => setFormData({ ...formData, verifiedBy: e.target.value })}
                  placeholder="Who verified this opportunity"
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                >
                  {WGO_STATUSES.map(status => (
                    <option key={status} value={status}>{WGO_STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Risk Disclaimer</label>
                <textarea
                  value={formData.disclaimer}
                  onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Terms & Conditions URL</label>
                <input
                  type="url"
                  value={formData.termsUrl}
                  onChange={(e) => setFormData({ ...formData, termsUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                {loading ? 'Creating...' : 'Create Opportunity'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
