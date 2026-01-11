import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const createSubmissionSchema = z.object({
  category: z.enum(['GOVERNANCE', 'WEALTH', 'EDUCATION', 'HEALTH', 'OPERATIONS']),
  applicationData: z
    .record(z.string(), z.unknown())
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Application data cannot be empty',
    }),
})

const queryParamsSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN']).optional(),
  category: z.enum(['GOVERNANCE', 'WEALTH', 'EDUCATION', 'HEALTH', 'OPERATIONS']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// GET - List submissions (user sees own, admin sees all)
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute (strict for submissions)
    const rateLimitResult = await rateLimit(request, 'communal-seat', RateLimitConfigs.submissions)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const queryResult = queryParamsSchema.safeParse({
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      )
    }

    const { status, category, page, limit } = queryResult.data
    const skip = (page - 1) * limit

    // Check if user is admin (WEB_STEWARD or BOARD_CHAIR)
    const userIsAdmin = isAdmin(session.user.role)

    // Build where clause
    const where: Record<string, unknown> = {}

    // Non-admin users can only see their own submissions
    if (!userIsAdmin) {
      where.userId = session.user.id
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    // Get total count for pagination
    const total = await prisma.communalSeatSubmission.count({ where })

    // Get submissions with pagination
    const submissions = await prisma.communalSeatSubmission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: 'desc' },
    })

    // If admin, fetch user details separately
    let submissionsWithUser = submissions
    if (userIsAdmin && submissions.length > 0) {
      const userIds = [...new Set(submissions.map((s) => s.userId))]
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
      const userMap = new Map(users.map((u) => [u.id, u]))

      submissionsWithUser = submissions.map((submission) => ({
        ...submission,
        user: userMap.get(submission.userId) || null,
      }))
    }

    return NextResponse.json({
      data: submissionsWithUser,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logError(error, { action: 'fetch_communal_seat_submissions' })
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

// POST - Create new submission
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute (strict for submissions)
    const rateLimitResult = await rateLimit(request, 'communal-seat', RateLimitConfigs.submissions)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createSubmissionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { category, applicationData } = parsed.data

    // Check if user already has a pending or under review submission for this category
    const existingSubmission = await prisma.communalSeatSubmission.findFirst({
      where: {
        userId: session.user.id,
        category,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    })

    if (existingSubmission) {
      return NextResponse.json(
        { error: `You already have a pending submission for the ${category} category` },
        { status: 409 }
      )
    }

    // Create the submission
    const submission = await prisma.communalSeatSubmission.create({
      data: {
        userId: session.user.id,
        category,
        applicationData: applicationData as Prisma.InputJsonValue,
        status: 'PENDING',
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    logError(error, { action: 'create_communal_seat_submission' })
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
