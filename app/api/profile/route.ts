import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  timezone: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        covenantAcceptedAt: true,
        covenantVersion: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: {
            id: true,
            bio: true,
            phone: true,
            location: true,
            timezone: true,
            language: true,
            totalEquityUnits: true,
            totalHoursLogged: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, bio, phone, location, timezone, language } = parsed.data

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name

    const profileUpdateData: Record<string, unknown> = {}
    if (bio !== undefined) profileUpdateData.bio = bio
    if (phone !== undefined) profileUpdateData.phone = phone
    if (location !== undefined) profileUpdateData.location = location
    if (timezone !== undefined) profileUpdateData.timezone = timezone
    if (language !== undefined) profileUpdateData.language = language

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...updateData,
        profile: {
          upsert: {
            create: profileUpdateData,
            update: profileUpdateData,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profile: {
          select: {
            bio: true,
            phone: true,
            location: true,
            timezone: true,
            language: true,
          },
        },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
