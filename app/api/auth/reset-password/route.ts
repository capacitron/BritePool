import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { hashPassword } from '@/lib/auth-utils'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, 'reset-password', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    })
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()

    // Validate input
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path[0],
        message: issue.message,
      }))
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 })
    }

    const { token, password } = parsed.data

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true, status: true },
        },
      },
    })

    // Check if token is valid - use consistent error message to prevent token enumeration
    const invalidTokenError = { error: 'Invalid or expired reset link. Please request a new one.' }

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json(invalidTokenError, { status: 400 })
    }

    if (resetToken.user.status === 'SUSPENDED' || resetToken.user.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Your account is not active. Please contact support.' },
        { status: 403 }
      )
    }

    // Hash the new password
    const passwordHash = await hashPassword(password)

    // Update user password and mark token as used in a transaction
    // Also clear any account lockout (see lib/auth/lockout.ts for lockout config)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          loginAttempts: 0, // Clear failed login attempts
          lockedUntil: null, // Clear lockout - allows immediate login after password reset
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      message: 'Your password has been reset successfully. You can now sign in.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
