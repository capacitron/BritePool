import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { enrollCommitteesSchema } from '@/lib/validations/committee'

// Batch enroll user into multiple committees
// Used after profile questionnaire completion
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = enrollCommitteesSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { committeeIds } = parsed.data

    // Verify all committee IDs are valid
    const committees = await prisma.committee.findMany({
      where: {
        id: { in: committeeIds },
      },
      select: { id: true, name: true },
    })

    if (committees.length !== committeeIds.length) {
      return NextResponse.json({ error: 'One or more committee IDs are invalid' }, { status: 400 })
    }

    // Get existing memberships
    const existingMemberships = await prisma.committeeMember.findMany({
      where: {
        userId: session.user.id,
        committeeId: { in: committeeIds },
      },
      select: { committeeId: true },
    })

    const existingIds = new Set(existingMemberships.map((m) => m.committeeId))
    const newCommitteeIds = committeeIds.filter((id) => !existingIds.has(id))

    // Create new memberships
    if (newCommitteeIds.length > 0) {
      await prisma.committeeMember.createMany({
        data: newCommitteeIds.map((committeeId) => ({
          userId: session.user.id,
          committeeId,
          role: 'MEMBER',
        })),
        skipDuplicates: true,
      })
    }

    // Mark user's onboarding as completed if they selected committees
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleted: true,
        onboardingStep: 5, // Final step
      },
    })

    // Get updated memberships with committee details
    const memberships = await prisma.committeeMember.findMany({
      where: {
        userId: session.user.id,
        committeeId: { in: committeeIds },
      },
      include: {
        committee: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Successfully enrolled in committees',
        enrolled: memberships.length,
        alreadyMember: existingMemberships.length,
        committees: memberships.map((m) => m.committee),
      },
      { status: 201 }
    )
  } catch (error) {
    logError(error, { action: 'enroll_committees' })
    return NextResponse.json({ error: 'Failed to enroll in committees' }, { status: 500 })
  }
}

// Get user's current committee enrollments
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.committeeMember.findMany({
      where: { userId: session.user.id },
      include: {
        committee: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            description: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json({
      committees: memberships.map((m) => ({
        ...m.committee,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    })
  } catch (error) {
    logError(error, { action: 'fetch_enrollments' })
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}
