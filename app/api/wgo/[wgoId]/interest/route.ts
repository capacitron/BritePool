import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getEffectiveUserId } from '@/lib/impersonation'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { createNotification } from '@/lib/notifications'
import { UserRole } from '@prisma/client'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, 'wgo-interest', RateLimitConfigs.submissions)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use effective user ID (impersonated user if admin is impersonating)
    const effectiveUserId = await getEffectiveUserId(session.user.id, session.user.role as UserRole)

    const { wgoId } = await params

    // Fetch the WGO title for the notification message
    const wgo = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId },
      select: { id: true, title: true },
    })

    if (!wgo) {
      return NextResponse.json({ error: 'Wealth opportunity not found' }, { status: 404 })
    }

    // Get current user's name and referrer
    const currentUser = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: { name: true, referredById: true },
    })

    if (!currentUser?.referredById) {
      return NextResponse.json(
        { error: 'You do not have a BritePool partner to notify' },
        { status: 400 }
      )
    }

    const referrerId = currentUser.referredById

    // Check for duplicate interest notification
    const existingNotifications = await prisma.notification.findMany({
      where: {
        userId: referrerId,
        type: 'WGO_UPDATE',
      },
      select: { id: true, metadata: true },
    })

    const alreadySent = existingNotifications.some((n) => {
      const meta = n.metadata as Record<string, unknown> | null
      return meta?.interestedUserId === effectiveUserId && meta?.wgoId === wgoId
    })

    if (alreadySent) {
      return NextResponse.json(
        { error: 'You have already notified your partner about this opportunity' },
        { status: 409 }
      )
    }

    // Send notification to the referrer
    const userName = currentUser.name || 'A member'
    await createNotification(
      referrerId,
      'WGO_UPDATE',
      `${userName} is interested in ${wgo.title}`,
      `${userName} has expressed interest in the "${wgo.title}" wealth opportunity and would like your help getting started.`,
      `/dashboard/wgo/${wgoId}`,
      {
        wgoTitle: wgo.title,
        interestedUserId: effectiveUserId,
        interestedUserName: userName,
        wgoId: wgoId,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error, { action: 'notify_wgo_interest' })
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
