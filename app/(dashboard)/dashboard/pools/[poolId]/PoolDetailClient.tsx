'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Coins,
  DollarSign,
  Users,
  Calendar,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Mail,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

const PLEDGE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
}

const PLEDGE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

interface Cut {
  id: string
  name: string
  description: string | null
  minAmount: number
  maxAmount: number | null
  colorCode: string | null
  createdAt: string
  _count: {
    pledges: number
    invitations: number
  }
}

interface Pledge {
  id: string
  cutId: string
  userId: string
  amount: number
  status: string
  notes: string | null
  paidAt: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface Invitation {
  id: string
  cutId: string
  email: string
  token: string
  status: string
  expiresAt: string
  createdAt: string
}

interface Pool {
  id: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  status: string
  startDate: string
  endDate: string | null
  creatorId: string
  createdAt: string
  updatedAt: string
  cuts: Cut[]
  _count: {
    cuts: number
  }
}

interface PoolDetailClientProps {
  poolId: string
  userId: string
  userRole: string
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

export function PoolDetailClient({ poolId, userId, userRole }: PoolDetailClientProps) {
  const router = useRouter()
  const [pool, setPool] = useState<Pool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAddCutModal, setShowAddCutModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Cut details state
  const [expandedCuts, setExpandedCuts] = useState<Set<string>>(new Set())
  const [cutPledges, setCutPledges] = useState<Record<string, Pledge[]>>({})
  const [cutInvitations, setCutInvitations] = useState<Record<string, Invitation[]>>({})
  const [loadingCuts, setLoadingCuts] = useState<Set<string>>(new Set())

  // Pledge modal state
  const [pledgeModalCut, setPledgeModalCut] = useState<Cut | null>(null)

  // Invitation modal state
  const [invitationModalCut, setInvitationModalCut] = useState<Cut | null>(null)

  const isAdmin = ADMIN_ROLES.includes(userRole)
  const isCreator = pool?.creatorId === userId
  const canManage = isAdmin || isCreator

  const fetchPool = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/pools/${poolId}`)

      if (!res.ok) {
        if (res.status === 404) {
          setError('Pool not found')
        } else if (res.status === 401) {
          setError('You must be logged in to view this page')
        } else {
          const data = await res.json()
          setError(data.error || 'Failed to load pool details')
        }
        return
      }

      const data = await res.json()
      setPool(data)
    } catch {
      setError('Failed to load pool details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [poolId])

  const fetchCutDetails = async (cutId: string) => {
    setLoadingCuts((prev) => new Set(prev).add(cutId))
    try {
      // Fetch pledges
      const pledgesRes = await fetch(`/api/pools/cuts/${cutId}/pledges`)
      if (pledgesRes.ok) {
        const pledgesData = await pledgesRes.json()
        setCutPledges((prev) => ({ ...prev, [cutId]: pledgesData.pledges || [] }))
      }

      // Fetch invitations if admin
      if (canManage) {
        const invitationsRes = await fetch(`/api/pools/cuts/${cutId}/invitations`)
        if (invitationsRes.ok) {
          const invitationsData = await invitationsRes.json()
          setCutInvitations((prev) => ({ ...prev, [cutId]: invitationsData || [] }))
        }
      }
    } catch {
      // Failed to fetch cut details
    } finally {
      setLoadingCuts((prev) => {
        const next = new Set(prev)
        next.delete(cutId)
        return next
      })
    }
  }

  useEffect(() => {
    fetchPool()
  }, [fetchPool])

  const toggleCutExpansion = (cutId: string) => {
    setExpandedCuts((prev) => {
      const next = new Set(prev)
      if (next.has(cutId)) {
        next.delete(cutId)
      } else {
        next.add(cutId)
        // Fetch details when expanding
        if (!cutPledges[cutId]) {
          fetchCutDetails(cutId)
        }
      }
      return next
    })
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/pools/${poolId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/pools')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete')
      }
    } catch {
      alert('Failed to delete. Please try again.')
    } finally {
      setActionLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-forest-600 mx-auto mb-4" />
          <p className="text-forest-600">Loading pool details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-800 mb-4">Error</h1>
            <p className="text-red-700 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button onClick={fetchPool}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not found state
  if (!pool) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-yellow-800 mb-4">Pool Not Found</h1>
            <p className="text-yellow-700 mb-6">The investment pool could not be found.</p>
            <Link
              href="/dashboard/pools"
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Return to Pools
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const progressPercentage =
    pool.targetAmount > 0 ? Math.min(100, (pool.currentAmount / pool.targetAmount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/pools"
          className="p-2 hover:bg-sand-100 rounded-lg transition-colors mt-1"
        >
          <ArrowLeft className="h-5 w-5 text-forest-600" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-800">
              {pool.name}
            </h1>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                POOL_STATUS_COLORS[pool.status] || 'bg-gray-100 text-gray-800'
              )}
            >
              {POOL_STATUS_LABELS[pool.status] || pool.status}
            </span>
          </div>
          <p className="text-forest-500">
            Created on {new Date(pool.createdAt).toLocaleDateString()}
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {pool.description && (
            <Card className="border-sand-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-forest-600" />
                  About This Pool
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-forest-700 whitespace-pre-wrap">{pool.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Cuts Section */}
          <Card className="border-sand-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-forest-600" />
                Investment Cuts ({pool.cuts.length})
              </CardTitle>
              {canManage && (
                <Button
                  size="sm"
                  onClick={() => setShowAddCutModal(true)}
                  className="bg-forest-600 hover:bg-forest-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Cut
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {pool.cuts.length === 0 ? (
                <p className="text-center text-forest-500 py-8">
                  No cuts defined yet.
                  {canManage && ' Add a cut to allow members to pledge.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {pool.cuts.map((cut) => {
                    const isExpanded = expandedCuts.has(cut.id)
                    const isLoadingCut = loadingCuts.has(cut.id)
                    const pledges = cutPledges[cut.id] || []
                    const invitations = cutInvitations[cut.id] || []

                    return (
                      <div
                        key={cut.id}
                        className="border border-sand-200 rounded-lg overflow-hidden"
                        style={{
                          borderLeftColor: cut.colorCode || undefined,
                          borderLeftWidth: cut.colorCode ? '4px' : undefined,
                        }}
                      >
                        {/* Cut Header */}
                        <div
                          className="flex items-center justify-between p-4 bg-sand-50 cursor-pointer hover:bg-sand-100 transition-colors"
                          onClick={() => toggleCutExpansion(cut.id)}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-forest-800">{cut.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-forest-500 mt-1">
                              <span>
                                ${cut.minAmount.toLocaleString()}
                                {cut.maxAmount ? ` - $${cut.maxAmount.toLocaleString()}` : '+'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {cut._count.pledges} pledges
                              </span>
                              {canManage && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {cut._count.invitations} invitations
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {pool.status === 'ACTIVE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPledgeModalCut(cut)
                                }}
                                className="text-forest-600 border-forest-300 hover:bg-forest-50"
                              >
                                Pledge
                              </Button>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-forest-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-forest-400" />
                            )}
                          </div>
                        </div>

                        {/* Cut Details */}
                        {isExpanded && (
                          <div className="p-4 border-t border-sand-200 space-y-4">
                            {cut.description && (
                              <p className="text-sm text-forest-600">{cut.description}</p>
                            )}

                            {isLoadingCut ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-forest-500" />
                              </div>
                            ) : (
                              <>
                                {/* Pledges */}
                                <div>
                                  <h5 className="text-sm font-medium text-forest-700 mb-2">
                                    Pledges ({pledges.length})
                                  </h5>
                                  {pledges.length === 0 ? (
                                    <p className="text-sm text-forest-500">No pledges yet.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {pledges.map((pledge) => (
                                        <div
                                          key={pledge.id}
                                          className="flex items-center justify-between p-3 bg-white border border-sand-100 rounded-lg"
                                        >
                                          <div>
                                            <span className="font-medium text-forest-800">
                                              {pledge.user.name}
                                            </span>
                                            <span className="text-sm text-forest-500 ml-2">
                                              ${pledge.amount.toLocaleString()}
                                            </span>
                                          </div>
                                          <span
                                            className={cn(
                                              'px-2 py-0.5 rounded text-xs font-medium',
                                              PLEDGE_STATUS_COLORS[pledge.status]
                                            )}
                                          >
                                            {PLEDGE_STATUS_LABELS[pledge.status]}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Invitations (Admin Only) */}
                                {canManage && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="text-sm font-medium text-forest-700">
                                        Invitations ({invitations.length})
                                      </h5>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setInvitationModalCut(cut)}
                                        className="text-forest-600"
                                      >
                                        <Send className="h-4 w-4 mr-1" />
                                        Invite
                                      </Button>
                                    </div>
                                    {invitations.length === 0 ? (
                                      <p className="text-sm text-forest-500">
                                        No invitations sent.
                                      </p>
                                    ) : (
                                      <div className="space-y-2">
                                        {invitations.map((invitation) => (
                                          <div
                                            key={invitation.id}
                                            className="flex items-center justify-between p-3 bg-white border border-sand-100 rounded-lg"
                                          >
                                            <div>
                                              <span className="font-medium text-forest-800">
                                                {invitation.email}
                                              </span>
                                              <span className="text-xs text-forest-500 ml-2">
                                                Expires:{' '}
                                                {new Date(
                                                  invitation.expiresAt
                                                ).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <span
                                              className={cn(
                                                'px-2 py-0.5 rounded text-xs font-medium',
                                                invitation.status === 'PENDING'
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : invitation.status === 'ACCEPTED'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-gray-100 text-gray-800'
                                              )}
                                            >
                                              {invitation.status}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card className="border-forest-200 bg-gradient-to-b from-forest-50 to-white">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-medium text-forest-800">Pool Progress</h3>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-forest-500">Collected</span>
                  <span className="font-bold text-forest-700">
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-4 bg-sand-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-forest-500 to-forest-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-forest-500">
                  <span>${pool.currentAmount.toLocaleString()}</span>
                  <span>${pool.targetAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="border-sand-200">
            <CardHeader>
              <CardTitle className="text-sm">Pool Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-forest-500">Status</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    POOL_STATUS_COLORS[pool.status]
                  )}
                >
                  {POOL_STATUS_LABELS[pool.status]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Target</span>
                <span className="font-bold text-forest-800">
                  ${pool.targetAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Current</span>
                <span className="font-bold text-forest-800">
                  ${pool.currentAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Cuts</span>
                <span className="font-bold text-forest-800">{pool._count.cuts}</span>
              </div>
              {pool.startDate && (
                <div className="flex justify-between">
                  <span className="text-forest-500">Start Date</span>
                  <span className="text-forest-700">
                    {new Date(pool.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {pool.endDate && (
                <div className="flex justify-between">
                  <span className="text-forest-500">End Date</span>
                  <span className="text-forest-700">
                    {new Date(pool.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-forest-500">Created</span>
                <span className="text-forest-700">
                  {new Date(pool.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-forest-800 mb-2">Delete Pool?</h3>
              <p className="text-forest-600 mb-4">
                This action cannot be undone. All cuts, pledges, and invitations will also be
                deleted.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Pool Modal */}
      {showEditModal && pool && (
        <EditPoolModal
          pool={pool}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchPool()
          }}
        />
      )}

      {/* Add Cut Modal */}
      {showAddCutModal && (
        <AddCutModal
          poolId={poolId}
          onClose={() => setShowAddCutModal(false)}
          onSuccess={() => {
            setShowAddCutModal(false)
            fetchPool()
          }}
        />
      )}

      {/* Pledge Modal */}
      {pledgeModalCut && (
        <PledgeModal
          cut={pledgeModalCut}
          onClose={() => setPledgeModalCut(null)}
          onSuccess={() => {
            setPledgeModalCut(null)
            fetchCutDetails(pledgeModalCut.id)
          }}
        />
      )}

      {/* Invitation Modal */}
      {invitationModalCut && (
        <InvitationModal
          cut={invitationModalCut}
          onClose={() => setInvitationModalCut(null)}
          onSuccess={() => {
            fetchCutDetails(invitationModalCut.id)
          }}
        />
      )}
    </div>
  )
}

// Edit Pool Modal
function EditPoolModal({
  pool,
  onClose,
  onSuccess,
}: {
  pool: Pool
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: pool.name,
    description: pool.description || '',
    targetAmount: pool.targetAmount.toString(),
    currentAmount: pool.currentAmount.toString(),
    status: pool.status,
    startDate: pool.startDate ? pool.startDate.slice(0, 10) : '',
    endDate: pool.endDate ? pool.endDate.slice(0, 10) : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/pools/${pool.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount),
          status: formData.status,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Edit Pool</CardTitle>
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
              <label className="block text-sm font-medium text-forest-700 mb-1">Name</label>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Target Amount ($)
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
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Current Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
              >
                {Object.entries(POOL_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
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

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Add Cut Modal
function AddCutModal({
  poolId,
  onClose,
  onSuccess,
}: {
  poolId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minAmount: '',
    maxAmount: '',
    colorCode: '#2D5A3D',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/pools/${poolId}/cuts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          minAmount: parseFloat(formData.minAmount),
          maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : undefined,
          colorCode: formData.colorCode,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create cut')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cut')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Add Investment Cut</CardTitle>
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
                placeholder="e.g., Bronze Tier, Silver Tier"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                placeholder="Describe the benefits of this tier"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Minimum Amount ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Maximum Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                  placeholder="Leave empty for no max"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  className="w-12 h-10 rounded border border-sand-300"
                />
                <input
                  type="text"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  className="flex-1 px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                  placeholder="#2D5A3D"
                />
              </div>
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Cut
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Pledge Modal
function PledgeModal({
  cut,
  onClose,
  onSuccess,
}: {
  cut: Cut
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    amount: cut.minAmount.toString(),
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/pools/cuts/${cut.id}/pledges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          notes: formData.notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create pledge')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pledge')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Make a Pledge</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-sand-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 p-3 bg-forest-50 rounded-lg">
            <p className="text-sm text-forest-700">
              <strong>{cut.name}</strong>
            </p>
            <p className="text-xs text-forest-500 mt-1">
              Amount range: ${cut.minAmount.toLocaleString()}
              {cut.maxAmount ? ` - $${cut.maxAmount.toLocaleString()}` : '+'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Pledge Amount ($) *
              </label>
              <input
                type="number"
                min={cut.minAmount}
                max={cut.maxAmount || undefined}
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                placeholder="Any additional notes about your pledge"
              />
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Pledge
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Invitation Modal
function InvitationModal({
  cut,
  onClose,
  onSuccess,
}: {
  cut: Cut
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    expiresInDays: '7',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/pools/cuts/${cut.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          expiresInDays: parseInt(formData.expiresInDays),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(true)
      setFormData({ email: '', expiresInDays: '7' })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Send Invitation</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-sand-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 p-3 bg-forest-50 rounded-lg">
            <p className="text-sm text-forest-700">
              Invite someone to join the <strong>{cut.name}</strong> cut.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
                <Check className="h-4 w-4" />
                Invitation sent successfully!
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                placeholder="invitee@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Expires In</label>
              <select
                value={formData.expiresInDays}
                onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-forest-500"
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Close
              </Button>
              <Button
                type="submit"
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
