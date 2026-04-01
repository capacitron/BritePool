import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canManageCommittees } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { z } from 'zod'

const updateMessageSchema = z.object({
  content: z.string().min(1).max(5000),
})

// Update a chat message (author only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; messageId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, messageId } = await params

    // Verify committee exists
    const committee = await prisma.committee.findUnique({
      where: { id: committeeId },
    })

    if (!committee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 })
    }

    // Check if user is a member of the committee
    const membership = await prisma.committeeMember.findUnique({
      where: {
        userId_committeeId: {
          userId: session.user.id,
          committeeId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member of this committee' }, { status: 403 })
    }

    // Find the message
    const message = await prisma.committeeChatMessage.findUnique({
      where: { id: messageId },
      include: {
        chat: true,
      },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify message belongs to this committee's chat
    if (message.chat.committeeId !== committeeId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Only the author can update their own message
    if (message.authorId !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { content } = parsed.data

    // Update the message
    const updatedMessage = await prisma.committeeChatMessage.update({
      where: { id: messageId },
      data: { content },
    })

    // Fetch author info
    const author = await prisma.user.findUnique({
      where: { id: updatedMessage.authorId },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({
      ...updatedMessage,
      author,
    })
  } catch (error) {
    logError(error, { action: 'update_chat_message' })
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}

// Delete a chat message (author or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string; messageId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId, messageId } = await params

    // Verify committee exists
    const committee = await prisma.committee.findUnique({
      where: { id: committeeId },
    })

    if (!committee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 })
    }

    // Check if user is a member of the committee
    const membership = await prisma.committeeMember.findUnique({
      where: {
        userId_committeeId: {
          userId: session.user.id,
          committeeId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member of this committee' }, { status: 403 })
    }

    // Find the message
    const message = await prisma.committeeChatMessage.findUnique({
      where: { id: messageId },
      include: {
        chat: true,
      },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify message belongs to this committee's chat
    if (message.chat.committeeId !== committeeId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if user can delete the message
    const isAuthor = message.authorId === session.user.id
    const isUserAdmin = canManageCommittees(session.user.role)
    const isCommitteeLeader = membership.role === 'LEADER'

    if (!isAuthor && !isUserAdmin && !isCommitteeLeader) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 })
    }

    // Delete the message
    await prisma.committeeChatMessage.delete({
      where: { id: messageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error, { action: 'delete_chat_message' })
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
