import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateDocumentSchema } from '@/lib/validations/committee'

// Get a specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; documentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, documentId } = await params

    // Check if user is a member
    const membership = await prisma.committeeMember.findUnique({
      where: {
        userId_committeeId: {
          userId: session.user.id,
          committeeId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this committee' }, { status: 403 })
    }

    const document = await prisma.committeeDocument.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!document || document.committeeId !== committeeId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

// Update a document
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; documentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, documentId } = await params

    const document = await prisma.committeeDocument.findUnique({
      where: { id: documentId }
    })

    if (!document || document.committeeId !== committeeId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Only uploader or admin can update
    const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']
    const isAdmin = adminRoles.includes(session.user.role)

    if (document.uploadedById !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateDocumentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.committeeDocument.update({
      where: { id: documentId },
      data: parsed.data,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

// Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; documentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, documentId } = await params

    const document = await prisma.committeeDocument.findUnique({
      where: { id: documentId }
    })

    if (!document || document.committeeId !== committeeId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Only uploader or admin can delete
    const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']
    const isAdmin = adminRoles.includes(session.user.role)

    if (document.uploadedById !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.committeeDocument.delete({
      where: { id: documentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
