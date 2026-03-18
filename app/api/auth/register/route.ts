import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/api-utils'
import { registerSchema } from '@/lib/validations/auth'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'register', RateLimitConfigs.register)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await request.json()

    // Extract referrer separately (not in registerSchema)
    const referrer = typeof body.referrer === 'string' ? body.referrer : undefined

    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, username, password } = parsed.data
    const normalizedEmail = email.toLowerCase()
    const normalizedUsername = username && username.length >= 3 ? username : undefined

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    if (normalizedUsername) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: { equals: normalizedUsername, mode: 'insensitive' },
        },
        select: { id: true },
      })
      if (existingUsername) {
        return NextResponse.json(
          {
            error: 'Username already taken',
            details: { fieldErrors: { username: 'This username is already taken' } },
          },
          { status: 409 }
        )
      }
    }

    // Look up referrer by username
    let referredById: string | undefined
    if (referrer) {
      const referrerUser = await prisma.user.findFirst({
        where: { username: { equals: referrer, mode: 'insensitive' } },
        select: { id: true },
      })
      if (referrerUser) {
        referredById = referrerUser.id
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        username: normalizedUsername || undefined,
        passwordHash,
        role: 'STEWARD',
        status: 'ACTIVE',
        referredById: referredById || undefined,
        emailVerified: new Date(),
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

    return NextResponse.json(
      { success: true, message: 'Account created successfully.' },
      { status: 201 }
    )
  } catch (error) {
    logError(error, { action: 'user_registration' })
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 })
  }
}
