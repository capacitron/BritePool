'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCog,
} from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: string
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
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, tierFilter, statusFilter, covenantFilter])

  async function fetchUsers() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', page.toString())
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (tierFilter) params.set('subscriptionTier', tierFilter)
    if (statusFilter) params.set('subscriptionStatus', statusFilter)
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
      }
    } catch (error) {
      console.error('Error updating role:', error)
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
      }
    } catch (error) {
      console.error('Error updating status:', error)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            User Management
          </h1>
          <p className="text-earth-brown-light mt-1">
            View and manage all platform users
          </p>
        </div>
        <Button asChild variant="outline">
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
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
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
              </div>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-stone rounded-lg bg-white text-sm"
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
                onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-stone rounded-lg bg-white text-sm"
              >
                <option value="">All Tiers</option>
                {subscriptionTiers.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
              <select
                value={covenantFilter}
                onChange={(e) => { setCovenantFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-stone rounded-lg bg-white text-sm"
              >
                <option value="">Covenant Status</option>
                <option value="accepted">Accepted</option>
                <option value="pending">Pending</option>
              </select>
              <Button type="submit">Search</Button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-8 text-earth-brown-light">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-earth-brown-light">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone">
                    <th className="text-left py-3 px-4 font-medium text-earth-brown-light">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-earth-brown-light">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-earth-brown-light">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-earth-brown-light">Subscription</th>
                    <th className="text-left py-3 px-4 font-medium text-earth-brown-light">Covenant</th>
                    <th className="text-left py-3 px-4 font-medium text-earth-brown-light">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-stone hover:bg-stone-warm">
                      <td className="py-3 px-4">
                        <p className="font-medium text-earth-dark">{user.name}</p>
                        <p className="text-xs text-earth-brown-light">
                          Joined {formatDate(user.createdAt)}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm">{user.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeClass(user.role)}`}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium">{user.subscriptionTier}</p>
                        <select
                          value={user.subscriptionStatus}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          className={`text-xs px-2 py-0.5 rounded ${
                            user.subscriptionStatus === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {subscriptionStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        {user.covenantAcceptedAt ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Accepted
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/dashboard/admin/users/${user.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/dashboard/admin/users/${user.id}`}>
                              <UserCog className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone">
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
