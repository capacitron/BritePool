import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour
const COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes between requests

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimit(request, 'forgot-password', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    })
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true, status: true },
    })

    if (!user || user.status === 'SUSPENDED' || user.status === 'LOCKED') {
      // Delay to prevent timing-based email enumeration
      await new Promise((resolve) => setTimeout(resolve, 150))
      return NextResponse.json({
        message: 'If an account with that email exists, we sent a password reset link.',
      })
    }

    // Check if there's already a valid, unused token that was recently created.
    // If so, DON'T invalidate it — just tell the user to check their email.
    // This prevents the "clicked try again and killed my own token" problem.
    const existingToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (existingToken) {
      const tokenAge = Date.now() - existingToken.createdAt.getTime()
      if (tokenAge < COOLDOWN_MS) {
        // Token was just created — don't send another email, tell user to check inbox
        return NextResponse.json({
          message: 'A reset link was recently sent. Please check your email (including spam folder).',
        })
      }
    }

    // Invalidate old tokens only now that we're creating a fresh one
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    })

    // Create new token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Send email — await it so we know if it actually worked
    const emailResult = await sendPasswordResetEmail(user.email, user.name, token)

    if (!emailResult.success) {
      console.error('[ForgotPassword] Email delivery failed:', {
        userId: user.id,
        error: emailResult.error,
        mock: emailResult.mock,
      })

      // If the email system is misconfigured (no API key), tell the user
      if (emailResult.mock) {
        return NextResponse.json(
          { error: 'Email service is not configured. Please contact support.' },
          { status: 503 }
        )
      }

      // If the Resend API rejected it, still tell the user something went wrong
      return NextResponse.json(
        { error: 'Failed to send the reset email. Please try again in a few minutes.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      message: 'If an account with that email exists, we sent a password reset link.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
