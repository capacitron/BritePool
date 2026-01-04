'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { Plus, FileText, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COMMUNAL_SEAT_CATEGORY_LABELS,
  COMMUNAL_SEAT_CATEGORY_COLORS,
  COMMUNAL_SEAT_STATUS_LABELS,
  COMMUNAL_SEAT_STATUS_COLORS,
} from '@/lib/communal-seat/categories'

interface Submission {
  id: string
  userId: string
  category: string
  status: string
  applicationData: Record<string, unknown>
  reviewNotes: string | null
  reviewedAt: string | null
  submittedAt: string
  updatedAt: string
}

interface ApiResponse {
  data: Submission[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UserSession {
  id: string
  role: string
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']
const ALL_CATEGORIES = ['GOVERNANCE', 'WEALTH', 'EDUCATION', 'HEALTH', 'OPERATIONS']

export default function CommunalSeatPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userSession, setUserSession] = useState<UserSession | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch session info
        const sessionRes = await fetch('/api/auth/session')
        const sessionData = await sessionRes.json()

        if (!sessionData?.user?.id) {
          router.push('/login')
          return
        }

        setUserSession({
          id: sessionData.user.id,
          role: sessionData.user.role,
        })

        // Fetch submissions
        const submissionsRes = await fetch('/api/communal-seat')
        if (!submissionsRes.ok) {
          throw new Error('Failed to fetch submissions')
        }

        const data: ApiResponse = await submissionsRes.json()
        setSubmissions(data.data)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const isAdmin = userSession ? ADMIN_ROLES.includes(userSession.role) : false

  // Get categories that user has already applied to (with pending/under_review status)
  const appliedCategories = submissions
    .filter((s) => s.status === 'PENDING' || s.status === 'UNDER_REVIEW')
    .map((s) => s.category)

  // Get categories user can still apply to
  const availableCategories = ALL_CATEGORIES.filter((cat) => !appliedCategories.includes(cat))

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageHeader path="communal-seat" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageHeader path="communal-seat" />
        <div className="text-center py-12 bg-white rounded-lg border border-red-200">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-forest-900 mb-2">Error Loading Submissions</h3>
          <p className="text-forest-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader path="communal-seat" />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-forest-900">Your Submissions</h2>
        <div className="flex gap-3">
          {isAdmin && (
            <Link
              href="/dashboard/communal-seat/submissions"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-forest-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Review Submissions
            </Link>
          )}
          {availableCategories.length > 0 && (
            <Link
              href="/dashboard/communal-seat/apply"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600"
            >
              <Plus className="h-4 w-4" />
              New Submission
            </Link>
          )}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-forest-900 mb-2">No Submissions Yet</h3>
          <p className="text-forest-600 mb-6 max-w-md mx-auto">
            Submit your service offerings to become part of the Ministerial Marketplace and
            contribute to our community.
          </p>
          <Link
            href="/dashboard/communal-seat/apply"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600"
          >
            <Plus className="h-4 w-4" />
            Create Your First Submission
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const appData = submission.applicationData as Record<string, unknown>
            return (
              <div key={submission.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-medium',
                        COMMUNAL_SEAT_CATEGORY_COLORS[submission.category] ||
                          'bg-gray-100 text-gray-800'
                      )}
                    >
                      {COMMUNAL_SEAT_CATEGORY_LABELS[submission.category] || submission.category}
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-medium',
                        COMMUNAL_SEAT_STATUS_COLORS[submission.status] ||
                          'bg-gray-100 text-gray-800'
                      )}
                    >
                      {COMMUNAL_SEAT_STATUS_LABELS[submission.status] || submission.status}
                    </span>
                  </div>
                  <span className="text-sm text-forest-500">
                    Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                {typeof appData.serviceDescription === 'string' && appData.serviceDescription && (
                  <p className="text-forest-600 text-sm mb-3 line-clamp-2">
                    {appData.serviceDescription}
                  </p>
                )}

                {submission.status === 'REJECTED' && submission.reviewNotes && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">
                      <strong>Review Notes:</strong> {submission.reviewNotes}
                    </p>
                  </div>
                )}

                {submission.status === 'APPROVED' && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      Your submission has been approved! You are now part of the{' '}
                      {COMMUNAL_SEAT_CATEGORY_LABELS[submission.category] || submission.category}{' '}
                      committee.
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {availableCategories.length > 0 && (
            <div className="mt-6 p-4 bg-gold-50 rounded-lg border border-gold-200">
              <p className="text-sm text-forest-700 mb-2">
                <strong>Apply to more categories:</strong> You can still apply to{' '}
                {availableCategories.map((cat, i) => (
                  <span key={cat}>
                    {i > 0 && (i === availableCategories.length - 1 ? ' and ' : ', ')}
                    {COMMUNAL_SEAT_CATEGORY_LABELS[cat] || cat}
                  </span>
                ))}
              </p>
              <Link
                href="/dashboard/communal-seat/apply"
                className="inline-flex items-center gap-2 text-sm text-gold-700 hover:text-gold-800 font-medium"
              >
                <Plus className="h-4 w-4" />
                Submit another application
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
