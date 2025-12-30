import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const COMMUNAL_SEAT_CATEGORIES = [
  'HEALING_SERVICE',
  'ORGANIZATIONAL_SERVICE',
  'CUSTOMER_SERVICE',
  'TECHNOLOGY_PROVISION',
  'CULINARY_SERVICE',
  'UTILITY_SERVICE',
  'OCCUPATIONAL_SERVICES',
  'AGRICULTURAL_SERVICES',
  'ASSOCIATION_SERVICES',
] as const

const createSubmissionSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  serviceDescription: z.string().min(10, 'Service description must be at least 10 characters'),
  yearsExperience: z.number().int().min(0, 'Years of experience must be 0 or greater'),
  certifications: z.string().optional().nullable(),
  websiteLink: z.string().url().optional().nullable().or(z.literal('')),
  motivation: z.string().min(20, 'Please provide a detailed motivation (at least 20 characters)'),
  documentUrl: z.string().url('Valid document URL is required'),
  documentFileName: z.string().min(1, 'Document file name is required'),
  categories: z.array(z.enum(COMMUNAL_SEAT_CATEGORIES)).min(1, 'At least one category is required'),
})

// GET - List submissions (admin sees all, user sees own)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const mySubmissions = searchParams.get('my') === 'true'

    const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR']
    const isAdmin = ADMIN_ROLES.includes(session.user.role)
    const hasAdminAccess = session.user.membershipLevel === 2

    // Build where clause
    const where: Record<string, unknown> = {}

    // If not admin/level 2 or requesting own submissions
    if ((!isAdmin && !hasAdminAccess) || mySubmissions) {
      where.submittedById = session.user.id
    }

    if (status) {
      where.status = status
    }

    const submissions = await prisma.communalSeatSubmission.findMany({
      where,
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        reviewedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

// POST - Create new submission
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSubmissionSchema.parse(body)

    // Clean up optional fields
    const cleanedData = {
      ...validatedData,
      websiteLink: validatedData.websiteLink || null,
      certifications: validatedData.certifications || null,
    }

    const submission = await prisma.communalSeatSubmission.create({
      data: {
        ...cleanedData,
        submittedById: session.user.id,
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
