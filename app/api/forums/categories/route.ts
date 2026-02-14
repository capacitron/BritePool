import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAuth,
  successResponse,
  internalError,
  logError,
} from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, 'forums-categories', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const { error: authError } = await requireAuth()
    if (authError) return authError

    const categories = await prisma.forumCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: 'APPROVED',
                deletedAt: null,
                parentId: null,
              },
            },
          },
        },
      },
    })

    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      postCount: cat._count.posts,
    }))

    return successResponse(data)
  } catch (error) {
    logError(error, { endpoint: 'GET /api/forums/categories' })
    return internalError('Failed to fetch forum categories')
  }
}
