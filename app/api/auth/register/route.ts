import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/api-utils'
import { registerSchema } from '@/lib/validations/auth'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  // Rate limit registration attempts
  const rateLimitResult = await rateLimit(request, 'register', RateLimitConfigs.register)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data
    const normalizedEmail = email.toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: 'STEWARD',
        status: 'PENDING_VERIFICATION',
        subscriptionTier: 'FREE',
        subscriptionStatus: 'INACTIVE',
        profile: {
          create: {
            totalEquityUnits: 0,
            totalHoursLogged: 0,
          },
        },
      },
    })

    // Create email verification token
    const verificationToken = randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: tokenExpiresAt,
      },
    })

    // Send verification email
    await sendVerificationEmail(normalizedEmail, name, verificationToken)

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    logError(error, { action: 'user_registration' })
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 })
  }
}
