import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

// Schema for admin review updates
const adminUpdateSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED']),
  reviewNotes: z.string().max(5000).optional(),
})

// Schema for owner withdrawal
const ownerUpdateSchema = z.object({
  status: z.literal('WITHDRAWN'),
})

// GET - Get submission by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    // Rate limit: 10 requests per minute (strict for submissions)
    const rateLimitResult = rateLimit(request, 'communal-seat-detail', RateLimitConfigs.submissions)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await params

    const submission = await prisma.communalSeatSubmission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const userIsAdmin = isAdmin(session.user.role)

    // Non-admin users can only view their own submissions
    if (!userIsAdmin && submission.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If admin, include user details
    if (userIsAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: submission.userId },
        select: { id: true, name: true, email: true },
      })

      let reviewer = null
      if (submission.reviewerId) {
        reviewer = await prisma.user.findUnique({
          where: { id: submission.reviewerId },
          select: { id: true, name: true },
        })
      }

      return NextResponse.json({
        ...submission,
        user,
        reviewer,
      })
    }

    return NextResponse.json(submission)
  } catch (error) {
    logError(error, { action: 'fetch_communal_seat_submission' })
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

// PATCH - Update submission status (admin) or withdraw (owner)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    // Rate limit: 10 requests per minute (strict for submissions)
    const rateLimitResult = rateLimit(request, 'communal-seat-detail', RateLimitConfigs.submissions)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await params

    const submission = await prisma.communalSeatSubmission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const userIsAdmin = isAdmin(session.user.role)
    const isOwner = submission.userId === session.user.id

    // Must be admin or owner
    if (!userIsAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Handle owner withdrawal
    if (isOwner && !userIsAdmin) {
      const parsed = ownerUpdateSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid input. Owners can only withdraw their submissions.' },
          { status: 400 }
        )
      }

      // Can only withdraw if not already processed
      if (submission.status === 'APPROVED' || submission.status === 'REJECTED') {
        return NextResponse.json(
          { error: 'Cannot withdraw a submission that has already been processed' },
          { status: 400 }
        )
      }

      if (submission.status === 'WITHDRAWN') {
        return NextResponse.json({ error: 'Submission is already withdrawn' }, { status: 400 })
      }

      const updated = await prisma.communalSeatSubmission.update({
        where: { id: submissionId },
        data: { status: 'WITHDRAWN' },
      })

      return NextResponse.json(updated)
    }

    // Handle admin review
    if (userIsAdmin) {
      const parsed = adminUpdateSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { status, reviewNotes } = parsed.data

      // Cannot update already processed submissions
      if (submission.status === 'WITHDRAWN') {
        return NextResponse.json({ error: 'Cannot update a withdrawn submission' }, { status: 400 })
      }

      const updateData: Record<string, unknown> = {
        status,
        reviewerId: session.user.id,
        reviewedAt: new Date(),
      }

      if (reviewNotes !== undefined) {
        updateData.reviewNotes = reviewNotes
      }

      const updated = await prisma.communalSeatSubmission.update({
        where: { id: submissionId },
        data: updateData,
      })

      // Include user info in response
      const user = await prisma.user.findUnique({
        where: { id: updated.userId },
        select: { id: true, name: true, email: true },
      })

      return NextResponse.json({
        ...updated,
        user,
      })
    }

    // Should not reach here
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    logError(error, { action: 'update_communal_seat_submission' })
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

// DELETE - Delete submission (owner only if PENDING)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    // Rate limit: 10 requests per minute (strict for submissions)
    const rateLimitResult = rateLimit(request, 'communal-seat-detail', RateLimitConfigs.submissions)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await params

    const submission = await prisma.communalSeatSubmission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Only the owner can delete their submission
    if (submission.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. Only the submission owner can delete it.' },
        { status: 403 }
      )
    }

    // Can only delete PENDING submissions
    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only delete submissions with PENDING status' },
        { status: 400 }
      )
    }

    await prisma.communalSeatSubmission.delete({
      where: { id: submissionId },
    })

    return NextResponse.json({ message: 'Submission deleted successfully' })
  } catch (error) {
    logError(error, { action: 'delete_communal_seat_submission' })
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
