import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per hour)
    const rateLimitResponse = await rateLimit(request, 'forgot-password', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    })
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()

    // Validate input
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data

    // Always return success to prevent email enumeration
    // but only send email if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true, status: true },
    })

    if (user && user.status !== 'SUSPENDED' && user.status !== 'LOCKED') {
      // Invalidate any existing tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(), // Mark as used to invalidate
        },
      })

      // Generate new token
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      })

      // Send email (async, don't block response)
      sendPasswordResetEmail(user.email, user.name, token).catch((err) => {
        console.error('Failed to send password reset email:', err)
      })
    } else {
      // Add artificial delay for non-existent users to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Always return success (don't reveal if email exists)
    return NextResponse.json({
      message: 'If an account with that email exists, we sent a password reset link.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
