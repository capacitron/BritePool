'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wrench, Filter } from 'lucide-react'

type MaintenanceRequest = {
  id: string
  title: string
  description: string
  location: string
  category: string
  priority: string
  status: string
  submittedAt: string
  submittedBy: { id: string; name: string }
  assignedTo: { id: string; name: string } | null
}

const priorityStyles: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  URGENT: 'bg-red-100 text-red-700 border-red-200',
}

const statusStyles: Record<string, string> = {
  SUBMITTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ASSIGNED: 'bg-purple-100 text-purple-700 border-purple-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
}

const categories = ['PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'GROUNDS', 'HVAC', 'OTHER']
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const statuses = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [activeTab, statusFilter, priorityFilter, categoryFilter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab === 'my') {
        params.set('myRequests', 'true')
      }
      if (statusFilter) params.set('status', statusFilter)
      if (priorityFilter) params.set('priority', priorityFilter)
      if (categoryFilter) params.set('category', categoryFilter)

      const response = await fetch(`/api/maintenance-requests?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        const role = data?.user?.role
        if (role && ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR', 'SUPPORT_STAFF'].includes(role)) {
          setIsAdmin(true)
        }
      })
      .catch(() => {})
  }, [])

  const clearFilters = () => {
    setStatusFilter('')
    setPriorityFilter('')
    setCategoryFilter('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            Maintenance Requests
          </h1>
          <p className="text-earth-brown-light mt-1">
            Submit and track maintenance requests
          </p>
        </div>
        <Link href="/dashboard/maintenance/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Submit Request
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === 'my'
              ? 'border-b-2 border-earth-brown text-earth-brown'
              : 'text-earth-brown-light hover:text-earth-brown'
          }`}
        >
          My Requests
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'border-b-2 border-earth-brown text-earth-brown'
                : 'text-earth-brown-light hover:text-earth-brown'
            }`}
          >
            All Requests
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        {(statusFilter || priorityFilter || categoryFilter) && (
          <button
            onClick={clearFilters}
            className="text-sm text-earth-brown hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-earth-brown-dark mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-earth-brown"
                >
                  <option value="">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-brown-dark mb-1">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-earth-brown"
                >
                  <option value="">All Priorities</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-brown-dark mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-earth-brown"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-earth-brown-light">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="w-12 h-12 mx-auto text-earth-brown-light mb-4" />
            <h3 className="text-lg font-medium text-earth-brown-dark mb-2">
              No maintenance requests
            </h3>
            <p className="text-earth-brown-light mb-4">
              {activeTab === 'my'
                ? "You haven't submitted any maintenance requests yet."
                : 'There are no maintenance requests matching your filters.'}
            </p>
            <Link href="/dashboard/maintenance/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Link key={request.id} href={`/dashboard/maintenance/${request.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-earth-brown-dark">
                          {request.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            priorityStyles[request.priority]
                          }`}
                        >
                          {request.priority}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            statusStyles[request.status]
                          }`}
                        >
                          {request.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-earth-brown-light line-clamp-2 mb-2">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-earth-brown-light">
                        <span>Location: {request.location}</span>
                        <span>Category: {request.category}</span>
                        <span>Submitted: {formatDate(request.submittedAt)}</span>
                        {request.assignedTo && (
                          <span>Assigned to: {request.assignedTo.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
