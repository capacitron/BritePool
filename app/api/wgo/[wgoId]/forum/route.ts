import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1).max(10000),
  isPinned: z.boolean().optional().default(false),
})

const updatePostSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(10000).optional(),
  isPinned: z.boolean().optional(),
})

const deletePostSchema = z.object({
  postId: z.string().min(1),
})

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  pinnedOnly: z.coerce.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-forum', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wgoId } = await params

    // Check if WGO exists
    const wgo = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId },
      include: {
        involvements: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!wgo) {
      return NextResponse.json({ error: 'Wealth opportunity not found' }, { status: 404 })
    }

    // Check if user is involved or is admin
    const isInvolved = wgo.involvements.length > 0
    const isAdmin = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(session.user.role)

    if (!isInvolved && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You must be involved in this WGO to view forum posts' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      pinnedOnly: searchParams.get('pinnedOnly') || undefined,
    }

    const parsed = querySchema.safeParse(queryParams)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { page, limit, pinnedOnly } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { wgoId }
    if (pinnedOnly) {
      where.isPinned = true
    }

    const [posts, total] = await Promise.all([
      prisma.wGOForumPost.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.wGOForumPost.count({ where }),
    ])

    // Fetch author info separately to avoid N+1
    const authorIds = [...new Set(posts.map((post) => post.authorId))]
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, role: true },
    })
    const authorMap = new Map(authors.map((a) => [a.id, a]))

    const postsWithAuthors = posts.map((post) => ({
      ...post,
      author: authorMap.get(post.authorId) || null,
      isAuthor: post.authorId === session.user.id,
    }))

    return NextResponse.json({
      data: postsWithAuthors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logError(error, { action: 'fetch_wgo_forum_posts' })
    return NextResponse.json({ error: 'Failed to fetch forum posts' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-forum', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wgoId } = await params

    // Check if WGO exists and user is involved
    const wgo = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId },
      include: {
        involvements: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!wgo) {
      return NextResponse.json({ error: 'Wealth opportunity not found' }, { status: 404 })
    }

    const userInvolvement = wgo.involvements[0]
    const isAdmin = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(session.user.role)

    if (!userInvolvement && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You must be involved in this WGO to post' },
        { status: 403 }
      )
    }

    // Observers cannot post
    if (userInvolvement?.role === 'OBSERVER' && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Observers cannot create posts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createPostSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { content, isPinned } = parsed.data

    // Only leaders, coordinators, and admins can pin posts
    const canPin =
      isAdmin || userInvolvement?.role === 'LEADER' || userInvolvement?.role === 'COORDINATOR'
    const finalIsPinned = canPin ? isPinned : false

    const post = await prisma.wGOForumPost.create({
      data: {
        wgoId,
        authorId: session.user.id,
        content,
        isPinned: finalIsPinned,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    logError(error, { action: 'create_wgo_forum_post' })
    return NextResponse.json({ error: 'Failed to create forum post' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-forum', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wgoId } = await params

    const body = await request.json()
    const parsed = updatePostSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { postId, content, isPinned } = parsed.data

    // Get the post and WGO with user involvement
    const post = await prisma.wGOForumPost.findUnique({
      where: { id: postId, wgoId },
      include: {
        wgo: {
          include: {
            involvements: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const userInvolvement = post.wgo.involvements[0]
    const isAuthor = post.authorId === session.user.id
    const isLeaderOrCoordinator =
      userInvolvement?.role === 'LEADER' || userInvolvement?.role === 'COORDINATOR'
    const isAdmin = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(session.user.role)

    // Check edit permissions
    if (!isAuthor && !isLeaderOrCoordinator && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to edit this post' },
        { status: 403 }
      )
    }

    // Only leaders, coordinators, and admins can change pin status
    const canPin = isAdmin || isLeaderOrCoordinator

    const updateData: Record<string, unknown> = {}
    if (content !== undefined) updateData.content = content
    if (isPinned !== undefined && canPin) updateData.isPinned = isPinned

    const updatedPost = await prisma.wGOForumPost.update({
      where: { id: postId },
      data: updateData,
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    logError(error, { action: 'update_wgo_forum_post' })
    return NextResponse.json({ error: 'Failed to update forum post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'wgo-forum', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wgoId } = await params

    const body = await request.json()
    const parsed = deletePostSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { postId } = parsed.data

    // Get the post and WGO with user involvement
    const post = await prisma.wGOForumPost.findUnique({
      where: { id: postId, wgoId },
      include: {
        wgo: {
          include: {
            involvements: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const userInvolvement = post.wgo.involvements[0]
    const isAuthor = post.authorId === session.user.id
    const isLeaderOrCoordinator =
      userInvolvement?.role === 'LEADER' || userInvolvement?.role === 'COORDINATOR'
    const isAdmin = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(session.user.role)

    // Check delete permissions
    if (!isAuthor && !isLeaderOrCoordinator && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this post' },
        { status: 403 }
      )
    }

    await prisma.wGOForumPost.delete({
      where: { id: postId },
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    logError(error, { action: 'delete_wgo_forum_post' })
    return NextResponse.json({ error: 'Failed to delete forum post' }, { status: 500 })
  }
}
