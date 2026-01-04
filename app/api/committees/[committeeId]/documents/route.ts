import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { z } from 'zod'

const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  fileUrl: z.string().url(),
  fileType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
  isPublic: z.boolean().optional().default(false),
})

// Helper to check if user is a committee member
async function isCommitteeMember(userId: string, committeeId: string): Promise<boolean> {
  const membership = await prisma.committeeMember.findUnique({
    where: {
      userId_committeeId: { userId, committeeId },
    },
  })
  return !!membership
}

// Helper to check if user is admin
function isAdmin(role: string): boolean {
  const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR']
  return adminRoles.includes(role)
}

// GET: List documents for a committee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params

    // Check if committee exists
    const committee = await prisma.committee.findUnique({
      where: { id: committeeId },
    })

    if (!committee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 })
    }

    // Check if user is a committee member or admin
    const isMember = await isCommitteeMember(session.user.id, committeeId)
    const userIsAdmin = isAdmin(session.user.role)

    // Build query based on access level
    const whereClause: { committeeId: string; isPublic?: boolean } = { committeeId }

    // Non-members can only see public documents
    if (!isMember && !userIsAdmin) {
      whereClause.isPublic = true
    }

    const documents = await prisma.committeeDocument.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    logError(error, { action: 'fetch_committee_documents' })
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// POST: Upload a new document (committee members only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params

    // Check if committee exists
    const committee = await prisma.committee.findUnique({
      where: { id: committeeId },
    })

    if (!committee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 })
    }

    // Check if user is a committee member or admin
    const isMember = await isCommitteeMember(session.user.id, committeeId)
    const userIsAdmin = isAdmin(session.user.role)

    if (!isMember && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Only committee members can upload documents' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createDocumentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, fileUrl, fileType, fileSize, isPublic } = parsed.data

    const document = await prisma.committeeDocument.create({
      data: {
        committeeId,
        uploaderId: session.user.id,
        title,
        description: description || null,
        fileUrl,
        fileType,
        fileSize,
        isPublic,
        version: '1.0',
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    logError(error, { action: 'create_committee_document' })
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
