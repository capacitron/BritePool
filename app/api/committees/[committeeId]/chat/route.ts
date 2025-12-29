import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createChatMessageSchema } from '@/lib/validations/committee'

// Get chat messages for a committee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'GENERAL'
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // cursor for pagination

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

    // Get or create the chat for this category
    let chat = await prisma.committeeChat.findUnique({
      where: {
        committeeId_category: {
          committeeId,
          category: category as any
        }
      }
    })

    if (!chat) {
      chat = await prisma.committeeChat.create({
        data: {
          committeeId,
          category: category as any
        }
      })
    }

    // Get messages
    const messages = await prisma.committeeChatMessage.findMany({
      where: {
        chatId: chat.id,
        isDeleted: false,
        ...(before ? { createdAt: { lt: new Date(before) } } : {})
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({
      chatId: chat.id,
      category: chat.category,
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}

// Post a new chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params

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

    const body = await request.json()
    const parsed = createChatMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { content, category, attachmentUrl, attachmentName } = parsed.data

    // Get or create the chat for this category
    let chat = await prisma.committeeChat.findUnique({
      where: {
        committeeId_category: {
          committeeId,
          category: category as any
        }
      }
    })

    if (!chat) {
      chat = await prisma.committeeChat.create({
        data: {
          committeeId,
          category: category as any
        }
      })
    }

    // Create the message
    const message = await prisma.committeeChatMessage.create({
      data: {
        chatId: chat.id,
        authorId: session.user.id,
        content,
        attachmentUrl,
        attachmentName
      },
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

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating chat message:', error)
    return NextResponse.json(
      { error: 'Failed to create chat message' },
      { status: 500 }
    )
  }
}
