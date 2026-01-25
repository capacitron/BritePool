import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/api-utils'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { randomUUID } from 'crypto'

const RESEND_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000, // 15 minutes
}

export async function POST(request: NextRequest) {
  // Rate limit resend attempts
  const rateLimitResult = await rateLimit(request, 'resend-verification', RESEND_RATE_LIMIT)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      })
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Your email is already verified. You can log in.',
      })
    }

    // Invalidate any existing tokens
    await prisma.emailVerificationToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    })

    // Create new token
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, user.name, token)
    if (!emailResult.success) {
      console.error('[ResendVerification] Email failed:', emailResult.error || 'Unknown error')
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.',
    })
  } catch (error) {
    logError(error, { action: 'resend_verification' })
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
