'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Coins, Plus, Filter, X, Users, Target, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { cn } from '@/lib/utils'

interface Pool {
  id: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'COMPLETED'
  startDate: string
  endDate: string | null
  creatorId: string
  createdAt: string
  _count: {
    cuts: number
  }
}

const POOL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  COMPLETED: 'Completed',
}

const POOL_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

export default function PoolsPage() {
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  // Filters
  const [statusFilter, setStatusFilter] = useState<string | null>('ACTIVE')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchPools()
    fetchUserRole()
  }, [statusFilter])

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      setUserRole(data?.user?.role || '')
    } catch {
      // Ignore errors
    }
  }

  const fetchPools = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const res = await fetch(`/api/pools?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPools(data)
    } catch (err) {
      setError('Failed to load pools')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = ADMIN_ROLES.includes(userRole)

  const clearFilters = () => {
    setStatusFilter('ACTIVE')
  }

  const hasActiveFilters = statusFilter !== 'ACTIVE'

  const calculateProgress = (current: number, target: number) => {
    if (target <= 0) return 0
    return Math.min(100, (current / target) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        path="pools"
        customTitle="Investment Pools"
        customDescription="View and participate in community investment pools. Pool your resources with others to invest in larger opportunities."
      />

      {isAdmin && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-forest-600 hover:bg-forest-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Pool
          </Button>
        </div>
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
                {['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      statusFilter === status
                        ? 'bg-forest-600 text-white'
                        : POOL_STATUS_COLORS[status]
                    )}
                  >
                    {POOL_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-forest-500">Loading pools...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : pools.length === 0 ? (
        <Card className="border-sand-200">
          <CardContent className="p-12 text-center">
            <Coins className="h-12 w-12 text-forest-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-forest-700 mb-2">No Pools Found</h3>
            <p className="text-forest-500">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more pools.'
                : 'Check back soon for new investment pools.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map((pool) => {
            const progress = calculateProgress(pool.currentAmount, pool.targetAmount)
            return (
              <Link key={pool.id} href={`/dashboard/pools/${pool.id}`}>
                <Card className="border-sand-200 hover:border-forest-300 hover:shadow-lg transition-all h-full cursor-pointer">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-forest-100 flex items-center justify-center">
                          <Coins className="h-6 w-6 text-forest-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-forest-800 line-clamp-1">{pool.name}</h3>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              POOL_STATUS_COLORS[pool.status]
                            )}
                          >
                            {POOL_STATUS_LABELS[pool.status]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {pool.description && (
                      <p className="text-sm text-forest-600 line-clamp-2 mb-4">
                        {pool.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-forest-500">Progress</span>
                        <span className="font-medium text-forest-700">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-forest-500 to-forest-600 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-forest-500">
                        <span>${pool.currentAmount.toLocaleString()}</span>
                        <span>${pool.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-3 text-xs text-forest-500 pt-3 border-t border-sand-100">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {pool._count.cuts} cuts
                      </span>
                      {pool.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(pool.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreateModal && (
        <CreatePoolModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchPools()
          }}
        />
      )}
    </div>
  )
}

// Create Pool Modal Component
function CreatePoolModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    status: 'DRAFT',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          targetAmount: parseFloat(formData.targetAmount),
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          status: formData.status,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create pool')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pool')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Create Investment Pool</CardTitle>
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
              <label className="block text-sm font-medium text-forest-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Target Amount ($) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Pool'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
