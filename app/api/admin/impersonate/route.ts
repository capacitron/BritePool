import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit'
import { COOKIE_NAME } from '@/lib/impersonation'

export const runtime = 'nodejs'

// Start impersonation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 })
    }

    // Verify target user exists and is not a WEB_STEWARD
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.role === 'WEB_STEWARD') {
      return NextResponse.json({ error: 'Cannot impersonate a Web Steward' }, { status: 403 })
    }

    // Set the impersonation cookie
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, userId, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60, // 1 hour max
    })

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: 'IMPERSONATION_START',
      resourceType: 'USER',
      resourceId: targetUser.id,
      description: `Started impersonating ${targetUser.name || targetUser.email}`,
      metadata: {
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({
      success: true,
      impersonating: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    })
  } catch (error) {
    logError(error, { action: 'start_impersonation' })
    return NextResponse.json({ error: 'Failed to start impersonation' }, { status: 500 })
  }
}

// Stop impersonation
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const cookieStore = await cookies()
    const impersonatingId = cookieStore.get(COOKIE_NAME)?.value

    // Clear the cookie
    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    })

    // Audit log
    if (impersonatingId) {
      await createAuditLog({
        userId: session.user.id,
        userRole: session.user.role,
        action: 'IMPERSONATION_END',
        resourceType: 'USER',
        resourceId: impersonatingId,
        description: `Stopped impersonating user ${impersonatingId}`,
        metadata: { targetUserId: impersonatingId },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error, { action: 'stop_impersonation' })
    return NextResponse.json({ error: 'Failed to stop impersonation' }, { status: 500 })
  }
}
