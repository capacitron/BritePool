import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/auth-utils'
import { logError } from '@/lib/api-utils'
import { sendWelcomeEmail } from '@/lib/email'
import type { UserRole } from '@prisma/client'
import crypto from 'crypto'

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
      select: { id: true, email: true, name: true, status: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate a random temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex') + 'A1!'
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    // Reset password, clear lockout, and reactivate if locked
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        loginAttempts: 0,
        lockedUntil: null,
        status: user.status === 'LOCKED' ? 'ACTIVE' : user.status,
      },
    })

    // Invalidate any existing password reset tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: id, usedAt: null },
      data: { usedAt: new Date() },
    })

    // Send email with temporary password
    await sendWelcomeEmail(user.email, user.name, tempPassword)

    return NextResponse.json({
      success: true,
      message: `Password reset for ${user.email}. A temporary password has been emailed to them.`,
    })
  } catch (error) {
    logError(error, { action: 'admin_reset_user_password' })
    return NextResponse.json({ error: 'Failed to reset user password' }, { status: 500 })
  }
}
