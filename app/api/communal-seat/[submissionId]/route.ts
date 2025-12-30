import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
})

// GET - Get single submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await params

    const submission = await prisma.communalSeatSubmission.findUnique({
      where: { id: submissionId },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        reviewedBy: {
          select: { id: true, name: true }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check access: own submission or admin
    const isAdmin = ADMIN_ROLES.includes(session.user.role)
    const hasAdminAccess = session.user.membershipLevel === 2
    const isOwner = submission.submittedById === session.user.id

    if (!isAdmin && !hasAdminAccess && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

// PATCH - Review submission (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const isAdmin = ADMIN_ROLES.includes(session.user.role)
    const hasAdminAccess = session.user.membershipLevel === 2

    if (!isAdmin && !hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { submissionId } = await params
    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    const submission = await prisma.communalSeatSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json({ error: 'Submission has already been reviewed' }, { status: 400 })
    }

    const updatedSubmission = await prisma.communalSeatSubmission.update({
      where: { id: submissionId },
      data: {
        status: validatedData.status,
        reviewNotes: validatedData.reviewNotes || null,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        reviewedBy: {
          select: { id: true, name: true }
        }
      }
    })

    // Create notification for the submitter
    await prisma.notification.create({
      data: {
        userId: submission.submittedById,
        type: validatedData.status === 'APPROVED' ? 'GENERAL' : 'GENERAL',
        title: validatedData.status === 'APPROVED'
          ? 'Communal Seat Submission Approved'
          : 'Communal Seat Submission Not Approved',
        message: validatedData.status === 'APPROVED'
          ? 'Congratulations! Your communal seat submission has been approved. Welcome to the Ministerial Marketplace.'
          : `Your communal seat submission was not approved.${validatedData.reviewNotes ? ` Reason: ${validatedData.reviewNotes}` : ''}`,
        link: '/dashboard/communal-seat',
      }
    })

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Error reviewing submission:', error)
    return NextResponse.json({ error: 'Failed to review submission' }, { status: 500 })
  }
}

// DELETE - Delete submission (owner only, if pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await params

    const submission = await prisma.communalSeatSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Only owner can delete, and only if pending
    const isAdmin = ADMIN_ROLES.includes(session.user.role)
    const isOwner = submission.submittedById === session.user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (submission.status !== 'PENDING' && !isAdmin) {
      return NextResponse.json({ error: 'Cannot delete reviewed submission' }, { status: 400 })
    }

    await prisma.communalSeatSubmission.delete({
      where: { id: submissionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
