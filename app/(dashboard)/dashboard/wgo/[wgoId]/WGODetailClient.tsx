'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, TrendingUp, Globe, Mail, ExternalLink, DollarSign,
  Users, Clock, Shield, Pencil, Trash2, AlertTriangle, CheckCircle, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RiskToleranceIndicator, RiskToleranceBar } from '@/components/wgo/RiskToleranceIndicator'
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
  termsUrl: string | null
  createdBy: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface WGODetailClientProps {
  opportunity: WGO
  userRole: string
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

export function WGODetailClient({ opportunity, userRole }: WGODetailClientProps) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = ADMIN_ROLES.includes(userRole)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/wgo/${opportunity.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/wgo')
      }
    } catch {
      alert('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/wgo"
          className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-forest-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-forest-800">
              {opportunity.name}
            </h1>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', WGO_CATEGORY_COLORS[opportunity.category])}>
              {WGO_CATEGORY_LABELS[opportunity.category]}
            </span>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', WGO_STATUS_COLORS[opportunity.status])}>
              {WGO_STATUS_LABELS[opportunity.status]}
            </span>
          </div>
          <p className="text-forest-500 mt-1">
            Added by {opportunity.createdBy.name} on {new Date(opportunity.createdAt).toLocaleDateString()}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo and Overview */}
          <Card className="border-sand-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {opportunity.logo ? (
                  <img
                    src={opportunity.logo}
                    alt={opportunity.name}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-12 w-12 text-emerald-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-medium text-forest-800 mb-2">{opportunity.name}</h2>
                  {opportunity.description && (
                    <p className="text-forest-600">{opportunity.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust Rating */}
          <Card className="border-sand-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                Organizational Trust Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RiskToleranceIndicator
                value={opportunity.riskTolerance}
                size="lg"
                showLabel
                showDescription
              />
              <RiskToleranceBar value={opportunity.riskTolerance} size="lg" />

              {opportunity.verifiedBy && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700">
                    Verified by <strong>{opportunity.verifiedBy}</strong>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Details */}
          <Card className="border-sand-200">
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {opportunity.minimumInvestment && (
                  <div className="p-4 bg-sand-50 rounded-lg">
                    <div className="flex items-center gap-2 text-forest-500 text-sm mb-1">
                      <DollarSign className="h-4 w-4" />
                      Minimum Investment
                    </div>
                    <p className="text-xl font-bold text-forest-800">
                      ${opportunity.minimumInvestment.toLocaleString()}
                    </p>
                  </div>
                )}

                {opportunity.potentialReturns && (
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-600 text-sm mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Potential Returns
                    </div>
                    <p className="text-xl font-bold text-emerald-700">
                      {opportunity.potentialReturns}
                    </p>
                  </div>
                )}

                {opportunity.yearsOperating && (
                  <div className="p-4 bg-sand-50 rounded-lg">
                    <div className="flex items-center gap-2 text-forest-500 text-sm mb-1">
                      <Clock className="h-4 w-4" />
                      Years Operating
                    </div>
                    <p className="text-xl font-bold text-forest-800">
                      {opportunity.yearsOperating} {opportunity.yearsOperating === 1 ? 'year' : 'years'}
                    </p>
                  </div>
                )}

                {opportunity.totalMembers > 0 && (
                  <div className="p-4 bg-sand-50 rounded-lg">
                    <div className="flex items-center gap-2 text-forest-500 text-sm mb-1">
                      <Users className="h-4 w-4" />
                      Community Members
                    </div>
                    <p className="text-xl font-bold text-forest-800">
                      {opportunity.totalMembers}
                    </p>
                  </div>
                )}
              </div>

              {opportunity.compoundingType && (
                <div className="mt-4 p-4 bg-sand-50 rounded-lg">
                  <h4 className="font-medium text-forest-700 mb-1">Compounding Type</h4>
                  <p className="text-forest-600">{opportunity.compoundingType}</p>
                </div>
              )}

              {opportunity.memberBenefits && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-medium text-emerald-700 mb-1">Member Benefits</h4>
                  <p className="text-emerald-600">{opportunity.memberBenefits}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disclaimer */}
          {opportunity.disclaimer && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-800 mb-2">Risk Disclaimer</h3>
                    <p className="text-amber-700 text-sm">{opportunity.disclaimer}</p>
                    {opportunity.termsUrl && (
                      <a
                        href={opportunity.termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-800 underline mt-2 text-sm"
                      >
                        View Full Terms & Conditions
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50 to-white">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-medium text-forest-800">Get Started</h3>

              {opportunity.affiliateLink && (
                <a
                  href={opportunity.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                  Join Opportunity
                </a>
              )}

              {opportunity.website && (
                <a
                  href={opportunity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 border border-forest-300 text-forest-700 hover:bg-sand-50 rounded-lg font-medium transition-colors"
                >
                  <Globe className="h-5 w-5" />
                  Visit Website
                </a>
              )}

              {opportunity.email && (
                <a
                  href={`mailto:${opportunity.email}`}
                  className="flex items-center justify-center gap-2 w-full py-3 border border-forest-300 text-forest-700 hover:bg-sand-50 rounded-lg font-medium transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  Contact
                </a>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="border-sand-200">
            <CardHeader>
              <CardTitle className="text-sm">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-forest-500">Category</span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', WGO_CATEGORY_COLORS[opportunity.category])}>
                  {WGO_CATEGORY_LABELS[opportunity.category]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Status</span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', WGO_STATUS_COLORS[opportunity.status])}>
                  {WGO_STATUS_LABELS[opportunity.status]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-500">Trust Rating</span>
                <span className="font-bold text-forest-800">{opportunity.riskTolerance}/10</span>
              </div>
              {opportunity.communityRating && (
                <div className="flex justify-between">
                  <span className="text-forest-500">Community Rating</span>
                  <span className="font-bold text-forest-800">{opportunity.communityRating}/5</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-forest-500">Added</span>
                <span className="text-forest-700">{new Date(opportunity.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* General Disclaimer */}
          <Card className="border-sand-200 bg-sand-50">
            <CardContent className="p-4 text-xs text-forest-500">
              <p>
                <strong>Disclaimer:</strong> All wealth generation opportunities are shared in good faith by community members.
                The organization's trust rating reflects our assessment but does not guarantee returns.
                Always conduct your own due diligence before investing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-forest-800 mb-2">Delete Opportunity?</h3>
              <p className="text-forest-600 mb-4">
                This action cannot be undone. Are you sure you want to delete "{opportunity.name}"?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditWGOModal
          opportunity={opportunity}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

// Edit Modal Component
function EditWGOModal({ opportunity, onClose, onSuccess }: { opportunity: WGO; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: opportunity.name,
    description: opportunity.description || '',
    logo: opportunity.logo || '',
    website: opportunity.website || '',
    affiliateLink: opportunity.affiliateLink || '',
    email: opportunity.email || '',
    category: opportunity.category,
    status: opportunity.status,
    riskTolerance: opportunity.riskTolerance,
    minimumInvestment: opportunity.minimumInvestment?.toString() || '',
    potentialReturns: opportunity.potentialReturns || '',
    compoundingType: opportunity.compoundingType || '',
    memberBenefits: opportunity.memberBenefits || '',
    yearsOperating: opportunity.yearsOperating?.toString() || '',
    verifiedBy: opportunity.verifiedBy || '',
    disclaimer: opportunity.disclaimer || '',
    termsUrl: opportunity.termsUrl || '',
    totalMembers: opportunity.totalMembers.toString(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/wgo/${opportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minimumInvestment: formData.minimumInvestment ? parseFloat(formData.minimumInvestment) : null,
          yearsOperating: formData.yearsOperating ? parseInt(formData.yearsOperating) : null,
          totalMembers: parseInt(formData.totalMembers) || 0,
        })
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Edit Opportunity</CardTitle>
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
                <label className="block text-sm font-medium text-forest-700 mb-1">Name</label>
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
                <label className="block text-sm font-medium text-forest-700 mb-1">Category</label>
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

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Trust Rating (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.riskTolerance}
                  onChange={(e) => setFormData({ ...formData, riskTolerance: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Community Members</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalMembers}
                  onChange={(e) => setFormData({ ...formData, totalMembers: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
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
                <label className="block text-sm font-medium text-forest-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Minimum Investment</label>
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
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Compounding Type</label>
                <input
                  type="text"
                  value={formData.compoundingType}
                  onChange={(e) => setFormData({ ...formData, compoundingType: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Member Benefits</label>
                <textarea
                  value={formData.memberBenefits}
                  onChange={(e) => setFormData({ ...formData, memberBenefits: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Verified By</label>
                <input
                  type="text"
                  value={formData.verifiedBy}
                  onChange={(e) => setFormData({ ...formData, verifiedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Disclaimer</label>
                <textarea
                  value={formData.disclaimer}
                  onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-forest-700 mb-1">Terms URL</label>
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
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
