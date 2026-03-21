import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  requireAuth,
  successResponse,
  notFoundError,
  forbiddenError,
  internalError,
  logError,
  validateBody,
  HttpStatus,
} from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { isAdmin } from '@/lib/auth/roles'
import { sanitizeHtml, sanitizeTitle } from '@/lib/sanitize'

const replySchema = z.object({
  content: z.string().min(1).max(10000),
})

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = await rateLimit(request, 'forums', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const { auth, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const userIsAdmin = isAdmin(auth.user.role)

    const post = await prisma.forumPost.findFirst({
      where: {
        id,
        deletedAt: null,
        parentId: null,
        ...(userIsAdmin
          ? {}
          : {
              OR: [{ status: 'APPROVED' }, { status: 'PENDING', authorId: auth.user.id }],
            }),
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (!post) {
      return notFoundError('Forum post')
    }

    // Fetch replies
    const replies = await prisma.forumPost.findMany({
      where: {
        parentId: id,
        deletedAt: null,
        ...(userIsAdmin
          ? {}
          : {
              OR: [{ status: 'APPROVED' }, { status: 'PENDING', authorId: auth.user.id }],
            }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    })

    return successResponse({
      id: post.id,
      title: post.title,
      content: post.content,
      isPinned: post.isPinned,
      status: post.status,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: post.author,
      category: post.category,
      isAuthor: post.authorId === auth.user.id,
      replies: replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        status: reply.status,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
        author: reply.author,
        isAuthor: reply.authorId === auth.user.id,
      })),
    })
  } catch (error) {
    logError(error, { endpoint: 'GET /api/forums/[id]' })
    return internalError('Failed to fetch forum post')
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = await rateLimit(request, 'forums-reply', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const { auth, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const userIsAdmin = isAdmin(auth.user.role)

    // Verify parent post exists
    const parentPost = await prisma.forumPost.findFirst({
      where: { id, deletedAt: null, parentId: null },
    })

    if (!parentPost) {
      return notFoundError('Forum post')
    }

    const { data: body, error: bodyError } = await validateBody(request, replySchema)
    if (bodyError) return bodyError

    const sanitizedContent = sanitizeHtml(body.content)

    const reply = await prisma.forumPost.create({
      data: {
        content: sanitizedContent,
        parentId: id,
        categoryId: parentPost.categoryId,
        authorId: auth.user.id,
        status: userIsAdmin ? 'APPROVED' : 'PENDING',
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    })

    return successResponse(
      {
        id: reply.id,
        content: reply.content,
        status: reply.status,
        createdAt: reply.createdAt.toISOString(),
        author: reply.author,
        isAuthor: true,
      },
      undefined,
      HttpStatus.CREATED
    )
  } catch (error) {
    logError(error, { endpoint: 'POST /api/forums/[id]' })
    return internalError('Failed to create reply')
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = await rateLimit(request, 'forums-edit', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const { auth, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const userIsAdmin = isAdmin(auth.user.role)

    const post = await prisma.forumPost.findFirst({
      where: { id, deletedAt: null },
    })

    if (!post) {
      return notFoundError('Forum post')
    }

    if (post.authorId !== auth.user.id && !userIsAdmin) {
      return forbiddenError('You can only edit your own posts')
    }

    const { data: body, error: bodyError } = await validateBody(request, updateSchema)
    if (bodyError) return bodyError

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = sanitizeTitle(body.title)
    if (body.content !== undefined) updateData.content = sanitizeHtml(body.content)

    const updated = await prisma.forumPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    })

    return successResponse({
      id: updated.id,
      title: updated.title,
      content: updated.content,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
      author: updated.author,
    })
  } catch (error) {
    logError(error, { endpoint: 'PATCH /api/forums/[id]' })
    return internalError('Failed to update forum post')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, 'forums-delete', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const { auth, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const userIsAdmin = isAdmin(auth.user.role)

    const post = await prisma.forumPost.findFirst({
      where: { id, deletedAt: null },
    })

    if (!post) {
      return notFoundError('Forum post')
    }

    if (post.authorId !== auth.user.id && !userIsAdmin) {
      return forbiddenError('You can only delete your own posts')
    }

    // Soft delete
    await prisma.forumPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return successResponse({ message: 'Post deleted successfully' })
  } catch (error) {
    logError(error, { endpoint: 'DELETE /api/forums/[id]' })
    return internalError('Failed to delete forum post')
  }
}
