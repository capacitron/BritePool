'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AuditLogTable } from '@/components/admin/AuditLogTable'
import type { AuditAction, ResourceType, UserRole } from '@prisma/client'

interface AuditLog {
  id: string
  action: AuditAction
  resourceType: ResourceType
  resourceId: string | null
  description: string
  metadata: Record<string, unknown> | null
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  ipAddress: string
  createdAt: string
  userId: string
  userRole: UserRole
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ACTIONS: AuditAction[] = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_SUSPENDED',
  'USER_ACTIVATED',
  'ROLE_CHANGED',
  'PASSWORD_RESET',
  'CONTENT_APPROVED',
  'CONTENT_REJECTED',
  'CONTENT_EDITED',
  'CONTENT_DELETED',
  'SETTINGS_UPDATED',
  'FEATURE_FLAG_CHANGED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
]

const RESOURCE_TYPES: ResourceType[] = [
  'USER',
  'CONTENT',
  'COMMITTEE',
  'EVENT',
  'COURSE',
  'MEDIA',
  'FORUM_POST',
  'ANNOUNCEMENT',
  'SETTINGS',
  'CONTRACT',
  'REPORT',
]

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (actionFilter) params.set('action', actionFilter)
      if (resourceTypeFilter) params.set('resourceType', resourceTypeFilter)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const response = await fetch(`/api/admin/audit?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, actionFilter, resourceTypeFilter, startDate, endDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const clearFilters = () => {
    setActionFilter('')
    setResourceTypeFilter('')
    setStartDate('')
    setEndDate('')
    setPagination({ ...pagination, page: 1 })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-600">Track all administrative actions on the platform</p>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-wrap gap-4">
          <Select
            value={actionFilter || 'all'}
            onValueChange={(v) => setActionFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={resourceTypeFilter || 'all'}
            onValueChange={(v) => setResourceTypeFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Resources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {RESOURCE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[150px]"
              placeholder="Start date"
            />
            <span className="text-slate-400">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[150px]"
              placeholder="End date"
            />
          </div>

          <Button
            onClick={() => {
              setPagination({ ...pagination, page: 1 })
              fetchLogs()
            }}
          >
            Filter
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : (
        <>
          <AuditLogTable logs={logs} />

          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} logs
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
