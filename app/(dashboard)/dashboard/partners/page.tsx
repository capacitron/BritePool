'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, Filter, X, Globe, Mail, Building } from 'lucide-react'

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

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE')
  const [showAddModal, setShowAddModal] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchPartners()
    fetchUserRole()
  }, [selectedCategory, selectedStatus])

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

  const fetchPartners = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/partners?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPartners(data)
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setSelectedStatus('ACTIVE')
  }

  const hasActiveFilters = selectedCategory || selectedStatus !== 'ACTIVE'
  const isAdmin = ADMIN_ROLES.includes(userRole)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">Partners</h1>
          <p className="text-earth-brown-light mt-1">Browse our network of affiliate partners</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Category</h4>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Status</h4>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <Button
                    key={status.value}
                    variant={selectedStatus === status.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-earth-brown-light">Loading partners...</p>
        </div>
      ) : partners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
            <h3 className="text-lg font-medium text-earth-brown-dark mb-2">No partners found</h3>
            <p className="text-earth-brown-light mb-4">
              {hasActiveFilters
                ? 'No partners match your filters. Try adjusting your selection.'
                : 'No partners have been added yet.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {partners.map((partner) => (
            <Link key={partner.id} href={`/dashboard/partners/${partner.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="aspect-square relative bg-stone-warm flex items-center justify-center">
                  {partner.logo ? (
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="h-16 w-16 text-earth-brown-light" />
                  )}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${getCategoryBadgeStyles(partner.category)}`}>
                    {partner.category.replace('_', ' ')}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-earth-brown-dark truncate">{partner.name}</h3>
                  {partner.description && (
                    <p className="text-sm text-earth-brown-light mt-1 line-clamp-2">
                      {partner.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-earth-brown-light">
                    {partner.website && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Website
                      </span>
                    )}
                    {partner.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Contact
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPartnerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchPartners()
          }}
        />
      )}
    </div>
  )
}

function AddPartnerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    email: '',
    category: 'COLLABORATOR' as const,
    status: 'PENDING' as const,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          logo: formData.logo || undefined,
          website: formData.website || undefined,
          email: formData.email || undefined,
          category: formData.category,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create partner')
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
            <CardTitle>Add Partner</CardTitle>
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
                placeholder="Partner Organization"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Brief description of the partner..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input
                type="url"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://example.com/logo.png"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="contact@example.com"
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
                {submitting ? 'Creating...' : 'Create Partner'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
