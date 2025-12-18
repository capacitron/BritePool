'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Globe, Mail, Building, Pencil, Trash2, X } from 'lucide-react'

interface Partner {
  id: string
  name: string
  description: string | null
  logo: string | null
  website: string | null
  email: string | null
  category: 'ADVISORY_BOARD' | 'PRACTITIONER' | 'SPONSOR' | 'VENDOR' | 'COLLABORATOR'
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

const CATEGORIES = [
  { value: 'ADVISORY_BOARD', label: 'Advisory Board' },
  { value: 'PRACTITIONER', label: 'Practitioner' },
  { value: 'SPONSOR', label: 'Sponsor' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'COLLABORATOR', label: 'Collaborator' },
]

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR']

function getCategoryBadgeStyles(category: string) {
  const styles: Record<string, string> = {
    ADVISORY_BOARD: 'bg-purple-100 text-purple-800',
    PRACTITIONER: 'bg-blue-100 text-blue-800',
    SPONSOR: 'bg-amber-100 text-amber-800',
    VENDOR: 'bg-teal-100 text-teal-800',
    COLLABORATOR: 'bg-green-100 text-green-800',
  }
  return styles[category] || 'bg-gray-100 text-gray-800'
}

function getStatusBadgeStyles(status: string) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
  }
  return styles[status] || 'bg-gray-100 text-gray-800'
}

export default function PartnerDetailPage({ params }: { params: Promise<{ partnerId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPartner()
    fetchUserRole()
  }, [resolvedParams.partnerId])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data?.user?.role || '')
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error)
    }
  }

  const fetchPartner = async () => {
    try {
      const response = await fetch(`/api/partners/${resolvedParams.partnerId}`)
      if (response.ok) {
        const data = await response.json()
        setPartner(data)
      } else if (response.status === 404) {
        router.push('/dashboard/partners')
      }
    } catch (error) {
      console.error('Failed to fetch partner:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/partners/${resolvedParams.partnerId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        router.push('/dashboard/partners')
      }
    } catch (error) {
      console.error('Failed to delete partner:', error)
    } finally {
      setDeleting(false)
    }
  }

  const isAdmin = ADMIN_ROLES.includes(userRole)

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-earth-brown-light">Loading partner details...</p>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-earth-brown-light">Partner not found</p>
        <Link href="/dashboard/partners">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partners
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/partners">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partners
          </Button>
        </Link>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square relative bg-stone-warm rounded-lg flex items-center justify-center mb-4">
                {partner.logo ? (
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Building className="h-24 w-24 text-earth-brown-light" />
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryBadgeStyles(partner.category)}`}>
                  {partner.category.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeStyles(partner.status)}`}>
                  {partner.status}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{partner.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {partner.description && (
                <div>
                  <h3 className="text-sm font-medium text-earth-brown-light mb-2">Description</h3>
                  <p className="text-earth-brown-dark">{partner.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {partner.website && (
                  <div>
                    <h3 className="text-sm font-medium text-earth-brown-light mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </h3>
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {partner.website}
                    </a>
                  </div>
                )}

                {partner.email && (
                  <div>
                    <h3 className="text-sm font-medium text-earth-brown-light mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Email
                    </h3>
                    <a
                      href={`mailto:${partner.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {partner.email}
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t text-sm text-earth-brown-light">
                <p>Added on {new Date(partner.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showEditModal && (
        <EditPartnerModal
          partner={partner}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchPartner()
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Partner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-earth-brown-light mb-6">
                Are you sure you want to delete <strong>{partner.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:bg-red-50"
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
    </div>
  )
}

function EditPartnerModal({
  partner,
  onClose,
  onSuccess,
}: {
  partner: Partner
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: partner.name,
    description: partner.description || '',
    logo: partner.logo || '',
    website: partner.website || '',
    email: partner.email || '',
    category: partner.category,
    status: partner.status,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/partners/${partner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          logo: formData.logo || null,
          website: formData.website || null,
          email: formData.email || null,
          category: formData.category,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update partner')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit Partner</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Partner Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input
                type="url"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as typeof formData.category })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                >
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
