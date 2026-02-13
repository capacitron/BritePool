import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimit(request, 'reset-password', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    })
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()

    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path[0],
        message: issue.message,
      }))
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 })
    }

    const { token, password } = parsed.data

    // Look up the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true, status: true },
        },
      },
    })

    // Token doesn't exist at all
    if (!resetToken) {
      return NextResponse.json(
        { error: 'This reset link is invalid. Please request a new password reset.' },
        { status: 400 }
      )
    }

    // Token was already used (either by user or invalidated by a newer request)
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'This reset link has already been used. Please request a new password reset.' },
        { status: 400 }
      )
    }

    // Token has expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new password reset.' },
        { status: 400 }
      )
    }

    // Account is suspended or locked
    if (resetToken.user.status === 'SUSPENDED' || resetToken.user.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Your account is not active. Please contact support.' },
        { status: 403 }
      )
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update password, clear lockout, mark token used — all in one transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          loginAttempts: 0,
          lockedUntil: null,
          // If account was pending verification, password reset proves email ownership
          ...(resetToken.user.status === 'PENDING_VERIFICATION' && {
            emailVerified: new Date(),
            status: 'ACTIVE' as const,
          }),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
