import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/auth-utils'
import { logError } from '@/lib/api-utils'
import type { UserRole } from '@prisma/client'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole

    if (!hasPermission(userRole, 'editUsers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, loginAttempts: true, lockedUntil: true, status: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.user.update({
      where: { id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        status: user.status === 'LOCKED' ? 'ACTIVE' : user.status,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Account unlocked for ${user.email}. Login attempts reset.`,
    })
  } catch (error) {
    logError(error, { action: 'admin_unlock_user' })
    return NextResponse.json({ error: 'Failed to unlock user account' }, { status: 500 })
  }
}
