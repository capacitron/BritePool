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
  LOW: 'bg-sand-100 text-sand-700 border-sand-300',
  MEDIUM: 'bg-forest-100 text-forest-700 border-forest-300',
  HIGH: 'bg-earth-100 text-earth-700 border-earth-300',
  URGENT: 'bg-red-100 text-red-700 border-red-200',
}

const statusStyles: Record<string, string> = {
  SUBMITTED: 'bg-sand-200 text-sand-800 border-sand-400',
  ASSIGNED: 'bg-forest-100 text-forest-700 border-forest-300',
  IN_PROGRESS: 'bg-earth-100 text-earth-700 border-earth-300',
  RESOLVED: 'bg-forest-200 text-forest-800 border-forest-400',
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
          <h1 className="text-3xl font-display font-bold text-forest-800">
            Maintenance Requests
          </h1>
          <p className="text-forest-500 mt-1 font-body">
            Submit and track maintenance requests
          </p>
        </div>
        <Link href="/dashboard/maintenance/new">
          <Button className="bg-forest-600 hover:bg-forest-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Submit Request
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 border-b border-sand-200">
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-3 px-1 text-sm font-medium transition-colors font-body ${
            activeTab === 'my'
              ? 'border-b-2 border-forest-600 text-forest-700'
              : 'text-forest-500 hover:text-forest-700'
          }`}
        >
          My Requests
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-1 text-sm font-medium transition-colors font-body ${
              activeTab === 'all'
                ? 'border-b-2 border-forest-600 text-forest-700'
                : 'text-forest-500 hover:text-forest-700'
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
          className="border-forest-600 text-forest-700 hover:bg-forest-50"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        {(statusFilter || priorityFilter || categoryFilter) && (
          <button
            onClick={clearFilters}
            className="text-sm text-forest-600 hover:underline font-body"
          >
            Clear filters
          </button>
        )}
      </div>

      {showFilters && (
        <Card className="border-sand-200">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1 font-body">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
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
                <label className="block text-sm font-medium text-forest-800 mb-1 font-body">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
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
                <label className="block text-sm font-medium text-forest-800 mb-1 font-body">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
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
        <div className="text-center py-12 text-forest-500 font-body">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-sand-200">
          <CardContent className="py-12 text-center">
            <Wrench className="w-12 h-12 mx-auto text-forest-400 mb-4" />
            <h3 className="text-lg font-medium font-display text-forest-800 mb-2">
              No maintenance requests
            </h3>
            <p className="text-forest-500 mb-4 font-body">
              {activeTab === 'my'
                ? "You haven't submitted any maintenance requests yet."
                : 'There are no maintenance requests matching your filters.'}
            </p>
            <Link href="/dashboard/maintenance/new">
              <Button className="bg-forest-600 hover:bg-forest-700 text-white">
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
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-sand-200">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium font-display text-forest-800">
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
                      <p className="text-sm text-forest-500 line-clamp-2 mb-2 font-body">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-forest-500 font-body">
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
