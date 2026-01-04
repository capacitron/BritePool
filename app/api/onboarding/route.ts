import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/api-utils'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        profile: {
          select: {
            bio: true,
            phone: true,
            location: true,
            timezone: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      onboardingCompleted: user.onboardingCompleted,
      onboardingStep: user.onboardingStep,
      profile: user.profile,
    })
  } catch (error) {
    logError(error, { action: 'fetch_onboarding_status' })
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { step, name, profile, interests } = body

    const updateData: Record<string, unknown> = {
      onboardingStep: step,
    }

    // Update name if provided
    if (name && typeof name === 'string' && name.trim()) {
      updateData.name = name.trim()
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    if (profile) {
      await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        update: {
          bio: profile.bio || undefined,
          phone: profile.phone || undefined,
          location: profile.location || undefined,
          timezone: profile.timezone || undefined,
        },
        create: {
          userId: session.user.id,
          bio: profile.bio || null,
          phone: profile.phone || null,
          location: profile.location || null,
          timezone: profile.timezone || 'UTC',
        },
      })
    }

    if (interests) {
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!existingProfile) {
        await prisma.userProfile.create({
          data: {
            userId: session.user.id,
          },
        })
      }

      if (interests.committees && interests.committees.length > 0) {
        for (const committeeType of interests.committees) {
          const committee = await prisma.committee.findFirst({
            where: { type: committeeType },
          })

          if (committee) {
            await prisma.committeeMember.upsert({
              where: {
                userId_committeeId: {
                  userId: session.user.id,
                  committeeId: committee.id,
                },
              },
              update: {},
              create: {
                userId: session.user.id,
                committeeId: committee.id,
                role: 'MEMBER',
              },
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true, step })
  } catch (error) {
    logError(error, { action: 'save_onboarding_progress' })
    return NextResponse.json({ error: 'Failed to save onboarding progress' }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleted: true,
        onboardingStep: 4,
      },
    })

    return NextResponse.json({ success: true, onboardingCompleted: true })
  } catch (error) {
    logError(error, { action: 'complete_onboarding' })
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
  }
}
