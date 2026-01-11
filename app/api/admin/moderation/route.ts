import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/auth-utils'
import { moderationQuerySchema } from '@/lib/validations'
import {
  validateQuery,
  successResponse,
  forbiddenError,
  internalError,
  logError,
  requireAuth,
} from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import type { ContentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, 'admin-moderation', RateLimitConfigs.admin)
  if (rateLimitResponse) return rateLimitResponse

  // Auth check
  const { auth, error: authError } = await requireAuth()
  if (authError) return authError

  // Permission check
  if (!hasPermission(auth.user.role, 'viewModeration')) {
    return forbiddenError('You do not have permission to view moderation queue')
  }

  // Validate query params
  const { searchParams } = new URL(request.url)
  const { data: query, error: queryError } = validateQuery(searchParams, moderationQuerySchema)
  if (queryError) return queryError

  try {
    const { page, limit, type, status } = query
    const skip = (page - 1) * limit
    const contentStatus = status as ContentStatus

    // Fetch forum posts
    const [forumPosts, forumTotal] =
      type === 'media'
        ? [[], 0]
        : await Promise.all([
            prisma.forumPost.findMany({
              where: { status: contentStatus },
              select: {
                id: true,
                title: true,
                content: true,
                status: true,
                createdAt: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
              skip: type === 'all' ? 0 : skip,
              take: type === 'all' ? 50 : limit,
            }),
            prisma.forumPost.count({ where: { status: contentStatus } }),
          ])

    // Fetch media items
    const [mediaItems, mediaTotal] =
      type === 'forum_post'
        ? [[], 0]
        : await Promise.all([
            prisma.mediaItem.findMany({
              where: { status: contentStatus },
              select: {
                id: true,
                filename: true,
                url: true,
                thumbnailUrl: true,
                type: true,
                category: true,
                status: true,
                createdAt: true,
                uploadedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
              skip: type === 'all' ? 0 : skip,
              take: type === 'all' ? 50 : limit,
            }),
            prisma.mediaItem.count({ where: { status: contentStatus } }),
          ])

    // Transform data for unified response
    const items = [
      ...forumPosts.map((post) => ({
        id: post.id,
        type: 'forum' as const,
        title: post.title || 'Untitled Post',
        preview: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
        status: post.status,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
      })),
      ...mediaItems.map((item) => ({
        id: item.id,
        type: 'media' as const,
        title: item.filename,
        preview: item.thumbnailUrl,
        mediaType: item.type,
        category: item.category,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        author: item.uploadedBy,
      })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const totalItems =
      type === 'all' ? forumTotal + mediaTotal : type === 'forum_post' ? forumTotal : mediaTotal

    return successResponse(
      {
        items: type === 'all' ? items.slice(skip, skip + limit) : items,
        counts: {
          forum: forumTotal,
          media: mediaTotal,
          total: forumTotal + mediaTotal,
        },
      },
      {
        page,
        limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      }
    )
  } catch (error) {
    logError(error, { endpoint: 'GET /api/admin/moderation' })
    return internalError('Failed to fetch moderation queue')
  }
}
