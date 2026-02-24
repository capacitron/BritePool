'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: string
  status: string
  subscriptionTier: string
  subscriptionStatus: string
  covenantAcceptedAt: string | null
  createdAt: string
  lastLoginAt: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const roles = [
  'WEB_STEWARD',
  'BOARD_CHAIR',
  'COMMITTEE_LEADER',
  'CONTENT_MODERATOR',
  'SUPPORT_STAFF',
  'STEWARD',
  'PARTNER',
  'RESIDENT',
]

const subscriptionTiers = ['FREE', 'BASIC', 'PREMIUM', 'PLATINUM']
const subscriptionStatuses = ['ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED']
const accountStatuses = ['ACTIVE', 'SUSPENDED', 'LOCKED']

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '')
  const [tierFilter, setTierFilter] = useState(searchParams.get('subscriptionTier') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('subscriptionStatus') || '')
  const [covenantFilter, setCovenantFilter] = useState(searchParams.get('covenantStatus') || '')
  const [accountStatusFilter, setAccountStatusFilter] = useState(searchParams.get('status') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, tierFilter, statusFilter, covenantFilter, accountStatusFilter])

  async function fetchUsers() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', page.toString())
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (tierFilter) params.set('subscriptionTier', tierFilter)
    if (statusFilter) params.set('subscriptionStatus', statusFilter)
    if (accountStatusFilter) params.set('status', accountStatusFilter)
    if (covenantFilter) params.set('covenantStatus', covenantFilter)

    try {
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || `Failed to update role (${res.status})`)
        fetchUsers()
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Network error updating role. Please try again.')
    }
  }

  async function handleStatusChange(userId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionStatus: newStatus }),
      })
      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || `Failed to update subscription status (${res.status})`)
        fetchUsers()
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Network error updating status. Please try again.')
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString()
  }

  function getRoleBadgeClass(role: string) {
    const styles: Record<string, string> = {
      WEB_STEWARD: 'bg-purple-100 text-purple-800',
      BOARD_CHAIR: 'bg-amber-100 text-amber-800',
      COMMITTEE_LEADER: 'bg-blue-100 text-blue-800',
      CONTENT_MODERATOR: 'bg-teal-100 text-teal-800',
      SUPPORT_STAFF: 'bg-gray-100 text-gray-800',
      STEWARD: 'bg-green-100 text-green-800',
      PARTNER: 'bg-orange-100 text-orange-800',
      RESIDENT: 'bg-stone-100 text-stone-800',
    }
    return styles[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-brown-dark">
            User Management
          </h1>
          <p className="text-earth-brown-light mt-1 text-sm sm:text-base">
            View and manage all platform users
          </p>
        </div>
        <Button asChild variant="outline" className="self-start sm:self-auto">
          <Link href="/dashboard/admin">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
          <CardDescription>
            {pagination ? `${pagination.total} total users` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-earth-brown-light" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-stone rounded-lg bg-white text-sm"
                >
                  <option value="">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <select
                  value={tierFilter}
                  onChange={(e) => {
                    setTierFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-stone rounded-lg bg-white text-sm"
                >
                  <option value="">All Tiers</option>
                  {subscriptionTiers.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
                <select
                  value={accountStatusFilter}
                  onChange={(e) => {
                    setAccountStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-stone rounded-lg bg-white text-sm"
                >
                  <option value="">All Statuses</option>
                  {accountStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={covenantFilter}
                  onChange={(e) => {
                    setCovenantFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-stone rounded-lg bg-white text-sm"
                >
                  <option value="">Agreement Status</option>
                  <option value="accepted">Accepted</option>
                  <option value="pending">Pending</option>
                </select>
                <Button type="submit" className="w-full">
                  Search
                </Button>
              </div>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-8 text-earth-brown-light">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-earth-brown-light">No users found</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/dashboard/admin/users/${user.id}`}
                  className={`block p-4 rounded-lg border border-stone hover:bg-stone-warm transition-colors group ${user.status === 'SUSPENDED' ? 'opacity-50' : user.status === 'LOCKED' ? 'opacity-40 bg-red-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-earth-dark group-hover:text-earth-brown-dark truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-earth-brown-light truncate">{user.email}</p>
                    </div>
                    <Eye className="h-4 w-4 text-earth-brown-light shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeClass(user.role)}`}
                    >
                      {user.role.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        user.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.status}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        user.subscriptionStatus === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.subscriptionTier} / {user.subscriptionStatus}
                    </span>
                    {user.covenantAcceptedAt ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Agreement Accepted
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Agreement Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-earth-brown-light mt-2">
                    Joined {formatDate(user.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-stone">
              <p className="text-sm text-earth-brown-light">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
