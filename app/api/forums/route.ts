import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  requireAuth,
  successResponse,
  internalError,
  logError,
  validateBody,
  validateQuery,
  HttpStatus,
} from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { isAdmin } from '@/lib/auth/roles'
import { sanitizeHtml, sanitizeTitle } from '@/lib/sanitize'
import type { Prisma } from '@prisma/client'

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  categorySlug: z.string().optional(),
  search: z.string().optional(),
})

const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(10000),
  categoryId: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, 'forums', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const { auth, error: authError } = await requireAuth()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const { data: query, error: queryError } = validateQuery(searchParams, querySchema)
    if (queryError) return queryError

    const { page, limit, categorySlug, search } = query
    const skip = (page - 1) * limit
    const userIsAdmin = isAdmin(auth.user.role)

    // Build where clause: top-level posts only, not deleted
    const where: Prisma.ForumPostWhereInput = {
      parentId: null,
      deletedAt: null,
    }

    // Non-admins see APPROVED posts + their own PENDING posts
    if (!userIsAdmin) {
      where.OR = [{ status: 'APPROVED' }, { status: 'PENDING', authorId: auth.user.id }]
    }

    // Category filter
    if (categorySlug) {
      const category = await prisma.forumCategory.findUnique({
        where: { slug: categorySlug },
      })
      if (category) {
        where.categoryId = category.id
      }
    }

    // Search filter
    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: {
              replies: {
                where: { deletedAt: null, status: 'APPROVED' },
              },
            },
          },
        },
      }),
      prisma.forumPost.count({ where }),
    ])

    const data = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      isPinned: post.isPinned,
      status: post.status,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: post.author,
      category: post.category,
      replyCount: post._count.replies,
      isAuthor: post.authorId === auth.user.id,
    }))

    return successResponse(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    logError(error, { endpoint: 'GET /api/forums' })
    return internalError('Failed to fetch forum posts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, 'forums-create', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const { auth, error: authError } = await requireAuth()
    if (authError) return authError

    const { data: body, error: bodyError } = await validateBody(request, createPostSchema)
    if (bodyError) return bodyError

    const { categoryId } = body
    const title = sanitizeTitle(body.title)
    const content = sanitizeHtml(body.content)
    const userIsAdmin = isAdmin(auth.user.role)

    // Verify category exists
    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId },
    })
    if (!category) {
      return internalError('Invalid category')
    }

    const post = await prisma.forumPost.create({
      data: {
        title,
        content,
        categoryId,
        authorId: auth.user.id,
        status: userIsAdmin ? 'APPROVED' : 'PENDING',
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

    return successResponse(
      {
        id: post.id,
        title: post.title,
        content: post.content,
        status: post.status,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
        category: post.category,
      },
      undefined,
      HttpStatus.CREATED
    )
  } catch (error) {
    logError(error, { endpoint: 'POST /api/forums' })
    return internalError('Failed to create forum post')
  }
}
