import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/auth-utils'
import {
  validateBody,
  successResponse,
  forbiddenError,
  notFoundError,
  validationError,
  internalError,
  logError,
  requireAuth,
} from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { logContentRejected } from '@/lib/audit'
import { sendContentRejectedEmail } from '@/lib/email'

const rejectSchema = z.object({
  type: z.enum(['forum', 'media'], { message: 'Content type is required (forum or media)' }),
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Reason must be less than 1000 characters'),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, 'admin-reject', RateLimitConfigs.admin)
  if (rateLimitResponse) return rateLimitResponse

  // Auth check
  const { auth, error: authError } = await requireAuth()
  if (authError) return authError

  // Permission check
  if (!hasPermission(auth.user.role, 'approveContent')) {
    return forbiddenError('You do not have permission to reject content')
  }

  // Validate ID parameter
  const { id } = await params
  if (!id || typeof id !== 'string') {
    return validationError({ id: ['Invalid content ID'] })
  }

  // Validate request body
  const { data, error: validationErr } = await validateBody(request, rejectSchema)
  if (validationErr) return validationErr

  const { type, reason } = data
  const userId = auth.user.id

  try {
    let contentAuthor: { email: string; name: string } | null = null
    let contentTitle: string = ''

    if (type === 'forum') {
      const post = await prisma.forumPost.findUnique({
        where: { id },
        include: { author: { select: { email: true, name: true } } },
      })

      if (!post) {
        return notFoundError('Forum post')
      }

      await prisma.forumPost.update({
        where: { id },
        data: {
          status: 'REJECTED',
          moderatedById: userId,
          moderatedAt: new Date(),
          moderationNote: reason,
        },
      })

      contentAuthor = post.author
      contentTitle = post.title || 'Your post'
    } else {
      const media = await prisma.mediaItem.findUnique({
        where: { id },
        include: { uploadedBy: { select: { email: true, name: true } } },
      })

      if (!media) {
        return notFoundError('Media item')
      }

      await prisma.mediaItem.update({
        where: { id },
        data: {
          status: 'REJECTED',
          moderatedById: userId,
          moderatedAt: new Date(),
          moderationNote: reason,
        },
      })

      contentAuthor = media.uploadedBy
      contentTitle = media.filename
    }

    // Create audit log entry
    await logContentRejected(
      auth.user.id,
      auth.user.role,
      type === 'forum' ? 'FORUM_POST' : 'MEDIA',
      id,
      reason,
      request
    )

    // Send notification to content author (non-blocking)
    if (contentAuthor) {
      sendContentRejectedEmail(
        contentAuthor.email,
        contentAuthor.name,
        type === 'forum' ? 'forum post' : 'media upload',
        contentTitle,
        reason
      ).catch((err) => {
        logError(err, { context: 'sending rejection email', contentId: id })
      })
    }

    return successResponse({ message: 'Content rejected' })
  } catch (error) {
    logError(error, { endpoint: 'POST /api/admin/moderation/[id]/reject', contentId: id })
    return internalError('Failed to reject content')
  }
}
