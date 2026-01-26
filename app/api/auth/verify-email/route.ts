import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/api-utils'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, 'verify-email', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
    })
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const token = body.token

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    // Find the token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    // Use consistent error message for all token-related errors
    const invalidTokenError = { error: 'Invalid or expired verification token' }

    if (!verificationToken) {
      return NextResponse.json(invalidTokenError, { status: 400 })
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json(invalidTokenError, { status: 400 })
    }

    // Check if token was already used
    if (verificationToken.usedAt) {
      return NextResponse.json(invalidTokenError, { status: 400 })
    }

    // Update user and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerified: new Date(),
          status: 'ACTIVE',
        },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    })
  } catch (error) {
    logError(error, { action: 'email_verification' })
    return NextResponse.json({ error: 'An error occurred during verification' }, { status: 500 })
  }
}
