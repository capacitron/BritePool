import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/PageHeader'
import { SubmissionsReviewClient } from './SubmissionsReviewClient'
import { ArrowLeft } from 'lucide-react'

export default async function SubmissionsReviewPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Check admin access
  const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']
  const isAdmin = ADMIN_ROLES.includes(session.user.role)
  const hasAdminAccess = session.user.membershipLevel === 2

  if (!isAdmin && !hasAdminAccess) {
    redirect('/dashboard/communal-seat')
  }

  // Get all pending submissions
  const submissions = await prisma.communalSeatSubmission.findMany({
    include: {
      submittedBy: {
        select: { id: true, name: true, email: true }
      },
      reviewedBy: {
        select: { id: true, name: true }
      }
    },
    orderBy: [
      { status: 'asc' }, // PENDING first
      { createdAt: 'desc' }
    ],
  })

  const formattedSubmissions = submissions.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    reviewedAt: s.reviewedAt?.toISOString() || null,
  }))

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

      <SubmissionsReviewClient submissions={formattedSubmissions} />
    </div>
  )
}
