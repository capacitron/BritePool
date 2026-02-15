'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Plus, Filter, X, DollarSign, Users, Clock, AlertTriangle } from 'lucide-react'
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
              All opportunities listed are supported by the good faith of the membership. Higher
              trust ratings indicate more organizational credibility, but all investments carry
              risk. Please conduct your own due diligence before participating.
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
    title: '',
    description: '',
    category: 'INVESTMENT',
    status: 'DRAFT',
    targetAmount: '',
    startDate: '',
    endDate: '',
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
          title: formData.title,
          description: formData.description,
          category: formData.category,
          status: formData.status,
          targetAmount: formData.targetAmount ? parseFloat(formData.targetAmount) : null,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        }),
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
              <label className="block text-sm font-medium text-forest-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Category *</label>
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

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Target Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                placeholder="Optional"
              />
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
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
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
                {loading ? 'Creating...' : 'Create Opportunity'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
