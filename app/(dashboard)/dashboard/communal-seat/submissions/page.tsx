'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { SubmissionsReviewClient } from './SubmissionsReviewClient'

interface ApiSubmission {
  id: string
  userId: string
  category: string
  status: string
  applicationData: Record<string, unknown>
  reviewerId: string | null
  reviewNotes: string | null
  reviewedAt: string | null
  submittedAt: string
  updatedAt: string
  user?: {
    id: string
    name: string | null
    email: string
  }
}

interface ApiResponse {
  data: ApiSubmission[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Transform API submission to match SubmissionsReviewClient expected interface
function transformSubmission(apiSubmission: ApiSubmission) {
  const appData = apiSubmission.applicationData as Record<string, unknown>

  return {
    id: apiSubmission.id,
    fullName: String(appData.fullName || appData.name || apiSubmission.user?.name || 'Unknown'),
    email: String(appData.email || apiSubmission.user?.email || ''),
    phone: String(appData.phone || ''),
    serviceDescription: String(appData.serviceDescription || appData.description || ''),
    yearsExperience: Number(appData.yearsExperience || appData.experience || 0),
    certifications: appData.certifications ? String(appData.certifications) : null,
    websiteLink:
      appData.websiteLink || appData.website
        ? String(appData.websiteLink || appData.website)
        : null,
    motivation: String(appData.motivation || ''),
    documentUrl: String(appData.documentUrl || ''),
    documentFileName: String(appData.documentFileName || 'Document'),
    categories: [apiSubmission.category],
    status: apiSubmission.status,
    reviewNotes: apiSubmission.reviewNotes,
    createdAt: apiSubmission.submittedAt,
    reviewedAt: apiSubmission.reviewedAt,
    submittedBy: {
      id: apiSubmission.userId,
      name: apiSubmission.user?.name || 'Unknown',
      email: apiSubmission.user?.email || '',
    },
    reviewedBy: apiSubmission.reviewerId
      ? { id: apiSubmission.reviewerId, name: 'Reviewer' }
      : null,
  }
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

export default function SubmissionsReviewPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<ReturnType<typeof transformSubmission>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        // Check admin access
        const isAdmin = ADMIN_ROLES.includes(sessionData.user.role)
        if (!isAdmin) {
          router.push('/dashboard/communal-seat')
          return
        }

        // Fetch all submissions (admin sees all)
        const submissionsRes = await fetch('/api/communal-seat?limit=100')
        if (!submissionsRes.ok) {
          throw new Error('Failed to fetch submissions')
        }

        const data: ApiResponse = await submissionsRes.json()
        const transformed = data.data.map(transformSubmission)
        setSubmissions(transformed)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link
            href="/dashboard/communal-seat"
            className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Communal Seat
          </Link>
          <PageHeader path="communal-seat/submissions" />
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link
            href="/dashboard/communal-seat"
            className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Communal Seat
          </Link>
          <PageHeader path="communal-seat/submissions" />
        </div>
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
      <div className="mb-6">
        <Link
          href="/dashboard/communal-seat"
          className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 text-sm mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Communal Seat
        </Link>
        <PageHeader path="communal-seat/submissions" />
      </div>

      <SubmissionsReviewClient submissions={submissions} />
    </div>
  )
}
