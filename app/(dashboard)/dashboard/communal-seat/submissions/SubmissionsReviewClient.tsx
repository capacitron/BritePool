'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  COMMUNAL_SEAT_CATEGORY_LABELS,
  COMMUNAL_SEAT_CATEGORY_COLORS,
  COMMUNAL_SEAT_STATUS_LABELS,
  COMMUNAL_SEAT_STATUS_COLORS,
} from '@/lib/communal-seat/categories'
import {
  FileText,
  ExternalLink,
  Check,
  X,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  Globe,
  MessageSquare
} from 'lucide-react'

interface Submission {
  id: string
  fullName: string
  email: string
  phone: string
  serviceDescription: string
  yearsExperience: number
  certifications: string | null
  websiteLink: string | null
  motivation: string
  documentUrl: string
  documentFileName: string
  categories: string[]
  status: string
  reviewNotes: string | null
  createdAt: string
  reviewedAt: string | null
  submittedBy: { id: string; name: string; email: string }
  reviewedBy: { id: string; name: string } | null
}

interface SubmissionsReviewClientProps {
  submissions: Submission[]
}

export function SubmissionsReviewClient({ submissions }: SubmissionsReviewClientProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filteredSubmissions = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter)

  const pendingCount = submissions.filter(s => s.status === 'PENDING').length

  const handleReview = async (submissionId: string, status: 'APPROVED' | 'REJECTED') => {
    setLoading(submissionId)
    try {
      const response = await fetch(`/api/communal-seat/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes: reviewNotes || undefined }),
      })

      if (!response.ok) {
        throw new Error('Failed to review submission')
      }

      setSelectedSubmission(null)
      setReviewNotes('')
      router.refresh()
    } catch (error) {
      console.error('Error reviewing submission:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-4">
        {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              filter === status
                ? 'bg-gold-500 text-white'
                : 'bg-gray-100 text-forest-600 hover:bg-gray-200'
            )}
          >
            {status === 'all' ? 'All' : COMMUNAL_SEAT_STATUS_LABELS[status]}
            {status === 'PENDING' && pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-forest-900 mb-2">No Submissions Found</h3>
          <p className="text-forest-600">
            {filter === 'PENDING'
              ? 'No pending submissions to review.'
              : 'No submissions match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className={cn(
                'bg-white rounded-lg border p-6 transition-all',
                selectedSubmission?.id === submission.id
                  ? 'border-gold-500 ring-2 ring-gold-200'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-forest-900">{submission.fullName}</h3>
                    <span className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-medium',
                      COMMUNAL_SEAT_STATUS_COLORS[submission.status]
                    )}>
                      {COMMUNAL_SEAT_STATUS_LABELS[submission.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-forest-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {submission.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {submission.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {submission.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubmission(
                      selectedSubmission?.id === submission.id ? null : submission
                    )}
                  >
                    {selectedSubmission?.id === submission.id ? 'Close' : 'Review'}
                  </Button>
                )}
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {submission.categories.map((category) => (
                  <span
                    key={category}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      COMMUNAL_SEAT_CATEGORY_COLORS[category]
                    )}
                  >
                    {COMMUNAL_SEAT_CATEGORY_LABELS[category]}
                  </span>
                ))}
              </div>

              {/* Expanded Details */}
              {selectedSubmission?.id === submission.id && (
                <div className="border-t pt-4 mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-forest-900 mb-2">Service Description</h4>
                    <p className="text-forest-600 text-sm">{submission.serviceDescription}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-forest-400" />
                      <span className="text-forest-600">
                        <strong>{submission.yearsExperience}</strong> years of experience
                      </span>
                    </div>
                    {submission.certifications && (
                      <div className="flex items-start gap-2 text-sm">
                        <Award className="h-4 w-4 text-forest-400 mt-0.5" />
                        <span className="text-forest-600">{submission.certifications}</span>
                      </div>
                    )}
                    {submission.websiteLink && (
                      <a
                        href={submission.websiteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gold-600 hover:text-gold-700"
                      >
                        <Globe className="h-4 w-4" />
                        View Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <a
                      href={submission.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gold-600 hover:text-gold-700"
                    >
                      <FileText className="h-4 w-4" />
                      {submission.documentFileName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div>
                    <h4 className="font-medium text-forest-900 mb-2">Motivation</h4>
                    <p className="text-forest-600 text-sm">{submission.motivation}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-forest-900 mb-2">Member Account</h4>
                    <div className="flex items-center gap-2 text-sm text-forest-600">
                      <User className="h-4 w-4" />
                      {submission.submittedBy.name} ({submission.submittedBy.email})
                    </div>
                  </div>

                  {/* Review Form */}
                  <div className="border-t pt-4 mt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-forest-700 mb-1">
                        Review Notes (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add notes about your decision..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleReview(submission.id, 'APPROVED')}
                        disabled={loading === submission.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {loading === submission.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleReview(submission.id, 'REJECTED')}
                        disabled={loading === submission.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        {loading === submission.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Review info for already reviewed */}
              {submission.status !== 'PENDING' && submission.reviewedBy && (
                <div className="border-t pt-4 mt-4 text-sm text-forest-500">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Reviewed by {submission.reviewedBy.name} on {new Date(submission.reviewedAt!).toLocaleDateString()}
                  </div>
                  {submission.reviewNotes && (
                    <p className="mt-2 text-forest-600 italic">&ldquo;{submission.reviewNotes}&rdquo;</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
