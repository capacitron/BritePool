import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, canAssignRole } from '@/lib/auth-utils'
import { logError } from '@/lib/api-utils'
import { logUserUpdated, logUserSuspended } from '@/lib/audit'
import type { UserRole, UserStatus, SubscriptionTier, SubscriptionStatus } from '@prisma/client'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z
    .enum([
      'WEB_STEWARD',
      'BOARD_CHAIR',
      'COMMITTEE_LEADER',
      'CONTENT_MODERATOR',
      'SUPPORT_STAFF',
      'STEWARD',
      'PARTNER',
      'RESIDENT',
    ])
    .optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
  subscriptionTier: z.enum(['FREE', 'BASIC', 'PREMIUM', 'PLATINUM']).optional(),
  subscriptionStatus: z.enum(['ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED']).optional(),
  referredById: z.string().nullable().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole

    if (!hasPermission(userRole, 'viewUsers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        covenantAcceptedAt: true,
        covenantVersion: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        profile: true,
        referredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        referrals: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' as const },
        },
        financialScreening: {
          select: {
            totalScore: true,
            tier: true,
            flagLevel: true,
            suggestedEntryCap: true,
            adminOverride: true,
            adminNotes: true,
            internalReviewRequired: true,
            financialRhythm: true,
            opportunityApproach: true,
            timelineAlignment: true,
            responseToDelays: true,
            primaryIntentions: true,
            guidancePreference: true,
            createdAt: true,
          },
        },
        committees: {
          select: {
            id: true,
            role: true,
            committee: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' as const },
          take: 10,
        },
        eventRegistrations: {
          select: {
            id: true,
            event: {
              select: {
                id: true,
                title: true,
                startTime: true,
                type: true,
              },
            },
          },
          orderBy: { registeredAt: 'desc' as const },
          take: 10,
        },
        courseProgress: {
          select: {
            id: true,
            progress: true,
            isCompleted: true,
            course: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    logError(error, { action: 'admin_fetch_user' })
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    const currentUserId = session.user.id

    if (!hasPermission(userRole, 'editUsers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Prevent editing own role
    if (id === currentUserId) {
      return NextResponse.json(
        { error: 'You cannot edit your own account through this interface' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      name,
      role: newRole,
      status: newStatus,
      subscriptionTier: newTier,
      subscriptionStatus: newSubStatus,
      referredById: newReferredById,
    } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: {
      name?: string
      role?: UserRole
      status?: UserStatus
      subscriptionTier?: SubscriptionTier
      subscriptionStatus?: SubscriptionStatus
      referredById?: string | null
    } = {}

    if (name) {
      updateData.name = name
    }

    if (newReferredById !== undefined) {
      if (newReferredById === null || newReferredById === '') {
        updateData.referredById = null
      } else {
        if (newReferredById === id) {
          return NextResponse.json({ error: 'A user cannot refer themselves' }, { status: 400 })
        }
        const referrer = await prisma.user.findUnique({ where: { id: newReferredById } })
        if (!referrer) {
          return NextResponse.json({ error: 'Referrer user not found' }, { status: 404 })
        }
        updateData.referredById = newReferredById
      }
    }

    if (newRole && newRole !== existingUser.role) {
      // Check if user can assign this role
      if (!canAssignRole(userRole, newRole)) {
        return NextResponse.json({ error: 'You cannot assign this role' }, { status: 403 })
      }
      updateData.role = newRole
    }

    if (newStatus && newStatus !== existingUser.status) {
      // Only WEB_STEWARD and BOARD_CHAIR can change status
      if (!hasPermission(userRole, 'editUsers')) {
        return NextResponse.json({ error: 'You cannot change user status' }, { status: 403 })
      }
      updateData.status = newStatus
    }

    if (newTier && newTier !== existingUser.subscriptionTier) {
      updateData.subscriptionTier = newTier
    }

    if (newSubStatus && newSubStatus !== existingUser.subscriptionStatus) {
      updateData.subscriptionStatus = newSubStatus
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ user: existingUser, message: 'No changes detected' })
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    })

    // Create audit log entry
    const changes: Record<string, { old: unknown; new: unknown }> = {}
    if (updateData.name) {
      changes.name = { old: existingUser.name, new: updateData.name }
    }
    if (updateData.role) {
      changes.role = { old: existingUser.role, new: updateData.role }
    }
    if (updateData.status) {
      changes.status = { old: existingUser.status, new: updateData.status }
    }
    if (updateData.subscriptionTier) {
      changes.subscriptionTier = {
        old: existingUser.subscriptionTier,
        new: updateData.subscriptionTier,
      }
    }
    if (updateData.subscriptionStatus) {
      changes.subscriptionStatus = {
        old: existingUser.subscriptionStatus,
        new: updateData.subscriptionStatus,
      }
    }
    if (updateData.referredById !== undefined) {
      changes.referredBy = {
        old: existingUser.referredById || null,
        new: updateData.referredById,
      }
    }

    await logUserUpdated(currentUserId, userRole, id, existingUser.email, changes, request)

    return NextResponse.json({ user })
  } catch (error) {
    logError(error, { action: 'admin_update_user' })
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    const currentUserId = session.user.id

    if (!hasPermission(userRole, 'deleteUsers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Prevent deleting own account
    if (id === currentUserId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete by setting status to SUSPENDED
    // For actual deletion, use: await prisma.user.delete({ where: { id } });
    await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    })

    // Create audit log entry
    await logUserSuspended(currentUserId, userRole, id, existingUser.email, request)

    return NextResponse.json({ success: true, message: 'User suspended' })
  } catch (error) {
    logError(error, { action: 'admin_delete_user' })
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
