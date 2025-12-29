import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateChatMessageSchema } from '@/lib/validations/committee'

// Update a chat message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; messageId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, messageId } = await params

    // Get the message
    const message = await prisma.committeeChatMessage.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          select: { committeeId: true }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.chat.committeeId !== committeeId) {
      return NextResponse.json({ error: 'Message does not belong to this committee' }, { status: 400 })
    }

    // Only author can edit
    if (message.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateChatMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.committeeChatMessage.update({
      where: { id: messageId },
      data: { content: parsed.data.content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating chat message:', error)
    return NextResponse.json(
      { error: 'Failed to update chat message' },
      { status: 500 }
    )
  }
}

// Delete a chat message (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; messageId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, messageId } = await params

    // Get the message
    const message = await prisma.committeeChatMessage.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          select: { committeeId: true }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.chat.committeeId !== committeeId) {
      return NextResponse.json({ error: 'Message does not belong to this committee' }, { status: 400 })
    }

    // Only author or admin can delete
    const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR']
    const isAdmin = adminRoles.includes(session.user.role)

    if (message.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.committeeChatMessage.update({
      where: { id: messageId },
      data: { isDeleted: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat message:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat message' },
      { status: 500 }
    )
  }
}
