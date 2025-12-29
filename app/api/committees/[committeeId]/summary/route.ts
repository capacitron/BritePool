import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Get weekly summaries for a committee
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

    // Get the chat for this category
    const chat = await prisma.committeeChat.findUnique({
      where: {
        committeeId_category: {
          committeeId,
          category: category as any
        }
      }
    })

    if (!chat) {
      return NextResponse.json([])
    }

    // Get summaries
    const summaries = await prisma.committeeChatSummary.findMany({
      where: { chatId: chat.id },
      include: {
        tasks: true
      },
      orderBy: { weekStarting: 'desc' },
      take: 10
    })

    return NextResponse.json(summaries)
  } catch (error) {
    console.error('Error fetching summaries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    )
  }
}

// Generate a new AI summary for the week
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

    // Only leaders and admins can generate summaries
    const adminRoles = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']
    if (!adminRoles.includes(session.user.role)) {
      // Check if user is a committee leader
      const membership = await prisma.committeeMember.findUnique({
        where: {
          userId_committeeId: {
            userId: session.user.id,
            committeeId
          }
        }
      })

      if (!membership || membership.role !== 'LEADER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const category = body.category || 'GENERAL'

    // Calculate week range
    const now = new Date()
    const dayOfWeek = now.getDay()
    const weekStarting = new Date(now)
    weekStarting.setDate(now.getDate() - dayOfWeek - 7) // Last Sunday
    weekStarting.setHours(0, 0, 0, 0)
    const weekEnding = new Date(weekStarting)
    weekEnding.setDate(weekStarting.getDate() + 6)
    weekEnding.setHours(23, 59, 59, 999)

    // Get the chat
    const chat = await prisma.committeeChat.findUnique({
      where: {
        committeeId_category: {
          committeeId,
          category: category as any
        }
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'No chat found for this category' }, { status: 404 })
    }

    // Check if summary already exists
    const existingSummary = await prisma.committeeChatSummary.findUnique({
      where: {
        chatId_weekStarting: {
          chatId: chat.id,
          weekStarting
        }
      }
    })

    if (existingSummary) {
      return NextResponse.json({ error: 'Summary already exists for this week', summary: existingSummary }, { status: 409 })
    }

    // Get messages for the week
    const messages = await prisma.committeeChatMessage.findMany({
      where: {
        chatId: chat.id,
        isDeleted: false,
        createdAt: {
          gte: weekStarting,
          lte: weekEnding
        }
      },
      include: {
        author: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages to summarize for this week' }, { status: 400 })
    }

    // Build conversation text for AI
    const conversationText = messages
      .map(m => `${m.author.name}: ${m.content}`)
      .join('\n')

    // AI-powered summary and task extraction
    // Using a simple pattern-based approach for now
    // In production, this would use an actual AI service
    const summaryText = generateSmartSummary(messages)
    const extractedTasks = extractTasksFromMessages(messages)

    // Create the summary
    const summary = await prisma.committeeChatSummary.create({
      data: {
        chatId: chat.id,
        weekStarting,
        weekEnding,
        summary: summaryText,
        tasks: {
          create: extractedTasks.map(task => ({
            taskTitle: task.title,
            taskDescription: task.description,
            assignedToName: task.assignee,
            dueDate: task.dueDate,
            status: 'PENDING'
          }))
        }
      },
      include: {
        tasks: true
      }
    })

    return NextResponse.json(summary, { status: 201 })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}

// Helper function to generate a smart summary
function generateSmartSummary(messages: any[]): string {
  const uniqueAuthors = new Set(messages.map(m => m.author.name))
  const totalMessages = messages.length

  // Find key topics by looking for common patterns
  const topics: string[] = []
  const keyPhrases = ['discussed', 'decided', 'agreed', 'planning', 'working on', 'completed', 'need to', 'will', 'should']

  messages.forEach(m => {
    const content = m.content.toLowerCase()
    keyPhrases.forEach(phrase => {
      if (content.includes(phrase)) {
        const sentenceStart = content.indexOf(phrase)
        const sentenceEnd = content.indexOf('.', sentenceStart)
        if (sentenceEnd > sentenceStart) {
          topics.push(m.content.substring(sentenceStart, sentenceEnd + 1))
        }
      }
    })
  })

  const uniqueTopics = [...new Set(topics)].slice(0, 5)

  let summary = `Weekly Discussion Summary\n\n`
  summary += `Participation: ${uniqueAuthors.size} members contributed ${totalMessages} messages.\n\n`

  if (uniqueTopics.length > 0) {
    summary += `Key Points Discussed:\n`
    uniqueTopics.forEach((topic, i) => {
      summary += `${i + 1}. ${topic}\n`
    })
  } else {
    summary += `The committee engaged in active discussion throughout the week.`
  }

  return summary
}

// Helper function to extract tasks from messages
function extractTasksFromMessages(messages: any[]): Array<{
  title: string
  description?: string
  assignee?: string
  dueDate?: Date
}> {
  const tasks: Array<{ title: string; description?: string; assignee?: string; dueDate?: Date }> = []

  // Patterns that indicate action items
  const actionPatterns = [
    /need to\s+(.+?)(?:\.|$)/gi,
    /will\s+(.+?)(?:\.|$)/gi,
    /should\s+(.+?)(?:\.|$)/gi,
    /action item[:\s]+(.+?)(?:\.|$)/gi,
    /todo[:\s]+(.+?)(?:\.|$)/gi,
    /task[:\s]+(.+?)(?:\.|$)/gi,
    /@(\w+)\s+(?:please|can you|could you)\s+(.+?)(?:\.|$)/gi,
  ]

  messages.forEach(m => {
    const content = m.content

    actionPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10 && match[1].length < 200) {
          const existingTask = tasks.find(t => t.title.toLowerCase() === match[1].toLowerCase().trim())
          if (!existingTask) {
            tasks.push({
              title: match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1),
              assignee: match[2] ? match[0].match(/@(\w+)/)?.[1] : undefined
            })
          }
        }
      }
    })
  })

  return tasks.slice(0, 10) // Limit to 10 tasks
}
