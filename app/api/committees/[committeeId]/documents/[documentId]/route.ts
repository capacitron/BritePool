import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { z } from 'zod'

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  isPublic: z.boolean().optional(),
  version: z.string().max(20).optional(),
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

// GET: Get a specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; documentId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, documentId } = await params

    // Fetch the document
    const document = await prisma.committeeDocument.findFirst({
      where: {
        id: documentId,
        committeeId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check access: member/admin can view all, non-members only public
    const isMember = await isCommitteeMember(session.user.id, committeeId)
    const userIsAdmin = isAdmin(session.user.role)

    if (!isMember && !userIsAdmin && !document.isPublic) {
      return NextResponse.json(
        { error: 'You do not have access to this document' },
        { status: 403 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    logError(error, { action: 'fetch_committee_document' })
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

// PATCH: Update a document (uploader or admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; documentId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, documentId } = await params

    // Fetch the document
    const document = await prisma.committeeDocument.findFirst({
      where: {
        id: documentId,
        committeeId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check permission: only uploader or admin can update
    const userIsAdmin = isAdmin(session.user.role)
    const isUploader = document.uploaderId === session.user.id

    if (!isUploader && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Only the uploader or an admin can update this document' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateDocumentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: {
      title?: string
      description?: string | null
      isPublic?: boolean
      version?: string
    } = {}

    if (parsed.data.title !== undefined) {
      updateData.title = parsed.data.title
    }
    if (parsed.data.description !== undefined) {
      updateData.description = parsed.data.description
    }
    if (parsed.data.isPublic !== undefined) {
      updateData.isPublic = parsed.data.isPublic
    }
    if (parsed.data.version !== undefined) {
      updateData.version = parsed.data.version
    }

    const updatedDocument = await prisma.committeeDocument.update({
      where: { id: documentId },
      data: updateData,
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    logError(error, { action: 'update_committee_document' })
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

// DELETE: Delete a document (uploader or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; documentId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, documentId } = await params

    // Fetch the document
    const document = await prisma.committeeDocument.findFirst({
      where: {
        id: documentId,
        committeeId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check permission: only uploader or admin can delete
    const userIsAdmin = isAdmin(session.user.role)
    const isUploader = document.uploaderId === session.user.id

    if (!isUploader && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Only the uploader or an admin can delete this document' },
        { status: 403 }
      )
    }

    await prisma.committeeDocument.delete({
      where: { id: documentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error, { action: 'delete_committee_document' })
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
