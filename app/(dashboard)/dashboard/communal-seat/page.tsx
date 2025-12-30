import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/PageHeader'
import {
  COMMUNAL_SEAT_CATEGORY_LABELS,
  COMMUNAL_SEAT_CATEGORY_COLORS,
  COMMUNAL_SEAT_STATUS_LABELS,
  COMMUNAL_SEAT_STATUS_COLORS,
} from '@/lib/communal-seat/categories'
import { cn } from '@/lib/utils'
import { Plus, FileText, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react'

export default async function CommunalSeatPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get user's submissions
  const submissions = await prisma.communalSeatSubmission.findMany({
    where: { submittedById: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']
  const isAdmin = ADMIN_ROLES.includes(session.user.role)
  const hasAdminAccess = session.user.membershipLevel === 2

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader path="communal-seat" />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-forest-900">Your Submissions</h2>
        <div className="flex gap-3">
          {(isAdmin || hasAdminAccess) && (
            <Link
              href="/dashboard/communal-seat/submissions"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-forest-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Review Submissions
            </Link>
          )}
          <Link
            href="/dashboard/communal-seat/apply"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600"
          >
            <Plus className="h-4 w-4" />
            New Submission
          </Link>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-forest-900 mb-2">No Submissions Yet</h3>
          <p className="text-forest-600 mb-6 max-w-md mx-auto">
            Submit your service offerings to become part of the Ministerial Marketplace and contribute to our community.
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
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-forest-900">{submission.fullName}</h3>
                    <span className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-medium',
                      COMMUNAL_SEAT_STATUS_COLORS[submission.status]
                    )}>
                      {COMMUNAL_SEAT_STATUS_LABELS[submission.status]}
                    </span>
                  </div>
                  <p className="text-sm text-forest-600 line-clamp-2">{submission.serviceDescription}</p>
                </div>
                <div className="flex items-center gap-2 text-forest-400">
                  {submission.status === 'PENDING' && <Clock className="h-5 w-5" />}
                  {submission.status === 'APPROVED' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {submission.status === 'REJECTED' && <XCircle className="h-5 w-5 text-red-500" />}
                </div>
              </div>

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

              <div className="flex items-center justify-between text-sm text-forest-500 pt-4 border-t">
                <span>Submitted {new Date(submission.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-4">
                  {submission.documentUrl && (
                    <a
                      href={submission.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gold-600 hover:text-gold-700"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {submission.status === 'REJECTED' && submission.reviewNotes && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Review Notes:</span> {submission.reviewNotes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
