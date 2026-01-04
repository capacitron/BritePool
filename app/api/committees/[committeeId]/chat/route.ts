import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  category: z.string().default('general'),
})

// Get chat messages for a committee
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
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'general'

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
      return NextResponse.json(
        { error: 'You must be a member of this committee to view chat' },
        { status: 403 }
      )
    }

    // Upsert chat - create if doesn't exist
    const chat = await prisma.committeeChat.upsert({
      where: {
        committeeId_category: {
          committeeId,
          category,
        },
      },
      create: {
        committeeId,
        category,
      },
      update: {},
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100, // Limit messages returned
        },
      },
    })

    // Fetch author info for messages
    const authorIds = [...new Set(chat.messages.map((m) => m.authorId))]
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, email: true },
    })

    const authorMap = new Map(authors.map((a) => [a.id, a]))

    const messagesWithAuthors = chat.messages.map((message) => ({
      ...message,
      author: authorMap.get(message.authorId) || null,
    }))

    return NextResponse.json({
      chatId: chat.id,
      category: chat.category,
      messages: messagesWithAuthors,
    })
  } catch (error) {
    logError(error, { action: 'fetch_committee_chat' })
    return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 })
  }
}

// Post a new chat message
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
      return NextResponse.json(
        { error: 'You must be a member of this committee to post messages' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { content, category } = parsed.data

    // Upsert chat - create if doesn't exist
    const chat = await prisma.committeeChat.upsert({
      where: {
        committeeId_category: {
          committeeId,
          category,
        },
      },
      create: {
        committeeId,
        category,
      },
      update: {},
    })

    // Create the message
    const message = await prisma.committeeChatMessage.create({
      data: {
        chatId: chat.id,
        authorId: session.user.id,
        content,
      },
    })

    // Fetch author info
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json(
      {
        ...message,
        author,
      },
      { status: 201 }
    )
  } catch (error) {
    logError(error, { action: 'create_chat_message' })
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
