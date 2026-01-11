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
import { logContentApproved } from '@/lib/audit'
import { sendContentApprovedEmail } from '@/lib/email'

const approveSchema = z.object({
  type: z.enum(['forum', 'media'], { message: 'Content type is required (forum or media)' }),
  note: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, 'admin-approve', RateLimitConfigs.admin)
  if (rateLimitResponse) return rateLimitResponse

  // Auth check
  const { auth, error: authError } = await requireAuth()
  if (authError) return authError

  // Permission check
  if (!hasPermission(auth.user.role, 'approveContent')) {
    return forbiddenError('You do not have permission to approve content')
  }

  // Validate ID parameter
  const { id } = await params
  if (!id || typeof id !== 'string') {
    return validationError({ id: ['Invalid content ID'] })
  }

  // Validate request body
  const { data, error: validationErr } = await validateBody(request, approveSchema)
  if (validationErr) return validationErr

  const { type, note } = data
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
          status: 'APPROVED',
          moderatedById: userId,
          moderatedAt: new Date(),
          moderationNote: note || null,
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
          status: 'APPROVED',
          moderatedById: userId,
          moderatedAt: new Date(),
          moderationNote: note || null,
        },
      })

      contentAuthor = media.uploadedBy
      contentTitle = media.filename
    }

    // Create audit log entry
    await logContentApproved(
      auth.user.id,
      auth.user.role,
      type === 'forum' ? 'FORUM_POST' : 'MEDIA',
      id,
      request
    )

    // Send notification to content author (non-blocking)
    if (contentAuthor) {
      sendContentApprovedEmail(
        contentAuthor.email,
        contentAuthor.name,
        type === 'forum' ? 'forum post' : 'media upload',
        contentTitle
      ).catch((err) => {
        logError(err, { context: 'sending approval email', contentId: id })
      })
    }

    return successResponse({ message: 'Content approved successfully' })
  } catch (error) {
    logError(error, { endpoint: 'POST /api/admin/moderation/[id]/approve', contentId: id })
    return internalError('Failed to approve content')
  }
}
