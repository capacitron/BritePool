import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/api-utils'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingStep: true,
        onboardingCompleted: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      onboardingStep: user.onboardingStep,
      onboardingCompleted: user.onboardingCompleted,
    })
  } catch (error) {
    logError(error, { action: 'fetch_onboarding_status' })
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 })
  }
}
